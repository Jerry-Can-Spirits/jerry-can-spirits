# Pour IQ Fresh-Produce Stock + Variance (Piece B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fresh-produce (each/g, use-based) stock + variance in the SAME variance and stock views as spirits, labeled in the produce's own unit.

**Architecture:** Strictly ADDITIVE — a separate produce gather + produce loop in each of the three live loaders, appended to the results; the ml recipe read, ml theoretical, and ml loop are NOT edited. A pure `produceLineUnits` helper. `base_unit` tag on rows. Unit-aware UI. **No migration, no new dependencies.**

**Tech Stack:** Next.js 15 App Router, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-pouriq-produce-variance-design.md`
**Branch:** `feat/pouriq-produce-variance` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes. **REGRESSION RULE: an ml-only tenant's loader output must be byte-for-byte identical — never edit the ml recipe read, ml theoretical summation, or ml variance-cost.**

**Verified facts:**
- `variance-rolling-loader.ts`: `readTenantRecipes` (line 65, filter `base_unit='ml' … pour_ml IS NOT NULL`); `loadRollingVariance` (line 123) builds `linesByIngredient` (cocktail_id + pour_ml) + `metaByIngredient` (name/pack_size/price_p/purchase_qty/yield_pct), then loops `ingredientIds` computing theoretical (`Σ sumBucketsInWindow(...) × pour_ml`), actual (counts+receipts), `calcVariance`, `calcVarianceCostP`. `RollingVarianceRow` interface at line 16 (`theoretical_used_ml`, `variance_ml`, `actual_used_ml`, `variance_cost_p`, …).
- `stock-loader.ts` (filter `base_unit='ml'`, line 38) + `variance-detail-loader.ts` (filter line 49/60) follow the same shape.
- `pouriq_ingredient_uses(id, ingredient_id, name, recipe_unit, yield_qty, …)`; recipe line `pouriq_ingredients.use_id`, `recipe_qty`. `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct)` gives cost per purchase unit (each/g). `calcVariance`, `classifyVariance` are unit-agnostic.

---

## Task 1: `produceLineUnits` helper + `base_unit` on row types

**Files:** Modify `src/lib/pouriq/variance.ts`; add `base_unit` to `RollingVarianceRow` (`variance-rolling-loader.ts`), the stock row (`stock-loader.ts`), `VarianceDetail` (`variance-detail-loader.ts`); create `tests/unit/lib/pouriq-produce-variance.test.ts`.

- [ ] **Step 1: Failing test**
```ts
import { produceLineUnits } from '@/lib/pouriq/variance'
it('converts sales to purchase units via the use yield', () => {
  expect(produceLineUnits(100, 25, 30)).toBeCloseTo(83.333, 2) // 100 drinks x 25ml juice / 30ml-per-lemon
  expect(produceLineUnits(100, 1, 8)).toBe(12.5)               // 100 wheels / 8-per-lemon
})
it('guards a zero/negative yield', () => {
  expect(produceLineUnits(100, 25, 0)).toBe(0)
})
```

- [ ] **Step 2: Implement** (additive — do NOT touch `calcTheoreticalUsedMl`)
```ts
export function produceLineUnits(unitsSold: number, recipeQty: number, yieldQty: number): number {
  if (yieldQty <= 0) return 0
  return unitsSold * (recipeQty / yieldQty)
}
```

- [ ] **Step 3: Row types** — add `base_unit: 'ml' | 'each' | 'g'` to `RollingVarianceRow`, the stock-loader row interface, and `VarianceDetail`. Set `base_unit: 'ml'` on every EXISTING ml row construction (so nothing changes for ml). `tsc` will flag the construction sites; set them all to `'ml'`.

- [ ] **Step 4: Green + commit**
```bash
git add src/lib/pouriq/variance.ts src/lib/pouriq/variance-rolling-loader.ts src/lib/pouriq/stock-loader.ts src/lib/pouriq/variance-detail-loader.ts tests/unit
git commit -m "feat(pouriq): produceLineUnits helper + base_unit on variance/stock rows"
```

---

## Task 2: Rolling-variance produce branch

**Files:** Modify `src/lib/pouriq/variance-rolling-loader.ts`.

- [ ] **Step 1: Produce recipe read** — add `readTenantProduceRecipes(db, tradeAccountId)` beside `readTenantRecipes` (do not edit the ml one): same joins but `WHERE lib.base_unit IN ('each','g') AND lib.price_p > 0 AND i.use_id IS NOT NULL`, joining `pouriq_ingredient_uses u ON u.id = i.use_id`; select `c.id AS cocktail_id, i.library_ingredient_id, i.recipe_qty, u.yield_qty, lib.base_unit, lib.name, lib.pack_size, lib.price_p, lib.purchase_qty, lib.yield_pct`.

- [ ] **Step 2: Produce loop** — after the existing ml loop appends its rows, add a SECOND pass over produce ingredients (build `produceLinesByIngredient` = {cocktail_id, recipe_qty, yield_qty} and `produceMetaByIngredient` incl. `base_unit`). MIRROR the ml loop's structure for counts/receipts/actual/window (reuse the SAME `eventsByIngredient`/`receiptsByIngredient`/`pairLatestCounts` maps — they are unit-agnostic and already built), but:
  - theoretical = `Σ sumBucketsInWindow(buckets, ws, we) × produceLineUnits(1, line.recipe_qty, line.yield_qty)` summed per line (i.e. multiply the windowed units by `recipe_qty/yield_qty`). Do NOT apply `applyYield` (produce yield_pct is 100; the per-use yield is the only conversion).
  - variance cost = `Math.round(variance × usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct))` (NOT `calcVarianceCostP`, which is per-ml).
  - build the `RollingVarianceRow` with `base_unit` from meta, the quantities in purchase units, and reuse `calcVariance`/`classifyVariance`.
  - Append to the same `rows` array; keep the final sort by `|impact|`.
  The ml `ingredientIds` set stays `linesByIngredient ∪ eventsByIngredient` for ml only; produce is a disjoint ingredient set (each/g), so no double-processing.

- [ ] **Step 2b: Regression test** — a fixture/reasoned test (or an existing rolling-variance test) proving an ml-only ingredient's row is unchanged (same theoretical/variance/cost) after this task. If no such test exists, add one for a small ml scenario.

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/variance-rolling-loader.ts tests/unit
git commit -m "feat(pouriq): produce branch in rolling variance (purchase-unit consumption)"
```

