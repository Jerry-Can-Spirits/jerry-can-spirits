-- Add label_type column to bottles table for Standard/Premium/Founder designations
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0002_label_types.sql

-- Add label_type column (standard, premium, founder)
ALTER TABLE bottles ADD COLUMN label_type TEXT NOT NULL DEFAULT 'standard';

-- Drop old unique constraint and index, recreate with label_type
DROP INDEX IF EXISTS idx_bottles_batch_number;

-- New unique constraint: (batch_id, label_type, bottle_number)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bottles_batch_label_number ON bottles(batch_id, label_type, bottle_number);
