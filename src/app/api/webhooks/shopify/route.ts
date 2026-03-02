import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  verifyWebhookSignature,
  incrementPreOrderSold,
  SHOPIFY_WEBHOOK_TOPICS,
  type ShopifyOrder,
  type ShopifyProduct,
} from '@/lib/shopify-webhooks';
import { createDiscountCode } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

// ── Handlers ────────────────────────────────────────────────────────

async function handleOrderCreated(
  order: ShopifyOrder,
  kv: KVNamespace,
  adminToken: string | undefined,
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

  // Auto-increment pre_order_sold metafield for each product in the order
  if (adminToken) {
    for (const item of order.line_items) {
      await incrementPreOrderSold(item.product_id, item.quantity, adminToken);
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
) {
  // Check if order used a referral code (via cart attributes or discount codes)
  const referralAttr = order.note_attributes?.find(
    (attr) => attr.name === '_referral_code',
  );
  const referralCode = referralAttr?.value;

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

  // Create a reward discount code for the referrer (£5 off their next order)
  const rewardCode = `JCS-REWARD-${referral.referrer_code.split('-').pop()}-${Date.now().toString(16).slice(-4).toUpperCase()}`;

  try {
    await createDiscountCode(rewardCode, adminToken);
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

  console.log(
    `[webhook] Referral conversion: order #${order.order_number} used code ${referralCode}, reward ${rewardCode} created for ${referral.referrer_email}`,
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

    // Parse payload
    const payload = JSON.parse(body);
    const kv = env.SITE_OPS as KVNamespace;

    // Log event for audit trail
    await kv.put(
      `webhook:log:${topic}:${Date.now()}`,
      JSON.stringify({ topic, received_at: new Date().toISOString() }),
      { expirationTtl: 60 * 60 * 24 * 7 }, // 7 days
    );

    // Route to handler
    const adminToken = env.SHOPIFY_ADMIN_API_TOKEN as string | undefined;
    const db = env.DB;

    switch (topic) {
      case SHOPIFY_WEBHOOK_TOPICS.ORDERS_CREATE:
        await handleOrderCreated(payload as ShopifyOrder, kv, adminToken);
        // Check for referral conversion
        if (adminToken) {
          await handleReferralConversion(payload as ShopifyOrder, db, kv, adminToken);
        }
        break;
      case SHOPIFY_WEBHOOK_TOPICS.ORDERS_FULFILLED:
        await handleOrderFulfilled(payload as ShopifyOrder, kv);
        break;
      case SHOPIFY_WEBHOOK_TOPICS.PRODUCTS_UPDATE:
        await handleProductUpdated(payload as ShopifyProduct, kv);
        break;
      default:
        console.log(`[webhook] Unhandled topic: ${topic}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Always return 200 to prevent Shopify retries on handler errors
    console.error('[webhook] Handler error:', error);
    return NextResponse.json({ success: true });
  }
}
