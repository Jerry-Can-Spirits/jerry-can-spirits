# Pour IQ Unified Purchase-Basis Pricing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let bars price an ingredient by how they actually buy it ("£14.40 for a case of 24 × 200ml", "£2 for 6 lemons", "£45 for a 10L post-mix BIB") and derive per-item / per-ml cost automatically.

**Architecture:** One additive column `purchase_qty` (default 1) on `pouriq_ingredients_library`; the existing `bottle_cost_p`/`unit_cost_p` is reinterpreted as the *purchase* price for all `purchase_qty` items. Per-ml/per-item cost is derived by dividing by `purchase_qty`, through shared primitive helpers used at every cost-derivation site. Default of 1 makes the change a no-op for all existing data.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js server actions, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-23-pouriq-purchase-pricing-design.md`

**Branch:** create `feat/pouriq-purchase-pricing` off `origin/main`.

**Cost-derivation sites that MUST become pack-aware (found via grep — the plan routes them all through one helper):**
- `src/lib/pouriq/calculations.ts` `ingredientCostPence` (joined `IngredientWithLibrary`)
- `src/lib/pouriq/cost-impact-loader.ts` (~lines 32–40, flat DB row `lib_*`)
- `src/lib/pouriq/multi-cost-impact.ts` `contributionP` (~lines 59–76, flat row + supplied cost params)
- `src/lib/pouriq/variance.ts` `calcVarianceCostP` (~line 90, primitives)

---

### Task 1: Migration — add `purchase_qty`

**Files:**
- Create: `migrations/00NN_ingredient_purchase_qty.sql` (use the next free number; latest is `0037`, so almost certainly `0038`)

- [ ] **Step 1: Write the migration**

```sql
-- Unified purchase-basis pricing: purchase_qty is how many items the stored
-- price (bottle_cost_p / unit_cost_p) covers — 1 bottle, a case of 24, 6 lemons,
-- one 10L BIB. Per-item / per-ml cost = price / purchase_qty. Additive and
-- backward-compatible: default 1 means every existing row is unchanged.
ALTER TABLE pouriq_ingredients_library ADD COLUMN purchase_qty INTEGER NOT NULL DEFAULT 1;
```

- [ ] **Step 2: Apply locally and verify the column exists**

Run:
```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command "PRAGMA table_info(pouriq_ingredients_library);"
```
Expected: the column list now includes `purchase_qty` with `dflt_value` `1` and `notnull` `1`. (If the local DB doesn't exist yet, run `npx wrangler d1 migrations apply jerry-can-spirits-db --local` first.)

- [ ] **Step 3: Commit**

```bash
git add migrations/00NN_ingredient_purchase_qty.sql
git commit -m "feat(pouriq): add purchase_qty column (unified purchase pricing)"
```

---

### Task 2: Type + DB row shapes carry `purchase_qty`

**Files:**
- Modify: `src/lib/pouriq/types.ts` (`IngredientLibraryRow`, ~line 75)

- [ ] **Step 1: Add the field to the library row type**

In `IngredientLibraryRow`, after `unit_cost_p: number | null` add:
```ts
  purchase_qty: number
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: errors ONLY where an `IngredientLibraryRow` literal is constructed without `purchase_qty` (e.g. `IngredientPicker.tsx` `handleCreate`'s `newEntry`, any test factory). These are fixed in later tasks; note them. No other type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/types.ts
git commit -m "feat(pouriq): purchase_qty on IngredientLibraryRow"
```

---

### Task 3: Shared cost helpers + make `ingredientCostPence` pack-aware (TDD)

**Files:**
- Modify: `src/lib/pouriq/calculations.ts`
- Test: `tests/unit/lib/pouriq-purchase-cost.test.ts` (create)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { costPerMlP, unitPourCostP, bottlePourCostP } from '@/lib/pouriq/calculations'

describe('purchase-basis cost helpers', () => {
  it('per-ml cost divides the purchase price by qty then by size', () => {
    // £14.40 case of 24 × 200ml -> 60p/bottle -> 0.3p/ml
    expect(costPerMlP(1440, 200, 24)).toBeCloseTo(0.3, 5)
  })
  it('per-ml cost for a single bottle (qty 1) is unchanged', () => {
    // £20 / 700ml
    expect(costPerMlP(2000, 700, 1)).toBeCloseTo(2000 / 700, 5)
  })
  it('bottlePourCostP: 150ml from the £14.40/24×200ml case = ~45p', () => {
    expect(bottlePourCostP(1440, 200, 24, 150)).toBe(45)
  })
  it('unitPourCostP: 1/8 of a £2-for-6 lemon = ~4p', () => {
    // 200p / 6 = 33.33p per lemon; * 0.125 = 4.17 -> 4
    expect(unitPourCostP(200, 6, 0.125)).toBe(4)
  })
  it('unitPourCostP qty 1 unchanged (30p unit, count 1)', () => {
    expect(unitPourCostP(30, 1, 1)).toBe(30)
  })
})
```

- [ ] **Step 2: Run it; expect failure**

Run: `npx vitest run tests/unit/lib/pouriq-purchase-cost.test.ts`
Expected: FAIL — `costPerMlP`/`unitPourCostP`/`bottlePourCostP` are not exported.

- [ ] **Step 3: Add the helpers and rewrite `ingredientCostPence` to use them**

In `src/lib/pouriq/calculations.ts`, add near the top (after the VAT constant):
```ts
// Purchase-basis cost. The stored cost (bottle_cost_p / unit_cost_p) is the
// price for ALL purchase_qty items, so per-item / per-ml divides by qty first.
// qty defaults to 1 (existing rows), making these a no-op for current data.
export function costPerMlP(bottle_cost_p: number, bottle_size_ml: number, purchase_qty: number): number {
  return (bottle_cost_p / purchase_qty) / bottle_size_ml
}
export function bottlePourCostP(bottle_cost_p: number, bottle_size_ml: number, purchase_qty: number, pour_ml: number): number {
  return Math.round(costPerMlP(bottle_cost_p, bottle_size_ml, purchase_qty) * pour_ml)
}
export function unitPourCostP(unit_cost_p: number, purchase_qty: number, unit_count: number): number {
  return Math.round((unit_cost_p / purchase_qty) * unit_count)
}
```

Replace the body of `ingredientCostPence` (currently lines ~51–66) with:
```ts
function ingredientCostPence(i: import('./types').IngredientWithLibrary): number {
  const qty = i.library.purchase_qty
  if (i.library.unit_cost_p !== null) {
    return unitPourCostP(i.library.unit_cost_p, qty, i.unit_count ?? 1)
  }
  if (
    i.library.bottle_size_ml !== null &&
    i.library.bottle_cost_p !== null &&
    i.pour_ml !== null
  ) {
    return bottlePourCostP(i.library.bottle_cost_p, i.library.bottle_size_ml, qty, i.pour_ml)
  }
  return 0
}
```
(`ingredientCostComplete` is unchanged — `purchase_qty` is NOT NULL so it never affects completeness.)

- [ ] **Step 4: Run the new test + the existing calc tests**

Run: `npx vitest run tests/unit/lib/pouriq-purchase-cost.test.ts tests/unit/lib`
Expected: all pass. The existing calculation tests still pass because their rows have `purchase_qty` 1 (add `purchase_qty: 1` to any calc test fixture the type-checker flagged in Task 2).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/calculations.ts tests/unit/lib/pouriq-purchase-cost.test.ts
git commit -m "feat(pouriq): pack-aware cost helpers; ingredientCostPence uses purchase_qty"
```

---

### Task 4: Variance cost is pack-aware (TDD)

**Files:**
- Modify: `src/lib/pouriq/variance.ts` (`calcVarianceCostP`, ~line 84)
- Test: `tests/unit/lib/pouriq-variance.test.ts` (extend the existing file)

- [ ] **Step 1: Write the failing test** (append inside the existing file)

```ts
import { calcVarianceCostP } from '@/lib/pouriq/variance'

describe('calcVarianceCostP with purchase_qty', () => {
  it('divides the bottle price by purchase_qty (case of 24)', () => {
    // 200ml short of a £14.40/24×200ml case: per-ml 0.3p * 200 = 60p
    expect(calcVarianceCostP(200, 200, 1440, 24)).toBe(60)
  })
  it('qty 1 matches the old behaviour', () => {
    // 100ml of a £20/700ml bottle: (2000/700)*100 = 285.7 -> 286
    expect(calcVarianceCostP(100, 700, 2000, 1)).toBe(286)
  })
})
```

- [ ] **Step 2: Run it; expect failure**

Run: `npx vitest run tests/unit/lib/pouriq-variance.test.ts`
Expected: FAIL — `calcVarianceCostP` currently takes 3 args, not 4.

- [ ] **Step 3: Add `purchase_qty` to `calcVarianceCostP`**

Replace `calcVarianceCostP` with (note the new 4th param and use of the shared helper):
```ts
import { costPerMlP } from './calculations'

export function calcVarianceCostP(
  variance_ml: number | null,
  bottle_size_ml: number,
  bottle_cost_p: number,
  purchase_qty: number,
): number | null {
  if (variance_ml === null) return null
  return Math.round(variance_ml * costPerMlP(bottle_cost_p, bottle_size_ml, purchase_qty))
}
```
Then update its caller in `src/lib/pouriq/variance-loader.ts`: find the `calcVarianceCostP(...)` call and pass the library row's `purchase_qty` as the 4th argument (the loader already has the library row; add `purchase_qty` to the SELECT in that file — see Task 6 for the SELECT pattern).

- [ ] **Step 4: Run variance tests**

Run: `npx vitest run tests/unit/lib/pouriq-variance.test.ts`
Expected: PASS (both the new cases and the existing `classifyVariance` tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/variance.ts src/lib/pouriq/variance-loader.ts tests/unit/lib/pouriq-variance.test.ts
git commit -m "feat(pouriq): variance cash cost is purchase_qty-aware"
```

---

### Task 5: Pack-aware in the cost-impact loaders

**Files:**
- Modify: `src/lib/pouriq/cost-impact-loader.ts` (derivation ~lines 32–40 + its SELECT + row type)
- Modify: `src/lib/pouriq/multi-cost-impact.ts` (`contributionP` ~lines 59–76 + `RawRow` + its SELECT)

- [ ] **Step 1: cost-impact-loader — carry and apply purchase_qty**

Add `lib_purchase_qty` to the SQL SELECT (alongside `lib_bottle_size_ml` etc.: `l.purchase_qty AS lib_purchase_qty`), add `lib_purchase_qty: number` to the row type, and replace the two derivation lines:
```ts
// unit branch (was: Math.round(row.lib_unit_cost_p * count))
return unitPourCostP(row.lib_unit_cost_p, row.lib_purchase_qty, row.ingredient_unit_count ?? 1)
// bottle branch (was: Math.round((row.lib_bottle_cost_p / row.lib_bottle_size_ml) * row.ingredient_pour_ml))
return bottlePourCostP(row.lib_bottle_cost_p, row.lib_bottle_size_ml, row.lib_purchase_qty, row.ingredient_pour_ml)
```
Import the helpers: `import { unitPourCostP, bottlePourCostP } from './calculations'`.

- [ ] **Step 2: multi-cost-impact — carry and apply purchase_qty**

Add `lib_purchase_qty` to `RawRow` and the SELECT (`l.purchase_qty AS lib_purchase_qty`). Change `contributionP` to take the qty from the row and use the helpers:
```ts
function contributionP(
  row: Pick<RawRow, 'ingredient_pour_ml' | 'ingredient_unit_count' | 'lib_bottle_size_ml' | 'lib_purchase_qty'>,
  bottleCostP: number | null,
  unitCostP: number | null,
): number {
  if (unitCostP !== null) {
    return unitPourCostP(unitCostP, row.lib_purchase_qty, row.ingredient_unit_count ?? 1)
  }
  if (row.lib_bottle_size_ml !== null && bottleCostP !== null && row.ingredient_pour_ml !== null) {
    return bottlePourCostP(bottleCostP, row.lib_bottle_size_ml, row.lib_purchase_qty, row.ingredient_pour_ml)
  }
  return 0
}
```
Import the helpers from `./calculations`.

- [ ] **Step 3: Build + type-check**

Run: `npx tsc --noEmit`
Expected: no errors in these two files (SELECT row types now include `lib_purchase_qty`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/pouriq/cost-impact-loader.ts src/lib/pouriq/multi-cost-impact.ts
git commit -m "feat(pouriq): cost-impact loaders are purchase_qty-aware"
```

---

### Task 6: Persist `purchase_qty` (read + write paths)

**Files:**
- Modify: `src/lib/pouriq/ingredient-library.ts` (SELECT column list + row→`IngredientLibraryRow` mapper; INSERT/UPDATE if present)
- Modify: `src/lib/pouriq/server-actions.ts` (`LibraryEntryInput` ~line 279, `saveLibraryEntryAction` INSERT/UPDATE ~line 287)
- Modify: `src/lib/pouriq/menus.ts` (any SELECT that joins the library and builds `IngredientLibraryRow` — add `purchase_qty`)
- Modify: import commit (`src/app/api/pouriq/import/commit/route.ts`) and invoice commit (`src/app/api/pouriq/invoices/commit/route.ts`) where library rows are created/updated — default `purchase_qty` to 1 unless supplied

- [ ] **Step 1: Read every library SELECT and INSERT to enumerate exact lines**

Run:
```bash
grep -rn "bottle_cost_p\|unit_cost_p\|pouriq_ingredients_library" src/lib/pouriq src/app/api/pouriq | grep -i "select\|insert\|update\|bottle_cost_p\|unit_cost_p"
```
Expected: a list of every SQL touching the library. For EACH `SELECT` that maps to `IngredientLibraryRow`, add `purchase_qty` to the column list and the mapper. For each `INSERT`/`UPDATE` writing cost, include `purchase_qty`.

- [ ] **Step 2: `LibraryEntryInput` + `saveLibraryEntryAction`**

In `server-actions.ts`, add to `LibraryEntryInput`:
```ts
  purchase_qty: number   // how many items the price covers; 1 for a single bottle/unit
```
In `saveLibraryEntryAction`, include `purchase_qty` in the INSERT column list/values and the UPDATE SET clause (bind `input.purchase_qty`). Validate server-side: `if (!Number.isInteger(input.purchase_qty) || input.purchase_qty < 1) throw new Error('purchase_qty must be a positive integer')`.

- [ ] **Step 3: Default purchase_qty in the read mapper and SELECTs**

Wherever a DB row becomes an `IngredientLibraryRow`, set `purchase_qty: row.purchase_qty ?? 1` (the `?? 1` guards rows read before the column existed in any cached path).

- [ ] **Step 4: Import & invoice commit**

In both commit routes, where a new library entry is created from a staged `new_library`, pass `purchase_qty: 1` (import staging has no pack concept yet — that's fine; the bar edits it later). Confirm the INSERT includes the column.

- [ ] **Step 5: Type-check + build**

Run: `npx tsc --noEmit && npm run build`
Expected: passes. Fix any remaining `IngredientLibraryRow` literal missing `purchase_qty` (e.g. `IngredientPicker.tsx` `newEntry` — set `purchase_qty: 1`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pouriq): persist purchase_qty across save/read/import/invoice"
```

---

### Task 7: Cost-entry UX — purchase basis + free size + derived readout

**Files:**
- Modify: `src/components/pouriq/IngredientForm.tsx` (library add/edit — the cost block)
- Modify: `src/components/pouriq/IngredientPicker.tsx` (inline create) and `src/components/pouriq/IngredientMatchRow.tsx` (import inline create)
- Modify: `src/lib/pouriq/measures.ts` (add `BOTTLE_SIZES_ML` presets) — only if PR #786's `measures.ts` is merged; otherwise create it.

- [ ] **Step 1: Add bottle-size presets**

In `src/lib/pouriq/measures.ts` add:
```ts
export const BOTTLE_SIZES_ML: readonly number[] = [150, 200, 500, 700, 750, 1000, 2000]
```

- [ ] **Step 2: IngredientForm cost block**

Replace the pricing-mode + bottle-size + cost inputs with: a Poured/Whole-item toggle (Poured = `bottle_size_ml` set, recipe ml; Whole = `unit_cost_p`, recipe count); a "Price you pay" money input (binds the cost field); a "What that buys" `[qty]` number (binds `purchase_qty`, min 1, default 1) and, for Poured, a size input that is **free numeric entry** with `BOTTLE_SIZES_ML` quick chips (replaces the fixed dropdown — so 10000 for a BIB is typeable); and a live derived readout line computed with the helpers:
```tsx
// derived readout (Poured example)
const perMl = bottle_cost_p != null && bottle_size_ml ? costPerMlP(bottle_cost_p, bottle_size_ml, purchase_qty) : null
// "= £{(bottle_cost_p/purchase_qty/100).toFixed(2)} per bottle · £{(perMl/100).toFixed(4)} / ml"
```
`purchase_qty` defaults to 1 so the simple "£20, 1 × 700ml" path is unchanged in feel. Submit `purchase_qty` in the save payload.

- [ ] **Step 3: Inline-create in IngredientPicker and IngredientMatchRow**

Mirror the same fields at the smaller inline-create scale (qty defaults 1; free size entry with chips). Set `purchase_qty` on the staged `new_library` (extend `MatchRowState.new_library` with `purchase_qty: number`) and on the `IngredientPicker` `newEntry`/save payload. The import staging may keep `purchase_qty: 1` and rely on later editing if the inline form is kept minimal — acceptable per spec.

- [ ] **Step 4: Build + manual smoke (dev server)**

Run: `npm run build`
Expected: passes. Then `npm run dev`, add/edit an ingredient: enter "£14.40", qty "24", size "200" → readout shows "£0.60 per bottle · £0.003 / ml"; a single "£20 / 1 × 700ml" reads as before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pouriq): purchase-basis cost entry (qty + free size + derived readout)"
```

---

### Task 8: Plain-English read-back (`formatPurchaseBasis`) (TDD)

**Files:**
- Modify: `src/lib/pouriq/calculations.ts` (add `formatPurchaseBasis`)
- Test: `tests/unit/lib/pouriq-purchase-cost.test.ts` (extend)
- Modify: library list + edit page where pricing is displayed (e.g. `src/app/trade/pouriq/library/page.tsx`, the `IngredientForm` header) to render it

- [ ] **Step 1: Write the failing test**

```ts
import { formatPurchaseBasis } from '@/lib/pouriq/calculations'

describe('formatPurchaseBasis', () => {
  it('case of small bottles', () => {
    expect(formatPurchaseBasis({ bottle_cost_p: 1440, bottle_size_ml: 200, unit_cost_p: null, purchase_qty: 24 }))
      .toBe('£14.40 / 24 × 200ml (£0.003/ml)')
  })
  it('single bottle', () => {
    expect(formatPurchaseBasis({ bottle_cost_p: 2000, bottle_size_ml: 700, unit_cost_p: null, purchase_qty: 1 }))
      .toBe('£20.00 / 700ml (£0.029/ml)')
  })
  it('pack of whole items', () => {
    expect(formatPurchaseBasis({ bottle_cost_p: null, bottle_size_ml: null, unit_cost_p: 200, purchase_qty: 6 }))
      .toBe('£2.00 / 6 (£0.33 each)')
  })
})
```

- [ ] **Step 2: Run it; expect failure** — `formatPurchaseBasis` not exported.

Run: `npx vitest run tests/unit/lib/pouriq-purchase-cost.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `formatPurchaseBasis`**

```ts
export function formatPurchaseBasis(e: {
  bottle_cost_p: number | null
  bottle_size_ml: number | null
  unit_cost_p: number | null
  purchase_qty: number
}): string {
  const gbp = (p: number) => `£${(p / 100).toFixed(2)}`
  if (e.unit_cost_p !== null) {
    const each = e.unit_cost_p / e.purchase_qty / 100
    const qtyPart = e.purchase_qty === 1 ? '' : ` / ${e.purchase_qty}`
    return `${gbp(e.unit_cost_p)}${qtyPart} (£${each.toFixed(2)} each)`
  }
  if (e.bottle_cost_p !== null && e.bottle_size_ml !== null) {
    const perMl = costPerMlP(e.bottle_cost_p, e.bottle_size_ml, e.purchase_qty) / 100
    const buys = e.purchase_qty === 1 ? `${e.bottle_size_ml}ml` : `${e.purchase_qty} × ${e.bottle_size_ml}ml`
    return `${gbp(e.bottle_cost_p)} / ${buys} (£${perMl.toFixed(3)}/ml)`
  }
  return '—'
}
```

- [ ] **Step 4: Run test; render it**

Run: `npx vitest run tests/unit/lib/pouriq-purchase-cost.test.ts`
Expected: PASS. Then render `formatPurchaseBasis(entry)` on the library list rows and the edit-page header (small muted text).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pouriq): plain-English purchase-basis read-back"
```

---

### Task 9: Final verification

**Files:** none

- [ ] **Step 1: No raw derivation left**

Run:
```bash
grep -rn "bottle_cost_p / \|/ bottle_size_ml\|unit_cost_p \*" src/lib/pouriq src/app/api/pouriq
```
Expected: only the shared helpers in `calculations.ts`. Any other hit is a missed site — route it through `costPerMlP`/`bottlePourCostP`/`unitPourCostP`.

- [ ] **Step 2: Full gates**

Run: `npm run test:unit && npm run build && npx opennextjs-cloudflare build`
Expected: all pass.

- [ ] **Step 3: Behaviour-unchanged check (existing data)**

Confirm the existing calc/variance tests (qty = 1) still pass unchanged — this is the safety property that existing ingredients' costs/GP are identical.

---

### Task 10: Finish

- [ ] **Step 1:** Use `superpowers:finishing-a-development-branch` → push & open PR.
- [ ] **Step 2:** PR body notes: **after merge, apply the migration to prod** — `npx wrangler d1 migrations apply jerry-can-spirits-db --remote`.
- [ ] **Step 3:** Let CI + Cloudflare Workers build go green before merge.

---

## Post-merge follow-ups (not in this plan)
Produce-yield helper ("1 lemon = N slices → ⅛"); import inline-create gaining full pack entry (currently defaults qty 1). Tracked in `memory/project_pour_iq_backlog.md`.
