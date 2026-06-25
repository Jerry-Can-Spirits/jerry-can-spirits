# Prepared-Recipe Costing (Slice 3-costing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let an ingredient be made in-house from components + a yield, with cost derived (`batch cost ÷ yield`) and materialised onto the library row, so cocktails/variance/stock cost it like any ingredient. Nesting with cycle detection; recompute on component cost change.

**Architecture:** Additive migration (`is_prepared` flag + `pouriq_prepared_components`). A prepared row stores `price_p` = derived batch cost, `pack_size` = yield. Pure cost + graph helpers (cycle detection, topological recompute order); a server recompute layer; CRUD actions; the ingredient form gains a "Made in-house" card. Recompute fires on prepared-save, manual cost edit, and invoice commit.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-25-pouriq-prepared-recipes-costing-design.md`.

**Branch:** `feat/pouriq-prepared-recipes-costing` (off `main`). Next migration: **0045**.

**Model recap (Slices 1+2):** library row has `base_unit`/`pack_size`/`price_p`/`purchase_qty`/`yield_pct`; `usableCostPerBaseUnitP(price_p, packs, pack_size, yield_pct)` is the cost-per-base helper. Recipe line has `recipe_unit`/`recipe_qty` (display) + `pour_ml`/`unit_count` (base). `ServeUnitPicker` for unit+qty entry; `serveUnitsFor`/`recipeBaseAmount` in `measures.ts`.

**Safety:** each task ends tsc clean + tests green (build from the UI task on). Cost/variance/stock helpers are NOT changed (a prepared ingredient's derived price_p flows through them unchanged). Migration applied locally only in Task 6.

---

### Task 1: Migration 0045 — is_prepared + components table

**Files:** Create `migrations/0045_prepared_recipes.sql`

- [ ] **Step 1: Write the migration**
```sql
-- Slice 3 (costing): prepared/in-house ingredients. is_prepared flags a library
-- row whose price_p (= batch cost) and pack_size (= yield) are DERIVED from its
-- components rather than typed in. Additive: default 0 = all existing are purchased.
ALTER TABLE pouriq_ingredients_library ADD COLUMN is_prepared INTEGER NOT NULL DEFAULT 0;

