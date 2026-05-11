# Trade Account Application Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an AWRS-aligned trade account application form at `/trade/apply` with R2 file storage, D1 register, Resend admin notification with `.ics` review invite, Klaviyo acknowledgement flow, and a weekly cron review digest.

**Architecture:** Next.js App Router page (client) hits two Node-runtime API routes (`/api/trade-application/upload` for multipart file uploads, `/api/trade-application` for the JSON submission). Files live in Cloudflare R2 (`pending/` → `applications/` move on submit). The register lives in Cloudflare D1 (`trade_applications`, `trade_application_review_log`). Admin email goes via Resend with the `.ics` attached. Applicant acknowledgement is fired by Klaviyo flow. A weekly Cron Trigger queries D1 for upcoming reviews and emails a digest.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind, Cloudflare Workers (OpenNext), Cloudflare R2 + D1 + KV, `aws4fetch` for R2 S3 presigning, Resend (fetch, no SDK), Klaviyo API, Playwright for e2e.

**Spec:** `docs/superpowers/specs/2026-05-11-trade-application-form-design.md`

**Branch:** `feat/trade-application-form` (already created from `origin/main`, spec already committed)

---

## File Map

**Create:**
- `migrations/0014_trade_applications.sql`
- `src/lib/ics.ts`
- `src/lib/r2-presign.ts`
- `src/lib/resend.ts`
- `src/lib/trade-applications.ts`
- `src/lib/validators/trade-application.ts`
- `src/lib/validators/file-magic-bytes.ts`
- `src/app/api/trade-application/route.ts`
- `src/app/api/trade-application/upload/route.ts`
- `src/components/trade-application/types.ts`
- `src/components/trade-application/StepProgress.tsx`
- `src/components/trade-application/FileUpload.tsx`
- `src/components/trade-application/StepBusinessOwnership.tsx`
- `src/components/trade-application/StepPremises.tsx`
- `src/components/trade-application/StepContact.tsx`
- `src/components/trade-application/StepOrderIntent.tsx`
- `src/app/trade/apply/page.tsx`
- `src/lib/scheduled-trade-review.ts`
- `tests/e2e/trade-application.spec.ts`

**Modify:**
- `wrangler.jsonc` — R2 binding, cron trigger
- `cloudflare-env.d.ts` — new env vars, R2 binding
- `cloudflare-worker-entry.mjs` — add `scheduled` handler
- `.env.example` — document new env vars
- `package.json` — add `aws4fetch`
- `src/app/trade/page.tsx` — add primary CTA
- `src/app/privacy-policy/page.tsx` — add trade applications section

---

## Task 1: Project setup — dependencies, env types, .env.example, wrangler bindings

**Files:**
- Modify: `package.json`
- Modify: `cloudflare-env.d.ts`
- Modify: `.env.example`
- Modify: `wrangler.jsonc`

- [ ] **Step 1: Install `aws4fetch`**

Run: `npm install aws4fetch`

Expected: package added under `dependencies`, no audit failures.

- [ ] **Step 2: Update `cloudflare-env.d.ts`**

Add the new env vars and R2 binding. The file already has Klaviyo and trade portal secrets — add ours alongside.

```ts
interface CloudflareEnv {
  // KV Namespaces
  COCKTAIL_RATINGS: KVNamespace;
  SITE_OPS: KVNamespace;

  // D1 Database
  DB: D1Database;

  // R2 Buckets
  TRADE_DOCS: R2Bucket;

  // Secrets — Klaviyo
  KLAVIYO_PRIVATE_KEY: string;
  KLAVIYO_TRADE_LIST_ID: string;

  // Secrets — Resend
  RESEND_API_KEY: string;
  TRADE_APPLICATIONS_EMAIL: string;

  // Secrets — R2 presigning (S3-compatible API)
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;

  // ...existing entries unchanged...

  // Worker bindings
  ASSETS: Fetcher;
  WORKER_SELF_REFERENCE: Fetcher;
}
```

Keep all existing entries; the snippet above shows additions in context.

- [ ] **Step 3: Update `.env.example`**

Append:

```
# Resend — trade application admin emails
RESEND_API_KEY=
TRADE_APPLICATIONS_EMAIL=trade@jerrycanspirits.co.uk

# Klaviyo trade list for marketing opt-in
KLAVIYO_TRADE_LIST_ID=

# Cloudflare R2 S3-compatible API (for presigning download URLs in admin emails)
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_ACCOUNT_ID=
```

- [ ] **Step 4: Update `wrangler.jsonc`**

Add the R2 binding and cron trigger. The file already has `kv_namespaces` and `d1_databases` — add `r2_buckets` and `triggers` blocks.

```jsonc
"r2_buckets": [
  {
    // Trade application supporting documents (premises licence, director ID)
    // Lifecycle rules configured in Cloudflare dashboard:
    //   pending/      → delete after 24h
    //   applications/ → delete after 30 days
    "binding": "TRADE_DOCS",
    "bucket_name": "jerry-can-spirits-trade-docs"
  }
],
"triggers": {
  "crons": ["0 8 * * 1"]
},
```

- [ ] **Step 5: Verify build still passes**

Run: `npm run build`

Expected: Next.js build completes successfully. Type errors will surface only when the new env vars are referenced.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json cloudflare-env.d.ts .env.example wrangler.jsonc
git commit -m "chore: scaffold trade application form deps and bindings"
```

---

## Task 2: D1 migration for trade_applications register

**Files:**
- Create: `migrations/0014_trade_applications.sql`

- [ ] **Step 1: Write the migration SQL**

Create `migrations/0014_trade_applications.sql`:

```sql
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
```

- [ ] **Step 2: Apply locally and verify**

Run: `npx wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0014_trade_applications.sql`

Expected: All statements succeed. If `trade_accounts.application_id` already exists from a prior partial run, SQLite throws — in that case drop the local DB (`rm -rf .wrangler/state/v3/d1`) and re-run all migrations in order. The `CREATE TABLE IF NOT EXISTS` guards make the other statements safe to re-run.

- [ ] **Step 3: Verify schema**

Run: `npx wrangler d1 execute jerry-can-spirits-db --local --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'trade%';"`

Expected output includes: `trade_accounts`, `trade_applications`, `trade_application_review_log`.

- [ ] **Step 4: Commit**

```bash
git add migrations/0014_trade_applications.sql
git commit -m "feat: add trade_applications register schema"
```

---

## Task 3: ICS calendar invite generator

**Files:**
- Create: `src/lib/ics.ts`

The `.ics` file is plain text. Outlook, Apple Calendar, Google Calendar all accept the same minimal RFC 5545 structure.

- [ ] **Step 1: Write `src/lib/ics.ts`**

```ts
// Generate an RFC 5545 .ics calendar invite for a single all-day event.
// Used to attach yearly trade review reminders to admin notification emails.

export interface IcsEvent {
  /** UTC timestamp of the event (we use an all-day event keyed off this date) */
  startUtc: Date
  /** Event title shown in the calendar */
  title: string
  /** Long-form description (newlines are escaped) */
  description: string
  /** Stable unique identifier (use the application ID) */
  uid: string
  /** Mail address shown as organiser */
  organizerEmail: string
}

function formatIcsDate(d: Date): string {
  // YYYYMMDD format for all-day events
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

function formatIcsStamp(d: Date): string {
  // YYYYMMDDTHHMMSSZ
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  const hh = String(d.getUTCHours()).padStart(2, '0')
  const mm = String(d.getUTCMinutes()).padStart(2, '0')
  const ss = String(d.getUTCSeconds()).padStart(2, '0')
  return `${y}${m}${day}T${hh}${mm}${ss}Z`
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function generateIcs(event: IcsEvent): string {
  const dtStart = formatIcsDate(event.startUtc)
  const dtEndDate = new Date(event.startUtc)
  dtEndDate.setUTCDate(dtEndDate.getUTCDate() + 1)
  const dtEnd = formatIcsDate(dtEndDate)
  const stamp = formatIcsStamp(new Date())

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Jerry Can Spirits//Trade Review//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@jerrycanspirits.co.uk`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `ORGANIZER:mailto:${event.organizerEmail}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
```

- [ ] **Step 2: Spot-check the output**

Run a quick scratch test from a file or REPL of choice — pipe the output of `generateIcs` to a `.ics` file and open it in Calendar. Confirm a one-day event lands on the expected date with the right title.

If you cannot conveniently run TS from CLI, defer this verification to the API route integration test (Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/lib/ics.ts
git commit -m "feat: add ICS calendar invite generator"
```

---

## Task 4: R2 presigned URL helper (aws4fetch wrapper)

**Files:**
- Create: `src/lib/r2-presign.ts`

R2's S3-compatible API accepts SigV4 signed requests. `aws4fetch` (already installed) signs them. The S3 endpoint for an R2 bucket is `https://{account_id}.r2.cloudflarestorage.com/{bucket}/{key}`.

- [ ] **Step 1: Write `src/lib/r2-presign.ts`**

```ts
import { AwsClient } from 'aws4fetch'

interface PresignOptions {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  key: string
  /** Seconds until the URL expires. R2 caps at 7 days (604800). */
  expiresInSeconds: number
}

export async function presignR2GetUrl(opts: PresignOptions): Promise<string> {
  const client = new AwsClient({
    accessKeyId: opts.accessKeyId,
    secretAccessKey: opts.secretAccessKey,
    service: 's3',
    region: 'auto',
  })

  const url = new URL(
    `https://${opts.accountId}.r2.cloudflarestorage.com/${opts.bucket}/${encodeURIComponent(opts.key).replace(/%2F/g, '/')}`
  )
  url.searchParams.set('X-Amz-Expires', String(Math.min(opts.expiresInSeconds, 604800)))

  const signed = await client.sign(url.toString(), {
    method: 'GET',
    aws: { signQuery: true },
  })

  return signed.url
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/r2-presign.ts
git commit -m "feat: add R2 presigned URL helper"
```

Verification of presigning happens end-to-end in Task 11 once we can upload a real test object.

---

## Task 5: Resend client (fetch-based)

**Files:**
- Create: `src/lib/resend.ts`

Resend's REST API: `POST https://api.resend.com/emails` with bearer auth. Attachments are base64-encoded in the JSON body.

- [ ] **Step 1: Write `src/lib/resend.ts`**

```ts
interface ResendAttachment {
  filename: string
  /** Base64-encoded file contents */
  content: string
  /** MIME type, e.g. 'text/calendar' */
  contentType: string
}

interface SendEmailOptions {
  apiKey: string
  from: string
  to: string
  replyTo?: string
  subject: string
  html: string
  text: string
  attachments?: ResendAttachment[]
}

export interface SendEmailResult {
  id?: string
  ok: boolean
  error?: string
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  const body: Record<string, unknown> = {
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  }
  if (opts.replyTo) body.reply_to = opts.replyTo
  if (opts.attachments && opts.attachments.length > 0) {
    body.attachments = opts.attachments.map((a) => ({
      filename: a.filename,
      content: a.content,
      content_type: a.contentType,
    }))
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    return { ok: false, error: `Resend ${response.status}: ${errorText}` }
  }

  const data = (await response.json()) as { id?: string }
  return { ok: true, id: data.id }
}

/** Encode a UTF-8 string to base64 (Worker-compatible). */
export function toBase64(input: string): string {
  // btoa cannot handle non-Latin1 — encode through TextEncoder first.
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: add Resend client with attachment support"
```

---

## Task 6: Trade application validators

**Files:**
- Create: `src/lib/validators/trade-application.ts`

- [ ] **Step 1: Write `src/lib/validators/trade-application.ts`**

