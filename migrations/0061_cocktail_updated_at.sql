-- Add updated_at to pouriq_cocktails so photo cache-busting has a reliable version signal.
-- The column is backfilled to datetime('now') for all existing rows.
ALTER TABLE pouriq_cocktails ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));
