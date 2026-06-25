# Prepared-Recipe Production + Stock (Slice 3 Part B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Record making a batch of a prepared ingredient: it consumes the components from stock and produces prepared on-hand, folded into the 3a perpetual engine.

**Architecture:** Additive migration (`pouriq_production_events` + `pouriq_production_components`, snapshot at production time). A `recordProductionAction` writes the snapshot. The stock loader augments its existing terms — production yield → a prepared ingredient's receipts, production consumption → a component's usage — so `count + receipts − usage` is unchanged structurally. A "Make a batch" control on the stock page.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-25-pouriq-prepared-stock-design.md`.

**Branch:** `feat/pouriq-prepared-stock` (off `main`). Next migration: **0046**.

**Model recap:** prepared ingredient = library row, `is_prepared=1`, `pack_size`=yield, `price_p`=derived batch cost. `listPreparedComponents(db, preparedId)` returns components with `amount_base` + cost fields. Stock loader (`stock-loader.ts`) is ml-scoped (`base_unit='ml' AND price_p>0`); per ingredient: `on-hand = anchorCount + receiptsSince − applyYield(POSusageMl)/pack_size` via `computeOnHandBottles` (uses `bottleSizeMl=pack_size`); window = `(anchor.counted_at, 9999-12-31]`.

**Safety:** each task ends tsc clean + tests green (build from the UI task). Costing (#805), variance, and non-production stock are NOT changed.

---

### Task 1: Migration 0046 — production events + consumption snapshot

**Files:** Create `migrations/0046_production_events.sql`; Test `tests/unit/lib/pouriq-production-migration.test.ts`

- [ ] **Step 1: Write the migration**
```sql
-- Slice 3 Part B: production events. Making a batch of a prepared ingredient
-- consumes its components and produces prepared on-hand. Snapshot at production
-- time so later recipe edits never rewrite history. Additive.
CREATE TABLE pouriq_production_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  prepared_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  batches REAL NOT NULL CHECK (batches > 0),
  yield_base_produced REAL NOT NULL,
  produced_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_production_events_tenant ON pouriq_production_events (trade_account_id, prepared_ingredient_id, produced_at);

CREATE TABLE pouriq_production_components (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  production_event_id TEXT NOT NULL REFERENCES pouriq_production_events(id) ON DELETE CASCADE,
  component_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE RESTRICT,
  amount_base_consumed REAL NOT NULL,
  produced_at TEXT NOT NULL
);
CREATE INDEX idx_production_components_component ON pouriq_production_components (component_ingredient_id, produced_at);
```
- [ ] **Step 2: Schema-validity test** (`node:sqlite`, mirroring `pouriq-prepared-migration.test.ts`): minimal `pouriq_ingredients_library(id TEXT PRIMARY KEY)`, exec the migration, assert both tables exist with their columns.
- [ ] **Step 3: Commit** `feat(pouriq): production events + consumption snapshot tables (0046)`. Do NOT apply locally.

---

### Task 2: Production action + data access + pure sum helper (TDD)

**Files:** Modify `src/lib/pouriq/prepared.ts` (data access + pure helper) and `src/lib/pouriq/server-actions.ts` (action); Test add to `tests/unit/lib/pouriq-prepared-cost.test.ts`

- [ ] **Step 1: Failing test for the pure sum helper**
```ts
import { sumProductionAfter } from '@/lib/pouriq/prepared'

