# Pour IQ Perpetual Stock + Receipts (Phase 3a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maintain a per-ingredient estimated on-hand that updates from invoice/manual receipts and POS depletion, anchored by physical counts, so a bar always knows roughly how much stock it has without constant counting.

**Architecture:** `on-hand = last count + receipts since − expected usage since (÷ yield)`. New `pouriq_stock_receipts` table; `yield_pct` on the ingredient library. Pure math helpers (TDD); a server-only `stock-loader` assembling rows from variance v2's count events + the new receipts + POS volume buckets. Invoice commit books receipts idempotently; a manual receive action covers un-invoiced deliveries. Minimal `/trade/pouriq/stock` page.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js App Router, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-24-pouriq-perpetual-stock-design.md`.

**Branch:** `feat/pouriq-perpetual-stock` (already created off `origin/main`).

**Key existing code:**
- `src/lib/pouriq/variance.ts` — pure helpers incl. `sumBucketsInWindow`. We add `applyYield` here.
- `src/lib/pouriq/variance-rolling-loader.ts` — the tenant depletion loader; its recipe query + per-ingredient theoretical sum get yield applied.
- `src/lib/pouriq/calculations.ts` — `costPerMlP` (pack-aware).
- `src/lib/pouriq/types.ts` — `IngredientLibraryRow` (gains `yield_pct`), add `StockReceiptRow`.
- `src/app/api/pouriq/invoices/commit/route.ts` — commits invoice + lines; lines carry `matched_library_id`, `extracted_quantity`; we add receipt booking here.
- `pouriq_stock_count_events` (variance v2) — the count anchors; reused, not changed.
- `pouriq_drink_volumes` — POS buckets (`cocktail_id, period_start, period_end, units_sold`); cadence on `pouriq_menus.volume_cadence`.
- `checkPourIqAccess`, `getCloudflareContext` (db = `env.DB`, kv = `env.SITE_OPS`), `requireDb`, `revalidatePath` — match existing usage.

**Tenant-scoping rule:** every query reaches the tenant via `pouriq_menus.trade_account_id` or directly via `trade_account_id` on the library / receipts / count-events tables; always use `access.tradeAccountId`.

---

### Task 1: Migration — receipts table + yield_pct

**Files:** Create `migrations/0042_stock_receipts_and_yield.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Phase 3a: perpetual stock. Receipts (deliveries) top stock up; yield_pct is
-- the keg/line-wastage factor feeding depletion. Both additive; yield defaults
-- to 100 (no change to existing ingredients or variance behaviour).
CREATE TABLE pouriq_stock_receipts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  received_at TEXT NOT NULL,
  qty REAL NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('invoice','manual')),
  invoice_line_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stock_receipts_lookup
  ON pouriq_stock_receipts (trade_account_id, library_ingredient_id, received_at);
CREATE UNIQUE INDEX uniq_stock_receipts_invoice_line
  ON pouriq_stock_receipts (invoice_line_id) WHERE invoice_line_id IS NOT NULL;

ALTER TABLE pouriq_ingredients_library ADD COLUMN yield_pct REAL NOT NULL DEFAULT 100;
```

- [ ] **Step 2: Validate the SQL parses (in-memory SQLite, NOT the drifted local D1)**

Run:
```bash
node -e "const fs=require('fs');const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(':memory:');d.exec('CREATE TABLE pouriq_ingredients_library(id TEXT PRIMARY KEY);');d.exec(fs.readFileSync('migrations/0042_stock_receipts_and_yield.sql','utf8'));console.log('cols:',d.prepare(\"SELECT name FROM pragma_table_info('pouriq_stock_receipts')\").all().map(r=>r.name).join(','),'| yield:',d.prepare(\"SELECT name FROM pragma_table_info('pouriq_ingredients_library')\").all().map(r=>r.name).join(','));"
```
Expected: receipts cols `id,trade_account_id,library_ingredient_id,received_at,qty,source,invoice_line_id,created_at` and library shows `yield_pct`. (If `node:sqlite` is unavailable, inspect by eye; do NOT apply to the local D1 dev DB — it has unrelated drift.)

- [ ] **Step 3: Commit**

```bash
git add migrations/0042_stock_receipts_and_yield.sql
git commit -m "feat(pouriq): stock receipts table + ingredient yield_pct (perpetual stock)"
```

