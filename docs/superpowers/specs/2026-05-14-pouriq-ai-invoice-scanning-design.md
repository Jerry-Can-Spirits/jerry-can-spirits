# Pour IQ™ AI Invoice Scanning — Design Spec

**Status:** Spec — not yet implemented. Next Pour IQ™ feature after inline cost-change ripple (PR #677, shipped 2026-05-14).

**Why:** Pour IQ™ now shows the GP impact of changing one ingredient cost (the inline ripple from PR #677), but bar managers update costs from supplier invoices that touch many ingredients at once. Today, they have to type each cost change manually. AI invoice scanning closes the loop: drop the supplier PDF, every cost flows in, the combined ripple shows GP impact across every drink. Pairs naturally with the just-shipped ripple feature and exploits the menu-import pipeline Pour IQ™ already has (Claude tool-use + PDF parsing + fuzzy match + atomic D1 commit).

**Scope discipline:** Medium scope — cost updates plus a supplier-invoice ledger. Specifically NOT a full accounts-payable module (that overlaps with Xero and drifts away from Pour IQ™'s drink-level margin wedge). Invoice PDFs are retained as a working archive so trade venues can revisit any invoice at any time, satisfying HMRC's six-year VAT-records requirement.

---

## Concepts

**Invoice.** A scanned supplier document. One PDF in, one `pouriq_invoices` row out, plus N `pouriq_invoice_lines`. The original PDF stays in R2 for later retrieval.

**Invoice line.** A billable product line on the invoice. Section headers, totals, VAT lines, delivery charges, and deposits are explicitly excluded.

**Net per-unit price.** The cost-per-bottle or cost-per-unit *ex VAT*. The AI extracts net, dividing gross figures by 1.20 when the invoice only shows gross. Pour IQ™ stores library costs net of VAT — VAT is reclaimable for any registered trade venue, so net is the cost that affects margin.

**Cost change.** Any change to a library entry's `bottle_cost_p` or `unit_cost_p`, from any source (manual edit OR invoice commit). Every cost change is logged to a dedicated audit table.

**Combined ripple.** The cumulative GP impact of multiple ingredient cost changes from one invoice. Computed across all updated ingredients in one pass; rendered using the existing `<RipplePreview>` component (extracted in PR #676).

---

## What already exists

| Asset | Where | What it does |
|---|---|---|
| 3-stage import pattern | `src/app/api/pouriq/import/{upload,extract,commit}/route.ts` | upload PDF → R2; Claude extracts; atomic D1 commit. Same shape applies to invoices. |
| Claude tool-use wrapper | `src/lib/pouriq/menu-extract.ts` | Generic enough; invoice flow will get its own `invoice-extract.ts` mirror. |
| Fuzzy matcher | `src/lib/pouriq/match.ts` | Levenshtein ≤2 + substring. Reused for matching extracted invoice line names to library entries. |
| Cost-impact projection | `src/lib/pouriq/cost-impact.ts` | `projectCocktail`, `rollupByMenu`, `getNewlyBelowTarget`. Used as-is. |
| Cost-impact loader | `src/lib/pouriq/cost-impact-loader.ts` | Single-ingredient version. New multi-ingredient variant follows the same shape. |
| Ripple preview component | `src/components/pouriq/RipplePreview.tsx` | Pure presentational; takes pre-computed projection and rollup data. Reused for invoice impact page. |
| Library update API | `updateLibraryEntry()` in `src/lib/pouriq/ingredient-library.ts` | Already handles cost-only patches via `bottle_cost_p` / `unit_cost_p`. Modified to log to `pouriq_cost_changes`. |

---

## Schema

New migration: `migrations/0025_pouriq_invoices.sql`.

### `pouriq_invoices` — one row per scanned invoice

```sql
CREATE TABLE pouriq_invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES pouriq_trade_accounts(id) ON DELETE CASCADE,
  supplier_name TEXT,                  -- extracted by AI, may be null
  invoice_number TEXT,                 -- extracted by AI, may be null
  invoice_date TEXT,                   -- ISO YYYY-MM-DD; extracted by AI, may be null
  net_total_p INTEGER,                 -- sum of applied net line totals, may be null
  line_count INTEGER NOT NULL,         -- how many lines AI extracted
  applied_line_count INTEGER NOT NULL, -- how many lines user ticked and committed
  r2_key TEXT,                         -- R2 object key for the original PDF (kept indefinitely)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_invoices_tenant ON pouriq_invoices(trade_account_id, created_at DESC);
```

### `pouriq_invoice_lines` — line items per invoice

```sql
CREATE TABLE pouriq_invoice_lines (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES pouriq_invoices(id) ON DELETE CASCADE,
  extracted_name TEXT NOT NULL,
  extracted_quantity INTEGER,          -- e.g. 12 (bottles bought), may be null
  extracted_unit_price_p INTEGER NOT NULL, -- per-unit net price in pence
  extracted_line_total_p INTEGER,      -- line subtotal net, may be null
  matched_library_id TEXT REFERENCES pouriq_ingredients_library(id) ON DELETE SET NULL,
  applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_invoice_lines_invoice ON pouriq_invoice_lines(invoice_id);
```

Possible end states for a line:

- `applied=1, matched_library_id=set` → cost was committed against that library entry (existing or newly created during this same commit)
- `applied=0, matched_library_id=set` → user reviewed the line but unticked it
- `applied=0, matched_library_id=null` → AI extracted an unmatched line that the user ignored
- `applied=1, matched_library_id=null` → invalid, blocked by commit-route validation

### `pouriq_cost_changes` — every cost change, from anywhere

```sql
CREATE TABLE pouriq_cost_changes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('bottle', 'unit')),
  old_cost_p INTEGER,                  -- null for first-time pricing
  new_cost_p INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'invoice')),
  invoice_id TEXT REFERENCES pouriq_invoices(id) ON DELETE SET NULL,
  invoice_line_id TEXT REFERENCES pouriq_invoice_lines(id) ON DELETE SET NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_cost_changes_ingredient ON pouriq_cost_changes(library_ingredient_id, changed_at DESC);
CREATE INDEX idx_pouriq_cost_changes_invoice ON pouriq_cost_changes(invoice_id);
```

### Schema design notes

- **`pricing_mode` on cost_changes** keeps the audit row interpretable even if the ingredient later switches modes (bottle ↔ unit).
- **Cascade behaviour:** deleting an invoice cascades to its lines but only nulls the back-references on cost_changes (preserves history). Deleting a library entry cascades to cost_changes (those rows lose meaning without their ingredient).
- **`net_total_p`** is computed from applied line totals — useful for the invoice detail page. Doesn't have to match the invoice's own total; the bar manager owns reconciliation.
- **`r2_key`** is nullable so a hand-entered invoice (future feature) can exist without a PDF.

### Modifying `updateLibraryEntry` for manual-edit logging

The existing function in `src/lib/pouriq/ingredient-library.ts` is wrapped so that whenever a patch changes `bottle_cost_p` or `unit_cost_p`, the function also inserts a row into `pouriq_cost_changes` with `source='manual'`. This means **every cost edit anywhere in the app** logs to the audit table without caller-side bookkeeping.

---

## R2 storage for invoice PDFs

PDFs are retained indefinitely. Aligns with HMRC's six-year VAT-records requirement; bar managers expect their invoices to be there when their accountant asks.

**Key format:** `pouriq-invoices/{tradeAccountId}/{invoiceId}.pdf`. Tenant-namespaced for safety; invoice-id-suffixed so the same supplier sending two invoices doesn't collide.

**Bucket:** existing `TRADE_DOCS` R2 binding.

**Cost:** ~£0.10 per tenant per year at 100 invoices/year. Trivial.

**Cleanup:**

- When commit succeeds, the PDF stays. Move from the temporary `pouriq-invoices/_pending/{ticket}.pdf` key to its permanent `pouriq-invoices/{tradeAccountId}/{invoiceId}.pdf` key, then store the new key on `pouriq_invoices.r2_key`.
- Orphan PDFs (extract succeeded but the user abandoned the tab before commit) sit in `pouriq-invoices/_pending/` indefinitely. R2 storage cost is small enough that this isn't urgent; a future Workers cron can sweep `_pending/` objects older than 24 hours. This concern is shared with menu-import (which has the same gap on extract-failure paths) and best addressed in one separate piece of work, not as part of this feature.
- If an invoice is deleted (future feature, not built in v1), the cascade hook in the deletion route removes the R2 object too.

---

## Backend architecture

### File structure

Mirrors the existing menu-import layout so the file map is predictable.

```
src/lib/pouriq/
  invoice-prompts.ts        # NEW — Claude system prompt + tool schema
  invoice-extract.ts        # NEW — Anthropic call, mirrors menu-extract.ts
  invoice-match.ts          # NEW — match invoice line → library entry; wraps match.ts
  invoices.ts               # NEW — D1 CRUD for pouriq_invoices + pouriq_invoice_lines
  cost-changes.ts           # NEW — D1 helpers for pouriq_cost_changes
  multi-cost-impact.ts      # NEW — projection across multiple cost changes for the impact page
  ingredient-library.ts     # MODIFY — updateLibraryEntry now logs to cost_changes

src/app/api/pouriq/invoices/
  upload/route.ts           # NEW — POST: PDF → R2 (temporary key), returns ticket
  extract/route.ts          # NEW — POST: Claude extraction → preview payload
  commit/route.ts           # NEW — POST: atomic commit, returns invoice id
  route.ts                  # NEW — GET: list recent invoices for tenant
  [id]/route.ts             # NEW — GET: single invoice with lines
  [id]/pdf/route.ts         # NEW — GET: stream the stored PDF (access-checked)

migrations/0025_pouriq_invoices.sql
```

### AI prompt strategy

**`invoice-prompts.ts`** key directives:

- **What counts as a line:** a billable product line on the invoice. Skip section headers, totals, VAT lines, delivery charges, deposits.
- **Per-unit net price:** always pull the per-bottle/per-unit price *net of VAT*. If the invoice only shows gross, divide by 1.20. Never the line total. Never the gross figure.
- **Quantity:** capture if present (informational only; not used in cost calc).
- **Unit identification:** ingredient name as written, including brand and size if shown ("Smirnoff Red Label 1L" — leave the 1L in; the matcher handles size disambiguation).
- **Header data:** supplier name, invoice number, invoice date — all optional; return null if not clearly visible.
- **No fallback recipe:** unlike the menu prompt, no "use classic recipe" path. If a line isn't readable, skip it.

**Tool schema** (`pouriq_extract_invoice`):

```ts
{
  supplier_name: string | null,
  invoice_number: string | null,
  invoice_date: string | null,  // ISO YYYY-MM-DD
  lines: Array<{
    extracted_name: string,
    extracted_quantity: number | null,
    extracted_unit_price_p: number,       // integer pence, net of VAT
    extracted_line_total_p: number | null,
  }>
}
```

**Model + max_tokens:** same `claude-sonnet-4-6` as menu import; `max_tokens: 16384`.

### Match strategy

`invoice-match.ts` reuses `matchIngredient()` from `match.ts` (Levenshtein ≤2 + substring) with one wrapper: if the extracted name contains a size suffix matching an existing library entry's `bottle_size_ml`, prefer that match. Avoids updating the wrong bottle size when a supplier ships both 70cl and 1L of the same brand.

### Routes

#### `POST /api/pouriq/invoices/upload`

- multipart/form-data with single `file` field (PDF only)
- Magic-byte check, 5MB max, rate limit `pouriq-invoice-upload`: 30/hour/IP
- Stores at `pouriq-invoices/_pending/{ticket}.pdf` (R2)
- Returns `{ ticket, filename }`

#### `POST /api/pouriq/invoices/extract`

- JSON body: `{ ticket }`
- Rate limit `pouriq-invoice-extract`: 60/hour/tenant
- Loads PDF from R2 (does NOT delete — extract may be retried, and commit takes the file)
- Calls `extractInvoiceWithAnthropic`
- Loads tenant library once
- Runs `matchInvoiceLine` against each extracted line
- Returns preview payload with header + lines + per-line match status

```ts
interface PreviewLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  match:
    | { kind: 'auto'; library_id: string; library_name: string }
    | { kind: 'suggestions'; entries: Array<{ id: string; name: string }> }
    | { kind: 'no-match' }
}

interface PreviewPayload {
  ticket: string                       // round-tripped to commit
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  lines: PreviewLine[]
}
```

#### `POST /api/pouriq/invoices/commit`

JSON body:

```ts
interface CommitBody {
  ticket: string                       // ties back to the uploaded PDF
  supplier_name: string | null         // user may edit AI-extracted value
  invoice_number: string | null
  invoice_date: string | null          // ISO YYYY-MM-DD
  lines: Array<{
    extracted_name: string             // for audit; the AI's read
    extracted_quantity: number | null
    extracted_line_total_p: number | null
    applied: boolean
    // Only meaningful when applied=true:
    library_id?: string                // existing library entry (matched or user-overridden)
    new_library?: {                    // OR user opted to create a new entry
      name: string
      ingredient_type: IngredientType
      bottle_size_ml: number | null
      bottle_cost_p: number | null     // exactly one of bottle_cost_p / unit_cost_p
      unit_cost_p: number | null
    }
    // Effective new cost for cost_changes audit row — must match the cost in
    // library_id's row after the update OR new_library's cost field:
    new_cost_p?: number
  }>
}
```

Rate limit `pouriq-invoice-commit`: 30/hour/tenant. Steps inside the route (sequential with rollback on error):

1. Validate body shape and references.
2. INSERT `pouriq_invoices` (header only — applied counts updated in step 5).
3. For each line where `applied=true`:
   - If `new_library` present: INSERT into `pouriq_ingredients_library`; capture new id; set `library_id` to that id locally.
   - UPDATE the library row's `bottle_cost_p` or `unit_cost_p` to `new_cost_p`.
   - INSERT `pouriq_cost_changes` with `source='invoice'`, the invoice id, old/new cost, pricing_mode.
4. For every line (applied or not): INSERT `pouriq_invoice_lines` with `applied` and `matched_library_id` populated appropriately.
5. UPDATE `pouriq_invoices` with `applied_line_count` (count of `applied=1` lines) and `net_total_p` (sum of `extracted_line_total_p` for lines where both `applied=1` AND `extracted_line_total_p IS NOT NULL`). If no applied line has a line total, `net_total_p` stays null.
6. Move R2 object from `pouriq-invoices/_pending/{ticket}.pdf` to `pouriq-invoices/{tradeAccountId}/{invoiceId}.pdf` and UPDATE `pouriq_invoices.r2_key`. Tolerate failure of the R2 move — the invoice still committed; r2_key just stays null.

On any DB error before step 6: rollback all inserts/updates from steps 2–4, leave R2 object as-is for cleanup later.

Returns `{ invoice_id }`.

#### `GET /api/pouriq/invoices`

- Access check
- Returns recent invoices for the tenant, ordered `created_at DESC`, limit 100 (paginate if it grows)

#### `GET /api/pouriq/invoices/[id]`

- Access check (invoice's tenant must match user's tenant)
- Returns invoice header + all lines (applied and skipped) + associated cost_changes rows

#### `GET /api/pouriq/invoices/[id]/pdf`

- Access check
- Streams the R2 object with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="invoice-{number-or-date}.pdf"`
- Returns 404 if `r2_key` is null

### Multi-cost-impact projection

`src/lib/pouriq/multi-cost-impact.ts` — new helper for the post-commit impact page.

```ts
export interface AppliedCostChange {
  library_ingredient_id: string
  old_cost_p: number | null
  new_cost_p: number
  pricing_mode: 'bottle' | 'unit'
  bottle_size_ml: number | null
}

export interface MultiCostImpactPayload {
  applied: AppliedCostChange[]
  projected: ProjectedCocktail[]     // existing type from cost-impact.ts
  rollups: MenuRollup[]              // existing type from cost-impact.ts
}

export async function loadMultiCostImpact(
  db: D1Database,
  tradeAccountId: string,
  appliedChanges: AppliedCostChange[],
): Promise<MultiCostImpactPayload>
```

Implementation: pull every cocktail that uses any of the changed ingredients, in one CTE. For each cocktail, sum the contribution from every relevant ingredient (using the *new* cost for changed ones, the current cost for unchanged ones). Run through `projectCocktail`'s math but with the multi-change new totals. Run `rollupByMenu` on the result. The shape feeds `<RipplePreview>` unchanged.

### Rate limits summary

All KV-backed. Per-tenant where it matters, per-IP for upload (which is anonymous-ish via tenant trade login).

- `pouriq-invoice-upload`: 30/hour/IP
- `pouriq-invoice-extract`: 60/hour/tenant
- `pouriq-invoice-commit`: 30/hour/tenant

---

## Frontend architecture

### Pages

| Route | Server / Client | Role |
|---|---|---|
| `/trade/pouriq/invoices/new` | Server page hosting client form | Full scan flow: upload → extracting → preview → commit. State transitions client-side. |
| `/trade/pouriq/invoices/[id]/impact` | Server page | Post-commit combined ripple. Loads invoice + applied changes; calls `loadMultiCostImpact`; renders `<RipplePreview>`. |
| `/trade/pouriq/invoices` | Server page | Ledger view — list of recent invoices. |
| `/trade/pouriq/invoices/[id]` | Server page | Invoice detail — header (with Download PDF button), applied lines, skipped lines. |

### Components

```
src/components/pouriq/
  InvoiceUpload.tsx           # NEW — drag-drop or file picker (PDF only)
  InvoicePreview.tsx          # NEW — header card + line table with auto-tick + override
  InvoiceLinesTable.tsx       # NEW — pure presentational; used by InvoicePreview and InvoiceDetailView
  InvoiceImpactView.tsx       # NEW — wraps RipplePreview for the impact page
  InvoiceList.tsx             # NEW — ledger table
  InvoiceDetailView.tsx       # NEW — header + lines + download-PDF button
```

### Data flow — full scan

```
User opens /trade/pouriq/invoices/new
   │
   ▼
<InvoiceUpload> drag-drop PDF
   │
   ├──► POST /api/pouriq/invoices/upload → { ticket }
   │
   ▼
Loading state ("Reading your invoice…")
   │
   ├──► POST /api/pouriq/invoices/extract { ticket } → preview payload
   │
   ▼
<InvoicePreview> renders
   │   - Header card: supplier, invoice number, invoice date (editable, prefilled from AI)
   │   - <InvoiceLinesTable>: one row per line
   │     - Apply checkbox: auto-ticked if match=auto, unticked if no-match
   │     - Extracted name (read-only)
   │     - Quantity (read-only)
   │     - Net unit price (editable input, defaults to AI's extracted value)
   │     - Match cell:
   │       - auto: shows matched library entry name with override dropdown
   │       - suggestions: dropdown of top-3 + "Create new" + "Skip"
   │       - no-match: "Create new" toggle (expands inline new-entry form) + "Skip"
   │     - Current cost / Δ pence / Δ % (computed for ticked rows with matched library)
   │   - Save button
   │
User reviews, unticks/overrides, fills any "Create new" details
   │
   ├──► POST /api/pouriq/invoices/commit { ticket, header fields, lines[] } → { invoice_id }
   │
   ▼
router.push(`/trade/pouriq/invoices/${invoice_id}/impact`)
   │
   ▼
<InvoiceImpactView> renders
   │   - Summary: "Invoice from {supplier_name} on {invoice_date} — {N} costs updated"
   │   - <RipplePreview> with combined projection across all applied changes
   │   - "Done" button → /trade/pouriq/library
```

### Library page updates (PR 2)

Existing `/trade/pouriq/library` page header gains two new buttons:

```
[ ← All menus ]                            [ Recent invoices ] [ Scan an invoice ] [ Run a what-if ] [ Add ingredient ]
```

- **Recent invoices** → `/trade/pouriq/invoices`
- **Scan an invoice** → `/trade/pouriq/invoices/new`

### Component contracts (signatures only)

```ts
// InvoicePreview.tsx (PR 2)
interface InvoicePreviewProps {
  ticket: string
  initial: PreviewPayload           // from extract route
  library: IngredientLibraryRow[]   // for override dropdowns
}

// InvoiceImpactView.tsx (PR 2)
interface InvoiceImpactViewProps {
  invoice: { id: string; supplier_name: string | null; invoice_date: string | null; applied_line_count: number }
  payload: MultiCostImpactPayload
}

// InvoiceDetailView.tsx (PR 2)
interface InvoiceDetailViewProps {
  invoice: InvoiceWithLines        // header + lines (applied + skipped)
  hasPdf: boolean                   // whether r2_key is set; controls Download button visibility
}
```

---

## Edge cases (in scope for v1)

| Case | Behaviour |
|---|---|
| PDF upload fails magic-byte check | Return 400 "Only PDF files are accepted" |
| PDF exceeds 5MB | Return 400 |
| Claude extraction returns zero lines | Return 422 "No items found in invoice — try a clearer scan". Don't create the invoice record. PDF stays in `_pending/` for cleanup. |
| Claude 5xx / timeout | Return 502. PDF stays in `_pending/` for retry; cleaned on success or after 1 hour by the existing Workers cron |
| Line has size suffix conflicting with existing library entry size | Matcher prefers the entry with matching `bottle_size_ml`; falls back to plain substring match if no exact-size match |
| Same ingredient appears twice in one invoice (e.g. two boxes of the same product on separate lines) | Both lines apply in order; last one wins in the library row; both line records persist. Cost_changes rows preserve the sequence |
| User unticks every line and saves | Create the invoice with `applied_line_count=0` and no cost_changes rows. Skip the impact page; redirect to library with toast ("Invoice saved with no changes applied"). PDF still moved to its permanent key. |
| User commits with applied lines that produce no diff (price unchanged) | Insert invoice + lines but no cost_changes rows for unchanged costs. Impact page shows "Invoice committed — no GP changes". |
| New library entry creation: pricing mode | Inline form on the unmatched line lets user pick bottle vs unit; size pre-fills from the extracted name if `1L` / `700ml` / `70cl` etc. is detectable |
| Cost change crosses a drink below target | No single-ingredient interruption modal — the dedicated impact page already shows newly-below drinks; that's the gate-equivalent for invoices |
| Manual library cost edit (existing flow) | Now logs to `pouriq_cost_changes` automatically via the modified `updateLibraryEntry`; no UX change |
| Concurrent invoice commits by two users on the same tenant | Both can complete; cost_changes preserves order; library cost ends up as whichever commit lands last. Acceptable; no row-level locking |
| R2 move fails after commit | DB transaction has already succeeded. `r2_key` stays null. Invoice detail page shows no Download PDF button. Bar manager can rescan if they have the file. Worth a Sentry warning. |
| PDF download requested for invoice with null r2_key | Return 404 "Original PDF not available for this invoice" |

## Edge cases acknowledged but **out of scope**

- **Invoice re-import / correction.** If a scan was wrong, options are: edit costs manually after, or contact support to delete the invoice. Future: "Undo this invoice" button on detail page (would reverse the cost_changes rows).
- **Invoice deletion from the UI.** Not built in v1. Audit purity > convenience. Manual via D1 if needed; PDF object deletion needs to happen in the same flow.
- **Photo upload (JPEG/HEIC).** PDF only. Photo OCR is a future feature.
- **Multi-page invoices >5MB.** Same constraint as menu import.
- **Supplier deduplication.** "Bidvest" and "Bidvest Foodservice" are separate supplier strings. Future feature.
- **Search across invoices / OCR indexing of PDF content.** Not built. Future.
- **Bulk download / archive export.** Future.
- **Pushing cost-change-driven price increases back to sale prices.** Out of scope — Pour IQ™ is descriptive for invoices, not prescriptive for menu pricing.

---

## Privacy policy update (Phase 2)

Section 3.5 of `src/app/privacy-policy/page.tsx` needs a one-line addition under **Retention**: scanned supplier invoice PDFs are retained for the lifetime of the Pour IQ™ licence plus the 2-year tail after cancellation, then deleted along with all other Pour IQ™ data. Matches the existing policy language for menu data. Land this change in PR 2 (frontend) so the policy goes live the same time the feature does.

---

## Testing

Project has Playwright e2e only; no unit/component framework. Verification is `npm run lint`, `npm run build` (runs `tsc`), and manual integration.

### PR 1 (backend)

- `npm run build` clean
- `npm run lint` clean
- D1 migration applies cleanly to local + remote
- Manual `curl` walkthrough:
  - Upload a sample PDF → ticket returned, PDF visible at `pouriq-invoices/_pending/{ticket}.pdf` in R2
  - Extract with ticket → preview payload returned with sensible match status for each line
  - Commit with synthesised body → invoice row created, lines created, cost_changes created, library updated, PDF moved to `pouriq-invoices/{tenant}/{invoice}.pdf`
  - GET single invoice → returns header + lines
  - GET invoice list → returns recent invoices
  - GET PDF → streams the PDF
  - SQL check: after commit, `SELECT * FROM pouriq_cost_changes WHERE invoice_id = ?` shows one row per applied line, `source='invoice'`
  - Edit a library cost manually via the existing form → check `pouriq_cost_changes` shows a `source='manual'` row

### PR 2 (frontend)

- `npm run build` + `npm run lint` clean
- Manual walkthrough against deploy preview (trade login is gated locally):
  - Upload a real supplier PDF → preview renders with auto-ticked matches
  - Untick a line → it doesn't apply
  - Override the new price on a line → that price commits
  - Mark an unmatched line as "create new entry" → new library row appears after Save
  - Save → redirect to impact page → combined ripple visible with menu rollups + per-drink table
  - "Recent invoices" link → ledger shows the new entry
  - Click an invoice in the ledger → detail page shows applied + skipped lines + Download PDF
  - Download PDF → file streams correctly with sensible filename
  - Privacy policy → updated retention line is live

### CI

Both PRs cut from `origin/main`. Standard CI: lint + build + Cloudflare Workers build. Branch discipline rule: PR 2 cuts a fresh branch after PR 1 merges; no commits on the merged branch.

---

## File-level change summary

### PR 1 — `feat/pouriq-invoice-scanning-backend`

| File | Change |
|---|---|
| `migrations/0025_pouriq_invoices.sql` | **New.** Three tables + indexes. |
| `src/lib/pouriq/invoice-prompts.ts` | **New.** Claude system prompt + tool schema. |
| `src/lib/pouriq/invoice-extract.ts` | **New.** Anthropic call wrapper. |
| `src/lib/pouriq/invoice-match.ts` | **New.** Size-aware match wrapper. |
| `src/lib/pouriq/invoices.ts` | **New.** D1 CRUD for invoices + lines. |
| `src/lib/pouriq/cost-changes.ts` | **New.** D1 helpers for the audit table. |
| `src/lib/pouriq/multi-cost-impact.ts` | **New.** Multi-ingredient projection. |
| `src/lib/pouriq/ingredient-library.ts` | **Modified.** `updateLibraryEntry` logs to `cost_changes`. |
| `src/app/api/pouriq/invoices/upload/route.ts` | **New.** PDF → R2 with magic-byte check. |
| `src/app/api/pouriq/invoices/extract/route.ts` | **New.** Claude extraction → preview. |
| `src/app/api/pouriq/invoices/commit/route.ts` | **New.** Atomic commit + R2 move. |
| `src/app/api/pouriq/invoices/route.ts` | **New.** List recent invoices. |
| `src/app/api/pouriq/invoices/[id]/route.ts` | **New.** Single invoice with lines. |
| `src/app/api/pouriq/invoices/[id]/pdf/route.ts` | **New.** Stream stored PDF. |

### PR 2 — `feat/pouriq-invoice-scanning-frontend`

| File | Change |
|---|---|
| `src/app/trade/pouriq/invoices/new/page.tsx` | **New.** Full scan flow page. |
| `src/app/trade/pouriq/invoices/[id]/impact/page.tsx` | **New.** Post-commit combined ripple page. |
| `src/app/trade/pouriq/invoices/page.tsx` | **New.** Ledger view. |
| `src/app/trade/pouriq/invoices/[id]/page.tsx` | **New.** Invoice detail page. |
| `src/components/pouriq/InvoiceUpload.tsx` | **New.** Drag-drop component. |
| `src/components/pouriq/InvoicePreview.tsx` | **New.** Header card + line table + Save. |
| `src/components/pouriq/InvoiceLinesTable.tsx` | **New.** Pure presentational lines table. |
| `src/components/pouriq/InvoiceImpactView.tsx` | **New.** Wraps `RipplePreview` for the impact page. |
| `src/components/pouriq/InvoiceList.tsx` | **New.** Ledger table. |
| `src/components/pouriq/InvoiceDetailView.tsx` | **New.** Detail page content with PDF download. |
| `src/app/trade/pouriq/library/page.tsx` | **Modified.** Add "Scan an invoice" and "Recent invoices" buttons. |
| `src/app/privacy-policy/page.tsx` | **Modified.** Section 3.5 retention line includes scanned-PDF retention. |

---

## Future work (not this spec)

1. **Invoice undo / correction.** Reverse a scan's cost_changes and restore the prior library state. Needs care around concurrent later changes.
2. **OCR search over invoice PDFs.** Index the extracted text from each PDF; let users search "show me every Smirnoff invoice this year." Useful once enough invoices exist.
3. **Photo upload (JPEG/HEIC).** Phone-camera shots of paper invoices. Claude's vision can handle this; needs a different upload path and possibly de-skew preprocessing.
4. **Historical cost-drift tracking.** "Vodka is up 15% over 3 months." The `pouriq_cost_changes` table is the foundation; this is the future feature that justifies storing the audit data now.
5. **Supplier deduplication and total-spend tracking.** Once 2-3 venues have run on Pour IQ™ long enough for supplier patterns to emerge, surface a per-supplier ledger with total spend over time. Carefully scoped to stay out of accounts-payable territory.
