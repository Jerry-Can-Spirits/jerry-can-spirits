# Pour IQ™ AI Invoice Scanning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop a supplier PDF, Claude extracts the line items, fuzzy-match against the tenant's ingredient library, user reviews and commits, dedicated post-commit ripple page shows combined GP impact across every drink affected. Original PDFs retained per-tenant in R2 for the lifetime of the licence.

**Architecture:** Two sequential PRs cut from `origin/main`. PR 1 (backend) lands the schema, library helpers, AI extraction wrapper, and six API routes — exercisable via `curl` without any UI. PR 2 (frontend) builds the scan flow page, ledger, invoice detail page with PDF download, the post-commit impact page, and the library-page entry points.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Cloudflare Workers + D1 + R2 + KV, Anthropic Claude Sonnet 4.6, `@headlessui/react`. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-14-pouriq-ai-invoice-scanning-design.md](../specs/2026-05-14-pouriq-ai-invoice-scanning-design.md)

**Verification path (project reality):** `npm run lint`, `npm run build` (runs `tsc`), and manual integration checks. No unit test framework is installed; do not introduce one. Backend routes can be exercised via `curl` against `npm run dev`.

---

## Phase 1 — PR 1: Backend `feat/pouriq-invoice-scanning-backend`

**Branch:** already created. The spec is already committed on this branch (commit `aaede6a`).

### Task 1: Schema migration

**Files:**
- Create: `migrations/0025_pouriq_invoices.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0025_pouriq_invoices.sql
-- Adds AI invoice scanning: invoices, invoice line items, cost-change audit log.

CREATE TABLE pouriq_invoices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES pouriq_trade_accounts(id) ON DELETE CASCADE,
  supplier_name TEXT,
  invoice_number TEXT,
  invoice_date TEXT,
  net_total_p INTEGER,
  line_count INTEGER NOT NULL,
  applied_line_count INTEGER NOT NULL,
  r2_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_invoices_tenant ON pouriq_invoices(trade_account_id, created_at DESC);

CREATE TABLE pouriq_invoice_lines (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id TEXT NOT NULL REFERENCES pouriq_invoices(id) ON DELETE CASCADE,
  extracted_name TEXT NOT NULL,
  extracted_quantity INTEGER,
  extracted_unit_price_p INTEGER NOT NULL,
  extracted_line_total_p INTEGER,
  matched_library_id TEXT REFERENCES pouriq_ingredients_library(id) ON DELETE SET NULL,
  applied INTEGER NOT NULL DEFAULT 0 CHECK (applied IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_invoice_lines_invoice ON pouriq_invoice_lines(invoice_id);

CREATE TABLE pouriq_cost_changes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('bottle', 'unit')),
  old_cost_p INTEGER,
  new_cost_p INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'invoice')),
  invoice_id TEXT REFERENCES pouriq_invoices(id) ON DELETE SET NULL,
  invoice_line_id TEXT REFERENCES pouriq_invoice_lines(id) ON DELETE SET NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_cost_changes_ingredient ON pouriq_cost_changes(library_ingredient_id, changed_at DESC);
CREATE INDEX idx_pouriq_cost_changes_invoice ON pouriq_cost_changes(invoice_id);
```

- [ ] **Step 2: Apply to local D1**

```bash
npx wrangler d1 migrations apply jerry-can-spirits-db --local
```

Expected output mentions `0025_pouriq_invoices.sql` applied.

- [ ] **Step 3: Commit**

```bash
git add migrations/0025_pouriq_invoices.sql
git commit -m "feat(pouriq): migration 0025 — invoices, invoice lines, cost change audit"
```

---

### Task 2: AI extraction prompt + tool schema

**Files:**
- Create: `src/lib/pouriq/invoice-prompts.ts`

- [ ] **Step 1: Create the file**

```ts
export const EXTRACT_INVOICE_SYSTEM_PROMPT = `You are an extraction engine inside Pour IQ. You receive a UK trade-supplier invoice (drinks, ingredients, food) addressed to a bar, pub, restaurant, or hotel. Return every billable product line with its per-unit net price.

What counts as a line:
- Each billable product on the invoice. Capture the product name as written, including brand and size when shown ("Smirnoff Red Label 1L" keeps the 1L).
- Skip section headers, subtotals, totals, VAT lines, delivery charges, fuel surcharges, deposits, returns, and any line that isn't a billable product the venue is buying.

Price rules — extract NET of VAT per unit:
- Pour IQ stores ex-VAT costs because trade venues reclaim VAT. Always extract the per-unit (per-bottle, per-pack, per-case-unit) NET price.
- If the line shows both net and gross, use net.
- If the line only shows gross (inc-VAT), divide by 1.20 and round to the nearest pence. Don't return gross.
- Never return the line total. Never return the total of multiple units bought.
- Express prices in integer pence: £14.50 = 1450.

Quantity:
- Capture how many units were bought on the line if visible (12 bottles, 6 cases, etc). Informational only; not used in the cost calculation.

Header data:
- supplier_name: the company billing the venue. Null if not clearly visible.
- invoice_number: the supplier's reference for this invoice. Null if not clearly visible.
- invoice_date: ISO YYYY-MM-DD. Null if not clearly visible or ambiguous.

If a line is unreadable or ambiguous, skip it rather than guess.

Output: call the pouriq_extract_invoice tool with the structured result.`

export interface ExtractedInvoiceLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
}

export interface ExtractInvoiceResult {
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  lines: ExtractedInvoiceLine[]
}

export const EXTRACT_INVOICE_TOOL = {
  name: 'pouriq_extract_invoice',
  description: 'Return the structured invoice header and line items extracted from the supplier invoice',
  input_schema: {
    type: 'object',
    required: ['supplier_name', 'invoice_number', 'invoice_date', 'lines'],
    properties: {
      supplier_name: { type: ['string', 'null'] },
      invoice_number: { type: ['string', 'null'] },
      invoice_date: { type: ['string', 'null'] },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          required: ['extracted_name', 'extracted_unit_price_p'],
          properties: {
            extracted_name: { type: 'string' },
            extracted_quantity: { type: ['integer', 'null'] },
            extracted_unit_price_p: { type: 'integer' },
            extracted_line_total_p: { type: ['integer', 'null'] },
          },
        },
      },
    },
  },
} as const
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/invoice-prompts.ts
git commit -m "feat(pouriq): Claude prompt + tool schema for invoice extraction"
```

---

### Task 3: Anthropic call wrapper

**Files:**
- Create: `src/lib/pouriq/invoice-extract.ts`

- [ ] **Step 1: Create the file**

```ts
import {
  EXTRACT_INVOICE_SYSTEM_PROMPT,
  EXTRACT_INVOICE_TOOL,
  type ExtractInvoiceResult,
} from './invoice-prompts'

interface ExtractArgs {
  apiKey: string
  model?: string
  pdfBase64: string
}

interface FinalUsage {
  prompt_tokens: number
  output_tokens: number
  model: string
}

export interface ExtractInvoiceCallResult {
  result: ExtractInvoiceResult
  usage: FinalUsage
  stopReason: string
}

type UserContentBlock =
  | { type: 'text'; text: string }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }

export async function extractInvoiceWithAnthropic(args: ExtractArgs): Promise<ExtractInvoiceCallResult> {
  const model = args.model ?? 'claude-sonnet-4-6'

  const userContent: UserContentBlock[] = [
    {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: args.pdfBase64 },
    },
    {
      type: 'text',
      text: 'Extract every billable product line from this invoice using the pouriq_extract_invoice tool.',
    },
  ]

  const body = {
    model,
    max_tokens: 16384,
    system: [
      { type: 'text', text: EXTRACT_INVOICE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ],
    tools: [EXTRACT_INVOICE_TOOL],
    tool_choice: { type: 'tool', name: 'pouriq_extract_invoice' },
    messages: [{ role: 'user', content: userContent }],
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Anthropic ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; name?: string; input?: unknown }>
    stop_reason?: string
    usage?: { input_tokens?: number; output_tokens?: number }
  }

  const toolUse = data.content.find((c) => c.type === 'tool_use' && c.name === 'pouriq_extract_invoice')
  if (!toolUse || !toolUse.input) {
    throw new Error('Anthropic did not return the extraction tool output')
  }

  return {
    result: toolUse.input as ExtractInvoiceResult,
    usage: {
      prompt_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0,
      model,
    },
    stopReason: data.stop_reason ?? 'unknown',
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/invoice-extract.ts
git commit -m "feat(pouriq): Anthropic wrapper for invoice PDF extraction"
```

---

### Task 4: Size-aware match wrapper

**Files:**
- Create: `src/lib/pouriq/invoice-match.ts`

- [ ] **Step 1: Create the file**

