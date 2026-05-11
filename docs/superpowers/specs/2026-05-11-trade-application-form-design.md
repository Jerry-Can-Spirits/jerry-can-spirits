# Trade Account Application Form — Design Spec

**Date:** 2026-05-11
**Status:** Design (pending implementation)
**Branch:** `feat/trade-application-form`

## Context & Goal

Jerry Can Spirits is onboarding on-trade and off-trade customers (pubs, bars, restaurants, hotels, retailers, wholesalers). HMRC's Alcohol Wholesaler Registration Scheme (AWRS) requires producers and wholesalers to conduct due diligence on every trade customer and to repeat that diligence on a recurring basis. The existing trade enquiry form is a marketing capture, not a compliance instrument.

This spec defines a new trade account application that:

1. Captures AWRS-aligned due diligence data across four short steps
2. Accepts file uploads for premises licence and director photo ID
3. Persists applications to a register that supports yearly re-review
4. Sends a structured admin notification with a calendar invite for the next review
5. Fires a Klaviyo event so the applicant gets an auto-acknowledgement
6. Updates the privacy policy to reflect new data processing

The trade portal PIN issuance flow remains manual on the founder side, after review.

## Architecture Overview

### New surfaces

| Path | Purpose |
|---|---|
| `src/app/trade/apply/page.tsx` | 4-step client form (use client) |
| `src/app/api/trade-application/route.ts` | Final submission POST (JSON), Node runtime |
| `src/app/api/trade-application/upload/route.ts` | Per-file upload POST (multipart), Node runtime |
| `src/lib/trade-applications.ts` | D1 query helpers for the applications register |
| `src/lib/ics.ts` | Generate `.ics` calendar invite text |
| `src/lib/resend.ts` | Thin Resend client (fetch-based, no SDK) |
| `src/lib/r2-presign.ts` | aws4fetch wrapper for R2 S3-compatible presigned URLs |
| `migrations/0014_trade_applications.sql` | D1 schema migration |

The Worker's existing `scheduled` handler (or a new one if absent) runs the weekly cron digest.

### Reused patterns

- `isAllowedOrigin(request)` from `src/lib/kv.ts` — CSRF defence
- `isRateLimited(kv, 'trade-app', ip, 3, 3600)` — 3/hour per IP
- Klaviyo create-or-find profile flow (409 handling) — lifted from `src/app/api/contact/route.ts`
- `emailDomainAcceptsMail` — MX check on submitted contact email
- Form UI patterns from `src/app/contact/enquiries/page.tsx` — state + fetch + success/error states, same Tailwind palette

### New infrastructure

**Cloudflare R2 bucket:** `jerry-can-spirits-trade-docs`
- Binding name: `TRADE_DOCS`
- Lifecycle rules (configured in Cloudflare dashboard):
  - `pending/` prefix → delete after 24 hours
  - `applications/` prefix → delete after 30 days

**Cloudflare D1:** Reuses existing `DB` binding (`jerry-can-spirits-db`). Adds two new tables and one optional column on the existing `trade_accounts` (PIN) table (schema below).

> **Naming note:** The existing `trade_accounts` table (migration 0013) is the PIN-gated access record for already-approved trade customers, used by the trade portal at `/trade/order/`. Do not confuse it with the new `trade_applications` table introduced here, which holds the due diligence record. One row in `trade_applications` may later result in one row in `trade_accounts` (created manually for v1 when an application is approved).

**Cron Trigger:** `0 8 * * 1` — Monday 08:00 UTC weekly digest.

### `wrangler.jsonc` additions

```jsonc
"r2_buckets": [
  {
    "binding": "TRADE_DOCS",
    "bucket_name": "jerry-can-spirits-trade-docs"
    // Lifecycle rules configured in Cloudflare dashboard:
    //   pending/      → delete after 24h
    //   applications/ → delete after 30 days
  }
],
"triggers": {
  "crons": ["0 8 * * 1"]
}
```

### Environment variables