---

## Task 3: `VarianceEditor` unit-aware display

**Files:** Modify `src/components/pouriq/VarianceEditor.tsx`.

- [ ] **Step 1** — derive a unit label from `row.base_unit` (`ml` → "ml", `each` → "each", `g` → "g"). Replace the hardcoded "ml" in the quantity/count labels ("Expected used since last count: N {unit}", the variance amount, "Last count: N"). The count input for `each` accepts whole numbers. No layout change; the row already renders quantities + a count input + reason + save. Produce rows render identically in shape, just unit-labeled.

- [ ] **Step 2: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run build`.
```bash
git add src/components/pouriq/VarianceEditor.tsx
git commit -m "feat(pouriq): unit-aware labels in the variance editor"
```

---

## Task 4: Stock on-hand produce branch + `StockManager`

**Files:** Modify `src/lib/pouriq/stock-loader.ts`, `src/components/pouriq/StockManager.tsx`.

- [ ] **Step 1: Loader** — same additive pattern: a produce recipe read (base_unit each/g, use_id) + a produce pass computing on-hand in purchase units (reuse the existing unit-agnostic on-hand/receipt/anchor logic; theoretical usage since anchor via `produceLineUnits`), each row tagged `base_unit`. Do NOT edit the ml path. Append + return.

- [ ] **Step 2: UI** — `StockManager` labels quantities by `row.base_unit`.

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/stock-loader.ts src/components/pouriq/StockManager.tsx
git commit -m "feat(pouriq): produce on the stock on-hand view"
```

---

## Task 5: Variance detail produce branch + detail page

**Files:** Modify `src/lib/pouriq/variance-detail-loader.ts`, `src/app/trade/pouriq/variance/[ingredientId]/page.tsx`.

- [ ] **Step 1: Loader** — `loadVarianceDetail` currently filters `base_unit='ml'`. Add a produce branch: when the target ingredient is `each`/`g` with use-lines, compute the detail (ledger + per-drink breakdown + trend) in purchase units via `produceLineUnits`; the per-drink row shows the use name + per-serve amount (`recipe_qty` of `recipe_unit`). Reuse the unit-agnostic ledger/counts logic. Tag `base_unit`. The ml path is unchanged (an ml ingredient still goes through the ml branch).

- [ ] **Step 2: Page** — the detail page labels the ledger + per-drink amounts by `base_unit`. A produce drink line reads e.g. "Mojito — 25ml juice (0.83 lemon each)".

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/lib/pouriq/variance-detail-loader.ts "src/app/trade/pouriq/variance/[ingredientId]/page.tsx"
git commit -m "feat(pouriq): produce variance detail drill-in"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged; **no migration**.
- [ ] Dispatch a final whole-branch review — STRICTEST that an ml-only tenant's rolling/stock/detail output is byte-for-byte unchanged (the ml paths were never edited), and that produce theoretical = purchase units via yields. Then `superpowers:finishing-a-development-branch` to open the PR. PR body: Piece B of fresh produce, additive (no migration), ml path untouched; the field-naming caveat (`*_ml` holds base-unit qty for produce rows).
