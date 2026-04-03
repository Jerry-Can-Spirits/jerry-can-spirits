-- Add bottle_type and bottle_number to expedition_log
-- Each row now represents one bottle, not one person
-- Apply with: npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0012_expedition_log_bottle_fields.sql

ALTER TABLE expedition_log ADD COLUMN bottle_type TEXT;
ALTER TABLE expedition_log ADD COLUMN bottle_number INTEGER;
