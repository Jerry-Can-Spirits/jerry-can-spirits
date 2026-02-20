-- Jerry Can Spirits D1 Database — Initial Schema
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0001_initial.sql

-- Batches (e.g., Batch 001 — Expedition Spiced Rum)
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cask_type TEXT,
  distillation_date TEXT,
  bottling_date TEXT,
  bottle_count INTEGER,
  abv REAL,
  status TEXT NOT NULL DEFAULT 'ageing',
  tasting_notes TEXT,
  founder_notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Individual bottles (numbered bottle tracking for "Check Your Bottle")
CREATE TABLE IF NOT EXISTS bottles (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  bottle_number INTEGER NOT NULL,
  gtin TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  sold_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(batch_id, bottle_number)
);

-- Index for bottle lookups by batch
CREATE INDEX IF NOT EXISTS idx_bottles_batch_id ON bottles(batch_id);
CREATE INDEX IF NOT EXISTS idx_bottles_batch_number ON bottles(batch_id, bottle_number);

-- Seed: Batch 001 — Expedition Spiced Rum
INSERT OR IGNORE INTO batches (id, name, cask_type, distillation_date, bottling_date, bottle_count, abv, status, tasting_notes, founder_notes)
VALUES (
  'batch-001',
  'Batch 001 — Expedition Spiced Rum',
  'Ex-Bourbon American Oak',
  '2025-06-15',
  '2026-03-01',
  700,
  40.0,
  'bottled',
  'Warm vanilla and caramel on the nose, with notes of cinnamon, nutmeg, and a hint of citrus zest. Smooth on the palate with a gentle spice finish.',
  'Our first batch. Every bottle carries the spirit of two veterans who decided to trade signals for spirits. This is where the expedition begins.'
);