| Var | Purpose | New? |
|---|---|---|
| `KLAVIYO_PRIVATE_KEY` | Existing | No |
| `KLAVIYO_TRADE_LIST_ID` | Marketing opt-in target | **New** |
| `RESEND_API_KEY` | Send admin email | **New** |
| `TRADE_APPLICATIONS_EMAIL` | Destination for admin email: `trade@jerrycanspirits.co.uk` | **New** |
| `R2_ACCESS_KEY_ID` | Presign R2 URLs (S3 endpoint) | **New** |
| `R2_SECRET_ACCESS_KEY` | Presign R2 URLs | **New** |
| `R2_ACCOUNT_ID` | Presign R2 URLs | **New** |

Resend `from:` will be `hello@jerrycanspirits.co.uk` (existing verified inbox).
`Reply-To:` set to the applicant's email for direct reply.

Documented at the top of the main API route file as a comment block and added to `.env.example`.

## Form Structure

Four steps with a visual progress indicator. Step state persists to `sessionStorage` so a refresh mid-application does not wipe progress. Cleared on success.

### Step 1 — Business & Ownership

- **Trading name** *
- **Legal entity name** *
- **Legal structure** * — dropdown: Sole Trader / Partnership / Ltd / LLP / PLC / CIC / Charity / Other
- **Companies House number** — required if legal structure is Ltd/LLP/PLC/CIC/Charity. Format check: 8 chars alphanumeric.
- **VAT number** — optional. Format: `GB` + 9 digits or 12 digits for group.
- **Business type** * — Pub/Bar, Restaurant, Hotel, Club, Off-licence, Wholesaler, Distributor, Other
- **AWRS URN** — required if business type is Wholesaler or Distributor. Format regex `^X[A-Z]{3}\d{11}$`. Missing AWRS URN for wholesaler/distributor **blocks submission** (cannot legally trade wholesale without it).
- **Years trading** * — number
- **Website** — optional
- **Persons of Significant Control (PSC)** — shown if legal structure is Ltd/LLP/PLC/CIC.
  - PSC 1 name *
  - PSC 1 date of birth (month and year only, matches Companies House public data) *
  - "Add another PSC" link reveals one more slot
  - Maximum 2 PSCs for v1

### Step 2 — Premises & Licensing

- **Trading address** — line 1 *, line 2, town *, county, postcode *
- **"Registered address same as trading"** checkbox. If unchecked, show separate registered address fields.
- **Conditional block** — shown only when business type is Pub/Bar, Restaurant, Hotel, Club, or Off-licence:
  - Premises licence number *
  - Issuing local authority *
  - Designated Premises Supervisor name *
  - Personal licence number *
  - **File upload:** copy of premises licence * — PDF/JPG/PNG, max 5MB

### Step 3 — Primary Contact & Director

- Primary contact name *
- Role / position *
- Email * (validated)
- Phone *
- Director / owner name *
- **File upload:** photo ID of director / owner * — passport or driving licence, PDF/JPG/PNG, max 5MB

### Step 4 — Order Intent & Declaration

- Expected initial order volume — <12 bottles / 12–36 / 36–72 / 72–144 / 144+
- Expected ongoing monthly volume — same scale
- Payment terms preference — Pro-forma / 14 days / 30 days
- How did you hear about us — optional
- Anything else we should know — textarea, optional
- **Declaration** * — "I confirm the information provided is true and accurate, and I am authorised to apply for a trade account on behalf of this business."
- **Marketing opt-in** — "Add me to trade updates and new product notifications" → adds to Klaviyo trade list

### Cross-cutting behaviours

- Hidden conditional fields are removed from validation (no phantom required fields)
- Files upload on selection (not on final submit) — see Upload Flow
- Step state persisted to `sessionStorage`, keyed by a session UUID
- Step nav (Back / Next): Next validates the current step's required fields and runs format regexes before advancing
- Submit button disabled until declaration ticked (`aria-disabled` plus `disabled` attribute)
- Honeypot field `website_url` (different from existing `website` honeypot in contact route to keep semantics clear)