```ts
// Server-authoritative validators for the trade application submission.
// Each returns { ok: true } | { ok: false, error: string } so callers
// can build a per-field error report.

export type ValidationResult = { ok: true } | { ok: false, error: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
const COMPANIES_HOUSE_RE = /^([A-Z]{2}\d{6}|\d{8})$/
const AWRS_URN_RE = /^X[A-Z]{3}\d{11}$/
const VAT_RE = /^(GB)?(\d{9}|\d{12})$/i
const DIGITS_RE = /\d/g

export function validateEmail(value: string): ValidationResult {
  if (!value || value.length > 254) return { ok: false, error: 'Invalid email' }
  if (!EMAIL_RE.test(value)) return { ok: false, error: 'Invalid email format' }
  return { ok: true }
}

export function validatePostcode(value: string): ValidationResult {
  if (!value) return { ok: false, error: 'Postcode is required' }
  if (!UK_POSTCODE_RE.test(value.trim())) return { ok: false, error: 'Invalid UK postcode' }
  return { ok: true }
}

export function validatePhone(value: string): ValidationResult {
  const digits = (value.match(DIGITS_RE) ?? []).length
  if (digits < 10 || digits > 13) {
    return { ok: false, error: 'Phone number must contain 10–13 digits' }
  }
  return { ok: true }
}

export function validateCompaniesHouse(value: string): ValidationResult {
  if (!COMPANIES_HOUSE_RE.test(value)) {
    return { ok: false, error: 'Invalid Companies House number' }
  }
  return { ok: true }
}

export function validateAwrsUrn(value: string): ValidationResult {
  if (!AWRS_URN_RE.test(value)) {
    return { ok: false, error: 'Invalid AWRS URN (format: X + 3 letters + 11 digits)' }
  }
  return { ok: true }
}

export function validateVat(value: string): ValidationResult {
  if (!value) return { ok: true } // optional
  if (!VAT_RE.test(value.replace(/\s/g, ''))) {
    return { ok: false, error: 'Invalid VAT number' }
  }
  return { ok: true }
}

const REQUIRES_PREMISES_LICENCE = new Set([
  'Pub/Bar',
  'Restaurant',
  'Hotel',
  'Club',
  'Off-licence',
])

const REQUIRES_AWRS = new Set(['Wholesaler', 'Distributor'])

const REQUIRES_COMPANIES_HOUSE = new Set(['Ltd', 'LLP', 'PLC', 'CIC', 'Charity'])

export function requiresPremisesLicence(businessType: string): boolean {
  return REQUIRES_PREMISES_LICENCE.has(businessType)
}

export function requiresAwrs(businessType: string): boolean {
  return REQUIRES_AWRS.has(businessType)
}

export function requiresCompaniesHouse(legalStructure: string): boolean {
  return REQUIRES_COMPANIES_HOUSE.has(legalStructure)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators/trade-application.ts
git commit -m "feat: add trade application validators"
```

---

## Task 7: File magic-byte sniffer

**Files:**
- Create: `src/lib/validators/file-magic-bytes.ts`

- [ ] **Step 1: Write `src/lib/validators/file-magic-bytes.ts`**

```ts
// Magic-byte detection for the three allowed upload types.
// Header Content-Type is spoofable; the first few bytes of the file are not.

export type AllowedMime = 'application/pdf' | 'image/jpeg' | 'image/png'

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46] // %PDF
const JPEG_HEADER = [0xff, 0xd8, 0xff]
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function startsWith(buf: Uint8Array, prefix: number[]): boolean {
  if (buf.length < prefix.length) return false
  for (let i = 0; i < prefix.length; i++) {
    if (buf[i] !== prefix[i]) return false
  }
  return true
}

export function detectAllowedMime(buf: Uint8Array): AllowedMime | null {
  if (startsWith(buf, PDF_HEADER)) return 'application/pdf'
  if (startsWith(buf, JPEG_HEADER)) return 'image/jpeg'
  if (startsWith(buf, PNG_HEADER)) return 'image/png'
  return null
}

export function extensionForMime(mime: AllowedMime): string {
  switch (mime) {
    case 'application/pdf': return 'pdf'
    case 'image/jpeg': return 'jpg'
    case 'image/png': return 'png'
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/validators/file-magic-bytes.ts
git commit -m "feat: add file magic-byte detection"
```

---

## Task 8: Trade applications D1 helpers

**Files:**
- Create: `src/lib/trade-applications.ts`

- [ ] **Step 1: Write `src/lib/trade-applications.ts`**

```ts
// D1 query helpers for the trade_applications register.

export interface TradeApplicationInsert {
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number: string | null
  vat_number: string | null
  awrs_urn: string | null
  years_trading: number
  website: string | null
  trading_address_json: string
  registered_address_json: string | null
  premises_licence_number: string | null
  licensing_authority: string | null
  dps_name: string | null
  personal_licence_number: string | null
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  psc_json: string | null
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard: string | null
  notes: string | null
  marketing_opt_in: 0 | 1
  submitted_at: string
  next_review_date: string
  ip_address: string | null
  user_agent: string | null
}

export interface DueForReviewRow {
  id: string
  trading_name: string
  contact_email: string
  next_review_date: string
}

const INSERT_SQL = `
  INSERT INTO trade_applications (
    trading_name, legal_entity_name, legal_structure, business_type,
    companies_house_number, vat_number, awrs_urn, years_trading, website,
    trading_address_json, registered_address_json,
    premises_licence_number, licensing_authority, dps_name, personal_licence_number,
    contact_name, contact_role, contact_email, contact_phone, director_name, psc_json,
    expected_initial_volume, expected_monthly_volume, payment_terms_pref,
    how_heard, notes, marketing_opt_in,
    submitted_at, next_review_date, ip_address, user_agent
  ) VALUES (
    ?1, ?2, ?3, ?4,
    ?5, ?6, ?7, ?8, ?9,
    ?10, ?11,
    ?12, ?13, ?14, ?15,
    ?16, ?17, ?18, ?19, ?20, ?21,
    ?22, ?23, ?24,
    ?25, ?26, ?27,
    ?28, ?29, ?30, ?31
  ) RETURNING id
`

export async function insertTradeApplication(
  db: D1Database,
  data: TradeApplicationInsert,
): Promise<string> {
  const result = await db.prepare(INSERT_SQL).bind(
    data.trading_name, data.legal_entity_name, data.legal_structure, data.business_type,
    data.companies_house_number, data.vat_number, data.awrs_urn, data.years_trading, data.website,
    data.trading_address_json, data.registered_address_json,
    data.premises_licence_number, data.licensing_authority, data.dps_name, data.personal_licence_number,
    data.contact_name, data.contact_role, data.contact_email, data.contact_phone, data.director_name, data.psc_json,
    data.expected_initial_volume, data.expected_monthly_volume, data.payment_terms_pref,
    data.how_heard, data.notes, data.marketing_opt_in,
    data.submitted_at, data.next_review_date, data.ip_address, data.user_agent,
  ).first<{ id: string }>()
  if (!result) throw new Error('Insert returned no id')
  return result.id
}

export async function insertReviewLog(
  db: D1Database,
  args: {
    trade_application_id: string
    event_type: string
    reviewed_by: string
    next_review_date: string | null
    notes: string | null
    created_at: string
  },
): Promise<void> {
  await db.prepare(`
    INSERT INTO trade_application_review_log
      (trade_application_id, event_type, reviewed_by, next_review_date, notes, created_at)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6)
  `).bind(
    args.trade_application_id,
    args.event_type,
    args.reviewed_by,
    args.next_review_date,
    args.notes,
    args.created_at,
  ).run()
}

export async function getApplicationsDueForReview(
  db: D1Database,
  withinDays: number,
): Promise<DueForReviewRow[]> {
  const now = new Date().toISOString()
  const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000).toISOString()
  const result = await db.prepare(`
    SELECT id, trading_name, contact_email, next_review_date
    FROM trade_applications
    WHERE status IN ('approved', 'active')
      AND next_review_date BETWEEN ?1 AND ?2
    ORDER BY next_review_date ASC
  `).bind(now, cutoff).all<DueForReviewRow>()
  return result.results ?? []
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/trade-applications.ts
git commit -m "feat: add trade_applications D1 helpers"
```

---

## Task 9: Upload endpoint — `/api/trade-application/upload`

**Files:**
- Create: `src/app/api/trade-application/upload/route.ts`

This endpoint accepts a single file per request, validates it, and stores it under `pending/{uuid}` in R2. Returns the ticket so the form can reference it on final submit.

- [ ] **Step 1: Write `src/app/api/trade-application/upload/route.ts`**

```ts
// POST /api/trade-application/upload
// multipart/form-data with a single `file` field. Returns { ticket, filename }.
//
// Env vars used:
//   TRADE_DOCS (R2 binding)
//   SITE_OPS (KV binding for rate limit)

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { detectAllowedMime, extensionForMime } from '@/lib/validators/file-magic-bytes'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024
const UPLOAD_RATE_LIMIT = 30 // per hour per IP

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const r2 = env.TRADE_DOCS as R2Bucket

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'trade-upload', ip, UPLOAD_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 })
  }

  const buffer = new Uint8Array(await file.arrayBuffer())
  const detectedMime = detectAllowedMime(buffer)
  if (!detectedMime) {
    return NextResponse.json({ error: 'Unsupported file type. PDF, JPG, or PNG only.' }, { status: 400 })
  }

  const ticket = crypto.randomUUID()
  const key = `pending/${ticket}`
  const ext = extensionForMime(detectedMime)
  const originalName = file.name || `upload.${ext}`

  await r2.put(key, buffer, {
    httpMetadata: { contentType: detectedMime },
    customMetadata: {
      originalName,
      detectedMime,
      ts: new Date().toISOString(),
    },
  })

  return NextResponse.json({ ticket, filename: originalName, detectedMime })
}
```

- [ ] **Step 2: Smoke-test locally**

Run `npx wrangler dev` (or `npm run preview`) in one terminal, then in another:

```bash
echo "%PDF-1.4 test" > /tmp/test.pdf
curl -X POST http://localhost:8787/api/trade-application/upload \
  -H "Origin: https://jerrycanspirits.co.uk" \
  -F file=@/tmp/test.pdf
```

Expected: JSON `{ "ticket": "...", "filename": "test.pdf", "detectedMime": "application/pdf" }`.

Then verify the object exists in local R2:

```bash
npx wrangler r2 object list jerry-can-spirits-trade-docs --local
```

Expected: one `pending/{uuid}` entry.

If the local R2 binding isn't recognised, ensure `wrangler.jsonc` was reloaded after Task 1's edits.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/trade-application/upload/route.ts
git commit -m "feat: add trade application upload endpoint"
```

---

## Task 10: Submit endpoint — `/api/trade-application`

**Files:**
- Create: `src/app/api/trade-application/route.ts`

This is the biggest single piece of code. It orchestrates everything: validation → ticket resolution → R2 move → D1 insert → email → Klaviyo.

- [ ] **Step 1: Write `src/app/api/trade-application/route.ts`**

```ts
// POST /api/trade-application
// JSON body with all form fields + premisesLicenceTicket + directorIdTicket.
//
// Env vars used:
//   TRADE_DOCS                (R2 binding)
//   DB                        (D1 binding)
//   SITE_OPS                  (KV binding for rate limit + origin check)
//   KLAVIYO_PRIVATE_KEY       (existing)
//   KLAVIYO_TRADE_LIST_ID     (new — marketing opt-in target)
//   RESEND_API_KEY            (new — Resend bearer token)
//   TRADE_APPLICATIONS_EMAIL  (new — destination inbox, e.g. trade@jerrycanspirits.co.uk)
//   R2_ACCESS_KEY_ID          (new — R2 S3-compatible API)
//   R2_SECRET_ACCESS_KEY      (new)
//   R2_ACCOUNT_ID             (new)
//
// From address is hardcoded to hello@jerrycanspirits.co.uk (existing verified Resend sender).

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { emailDomainAcceptsMail } from '@/lib/email-validation'
import { detectAllowedMime, extensionForMime, type AllowedMime } from '@/lib/validators/file-magic-bytes'
import {
  validateEmail, validatePostcode, validatePhone,
  validateCompaniesHouse, validateAwrsUrn, validateVat,
  requiresPremisesLicence, requiresAwrs, requiresCompaniesHouse,
} from '@/lib/validators/trade-application'
import { insertTradeApplication, insertReviewLog, type TradeApplicationInsert } from '@/lib/trade-applications'
import { presignR2GetUrl } from '@/lib/r2-presign'
import { sendEmail, toBase64 } from '@/lib/resend'
import { generateIcs } from '@/lib/ics'