describe('sumProductionAfter', () => {
  const rows = [
    { amount: 4000, produced_at: '2026-06-01T10:00:00Z' },
    { amount: 1000, produced_at: '2026-06-10T10:00:00Z' },
    { amount: 500, produced_at: '2026-05-20T10:00:00Z' },
  ]
  it('sums only rows strictly after the anchor', () => {
    expect(sumProductionAfter(rows, '2026-06-01T10:00:00Z')).toBe(1000) // only the 06-10 row
  })
  it('sums all when anchor is before everything', () => {
    expect(sumProductionAfter(rows, '2026-01-01T00:00:00Z')).toBe(5500)
  })
  it('is 0 when anchor is after everything', () => {
    expect(sumProductionAfter(rows, '2026-07-01T00:00:00Z')).toBe(0)
  })
})
```
- [ ] **Step 2:** Implement in `prepared.ts`:
```ts
// Sum production amounts (yield or consumption) strictly after an anchor date.
export function sumProductionAfter(rows: Array<{ amount: number; produced_at: string }>, anchorAtISO: string): number {
  return rows.reduce((s, r) => (r.produced_at > anchorAtISO ? s + r.amount : s), 0)
}
```
Run test (PASS), then `npm run test:unit`.

- [ ] **Step 3: Data access** (append to `prepared.ts`):
```ts
export interface ProductionYieldRow { prepared_ingredient_id: string; yield_base_produced: number; produced_at: string }
export interface ProductionConsumptionRow { component_ingredient_id: string; amount_base_consumed: number; produced_at: string }