### Server-side validation (authoritative)

| Field | Rule |
|---|---|
| Email | RFC syntax + `emailDomainAcceptsMail` MX check |
| UK postcode | Case-insensitive regex `^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$` |
| Phone | Strip non-digits; require 10–13 digits |
| Companies House | `^([A-Z]{2}\d{6}|\d{8})$` |
| AWRS URN | `^X[A-Z]{3}\d{11}$` |
| VAT (optional) | `^(GB)?(\d{9}|\d{12})$` |
| File size | ≤ 5MB |
| File MIME | Magic-byte sniff: PDF `25 50 44 46`, JPG `FF D8 FF`, PNG `89 50 4E 47`. Header `Content-Type` is not trusted. |

## File Uploads, R2 Storage, Retention

### Upload flow

1. User selects a file in the form
2. Frontend POSTs single-file `multipart/form-data` to `/api/trade-application/upload`
3. API validates: size ≤ 5MB, MIME magic bytes match declared kind
4. API generates a UUID, stores at `pending/{uuid}` in R2 with metadata `{ originalName, mime, ts }`
5. API returns `{ ticket: uuid, filename }`
6. Frontend stores `{ ticket, filename }` in form state, renders filename + "Replace" button
7. On final submit, form POSTs JSON to `/api/trade-application` including `premisesLicenceTicket` and `directorIdTicket`
8. API validates each ticket exists in R2 `pending/`, then moves objects to `applications/{appId}/premises-licence.{ext}` and `applications/{appId}/director-id.{ext}`
9. API generates R2 presigned URLs (7-day expiry) via `aws4fetch` for the admin email

### R2 storage layout

```
pending/{uuid}                              # tentative uploads (lifecycle: delete after 24h)
applications/{appId}/premises-licence.pdf   # permanent until retention purge
applications/{appId}/director-id.jpg
```

### Retention policy

| Data | Location | Retention | Justification |
|---|---|---|---|
| Application metadata | D1 `trade_applications` | Account life + 6 years | HMRC AWRS record-keeping |
| Photo ID file | R2 `applications/` | **30 days** | Review window. Verification metadata is captured to D1 at review time; the image itself is then redundant. |
| Premises licence file | R2 `applications/` | 30 days | Same as above |
| `pending/` uploads | R2 `pending/` | 24 hours | Abandoned-application cleanup |

### Presigned URLs

- Generated via `aws4fetch` (small, Workers-compatible) against R2's S3-compatible endpoint
- 7-day expiry on email links
- Needs `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID` env vars (R2 API token generated in Cloudflare dashboard)

## Submission Flow (API Route)

`POST /api/trade-application` — JSON body, Node runtime.

### Order of operations

```
 1. Origin check          → isAllowedOrigin(request); 403 if cross-origin
 2. Honeypot check        → silent 200 if filled
 3. Rate limit            → isRateLimited(kv, 'trade-app', ip, 3, 3600); 429 if exceeded
 4. Schema validation     → manual validation of every field per the table above
 5. Domain MX check       → emailDomainAcceptsMail(contact_email)
 6. Ticket resolution     → look up pending/{ticket} in R2; 400 if missing
 7. Generate appId        → 32-char hex from randomblob(16); matches existing convention
 8. Move R2 objects       → pending/{ticket} → applications/{appId}/...
 9. Insert D1 rows        → trade_applications (status='pending', next_review_date = now + 12mo)
                            trade_application_review_log (event_type='submitted', reviewed_by='system')
10. Generate .ics         → calendar event at next_review_date
11. Generate signed URLs  → aws4fetch presign R2 URLs, 7-day expiry
12. Send admin email      → Resend, to TRADE_APPLICATIONS_EMAIL, with .ics + signed URLs
13. Klaviyo profile       → create-or-find (409 handling lifted from contact route)
14. Klaviyo event         → "Trade Application Submitted" with non-sensitive props only
15. Klaviyo list opt-in   → if marketing checkbox ticked, POST to KLAVIYO_TRADE_LIST_ID
16. Return JSON           → { success: true, applicationId } or { success: false, error }
```