export const runtime = 'nodejs'

const KLAVIYO_API_BASE = 'https://a.klaviyo.com/api'
const KLAVIYO_REVISION = '2024-10-15'
const SUBMIT_RATE_LIMIT = 3 // per hour per IP
const FROM_EMAIL = 'Jerry Can Spirits <hello@jerrycanspirits.co.uk>'

interface Address {
  line1: string
  line2?: string
  town: string
  county?: string
  postcode: string
}

interface Psc {
  name: string
  dob_month: number
  dob_year: number
}

interface SubmitPayload {
  // Step 1
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number?: string
  vat_number?: string
  awrs_urn?: string
  years_trading: number
  website?: string
  psc?: Psc[]
  // Step 2
  trading_address: Address
  registered_address_same: boolean
  registered_address?: Address
  premises_licence_number?: string
  licensing_authority?: string
  dps_name?: string
  personal_licence_number?: string
  premises_licence_ticket?: string
  // Step 3
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  director_id_ticket: string
  // Step 4
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard?: string
  notes?: string
  declaration: boolean
  marketing_opt_in: boolean
  // Honeypot
  website_url?: string
}

function badRequest(error: string): Response {
  return NextResponse.json({ error }, { status: 400 })
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket

  let payload: SubmitPayload
  try {
    payload = (await request.json()) as SubmitPayload
  } catch {
    return badRequest('Invalid JSON body')
  }

  // Honeypot — silently accept to avoid tipping off bots
  if (payload.website_url && payload.website_url.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  // Rate limit
  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'trade-app', ip, SUBMIT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many submissions. Please try again later.' }, { status: 429 })
  }

  // --- Validate required fields ---
  const required: Array<[unknown, string]> = [
    [payload.trading_name, 'Trading name'],
    [payload.legal_entity_name, 'Legal entity name'],
    [payload.legal_structure, 'Legal structure'],
    [payload.business_type, 'Business type'],
    [payload.years_trading, 'Years trading'],
    [payload.contact_name, 'Contact name'],
    [payload.contact_role, 'Contact role'],
    [payload.contact_email, 'Contact email'],
    [payload.contact_phone, 'Contact phone'],
    [payload.director_name, 'Director name'],
    [payload.director_id_ticket, 'Director ID upload'],
    [payload.expected_initial_volume, 'Expected initial volume'],
    [payload.expected_monthly_volume, 'Expected monthly volume'],
    [payload.payment_terms_pref, 'Payment terms preference'],
  ]
  for (const [val, label] of required) {
    if (val === undefined || val === null || val === '') return badRequest(`${label} is required`)
  }
  if (!payload.declaration) return badRequest('Declaration must be accepted')

  // --- Conditional rules ---
  if (requiresCompaniesHouse(payload.legal_structure)) {
    if (!payload.companies_house_number) return badRequest('Companies House number is required for this legal structure')
    const ch = validateCompaniesHouse(payload.companies_house_number)
    if (!ch.ok) return badRequest(ch.error)
  }
  if (requiresAwrs(payload.business_type)) {
    if (!payload.awrs_urn) return badRequest('AWRS URN is required for wholesalers and distributors')
    const urn = validateAwrsUrn(payload.awrs_urn)
    if (!urn.ok) return badRequest(urn.error)
  }
  if (payload.vat_number) {
    const vat = validateVat(payload.vat_number)
    if (!vat.ok) return badRequest(vat.error)
  }
  if (requiresPremisesLicence(payload.business_type)) {
    if (!payload.premises_licence_number) return badRequest('Premises licence number is required')
    if (!payload.licensing_authority) return badRequest('Issuing local authority is required')
    if (!payload.dps_name) return badRequest('Designated Premises Supervisor is required')
    if (!payload.personal_licence_number) return badRequest('Personal licence number is required')
    if (!payload.premises_licence_ticket) return badRequest('Premises licence upload is required')
  }

  // --- Format validation ---
  const emailCheck = validateEmail(payload.contact_email)
  if (!emailCheck.ok) return badRequest(emailCheck.error)
  if (!(await emailDomainAcceptsMail(payload.contact_email))) {
    return badRequest('That email domain does not appear to accept mail.')
  }
  const phoneCheck = validatePhone(payload.contact_phone)
  if (!phoneCheck.ok) return badRequest(phoneCheck.error)

  // Addresses
  if (!payload.trading_address) return badRequest('Trading address is required')
  const tradingPc = validatePostcode(payload.trading_address.postcode)
  if (!tradingPc.ok) return badRequest(`Trading address: ${tradingPc.error}`)
  if (!payload.registered_address_same) {
    if (!payload.registered_address) return badRequest('Registered address is required')
    const regPc = validatePostcode(payload.registered_address.postcode)
    if (!regPc.ok) return badRequest(`Registered address: ${regPc.error}`)
  }

  // --- Resolve upload tickets ---
  async function resolveTicket(ticket: string): Promise<{ object: R2ObjectBody, mime: AllowedMime } | null> {
    const obj = await r2.get(`pending/${ticket}`)
    if (!obj) return null
    const buf = new Uint8Array(await obj.arrayBuffer())
    const mime = detectAllowedMime(buf)
    if (!mime) return null
    // Re-get because we consumed the body
    const fresh = await r2.get(`pending/${ticket}`)
    if (!fresh) return null
    return { object: fresh, mime }
  }

  const directorIdResolved = await resolveTicket(payload.director_id_ticket)
  if (!directorIdResolved) return badRequest('Director ID upload is invalid or expired. Please re-upload.')

  let premisesLicenceResolved: { object: R2ObjectBody, mime: AllowedMime } | null = null
  if (payload.premises_licence_ticket) {
    premisesLicenceResolved = await resolveTicket(payload.premises_licence_ticket)
    if (!premisesLicenceResolved) return badRequest('Premises licence upload is invalid or expired. Please re-upload.')
  }

  // --- Insert D1 row + move R2 objects ---
  const submittedAt = new Date()
  const submittedAtIso = submittedAt.toISOString()
  const nextReview = new Date(submittedAt)
  nextReview.setUTCFullYear(nextReview.getUTCFullYear() + 1)
  const nextReviewIso = nextReview.toISOString()

  const insert: TradeApplicationInsert = {
    trading_name: payload.trading_name.trim(),
    legal_entity_name: payload.legal_entity_name.trim(),
    legal_structure: payload.legal_structure,
    business_type: payload.business_type,
    companies_house_number: payload.companies_house_number?.trim() || null,
    vat_number: payload.vat_number?.trim() || null,
    awrs_urn: payload.awrs_urn?.trim() || null,
    years_trading: Number(payload.years_trading),
    website: payload.website?.trim() || null,
    trading_address_json: JSON.stringify(payload.trading_address),
    registered_address_json: payload.registered_address_same
      ? null
      : JSON.stringify(payload.registered_address),
    premises_licence_number: payload.premises_licence_number?.trim() || null,
    licensing_authority: payload.licensing_authority?.trim() || null,
    dps_name: payload.dps_name?.trim() || null,
    personal_licence_number: payload.personal_licence_number?.trim() || null,
    contact_name: payload.contact_name.trim(),
    contact_role: payload.contact_role.trim(),
    contact_email: payload.contact_email.trim().toLowerCase(),
    contact_phone: payload.contact_phone.trim(),
    director_name: payload.director_name.trim(),
    psc_json: payload.psc && payload.psc.length > 0 ? JSON.stringify(payload.psc) : null,
    expected_initial_volume: payload.expected_initial_volume,
    expected_monthly_volume: payload.expected_monthly_volume,
    payment_terms_pref: payload.payment_terms_pref,
    how_heard: payload.how_heard?.trim() || null,
    notes: payload.notes?.trim() || null,
    marketing_opt_in: payload.marketing_opt_in ? 1 : 0,
    submitted_at: submittedAtIso,
    next_review_date: nextReviewIso,
    ip_address: ip === 'unknown' ? null : ip,
    user_agent: request.headers.get('user-agent'),
  }

  let appId: string
  try {
    appId = await insertTradeApplication(db, insert)
    await insertReviewLog(db, {
      trade_application_id: appId,
      event_type: 'submitted',
      reviewed_by: 'system',
      next_review_date: nextReviewIso,
      notes: null,
      created_at: submittedAtIso,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application' } })
    return NextResponse.json({ error: 'We could not save your application. Please try again.' }, { status: 500 })
  }

  // Move R2 objects from pending/ to applications/{appId}/
  async function moveTicket(ticket: string, name: string, mime: AllowedMime): Promise<string> {
    const sourceKey = `pending/${ticket}`
    const targetKey = `applications/${appId}/${name}.${extensionForMime(mime)}`
    const src = await r2.get(sourceKey)
    if (!src) throw new Error(`pending object ${sourceKey} disappeared`)
    await r2.put(targetKey, src.body, {
      httpMetadata: { contentType: mime },
      customMetadata: { ...(src.customMetadata ?? {}), applicationId: appId },
    })
    await r2.delete(sourceKey)
    return targetKey
  }

  let directorIdKey: string
  let premisesLicenceKey: string | null = null
  try {
    directorIdKey = await moveTicket(payload.director_id_ticket, 'director-id', directorIdResolved.mime)
    if (premisesLicenceResolved) {
      premisesLicenceKey = await moveTicket(payload.premises_licence_ticket!, 'premises-licence', premisesLicenceResolved.mime)
    }
  } catch (err) {
    // Roll back: best-effort delete of any partial uploads under this appId
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'r2-move' } })
    try {
      const list = await r2.list({ prefix: `applications/${appId}/` })
      await Promise.all(list.objects.map((o) => r2.delete(o.key)))
    } catch { /* swallow rollback failures */ }
    return NextResponse.json({ error: 'Upload could not be finalised. Please try again.' }, { status: 500 })
  }

  // --- Presign download URLs (7 days) ---
  const expires = 7 * 24 * 3600
  let directorIdUrl = ''
  let premisesLicenceUrl: string | null = null
  try {
    directorIdUrl = await presignR2GetUrl({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: 'jerry-can-spirits-trade-docs',
      key: directorIdKey,
      expiresInSeconds: expires,
    })
    if (premisesLicenceKey) {
      premisesLicenceUrl = await presignR2GetUrl({
        accountId: env.R2_ACCOUNT_ID,
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: 'jerry-can-spirits-trade-docs',
        key: premisesLicenceKey,
        expiresInSeconds: expires,
      })
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'r2-presign' } })
    // Continue without URLs — admin email will include the application ID; founder can pull files manually
  }

  // --- Generate .ics ---
  const ics = generateIcs({
    startUtc: nextReview,
    title: `Yearly trade review: ${payload.trading_name}`,
    description: `Trade application ${appId}\nContact: ${payload.contact_name} <${payload.contact_email}>\nBusiness type: ${payload.business_type}`,
    uid: appId,
    organizerEmail: 'hello@jerrycanspirits.co.uk',
  })

  // --- Admin email ---
  const html = renderAdminEmailHtml({
    applicationId: appId,
    payload,
    submittedAt: submittedAtIso,
    nextReview: nextReviewIso,
    directorIdUrl,
    premisesLicenceUrl,
    urlExpiry: new Date(Date.now() + expires * 1000).toISOString(),
  })
  const text = renderAdminEmailText({
    applicationId: appId,
    payload,
    submittedAt: submittedAtIso,
    nextReview: nextReviewIso,
    directorIdUrl,
    premisesLicenceUrl,
  })

  try {
    const result = await sendEmail({
      apiKey: env.RESEND_API_KEY,
      from: FROM_EMAIL,
      to: env.TRADE_APPLICATIONS_EMAIL,
      replyTo: payload.contact_email,
      subject: `Trade Application: ${payload.trading_name} (${payload.business_type})`,
      html,
      text,
      attachments: [
        {
          filename: `trade-review-${appId}.ics`,
          content: toBase64(ics),
          contentType: 'text/calendar',
        },
      ],
    })
    if (!result.ok) {
      Sentry.captureMessage(`Resend send failed: ${result.error}`, { tags: { route: 'trade-application' } })
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'resend' } })
  }

  // --- Klaviyo event (non-sensitive props only) ---
  try {
    await fireKlaviyoEvent({
      apiKey: env.KLAVIYO_PRIVATE_KEY,
      contactEmail: payload.contact_email.toLowerCase(),
      contactName: payload.contact_name,
      tradingName: payload.trading_name,
      businessType: payload.business_type,
      expectedInitial: payload.expected_initial_volume,
      expectedMonthly: payload.expected_monthly_volume,
      applicationId: appId,
      submissionDate: submittedAtIso,
      marketingOptIn: payload.marketing_opt_in,
      listId: env.KLAVIYO_TRADE_LIST_ID,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'trade-application', phase: 'klaviyo' } })
  }

  return NextResponse.json({ success: true, applicationId: appId })
}