```ts
import { matchIngredient, type MatchStatus } from './match'
import type { IngredientLibraryRow } from './types'

const SIZE_RE = /(\d+(?:\.\d+)?)\s?(ml|cl|l)\b/i

function extractSizeMl(name: string): number | null {
  const m = name.match(SIZE_RE)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (!Number.isFinite(n) || n <= 0) return null
  if (unit === 'ml') return Math.round(n)
  if (unit === 'cl') return Math.round(n * 10)
  if (unit === 'l') return Math.round(n * 1000)
  return null
}

/**
 * Match an extracted invoice line name against the tenant's library, preferring
 * entries whose bottle_size_ml matches a size suffix on the extracted name.
 * Avoids accidentally updating the 70cl Smirnoff library row from a 1L invoice line.
 *
 * Falls back to plain matchIngredient when there's no size suffix or no
 * size-matching candidate exists.
 */
export function matchInvoiceLine(
  extractedName: string,
  library: IngredientLibraryRow[],
): MatchStatus {
  const baseMatch = matchIngredient(extractedName, library)
  const sizeMl = extractSizeMl(extractedName)
  if (sizeMl === null) return baseMatch

  // If the base match is auto and sizes agree, keep it.
  if (baseMatch.kind === 'auto') {
    if (baseMatch.entry.bottle_size_ml === sizeMl) return baseMatch
    // Auto match but size mismatches — demote to suggestions if there's a
    // size-correct candidate among the library; otherwise keep the auto match
    // (the matcher's confidence likely outweighs the size hint).
    const sizeMatch = library.find(
      (e) => e.bottle_size_ml === sizeMl && e.id !== baseMatch.entry.id,
    )
    if (sizeMatch) {
      return { kind: 'suggestions', entries: [sizeMatch, baseMatch.entry] }
    }
    return baseMatch
  }

  if (baseMatch.kind === 'suggestions') {
    // Re-rank: size-matching candidates first.
    const sizeMatches = baseMatch.entries.filter((e) => e.bottle_size_ml === sizeMl)
    const others = baseMatch.entries.filter((e) => e.bottle_size_ml !== sizeMl)
    return { kind: 'suggestions', entries: [...sizeMatches, ...others] }
  }

  return baseMatch
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/invoice-match.ts
git commit -m "feat(pouriq): size-aware matcher for invoice line names"
```

---

### Task 5: Cost-change audit helpers + modify `updateLibraryEntry`

**Files:**
- Create: `src/lib/pouriq/cost-changes.ts`
- Modify: `src/lib/pouriq/ingredient-library.ts`

- [ ] **Step 1: Create `cost-changes.ts`**

```ts
// Helpers for the pouriq_cost_changes audit table. Cost changes can come from
// manual library edits (source='manual') or invoice commits (source='invoice').

export type CostChangeSource = 'manual' | 'invoice'
export type CostPricingMode = 'bottle' | 'unit'

export interface CostChangeInsert {
  library_ingredient_id: string
  pricing_mode: CostPricingMode
  old_cost_p: number | null
  new_cost_p: number
  source: CostChangeSource
  invoice_id?: string | null
  invoice_line_id?: string | null
}

/**
 * Insert a row into pouriq_cost_changes. Caller is responsible for ensuring
 * the cost actually changed before calling (we don't no-op on equality).
 */
export async function insertCostChange(
  db: D1Database,
  data: CostChangeInsert,
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO pouriq_cost_changes
        (library_ingredient_id, pricing_mode, old_cost_p, new_cost_p, source, invoice_id, invoice_line_id)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
    `)
    .bind(
      data.library_ingredient_id,
      data.pricing_mode,
      data.old_cost_p,
      data.new_cost_p,
      data.source,
      data.invoice_id ?? null,
      data.invoice_line_id ?? null,
    )
    .run()
}

export interface CostChangeRow {
  id: string
  library_ingredient_id: string
  pricing_mode: CostPricingMode
  old_cost_p: number | null
  new_cost_p: number
  source: CostChangeSource
  invoice_id: string | null
  invoice_line_id: string | null
  changed_at: string
}

export async function listCostChangesForInvoice(
  db: D1Database,
  invoiceId: string,
): Promise<CostChangeRow[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_cost_changes WHERE invoice_id = ?1 ORDER BY changed_at ASC`)
    .bind(invoiceId)
    .all<CostChangeRow>()
  return result.results ?? []
}
```

- [ ] **Step 2: Modify `updateLibraryEntry` to log cost changes**

Read the current file at `src/lib/pouriq/ingredient-library.ts`. Replace the entire `updateLibraryEntry` function (currently around line 80) with the version below. The function gains a cost-change detection step that reads the existing row, computes the pricing mode, and inserts a `pouriq_cost_changes` row if the relevant cost field changed.

```ts
export async function updateLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
  patch: Partial<Omit<IngredientLibraryInsert, 'trade_account_id'>>,
): Promise<void> {
  const allowedFields = [
    'name','ingredient_type','bottle_size_ml','bottle_cost_p','unit_cost_p','barcode','notes',
  ] as const

  // Read current state for cost-change detection before mutating.
  const before = await getLibraryEntry(db, id, tradeAccountId)
  if (!before) return

  const sets: string[] = []
  const binds: unknown[] = []
  let idx = 1
  for (const key of allowedFields) {
    if (key in patch) {
      sets.push(`${key} = ?${idx++}`)
      binds.push((patch as Record<string, unknown>)[key])
    }
  }
  if (sets.length === 0) return
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_ingredients_library SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()

  // Detect a cost change and log it. An entry is either bottle-priced
  // (bottle_cost_p set, unit_cost_p null) or unit-priced (the inverse).
  // The pricing mode in the audit row reflects the mode AFTER this update.
  const newBottleCost = ('bottle_cost_p' in patch) ? patch.bottle_cost_p ?? null : before.bottle_cost_p
  const newUnitCost = ('unit_cost_p' in patch) ? patch.unit_cost_p ?? null : before.unit_cost_p

  let mode: CostPricingMode | null = null
  let oldCost: number | null = null
  let newCost: number | null = null
  if (newUnitCost !== null) {
    mode = 'unit'
    oldCost = before.unit_cost_p
    newCost = newUnitCost
  } else if (newBottleCost !== null) {
    mode = 'bottle'
    oldCost = before.bottle_cost_p
    newCost = newBottleCost
  }

  if (mode && newCost !== null && oldCost !== newCost) {
    await insertCostChange(db, {
      library_ingredient_id: id,
      pricing_mode: mode,
      old_cost_p: oldCost,
      new_cost_p: newCost,
      source: 'manual',
    })
  }
}
```

Add the import at the top of the file:

```ts
import { insertCostChange, type CostPricingMode } from './cost-changes'
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/pouriq/cost-changes.ts src/lib/pouriq/ingredient-library.ts
git commit -m "feat(pouriq): cost change audit table + log manual edits"
```

---

### Task 6: Invoice CRUD helpers

**Files:**
- Create: `src/lib/pouriq/invoices.ts`

- [ ] **Step 1: Create the file**

```ts
import type { IngredientType } from './types'

export interface InvoiceRow {
  id: string
  trade_account_id: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  net_total_p: number | null
  line_count: number
  applied_line_count: number
  r2_key: string | null
  created_at: string
}

export interface InvoiceLineRow {
  id: string
  invoice_id: string
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  matched_library_id: string | null
  applied: number
  created_at: string
}

export interface InsertInvoiceHeader {
  trade_account_id: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  line_count: number
}

export interface InsertInvoiceLine {
  invoice_id: string
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  matched_library_id: string | null
  applied: boolean
}

export interface NewLibraryFromInvoice {
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
}

export async function insertInvoiceHeader(
  db: D1Database,
  data: InsertInvoiceHeader,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_invoices
        (trade_account_id, supplier_name, invoice_number, invoice_date, line_count, applied_line_count)
      VALUES (?1, ?2, ?3, ?4, ?5, 0)
      RETURNING id
    `)
    .bind(
      data.trade_account_id,
      data.supplier_name,
      data.invoice_number,
      data.invoice_date,
      data.line_count,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Invoice header insert returned no id')
  return result.id
}

export async function insertInvoiceLine(
  db: D1Database,
  data: InsertInvoiceLine,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_invoice_lines
        (invoice_id, extracted_name, extracted_quantity, extracted_unit_price_p, extracted_line_total_p, matched_library_id, applied)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id
    `)
    .bind(
      data.invoice_id,
      data.extracted_name,
      data.extracted_quantity,
      data.extracted_unit_price_p,
      data.extracted_line_total_p,
      data.matched_library_id,
      data.applied ? 1 : 0,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Invoice line insert returned no id')
  return result.id
}

export async function finaliseInvoiceTotals(
  db: D1Database,
  invoiceId: string,
  appliedLineCount: number,
  netTotalP: number | null,
  r2Key: string | null,
): Promise<void> {
  await db
    .prepare(`
      UPDATE pouriq_invoices
      SET applied_line_count = ?1, net_total_p = ?2, r2_key = ?3
      WHERE id = ?4
    `)
    .bind(appliedLineCount, netTotalP, r2Key, invoiceId)
    .run()
}

export async function getInvoice(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<InvoiceRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<InvoiceRow>()
}

export async function listInvoiceLines(
  db: D1Database,
  invoiceId: string,
): Promise<InvoiceLineRow[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_invoice_lines WHERE invoice_id = ?1 ORDER BY created_at ASC`)
    .bind(invoiceId)
    .all<InvoiceLineRow>()
  return result.results ?? []
}

