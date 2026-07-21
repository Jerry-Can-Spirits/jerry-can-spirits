import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as Sentry from '@sentry/nextjs';
import {
  verifyWebhookSignature,
  incrementBottlesSold,
  markOrderProcessed,
  SHOPIFY_WEBHOOK_TOPICS,
  type ShopifyOrder,
  type ShopifyProduct,
} from '@/lib/shopify-webhooks';
import { createDiscountCode, createReferrerRewardCode } from '@/lib/shopify-admin';
import { generateReferralCode } from '@/lib/shopify-admin';
import { sendGa4Purchase } from '@/lib/ga4-measurement-protocol';

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

async function fireKlaviyoEvent(
  klaviyoKey: string,
  eventName: string,
  email: string,
  properties: Record<string, unknown>,
  firstName?: string,
  orderNumber?: number,
): Promise<void> {
  const res = await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${klaviyoKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: KLAVIYO_REVISION,
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          properties,
          metric: { data: { type: 'metric', attributes: { name: eventName } } },
          profile: {
            data: {
              type: 'profile',
              attributes: { email, ...(firstName ? { first_name: firstName } : {}) },
            },
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[webhook] Klaviyo event failed — event:', eventName, '| order:', orderNumber ?? 'n/a', '| status:', res.status, '| response:', err);
  }
}

export const dynamic = 'force-dynamic';

// ── Handlers ────────────────────────────────────────────────────────

// Validate the orders/create payload shape BEFORE consuming the idempotency
// token, so a malformed order is rejected with a 400 (no Shopify retry, no token
// burned) rather than throwing mid-flight after the token is committed. Only the
// fields the handler dereferences are checked; optional GA4 fields are guarded at
// their own use sites.
function parseShopifyOrder(p: Record<string, unknown>): ShopifyOrder | null {
  if (typeof p.id !== 'number' || typeof p.order_number !== 'number') return null
  if (typeof p.created_at !== 'string') return null
  if (!Array.isArray(p.line_items) || p.line_items.length === 0) return null
  for (const li of p.line_items) {
    if (typeof li !== 'object' || li === null) return null
    const l = li as Record<string, unknown>
    if (typeof l.title !== 'string' || typeof l.quantity !== 'number' || typeof l.product_id !== 'number') {
      return null
    }
  }
  return p as unknown as ShopifyOrder
}

async function handleOrderCreated(
  order: ShopifyOrder,
  kv: KVNamespace,
  adminToken: string | undefined,
  db: D1Database,
  klaviyoKey: string | undefined,
) {
  // Only store genuine Jerry Can Spirits products with quantities
  const jcsItems = order.line_items
    .filter((li) =>
      li.title.toLowerCase().includes('jerry can') ||
      li.title.toLowerCase().includes('expedition')
    )
    .map((li) => ({ title: li.title, quantity: li.quantity }));

  if (jcsItems.length === 0) {
    console.warn(`[webhook] orders/create #${order.order_number} skipped — no JCS products`);
    return;
  }

  const bottleCount = jcsItems.reduce((sum, item) => sum + item.quantity, 0);

  const country =
    order.shipping_address?.country_code ||
    order.billing_address?.country_code ||
    'unknown';

  const timestamp = new Date(order.created_at).getTime();

  // Anonymised order data for social proof feed
  await kv.put(
    `order:recent:${timestamp}`,
    JSON.stringify({ titles: jcsItems.map((i) => i.title), bottleCount, country, timestamp }),
    { expirationTtl: 60 * 60 * 24 }, // 24 hours
  );

  // Auto-increment the bottles-sold metafield for each product in the order
  if (adminToken) {
    for (const item of order.line_items) {
      await incrementBottlesSold(item.product_id, item.quantity, adminToken);
    }
  }

  // Generate referral link for this buyer and fire Klaviyo event
  if (!klaviyoKey) {
    console.warn(`[webhook] KLAVIYO_PRIVATE_KEY not set — skipping Referral Link Generated event for order #${order.order_number}`);
  } else if (order.email) {
    try {
      const email = order.email.toLowerCase();
      let referralCode: string;

      const existing = await db
        .prepare('SELECT referrer_code FROM referrals WHERE referrer_email = ?')
        .bind(email)
        .first<{ referrer_code: string }>();

      if (existing) {
        referralCode = existing.referrer_code;
      } else {
        referralCode = generateReferralCode(email);
        if (adminToken) {
          await createDiscountCode(referralCode, adminToken);
        }
        await db
          .prepare('INSERT INTO referrals (referrer_email, referrer_code) VALUES (?, ?)')
          .bind(email, referralCode)
          .run();
        await kv.put(
          `referral:${referralCode}`,
          JSON.stringify({ email, code: referralCode, created_at: new Date().toISOString() }),
          { expirationTtl: 60 * 60 * 24 * 90 },
        );
      }

      const shareUrl = `https://jerrycanspirits.co.uk/refer/${referralCode}`;
      const firstName = order.customer?.first_name;

      await fireKlaviyoEvent(
        klaviyoKey,
        'Referral Link Generated',
        order.email,
        { share_url: shareUrl, referral_code: referralCode },
        firstName,
        order.order_number,
      );
    } catch (err) {
      console.error('[webhook] Referral link generation failed — order:', order.order_number, err);
      // non-blocking
    }
  }

  console.log(`[webhook] orders/create #${order.order_number} from ${country}`);
}

async function handleOrderFulfilled(order: ShopifyOrder, kv: KVNamespace) {
  await kv.put(
    `order:fulfilled:${order.id}`,
    JSON.stringify({
      order_number: order.order_number,
      fulfilled_at: new Date().toISOString(),
    }),
    { expirationTtl: 60 * 60 * 24 * 7 }, // 7 days
  );

  console.log(`[webhook] orders/fulfilled #${order.order_number}`);
}

async function handleProductUpdated(product: ShopifyProduct, kv: KVNamespace) {
  await kv.put(
    `product:updated:${product.handle}`,
    JSON.stringify({
      title: product.title,
      status: product.status,
      updated_at: product.updated_at,
    }),
  );

  // Invalidate the ISR cache so a price or availability change in Shopify
  // propagates immediately, instead of the product and collection pages
  // (revalidate = 3600) advertising a stale price for up to an hour — a
  // misleading-price exposure that is acute on planned price changes. The
  // payload doesn't tell us the product's collections, so revalidate the
  // product page plus every collection surface it could appear on. Best-effort:
  // a revalidation failure must not fail the webhook.
  try {
    revalidatePath(`/shop/product/${product.handle}`);
    revalidatePath('/shop/spirits');
    revalidatePath('/shop/barware');
    revalidatePath('/shop/clothing');
    revalidatePath('/shop/[collection]', 'page');
  } catch (err) {
    console.error('[webhook] revalidate failed for product %s:', product.handle, err);
  }

  console.log(`[webhook] products/update "${product.handle}"`);
}

// ── Referral Conversion ─────────────────────────────────────────────

interface ReferralRow {
  id: number;
  referrer_email: string;
  referrer_code: string;
}

async function handleReferralConversion(
  order: ShopifyOrder,
  db: D1Database,
  kv: KVNamespace,
  adminToken: string,
  klaviyoKey: string | undefined,
) {
  // Check if order used a referral code by looking at applied discount codes
  const referralCode = order.discount_codes?.find(
    (dc) => dc.code.startsWith('JCS-') && !dc.code.startsWith('JCS-REWARD-'),
  )?.code;

  if (!referralCode) return;

  // Look up the referral in D1
  const referral = await db
    .prepare('SELECT id, referrer_email, referrer_code FROM referrals WHERE referrer_code = ?')
    .bind(referralCode)
    .first<ReferralRow>();

  if (!referral) {
    console.warn(`[webhook] Referral code "${referralCode}" not found in D1`);
    return;
  }

  // Self-referral guard: don't reward the referrer for buying with their own
  // code (otherwise the scheme is farmable — pocket the referee discount and a
  // fresh reward code per order). Shopify does not normalise emails, so compare
  // trimmed and lower-cased ("Dan@" must not slip past "dan@").
  if (
    order.email &&
    order.email.trim().toLowerCase() === referral.referrer_email.trim().toLowerCase()
  ) {
    console.log(`[webhook] orders/create #${order.order_number} — self-referral, no reward minted`);
    return;
  }

  // Create a 10% reward code for the referrer (combinable with other discounts)
  const rewardCode = `JCS-REWARD-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  try {
    await createReferrerRewardCode(rewardCode, adminToken);
  } catch (error) {
    console.error(`[webhook] Failed to create reward discount for referrer: ${error}`);
    return;
  }

  // Record the conversion in D1
  await db
    .prepare(
      `INSERT INTO referral_conversions (referral_id, referee_email, order_id, reward_discount_code, status)
       VALUES (?, ?, ?, ?, 'completed')`,
    )
    .bind(referral.id, order.email || '', String(order.id), rewardCode)
    .run();

  // Increment the referral counters
  await db
    .prepare(
      'UPDATE referrals SET total_referrals = total_referrals + 1, total_rewards_earned = total_rewards_earned + 1 WHERE id = ?',
    )
    .bind(referral.id)
    .run();

  // Store the reward code in KV so we can later notify the referrer
  await kv.put(
    `referral:reward:${referral.referrer_email}:${Date.now()}`,
    JSON.stringify({
      reward_code: rewardCode,
      referee_order: order.order_number,
      created_at: new Date().toISOString(),
    }),
    { expirationTtl: 60 * 60 * 24 * 90 }, // 90 days
  );

  // Notify the referrer via Klaviyo
  if (!klaviyoKey) {
    console.warn(`[webhook] KLAVIYO_PRIVATE_KEY not set — skipping Referral Reward Earned event for order #${order.order_number}`);
  } else {
    await fireKlaviyoEvent(
      klaviyoKey,
      'Referral Reward Earned',
      referral.referrer_email,
      { reward_code: rewardCode, referee_order: order.order_number },
      undefined,
      order.order_number,
    );
  }

  // Order number + codes are enough to trace this; the referrer's email is
  // omitted so customer PII does not land in Worker logs (no redaction/retention).
  console.log(
    `[webhook] Referral conversion: order #${order.order_number} used code ${referralCode}, reward ${rewardCode} created`,
  );
}

