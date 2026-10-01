-- The pricing rule lives on the account, next to its code.
--
-- Until now the portal priced from a table in product-data.ts keyed by code,
-- so every new venue rate needed a Shopify code AND a code change. With one
-- code per venue (VICTORY15, SAXTYS180: a leaked code names its leaker and
-- one venue can be switched off alone, Dan 1 Oct 2026) that table would grow
-- a row per pub. Instead the kind and value are stored here, the portal reads
-- them, and provisioning mints the Shopify code from them.
--
-- discount_kind:    'percent' or 'amountOff'
-- discount_value:   the percentage, or the pence off each covered item
-- discount_handles: JSON array of product handles an amountOff rule covers
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0079_trade_account_discount_rule.sql
ALTER TABLE trade_accounts ADD COLUMN discount_kind TEXT;
ALTER TABLE trade_accounts ADD COLUMN discount_value INTEGER;
ALTER TABLE trade_accounts ADD COLUMN discount_handles TEXT;

-- Backfill from the codes in use on 1 Oct 2026, so the portal prices every
-- account the same way the moment this lands.
UPDATE trade_accounts SET discount_kind = 'percent', discount_value = 10 WHERE discount_code = 'TRADE10';
UPDATE trade_accounts SET discount_kind = 'percent', discount_value = 15 WHERE discount_code = 'TRADE15';
UPDATE trade_accounts
   SET discount_kind = 'amountOff', discount_value = 4800,
       discount_handles = '["jerry-can-spirits-expedition-pack-spiced-rum-6-bottles"]'
 WHERE discount_code = 'TRADECASE150';
