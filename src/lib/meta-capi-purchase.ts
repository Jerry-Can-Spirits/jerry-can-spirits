/**
 * Server-side Meta Conversions API Purchase send, fired from the Shopify
 * orders/create webhook. Mirrors ga4-measurement-protocol: the storefront stamps
 * the Meta identifiers (_fbp/_fbc) and the MARKETING-consent state onto the cart
 * (analytics-stitching.ts), which arrive on the order as note_attributes; this
 * reads them and sends a Purchase.
 *
 * Why it exists (Audit 5 #7): in Facebook/Instagram in-app browsers the client
 * Pixel frequently never fires, so purchases from the largest traffic segment
 * are invisible to Meta. This server-side leg fires from the webhook regardless
 * of the client, so a consented WebView purchase is still reported.
 *
 * Compliance: sends ONLY when marketing consent was granted at checkout (carried
 * as an attribute). No consent → no send. This recovers data without any consent
 * bypass. Never throws — a tracking failure must not fail the webhook.
 */
import type { ShopifyOrder } from './shopify-webhooks';
import {
  STITCH_FBP,
  STITCH_FBC,
  STITCH_MARKETING_CONSENT,
  CONSENT_GRANTED,
} from './analytics-stitch-keys';

// The same Pixel/dataset id as the client CAPI route (src/app/api/meta/events),
// so both legs report to one dataset. Kept in sync deliberately.
const META_PIXEL_ID = '825009767240821';
const META_GRAPH = 'https://graph.facebook.com/v19.0';

export type MetaPurchaseSkipReason =
  | 'not-configured'
  | 'consent-declined'
  | 'no-match-key'
  | 'send-failed';

function noteAttribute(order: ShopifyOrder, name: string): string | undefined {
  return order.note_attributes?.find((a) => a.name === name)?.value?.trim() || undefined;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sendMetaCapiPurchase(
  order: ShopifyOrder,
  accessToken: string | undefined,
  testCode?: string,
): Promise<{ sent: true } | { sent: false; reason: MetaPurchaseSkipReason }> {
  if (!accessToken) {
    console.warn(
      `[meta-capi] META_CAPI_ACCESS_TOKEN not configured — skipping purchase for order #${order.order_number}`,
    );
    return { sent: false, reason: 'not-configured' };
  }

  // Marketing consent is mandatory. Anything other than 'granted' (declined, or
  // the attribute missing on a manual/older order) does not send.
  if (noteAttribute(order, STITCH_MARKETING_CONSENT) !== CONSENT_GRANTED) {
    console.log(`[meta-capi] purchase skipped for order #${order.order_number}: consent-declined`);
    return { sent: false, reason: 'consent-declined' };
  }

  const fbp = noteAttribute(order, STITCH_FBP);
  const fbc = noteAttribute(order, STITCH_FBC);
  const email = order.email?.trim().toLowerCase();

  // Meta requires at least one matching key. Hashed email is the primary; the
  // Pixel cookies strengthen the match. With none, there is nothing to attribute.
  if (!email && !fbp && !fbc) {
    console.log(`[meta-capi] purchase skipped for order #${order.order_number}: no-match-key`);
    return { sent: false, reason: 'no-match-key' };
  }

  const userData: Record<string, unknown> = {};
  if (email) userData.em = [await sha256Hex(email)];
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  // value: item subtotal excluding shipping (post-discount), matching the GA4
  // purchase value so both platforms report the same revenue.
  const value = order.subtotal_price != null ? Number(order.subtotal_price) : undefined;

  const contents = order.line_items
    .filter((li) => li.variant_id != null)
    .map((li) => ({
      id: String(li.variant_id),
      quantity: li.quantity,
      ...(li.price != null && !Number.isNaN(Number(li.price)) ? { item_price: Number(li.price) } : {}),
    }));

  const customData: Record<string, unknown> = {
    currency: order.currency ?? 'GBP',
    content_type: 'product',
    content_ids: contents.map((c) => c.id),
    contents,
    num_items: order.line_items.reduce((sum, li) => sum + li.quantity, 0),
  };
  if (value !== undefined && !Number.isNaN(value)) customData.value = value;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        // Deterministic per order so Meta deduplicates this against any
        // Shopify-side Purchase (a checkout Pixel, or the Facebook channel's own
        // CAPI) that keys on the same order id. VERIFY in Events Manager that
        // Purchase is not double-counted — see README "Verifying no double-counting".
        event_id: String(order.id),
        action_source: 'website',
        user_data: userData,
        custom_data: customData,
      },
    ],
  };
  if (testCode) payload.test_event_code = testCode;

  try {
    const res = await fetch(
      `${META_GRAPH}/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      // Constant format string; order_number passed as an argument so the value
      // can't act as a format specifier (CodeQL tainted-format-string).
      console.error(
        '[meta-capi] purchase send failed for order #%s: %s %s',
        String(order.order_number),
        String(res.status),
        text.slice(0, 300),
      );
      return { sent: false, reason: 'send-failed' };
    }
    console.log(`[meta-capi] purchase sent for order #${order.order_number} (event_id ${order.id})`);
    return { sent: true };
  } catch (err) {
    console.error('[meta-capi] purchase send threw for order #%s (non-fatal):', String(order.order_number), err);
    return { sent: false, reason: 'send-failed' };
  }
}
