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
  NULL,
  NULL,
  '2026-03-01',
  840,
  40.0,
  'bottled',
  'Nose: Warm Madagascan vanilla leads with a rich, creamy softness. Ceylon cinnamon and toasted bourbon oak add warmth and structure, lifted by bright orange peel. Clove and allspice sit in the background, adding depth and subtle spice complexity. Palate: Silky and naturally sweet on entry thanks to agave. Ginger heat and cassia bark develop into layered baking spices, while subtle citrus returns mid-palate to balance the richness with a gentle zesty edge. Finish: Long, warming, and elegantly dry. Oak tannins linger alongside vanilla, winter spice, and a final flicker of ginger. Clean, refined, and crafted for sipping.',
  'Our first batch. Two Royal Signals veterans who decided to trade comms for spirits. Every bottle carries 700ml of the same liquid we spent months getting right - no shortcuts, no compromises. This is where the expedition begins.'
);