CREATE TABLE pouriq_prepared_components (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  prepared_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  component_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE RESTRICT,
  amount_base REAL NOT NULL CHECK (amount_base > 0),
  recipe_unit TEXT,
  recipe_qty REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_prepared_components_parent ON pouriq_prepared_components (prepared_ingredient_id);
CREATE INDEX idx_prepared_components_child ON pouriq_prepared_components (component_ingredient_id);
```
- [ ] **Step 2: Validate** in-memory (`node:sqlite`, mirroring prior migration tests): create a minimal `pouriq_ingredients_library(id TEXT PRIMARY KEY)`, run the migration, assert `is_prepared` present on the library and `pouriq_prepared_components` exists with the expected columns. (Add as `tests/unit/lib/pouriq-prepared-migration.test.ts`.)
- [ ] **Step 3: Commit** `feat(pouriq): is_prepared + prepared_components table (0045)`. Do NOT apply locally.

---

### Task 2: Pure cost helper (TDD) + types

**Files:** Create `src/lib/pouriq/prepared.ts`; Modify `src/lib/pouriq/types.ts`; Test `tests/unit/lib/pouriq-prepared-cost.test.ts`

- [ ] **Step 1: Failing test**
```ts
import { describe, it, expect } from 'vitest'
import { batchCostP } from '@/lib/pouriq/prepared'

describe('batchCostP', () => {
  it('sums component costs (sugar -> simple syrup)', () => {
    // sugar: price_p 100 for 1 pack of 100g (£0.01/g... use £1/1000g => price_p 100, pack_size 1000 => 0.1p/g)
    // 1000g sugar at 0.1p/g = 100p
    const cost = batchCostP([
      { price_p: 100, purchase_qty: 1, pack_size: 1000, yield_pct: 100, amount_base: 1000 },
    ])
    expect(cost).toBe(100)
  })
  it('adds multiple components and applies yield', () => {
    // comp A: 0.001p/ml * 500 = 0.5 -> round 1; comp B: £0.000625/ml * 500 = 0.3125 -> round 0
    const cost = batchCostP([
      { price_p: 1, purchase_qty: 1, pack_size: 1000, yield_pct: 100, amount_base: 500 },
      { price_p: 1000, purchase_qty: 1, pack_size: 1600000, yield_pct: 100, amount_base: 500 },
    ])
    expect(cost).toBe(1) // 1 (rounded) + 0 (rounded)
  })
  it('is 0 for no components', () => {
    expect(batchCostP([])).toBe(0)
  })
})
```
- [ ] **Step 2:** Run (FAIL), implement in `prepared.ts`:
```ts
import { usableCostPerBaseUnitP } from './calculations'

export interface PreparedComponentCost {
  price_p: number
  purchase_qty: number
  pack_size: number
  yield_pct: number
  amount_base: number
}

// Total cost (pence) of one batch: sum each component's usable cost-per-base × amount.
export function batchCostP(components: PreparedComponentCost[]): number {
  return components.reduce(
    (sum, c) => sum + Math.round(usableCostPerBaseUnitP(c.price_p, c.purchase_qty, c.pack_size, c.yield_pct) * c.amount_base),
    0,
  )
}
```
- [ ] **Step 3: Types** in `types.ts`: add `is_prepared: number` to `IngredientLibraryRow` (fix fixtures: add `is_prepared: 0`). Add:
```ts
export interface PreparedComponentRow {
  id: string
  prepared_ingredient_id: string
  component_ingredient_id: string
  amount_base: number
  recipe_unit: string | null
  recipe_qty: number | null
  created_at: string
}
```
Update the library SELECT/mappers (grep `IngredientLibraryRow` construction sites: `menus.ts`, `ingredient-library.ts`, catalogue, by-barcode, IngredientPicker, fixtures) to select+map `is_prepared` (default 0).
- [ ] **Step 4:** Tests PASS, `tsc` clean, `npm run test:unit` green. Commit `feat(pouriq): prepared batchCostP helper + is_prepared type`.

---

### Task 3: Graph helpers (TDD) + recompute layer

**Files:** Modify `src/lib/pouriq/prepared.ts`; Test add to `tests/unit/lib/pouriq-prepared-cost.test.ts`

- [ ] **Step 1: Failing tests for the pure graph helpers**
```ts
import { transitiveComponents, wouldCreateCycle, recomputeOrder } from '@/lib/pouriq/prepared'

// graph: preparedId -> its component ingredient ids
const g = new Map<string, string[]>([
  ['syrup', ['sugar']],
  ['sour', ['syrup', 'lemon']],
])

describe('transitiveComponents', () => {
  it('returns all components transitively', () => {
    expect([...transitiveComponents(g, 'sour')].sort()).toEqual(['lemon', 'sugar', 'syrup'])
  })
})
describe('wouldCreateCycle', () => {
  it('rejects adding a parent into its child', () => {
    expect(wouldCreateCycle(g, 'sugar', 'syrup')).toBe(true)   // sugar would contain syrup which contains sugar
    expect(wouldCreateCycle(g, 'syrup', 'syrup')).toBe(true)   // self
    expect(wouldCreateCycle(g, 'syrup', 'lemon')).toBe(false)  // fine
  })
})
describe('recomputeOrder', () => {
  it('orders affected prepared ingredients deepest-first', () => {
    // changing sugar affects syrup then sour (syrup before sour)
    expect(recomputeOrder(g, 'sugar')).toEqual(['syrup', 'sour'])
    expect(recomputeOrder(g, 'lemon')).toEqual(['sour'])
  })
})
```
- [ ] **Step 2:** Implement (append to `prepared.ts`):
```ts
export type ComponentGraph = Map<string, string[]> // preparedId -> component ingredient ids

export function transitiveComponents(graph: ComponentGraph, id: string): Set<string> {
  const seen = new Set<string>()
  const stack = [...(graph.get(id) ?? [])]
  while (stack.length) {
    const c = stack.pop()!
    if (seen.has(c)) continue
    seen.add(c)
    for (const cc of graph.get(c) ?? []) stack.push(cc)
  }
  return seen
}

// Adding `candidate` as a component of `prepared` creates a cycle if candidate
// already (transitively) contains prepared, or candidate === prepared.
export function wouldCreateCycle(graph: ComponentGraph, prepared: string, candidate: string): boolean {
  if (prepared === candidate) return true
  return transitiveComponents(graph, candidate).has(prepared)
}

// Prepared ingredients that transitively depend on changedId, ordered so a
// prepared ingredient comes AFTER its (affected) components (deepest-first).
export function recomputeOrder(graph: ComponentGraph, changedId: string): string[] {
  const parents = new Map<string, string[]>()
  for (const [p, comps] of graph) for (const c of comps) {
    const arr = parents.get(c) ?? []; arr.push(p); parents.set(c, arr)
  }
  const affected = new Set<string>()
  const stack = [...(parents.get(changedId) ?? [])]
  while (stack.length) {
    const p = stack.pop()!
    if (affected.has(p)) continue
    affected.add(p)
    for (const pp of parents.get(p) ?? []) stack.push(pp)
  }
  const order: string[] = []
  const visited = new Set<string>()
  const visit = (id: string): void => {
    if (visited.has(id)) return
    visited.add(id)
    for (const c of graph.get(id) ?? []) if (affected.has(c)) visit(c)
    if (affected.has(id)) order.push(id)
  }
  for (const id of affected) visit(id)
  return order
}
```
- [ ] **Step 3: DB recompute layer** (server, in `prepared.ts`, `'server-only'` if siblings are):
  - `loadPreparedGraph(db, tradeAccountId): Promise<ComponentGraph>` — one query: `SELECT pc.prepared_ingredient_id, pc.component_ingredient_id FROM pouriq_prepared_components pc JOIN pouriq_ingredients_library lib ON lib.id = pc.prepared_ingredient_id WHERE lib.trade_account_id = ?1`, built into the Map.
  - `listPreparedComponents(db, preparedId)` — components joined to the component ingredients' cost fields (`price_p, purchase_qty, pack_size, yield_pct, base_unit, name`) for the live readout + recompute.
  - `recomputePreparedCost(db, preparedId): Promise<number>` — load components (+ costs), `price_p = batchCostP(...)`, `UPDATE pouriq_ingredients_library SET price_p = ?, updated_at = datetime('now') WHERE id = ?` (pack_size already = yield). Return the new price_p.
  - `recomputeDependents(db, tradeAccountId, changedIngredientId)` — `loadPreparedGraph`, `recomputeOrder(graph, changedId)`, then `recomputePreparedCost` for each id in order. (Tenant-scoped via the graph load.)
- [ ] **Step 4:** Tests PASS, `tsc` clean, `npm run build`. Commit `feat(pouriq): prepared cost graph (cycle detection, topological recompute)`.

---

### Task 4: Server actions + recompute triggers

**Files:** Modify `src/lib/pouriq/server-actions.ts`, `src/app/api/pouriq/invoices/commit/route.ts`

- [ ] **Step 1: Component CRUD actions** (tenant-guard both the prepared ingredient and the component via the library ownership pattern):
  - `addPreparedComponentAction(preparedId, componentId, amount_base, recipe_unit, recipe_qty)`: reject if `componentId === preparedId`; load the graph and reject if `wouldCreateCycle(graph, preparedId, componentId)`; INSERT the component; then `recomputePreparedCost(preparedId)` + `recomputeDependents(preparedId)`; revalidate the edit + library paths.
  - `removePreparedComponentAction(componentRowId)`: ownership via join to the prepared ingredient's library row; resolve its `preparedId`; DELETE; recompute that prepared + dependents; revalidate.
- [ ] **Step 2: Prepared save in `saveLibraryEntryAction`:** when the form input marks the ingredient as prepared (`is_prepared`), persist `is_prepared = 1`, `base_unit` (= yield unit), `pack_size` (= yield amount), `purchase_qty = 1`, `yield_pct = 100`; do NOT require the price/pack purchase inputs; after the row is saved, `recomputePreparedCost(id)` (so price_p reflects existing components) + `recomputeDependents(id)`.
- [ ] **Step 3: Manual cost-edit trigger:** when `saveLibraryEntryAction` updates a NON-prepared ingredient's cost (price_p/pack_size changed), call `recomputeDependents(db, tradeAccountId, id)` after the update.
- [ ] **Step 4: Invoice-commit trigger:** in `invoices/commit/route.ts`, after the cost UPDATEs for matched library ingredients, call `recomputeDependents(db, access.tradeAccountId, matchedId)` for each ingredient whose cost changed (before the response). Wrap so a recompute failure logs to Sentry but does not break the commit.
- [ ] **Step 5:** `tsc` clean, `npm run build`, `npm run test:unit` green. Commit `feat(pouriq): prepared component actions + recompute triggers`.

---

### Task 5: Ingredient form "Made in-house" card

**Files:** Modify `src/components/pouriq/IngredientForm.tsx`; the edit page loads components.

- [ ] **Step 1:** Add a 4th option to the "How do you buy this?" selector: **Made in-house**. When selected:
  - Hide Price/Packs/Pack size. Show **base unit** of the yield (ml/g/each) and **Yield amount** (= pack_size) with helper "how much this batch makes".
  - **Components editor** (gated to EDIT — needs the ingredient id; on create show "Save first, then add the components"): list existing components (name + amount + per-component cost) with Delete (`removePreparedComponentAction`); "Add component" = `IngredientPicker` (EXCLUDE this ingredient and any candidate where `wouldCreateCycle` would be true — fetch the tenant graph or rely on the action's rejection + a client check) + a `ServeUnitPicker` for the amount → `amount_base` via `recipeBaseAmount`, then `addPreparedComponentAction`.
  - **Live derived cost readout**: batch cost + cost per yield base unit + per common serve, from the components' costs (compute client-side via `usableCostPerBaseUnitP` for the preview; the server is the source of truth on save).
  - Persistent helper text.
- [ ] **Step 2:** The edit page (`/trade/pouriq/library/[id]/edit`) loads `listPreparedComponents(db, id)` (and the tenant serve-units already loaded for the ServeUnitPicker) and passes them to the form. The create page passes empty.
- [ ] **Step 3:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): made-in-house prepared recipe builder on the ingredient form`.

---

### Task 6: Verification + finish

- [ ] **Step 1:** `npm run test:unit`, `npm run build`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build` — all green.
- [ ] **Step 2:** Apply `0045` to the LOCAL D1 and smoke: create "Simple syrup" (made in-house, base ml, yield 1600), add 1000 g of a Sugar ingredient as a component, confirm the derived cost/ml; use "15 ml simple syrup" in a cocktail and confirm the cocktail cost; create "Sour mix" using simple syrup (nesting) and confirm; change Sugar's cost and confirm syrup + sour + cocktails update; confirm a cycle is rejected.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch` → PR. PR body: **apply migration 0045 after merge** (additive); Part A (costing) of Slice 3 — Part B (production + prepared stock) is the next sub-slice; cross-dimension (lime juice) now expressible; existing costs unchanged.

---

## Notes / risks
- **Additive migration**, low risk.
- **Cost/variance/stock untouched** — a prepared ingredient's derived `price_p` flows through the existing helpers; nothing special-cases prepared.
- **Recompute correctness** depends on topological order (`recomputeOrder`) — covered by the pure test; the DB layer just applies it.
- **Cycle prevention** at the action layer (and a client pre-check) keeps the graph a DAG.
- **Out of scope (Part B):** production events, prepared-ingredient stock/variance.