export async function listInvoicesForTenant(
  db: D1Database,
  tradeAccountId: string,
  limit: number = 100,
): Promise<InvoiceRow[]> {
  const result = await db
    .prepare(`
      SELECT * FROM pouriq_invoices
      WHERE trade_account_id = ?1
      ORDER BY created_at DESC
      LIMIT ?2
    `)
    .bind(tradeAccountId, limit)
    .all<InvoiceRow>()
  return result.results ?? []
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/invoices.ts
git commit -m "feat(pouriq): D1 CRUD for invoices and invoice lines"
```

---

### Task 7: Multi-ingredient cost-impact loader

**Files:**
- Create: `src/lib/pouriq/multi-cost-impact.ts`

- [ ] **Step 1: Create the file**

```ts
// Combined cost-change ripple across many ingredients in one pass.
// Used by the post-invoice-commit impact page.
//
// IMPORTANT: this loader runs AFTER the commit has already updated the
// library to the new costs. To reconstruct the pre-commit state for the
// "current" side of the ripple, the caller passes both old and new cost
// per change. Loader substitutes the old cost back in when computing
// the current contribution.

import { rollupByMenu, type MenuRollup, type ProjectedCocktail } from './cost-impact'

export interface AppliedCostChange {
  library_ingredient_id: string
  pricing_mode: 'bottle' | 'unit'
  old_cost_p: number | null     // null when the library entry was just created by this invoice
  new_cost_p: number
}

export interface MultiCostImpactPayload {
  projected: ProjectedCocktail[]
  rollups: MenuRollup[]
  affected_drink_count: number
  newly_below_target_count: number
}

interface RawRow {
  cocktail_id: string
  cocktail_name: string
  cocktail_sale_price_p: number
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  menu_prices_include_vat: number
  ingredient_library_id: string
  ingredient_pour_ml: number | null
  ingredient_unit_count: number | null
  lib_bottle_size_ml: number | null
  lib_bottle_cost_p: number | null
  lib_unit_cost_p: number | null
}

const VAT_DIVISOR = 1.20
function netSalePrice(salePriceP: number, includeVat: boolean): number {
  if (!includeVat) return salePriceP
  return Math.round(salePriceP / VAT_DIVISOR)
}

function placeholders(n: number, offset: number): string {
  const parts: string[] = []
  for (let i = 0; i < n; i++) parts.push(`?${offset + i}`)
  return parts.join(', ')
}

/**
 * Pour cost contribution of a single ingredient row using the supplied
 * bottle_cost_p / unit_cost_p (which may be the current OR the historical
 * pre-commit value).
 */
function contributionP(
  row: Pick<RawRow, 'ingredient_pour_ml' | 'ingredient_unit_count' | 'lib_bottle_size_ml'>,
  bottleCostP: number | null,
  unitCostP: number | null,
): number {
  if (unitCostP !== null) {
    const count = row.ingredient_unit_count ?? 1
    return Math.round(unitCostP * count)
  }
  if (
    row.lib_bottle_size_ml !== null &&
    bottleCostP !== null &&
    row.ingredient_pour_ml !== null
  ) {
    return Math.round((bottleCostP / row.lib_bottle_size_ml) * row.ingredient_pour_ml)
  }
  return 0
}

export async function loadMultiCostImpact(
  db: D1Database,
  tradeAccountId: string,
  changes: AppliedCostChange[],
): Promise<MultiCostImpactPayload> {
  if (changes.length === 0) {
    return { projected: [], rollups: [], affected_drink_count: 0, newly_below_target_count: 0 }
  }

  // De-dupe by library_ingredient_id: if the same ingredient was updated
  // twice in one invoice (rare; "same product appears twice on the invoice"
  // edge case), take the latest cost change. Caller is responsible for
  // ordering changes oldest-first; this loop preserves last-wins.
  const changeByIngredient = new Map<string, AppliedCostChange>()
  for (const c of changes) changeByIngredient.set(c.library_ingredient_id, c)
  const dedupedChanges = Array.from(changeByIngredient.values())
  const changedIds = dedupedChanges.map((c) => c.library_ingredient_id)

  // Pull every ingredient row of every cocktail that uses at least one of
  // the changed library entries. Library cost fields here are POST-commit;
  // we substitute old values back in when computing current state.
  const sql = `
    WITH affected AS (
      SELECT DISTINCT c.id AS cocktail_id
      FROM pouriq_ingredients i
      JOIN pouriq_cocktails c ON c.id = i.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE i.library_ingredient_id IN (${placeholders(changedIds.length, 1)})
        AND m.trade_account_id = ?${changedIds.length + 1}
    )
    SELECT
      c.id AS cocktail_id,
      c.name AS cocktail_name,
      c.sale_price_p AS cocktail_sale_price_p,
      m.id AS menu_id,
      m.name AS menu_name,
      m.target_gp_pct AS menu_target_gp_pct,
      m.prices_include_vat AS menu_prices_include_vat,
      i.library_ingredient_id AS ingredient_library_id,
      i.pour_ml AS ingredient_pour_ml,
      i.unit_count AS ingredient_unit_count,
      lib.bottle_size_ml AS lib_bottle_size_ml,
      lib.bottle_cost_p AS lib_bottle_cost_p,
      lib.unit_cost_p AS lib_unit_cost_p
    FROM affected a
    JOIN pouriq_cocktails c ON c.id = a.cocktail_id
    JOIN pouriq_menus m ON m.id = c.menu_id
    JOIN pouriq_ingredients i ON i.cocktail_id = c.id
    JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
    ORDER BY m.name, c.name
  `
  const result = await db
    .prepare(sql)
    .bind(...changedIds, tradeAccountId)
    .all<RawRow>()

  const rows = result.results ?? []
  const byCocktail = new Map<string, RawRow[]>()
  for (const row of rows) {
    if (!byCocktail.has(row.cocktail_id)) byCocktail.set(row.cocktail_id, [])
    byCocktail.get(row.cocktail_id)!.push(row)
  }

  const projected: ProjectedCocktail[] = []
  for (const cocktailRows of byCocktail.values()) {
    const first = cocktailRows[0]
    let currentTotal = 0
    let projectedTotal = 0

    for (const r of cocktailRows) {
      const change = changeByIngredient.get(r.ingredient_library_id)

      // Current contribution = use the pre-commit cost where this row was
      // changed by the invoice; otherwise the library's current value
      // (unchanged for non-targeted ingredients).
      let curBottle = r.lib_bottle_cost_p
      let curUnit = r.lib_unit_cost_p
      if (change) {
        // The library is currently at the NEW cost. Substitute OLD for the
        // pricing-mode field, but only if old_cost_p is non-null (first-cost
        // case has no historical value).
        if (change.pricing_mode === 'bottle') {
          curBottle = change.old_cost_p
        } else {
          curUnit = change.old_cost_p
        }
      }
      currentTotal += contributionP(r, curBottle, curUnit)

      // Projected contribution = use the new cost where this row was
      // changed (library is already at this value); otherwise unchanged.
      let newBottle = r.lib_bottle_cost_p
      let newUnit = r.lib_unit_cost_p
      if (change) {
        if (change.pricing_mode === 'bottle') {
          newBottle = change.new_cost_p
        } else {
          newUnit = change.new_cost_p
        }
      }
      projectedTotal += contributionP(r, newBottle, newUnit)
    }

    const includeVat = first.menu_prices_include_vat === 1
    const netSale = netSalePrice(first.cocktail_sale_price_p, includeVat)
    const currentMargin = netSale - currentTotal
    const projectedMargin = netSale - projectedTotal
    const currentGpPct = netSale === 0 ? 0 : (currentMargin / netSale) * 100
    const projectedGpPct = netSale === 0 ? 0 : (projectedMargin / netSale) * 100

    projected.push({
      cocktail_id: first.cocktail_id,
      cocktail_name: first.cocktail_name,
      menu_id: first.menu_id,
      menu_name: first.menu_name,
      menu_target_gp_pct: first.menu_target_gp_pct,
      menu_prices_include_vat: includeVat,
      sale_price_p: first.cocktail_sale_price_p,
      current_pour_cost_p: currentTotal,
      // current_ingredient_contribution_p is per-ingredient in the
      // single-cost case; here we set it to 0 because the projected page
      // does not need it (RipplePreview renders current/projected totals
      // only). Keeps the type compatible.
      current_ingredient_contribution_p: 0,
      pour_ml: null,
      unit_count: null,
      projected_pour_cost_p: projectedTotal,
      projected_margin_p: projectedMargin,
      projected_gp_pct: Math.round(projectedGpPct * 10) / 10,
      current_gp_pct: Math.round(currentGpPct * 10) / 10,
      current_margin_p: currentMargin,
      below_target_now: currentGpPct < first.menu_target_gp_pct,
      below_target_after: projectedGpPct < first.menu_target_gp_pct,
    })
  }

  const rollups = rollupByMenu(projected)
  const newlyBelow = projected.filter((p) => !p.below_target_now && p.below_target_after)
  return {
    projected,
    rollups,
    affected_drink_count: projected.length,
    newly_below_target_count: newlyBelow.length,
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/multi-cost-impact.ts
git commit -m "feat(pouriq): multi-ingredient cost impact loader for invoice ripple"
```

---

### Task 8: Upload route

**Files:**
- Create: `src/app/api/pouriq/invoices/upload/route.ts`

- [ ] **Step 1: Create the file**

```ts
// POST /api/pouriq/invoices/upload
// multipart/form-data with a single `file` field (PDF only).
// Returns { ticket, filename }.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]
const UPLOAD_RATE_LIMIT = 30

function startsWithBytes(buf: Uint8Array, prefix: number[]): boolean {
  if (buf.length < prefix.length) return false
  for (let i = 0; i < prefix.length; i++) if (buf[i] !== prefix[i]) return false
  return true
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const r2 = env.TRADE_DOCS as R2Bucket

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'pouriq-invoice-upload', ip, UPLOAD_RATE_LIMIT, 3600)) {
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
  if (!startsWithBytes(buffer, PDF_MAGIC)) {
    return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
  }

  const ticket = crypto.randomUUID()
  const key = `pouriq-invoices/_pending/${ticket}.pdf`
  await r2.put(key, buffer, {
    httpMetadata: { contentType: 'application/pdf' },
    customMetadata: {
      originalName: file.name || 'invoice.pdf',
      ts: new Date().toISOString(),
      tradeAccountId: access.tradeAccountId,
    },
  })

  return NextResponse.json({ ticket, filename: file.name || 'invoice.pdf' })
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pouriq/invoices/upload/route.ts
git commit -m "feat(pouriq): POST /api/pouriq/invoices/upload"
```

---

### Task 9: Extract route

**Files:**
- Create: `src/app/api/pouriq/invoices/extract/route.ts`

- [ ] **Step 1: Create the file**

```ts
// POST /api/pouriq/invoices/extract
// JSON body: { ticket: string }
// Loads the uploaded PDF from R2, runs Claude extraction, matches each line
// against the tenant library, returns preview payload.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
import { extractInvoiceWithAnthropic } from '@/lib/pouriq/invoice-extract'
import { matchInvoiceLine } from '@/lib/pouriq/invoice-match'

export const runtime = 'nodejs'

const EXTRACT_RATE_LIMIT = 60

export interface PreviewLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  match:
    | { kind: 'auto'; library_id: string; library_name: string }
    | { kind: 'suggestions'; entries: Array<{ id: string; name: string }> }
    | { kind: 'no-match' }
}

export interface PreviewPayload {
  ticket: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  lines: PreviewLine[]
}

interface Body { ticket: string }

function bufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64')
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket

  if (!env.ANTHROPIC_API_KEY) {
    Sentry.captureMessage('pouriq-invoice-extract: ANTHROPIC_API_KEY missing', { tags: { route: 'pouriq-invoice-extract', phase: 'config' } })
    return NextResponse.json({ error: 'Invoice scanning is temporarily unavailable. Please try again later.' }, { status: 503 })
  }

  if (await isRateLimited(kv, 'pouriq-invoice-extract', access.tradeAccountId, EXTRACT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many extractions. Please try again later.' }, { status: 429 })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.ticket || typeof body.ticket !== 'string') {
    return NextResponse.json({ error: 'Missing ticket' }, { status: 400 })
  }

  const pdfR2Key = `pouriq-invoices/_pending/${body.ticket}.pdf`
  const obj = await r2.get(pdfR2Key)
  if (!obj) {
    return NextResponse.json({ error: 'Upload expired — please re-upload the PDF' }, { status: 400 })
  }
  const buffer = await obj.arrayBuffer()
  const pdfBase64 = bufferToBase64(buffer)

  let extracted
  try {
    extracted = await extractInvoiceWithAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      pdfBase64,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-extract', phase: 'anthropic' } })
    return NextResponse.json({ error: 'Could not read your invoice — try a clearer scan' }, { status: 502 })
  }

  if (extracted.stopReason === 'max_tokens') {
    Sentry.captureMessage('pouriq-invoice-extract: hit max_tokens', {
      level: 'warning',
      tags: { route: 'pouriq-invoice-extract', phase: 'anthropic', stop_reason: 'max_tokens' },
      extra: { lineCount: extracted.result.lines?.length ?? 0 },
    })
  }

  if (!extracted.result.lines || extracted.result.lines.length === 0) {
    Sentry.captureMessage('pouriq-invoice-extract: empty lines array', {
      level: 'warning',
      tags: { route: 'pouriq-invoice-extract', phase: 'anthropic' },
    })
    return NextResponse.json({ error: 'No items found in invoice — try a clearer scan' }, { status: 422 })
  }

  const library = await listLibraryEntries(db, access.tradeAccountId)
  const lines: PreviewLine[] = extracted.result.lines.map((line) => {
    const matched = matchInvoiceLine(line.extracted_name, library)
    let match: PreviewLine['match']
    if (matched.kind === 'auto') {
      match = { kind: 'auto', library_id: matched.entry.id, library_name: matched.entry.name }
    } else if (matched.kind === 'suggestions') {
      match = {
        kind: 'suggestions',
        entries: matched.entries.map((e) => ({ id: e.id, name: e.name })),
      }
    } else {
      match = { kind: 'no-match' }
    }
    return {
      extracted_name: line.extracted_name,
      extracted_quantity: line.extracted_quantity,
      extracted_unit_price_p: line.extracted_unit_price_p,
      extracted_line_total_p: line.extracted_line_total_p,
      match,
    }
  })

  const payload: PreviewPayload = {
    ticket: body.ticket,
    supplier_name: extracted.result.supplier_name,
    invoice_number: extracted.result.invoice_number,
    invoice_date: extracted.result.invoice_date,
    lines,
  }

  return NextResponse.json(payload)
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pouriq/invoices/extract/route.ts
git commit -m "feat(pouriq): POST /api/pouriq/invoices/extract"
```

---

### Task 10: Commit route

**Files:**
- Create: `src/app/api/pouriq/invoices/commit/route.ts`

- [ ] **Step 1: Create the file**

```ts
// POST /api/pouriq/invoices/commit
// JSON body: ticket + header + lines (with applied/library refs)
// Atomic: invoice + lines + cost_changes + library updates, then R2 move.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  insertInvoiceHeader,
  insertInvoiceLine,
  finaliseInvoiceTotals,
} from '@/lib/pouriq/invoices'
import { insertCostChange, type CostPricingMode } from '@/lib/pouriq/cost-changes'
import { getLibraryEntry, insertLibraryEntry } from '@/lib/pouriq/ingredient-library'
import type { IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

const COMMIT_RATE_LIMIT = 30

const INGREDIENT_TYPES: ReadonlyArray<IngredientType> = [
  'spirit', 'liqueur', 'wine', 'beer', 'mixer', 'syrup', 'juice', 'garnish', 'other',
]

interface CommitLineNewLibrary {
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
}

interface CommitLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  applied: boolean
  library_id?: string
  new_library?: CommitLineNewLibrary
  new_cost_p?: number
}

interface CommitBody {
  ticket: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  lines: CommitLine[]
}

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0
}

function isNonNegativeInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

function validateBody(body: CommitBody): string | null {
  if (!body.ticket || typeof body.ticket !== 'string') return 'Missing ticket'
  if (!Array.isArray(body.lines) || body.lines.length === 0) return 'No lines provided'
  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i]
    if (typeof line.extracted_name !== 'string' || !line.extracted_name.trim()) {
      return `Line ${i + 1}: extracted_name required`
    }
    if (!isNonNegativeInteger(line.extracted_unit_price_p)) {
      return `Line ${i + 1}: extracted_unit_price_p must be a non-negative integer`
    }
    if (line.applied) {
      const hasExisting = typeof line.library_id === 'string' && line.library_id.length > 0
      const hasNew = !!line.new_library
      if (hasExisting === hasNew) {
        return `Line ${i + 1}: applied line must reference exactly one library entry (existing OR new)`
      }
      if (!isNonNegativeInteger(line.new_cost_p)) {
        return `Line ${i + 1}: applied line must include new_cost_p as a non-negative integer`
      }
      if (hasNew && line.new_library) {
        const nl = line.new_library
        if (!nl.name || typeof nl.name !== 'string' || !nl.name.trim()) return `Line ${i + 1}: new library name required`
        if (!INGREDIENT_TYPES.includes(nl.ingredient_type)) return `Line ${i + 1}: invalid ingredient_type`
        const hasBottle = nl.bottle_size_ml !== null && nl.bottle_cost_p !== null
        const hasUnit = nl.unit_cost_p !== null
        if (hasBottle === hasUnit) return `Line ${i + 1}: new library must be either bottle-priced or unit-priced`
        if (hasBottle && !isPositiveInteger(nl.bottle_size_ml)) return `Line ${i + 1}: bottle_size_ml must be a positive integer`
        if (hasBottle && !isNonNegativeInteger(nl.bottle_cost_p)) return `Line ${i + 1}: bottle_cost_p must be a non-negative integer`
        if (hasUnit && !isNonNegativeInteger(nl.unit_cost_p)) return `Line ${i + 1}: unit_cost_p must be a non-negative integer`
      }
    }
  }
  return null
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket

  if (await isRateLimited(kv, 'pouriq-invoice-commit', access.tradeAccountId, COMMIT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many commits. Please try again later.' }, { status: 429 })
  }

  let body: CommitBody
  try {
    body = (await request.json()) as CommitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const validationError = validateBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  // 1. Insert the invoice header.
  let invoiceId: string
  try {
    invoiceId = await insertInvoiceHeader(db, {
      trade_account_id: access.tradeAccountId,
      supplier_name: body.supplier_name?.trim() || null,
      invoice_number: body.invoice_number?.trim() || null,
      invoice_date: body.invoice_date?.trim() || null,
      line_count: body.lines.length,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'header' } })
    return NextResponse.json({ error: 'Could not save invoice header' }, { status: 500 })
  }

  // 2. For each line: insert new library if needed, update existing library
  //    cost if it changed, insert cost_changes audit, insert invoice_line row.
  let appliedCount = 0
  let netTotalP: number | null = null
  let netSawAny = false

  try {
    for (const line of body.lines) {
      let matchedLibraryId: string | null = null
      if (line.applied) {
        let libraryId: string
        let oldCostP: number | null = null
        let pricingMode: CostPricingMode

        if (line.new_library) {
          libraryId = await insertLibraryEntry(db, {
            trade_account_id: access.tradeAccountId,
            name: line.new_library.name.trim(),
            ingredient_type: line.new_library.ingredient_type,
            bottle_size_ml: line.new_library.bottle_size_ml,
            bottle_cost_p: line.new_library.bottle_cost_p,
            unit_cost_p: line.new_library.unit_cost_p,
            barcode: null,
            notes: null,
          })
          pricingMode = line.new_library.unit_cost_p !== null ? 'unit' : 'bottle'
          oldCostP = null
        } else {
          libraryId = line.library_id!
          const existing = await getLibraryEntry(db, libraryId, access.tradeAccountId)
          if (!existing) {
            throw new Error(`Library entry ${libraryId} not found for tenant`)
          }
          pricingMode = existing.unit_cost_p !== null ? 'unit' : 'bottle'
          oldCostP = pricingMode === 'unit' ? existing.unit_cost_p : existing.bottle_cost_p
          // Update the cost field directly (bypassing updateLibraryEntry so
          // we control the source='invoice' attribution on cost_changes).
          const newCostP = line.new_cost_p!
          if (newCostP !== oldCostP) {
            if (pricingMode === 'unit') {
              await db
                .prepare(`UPDATE pouriq_ingredients_library SET unit_cost_p = ?1, updated_at = datetime('now') WHERE id = ?2 AND trade_account_id = ?3`)
                .bind(newCostP, libraryId, access.tradeAccountId)
                .run()
            } else {
              await db
                .prepare(`UPDATE pouriq_ingredients_library SET bottle_cost_p = ?1, updated_at = datetime('now') WHERE id = ?2 AND trade_account_id = ?3`)
                .bind(newCostP, libraryId, access.tradeAccountId)
                .run()
            }
          }
        }
        matchedLibraryId = libraryId

        // Insert the invoice line first to get its id, then the cost_change.
        const invoiceLineId = await insertInvoiceLine(db, {
          invoice_id: invoiceId,
          extracted_name: line.extracted_name,
          extracted_quantity: line.extracted_quantity,
          extracted_unit_price_p: line.extracted_unit_price_p,
          extracted_line_total_p: line.extracted_line_total_p,
          matched_library_id: matchedLibraryId,
          applied: true,
        })

        // Log the cost change. For a brand-new library entry, old_cost_p is
        // null; we always log, even if the user happened to set the same
        // cost as some existing entry (the audit row records the action).
        const newCostP = line.new_cost_p!
        await insertCostChange(db, {
          library_ingredient_id: libraryId,
          pricing_mode: pricingMode,
          old_cost_p: oldCostP,
          new_cost_p: newCostP,
          source: 'invoice',
          invoice_id: invoiceId,
          invoice_line_id: invoiceLineId,
        })
        appliedCount++
        if (line.extracted_line_total_p !== null) {
          netTotalP = (netTotalP ?? 0) + line.extracted_line_total_p
          netSawAny = true
        }
      } else {
        // Not applied — just record the line for the audit/ledger.
        await insertInvoiceLine(db, {
          invoice_id: invoiceId,
          extracted_name: line.extracted_name,
          extracted_quantity: line.extracted_quantity,
          extracted_unit_price_p: line.extracted_unit_price_p,
          extracted_line_total_p: line.extracted_line_total_p,
          matched_library_id: null,
          applied: false,
        })
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'lines' } })
    // Best-effort rollback of the invoice header.
    try { await db.prepare(`DELETE FROM pouriq_invoices WHERE id = ?1`).bind(invoiceId).run() } catch { /* swallow */ }
    return NextResponse.json({ error: 'Could not save invoice lines. Please try again.' }, { status: 500 })
  }

  // 3. Move the R2 PDF from _pending/ to its permanent tenant-namespaced key.
  let r2Key: string | null = null
  try {
    const pendingKey = `pouriq-invoices/_pending/${body.ticket}.pdf`
    const obj = await r2.get(pendingKey)
    if (obj) {
      const buffer = await obj.arrayBuffer()
      const permKey = `pouriq-invoices/${access.tradeAccountId}/${invoiceId}.pdf`
      await r2.put(permKey, buffer, {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: { tradeAccountId: access.tradeAccountId, invoiceId, ts: new Date().toISOString() },
      })
      await r2.delete(pendingKey)
      r2Key = permKey
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'r2-move' }, extra: { invoiceId } })
    // Don't fail the commit. r2_key stays null; Download PDF will be hidden.
  }

  // 4. Finalise totals on the invoice row.
  try {
    await finaliseInvoiceTotals(db, invoiceId, appliedCount, netSawAny ? netTotalP : null, r2Key)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'finalise' }, extra: { invoiceId } })
    return NextResponse.json({ error: 'Could not finalise invoice. Please contact support.' }, { status: 500 })
  }

  return NextResponse.json({ invoice_id: invoiceId })
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/pouriq/invoices/commit/route.ts
git commit -m "feat(pouriq): POST /api/pouriq/invoices/commit (atomic + R2 move)"
```

---

### Task 11: List, single-fetch, and PDF-stream routes

**Files:**
- Create: `src/app/api/pouriq/invoices/route.ts`
- Create: `src/app/api/pouriq/invoices/[id]/route.ts`
- Create: `src/app/api/pouriq/invoices/[id]/pdf/route.ts`

- [ ] **Step 1: Create the list route**

```ts
// GET /api/pouriq/invoices — list recent invoices for the tenant.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listInvoicesForTenant } from '@/lib/pouriq/invoices'

