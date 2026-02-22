import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import {
  verifyWebhookSignature,
  incrementPreOrderSold,
  SHOPIFY_WEBHOOK_TOPICS,
  type ShopifyOrder,
  type ShopifyProduct,
} from '@/lib/shopify-webhooks';

export const dynamic = 'force-dynamic';

// ── Handlers ────────────────────────────────────────────────────────

async function handleOrderCreated(
  order: ShopifyOrder,
  kv: KVNamespace,
  adminToken: string | undefined,
) {
  const country =
    order.shipping_address?.country_code ||
    order.billing_address?.country_code ||
    'unknown';

  const titles = order.line_items.map((li) => li.title);
  const timestamp = new Date(order.created_at).getTime();

  // Anonymised order data for future social proof feed
  await kv.put(
    `order:recent:${timestamp}`,
    JSON.stringify({ titles, country, timestamp }),
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

    switch (topic) {
      case SHOPIFY_WEBHOOK_TOPICS.ORDERS_CREATE:
        await handleOrderCreated(payload as ShopifyOrder, kv, adminToken);
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