---

### Task 2: Types — StockReceiptRow + yield_pct

**Files:** Modify `src/lib/pouriq/types.ts`; fix `IngredientLibraryRow` fixtures.

- [ ] **Step 1: Add yield_pct to `IngredientLibraryRow` and a `StockReceiptRow`**

In `types.ts`, add `yield_pct: number` to `IngredientLibraryRow` (after `purchase_qty`), and add:
```ts
export interface StockReceiptRow {
  id: string
  trade_account_id: string
  library_ingredient_id: string
  received_at: string
  qty: number
  source: 'invoice' | 'manual'
  invoice_line_id: string | null
  created_at: string
}
```

- [ ] **Step 2: Fix fixtures that build `IngredientLibraryRow` literals**

Adding a required `yield_pct` will break any test fixture constructing a full `IngredientLibraryRow`. Find them:
```bash
grep -rln "purchase_qty:" tests/
```
At minimum `tests/unit/lib/pouriq-ingredient-match.test.ts` (the `row()` helper) builds one — add `yield_pct: 100,` to each such literal. Run `npx tsc --noEmit` and fix any remaining `Property 'yield_pct' is missing` errors in tests.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit` (clean) and `npm run test:unit` (still green).
```bash
git add src/lib/pouriq/types.ts tests/
git commit -m "feat(pouriq): types for stock receipts + ingredient yield"
```

---

### Task 3: Yield helper + apply to variance depletion (TDD)

**Files:** Modify `src/lib/pouriq/variance.ts`, `src/lib/pouriq/variance-rolling-loader.ts`; Test `tests/unit/lib/pouriq-variance-rolling.test.ts` (extend).

- [ ] **Step 1: Add the failing test for `applyYield`**

Append to `tests/unit/lib/pouriq-variance-rolling.test.ts`:
```ts
import { applyYield } from '@/lib/pouriq/variance'

describe('applyYield', () => {
  it('is a no-op at 100%', () => {
    expect(applyYield(1000, 100)).toBe(1000)
  })
  it('increases expected usage as yield drops (90% -> ~+11%)', () => {
    expect(applyYield(1000, 90)).toBeCloseTo(1111.11, 1)
  })
  it('treats 0 or negative yield as 100% (defensive)', () => {
    expect(applyYield(1000, 0)).toBe(1000)
    expect(applyYield(1000, -5)).toBe(1000)
  })
})
```

- [ ] **Step 2: Run, confirm FAIL, then implement in `variance.ts`**

Append to `src/lib/pouriq/variance.ts`:
```ts
// Expected real-world usage from raw poured ml, accounting for line/keg wastage.
// yield_pct 100 = no loss (no-op). Lower yield means more is drawn down per ml sold.
export function applyYield(rawMl: number, yieldPct: number): number {
  const y = yieldPct > 0 ? yieldPct : 100
  return rawMl / (y / 100)
}
```
Run the test, confirm PASS, then `npm run test:unit` (all green).

- [ ] **Step 3: Apply yield in the variance loader**

In `src/lib/pouriq/variance-rolling-loader.ts`:
- Add `lib.yield_pct AS yield_pct` to the `readTenantRecipes` SELECT, and `yield_pct: number` to `RecipeLineRow` and to the `Meta` interface (default not needed — column is NOT NULL 100).
- Where the per-ingredient `theoretical` ml is finalised (both the main window sum AND each trend point's `theo`), wrap it: `applyYield(rawTheoreticalMl, meta.yield_pct)`. Import `applyYield` from `./variance`.
- Confirm `tsc` clean. (No new loader unit test — the math is covered by `applyYield`'s test; the loader wiring is covered by build.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/pouriq/variance.ts src/lib/pouriq/variance-rolling-loader.ts tests/unit/lib/pouriq-variance-rolling.test.ts
git commit -m "feat(pouriq): yield-aware depletion (keg/line wastage) in variance"
```

---

### Task 4: Pure stock math (TDD)