export const runtime = 'nodejs'

export async function GET() {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const invoices = await listInvoicesForTenant(db, access.tradeAccountId)
  return NextResponse.json({ invoices })
}
```

- [ ] **Step 2: Create the single-fetch route**

```ts
// GET /api/pouriq/invoices/[id] — invoice header + lines for the tenant.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getInvoice, listInvoiceLines } from '@/lib/pouriq/invoices'

export const runtime = 'nodejs'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const invoice = await getInvoice(db, id, access.tradeAccountId)
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const lines = await listInvoiceLines(db, id)
  return NextResponse.json({ invoice, lines })
}
```

- [ ] **Step 3: Create the PDF-stream route**

```ts
// GET /api/pouriq/invoices/[id]/pdf — stream the original PDF, access-gated.

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getInvoice } from '@/lib/pouriq/invoices'

export const runtime = 'nodejs'

interface Params {
  params: Promise<{ id: string }>
}

function safeFilename(invoice: { invoice_number: string | null; invoice_date: string | null }): string {
  const parts: string[] = []
  if (invoice.invoice_number) parts.push(invoice.invoice_number.replace(/[^a-zA-Z0-9\-_]/g, ''))
  if (invoice.invoice_date) parts.push(invoice.invoice_date.replace(/[^0-9\-]/g, ''))
  if (parts.length === 0) parts.push('invoice')
  return `${parts.join('-')}.pdf`
}

