-- Where every bottle went: one row per retail Shopify order, holding only what
-- the Expedition Log map plots. In the UK (country GB, Northern Ireland
-- included) the outward code (FY1, SW1A) is the part of the postcode before
-- the space; abroad there is no district, so outward_code is NULL and the
-- foreign postcode is never stored. The town is the shipping city; bottles is
-- countBottles over the line items. No names, no street, no inward code, no
-- email. Trade orders, test orders, cancelled or refunded orders and orders
-- with no bottles are never written (src/lib/bottle-map.ts). Keyed on the
-- Shopify order id so the webhook and the backfill script are idempotent and
-- a cancellation can remove the row.
--
-- Apply with: npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0080_bottle_map.sql
CREATE TABLE IF NOT EXISTS bottle_map (
  order_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  country TEXT NOT NULL,
  outward_code TEXT,
  town TEXT,
  bottles INTEGER NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bottle_map_place ON bottle_map(country, outward_code);
