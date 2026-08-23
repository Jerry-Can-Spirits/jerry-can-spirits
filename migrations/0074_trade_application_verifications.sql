-- Evidence of due diligence checks run against a trade application.
--
-- WHY THIS TABLE EXISTS. Under AWRS the obligation is to carry out "reasonable
-- and proportionate" checks and to have "governance in place to ensure that
-- these are carried out as intended" (Excise Notice 2002 s12, AWRS60600). The
-- register we had recorded what a venue *told* us. It recorded nothing about
-- what we *checked*, which is the half an audit actually asks for.
--
-- The first real application made the difference concrete. It declared "Sole
-- Trader" with no company number; Companies House shows THE LICHFIELD VAULTS
-- LTD, company 15137252, active, SIC 56302 public houses and bars. One lookup
-- corrected four fields. "We asked for a licence number" is not due diligence.
-- "Companies House confirmed active status and a matching SIC on this date" is.
--
-- Rows are append-only by convention: a later check never overwrites an earlier
-- one, so the history shows when something changed and when it was last looked
-- at. `response_json` keeps the raw payload, because the useful question two
-- years from now is what the source said at the time, not what we parsed out
-- of it.

CREATE TABLE trade_application_verifications (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_application_id  TEXT NOT NULL,
  -- 'companies_house' | 'postcode' | 'vat' | 'manual'
  source                TEXT NOT NULL,
  -- What was looked up: a company number, a postcode, a VAT number.
  query                 TEXT NOT NULL,
  -- 'match' | 'mismatch' | 'not_found' | 'error'
  outcome               TEXT NOT NULL,
  -- Human-readable summary of what was found or what differed.
  summary               TEXT,
  -- The source's raw response, for the audit trail.
  response_json         TEXT,
  checked_at            TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (trade_application_id) REFERENCES trade_applications(id)
);

CREATE INDEX idx_trade_verifications_application
  ON trade_application_verifications (trade_application_id, checked_at DESC);
