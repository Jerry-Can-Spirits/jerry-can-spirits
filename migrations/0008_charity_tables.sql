-- Charity partners and contribution records
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0008_charity_tables.sql

CREATE TABLE IF NOT EXISTS charities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS charity_contributions (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL REFERENCES charities(id),
  -- Note: SQLite does not enforce FK constraints by default. Data integrity via migration discipline.
  amount_gbp REAL,
  year INTEGER NOT NULL,
  period_description TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_charity_id
  ON charity_contributions(charity_id);

-- Note: DESC in index column definitions requires SQLite 3.33.0+ (2020). D1 supports this.
CREATE INDEX IF NOT EXISTS idx_charity_contributions_year
  ON charity_contributions(year DESC);
