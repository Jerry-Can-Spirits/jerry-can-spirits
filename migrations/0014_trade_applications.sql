-- Trade application register: AWRS-aligned due diligence record.
-- Distinct from `trade_accounts` (PIN-gated access table from migration 0013).
-- One row per submitted application. Survives approve/reject/closed lifecycle.
-- Apply with:
--   wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0014_trade_applications.sql
--   wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0014_trade_applications.sql

CREATE TABLE IF NOT EXISTS trade_applications (
  id                      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  status                  TEXT NOT NULL DEFAULT 'pending',
  trading_name            TEXT NOT NULL,
  legal_entity_name       TEXT NOT NULL,
  legal_structure         TEXT NOT NULL,
  business_type           TEXT NOT NULL,
  companies_house_number  TEXT,
  vat_number              TEXT,
  awrs_urn                TEXT,
  years_trading           INTEGER NOT NULL,
  website                 TEXT,
  trading_address_json    TEXT NOT NULL,
  registered_address_json TEXT,
  premises_licence_number TEXT,
  licensing_authority     TEXT,
  dps_name                TEXT,
  personal_licence_number TEXT,
  contact_name            TEXT NOT NULL,
  contact_role            TEXT NOT NULL,
  contact_email           TEXT NOT NULL,
  contact_phone           TEXT NOT NULL,
  director_name           TEXT NOT NULL,
  psc_json                TEXT,
  expected_initial_volume TEXT NOT NULL,
  expected_monthly_volume TEXT NOT NULL,
  payment_terms_pref      TEXT NOT NULL,
  how_heard               TEXT,
  notes                   TEXT,
  premises_licence_verified_at TEXT,
  director_id_verified_at      TEXT,
  director_id_type             TEXT,
  director_id_doc_masked       TEXT,
  director_id_doc_expiry       TEXT,
  verification_notes           TEXT,
  marketing_opt_in        INTEGER NOT NULL DEFAULT 0,
  submitted_at            TEXT NOT NULL,
  next_review_date        TEXT NOT NULL,
  closed_at               TEXT,
  closed_reason           TEXT,
  ip_address              TEXT,
  user_agent              TEXT
);

CREATE INDEX IF NOT EXISTS idx_trade_applications_status
  ON trade_applications(status);
CREATE INDEX IF NOT EXISTS idx_trade_applications_next_review
  ON trade_applications(next_review_date);
CREATE INDEX IF NOT EXISTS idx_trade_applications_contact_email
  ON trade_applications(contact_email);

CREATE TABLE IF NOT EXISTS trade_application_review_log (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_application_id     TEXT NOT NULL,
  event_type               TEXT NOT NULL,
  notes                    TEXT,
  reviewed_by              TEXT,
  next_review_date         TEXT,
  created_at               TEXT NOT NULL,
  FOREIGN KEY (trade_application_id) REFERENCES trade_applications(id)
);

CREATE INDEX IF NOT EXISTS idx_trade_application_review_log_application
  ON trade_application_review_log(trade_application_id);

-- Link existing trade_accounts (PIN table) to an originating application.
-- Existing rows have NULL; future PIN issuance from approved applications carries the link.
ALTER TABLE trade_accounts ADD COLUMN application_id TEXT REFERENCES trade_applications(id);
CREATE INDEX IF NOT EXISTS idx_trade_accounts_application
  ON trade_accounts(application_id);
