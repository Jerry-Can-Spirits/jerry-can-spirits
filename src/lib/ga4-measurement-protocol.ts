/**
 * Server-side GA4 purchase attribution via the Measurement Protocol.
 *
 * Checkout hands off to shop.jerrycanspirits.co.uk, so the storefront never
 * observes the completed order. The storefront stamps the GA4 client_id,
 * session_id, gclid and the visitor's analytics-consent state onto the cart as
 * hidden (underscore-prefixed) note attributes; this module reads them off the
 * orders/create webhook payload and posts the `purchase` event to GA4.
 *
 * Fail-safe by design: if the client_id is absent (draft/manual order, or a
 * session that never had analytics consent) or consent was not granted, the
 * send is skipped rather than faked. A fabricated client_id would invent a
 * phantom user and corrupt the session data, which is worse than a gap.
 */

import type { ShopifyOrder } from './shopify-webhooks';
import {
  STITCH_CLIENT_ID,
  STITCH_SESSION_ID,
  STITCH_CONSENT,
  CONSENT_GRANTED,
} from './analytics-stitch-keys';

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

function noteAttribute(order: ShopifyOrder, name: string): string | undefined {
  return order.note_attributes?.find((a) => a.name === name)?.value?.trim() || undefined;
}

export type PurchaseSkipReason =
  | 'no-client-id'
  | 'consent-declined'
  | 'not-configured'
  | 'send-failed';

export type BuiltPurchase =
  | { skip: PurchaseSkipReason }
  | { clientId: string; body: Record<string, unknown> };

/**
 * Build the GA4 Measurement Protocol request body for an order, or a skip
 * reason. Pure and synchronous so it can be unit-tested without a network.
 */
export function buildPurchaseEvent(order: ShopifyOrder): BuiltPurchase {
  const clientId = noteAttribute(order, STITCH_CLIENT_ID);
  // No storefront-captured client_id means no session to attribute to. Skip
  // rather than invent one — a fabricated id creates a phantom user.
  if (!clientId) return { skip: 'no-client-id' };

  // The webhook fires server-side, outside the browser's consent context, so
  // consent is carried as an attribute. Only 'granted' sends; anything else
  // (declined, or the attribute missing) is treated as no-consent.
  if (noteAttribute(order, STITCH_CONSENT) !== CONSENT_GRANTED) {
    return { skip: 'consent-declined' };
  }

  const sessionId = noteAttribute(order, STITCH_SESSION_ID);

  // value: the item subtotal, excluding shipping. UK prices are VAT-inclusive,
  // so this is the VAT-inclusive product revenue the customer paid for goods.
  // Shipping is excluded because it is not product revenue; it would otherwise
  // inflate ROAS on free-shipping-threshold baskets. subtotal_price is
  // post-discount, matching what the customer actually paid for the items.
  const value = order.subtotal_price != null ? Number(order.subtotal_price) : NaN;

  // item_id is the Shopify VARIANT id on purpose: the Merchant Center feed keys
  // on variant, so this keeps product-level reporting and remarketing aligned
  // with the upper-funnel events, which also emit variant ids.
  const items = order.line_items
    .filter((li) => li.variant_id != null)
    .map((li) => {
      const price = li.price != null ? Number(li.price) : NaN;
      return {
        item_id: String(li.variant_id),
        item_name: li.name ?? li.title,
        ...(Number.isNaN(price) ? {} : { price }),
        quantity: li.quantity,
      };
    });

  const params: Record<string, unknown> = {
    // transaction_id is the Shopify order number, used consistently so GA4
    // deduplicates this event against any Shopify-side purchase tag on the same
    // order. See README ("Verifying no double-counting").
    transaction_id: String(order.order_number),
    currency: order.currency ?? 'GBP',
    // A non-zero engagement time is required for GA4 to attribute the event to
    // the session rather than counting the user as non-engaged.
    engagement_time_msec: 1,
    items,
  };
  if (!Number.isNaN(value)) params.value = value;
  // session_id ties the event to the originating GA4 session so it attributes
  // to that session's source/medium rather than opening a new (direct) one.
  if (sessionId) params.session_id = sessionId;

  return {
    clientId,
    body: { client_id: clientId, events: [{ name: 'purchase', params }] },
  };
}

/**
 * Send the purchase to GA4. Never throws — a tracking failure must not fail the
 * webhook (a 500 makes Shopify retry, and GA4 dedupes the resend by
 * transaction_id anyway). Returns the outcome for logging/tests.
 */
export async function sendGa4Purchase(
  order: ShopifyOrder,
  measurementId: string | undefined,
  apiSecret: string | undefined,
): Promise<{ sent: true } | { sent: false; reason: PurchaseSkipReason }> {
  if (!measurementId || !apiSecret) {
    console.warn(
      `[ga4] GA4_MEASUREMENT_ID/GA4_API_SECRET not configured — skipping purchase for order #${order.order_number}`,
    );
    return { sent: false, reason: 'not-configured' };
  }

  const built = buildPurchaseEvent(order);
  if ('skip' in built) {
    console.log(`[ga4] purchase skipped for order #${order.order_number}: ${built.skip}`);
    return { sent: false, reason: built.skip };
  }

  try {
    const url = `${GA4_ENDPOINT}?measurement_id=${encodeURIComponent(
      measurementId,
    )}&api_secret=${encodeURIComponent(apiSecret)}`;
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(built.body) });
    if (!res.ok) {
      console.error(
        `[ga4] purchase send failed for order #${order.order_number}: ${res.status} ${res.statusText}`,
      );
      return { sent: false, reason: 'send-failed' };
    }
    console.log(
      `[ga4] purchase sent for order #${order.order_number} (transaction_id ${order.order_number})`,
    );
    return { sent: true };
  } catch (error) {
    console.error(`[ga4] purchase send error for order #${order.order_number}:`, error);
    return { sent: false, reason: 'send-failed' };
  }
}