### Failure handling

- D1 insert is the **source of truth**. If D1 succeeds and a later step fails (Klaviyo down, Resend down), return success to the user; log the failure to Sentry; admin email retries are out of scope for v1.
- If D1 fails, return 500 and rollback the R2 move (`DELETE applications/{appId}/*`). The `pending/{ticket}` objects expire naturally after 24h.
- Each external call wrapped in try/catch with Sentry capture; user-facing error messages are friendly fallbacks.

### Admin email (Resend)

- **From:** `hello@jerrycanspirits.co.uk`
- **To:** `TRADE_APPLICATIONS_EMAIL`
- **Reply-To:** applicant's email
- **Subject:** `Trade Application: {tradingName} ({businessType})`
- **Body:** HTML table grouped by the four step headings, every field labelled. Includes direct R2 signed-URL links ("Download premises licence — link expires {date}", "Download director ID — link expires {date}"). Plain-text alternative provided.
- **Attachment:** `.ics` calendar event titled `Yearly trade review: {tradingName}`, scheduled at `next_review_date`, with the application ID and contact email in the description.

### Applicant acknowledgement

- Driven entirely by a Klaviyo flow listening for the `Trade Application Submitted` event
- Flow contents and template are out of scope for this code change — to be built in the Klaviyo dashboard
- This spec ships the event; the flow is a separate operational task

### Klaviyo event payload (non-sensitive only — explicit list)

```ts
{
  trading_name: string,
  business_type: string,
  contact_name: string,
  expected_initial_volume: string,
  expected_monthly_volume: string,
  application_id: string,
  submission_date: ISO8601
}
```

No licence numbers, no PSC data, no addresses, no file URLs. Klaviyo handles transactional and marketing comms; it does not need due diligence data.

## D1 Schema

### Table: `trade_applications`

The register. One row per submitted application; lives through approve/reject/active/closed states. Distinct from the existing `trade_accounts` PIN table — see the naming note in the architecture overview.

```sql
CREATE TABLE trade_applications (
  id                      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
                                                      -- 32-char hex, matches existing ID convention; used as R2 prefix
  status                  TEXT NOT NULL DEFAULT 'pending',
                                                      -- pending | approved | rejected | active | closed
  trading_name            TEXT NOT NULL,
  legal_entity_name       TEXT NOT NULL,
  legal_structure         TEXT NOT NULL,
  business_type           TEXT NOT NULL,
  companies_house_number  TEXT,
  vat_number              TEXT,
  awrs_urn                TEXT,
  years_trading           INTEGER NOT NULL,
  website                 TEXT,

  -- Premises
  trading_address_json    TEXT NOT NULL,              -- JSON: { line1, line2, town, county, postcode }
  registered_address_json TEXT,                       -- null if same as trading
  premises_licence_number TEXT,
  licensing_authority     TEXT,
  dps_name                TEXT,
  personal_licence_number TEXT,

  -- Contact & director
  contact_name            TEXT NOT NULL,
  contact_role            TEXT NOT NULL,
  contact_email           TEXT NOT NULL,
  contact_phone           TEXT NOT NULL,
  director_name           TEXT NOT NULL,

  -- PSC (JSON array, 0-2 entries)
  psc_json                TEXT,                       -- [{ name, dob_month, dob_year }, ...]

  -- Order intent
  expected_initial_volume TEXT NOT NULL,
  expected_monthly_volume TEXT NOT NULL,
  payment_terms_pref      TEXT NOT NULL,
  how_heard               TEXT,
  notes                   TEXT,

  -- Verification (filled in at review time — preserves audit trail after ID file expires)
  premises_licence_verified_at TEXT,                  -- ISO8601
  director_id_verified_at      TEXT,
  director_id_type             TEXT,                  -- 'passport' | 'driving_licence' | other
  director_id_doc_masked       TEXT,                  -- last 4 chars only, never full number
  director_id_doc_expiry       TEXT,                  -- YYYY-MM-DD
  verification_notes           TEXT,                  -- free-text from reviewer

  -- Lifecycle
  marketing_opt_in        INTEGER NOT NULL DEFAULT 0, -- 0 | 1
  submitted_at            TEXT NOT NULL,              -- ISO8601
  next_review_date        TEXT NOT NULL,              -- ISO8601, driven by cron
  closed_at               TEXT,
  closed_reason           TEXT,

  -- Audit
  ip_address              TEXT,
  user_agent              TEXT
);

CREATE INDEX idx_trade_applications_status        ON trade_applications(status);
CREATE INDEX idx_trade_applications_next_review   ON trade_applications(next_review_date);
CREATE INDEX idx_trade_applications_contact_email ON trade_applications(contact_email);
```

