-- Deactivate every trade account except the one live customer and the demo.
--
-- Eight rows existed. One, The Lichfield Vaults, came through the application
-- flow and is a real trading account. One, Pour IQ Demo Venue, backs the demo.
-- The other six were seeded by hand in April and May before the application
-- flow existed: five were already inactive, but The Bank Bar & Grill was still
-- active on partner tier with a working PIN and no application behind it.
--
-- Those six now apply through the portal like anyone else, which is also the
-- only path that produces the AWRS due-diligence evidence a hand-seeded row
-- never had. Their PINs are reissued at that point.
--
-- Written as a keep-list rather than a list of rows to disable, so it stays
-- correct if run again and cannot miss a row added between writing and applying.
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0076_deactivate_seeded_trade_accounts.sql

UPDATE trade_accounts
SET active = 0
WHERE venue_name NOT IN ('The Lichfield Vaults', 'Pour IQ Demo Venue');
