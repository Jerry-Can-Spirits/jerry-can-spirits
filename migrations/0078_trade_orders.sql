-- One row per Shopify order placed by a trade account.
--
-- The Customer Register on SharePoint carries first and last order dates, an
-- order count and a running total per venue. Those were manual, which is fine
-- for four venues and not for fifty (Dan, 1 Oct 2026). The orders/create
-- webhook now attributes each order to a trade account and records it here,
-- and the register is updated from the aggregate of these rows rather than by
-- hand. The table is the source the register is rebuilt from, which is why
-- the money is stored as pence ex VAT after discount and before shipping:
-- that is the figure a venue compares with its other suppliers.
--
-- Attribution: the trade checkout stamps the cart with the account id
-- (_trade_account_id), which Shopify copies onto the order. Orders from before
-- that stamp existed are matched by discount code when the code is unique to
-- one account.
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0078_trade_orders.sql
CREATE TABLE IF NOT EXISTS trade_orders (
  order_id TEXT PRIMARY KEY,
  order_number INTEGER NOT NULL,
  trade_account_id TEXT NOT NULL REFERENCES trade_accounts(id),
  application_id TEXT,
  created_at TEXT NOT NULL,
  ex_vat_p INTEGER NOT NULL,
  bottles INTEGER NOT NULL DEFAULT 0,
  attributed_by TEXT NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_trade_orders_account ON trade_orders(trade_account_id, created_at);
