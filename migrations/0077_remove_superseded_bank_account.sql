-- Remove the superseded Bank Bar & Grill account row.
--
-- The Bank now has a properly provisioned account
-- (b17f5954bd207690d8ec072bf2398184), created 31 Aug 2026 from their real
-- trade application through the portal, with the due-diligence trail the
-- hand-seeded April row (03e3a7bb3b60e3798ae61a4f4ed4667a) never had. That
-- old row was deactivated in 0076 and is now deleted on Dan's instruction.
--
-- Their Pour IQ subscription referenced the old row and is re-pointed to the
-- new account first, so the venue's Pour IQ relationship survives under the
-- account that now represents them. Every other pouriq_* table was swept and
-- holds no rows for the old id.
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0077_remove_superseded_bank_account.sql

UPDATE pouriq_subscriptions
SET trade_account_id = 'b17f5954bd207690d8ec072bf2398184'
WHERE trade_account_id = '03e3a7bb3b60e3798ae61a4f4ed4667a';

DELETE FROM trade_accounts
WHERE id = '03e3a7bb3b60e3798ae61a4f4ed4667a'
  AND active = 0
  AND application_id IS NULL;