// ── Email rendering ──────────────────────────────────────────────────

interface EmailRenderArgs {
  applicationId: string
  payload: SubmitPayload
  submittedAt: string
  nextReview: string
  directorIdUrl: string
  premisesLicenceUrl: string | null
  urlExpiry?: string
}

function row(label: string, value: string | number | null | undefined): string {
  const v = value === null || value === undefined || value === '' ? '—' : String(value)
  return `<tr><td style="padding:4px 12px 4px 0;color:#5a6168;vertical-align:top">${label}</td><td style="padding:4px 0;color:#0a0a0a">${escapeHtml(v)}</td></tr>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderAdminEmailHtml(args: EmailRenderArgs): string {
  const p = args.payload
  const addr = p.trading_address
  const regAddr = p.registered_address_same ? null : p.registered_address
  const psc = p.psc ?? []
  const fileLinks: string[] = []
  if (args.directorIdUrl) fileLinks.push(`<a href="${args.directorIdUrl}">Download director ID</a>`)
  if (args.premisesLicenceUrl) fileLinks.push(`<a href="${args.premisesLicenceUrl}">Download premises licence</a>`)
  const linksHtml = fileLinks.length > 0
    ? `<p style="margin:12px 0">${fileLinks.join(' &nbsp;·&nbsp; ')}<br/><small style="color:#5a6168">Links expire ${args.urlExpiry?.split('T')[0] ?? 'in 7 days'}</small></p>`
    : '<p style="margin:12px 0;color:#a00">File download links could not be generated. Pull files manually from R2 under applications/' + args.applicationId + '/</p>'

  return `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0a0a;max-width:680px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 8px">Trade Application: ${escapeHtml(p.trading_name)}</h1>
<p style="color:#5a6168;margin:0 0 16px">Application ID: <code>${args.applicationId}</code> · Submitted ${args.submittedAt} · Next review ${args.nextReview.split('T')[0]}</p>
${linksHtml}
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 1 — Business & Ownership</h2>
<table style="border-collapse:collapse;width:100%">
${row('Trading name', p.trading_name)}
${row('Legal entity', p.legal_entity_name)}
${row('Legal structure', p.legal_structure)}
${row('Business type', p.business_type)}
${row('Companies House', p.companies_house_number)}
${row('VAT number', p.vat_number)}
${row('AWRS URN', p.awrs_urn)}
${row('Years trading', p.years_trading)}
${row('Website', p.website)}
${psc.map((person, i) => row(`PSC ${i + 1}`, `${person.name} (DOB ${person.dob_month}/${person.dob_year})`)).join('')}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 2 — Premises & Licensing</h2>
<table style="border-collapse:collapse;width:100%">
${row('Trading address', `${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.town}${addr.county ? ', ' + addr.county : ''}, ${addr.postcode}`)}
${regAddr ? row('Registered address', `${regAddr.line1}${regAddr.line2 ? ', ' + regAddr.line2 : ''}, ${regAddr.town}${regAddr.county ? ', ' + regAddr.county : ''}, ${regAddr.postcode}`) : row('Registered address', 'Same as trading')}
${row('Premises licence #', p.premises_licence_number)}
${row('Issuing authority', p.licensing_authority)}
${row('DPS', p.dps_name)}
${row('Personal licence #', p.personal_licence_number)}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 3 — Contact & Director</h2>
<table style="border-collapse:collapse;width:100%">
${row('Contact', `${p.contact_name} (${p.contact_role})`)}
${row('Email', p.contact_email)}
${row('Phone', p.contact_phone)}
${row('Director / owner', p.director_name)}
</table>
<h2 style="font-size:14px;text-transform:uppercase;letter-spacing:0.1em;color:#5a6168;margin:24px 0 8px">Step 4 — Order Intent</h2>
<table style="border-collapse:collapse;width:100%">
${row('Initial volume', p.expected_initial_volume)}
${row('Monthly volume', p.expected_monthly_volume)}
${row('Payment terms', p.payment_terms_pref)}
${row('How heard', p.how_heard)}
${row('Notes', p.notes)}
${row('Marketing opt-in', p.marketing_opt_in ? 'Yes' : 'No')}
</table>
<p style="color:#5a6168;font-size:12px;margin:24px 0 0">Reply directly to this email to respond to the applicant.</p>
</body></html>`
}

function renderAdminEmailText(args: EmailRenderArgs): string {
  const p = args.payload
  const lines: string[] = [
    `Trade Application: ${p.trading_name}`,
    `Application ID: ${args.applicationId}`,
    `Submitted: ${args.submittedAt}`,
    `Next review: ${args.nextReview.split('T')[0]}`,
    '',
    `Director ID: ${args.directorIdUrl || 'link unavailable — pull from R2'}`,
    args.premisesLicenceUrl ? `Premises licence: ${args.premisesLicenceUrl}` : '',
    '',
    '— Business —',
    `Trading: ${p.trading_name}`,
    `Legal entity: ${p.legal_entity_name} (${p.legal_structure})`,
    `Business type: ${p.business_type}`,
    `Companies House: ${p.companies_house_number ?? '—'}`,
    `VAT: ${p.vat_number ?? '—'}`,
    `AWRS URN: ${p.awrs_urn ?? '—'}`,
    `Years trading: ${p.years_trading}`,
    '',
    '— Contact —',
    `${p.contact_name} (${p.contact_role}) · ${p.contact_email} · ${p.contact_phone}`,
    `Director: ${p.director_name}`,
    '',
    '— Order intent —',
    `Initial: ${p.expected_initial_volume} · Monthly: ${p.expected_monthly_volume} · Terms: ${p.payment_terms_pref}`,
    `How heard: ${p.how_heard ?? '—'}`,
    `Notes: ${p.notes ?? '—'}`,
    `Marketing opt-in: ${p.marketing_opt_in ? 'Yes' : 'No'}`,
  ]
  return lines.filter(Boolean).join('\n')
}

// ── Klaviyo ──────────────────────────────────────────────────────────

async function fireKlaviyoEvent(args: {
  apiKey: string
  contactEmail: string
  contactName: string
  tradingName: string
  businessType: string
  expectedInitial: string
  expectedMonthly: string
  applicationId: string
  submissionDate: string
  marketingOptIn: boolean
  listId: string
}): Promise<void> {
  const commonHeaders = {
    Authorization: `Klaviyo-API-Key ${args.apiKey}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
    revision: KLAVIYO_REVISION,
  }

  // 1. Create or find the profile
  const profilePayload = {
    data: {
      type: 'profile',
      attributes: {
        email: args.contactEmail,
        first_name: args.contactName.split(' ')[0],
        last_name: args.contactName.split(' ').slice(1).join(' ') || '',
        properties: {
          last_contact_date: args.submissionDate,
          last_contact_type: 'trade_application',
        },
      },
    },
  }

  let profileId: string | undefined
  const createRes = await fetch(`${KLAVIYO_API_BASE}/profiles/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(profilePayload),
  })
  if (createRes.ok) {
    const data = await createRes.json() as { data?: { id?: string } }
    profileId = data.data?.id
  } else if (createRes.status === 409) {
    if (/^[A-Za-z0-9.@_+-]+$/.test(args.contactEmail)) {
      const filter = encodeURIComponent(`equals(email,"${args.contactEmail}")`)
      const searchRes = await fetch(`${KLAVIYO_API_BASE}/profiles/?filter=${filter}`, {
        headers: commonHeaders as Record<string, string>,
      })
      if (searchRes.ok) {
        const data = await searchRes.json() as { data?: { id?: string }[] }
        profileId = data.data?.[0]?.id
      }
    }
  } else {
    throw new Error(`Klaviyo profile create failed: ${createRes.status}`)
  }

  // 2. Fire the event
  const eventPayload = {
    data: {
      type: 'event',
      attributes: {
        properties: {
          trading_name: args.tradingName,
          business_type: args.businessType,
          contact_name: args.contactName,
          expected_initial_volume: args.expectedInitial,
          expected_monthly_volume: args.expectedMonthly,
          application_id: args.applicationId,
          submission_date: args.submissionDate,
        },
        metric: { data: { type: 'metric', attributes: { name: 'Trade Application Submitted' } } },
        profile: { data: { type: 'profile', attributes: { email: args.contactEmail } } },
      },
    },
  }
  await fetch(`${KLAVIYO_API_BASE}/events/`, {
    method: 'POST',
    headers: commonHeaders,
    body: JSON.stringify(eventPayload),
  })

  // 3. Subscribe to trade list if opted in
  if (args.marketingOptIn && profileId && args.listId) {
    await fetch(`${KLAVIYO_API_BASE}/lists/${args.listId}/relationships/profiles/`, {
      method: 'POST',
      headers: commonHeaders,
      body: JSON.stringify({ data: [{ type: 'profile', id: profileId }] }),
    })
  }
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: Next.js build completes; no TypeScript errors. If `Sentry` import fails, check whether the existing project uses `@sentry/nextjs` from another route (it does — `contact/route.ts`). If types complain about `R2ObjectBody`, confirm the R2 binding type is picked up from `cloudflare-env.d.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/trade-application/route.ts
git commit -m "feat: add trade application submission endpoint"
```

End-to-end verification of this route happens in Task 18 once the form exists.

---

## Task 11: Form types shared by the page and its step components

**Files:**
- Create: `src/components/trade-application/types.ts`

- [ ] **Step 1: Write `src/components/trade-application/types.ts`**

```ts
export interface Address {
  line1: string
  line2: string
  town: string
  county: string
  postcode: string
}

export interface Psc {
  name: string
  dob_month: string // form holds strings; coerced to number on submit
  dob_year: string
}

export interface UploadedFileRef {
  ticket: string
  filename: string
}

export interface ApplicationFormState {
  // Step 1
  trading_name: string
  legal_entity_name: string
  legal_structure: string
  business_type: string
  companies_house_number: string
  vat_number: string
  awrs_urn: string
  years_trading: string
  website: string
  psc: Psc[]
  // Step 2
  trading_address: Address
  registered_address_same: boolean
  registered_address: Address
  premises_licence_number: string
  licensing_authority: string
  dps_name: string
  personal_licence_number: string
  premises_licence_file: UploadedFileRef | null
  // Step 3
  contact_name: string
  contact_role: string
  contact_email: string
  contact_phone: string
  director_name: string
  director_id_file: UploadedFileRef | null
  // Step 4
  expected_initial_volume: string
  expected_monthly_volume: string
  payment_terms_pref: string
  how_heard: string
  notes: string
  declaration: boolean
  marketing_opt_in: boolean
  // Honeypot
  website_url: string
}

export const EMPTY_ADDRESS: Address = {
  line1: '', line2: '', town: '', county: '', postcode: '',
}

export const INITIAL_STATE: ApplicationFormState = {
  trading_name: '',
  legal_entity_name: '',
  legal_structure: '',
  business_type: '',
  companies_house_number: '',
  vat_number: '',
  awrs_urn: '',
  years_trading: '',
  website: '',
  psc: [],
  trading_address: { ...EMPTY_ADDRESS },
  registered_address_same: true,
  registered_address: { ...EMPTY_ADDRESS },
  premises_licence_number: '',
  licensing_authority: '',
  dps_name: '',
  personal_licence_number: '',
  premises_licence_file: null,
  contact_name: '',
  contact_role: '',
  contact_email: '',
  contact_phone: '',
  director_name: '',
  director_id_file: null,
  expected_initial_volume: '',
  expected_monthly_volume: '',
  payment_terms_pref: '',
  how_heard: '',
  notes: '',
  declaration: false,
  marketing_opt_in: false,
  website_url: '',
}

export const LEGAL_STRUCTURES = ['Sole Trader', 'Partnership', 'Ltd', 'LLP', 'PLC', 'CIC', 'Charity', 'Other']
export const BUSINESS_TYPES = ['Pub/Bar', 'Restaurant', 'Hotel', 'Club', 'Off-licence', 'Wholesaler', 'Distributor', 'Other']
export const VOLUMES = ['<12 bottles', '12–36', '36–72', '72–144', '144+']
export const PAYMENT_TERMS = ['Pro-forma', '14 days', '30 days']

export const STRUCTURES_REQUIRING_CH = new Set(['Ltd', 'LLP', 'PLC', 'CIC', 'Charity'])
export const TYPES_REQUIRING_AWRS = new Set(['Wholesaler', 'Distributor'])
export const TYPES_REQUIRING_LICENCE = new Set(['Pub/Bar', 'Restaurant', 'Hotel', 'Club', 'Off-licence'])
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/types.ts
git commit -m "feat: trade application form types and constants"
```

---

## Task 12: StepProgress component

**Files:**
- Create: `src/components/trade-application/StepProgress.tsx`

- [ ] **Step 1: Write `src/components/trade-application/StepProgress.tsx`**

```tsx
interface StepProgressProps {
  step: number
  total: number
}

const LABELS = ['Business', 'Premises', 'Contact', 'Order intent']

export function StepProgress({ step, total }: StepProgressProps) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm text-parchment-300 uppercase tracking-widest">
          Step {step} of {total} — {LABELS[step - 1]}
        </p>
        <p className="text-xs text-parchment-400">{pct}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Application progress"
        className="h-1.5 w-full bg-jerry-green-700/50 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/StepProgress.tsx
git commit -m "feat: trade application step progress bar"
```

---

## Task 13: FileUpload component (uploads on selection)

**Files:**
- Create: `src/components/trade-application/FileUpload.tsx`

- [ ] **Step 1: Write `src/components/trade-application/FileUpload.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'
import type { UploadedFileRef } from './types'

interface FileUploadProps {
  id: string
  label: string
  required?: boolean
  value: UploadedFileRef | null
  onChange: (value: UploadedFileRef | null) => void
}

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const MAX_BYTES = 5 * 1024 * 1024

export function FileUpload({ id, label, required, value, onChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleSelect = async (file: File | null) => {
    setError(null)
    if (!file) return
    if (file.size > MAX_BYTES) {
      setError('File exceeds 5MB limit.')
      return
    }
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only PDF, JPG, or PNG files are accepted.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/trade-application/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed.' })) as { error?: string }
        setError(data.error ?? 'Upload failed.')
        return
      }
      const data = await res.json() as UploadedFileRef
      onChange(data)
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-parchment-200 mb-2">
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        aria-required={required ? 'true' : undefined}
        className="sr-only"
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : value ? 'Replace file' : 'Choose file'}
        </button>
        {value && (
          <span className="text-sm text-parchment-200 truncate" title={value.filename}>
            {value.filename}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-parchment-400">PDF, JPG, or PNG. Max 5MB.</p>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/FileUpload.tsx
git commit -m "feat: trade application file upload component"
```

---

## Task 14: Step 1 — Business & Ownership

**Files:**
- Create: `src/components/trade-application/StepBusinessOwnership.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import type { ApplicationFormState, Psc } from './types'
import {
  LEGAL_STRUCTURES, BUSINESS_TYPES,
  STRUCTURES_REQUIRING_CH, TYPES_REQUIRING_AWRS,
} from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepBusinessOwnership({ data, errors, onChange }: Props) {
  const showCh = STRUCTURES_REQUIRING_CH.has(data.legal_structure)
  const showAwrs = TYPES_REQUIRING_AWRS.has(data.business_type)
  const showPsc = ['Ltd', 'LLP', 'PLC', 'CIC'].includes(data.legal_structure)

  function updatePsc(index: number, key: keyof Psc, value: string) {
    const next = [...data.psc]
    next[index] = { ...next[index], [key]: value }
    onChange('psc', next)
  }

  function addPsc() {
    if (data.psc.length >= 2) return
    onChange('psc', [...data.psc, { name: '', dob_month: '', dob_year: '' }])
  }

  function removePsc(index: number) {
    onChange('psc', data.psc.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="trading_name" label="Trading name" required error={errors.trading_name}>
          <input id="trading_name" className={inputClass} aria-required="true"
            value={data.trading_name} onChange={(e) => onChange('trading_name', e.target.value)} />
        </Field>
        <Field id="legal_entity_name" label="Legal entity name" required error={errors.legal_entity_name}>
          <input id="legal_entity_name" className={inputClass} aria-required="true"
            value={data.legal_entity_name} onChange={(e) => onChange('legal_entity_name', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="legal_structure" label="Legal structure" required error={errors.legal_structure}>
          <select id="legal_structure" className={inputClass} aria-required="true"
            value={data.legal_structure} onChange={(e) => onChange('legal_structure', e.target.value)}>
            <option value="">Select</option>
            {LEGAL_STRUCTURES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field id="business_type" label="Business type" required error={errors.business_type}>
          <select id="business_type" className={inputClass} aria-required="true"
            value={data.business_type} onChange={(e) => onChange('business_type', e.target.value)}>
            <option value="">Select</option>
            {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      {showCh && (
        <Field id="companies_house_number" label="Companies House number" required error={errors.companies_house_number}>
          <input id="companies_house_number" className={inputClass} aria-required="true"
            placeholder="e.g. 12345678" maxLength={8}
            value={data.companies_house_number} onChange={(e) => onChange('companies_house_number', e.target.value.toUpperCase())} />
        </Field>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="vat_number" label="VAT number" hint="If VAT-registered" error={errors.vat_number}>
          <input id="vat_number" className={inputClass}
            placeholder="GB123456789"
            value={data.vat_number} onChange={(e) => onChange('vat_number', e.target.value.toUpperCase())} />
        </Field>
        {showAwrs && (
          <Field id="awrs_urn" label="AWRS URN" required error={errors.awrs_urn}
            hint="Format: X + 3 letters + 11 digits">
            <input id="awrs_urn" className={inputClass} aria-required="true"
              placeholder="XAAW00000123456" maxLength={15}
              value={data.awrs_urn} onChange={(e) => onChange('awrs_urn', e.target.value.toUpperCase())} />
          </Field>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field id="years_trading" label="Years trading" required error={errors.years_trading}>
          <input id="years_trading" type="number" min={0} max={200} className={inputClass} aria-required="true"
            value={data.years_trading} onChange={(e) => onChange('years_trading', e.target.value)} />
        </Field>
        <Field id="website" label="Website" hint="Optional" error={errors.website}>
          <input id="website" type="url" className={inputClass}
            placeholder="https://"
            value={data.website} onChange={(e) => onChange('website', e.target.value)} />
        </Field>
      </div>

      {showPsc && (
        <div className="border border-gold-500/20 rounded-lg p-5 bg-jerry-green-900/30">
          <h3 className="text-sm font-medium text-parchment-100 mb-4">Persons of Significant Control</h3>
          {data.psc.length === 0 && (
            <p className="text-xs text-parchment-400 mb-3">Add anyone with 25%+ ownership or voting rights. Up to two for now.</p>
          )}
          {data.psc.map((p, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input className={inputClass} placeholder="Name" aria-label={`PSC ${i + 1} name`}
                value={p.name} onChange={(e) => updatePsc(i, 'name', e.target.value)} />
              <input className={inputClass} placeholder="DOB month" type="number" min={1} max={12} aria-label={`PSC ${i + 1} DOB month`}
                value={p.dob_month} onChange={(e) => updatePsc(i, 'dob_month', e.target.value)} />
              <div className="flex gap-2">
                <input className={inputClass + ' flex-1'} placeholder="DOB year" type="number" min={1900} max={new Date().getFullYear()} aria-label={`PSC ${i + 1} DOB year`}
                  value={p.dob_year} onChange={(e) => updatePsc(i, 'dob_year', e.target.value)} />
                <button type="button" onClick={() => removePsc(i)} className="px-3 py-2 text-sm text-parchment-300 border border-gold-500/30 rounded-lg hover:bg-jerry-green-700/30">Remove</button>
              </div>
            </div>
          ))}
          {data.psc.length < 2 && (
            <button type="button" onClick={addPsc} className="text-sm text-gold-300 hover:text-gold-200 underline">
              Add{data.psc.length > 0 ? ' another' : ''} PSC
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ id, label, required, hint, error, children }: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}{required && <span aria-hidden="true"> *</span>}
        {hint && <span className="text-xs text-parchment-400 font-normal ml-2">({hint})</span>}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-sm text-red-300">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/StepBusinessOwnership.tsx
git commit -m "feat: trade application step 1 — business & ownership"
```

---

## Task 15: Step 2 — Premises & Licensing

**Files:**
- Create: `src/components/trade-application/StepPremises.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { FileUpload } from './FileUpload'
import type { ApplicationFormState, Address } from './types'
import { TYPES_REQUIRING_LICENCE } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepPremises({ data, errors, onChange }: Props) {
  const showLicensing = TYPES_REQUIRING_LICENCE.has(data.business_type)

  function updateAddress(which: 'trading_address' | 'registered_address', field: keyof Address, value: string) {
    onChange(which, { ...data[which], [field]: value })
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-medium text-parchment-100 mb-3">Trading address</legend>
        <AddressFields prefix="trading" address={data.trading_address}
          onField={(f, v) => updateAddress('trading_address', f, v)} errors={errors} />
      </fieldset>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500"
          checked={data.registered_address_same}
          onChange={(e) => onChange('registered_address_same', e.target.checked)} />
        <span className="text-sm text-parchment-200">Registered address is the same as the trading address</span>
      </label>

      {!data.registered_address_same && (
        <fieldset>
          <legend className="text-sm font-medium text-parchment-100 mb-3">Registered address</legend>
          <AddressFields prefix="registered" address={data.registered_address}
            onField={(f, v) => updateAddress('registered_address', f, v)} errors={errors} />
        </fieldset>
      )}

      {showLicensing && (
        <div className="border border-gold-500/20 rounded-lg p-5 bg-jerry-green-900/30 space-y-6">
          <h3 className="text-sm font-medium text-parchment-100">Premises licensing</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="premises_licence_number" className={labelClass}>Premises licence number *</label>
              <input id="premises_licence_number" className={inputClass} aria-required="true"
                value={data.premises_licence_number} onChange={(e) => onChange('premises_licence_number', e.target.value)} />
              {errors.premises_licence_number && <p role="alert" className="mt-1 text-sm text-red-300">{errors.premises_licence_number}</p>}
            </div>
            <div>
              <label htmlFor="licensing_authority" className={labelClass}>Issuing local authority *</label>
              <input id="licensing_authority" className={inputClass} aria-required="true"
                value={data.licensing_authority} onChange={(e) => onChange('licensing_authority', e.target.value)} />
              {errors.licensing_authority && <p role="alert" className="mt-1 text-sm text-red-300">{errors.licensing_authority}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dps_name" className={labelClass}>Designated Premises Supervisor *</label>
              <input id="dps_name" className={inputClass} aria-required="true"
                value={data.dps_name} onChange={(e) => onChange('dps_name', e.target.value)} />
              {errors.dps_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.dps_name}</p>}
            </div>
            <div>
              <label htmlFor="personal_licence_number" className={labelClass}>Personal licence number *</label>
              <input id="personal_licence_number" className={inputClass} aria-required="true"
                value={data.personal_licence_number} onChange={(e) => onChange('personal_licence_number', e.target.value)} />
              {errors.personal_licence_number && <p role="alert" className="mt-1 text-sm text-red-300">{errors.personal_licence_number}</p>}
            </div>
          </div>

          <FileUpload
            id="premises_licence_file"
            label="Copy of premises licence"
            required
            value={data.premises_licence_file}
            onChange={(v) => onChange('premises_licence_file', v)}
          />
          {errors.premises_licence_file && <p role="alert" className="mt-1 text-sm text-red-300">{errors.premises_licence_file}</p>}
        </div>
      )}
    </div>
  )
}

function AddressFields({ prefix, address, onField, errors }: {
  prefix: string
  address: Address
  onField: (field: keyof Address, value: string) => void
  errors: Record<string, string>
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${prefix}_line1`} className={labelClass}>Line 1 *</label>
        <input id={`${prefix}_line1`} className={inputClass} aria-required="true"
          value={address.line1} onChange={(e) => onField('line1', e.target.value)} />
        {errors[`${prefix}_line1`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_line1`]}</p>}
      </div>
      <div>
        <label htmlFor={`${prefix}_line2`} className={labelClass}>Line 2</label>
        <input id={`${prefix}_line2`} className={inputClass}
          value={address.line2} onChange={(e) => onField('line2', e.target.value)} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor={`${prefix}_town`} className={labelClass}>Town *</label>
          <input id={`${prefix}_town`} className={inputClass} aria-required="true"
            value={address.town} onChange={(e) => onField('town', e.target.value)} />
          {errors[`${prefix}_town`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_town`]}</p>}
        </div>
        <div>
          <label htmlFor={`${prefix}_county`} className={labelClass}>County</label>
          <input id={`${prefix}_county`} className={inputClass}
            value={address.county} onChange={(e) => onField('county', e.target.value)} />
        </div>
        <div>
          <label htmlFor={`${prefix}_postcode`} className={labelClass}>Postcode *</label>
          <input id={`${prefix}_postcode`} className={inputClass} aria-required="true"
            value={address.postcode} onChange={(e) => onField('postcode', e.target.value.toUpperCase())} />
          {errors[`${prefix}_postcode`] && <p role="alert" className="mt-1 text-sm text-red-300">{errors[`${prefix}_postcode`]}</p>}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/StepPremises.tsx
git commit -m "feat: trade application step 2 — premises & licensing"
```

---

## Task 16: Step 3 — Contact & Director

**Files:**
- Create: `src/components/trade-application/StepContact.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { FileUpload } from './FileUpload'
import type { ApplicationFormState } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepContact({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_name" className={labelClass}>Primary contact name *</label>
          <input id="contact_name" className={inputClass} aria-required="true" autoComplete="name"
            value={data.contact_name} onChange={(e) => onChange('contact_name', e.target.value)} />
          {errors.contact_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_name}</p>}
        </div>
        <div>
          <label htmlFor="contact_role" className={labelClass}>Role / position *</label>
          <input id="contact_role" className={inputClass} aria-required="true"
            value={data.contact_role} onChange={(e) => onChange('contact_role', e.target.value)} />
          {errors.contact_role && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_role}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="contact_email" className={labelClass}>Email *</label>
          <input id="contact_email" type="email" className={inputClass} aria-required="true" autoComplete="email"
            value={data.contact_email} onChange={(e) => onChange('contact_email', e.target.value)} />
          {errors.contact_email && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_email}</p>}
        </div>
        <div>
          <label htmlFor="contact_phone" className={labelClass}>Phone *</label>
          <input id="contact_phone" type="tel" className={inputClass} aria-required="true" autoComplete="tel"
            value={data.contact_phone} onChange={(e) => onChange('contact_phone', e.target.value)} />
          {errors.contact_phone && <p role="alert" className="mt-1 text-sm text-red-300">{errors.contact_phone}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="director_name" className={labelClass}>Director / owner name *</label>
        <input id="director_name" className={inputClass} aria-required="true"
          value={data.director_name} onChange={(e) => onChange('director_name', e.target.value)} />
        {errors.director_name && <p role="alert" className="mt-1 text-sm text-red-300">{errors.director_name}</p>}
      </div>

      <FileUpload
        id="director_id_file"
        label="Photo ID of director or owner (passport or driving licence)"
        required
        value={data.director_id_file}
        onChange={(v) => onChange('director_id_file', v)}
      />
      {errors.director_id_file && <p role="alert" className="mt-1 text-sm text-red-300">{errors.director_id_file}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/StepContact.tsx
git commit -m "feat: trade application step 3 — contact & director"
```

---

## Task 17: Step 4 — Order Intent & Declaration

**Files:**
- Create: `src/components/trade-application/StepOrderIntent.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import type { ApplicationFormState } from './types'
import { VOLUMES, PAYMENT_TERMS } from './types'

interface Props {
  data: ApplicationFormState
  errors: Record<string, string>
  onChange: <K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) => void
}

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

export function StepOrderIntent({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="expected_initial_volume" className={labelClass}>Expected initial order *</label>
          <select id="expected_initial_volume" className={inputClass} aria-required="true"
            value={data.expected_initial_volume} onChange={(e) => onChange('expected_initial_volume', e.target.value)}>
            <option value="">Select</option>
            {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.expected_initial_volume && <p role="alert" className="mt-1 text-sm text-red-300">{errors.expected_initial_volume}</p>}
        </div>
        <div>
          <label htmlFor="expected_monthly_volume" className={labelClass}>Expected ongoing monthly *</label>
          <select id="expected_monthly_volume" className={inputClass} aria-required="true"
            value={data.expected_monthly_volume} onChange={(e) => onChange('expected_monthly_volume', e.target.value)}>
            <option value="">Select</option>
            {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {errors.expected_monthly_volume && <p role="alert" className="mt-1 text-sm text-red-300">{errors.expected_monthly_volume}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="payment_terms_pref" className={labelClass}>Payment terms preference *</label>
        <select id="payment_terms_pref" className={inputClass} aria-required="true"
          value={data.payment_terms_pref} onChange={(e) => onChange('payment_terms_pref', e.target.value)}>
          <option value="">Select</option>
          {PAYMENT_TERMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        {errors.payment_terms_pref && <p role="alert" className="mt-1 text-sm text-red-300">{errors.payment_terms_pref}</p>}
      </div>

      <div>
        <label htmlFor="how_heard" className={labelClass}>How did you hear about us?</label>
        <input id="how_heard" className={inputClass}
          value={data.how_heard} onChange={(e) => onChange('how_heard', e.target.value)} />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Anything else we should know?</label>
        <textarea id="notes" rows={4} className={`${inputClass} resize-vertical`}
          value={data.notes} onChange={(e) => onChange('notes', e.target.value)} />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500" aria-required="true"
          checked={data.declaration}
          onChange={(e) => onChange('declaration', e.target.checked)} />
        <span className="text-sm text-parchment-200">
          I confirm the information provided is true and accurate, and I am authorised to apply for a trade account on behalf of this business. *
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="mt-1 w-4 h-4 accent-gold-500"
          checked={data.marketing_opt_in}
          onChange={(e) => onChange('marketing_opt_in', e.target.checked)} />
        <span className="text-sm text-parchment-200">
          Add me to trade updates and new product notifications.
        </span>
      </label>

      {/* Honeypot — visually hidden but reachable */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="website_url">Website URL (leave blank)</label>
        <input id="website_url" type="text" tabIndex={-1} autoComplete="off"
          value={data.website_url} onChange={(e) => onChange('website_url', e.target.value)} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/trade-application/StepOrderIntent.tsx
git commit -m "feat: trade application step 4 — order intent & declaration"
```

---

## Task 18: Apply page — assemble the form

**Files:**
- Create: `src/app/trade/apply/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { StepProgress } from '@/components/trade-application/StepProgress'
import { StepBusinessOwnership } from '@/components/trade-application/StepBusinessOwnership'
import { StepPremises } from '@/components/trade-application/StepPremises'
import { StepContact } from '@/components/trade-application/StepContact'
import { StepOrderIntent } from '@/components/trade-application/StepOrderIntent'
import {
  INITIAL_STATE, type ApplicationFormState,
  STRUCTURES_REQUIRING_CH, TYPES_REQUIRING_AWRS, TYPES_REQUIRING_LICENCE,
} from '@/components/trade-application/types'

const TOTAL_STEPS = 4
const STORAGE_KEY = 'trade-application-draft'

const STEP_HEADINGS = [
  'Business & ownership',
  'Premises & licensing',
  'Primary contact & director',
  'Order intent & declaration',
]

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i
const COMPANIES_HOUSE_RE = /^([A-Z]{2}\d{6}|\d{8})$/
const AWRS_URN_RE = /^X[A-Z]{3}\d{11}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function TradeApplyPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<ApplicationFormState>(INITIAL_STATE)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [serverError, setServerError] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as { step?: number, data?: Partial<ApplicationFormState> }
        if (parsed.data) setData({ ...INITIAL_STATE, ...parsed.data })
        if (parsed.step && parsed.step >= 1 && parsed.step <= TOTAL_STEPS) setStep(parsed.step)
      }
    } catch { /* ignore corrupt drafts */ }
  }, [])

  // Persist draft
  useEffect(() => {
    if (status === 'success') return
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ step, data: { ...data, premises_licence_file: data.premises_licence_file, director_id_file: data.director_id_file } }))
    } catch { /* quota or private mode — ignore */ }
  }, [step, data, status])

  // Focus step heading on step change
  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  function setField<K extends keyof ApplicationFormState>(key: K, value: ApplicationFormState[K]) {
    setData((d) => ({ ...d, [key]: value }))
    setErrors((e) => {
      if (!e[key as string]) return e
      const next = { ...e }
      delete next[key as string]
      return next
    })
  }

  function validateStep(n: number): Record<string, string> {
    const e: Record<string, string> = {}
    if (n === 1) {
      if (!data.trading_name.trim()) e.trading_name = 'Required'
      if (!data.legal_entity_name.trim()) e.legal_entity_name = 'Required'
      if (!data.legal_structure) e.legal_structure = 'Required'
      if (!data.business_type) e.business_type = 'Required'
      if (!data.years_trading || Number(data.years_trading) < 0) e.years_trading = 'Required'
      if (STRUCTURES_REQUIRING_CH.has(data.legal_structure)) {
        if (!data.companies_house_number) e.companies_house_number = 'Required for this legal structure'
        else if (!COMPANIES_HOUSE_RE.test(data.companies_house_number)) e.companies_house_number = 'Invalid format'
      }
      if (TYPES_REQUIRING_AWRS.has(data.business_type)) {
        if (!data.awrs_urn) e.awrs_urn = 'Required for wholesalers and distributors'
        else if (!AWRS_URN_RE.test(data.awrs_urn)) e.awrs_urn = 'Invalid format'
      }
    }
    if (n === 2) {
      const addr = data.trading_address
      if (!addr.line1.trim()) e.trading_line1 = 'Required'
      if (!addr.town.trim()) e.trading_town = 'Required'
      if (!UK_POSTCODE_RE.test(addr.postcode.trim())) e.trading_postcode = 'Invalid UK postcode'
      if (!data.registered_address_same) {
        const r = data.registered_address
        if (!r.line1.trim()) e.registered_line1 = 'Required'
        if (!r.town.trim()) e.registered_town = 'Required'
        if (!UK_POSTCODE_RE.test(r.postcode.trim())) e.registered_postcode = 'Invalid UK postcode'
      }
      if (TYPES_REQUIRING_LICENCE.has(data.business_type)) {
        if (!data.premises_licence_number.trim()) e.premises_licence_number = 'Required'
        if (!data.licensing_authority.trim()) e.licensing_authority = 'Required'
        if (!data.dps_name.trim()) e.dps_name = 'Required'
        if (!data.personal_licence_number.trim()) e.personal_licence_number = 'Required'
        if (!data.premises_licence_file) e.premises_licence_file = 'Upload required'
      }
    }
    if (n === 3) {
      if (!data.contact_name.trim()) e.contact_name = 'Required'
      if (!data.contact_role.trim()) e.contact_role = 'Required'
      if (!EMAIL_RE.test(data.contact_email)) e.contact_email = 'Invalid email'
      if (!data.contact_phone.trim()) e.contact_phone = 'Required'
      if (!data.director_name.trim()) e.director_name = 'Required'
      if (!data.director_id_file) e.director_id_file = 'Upload required'
    }
    if (n === 4) {
      if (!data.expected_initial_volume) e.expected_initial_volume = 'Required'
      if (!data.expected_monthly_volume) e.expected_monthly_volume = 'Required'
      if (!data.payment_terms_pref) e.payment_terms_pref = 'Required'
    }
    return e
  }

  function next() {
    const e = validateStep(step)
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setErrors({})
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  function back() {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSubmit() {
    const e = validateStep(4)
    if (!data.declaration) e.declaration = 'You must accept the declaration to submit'
    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }
    setSubmitting(true)
    setStatus('idle')
    setServerError('')
    try {
      const body = {
        trading_name: data.trading_name,
        legal_entity_name: data.legal_entity_name,
        legal_structure: data.legal_structure,
        business_type: data.business_type,
        companies_house_number: data.companies_house_number || undefined,
        vat_number: data.vat_number || undefined,
        awrs_urn: data.awrs_urn || undefined,
        years_trading: Number(data.years_trading),
        website: data.website || undefined,
        psc: data.psc.length > 0
          ? data.psc.map((p) => ({ name: p.name, dob_month: Number(p.dob_month), dob_year: Number(p.dob_year) }))
          : undefined,
        trading_address: data.trading_address,
        registered_address_same: data.registered_address_same,
        registered_address: data.registered_address_same ? undefined : data.registered_address,
        premises_licence_number: data.premises_licence_number || undefined,
        licensing_authority: data.licensing_authority || undefined,
        dps_name: data.dps_name || undefined,
        personal_licence_number: data.personal_licence_number || undefined,
        premises_licence_ticket: data.premises_licence_file?.ticket,
        contact_name: data.contact_name,
        contact_role: data.contact_role,
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        director_name: data.director_name,
        director_id_ticket: data.director_id_file?.ticket,
        expected_initial_volume: data.expected_initial_volume,
        expected_monthly_volume: data.expected_monthly_volume,
        payment_terms_pref: data.payment_terms_pref,
        how_heard: data.how_heard || undefined,
        notes: data.notes || undefined,
        declaration: data.declaration,
        marketing_opt_in: data.marketing_opt_in,
        website_url: data.website_url,
      }
      const res = await fetch('/api/trade-application/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setStatus('success')
        sessionStorage.removeItem(STORAGE_KEY)
      } else {
        let msg = ''
        try {
          const d = await res.json() as { error?: string }
          if (typeof d.error === 'string') msg = d.error
        } catch { /* keep fallback */ }
        setServerError(msg)
        setStatus('error')
      }
    } catch {
      setServerError('')
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h1 className="text-2xl font-serif font-bold text-parchment-50 mb-3">Application received</h1>
            <p className="text-parchment-200 mb-2">We will review and get back to you within three working days.</p>
            <p className="text-parchment-300 text-sm">Check your inbox (and junk folder) for confirmation.</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs items={[
          { label: 'Trade', href: '/trade' },
          { label: 'Apply' },
        ]} />
      </div>

      <section className="py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Trade Application</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-parchment-50 mb-3">Apply for a Trade Account</h1>
            <p className="text-parchment-300 max-w-xl mx-auto">
              Four short steps. We review and respond within three working days.
            </p>
          </div>

          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20">
            <StepProgress step={step} total={TOTAL_STEPS} />

            <h2 ref={headingRef} tabIndex={-1} className="text-xl font-serif font-bold text-parchment-50 mb-6 outline-none">
              {STEP_HEADINGS[step - 1]}
            </h2>

            {Object.keys(errors).length > 0 && (
              <div role="alert" aria-live="polite" className="mb-6 bg-red-600/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-200">
                Please fix the highlighted fields before continuing.
              </div>
            )}

            {step === 1 && <StepBusinessOwnership data={data} errors={errors} onChange={setField} />}
            {step === 2 && <StepPremises data={data} errors={errors} onChange={setField} />}
            {step === 3 && <StepContact data={data} errors={errors} onChange={setField} />}
            {step === 4 && <StepOrderIntent data={data} errors={errors} onChange={setField} />}

            {status === 'error' && (
              <div role="alert" className="mt-6 bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-sm text-red-200">
                {serverError || 'We could not submit your application. Please try again, or email hello@jerrycanspirits.co.uk if the problem persists.'}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t border-gold-500/10">
              {step > 1 ? (
                <button type="button" onClick={back}
                  className="px-6 py-3 border border-gold-500/30 rounded-lg text-parchment-100 hover:bg-jerry-green-700/40 transition-colors">
                  Back
                </button>
              ) : <span />}

              {step < TOTAL_STEPS && (
                <button type="button" onClick={next}
                  className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all">
                  Next
                </button>
              )}
              {step === TOTAL_STEPS && (
                <button type="button" onClick={handleSubmit} disabled={submitting || !data.declaration}
                  aria-disabled={submitting || !data.declaration}
                  className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-jerry-green-900 font-semibold rounded-lg transition-all">
                  {submitting ? 'Submitting…' : 'Submit application'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Smoke-test in the browser**

Run: `npm run dev`

Open `http://localhost:3000/trade/apply/`. Step through all 4 steps. Trigger validation by clicking Next with empty fields. Confirm:
- Progress bar fills as you advance
- Refreshing mid-application restores state from sessionStorage
- Conditional fields appear when expected (e.g. PSC block only after selecting Ltd)
- File upload shows filename after picking a file

Don't submit yet — the API needs the live environment for full e2e.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/apply/page.tsx
git commit -m "feat: trade application form page (4-step wizard)"
```

---

## Task 19: Trade page CTA

**Files:**
- Modify: `src/app/trade/page.tsx`

- [ ] **Step 1: Insert the CTA section between the hero and "Why it works behind the bar"**

Find the closing `</section>` of the hero (around line 55) and insert this section immediately after it:

```tsx
      {/* ── Section: Apply CTA ── */}
      <section className="pb-16 -mt-8 lg:-mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-jerry-green-800/40 border border-gold-500/30 rounded-xl p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Stock Expedition Spiced</h2>
                <p className="text-parchment-300 text-sm leading-relaxed max-w-xl">
                  Apply for a trade account. We review and respond within three working days.
                </p>
              </div>
              <a
                href="/trade/apply/"
                className="inline-flex items-center justify-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm whitespace-nowrap"
              >
                Apply for a trade account
              </a>
            </div>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Browser-check the trade page**

Run: `npm run dev` (if not already running)

Open `http://localhost:3000/trade/`. Confirm the apply CTA sits between the hero and "Why it works behind the bar", click-through navigates to `/trade/apply/`.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/page.tsx
git commit -m "feat: add apply-for-trade-account CTA to trade page"
```

---

## Task 20: Privacy policy update

**Files:**
- Modify: `src/app/privacy-policy/page.tsx`

- [ ] **Step 1: Read the current file to find the right insertion point**

Run: open `src/app/privacy-policy/page.tsx` and locate the section list. We want to add the new section after the existing "How we collect data" / "What we collect" block, or at the end of the substantive content if the file structure is a single prose block.

- [ ] **Step 2: Insert the trade applications section**

Add this section (use the file's existing heading style — `h2` with the same Tailwind classes as adjacent headings):

```tsx
<section>
  <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-4">Trade account applications</h2>
  <p className="text-parchment-200 mb-4">
    If you apply for a trade account, we collect information about your business, premises licensing, primary contact, and one director or owner. This includes a copy of your premises licence and photo identification of a director or owner.
  </p>
  <p className="text-parchment-200 mb-4">
    <strong className="text-parchment-50">Lawful basis.</strong> We process this data to meet our legal obligations under HMRC&rsquo;s Alcohol Wholesaler Registration Scheme (AWRS) due diligence requirements, and our legitimate interest in verifying the businesses we trade with.
  </p>
  <p className="text-parchment-200 mb-4">
    <strong className="text-parchment-50">Retention.</strong> Photo identification and premises licence copies are deleted from our systems 30 days after submission. Application details and verification records are retained for the life of the trade account and for six years after closure, in line with HMRC record-keeping requirements.
  </p>
  <p className="text-parchment-200 mb-4">
    <strong className="text-parchment-50">Recipients.</strong> This data is accessible only to Jerry Can Spirits directors. It is stored in Cloudflare R2 (United Kingdom and European Union regions) and Cloudflare D1.
  </p>
  <p className="text-parchment-200 mb-4">
    <strong className="text-parchment-50">Your rights.</strong> You can request access, correction, or deletion of your data by emailing <a href="mailto:hello@jerrycanspirits.co.uk" className="text-gold-300 underline hover:text-gold-200">hello@jerrycanspirits.co.uk</a>. Deletion requests for active trade accounts will close the account.
  </p>
</section>
```

If the existing file uses a different markup pattern (Sanity portable text, MDX, etc.), match that pattern instead — the prose content above is the authoritative copy regardless of format.

- [ ] **Step 3: Browser-check**

Open `http://localhost:3000/privacy-policy/`. Confirm the new section renders with consistent typography and links work.

- [ ] **Step 4: Commit**

```bash
git add src/app/privacy-policy/page.tsx
git commit -m "feat: privacy policy update for trade applications"
```

---

## Task 21: Cron weekly digest (scheduled handler)

**Files:**
- Create: `src/lib/scheduled-trade-review.ts`
- Modify: `cloudflare-worker-entry.mjs`

The Worker entry needs a `scheduled` handler alongside the existing `fetch`. We'll keep the logic in a dedicated module and wire it into the entry.

- [ ] **Step 1: Write `src/lib/scheduled-trade-review.ts`**

```ts
// Weekly cron: email the founder a digest of trade accounts due for review.
// Triggered by wrangler.jsonc `triggers.crons` schedule "0 8 * * 1".
//
// This module is imported by cloudflare-worker-entry.mjs and runs in the
// Worker isolate; getCloudflareContext() is NOT available here — env is
// passed in directly by the scheduled handler.

import { getApplicationsDueForReview } from './trade-applications'
import { sendEmail } from './resend'

interface ScheduledEnv {
  DB: D1Database
  RESEND_API_KEY: string
  TRADE_APPLICATIONS_EMAIL: string
}

const REVIEW_WINDOW_DAYS = 30
const FROM_EMAIL = 'Jerry Can Spirits <hello@jerrycanspirits.co.uk>'

export async function runTradeReviewDigest(env: ScheduledEnv): Promise<void> {
  const due = await getApplicationsDueForReview(env.DB, REVIEW_WINDOW_DAYS)
  if (due.length === 0) return // silent — nothing to email

  const now = Date.now()
  const rows = due.map((row) => {
    const reviewDate = new Date(row.next_review_date)
    const days = Math.max(0, Math.ceil((reviewDate.getTime() - now) / (1000 * 60 * 60 * 24)))
    return `<tr>
      <td style="padding:6px 12px 6px 0">${escapeHtml(row.trading_name)}</td>
      <td style="padding:6px 12px 6px 0">${escapeHtml(row.contact_email)}</td>
      <td style="padding:6px 12px 6px 0">${row.next_review_date.split('T')[0]}</td>
      <td style="padding:6px 0">${days}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;color:#0a0a0a;max-width:680px;margin:0 auto;padding:24px">
<h1 style="font-size:20px;margin:0 0 16px">Trade reviews due (${due.length})</h1>
<p style="color:#5a6168;margin:0 0 16px">The following trade accounts are due for AWRS due diligence review within the next ${REVIEW_WINDOW_DAYS} days.</p>
<table style="border-collapse:collapse;width:100%;font-size:14px">
  <thead><tr style="border-bottom:1px solid #d1d5db;text-align:left">
    <th style="padding:6px 12px 6px 0">Trading name</th>
    <th style="padding:6px 12px 6px 0">Contact email</th>
    <th style="padding:6px 12px 6px 0">Review date</th>
    <th style="padding:6px 0">Days</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`

  const text = [
    `Trade reviews due (${due.length})`,
    '',
    ...due.map((row) => `${row.trading_name} · ${row.contact_email} · ${row.next_review_date.split('T')[0]}`),
  ].join('\n')

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    from: FROM_EMAIL,
    to: env.TRADE_APPLICATIONS_EMAIL,
    subject: `Trade reviews due (${due.length} account${due.length === 1 ? '' : 's'})`,
    html,
    text,
  })
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
```

- [ ] **Step 2: Wire up the `scheduled` handler in `cloudflare-worker-entry.mjs`**

Replace the file contents with:

```js
// Cloudflare Workers entry point — wraps OpenNext worker with edge caching
// and adds a scheduled handler for the weekly trade review digest cron.
// .open-next/worker.js is generated at build time by opennextjs-cloudflare
export * from './.open-next/worker.js';
import openNextWorker from './.open-next/worker.js';
import { runTradeReviewDigest } from './src/lib/scheduled-trade-review.ts';

const EDGE_CACHE_PATHS = new Set([
  '/',
  '/offline',
  '/field-manual',
  '/field-manual/cocktails',
  '/field-manual/equipment',
  '/field-manual/ingredients',
]);

const CACHE_TTL = 3600; // 1 hour

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'GET' && EDGE_CACHE_PATHS.has(url.pathname)) {
      const cache = caches.default;
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        const headers = new Headers(cachedResponse.headers);
        headers.set('X-Edge-Cache', 'HIT');
        return new Response(cachedResponse.body, { status: cachedResponse.status, headers });
      }

      const response = await openNextWorker.fetch(request, env, ctx);

      if (response.status === 200) {
        const cloned = response.clone();
        const headers = new Headers(cloned.headers);
        headers.set('Cache-Control', `public, max-age=${CACHE_TTL}, s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
        ctx.waitUntil(
          cache.put(request, new Response(cloned.body, { status: cloned.status, headers }))
        );
      }

      return response;
    }

    return openNextWorker.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(runTradeReviewDigest(env));
  },
};
```

> Wrangler accepts `.ts` imports from `.mjs` entries because the Worker bundler resolves both. If the build complains, the fallback is to write `scheduled-trade-review.js` in pure JS — but try the TS import first.

- [ ] **Step 3: Build to confirm the entry still compiles**

Run: `npx opennextjs-cloudflare build`

Expected: `OpenNext build complete.` — no compilation errors. If the TS import fails, rename `scheduled-trade-review.ts` to `.mjs` and convert types to JSDoc; otherwise leave as-is.

- [ ] **Step 4: Test the cron locally**

Run: `npx wrangler dev --test-scheduled`

In another terminal: `curl "http://localhost:8787/__scheduled?cron=0+8+*+*+1"`

Expected: handler runs without throwing. If D1 is empty there are no rows to digest and no email is sent (silent — correct behaviour). To exercise the email path, insert a test row first:

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command "INSERT INTO trade_applications (id, status, trading_name, legal_entity_name, legal_structure, business_type, years_trading, trading_address_json, contact_name, contact_role, contact_email, contact_phone, director_name, expected_initial_volume, expected_monthly_volume, payment_terms_pref, submitted_at, next_review_date) VALUES ('test001', 'approved', 'Test Pub', 'Test Pub Ltd', 'Ltd', 'Pub/Bar', 5, '{}', 'Alice', 'Owner', 'alice@example.com', '01234567890', 'Alice', '12-36', '12-36', 'Pro-forma', '2026-05-01T00:00:00Z', '2026-05-20T00:00:00Z');"
```

Re-run the scheduled trigger and confirm the handler logs an outgoing Resend call. Clean up: `npx wrangler d1 execute jerry-can-spirits-db --local --command "DELETE FROM trade_applications WHERE id='test001';"`

- [ ] **Step 5: Commit**

```bash
git add src/lib/scheduled-trade-review.ts cloudflare-worker-entry.mjs
git commit -m "feat: weekly cron digest for trade reviews due"
```

---

## Task 22: Playwright e2e — happy path

**Files:**
- Create: `tests/e2e/trade-application.spec.ts`

This test exercises the form's client-side validation and navigation. Network calls to `/api/trade-application/upload` and `/api/trade-application` are intercepted with mocked responses — actual integration is verified manually in Task 23.

- [ ] **Step 1: Write the test**

```ts
import { test, expect } from '@playwright/test'

test.describe('Trade application form', () => {
  test('completes all four steps and submits', async ({ page }) => {
    // Mock upload endpoint to return a deterministic ticket
    await page.route('**/api/trade-application/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ticket: 'mock-ticket-' + Date.now(), filename: 'test.pdf', detectedMime: 'application/pdf' }),
      })
    })
    // Mock submit endpoint to return success
    await page.route('**/api/trade-application/', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, applicationId: 'mock-app-id' }),
      })
    })

    await page.goto('/trade/apply/')

    // Step 1
    await page.fill('#trading_name', 'The Test Pub')
    await page.fill('#legal_entity_name', 'Test Pub Ltd')
    await page.selectOption('#legal_structure', 'Ltd')
    await page.selectOption('#business_type', 'Pub/Bar')
    await page.fill('#companies_house_number', '12345678')
    await page.fill('#years_trading', '5')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2
    await page.fill('#trading_line1', '1 High Street')
    await page.fill('#trading_town', 'London')
    await page.fill('#trading_postcode', 'SW1A 1AA')
    await page.fill('#premises_licence_number', 'PL-001')
    await page.fill('#licensing_authority', 'Westminster')
    await page.fill('#dps_name', 'Alice')
    await page.fill('#personal_licence_number', 'PERS-001')
    // Upload a file via the hidden input
    await page.setInputFiles('#premises_licence_file', {
      name: 'licence.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 test'),
    })
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3
    await page.fill('#contact_name', 'Alice Tester')
    await page.fill('#contact_role', 'Owner')
    await page.fill('#contact_email', 'alice@example.com')
    await page.fill('#contact_phone', '02012345678')
    await page.fill('#director_name', 'Alice Tester')
    await page.setInputFiles('#director_id_file', {
      name: 'id.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('%PDF-1.4 test'), // upload mock doesn't care about magic bytes
    })
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4
    await page.selectOption('#expected_initial_volume', '12–36')
    await page.selectOption('#expected_monthly_volume', '12–36')
    await page.selectOption('#payment_terms_pref', 'Pro-forma')
    await page.locator('label:has-text("I confirm the information provided")').click()
    await page.getByRole('button', { name: 'Submit application' }).click()

    await expect(page.getByRole('heading', { name: 'Application received' })).toBeVisible()
  })

  test('blocks progression on missing required fields', async ({ page }) => {
    await page.goto('/trade/apply/')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByRole('alert').first()).toContainText('Please fix')
    // Should still be on step 1
    await expect(page.getByRole('heading', { name: 'Business & ownership' })).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test**

Run: `npm run dev` in one terminal, `npm run test:e2e -- trade-application.spec.ts` in another.

Expected: both tests pass.

If the dev server isn't on the default Playwright base URL, check `playwright.config.ts` for the `baseURL` setting and adjust.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/trade-application.spec.ts
git commit -m "test: e2e happy path for trade application form"
```

---

## Task 23: Manual end-to-end verification

This is a checklist, not a code task. Complete it before opening the PR for review.

**Pre-flight (one-time):**

- [ ] Resend account verified for `jerrycanspirits.co.uk` (SPF, DKIM, return-path CNAME)
- [ ] R2 bucket `jerry-can-spirits-trade-docs` created in Cloudflare dashboard
- [ ] R2 lifecycle rules added: `pending/` 24h, `applications/` 30 days
- [ ] R2 API token generated; `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_ACCOUNT_ID` added as Worker secrets via `npx wrangler secret put`
- [ ] `RESEND_API_KEY` added as Worker secret
- [ ] `TRADE_APPLICATIONS_EMAIL=trade@jerrycanspirits.co.uk` added as Worker secret (or plain `var` if non-sensitive — preference: secret)
- [ ] `KLAVIYO_TRADE_LIST_ID` set; trade list created in Klaviyo
- [ ] Klaviyo flow created for the `Trade Application Submitted` event (applicant acknowledgement)
- [ ] D1 migration applied remote: `npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0014_trade_applications.sql`

**Happy path on the preview deploy:**

- [ ] Submit a complete application as a Pub/Bar with both file uploads
- [ ] Admin email arrives at `trade@jerrycanspirits.co.uk` with:
  - All 30+ fields visible
  - Two download links that open the uploaded files when clicked
  - `.ics` attachment that imports into Apple Calendar / Outlook with the correct title and date 12 months out
- [ ] Klaviyo profile for the applicant exists; the `Trade Application Submitted` event appears with the documented properties
- [ ] D1 row exists: `npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT id, trading_name, status, next_review_date FROM trade_applications ORDER BY submitted_at DESC LIMIT 5;"`
- [ ] If marketing opt-in was ticked, profile is on the trade list

**Failure paths:**

- [ ] Submitting with an obviously bad postcode → server returns 400 with the right error
- [ ] Selecting a 6MB file in the form → client shows the size error, no upload attempt
- [ ] Selecting a .docx file → client rejects on type; if bypassed, server rejects on magic bytes
- [ ] Submitting 4 times in an hour from the same IP → 429 on the fourth

**Accessibility:**

- [ ] Lighthouse accessibility audit on `/trade/apply` scores ≥ 95
- [ ] Tab through the form using only the keyboard from start to finish
- [ ] Screen reader (VoiceOver / NVDA) reads step headings, required markers, file upload state, and error messages

**Cron:**

- [ ] Cron Trigger visible in Cloudflare dashboard under the Worker
- [ ] On the next Monday (or via manual trigger), digest email arrives (or, if no rows are due, no email — verified by checking Worker logs for the `runTradeReviewDigest` execution)

**Privacy policy:**

- [ ] New section visible on `/privacy-policy`, links work, copy matches the spec

---

## Self-Review

### Spec coverage

| Spec section | Task |
|---|---|
| Architecture overview | 1 |
| `wrangler.jsonc` additions | 1 |
| Env vars | 1 |
| 4-step form structure | 11–18 |
| Server-side validation | 6, 10 |
| File upload flow | 9, 13 |
| R2 storage layout | 9, 10 |
| R2 lifecycle rules | 23 (manual, pre-flight) |
| Retention policy | 9 + 23 + docs |
| Presigned URLs | 4, 10 |
| Submission flow (16 steps) | 10 |
| Failure handling | 10 |
| Admin email | 10 |
| Klaviyo event | 10 |
| D1 schema | 2 |
| Cron weekly digest | 21 |
| Trade page CTA | 19 |
| Privacy policy update | 20 |
| Accessibility | 12, 13, 18 (focus mgmt, ARIA) + 23 |
| Acceptance criteria | 23 |

### Placeholder scan

- No "TBD" / "TODO" placeholders
- All file paths exact
- Every commit message specified
- Manual verification steps include the actual commands

### Type consistency

- `ApplicationFormState` shape matches the `SubmitPayload` field names used in `api/trade-application/route.ts` (mapping in Task 18's `handleSubmit`)
- `UploadedFileRef.ticket` consumed by `premises_licence_ticket` / `director_id_ticket` in the API route — names match
- `TradeApplicationInsert` (Task 8) field names exactly match the D1 schema columns (Task 2)
- `AllowedMime` from `file-magic-bytes.ts` consumed by `extensionForMime` and the upload route — names match
- `presignR2GetUrl` signature matches its call site in `api/trade-application/route.ts`

---

## Notes for the implementer

- The branch `feat/trade-application-form` was created from `origin/main`. It does NOT include the in-flight `feat/meta-capi` changes (PR #629). If that PR merges before this one, no rebase needed; if this one merges first, `feat/meta-capi` will need a trivial rebase against main.
- When you encounter the form components (Tasks 14–17), keep the input class strings consistent — they're defined per-file. If you find yourself drifting, extract to `src/components/trade-application/styles.ts`. Not required up front.
- Resend's free tier is 100 emails/day. Comfortable for application volume + weekly digests. If you ever exceed it, upgrade or move the cron digest to use Klaviyo (slower iteration, but no Resend bill).
- The Worker entry change in Task 21 is the riskiest piece — verify the build output (`.open-next/worker.js`) still includes the `scheduled` export by inspecting `wrangler deploy --dry-run` if in doubt.
