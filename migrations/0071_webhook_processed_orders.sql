-- Webhook idempotency for Shopify orders/create.
-- Shopify delivers webhooks at-least-once and retries on any non-2xx, so a
-- naive handler double-fires its non-idempotent side effects: it mints a second
-- referrer reward code, re-increments the bottles-sold metafield, and re-sends
-- Klaviyo emails. The ORDERS_CREATE handler now records the order id here FIRST
-- (atomic INSERT ... ON CONFLICT DO NOTHING RETURNING) and skips every side
-- effect when the row already exists.
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0071_webhook_processed_orders.sql
CREATE TABLE IF NOT EXISTS webhook_processed_orders (
  order_id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