export async function readProductionYields(db: D1Database, tradeAccountId: string): Promise<ProductionYieldRow[]> {
  const res = await db.prepare(
    `SELECT prepared_ingredient_id, yield_base_produced, produced_at FROM pouriq_production_events WHERE trade_account_id = ?1`
  ).bind(tradeAccountId).all<ProductionYieldRow>()
  return res.results ?? []
}
export async function readProductionConsumption(db: D1Database, tradeAccountId: string): Promise<ProductionConsumptionRow[]> {
  const res = await db.prepare(`
    SELECT pc.component_ingredient_id, pc.amount_base_consumed, pc.produced_at
    FROM pouriq_production_components pc
    JOIN pouriq_production_events pe ON pe.id = pc.production_event_id
    WHERE pe.trade_account_id = ?1
  `).bind(tradeAccountId).all<ProductionConsumptionRow>()
  return res.results ?? []
}
```
- [ ] **Step 4: `recordProductionAction`** in `server-actions.ts`:
```ts
export async function recordProductionAction(preparedId: string, batches: number): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  if (!Number.isFinite(batches) || batches <= 0) throw new Error('Enter a positive number of batches')
  const prep = await db.prepare(`SELECT pack_size FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2 AND is_prepared = 1`).bind(preparedId, tradeAccountId).first<{ pack_size: number }>()
  if (!prep) throw new Error('Prepared recipe not found')
  const components = await listPreparedComponents(db, preparedId)
  const yield_base = prep.pack_size * batches
  // event row
  const evRow = await db.prepare(`
    INSERT INTO pouriq_production_events (trade_account_id, prepared_ingredient_id, batches, yield_base_produced)
    VALUES (?1, ?2, ?3, ?4) RETURNING id, produced_at
  `).bind(tradeAccountId, preparedId, batches, yield_base).first<{ id: string; produced_at: string }>()
  if (!evRow) throw new Error('Could not record production')
  // consumption snapshot rows (same produced_at)
  for (const c of components) {
    await db.prepare(`
      INSERT INTO pouriq_production_components (production_event_id, component_ingredient_id, amount_base_consumed, produced_at)
      VALUES (?1, ?2, ?3, ?4)
    `).bind(evRow.id, c.component_ingredient_id, c.amount_base * batches, evRow.produced_at).run()
  }
  revalidatePath('/trade/pouriq/stock')
}
```
(Import `listPreparedComponents` from `./prepared`. If `db.batch` is the codebase idiom for multi-insert, use it; otherwise the loop is fine.)
- [ ] **Step 5:** `tsc` clean; `npm run build`; `npm run test:unit` green. Commit `feat(pouriq): record-production action + production data access`.

---

### Task 3: Stock loader folds production into on-hand

**Files:** Modify `src/lib/pouriq/stock-loader.ts`

- [ ] **Step 1:** Read the loader. Add `readProductionYields` + `readProductionConsumption` to the `Promise.all` of tenant reads. Group:
  - `yieldByPrepared: Map<id, ProductionYieldRow[]>` (key = prepared_ingredient_id).
  - `consumptionByComponent: Map<id, ProductionConsumptionRow[]>` (key = component_ingredient_id).
- [ ] **Step 2:** In the per-ingredient on-hand computation (where `anchor` is set and `receiptsSince`/`usageSinceMl` are computed):
  - `const prodYieldBase = sumProductionAfter((yieldByPrepared.get(ingId) ?? []).map(r => ({ amount: r.yield_base_produced, produced_at: r.produced_at })), anchor.counted_at)`
  - `const prodConsumeBase = sumProductionAfter((consumptionByComponent.get(ingId) ?? []).map(r => ({ amount: r.amount_base_consumed, produced_at: r.produced_at })), anchor.counted_at)`
  - Fold yield into receipts (in packs) and subtract consumption (in packs):
    ```ts
    const on_hand = computeOnHandBottles({
      anchorCountQty: anchor.count_qty,
      receiptsSinceBottles: receiptsSince + prodYieldBase / meta.pack_size,
      usageSinceMl,
      bottleSizeMl: meta.pack_size,
      yieldPct: meta.yield_pct,
    }) - prodConsumeBase / meta.pack_size
    ```
  - For the no-anchor branch (`needs_opening_count`), nothing to add (on-hand is null there). But you MAY include production in `receipts_since` shown context if cheap; not required.
  - Production consumption is EXACT (no yield) — do NOT pass it through `applyYield`. (Only POS `usageSinceMl` gets yield via `computeOnHandBottles`.)
  - Note: an ingredient can be both produced (prepared) and consumed (component of another) — both terms apply; that is correct.
- [ ] **Step 3:** Add a focused test (`tests/unit/lib/pouriq-stock.test.ts` or a loader test if one exists) for the fold via the pure pieces if extractable; at minimum confirm `sumProductionAfter` + the arithmetic. (The DB loader itself is covered by build + the Task 6 smoke.)
- [ ] **Step 4:** `tsc` clean; `npm run build`; `npm run test:unit` green. Commit `feat(pouriq): fold production yield/consumption into stock on-hand`.

---

### Task 4: "Make a batch" UI on the stock page

**Files:** Modify `src/components/pouriq/StockManager.tsx` (+ the stock page if it must pass anything new)

- [ ] **Step 1:** Read `StockManager.tsx`. It renders each stock row (name, on-hand, Receive, Count). The loader rows already include prepared ingredients (ml + price>0). Add a **"Make a batch"** control on rows that are prepared. The loader row currently may not carry `is_prepared`; add it to `RollingStockRow` (loader already SELECTs library fields — add `is_prepared` to the SELECT + row) so the UI can show the control only for prepared ingredients.
  - Control: a small batches number input (`step 0.5, min 0`) + a "Make batch" button → `recordProductionAction(id, batches)` inside `useTransition`, then `router.refresh()`, shared error. Helper: "Records a batch: tops up this recipe's stock and draws down its components."
- [ ] **Step 2:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): make-a-batch control on the stock page`.

---

### Task 5: Verification + finish

- [ ] **Step 1:** `npm run test:unit`, `npm run build`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build` — all green.
- [ ] **Step 2:** Apply `0046` to the LOCAL D1 and smoke: with a prepared "Simple syrup" (ml, components defined) and an opening count, record "4 batches"; confirm simple syrup's on-hand rises by 4 × yield and an ml component's on-hand falls by its consumed amount; confirm a recipe edit afterwards does not change the recorded batch.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch` → PR. PR body: **apply 0046 after merge** (additive); Slice 3 Part B (production + stock); ml-scoped; variance + g/each stock deferred; snapshot at production time.

---

## Notes / risks
- **Additive migration**, low risk.
- **Costing/variance/non-production stock untouched** — production augments the loader's receipts/usage terms only.
- **Snapshot** rows make production immune to later recipe edits.
- **ml-scoped** consistent with 3a/variance; g/each production consumption is recorded (audit) but not shown.
- **Out of scope:** variance accounting for production/deliveries (later upgrade), g/each stock, batch shortfall warnings.
