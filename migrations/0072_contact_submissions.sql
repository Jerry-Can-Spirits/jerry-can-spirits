-- Durable system-of-record for contact form submissions.
-- The contact route previously persisted submissions only to Klaviyo, so a
-- Klaviyo outage silently discarded the message (including complaints and trade
-- enquiries). The route now writes here FIRST and treats that write as the
-- success gate; Klaviyo and the Resend alert are best-effort afterwards.
--
-- No IP address is stored: the honeypot + per-IP rate limiting already do the
-- abuse work at submission time, so retaining IP in the durable record would be
-- personal data with no further purpose.
--
-- status/handled_at distinguish read from unread and enable an
-- "unhandled older than X" check. Retention: contact form data is committed to
-- 2 years in the privacy policy and enforced by the weekly purge in
-- scheduled-contact-retention.ts (see docs/SECURITY.md).
--
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0072_contact_submissions.sql
CREATE TABLE IF NOT EXISTS contact_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  form_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  order_number TEXT,
  issue_type TEXT,
  priority TEXT,
  venue_name TEXT,
  venue_type TEXT,
  covers TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  handled_at TEXT
);

-- Supports the "unhandled submissions older than X" query and the retention purge.
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status, created_at);
