-- Fix the Expedition Log production bug discovered 2026-05-20.
--
-- Two coupled problems:
--
-- 1. SCHEMA. Migration 0001 created the bottles table with an inline
--    UNIQUE(batch_id, bottle_number) constraint. Migration 0002 added the
--    label_type column and a new UNIQUE(batch_id, label_type, bottle_number)
--    index, but only dropped a named non-unique index — it did NOT remove
--    the inline table-level constraint. The auto-generated index from that
--    constraint (sqlite_autoindex_bottles_2) cannot be dropped by name.
--    Result: a premium #1 cannot coexist with a standard #1 even though the
--    new index intended to allow it. INSERT OR IGNORE silently skips the
--    second row.
--    Fix: rebuild the table without the inline UNIQUE constraint, preserving
--    any existing rows.
--
-- 2. DATA. The bottles table is empty in production. PR #515 added validation
--    that requires each submitted bottle to exist in the table; without rows
--    every legitimate customer registration is rejected as "not valid for
--    this batch." Seed the 840 rows for Batch 001 once the schema allows it.
--
-- Ranges:
--   standard: 1-700 (700 bottles)
--   premium : 1-100 (100 bottles)
--   founder : 1-40  ( 40 bottles)
-- Total: 840.
--
-- Apply locally:
--   npx wrangler d1 execute jerry-can-spirits-db --local  --file=migrations/0028_seed_batch001_bottles.sql
-- Apply to production:
--   npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0028_seed_batch001_bottles.sql

-- 1. Rebuild bottles without the stale UNIQUE(batch_id, bottle_number) constraint.
CREATE TABLE bottles_new (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  bottle_number INTEGER NOT NULL,
  label_type TEXT NOT NULL DEFAULT 'standard',
  gtin TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  sold_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO bottles_new (id, batch_id, bottle_number, label_type, gtin, status, sold_at, created_at)
SELECT id, batch_id, bottle_number, label_type, gtin, status, sold_at, created_at
FROM bottles;

DROP TABLE bottles;
ALTER TABLE bottles_new RENAME TO bottles;

CREATE INDEX idx_bottles_batch_id ON bottles(batch_id);
CREATE UNIQUE INDEX idx_bottles_batch_label_number ON bottles(batch_id, label_type, bottle_number);

-- 2. Seed Batch 001 bottles.
WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 700
)
INSERT OR IGNORE INTO bottles (id, batch_id, bottle_number, label_type, status)
SELECT
  'batch-001-standard-' || printf('%03d', n),
  'batch-001',
  n,
  'standard',
  'available'
FROM seq;

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 100
)
INSERT OR IGNORE INTO bottles (id, batch_id, bottle_number, label_type, status)
SELECT
  'batch-001-premium-' || printf('%03d', n),
  'batch-001',
  n,
  'premium',
  'available'
FROM seq;

WITH RECURSIVE seq(n) AS (
  SELECT 1 UNION ALL SELECT n + 1 FROM seq WHERE n < 40
)
INSERT OR IGNORE INTO bottles (id, batch_id, bottle_number, label_type, status)
SELECT
  'batch-001-founder-' || printf('%03d', n),
  'batch-001',
  n,
  'founder',
  'available'
FROM seq;
