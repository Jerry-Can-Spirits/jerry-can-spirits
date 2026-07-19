/**
 * Shopify webhook utilities — HMAC verification and payload types.
 *
 * Uses Web Crypto API (Edge-compatible, no Node.js polyfills).
 */

// ── Webhook Topics ──────────────────────────────────────────────────

export const SHOPIFY_WEBHOOK_TOPICS = {
  ORDERS_CREATE: 'orders/create',
  ORDERS_FULFILLED: 'orders/fulfilled',
  PRODUCTS_UPDATE: 'products/update',
} as const;

export type ShopifyWebhookTopic =
  (typeof SHOPIFY_WEBHOOK_TOPICS)[keyof typeof SHOPIFY_WEBHOOK_TOPICS];

// ── Payload Types (subset of fields we actually use) ────────────────

export interface ShopifyOrder {
  id: number;
  order_number: number;
  created_at: string;
  email?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
  };
  fulfillment_status: string | null;
  // subtotal_price / currency drive the GA4 purchase value (see
  // ga4-measurement-protocol.ts). name is the customer-facing order name (#1234).
  subtotal_price?: string;
  currency?: string;
  name?: string;
  line_items: {
    title: string;
    quantity: number;
    product_id: number;
    // variant_id / price / name are on the real orders/create payload and are
    // read for the GA4 items array; item_id keys on the variant.
    variant_id?: number;
    price?: string;
    name?: string;
  }[];
  note_attributes?: {
    name: string;
    value: string;
  }[];
  discount_codes?: {
    code: string;
    amount: string;
    type: string;
  }[];
  shipping_address?: {
    country_code: string;
    country: string;
  } | null;
  billing_address?: {
    country_code: string;
    country: string;
  } | null;
}

export interface ShopifyProduct {
  id: number;
  handle: string;
  title: string;
  updated_at: string;
  status: string;
  variants: {
    id: number;
    inventory_quantity: number;
  }[];
}

// ── Idempotency ─────────────────────────────────────────────────────

/**
 * Record an order as processed, atomically. Shopify delivers orders/create
 * at-least-once and retries on any non-2xx, so the handler's non-idempotent
 * side effects (minting a referrer reward code, incrementing bottles-sold,
 * sending Klaviyo emails) would double-fire on a retry or duplicate delivery.
 *
 * Returns true only on the FIRST delivery of an order; a duplicate/retry
 * returns false and the caller must skip every side effect. Call this BEFORE
 * any side effect: the row commits first, so a failure anywhere after it is
 * safely skipped on the retry (no second reward code). Backed by
 * webhook_processed_orders (migration 0071).
 */
export async function markOrderProcessed(
  db: D1Database,
  orderId: number | string,
): Promise<boolean> {
  const row = await db
    .prepare(
      'INSERT INTO webhook_processed_orders (order_id) VALUES (?) ON CONFLICT(order_id) DO NOTHING RETURNING order_id',
    )
    .bind(String(orderId))
    .first<{ order_id: string }>();
  return row !== null;
}

// ── Admin API ───────────────────────────────────────────────────────

const SHOP_DOMAIN = 'zaeiaw-5z.myshopify.com';
const API_VERSION = '2024-10';

/**
 * Increment the bottles-sold metafield on a product.
 * Uses Shopify Admin REST API. Creates the metafield if it doesn't exist.
 */
export async function incrementBottlesSold(
  productId: number,
  quantity: number,
  adminToken: string,
): Promise<void> {
  // Validate productId is a positive integer to prevent SSRF
  const safeProductId = Math.floor(Math.abs(productId));
  if (!Number.isFinite(safeProductId) || safeProductId === 0) {
    console.error(`[webhook] Invalid product ID: ${productId}`);
    return;
  }

  const baseUrl = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;
  const headers = {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json',
  };

  // Read current metafields for this product
  const metafieldsRes = await fetch(
    `${baseUrl}/products/${safeProductId}/metafields.json?namespace=custom&key=pre_order_sold`,
    { headers },
  );

  if (!metafieldsRes.ok) {
    console.error(`[webhook] Failed to read metafields for product ${safeProductId}: ${metafieldsRes.status}`);
    return;
  }

  const data = (await metafieldsRes.json()) as {
    metafields: { id: number; value: string }[];
  };

  const existing = data.metafields?.[0];
  const currentValue = existing ? parseInt(existing.value, 10) || 0 : 0;
  const newValue = currentValue + quantity;

  if (existing) {
    // Update existing metafield
    const safeMetafieldId = Math.floor(Math.abs(existing.id));
    const updateRes = await fetch(`${baseUrl}/metafields/${safeMetafieldId}.json`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        metafield: { id: existing.id, value: String(newValue), type: 'number_integer' },
      }),
    });
    if (!updateRes.ok) {
      console.error(`[webhook] Failed to update metafield ${existing.id}: ${updateRes.status}`);
      return;
    }
  } else {
    // Create new metafield
    const createRes = await fetch(`${baseUrl}/products/${safeProductId}/metafields.json`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        metafield: {
          namespace: 'custom',
          key: 'pre_order_sold',
          value: String(newValue),
          type: 'number_integer',
        },
      }),
    });
    if (!createRes.ok) {
      console.error(`[webhook] Failed to create metafield for product ${safeProductId}: ${createRes.status}`);
      return;
    }
  }

  console.log(`[webhook] Updated bottles sold for product ${safeProductId}: ${currentValue} → ${newValue}`);
}

// ── HMAC-SHA256 Verification (Web Crypto) ───────────────────────────

/**
 * Verify Shopify webhook HMAC-SHA256 signature.
 * Uses constant-time comparison to prevent timing attacks.
 */
export async function verifyWebhookSignature(
  body: string,
  hmacHeader: string,
  secret: string,
): Promise<boolean> {
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const computedHash = btoa(String.fromCharCode(...new Uint8Array(signature)));

  // Constant-time comparison
  if (computedHash.length !== hmacHeader.length) return false;

  let mismatch = 0;
  for (let i = 0; i < computedHash.length; i++) {
    mismatch |= computedHash.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  }

  return mismatch === 0;
}
