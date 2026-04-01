-- Create batch_ingredients table for botanical sourcing provenance
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0007_batch_ingredients.sql

CREATE TABLE IF NOT EXISTS batch_ingredients (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  name TEXT NOT NULL,
  origin TEXT,
  supplier TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_batch_ingredients_batch_id
  ON batch_ingredients(batch_id);

-- Seed: Batch 001 — Expedition Spiced Rum
INSERT OR IGNORE INTO batch_ingredients (id, batch_id, name, origin, supplier, notes, sort_order) VALUES
  ('batch-001-rum-base',     'batch-001', 'Caribbean Rum Base',      'Caribbean',    NULL,                                    NULL, 1),
  ('batch-001-molasses',     'batch-001', 'Welsh Molasses',           'Wales',        'Spirit of Wales Distillery, Newport',   NULL, 2),
  ('batch-001-vanilla',      'batch-001', 'Madagascan Vanilla Pods',  'Madagascar',   NULL,                                    NULL, 3),
  ('batch-001-cinnamon',     'batch-001', 'Ceylon Cinnamon',          'Sri Lanka',    NULL,                                    NULL, 4),
  ('batch-001-ginger',       'batch-001', 'Ginger',                   NULL,           NULL,                                    NULL, 5),
  ('batch-001-orange-peel',  'batch-001', 'Orange Peel',              NULL,           NULL,                                    NULL, 6),
  ('batch-001-cloves',       'batch-001', 'Cloves',                   NULL,           NULL,                                    NULL, 7),
  ('batch-001-allspice',     'batch-001', 'Allspice',                 NULL,           NULL,                                    NULL, 8),
  ('batch-001-cassia',       'batch-001', 'Cassia Bark',              NULL,           NULL,                                    NULL, 9),
  ('batch-001-agave',        'batch-001', 'Agave Syrup',              NULL,           NULL,                                    NULL, 10),
  ('batch-001-glucose',      'batch-001', 'Glucose Syrup',            NULL,           NULL,                                    NULL, 11),
  ('batch-001-barrel-chips', 'batch-001', 'Bourbon Barrel Chips',     'United States',NULL,                                    NULL, 12);