**Files:** Create `src/lib/pouriq/stock.ts`; Test `tests/unit/lib/pouriq-stock.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/lib/pouriq-stock.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { receiptBottlesFromInvoiceLine, computeOnHandBottles } from '@/lib/pouriq/stock'

describe('receiptBottlesFromInvoiceLine', () => {
  it('passes quantity through when purchase_qty is 1', () => {
    expect(receiptBottlesFromInvoiceLine(12, 1)).toBe(12)
  })
  it('multiplies by purchase_qty for cases', () => {
    expect(receiptBottlesFromInvoiceLine(1, 24)).toBe(24)
    expect(receiptBottlesFromInvoiceLine(2, 24)).toBe(48)
  })
  it('treats purchase_qty 0 as 1 (defensive)', () => {
    expect(receiptBottlesFromInvoiceLine(5, 0)).toBe(5)
  })
  it('returns null when quantity is unknown', () => {
    expect(receiptBottlesFromInvoiceLine(null, 24)).toBeNull()
  })
})

describe('computeOnHandBottles', () => {
  const base = { anchorCountQty: 10, receiptsSinceBottles: 5, usageSinceMl: 3500, bottleSizeMl: 700, yieldPct: 100 }
  it('on-hand = count + receipts - usage/yield (in bottles)', () => {
    // usage 3500ml / 700 = 5 bottles; 10 + 5 - 5 = 10
    expect(computeOnHandBottles(base)).toBeCloseTo(10, 6)
  })
  it('lower yield depletes faster', () => {
    // yield 50%: 5 bottles raw -> 10 effective; 10 + 5 - 10 = 5
    expect(computeOnHandBottles({ ...base, yieldPct: 50 })).toBeCloseTo(5, 6)
  })
  it('can go negative (caller clamps for display)', () => {
    expect(computeOnHandBottles({ ...base, usageSinceMl: 14000 })).toBeCloseTo(-5, 6) // 20 bottles used
  })
})
```

- [ ] **Step 2: Run, confirm FAIL, then implement `src/lib/pouriq/stock.ts`**