// ── Route ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const secret = env.SHOPIFY_WEBHOOK_SECRET as string | undefined;

    if (!secret) {
      console.error('[webhook] SHOPIFY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    // Read headers
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const topic = request.headers.get('x-shopify-topic');

    if (!hmac || !topic) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 401 });
    }

    // Read body once for both verification and parsing
    const body = await request.text();

    // Verify HMAC signature
    const valid = await verifyWebhookSignature(body, hmac, secret);
    if (!valid) {
      console.warn('[webhook] Invalid HMAC signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse and validate payload shape before type assertion
    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error('[webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (typeof payload !== 'object' || payload === null) {
      console.error('[webhook] Payload is not an object');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const kv = env.SITE_OPS as KVNamespace;
    const p = payload as Record<string, unknown>;

    // Log event for audit trail. Include the Shopify resource ID so the
    // log is useful for "did we receive order #1234?" without re-fetching
    // from Shopify.
    const resourceId = typeof p.id === 'number' || typeof p.id === 'string' ? p.id : null;
    await kv.put(
      `webhook:log:${topic}:${Date.now()}`,
      JSON.stringify({ topic, resource_id: resourceId, received_at: new Date().toISOString() }),
      { expirationTtl: 60 * 60 * 24 * 7 }, // 7 days
    );

    // Route to handler
    const adminToken = env.SHOPIFY_ADMIN_API_TOKEN as string | undefined;
    const db = env.DB;

    const klaviyoKey = env.KLAVIYO_PRIVATE_KEY as string | undefined;

    switch (topic) {
      case SHOPIFY_WEBHOOK_TOPICS.ORDERS_CREATE: {
        const order = parseShopifyOrder(p);
        if (!order) {
          console.error('[webhook] orders/create payload failed validation');
          return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        // Idempotency guard — Shopify delivers at-least-once and retries on any
        // non-2xx. Record the order first; on a duplicate/retry, skip every
        // side effect below so we never mint a second reward code, re-increment
        // bottles-sold, or re-send Klaviyo emails. See markOrderProcessed.
        const firstDelivery = await markOrderProcessed(db, order.id);
        if (!firstDelivery) {
          console.log(`[webhook] orders/create #${order.order_number} already processed — skipping duplicate delivery`);
          break;
        }
        // The idempotency token is already committed above, so isolate these
        // side effects: a transient failure in a non-critical step (bottles-sold
        // Admin write, social-proof KV put) must not throw out and, via a retry
        // the guard then skips, strand the referral + GA4 purchase below.
        try {
          await handleOrderCreated(order, kv, adminToken, db, klaviyoKey);
        } catch (err) {
          console.error('[webhook] handleOrderCreated failed for order #%s (non-fatal):', order.order_number, err);
          Sentry.captureException(err, { tags: { source: 'shopify-webhook', phase: 'order-created' } });
        }
        if (adminToken) {
          // Non-fatal: a referral-conversion failure (e.g. a transient D1 write
          // after the reward code is already minted on Shopify) must not throw
          // out of the handler. If it did, the webhook would 500 → Shopify
          // retries → the idempotency guard skips everything, orphaning the live
          // reward code AND losing the GA4 purchase send below. Log and continue.
          try {
            await handleReferralConversion(order, db, kv, adminToken, klaviyoKey);
          } catch (err) {
            // Constant format string (order_number as an argument, not
            // interpolated) so the payload value can't act as a format specifier.
            console.error('[webhook] referral conversion failed for order #%s (non-fatal):', order.order_number, err);
            Sentry.captureException(err, { tags: { source: 'shopify-webhook', phase: 'referral-conversion' } });
          }
        }
        // Server-side GA4 purchase attribution. Never throws (a tracking
        // failure must not 500 the webhook); skips when the storefront did not
        // capture a client_id or consent was not granted. See ga4-measurement-protocol.ts.
        await sendGa4Purchase(
          order,
          env.GA4_MEASUREMENT_ID as string | undefined,
          env.GA4_API_SECRET as string | undefined,
        );
        break;
      }
      case SHOPIFY_WEBHOOK_TOPICS.ORDERS_FULFILLED: {
        if (typeof p.id !== 'number' || !Array.isArray(p.line_items)) {
          console.error('[webhook] orders/fulfilled payload missing required fields');
          return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        await handleOrderFulfilled(payload as ShopifyOrder, kv);
        break;
      }
      case SHOPIFY_WEBHOOK_TOPICS.PRODUCTS_UPDATE: {
        if (typeof p.id !== 'number' || typeof p.handle !== 'string') {
          console.error('[webhook] products/update payload missing required fields');
          return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }
        await handleProductUpdated(payload as ShopifyProduct, kv);
        break;
      }
      default:
        console.log(`[webhook] Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Return 500 so Shopify retries with backoff. Permanent malformed-payload
    // failures are already short-circuited above with explicit 400s, so a
    // throw here means a transient failure (Shopify API blip, KV write
    // hiccup, etc.) that we genuinely want retried. Sentry capture stays
    // for visibility.
    console.error('[webhook] Handler error:', error);
    Sentry.captureException(error, { tags: { source: 'shopify-webhook' } });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