export async function GET(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } })
  }
  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const r2 = env.TRADE_DOCS as R2Bucket
  const invoice = await getInvoice(db, id, access.tradeAccountId)
  if (!invoice) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  if (!invoice.r2_key) {
    return new Response(JSON.stringify({ error: 'Original PDF not available for this invoice' }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  const obj = await r2.get(invoice.r2_key)
  if (!obj) {
    return new Response(JSON.stringify({ error: 'PDF missing from storage' }), { status: 404, headers: { 'content-type': 'application/json' } })
  }
  return new Response(obj.body, {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `inline; filename="${safeFilename(invoice)}"`,
      'cache-control': 'private, max-age=300',
    },
  })
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/pouriq/invoices/route.ts \
        src/app/api/pouriq/invoices/[id]/route.ts \
        src/app/api/pouriq/invoices/[id]/pdf/route.ts
git commit -m "feat(pouriq): GET invoice list, single, and PDF stream routes"
```

---

### Task 12: Apply migration to production D1

- [ ] **Step 1: Apply the migration remotely**

```bash
npx wrangler d1 migrations apply jerry-can-spirits-db --remote
```

Expected: output mentions `0025_pouriq_invoices.sql` applied to remote.

- [ ] **Step 2: Verify the tables exist**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'pouriq_%' ORDER BY name"
```

Expected: list includes `pouriq_invoices`, `pouriq_invoice_lines`, `pouriq_cost_changes`.

---

### Task 13: Manual curl smoke test (local dev)

This task doesn't produce code; it verifies the backend end-to-end before PR review.

- [ ] **Step 1: Start dev**

```bash
npm run dev
```

In a separate terminal:

- [ ] **Step 2: Confirm via the upload route — needs a session, so this step is mostly to confirm the route is reachable**

```bash
curl -i -X POST http://localhost:3000/api/pouriq/invoices/upload
```

Expected: HTTP 401 with `{ "error": "Unauthorized" }`. The route exists.

- [ ] **Step 3: Stop dev**

Ctrl+C.

(End-to-end testing of upload → extract → commit requires a trade login PIN which is gated. Deferred to the deploy-preview verification step on PR 1.)

---

### Task 14: Push branch and open PR 1

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-invoice-scanning-backend
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(pouriq): AI invoice scanning backend" --body "$(cat <<'EOF'
## Summary

Backend for the AI invoice scanning feature. Schema, AI extraction, atomic commit with cost-change audit, PDF retention. No UI yet — that ships in a follow-up PR.

## Routes added

- \`POST /api/pouriq/invoices/upload\` — PDF → R2 \`_pending/\`
- \`POST /api/pouriq/invoices/extract\` — Claude tool-use → preview payload with match status
- \`POST /api/pouriq/invoices/commit\` — atomic: invoice + lines + cost_changes + library updates + R2 move
- \`GET /api/pouriq/invoices\` — list recent invoices for the tenant
- \`GET /api/pouriq/invoices/[id]\` — header + lines
- \`GET /api/pouriq/invoices/[id]/pdf\` — stream the stored PDF, access-gated

## Schema

Migration \`0025_pouriq_invoices.sql\` adds three tables: \`pouriq_invoices\`, \`pouriq_invoice_lines\`, \`pouriq_cost_changes\`. Already applied to production D1 in the same change.

## Spec

[\`docs/superpowers/specs/2026-05-14-pouriq-ai-invoice-scanning-design.md\`](../blob/main/docs/superpowers/specs/2026-05-14-pouriq-ai-invoice-scanning-design.md)

## Test plan

- [x] \`npm run build\` clean
- [x] \`npm run lint\` clean
- [x] Migration applies locally and remotely
- [ ] End-to-end (upload → extract → commit → list → get → pdf) verified on the deploy preview after merge (trade login gated locally)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR opened**

The command prints the PR URL. CI build + lint should pass within a few minutes.

**STOP HERE for PR 1.** Do not begin Phase 2 until PR 1 has been reviewed and merged.

---

## Phase 2 — PR 2: Frontend `feat/pouriq-invoice-scanning-frontend`

**Prerequisite:** PR 1 merged to `main`.

### Task 15: Cut PR 2 branch

- [ ] **Step 1: Switch to main, pull, cut new branch**

```bash
git checkout main
git pull --rebase origin main
git checkout -b feat/pouriq-invoice-scanning-frontend
git status
```

Expected: clean working tree on `feat/pouriq-invoice-scanning-frontend`.

---

### Task 16: InvoiceUpload component

**Files:**
- Create: `src/components/pouriq/InvoiceUpload.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useRef, useState } from 'react'

interface Props {
  onUploaded: (ticket: string, filename: string) => void
  disabled?: boolean
}

export function InvoiceUpload({ onUploaded, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/pouriq/invoices/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(data.error ?? 'Upload failed')
      }
      const data = (await res.json()) as { ticket: string; filename: string }
      onUploaded(data.ticket, data.filename)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  function handleChoose() {
    if (!disabled && !uploading) inputRef.current?.click()
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    void uploadFile(files[0])
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled && !uploading) setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (disabled || uploading) return
        handleFiles(e.dataTransfer.files)
      }}
      className={`bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-10 border-2 border-dashed transition-colors ${
        dragOver ? 'border-gold-400 bg-jerry-green-800/60' : 'border-gold-500/30'
      }`}
    >
      <div className="text-center">
        <p className="text-lg text-parchment-100 mb-2">Drop a supplier invoice PDF here</p>
        <p className="text-sm text-parchment-400 mb-6">Or choose a file. Maximum 5MB.</p>
        <button
          type="button"
          onClick={handleChoose}
          disabled={disabled || uploading}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
        >
          {uploading ? 'Uploading…' : 'Choose a PDF'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/InvoiceUpload.tsx
git commit -m "feat(pouriq): InvoiceUpload drag-drop component"
```

---

### Task 17: InvoicePreview component (preview table + commit logic)

**Files:**
- Create: `src/components/pouriq/InvoicePreview.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PreviewPayload } from '@/app/api/pouriq/invoices/extract/route'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

interface Props {
  initial: PreviewPayload
  library: IngredientLibraryRow[]
}

interface LineState {
  applied: boolean
  unit_price_p: number       // editable; defaults to extracted_unit_price_p
  library_id: string | null  // when matched to an existing library entry
  // When creating a new library entry inline:
  create_new: boolean
  new_name: string
  new_type: IngredientType
  new_pricing_mode: 'bottle' | 'unit'
  new_bottle_size_ml: number | null
}

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']

export function InvoicePreview({ initial, library }: Props) {
  const router = useRouter()
  const [supplier, setSupplier] = useState(initial.supplier_name ?? '')
  const [invoiceNumber, setInvoiceNumber] = useState(initial.invoice_number ?? '')
  const [invoiceDate, setInvoiceDate] = useState(initial.invoice_date ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [lines, setLines] = useState<LineState[]>(() =>
    initial.lines.map((l): LineState => {
      let library_id: string | null = null
      if (l.match.kind === 'auto') library_id = l.match.library_id
      return {
        applied: l.match.kind === 'auto',
        unit_price_p: l.extracted_unit_price_p,
        library_id,
        create_new: false,
        new_name: l.extracted_name,
        new_type: 'spirit',
        new_pricing_mode: 'bottle',
        new_bottle_size_ml: null,
      }
    }),
  )

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const libraryById = useMemo(() => {
    const m = new Map<string, IngredientLibraryRow>()
    for (const e of library) m.set(e.id, e)
    return m
  }, [library])

  function currentCostFor(libraryId: string | null): number | null {
    if (!libraryId) return null
    const entry = libraryById.get(libraryId)
    if (!entry) return null
    return entry.unit_cost_p ?? entry.bottle_cost_p ?? null
  }

  async function handleSave() {
    setError(null)
    if (!lines.some((l) => l.applied)) {
      // Still allowed — saves an invoice record with applied_line_count=0
    }

    const body = {
      ticket: initial.ticket,
      supplier_name: supplier.trim() || null,
      invoice_number: invoiceNumber.trim() || null,
      invoice_date: invoiceDate.trim() || null,
      lines: lines.map((s, idx) => {
        const original = initial.lines[idx]
        const base = {
          extracted_name: original.extracted_name,
          extracted_quantity: original.extracted_quantity,
          extracted_unit_price_p: original.extracted_unit_price_p,
          extracted_line_total_p: original.extracted_line_total_p,
          applied: s.applied,
        }
        if (!s.applied) return base
        if (s.create_new) {
          return {
            ...base,
            new_library: {
              name: s.new_name.trim(),
              ingredient_type: s.new_type,
              bottle_size_ml: s.new_pricing_mode === 'bottle' ? s.new_bottle_size_ml : null,
              bottle_cost_p: s.new_pricing_mode === 'bottle' ? s.unit_price_p : null,
              unit_cost_p: s.new_pricing_mode === 'unit' ? s.unit_price_p : null,
            },
            new_cost_p: s.unit_price_p,
          }
        }
        return {
          ...base,
          library_id: s.library_id!,
          new_cost_p: s.unit_price_p,
        }
      }),
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/pouriq/invoices/commit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(data.error ?? 'Save failed')
      }
      const data = (await res.json()) as { invoice_id: string }
      const hasApplied = lines.some((l) => l.applied)
      if (hasApplied) {
        router.push(`/trade/pouriq/invoices/${data.invoice_id}/impact`)
      } else {
        router.push('/trade/pouriq/library')
      }
      router.refresh()
    } catch (e) {
      setError((e as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
        <h2 className="text-lg font-serif font-bold text-white mb-4">Invoice details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="supplier" className="block text-sm font-medium text-parchment-200 mb-2">Supplier</label>
            <input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="number" className="block text-sm font-medium text-parchment-200 mb-2">Invoice number</label>
            <input id="number" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-parchment-200 mb-2">Date (YYYY-MM-DD)</label>
            <input id="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} placeholder="2026-05-14" className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[960px]">
            <thead className="bg-jerry-green-900/40">
              <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                <th className="px-3 py-3">Apply</th>
                <th className="px-3 py-3">Extracted</th>
                <th className="px-3 py-3">Qty</th>
                <th className="px-3 py-3">New net £</th>
                <th className="px-3 py-3">Match</th>
                <th className="px-3 py-3">Current cost</th>
                <th className="px-3 py-3">Δ</th>
              </tr>
            </thead>
            <tbody>
              {initial.lines.map((line, idx) => {
                const s = lines[idx]
                const currentP = currentCostFor(s.library_id)
                const delta = currentP !== null ? s.unit_price_p - currentP : null
                return (
                  <tr key={idx} className="border-t border-gold-500/10 align-top">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={s.applied}
                        onChange={(e) => updateLine(idx, { applied: e.target.checked })}
                        className="h-4 w-4"
                        aria-label={`Apply line ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-parchment-100">
                      <div className="font-medium">{line.extracted_name}</div>
                      {line.extracted_line_total_p !== null && (
                        <div className="text-xs text-parchment-400 mt-1">Line total {formatMoney(line.extracted_line_total_p)}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-parchment-300">{line.extracted_quantity ?? '—'}</td>
                    <td className="px-3 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={(s.unit_price_p / 100).toFixed(2)}
                        onChange={(e) => updateLine(idx, { unit_price_p: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        className="w-24 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50"
                        aria-label={`New net price for line ${idx + 1}`}
                      />
                    </td>
                    <td className="px-3 py-3">
                      {s.create_new ? (
                        <div className="space-y-2 min-w-[260px]">
                          <input value={s.new_name} onChange={(e) => updateLine(idx, { new_name: e.target.value })} placeholder="Name" className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm" />
                          <div className="flex gap-2">
                            <select value={s.new_type} onChange={(e) => updateLine(idx, { new_type: e.target.value as IngredientType })} className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm">
                              {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <select value={s.new_pricing_mode} onChange={(e) => updateLine(idx, { new_pricing_mode: e.target.value as 'bottle' | 'unit' })} className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm">
                              <option value="bottle">Per bottle</option>
                              <option value="unit">Per unit</option>
                            </select>
                          </div>
                          {s.new_pricing_mode === 'bottle' && (
                            <input
                              type="number"
                              min={0}
                              step="1"
                              placeholder="Bottle size (ml)"
                              value={s.new_bottle_size_ml ?? ''}
                              onChange={(e) => updateLine(idx, { new_bottle_size_ml: e.target.value ? parseInt(e.target.value, 10) : null })}
                              className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
                            />
                          )}
                          <button type="button" onClick={() => updateLine(idx, { create_new: false })} className="text-xs text-parchment-400 hover:text-parchment-200 underline">
                            Cancel new entry
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-[220px]">
                          <select
                            value={s.library_id ?? ''}
                            onChange={(e) => updateLine(idx, { library_id: e.target.value || null })}
                            className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
                          >
                            <option value="">— select library entry —</option>
                            {line.match.kind === 'suggestions' && line.match.entries.map((e) => (
                              <option key={e.id} value={e.id}>{e.name} (suggested)</option>
                            ))}
                            {library.map((e) => (
                              <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => updateLine(idx, { create_new: true, library_id: null })} className="text-xs text-gold-300 hover:text-gold-200 underline">
                            Create new library entry
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-parchment-200">
                      {currentP !== null ? formatMoney(currentP) : '—'}
                    </td>
                    <td className={`px-3 py-3 ${delta !== null && delta > 0 ? 'text-amber-300' : delta !== null && delta < 0 ? 'text-emerald-300' : 'text-parchment-300'}`}>
                      {delta === null ? '—' : `${delta > 0 ? '+' : ''}${formatMoney(delta)}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg"
        >
          {submitting ? 'Saving…' : 'Save invoice'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/InvoicePreview.tsx
git commit -m "feat(pouriq): InvoicePreview with auto-tick line table"
```

---

### Task 18: Scan-flow page (`/trade/pouriq/invoices/new`)

**Files:**
- Create: `src/app/trade/pouriq/invoices/new/page.tsx`
- Create: `src/components/pouriq/InvoiceScanFlow.tsx`

- [ ] **Step 1: Create the page (server component)**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { InvoiceScanFlow } from '@/components/pouriq/InvoiceScanFlow'

export const dynamic = 'force-dynamic'

export default async function ScanInvoicePage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const library = await listLibraryEntries(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">Scan an invoice</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Drop a supplier PDF. Pour IQ™ extracts every line, matches against your library, and shows the combined GP impact before you commit.
        </p>
        <InvoiceScanFlow library={library} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create the client wrapper that orchestrates upload → extract → preview**

```tsx
'use client'

import { useState } from 'react'
import { InvoiceUpload } from './InvoiceUpload'
import { InvoicePreview } from './InvoicePreview'
import type { PreviewPayload } from '@/app/api/pouriq/invoices/extract/route'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

type Phase =
  | { kind: 'upload' }
  | { kind: 'extracting'; filename: string }
  | { kind: 'preview'; payload: PreviewPayload }

interface Props {
  library: IngredientLibraryRow[]
}

export function InvoiceScanFlow({ library }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'upload' })
  const [error, setError] = useState<string | null>(null)

  async function handleUploaded(ticket: string, filename: string) {
    setError(null)
    setPhase({ kind: 'extracting', filename })
    try {
      const res = await fetch('/api/pouriq/invoices/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ticket }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Extraction failed' }))
        throw new Error(data.error ?? 'Extraction failed')
      }
      const payload = (await res.json()) as PreviewPayload
      setPhase({ kind: 'preview', payload })
    } catch (e) {
      setError((e as Error).message)
      setPhase({ kind: 'upload' })
    }
  }

  if (phase.kind === 'upload') {
    return (
      <>
        <InvoiceUpload onUploaded={handleUploaded} />
        {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      </>
    )
  }

  if (phase.kind === 'extracting') {
    return (
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-10 border border-gold-500/20 text-center">
        <p className="text-lg text-parchment-100 mb-2">Reading {phase.filename}…</p>
        <p className="text-sm text-parchment-400">This usually takes a few seconds.</p>
      </div>
    )
  }

  return <InvoicePreview initial={phase.payload} library={library} />
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/invoices/new/page.tsx \
        src/components/pouriq/InvoiceScanFlow.tsx
git commit -m "feat(pouriq): scan-invoice page + InvoiceScanFlow client wrapper"
```

---

### Task 19: Invoice impact page

**Files:**
- Create: `src/app/trade/pouriq/invoices/[id]/impact/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getInvoice } from '@/lib/pouriq/invoices'
import { listCostChangesForInvoice } from '@/lib/pouriq/cost-changes'
import { loadMultiCostImpact } from '@/lib/pouriq/multi-cost-impact'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { RipplePreview } from '@/components/pouriq/RipplePreview'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceImpactPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const invoice = await getInvoice(db, id, access.tradeAccountId)
  if (!invoice) notFound()

  const costChanges = await listCostChangesForInvoice(db, id)
  const payload = await loadMultiCostImpact(
    db,
    access.tradeAccountId,
    costChanges.map((c) => ({
      library_ingredient_id: c.library_ingredient_id,
      pricing_mode: c.pricing_mode,
      old_cost_p: c.old_cost_p,
      new_cost_p: c.new_cost_p,
    })),
  )

  const headline =
    invoice.supplier_name && invoice.invoice_date
      ? `Invoice from ${invoice.supplier_name} on ${invoice.invoice_date}`
      : invoice.supplier_name
      ? `Invoice from ${invoice.supplier_name}`
      : 'Invoice impact'

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/invoices/${invoice.id}`} className="text-sm text-parchment-400 hover:text-parchment-200">← Invoice detail</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">{headline}</h1>
        <p className="text-parchment-400 text-sm mb-10">
          {invoice.applied_line_count} cost{invoice.applied_line_count === 1 ? '' : 's'} updated.{' '}
          {payload.affected_drink_count} drink{payload.affected_drink_count === 1 ? '' : 's'} affected.
          {payload.newly_below_target_count > 0 && (
            <>
              {' '}
              <span className="text-red-300">{payload.newly_below_target_count} now below target.</span>
            </>
          )}
        </p>

        <RipplePreview
          projected={payload.projected}
          rollups={payload.rollups}
          emptyMessage="None of the changed ingredients are used in any drinks yet. Add them to a cocktail to see GP impact."
        />

        <div className="mt-10 flex justify-end">
          <Link href="/trade/pouriq/library" className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 font-semibold rounded-lg">
            Done
          </Link>
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/pouriq/invoices/[id]/impact/page.tsx
git commit -m "feat(pouriq): post-commit invoice impact page with combined ripple"
```

---

### Task 20: Invoice ledger + detail pages

**Files:**
- Create: `src/app/trade/pouriq/invoices/page.tsx`
- Create: `src/app/trade/pouriq/invoices/[id]/page.tsx`

- [ ] **Step 1: Create the ledger page**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listInvoicesForTenant } from '@/lib/pouriq/invoices'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

function formatMoney(p: number | null): string {
  if (p === null) return '—'
  return `£${(p / 100).toFixed(2)}`
}

export default async function InvoicesListPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const invoices = await listInvoicesForTenant(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Recent invoices</h1>
            <p className="text-parchment-400 text-sm mt-2">{invoices.length} invoice{invoices.length === 1 ? '' : 's'} scanned</p>
          </div>
          <Link href="/trade/pouriq/invoices/new" className={PRIMARY_BUTTON}>Scan an invoice</Link>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-10 border border-gold-500/20 text-center text-parchment-300">
            No invoices yet. Drop your first one to populate the library.
          </div>
        ) : (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-jerry-green-900/40">
                  <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Net total</th>
                    <th className="px-4 py-3">Lines applied</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-gold-500/10 hover:bg-jerry-green-700/20">
                      <td className="px-4 py-3">
                        <Link href={`/trade/pouriq/invoices/${inv.id}`} className="text-gold-300 hover:text-gold-200 underline">
                          {inv.invoice_date ?? inv.created_at.slice(0, 10)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-parchment-100">{inv.supplier_name ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-300">{inv.invoice_number ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-200">{formatMoney(inv.net_total_p)}</td>
                      <td className="px-4 py-3 text-parchment-300">{inv.applied_line_count} / {inv.line_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Create the detail page**

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getInvoice, listInvoiceLines } from '@/lib/pouriq/invoices'
import { LicenceGate } from '@/components/pouriq/LicenceGate'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

function formatMoney(p: number | null): string {
  if (p === null) return '—'
  return `£${(p / 100).toFixed(2)}`
}

export default async function InvoiceDetailPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const invoice = await getInvoice(db, id, access.tradeAccountId)
  if (!invoice) notFound()

  const lines = await listInvoiceLines(db, id)
  const applied = lines.filter((l) => l.applied === 1)
  const skipped = lines.filter((l) => l.applied === 0)

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/invoices" className="text-sm text-parchment-400 hover:text-parchment-200">← Recent invoices</Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">
              {invoice.supplier_name ?? 'Invoice'}
            </h1>
            <p className="text-parchment-400 text-sm mt-2">
              {invoice.invoice_date ?? '—'} · {invoice.invoice_number ?? 'no number'} · net total {formatMoney(invoice.net_total_p)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/trade/pouriq/invoices/${invoice.id}/impact`} className="px-4 py-2 text-sm text-gold-300 hover:text-gold-200 underline">
              View GP impact
            </Link>
            {invoice.r2_key && (
              <a
                href={`/api/pouriq/invoices/${invoice.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm"
              >
                Download original PDF
              </a>
            )}
          </div>
        </div>

        {applied.length > 0 && (
          <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20 mb-6">
            <div className="px-5 py-4 border-b border-gold-500/10">
              <h2 className="text-lg font-serif font-bold text-white">Applied lines ({applied.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-jerry-green-900/40">
                  <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Net unit £</th>
                    <th className="px-4 py-3">Net line £</th>
                  </tr>
                </thead>
                <tbody>
                  {applied.map((l) => (
                    <tr key={l.id} className="border-t border-gold-500/10">
                      <td className="px-4 py-3 text-parchment-100">{l.extracted_name}</td>
                      <td className="px-4 py-3 text-parchment-300">{l.extracted_quantity ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-200">{formatMoney(l.extracted_unit_price_p)}</td>
                      <td className="px-4 py-3 text-parchment-200">{formatMoney(l.extracted_line_total_p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {skipped.length > 0 && (
          <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20">
            <div className="px-5 py-4 border-b border-gold-500/10">
              <h2 className="text-lg font-serif font-bold text-white">Skipped lines ({skipped.length})</h2>
              <p className="text-xs text-parchment-400 mt-1">Captured for the audit trail but did not update any library entry.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-jerry-green-900/40">
                  <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                    <th className="px-4 py-3">Line</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Net unit £</th>
                  </tr>
                </thead>
                <tbody>
                  {skipped.map((l) => (
                    <tr key={l.id} className="border-t border-gold-500/10">
                      <td className="px-4 py-3 text-parchment-100">{l.extracted_name}</td>
                      <td className="px-4 py-3 text-parchment-300">{l.extracted_quantity ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-200">{formatMoney(l.extracted_unit_price_p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/invoices/page.tsx \
        src/app/trade/pouriq/invoices/[id]/page.tsx
git commit -m "feat(pouriq): invoice ledger + invoice detail pages"
```

---

### Task 21: Library page integration

**Files:**
- Modify: `src/app/trade/pouriq/library/page.tsx`

- [ ] **Step 1: Read the current file**

```bash
cat src/app/trade/pouriq/library/page.tsx
```

(Expectation: this file exists and has the header div with "Run a what-if" and "Add ingredient" buttons.)

- [ ] **Step 2: Replace the file contents**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries, getLibraryUsageCounts } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientList } from '@/components/pouriq/IngredientList'
import { CostUpdateToastReader } from '@/components/pouriq/CostUpdateToastReader'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [entries, usageCounts] = await Promise.all([
    listLibraryEntries(db, access.tradeAccountId),
    getLibraryUsageCounts(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
          <div>
            <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Ingredient library</h1>
            <p className="text-parchment-400 text-sm mt-2">{entries.length} ingredient{entries.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/trade/pouriq/invoices" className={SECONDARY_BUTTON}>Recent invoices</Link>
            <Link href="/trade/pouriq/invoices/new" className={SECONDARY_BUTTON}>Scan an invoice</Link>
            <Link href="/trade/pouriq/library/what-if" className={SECONDARY_BUTTON}>Run a what-if</Link>
            <Link href="/trade/pouriq/library/new" className={PRIMARY_BUTTON}>Add ingredient</Link>
          </div>
        </div>

        <IngredientList entries={entries} usageCounts={usageCounts} />
      </div>
      <CostUpdateToastReader />
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/library/page.tsx
git commit -m "feat(pouriq): library page header — Scan an invoice + Recent invoices"
```

---

### Task 22: Privacy policy update

**Files:**
- Modify: `src/app/privacy-policy/page.tsx`

- [ ] **Step 1: Read the current retention paragraph**

```bash
grep -n "Retention" src/app/privacy-policy/page.tsx
```

You're looking for the `<strong>Retention.</strong>` line in section 3.5 (around line 173).

- [ ] **Step 2: Update the retention paragraph**

Find this exact text in `src/app/privacy-policy/page.tsx`:

```tsx
                <strong className="text-gold-300">Retention.</strong> Menu and analysis data is retained for the lifetime of your Pour IQ licence and for two years after cancellation, then deleted. Individual menus can be deleted at any time from within Pour IQ.
```

Replace it with:

```tsx
                <strong className="text-gold-300">Retention.</strong> Menu and analysis data is retained for the lifetime of your Pour IQ™ licence and for two years after cancellation, then deleted. Individual menus can be deleted at any time from within Pour IQ™. Scanned supplier invoice PDFs and their extracted line-item data are retained on the same schedule — this aligns with HMRC&rsquo;s six-year VAT-records requirement.
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/privacy-policy/page.tsx
git commit -m "docs(privacy): mention invoice PDF retention in section 3.5"
```

---

### Task 23: Manual integration check (deploy preview)

This task does not produce code. After all earlier tasks have committed cleanly:

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-invoice-scanning-frontend
```

- [ ] **Step 2: Wait for the deploy preview to come up**

The Cloudflare Workers Builds check on the PR will print a preview URL. Wait for it to be live.

- [ ] **Step 3: Manual walkthrough against the preview**

Use a trade login with a Pour IQ™ licence. Sample PDF: any real UK supplier invoice with at least 5 lines.

1. From the library page header, click **Scan an invoice**.
2. Drag-drop the PDF. Expect: spinner with filename ("Reading X.pdf…").
3. Preview renders. Confirm:
   - Header fields populated (supplier, number, date) where the AI could see them
   - Each line has a row with extracted name, qty, new net price, match dropdown / "Create new" button, current cost, Δ
   - Lines with high-confidence matches are auto-ticked
   - Lines with no match are unticked and offer "Create new library entry"
4. Untick a line. Confirm Δ recalculates as no-op for that row.
5. Change a new-net-price value on a different row. Δ updates.
6. Mark an unmatched row as "Create new library entry", fill name + type + pricing mode + size. Save.
7. After commit: redirected to `/trade/pouriq/invoices/[id]/impact`. Combined ripple renders with rollup cards + per-drink table. Newly-below-target drinks are red.
8. Click **Done** → land on library page.
9. From library, click **Recent invoices** → ledger row appears for the new invoice.
10. Click into the invoice → detail page shows applied + skipped lines and a **Download original PDF** button.
11. Click Download PDF → original opens (or downloads) cleanly.
12. From the library, edit a different ingredient's cost manually. Then SQL-check (via wrangler if needed): `SELECT * FROM pouriq_cost_changes WHERE source='manual' ORDER BY changed_at DESC LIMIT 1;` shows the new row.
13. Privacy policy page → section 3.5 mentions invoice PDF retention.

If any step fails, capture the issue and either fix inline (small) or open a follow-up issue (large).

---

### Task 24: Open PR 2

- [ ] **Step 1: Open the PR**

```bash
gh pr create --title "feat(pouriq): AI invoice scanning frontend" --body "$(cat <<'EOF'
## Summary

UI for the AI invoice scanning feature. Builds on the backend that shipped in the previous PR.

- New scan-flow page at \`/trade/pouriq/invoices/new\` — drag-drop PDF → extracting → preview → commit
- Auto-tick preview with override (matches the menu-import pattern)
- Post-commit invoice impact page at \`/trade/pouriq/invoices/[id]/impact\` — combined ripple across every drink affected
- Invoice ledger at \`/trade/pouriq/invoices\`
- Invoice detail at \`/trade/pouriq/invoices/[id]\` with **Download original PDF** button
- Library page header gains **Scan an invoice** and **Recent invoices** buttons
- Privacy policy section 3.5 mentions scanned-invoice PDF retention

## Spec

See \`docs/superpowers/specs/2026-05-14-pouriq-ai-invoice-scanning-design.md\` (merged in the backend PR).

## Test plan

- [x] \`npm run build\` and \`npm run lint\` clean
- [x] Deploy-preview walkthrough complete (see plan Task 23)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Confirm PR opened**

The command prints the PR URL.

---

## Self-review checklist (engineer)

Before requesting review on PR 2, verify:

- [ ] Both branches were cut from up-to-date `origin/main`
- [ ] No `console.log` left behind
- [ ] No `any` types introduced (use `unknown` with a cast if forced)
- [ ] No em-dashes, emojis, or exclamation marks in user-visible copy
- [ ] The existing `/trade/pouriq/library/what-if`, `/trade/pouriq/library/[id]/edit`, and menu-import flows still work (no regressions in PR 1's `updateLibraryEntry` change)
- [ ] `pouriq_cost_changes` shows `source='manual'` rows when costs are edited via the existing IngredientForm
- [ ] `pouriq_cost_changes` shows `source='invoice'` rows when costs are edited via the new commit route