### Table: `trade_application_review_log`

Append-only audit. One row per review event (initial onboarding, yearly check, status change).

```sql
CREATE TABLE trade_application_review_log (
  id                       INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_application_id     TEXT NOT NULL,
  event_type               TEXT NOT NULL,             -- 'submitted' | 'approved' | 'rejected'
                                                      -- | 'yearly_review_completed' | 'closed'
  notes                    TEXT,
  reviewed_by              TEXT,                      -- 'system' for submissions, founder email otherwise
  next_review_date         TEXT,                      -- when this review schedules the next
  created_at               TEXT NOT NULL,
  FOREIGN KEY (trade_application_id) REFERENCES trade_applications(id)
);

CREATE INDEX idx_trade_application_review_log_application
  ON trade_application_review_log(trade_application_id);
```

### Existing `trade_accounts` (PIN table) — link column

Add an optional foreign key so an approved application can be linked to its PIN record:

```sql
ALTER TABLE trade_accounts ADD COLUMN application_id TEXT REFERENCES trade_applications(id);
CREATE INDEX idx_trade_accounts_application ON trade_accounts(application_id);
```

Existing PIN rows have `application_id = NULL` (no application on file). Future PIN rows created from approved applications carry the link.

### Migration file

- `migrations/0014_trade_applications.sql` contains all of the above
- Apply locally: `wrangler d1 execute jerry-can-spirits-db --local --file migrations/0014_trade_applications.sql`
- Apply remote: same command with `--remote`, run manually after PR review (not in CI)

## Cron Weekly Digest

**Schedule:** `0 8 * * 1` — every Monday 08:00 UTC.

**Logic:**

```
1. Query: SELECT * FROM trade_applications
          WHERE status IN ('approved', 'active')
            AND next_review_date BETWEEN now() AND now() + 30 days
          ORDER BY next_review_date ASC

2. If results empty → no email sent (silent)

3. If results non-empty → Resend email to TRADE_APPLICATIONS_EMAIL:
   - Subject: "Trade reviews due ({N} accounts)"
   - HTML table: trading_name | contact_email | next_review_date | days_until
```

The cron worker lives in the same Worker as the main app via OpenNext's `scheduled` export. Verified locally with `wrangler dev --test-scheduled`.

## Trade Page Update

Add a new section to `src/app/trade/page.tsx` between the hero (section 1) and "Why it works behind the bar" (section 2).

- Style mirrors the existing "Already a trade customer?" card at `src/app/trade/page.tsx:144-162` but as a primary CTA
- Headline: "Stock Expedition Spiced"
- Sub: "Apply for a trade account. We review and respond within three working days."
- Button: "Apply for a trade account" → `/trade/apply/`, `gold-500` background, `jerry-green-900` text (matches existing primary button class)

The existing `TradeEnquiryForm` stays at the bottom of the page. The two paths now represent two distinct intents: "we want to buy" (apply) and "we want to talk" (enquire).

## Privacy Policy Update

Add the following section to `src/app/privacy-policy/page.tsx`:

