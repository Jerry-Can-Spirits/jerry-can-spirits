-- Expedition Log: opt-in public listing of founding bottle buyers
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0010_expedition_log.sql

CREATE TABLE expedition_log (
  id        TEXT PRIMARY KEY,
  batch_id  TEXT NOT NULL,
  name      TEXT NOT NULL,
  location  TEXT,
  location_lat  REAL,
  location_lng  REAL,
  message   TEXT,
  removed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_expedition_log_batch ON expedition_log(batch_id);
CREATE INDEX idx_expedition_log_created ON expedition_log(created_at);
