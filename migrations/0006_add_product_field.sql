-- Add product field to batches for multi-spirit support
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0006_add_product_field.sql

ALTER TABLE batches ADD COLUMN product TEXT NOT NULL DEFAULT 'expedition-spiced-rum';