> **Trade account applications**
>
> If you apply for a trade account, we collect information about your business, premises licensing, primary contact, and one director or owner. This includes a copy of your premises licence and photo identification of a director or owner.
>
> **Lawful basis:** We process this data to meet our legal obligations under HMRC's Alcohol Wholesaler Registration Scheme (AWRS) due diligence requirements, and our legitimate interest in verifying the businesses we trade with.
>
> **Retention:** Photo identification and premises licence copies are deleted from our systems 30 days after submission. Application details and verification records are retained for the life of the trade account and for six years after closure, in line with HMRC record-keeping requirements.
>
> **Recipients:** This data is accessible only to Jerry Can Spirits directors. It is stored in Cloudflare R2 (United Kingdom and European Union regions) and Cloudflare D1.
>
> **Your rights:** You can request access, correction, or deletion of your data by emailing hello@jerrycanspirits.co.uk. Deletion requests for active trade accounts will close the account.

## Accessibility Requirements

- Every input has an associated `<label htmlFor>`
- Required fields: `aria-required="true"` plus visual `*`
- Per-step error summary at the top of each step (`role="alert"` `aria-live="polite"`); focus moved to it on validation failure
- Step heading is `<h2 tabIndex={-1} ref={...}>` and receives focus on Next/Back nav
- Progress bar: `<div role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4} aria-label="Application progress">`
- File upload uses the visually-hidden native input pattern: `<input type="file" className="sr-only">` with a styled `<label>`. Fully keyboard accessible; screen readers announce correctly.
- Submit button uses both `disabled` and `aria-disabled` so assistive tech reads the reason

## Acceptance Criteria

- [ ] `/trade/apply` renders responsively; visual style matches `/contact/enquiries`
- [ ] Four steps; validation blocks progression on missing required fields
- [ ] Conditional fields (Companies House, AWRS URN, PSC, premises licensing) show/hide correctly based on legal structure and business type
- [ ] AWRS URN is **required** (blocks submission) when business type is Wholesaler or Distributor
- [ ] File uploads validate client-side and server-side (size + MIME magic bytes)
- [ ] Files upload on selection (not on final submit); replace flow works
- [ ] Step state persists to `sessionStorage` and clears on success
- [ ] API route: validates, moves R2 objects, inserts D1 rows (`trade_applications` + `trade_application_review_log`), sends Resend email with `.ics`, fires Klaviyo event, adds to list if opted in
- [ ] Trade page has working CTA above-the-fold-equivalent to the new form
- [ ] Privacy policy updated with trade application section
- [ ] Cron Trigger configured and verified locally with `wrangler dev --test-scheduled`
- [ ] Lighthouse accessibility score ≥ 95 on `/trade/apply`
- [ ] Manual end-to-end: submit complete application, admin email arrives with all fields + working signed file links + `.ics`, Klaviyo profile shows the event, `trade_applications` row created with status='pending' and `next_review_date` set 12 months out

## Out of Scope (v2)

- Admin review UI (approve/reject, fill verification fields) — v1 uses wrangler CLI or Cloudflare D1 dashboard
- Automated PIN issuance — manual on the founder side, drops into existing trade portal flow
- Applicant self-service status check
- Companies House API lookup pre-fill
- Server-side PDF receipt of submission
- Resend bounce/complaint webhooks

## Prerequisites (Manual, Before Deployment)

1. Verify `jerrycanspirits.co.uk` in Resend (SPF, DKIM, return-path CNAME — one-off)
2. Create R2 bucket `jerry-can-spirits-trade-docs` in Cloudflare dashboard
3. Configure R2 lifecycle rules in dashboard:
   - `pending/` → delete after 24 hours
   - `applications/` → delete after 30 days
4. Generate R2 API token (read+write to `jerry-can-spirits-trade-docs`) and set R2 env vars as Worker secrets
5. Set `KLAVIYO_TRADE_LIST_ID` after creating the list in Klaviyo
6. Build the Klaviyo flow triggered by the `Trade Application Submitted` event for the applicant acknowledgement email