```ts
import { applyYield } from './variance'

// Bottles received from one invoice line. extracted_quantity is the number of
// PURCHASE units on the line; one purchase unit holds purchase_qty bottles.
export function receiptBottlesFromInvoiceLine(extractedQuantity: number | null, purchaseQty: number): number | null {
  if (extractedQuantity === null) return null
  return extractedQuantity * (purchaseQty > 0 ? purchaseQty : 1)
}

// Anchored perpetual on-hand, in bottles/containers.
export function computeOnHandBottles(input: {
  anchorCountQty: number
  receiptsSinceBottles: number
  usageSinceMl: number
  bottleSizeMl: number
  yieldPct: number
}): number {
  const expectedUsageBottles = applyYield(input.usageSinceMl, input.yieldPct) / input.bottleSizeMl
  return input.anchorCountQty + input.receiptsSinceBottles - expectedUsageBottles
}
```
Run the test, confirm PASS, then `npm run test:unit`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/stock.ts tests/unit/lib/pouriq-stock.test.ts
git commit -m "feat(pouriq): pure stock math (receipt conversion + on-hand)"
```

---

### Task 5: Stock loader (server-only)

**Files:** Create `src/lib/pouriq/stock-loader.ts`

- [ ] **Step 1: Implement the loader**

Mirror the structure/queries of `variance-rolling-loader.ts` (read it). Create `src/lib/pouriq/stock-loader.ts` (`'server-only'`). For the tenant:
- Reuse the same tenant-wide reads as the variance loader: bottle-priced recipe lines across cocktails+serves (incl. `yield_pct`), POS volume buckets, and count events. (You may import and reuse private patterns by re-implementing the same SELECTs — keep them tenant-scoped via `pouriq_menus.trade_account_id`.)
- Add a receipts read:
```ts
async function readTenantReceipts(db, tradeAccountId) {
  const res = await db.prepare(
    `SELECT library_ingredient_id, received_at, qty FROM pouriq_stock_receipts WHERE trade_account_id = ?1`
  ).bind(tradeAccountId).all<{ library_ingredient_id: string; received_at: string; qty: number }>()
  return res.results ?? []
}
```
- For each bottle-priced ingredient with a recipe line OR a count OR a receipt:
  - `anchor` = latest count event for that ingredient (by `counted_at`), or null.
  - If no anchor: emit `{ ..., onHandBottles: null, needsOpeningCount: true }`.
  - Else: `receiptsSince` = Σ `qty` of receipts with `received_at > anchor.counted_at`; `usageSinceMl` = Σ over its recipe lines of `sumBucketsInWindow(buckets, anchor.counted_at.slice(0,10), todayISODate) × pour_ml`; `onHandBottles = computeOnHandBottles({ anchorCountQty: anchor.count_qty, receiptsSinceBottles: receiptsSince, usageSinceMl, bottleSizeMl: meta.bottle_size_ml, yieldPct: meta.yield_pct })`.
  - `todayISODate` = `new Date().toISOString().slice(0,10)`.
- Return `RollingStockRow[]`:
```ts
export interface RollingStockRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number
  yield_pct: number
  on_hand_bottles: number | null
  needs_opening_count: boolean
  anchor_count_at: string | null
  anchor_count_qty: number | null
  receipts_since: number
  expected_usage_bottles: number
}
export async function loadStockLevels(db: D1Database, tradeAccountId: string): Promise<RollingStockRow[]>
```
Order rows by name. Reuse `sumBucketsInWindow` and `computeOnHandBottles`; do not re-implement the math.

- [ ] **Step 2: tsc + commit**

Run: `npx tsc --noEmit` (clean). Match the `D1Database` ambient global the sibling loaders use (no import).
```bash
git add src/lib/pouriq/stock-loader.ts
git commit -m "feat(pouriq): tenant stock-level loader (anchored perpetual on-hand)"
```

---

### Task 6: Book receipts from committed invoices (idempotent)

**Files:** Modify `src/app/api/pouriq/invoices/commit/route.ts`

- [ ] **Step 1: Read the commit route** to find: where it loops committed lines, the variables for `matched_library_id`, `extracted_quantity`, the inserted invoice-line id, the invoice date, and `access.tradeAccountId` + `db`. Also find each matched ingredient's `purchase_qty` (you may need to read it from `pouriq_ingredients_library` for the matched ids — a single `SELECT id, purchase_qty FROM pouriq_ingredients_library WHERE trade_account_id = ?1` map is fine).

- [ ] **Step 2: After the lines are committed, book receipts**

For each committed line where `matched_library_id` is set and `extracted_quantity` is a positive number, insert a receipt:
```ts
import { receiptBottlesFromInvoiceLine } from '@/lib/pouriq/stock'
// purchaseQtyById: Map<string, number> built from a tenant-scoped library SELECT
const bottles = receiptBottlesFromInvoiceLine(line.extracted_quantity, purchaseQtyById.get(line.matched_library_id) ?? 1)
if (bottles !== null && bottles > 0) {
  await db.prepare(`
    INSERT INTO pouriq_stock_receipts (trade_account_id, library_ingredient_id, received_at, qty, source, invoice_line_id)
    VALUES (?1, ?2, ?3, ?4, 'invoice', ?5)
    ON CONFLICT(invoice_line_id) DO NOTHING
  `).bind(tradeAccountId, line.matched_library_id, invoiceDateISO, bottles, invoiceLineId).run()
}
```
- `invoiceDateISO` = the invoice's date if captured, else `new Date().toISOString()`.
- `invoiceLineId` = the id used when inserting the `pouriq_invoice_lines` row (so the ON CONFLICT idempotency works). If line ids are generated inline, capture them.
- Booking must not break the commit on error — but a failed receipt insert should surface via the existing Sentry pattern, not silently. Wrap booking so a receipt failure logs to Sentry but does not roll back the (already-applied) cost commit. Keep it tenant-scoped.

- [ ] **Step 3: Build + commit**

Run: `npm run build`.
```bash
git add src/app/api/pouriq/invoices/commit/route.ts
git commit -m "feat(pouriq): book stock receipts from committed invoices (idempotent)"
```

---

### Task 7: Manual receive action + receipts list helper

**Files:** Modify `src/lib/pouriq/server-actions.ts`; (optional) a small read helper in `ingredient-library.ts` or `stock-loader.ts`.

- [ ] **Step 1: Add `receiveStockAction`**

In `server-actions.ts`:
```ts
export async function receiveStockAction(libraryIngredientId: string, qtyBottles: number, receivedAtISO?: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  if (!Number.isFinite(qtyBottles) || qtyBottles <= 0) throw new Error('Enter a positive quantity')
  const owns = await db.prepare(`SELECT 1 FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`).bind(libraryIngredientId, tradeAccountId).first()
  if (!owns) throw new Error('Ingredient not found')
  await db.prepare(`
    INSERT INTO pouriq_stock_receipts (trade_account_id, library_ingredient_id, received_at, qty, source, invoice_line_id)
    VALUES (?1, ?2, ?3, ?4, 'manual', NULL)
  `).bind(tradeAccountId, libraryIngredientId, receivedAtISO ?? new Date().toISOString(), qtyBottles).run()
  revalidatePath('/trade/pouriq/stock')
}
```
Also confirm a count can be recorded from the stock page: reuse the existing variance count entry path — either call the tenant variance POST route, or add a tiny `recordStockCountAction(libraryIngredientId, countQty)` that inserts a `pouriq_stock_count_events` row (tenant-guarded) and `revalidatePath('/trade/pouriq/stock')`. Prefer a dedicated `recordStockCountAction` so the stock page does not depend on the variance route.

- [ ] **Step 2: Build + commit**

Run: `npm run build`.
```bash
git add src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): manual receive + record-count server actions"
```

---

### Task 8: Stock page (minimal) + hub link

**Files:** Create `src/app/trade/pouriq/stock/page.tsx` and a client component `src/components/pouriq/StockManager.tsx`; Modify `src/app/trade/pouriq/page.tsx` (hub link).

- [ ] **Step 1: Build the page**

- READ `src/app/trade/pouriq/unmatched/page.tsx` for the access-gate pattern (`checkPourIqAccess`; no-session redirect; no-licence `<LicenceGate/>`; `dynamic='force-dynamic'`; db via `getCloudflareContext`).
- Server page loads `loadStockLevels(db, access.tradeAccountId)` and passes rows to `<StockManager rows={rows} />`.
- `StockManager` (`'use client'`): a list of ingredients with: name, `bottle_size_ml`, estimated on-hand (bottles, 1dp; show `max(0, …)` and a "check stock" hint if the raw value is negative), and a caption "estimate, last counted {date}" (or "needs an opening count"). Per row, inline controls: "Receive" (qty bottles + optional date → `receiveStockAction`) and "Count" (qty → `recordStockCountAction`), each in a `useTransition` with a shared error line, then the list refreshes (`router.refresh()`). Rows with `needs_opening_count` show a prominent "Set opening count" prompt instead of an on-hand figure.
- Copy: calm, no em-dashes/emojis/exclamation marks. Keep styling consistent with sibling pages; do NOT over-invest in visuals (UI redesign is a later workstream).

- [ ] **Step 2: Hub link**

In `src/app/trade/pouriq/page.tsx`, add a "Stock" link next to Library/Serves/Variance (match `SECONDARY_BUTTON`), href `/trade/pouriq/stock`.

- [ ] **Step 3: Build + commit**

Run: `npm run build`; `npm run test:unit`.
```bash
git add -A
git commit -m "feat(pouriq): minimal stock page (on-hand, receive, count)"
```

---

### Task 9: Verification + finish

- [ ] **Step 1:** `npm run test:unit` (all green incl. new stock + yield tests) and `npm run build`.
- [ ] **Step 2:** `npx tsc --noEmit` clean.
- [ ] **Step 3:** `npx opennextjs-cloudflare build` completes.
- [ ] **Step 4:** Use `superpowers:finishing-a-development-branch` → PR. PR body MUST note: **apply migration `0042` to prod after merge** (`npx wrangler d1 migrations apply jerry-can-spirits-db --remote`), that `yield_pct` defaults to 100 (no behaviour change until set), and that this is Phase 3a (par/reorder follows in 3b).

---

## Notes / caveats baked in
- **Anchor required:** on-hand needs at least one count; before that, `needs_opening_count` prompts. Counts reuse `pouriq_stock_count_events` (same as variance) so a count taken here also feeds variance and vice versa.
- **Idempotent invoice receipts** via the partial-unique index on `invoice_line_id`.
- **Receipt unit = bottles**, converted from invoice purchase-units via `purchase_qty`.
- **Yield defaults 100** — backward-compatible for every existing ingredient and for shipped variance numbers.
- **3b (par + reorder)** is a separate spec/plan and is out of scope here.
