# Pour IQ Fresh-Produce Uses (Piece A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One fresh-produce ingredient with opt-in "uses" (each a yield); recipes reference a use and cost from its yield; a suggested-produce library for effortless setup. (Piece A: model + cost. Stock/variance = Piece B, later.)

**Architecture:** A `pouriq_ingredient_uses` table + `use_id` on the recipe line + a use-aware cost path + a static produce library + UI. `yield_qty` is the pivot Piece B will reuse. Migration 0064. No new dependencies.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-pouriq-produce-uses-design.md`
**Branch:** `feat/pouriq-produce-uses` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes. Pure helpers: no server imports.

**Verified facts:**
- `replaceIngredients` (`menus.ts:429`) inserts `pouriq_ingredients (cocktail_id, library_ingredient_id, pour_ml, unit_count, recipe_unit, recipe_qty)`.
- `ingredientCostPence` (`calculations.ts:91`): `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct) × amount` (amount = unit_count for `each`, else pour_ml). `ingredientCostComplete` (`calculations.ts:85`) checks `base_unit==='each' ? unit_count!=null : pour_ml!=null`.
- `menus.ts` `listCocktailsForMenu`/`getCocktail` build `IngredientWithLibrary` field-by-field from a join; `saveCocktailAction` (`server-actions.ts`) calls `replaceIngredients`.
- `IngredientWithLibrary` in `types.ts` (~line 150): `{ id, cocktail_id, library_ingredient_id, pour_ml, unit_count, recipe_unit, recipe_qty, library }`.

---

## Task 1: Migration 0064 + types + `useLineCostP`

**Files:** Create `migrations/0064_ingredient_uses.sql`; modify `src/lib/pouriq/types.ts`, `src/lib/pouriq/calculations.ts`; create `tests/unit/lib/pouriq-use-cost.test.ts`.

- [ ] **Step 1: Migration** (latest is `0063_abv.sql`)
```sql
CREATE TABLE pouriq_ingredient_uses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  recipe_unit TEXT NOT NULL,
  yield_qty REAL NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_ingredient_uses_ingredient ON pouriq_ingredient_uses(ingredient_id);
ALTER TABLE pouriq_ingredients ADD COLUMN use_id TEXT REFERENCES pouriq_ingredient_uses(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Types** — add:
```ts
export interface IngredientUseRow {
  id: string
  ingredient_id: string
  name: string
  recipe_unit: 'ml' | 'count' | 'g'
  yield_qty: number
  position: number
  created_at: string
}
```
Add to `IngredientWithLibrary`: `use_id: string | null`, `use: IngredientUseRow | null`.

- [ ] **Step 3: Failing test** (`pouriq-use-cost.test.ts`)
```ts
import { useLineCostP } from '@/lib/pouriq/calculations'
it('costs a use from its yield', () => {
  expect(useLineCostP(30, 30, 25)).toBe(25)   // 30p/lemon, 30ml/lemon, 25ml -> 25p
  expect(useLineCostP(30, 8, 1)).toBe(4)       // 30p/lemon, 8 wheels, 1 wheel -> 3.75 -> 4p
})
it('guards a zero/negative yield', () => {
  expect(useLineCostP(30, 0, 25)).toBe(0)
})
```

- [ ] **Step 4: Implement** `useLineCostP` in `calculations.ts`:
```ts
export function useLineCostP(costPerPurchaseUnitP: number, yieldQty: number, amount: number): number {
  if (yieldQty <= 0) return 0
  return Math.round((costPerPurchaseUnitP / yieldQty) * amount)
}
```

- [ ] **Step 5: node:sqlite migration validation** (scratch, not committed): table created; `use_id` added to `pouriq_ingredients`; deleting an ingredient cascades its uses; deleting a use sets a referencing line's `use_id` to NULL. Print PASS.

- [ ] **Step 6: Green + commit**
```bash
git add migrations/0064_ingredient_uses.sql src/lib/pouriq/types.ts src/lib/pouriq/calculations.ts tests/unit
git commit -m "feat(pouriq): migration 0064 + ingredient uses type + useLineCostP"
```

---

## Task 2: Produce library

**Files:** Create `src/lib/pouriq/produce-library.ts`, `tests/unit/lib/pouriq-produce-library.test.ts`.

- [ ] **Step 1: Implement** `produce-library.ts`
```ts
export interface ProduceTemplate {
  name: string
  base_unit: 'each' | 'g'
  uses: { name: string; recipe_unit: 'ml' | 'count' | 'g'; yield_qty: number }[]
}
export const PRODUCE_LIBRARY: ProduceTemplate[] = [
  { name: 'Lemon', base_unit: 'each', uses: [ { name: 'Juice', recipe_unit: 'ml', yield_qty: 30 }, { name: 'Wheel', recipe_unit: 'count', yield_qty: 8 }, { name: 'Wedge', recipe_unit: 'count', yield_qty: 6 }, { name: 'Twist', recipe_unit: 'count', yield_qty: 4 } ] },
  { name: 'Lime', base_unit: 'each', uses: [ { name: 'Juice', recipe_unit: 'ml', yield_qty: 25 }, { name: 'Wheel', recipe_unit: 'count', yield_qty: 8 }, { name: 'Wedge', recipe_unit: 'count', yield_qty: 8 } ] },
  { name: 'Orange', base_unit: 'each', uses: [ { name: 'Juice', recipe_unit: 'ml', yield_qty: 70 }, { name: 'Wheel', recipe_unit: 'count', yield_qty: 6 }, { name: 'Twist', recipe_unit: 'count', yield_qty: 5 } ] },
  { name: 'Grapefruit', base_unit: 'each', uses: [ { name: 'Juice', recipe_unit: 'ml', yield_qty: 120 }, { name: 'Wheel', recipe_unit: 'count', yield_qty: 8 }, { name: 'Twist', recipe_unit: 'count', yield_qty: 6 } ] },
  { name: 'Mint', base_unit: 'each', uses: [ { name: 'Sprig', recipe_unit: 'count', yield_qty: 12 }, { name: 'Leaves', recipe_unit: 'count', yield_qty: 40 } ] },
  { name: 'Basil', base_unit: 'each', uses: [ { name: 'Sprig', recipe_unit: 'count', yield_qty: 8 }, { name: 'Leaves', recipe_unit: 'count', yield_qty: 30 } ] },
  { name: 'Cucumber', base_unit: 'each', uses: [ { name: 'Slice', recipe_unit: 'count', yield_qty: 20 }, { name: 'Ribbon', recipe_unit: 'count', yield_qty: 12 }, { name: 'Wedge', recipe_unit: 'count', yield_qty: 8 } ] },
  { name: 'Strawberry', base_unit: 'each', uses: [ { name: 'Slice', recipe_unit: 'count', yield_qty: 4 }, { name: 'Half', recipe_unit: 'count', yield_qty: 2 } ] },
  { name: 'Apple', base_unit: 'each', uses: [ { name: 'Slice', recipe_unit: 'count', yield_qty: 8 }, { name: 'Fan', recipe_unit: 'count', yield_qty: 4 } ] },
  { name: 'Pineapple', base_unit: 'each', uses: [ { name: 'Wedge', recipe_unit: 'count', yield_qty: 16 }, { name: 'Leaf', recipe_unit: 'count', yield_qty: 10 } ] },
]
```

- [ ] **Step 2: Shape test** — every template has ≥1 use; every use has `yield_qty > 0` and `recipe_unit` in `['ml','count','g']`; names unique. Run green.

- [ ] **Step 3: Commit**
```bash
git add src/lib/pouriq/produce-library.ts tests/unit
git commit -m "feat(pouriq): suggested produce library (yields for common bar produce)"
```

---

## Task 3: Use-aware costing

**Files:** Modify `src/lib/pouriq/calculations.ts`; extend `tests/unit/lib/pouriq-use-cost.test.ts`.

- [ ] **Step 1: Failing tests** — a use-based `IngredientWithLibrary` (base_unit 'each', price giving 30p/each, `use.yield_qty=30`, `recipe_qty=25`) → `ingredientCostPence` = 25; a wheel (`yield_qty=8`, `recipe_qty=1`) → 4; `ingredientCostComplete` true for a use line with `recipe_qty != null`, false when null; a non-use line is unchanged.

- [ ] **Step 2: Implement** — extend `ingredientCostPence`:
```ts
export function ingredientCostPence(i: import('./types').IngredientWithLibrary): number {
  const lib = i.library
  const perPurchaseUnitP = usableCostPerBaseUnitP(lib.price_p, lib.purchase_qty, lib.pack_size, lib.yield_pct)
  if (i.use) return useLineCostP(perPurchaseUnitP, i.use.yield_qty, i.recipe_qty ?? 0)
  const amount = lib.base_unit === 'each' ? (i.unit_count ?? 0) : (i.pour_ml ?? 0)
  return Math.round(perPurchaseUnitP * amount)
}
```
Extend `ingredientCostComplete`: `if (i.use) return i.recipe_qty != null` (and the ingredient is priced — mirror existing) before the base_unit check.

- [ ] **Step 3: Green + commit**
```bash
git add src/lib/pouriq/calculations.ts tests/unit
git commit -m "feat(pouriq): cost recipe lines by ingredient use + yield"
```

---

## Task 4: Persistence flow-through

**Files:** Modify `src/lib/pouriq/menus.ts` (uses CRUD + recipe-line `use_id` + join), `src/lib/pouriq/server-actions.ts` (`saveIngredientUsesAction` + `saveCocktailAction`); fix fixtures.

- [ ] **Step 1: Uses data layer** (`menus.ts` or a new `ingredient-uses.ts` — prefer a focused new file `src/lib/pouriq/ingredient-uses.ts`): `listIngredientUses(db, ingredientId)`, `replaceIngredientUses(db, ingredientId, uses[])` (delete-all + insert the set, positioned), each returning/using `IngredientUseRow`.

- [ ] **Step 2: Recipe line `use_id`** — `replaceIngredients` input gains `use_id: string | null`; add it to the INSERT column list + bind. In `menus.ts` `listCocktailsForMenu` + `getCocktail`, LEFT JOIN `pouriq_ingredient_uses u ON u.id = i.use_id`, select `i.use_id` + the `u.*` (aliased `u_id`, `u_name`, `u_recipe_unit`, `u_yield_qty`, `u_position`), and map onto `use_id` + `use` (null when no `use_id`).

- [ ] **Step 3: Server actions** — `saveIngredientUsesAction(ingredientId, uses)` in `server-actions.ts`: tenant-check the ingredient (`getLibraryEntry`), call `replaceIngredientUses`, `revalidatePath` the library paths. Extend `saveCocktailAction`'s `CocktailInput.ingredients` shape + the `replaceIngredients` call to carry `use_id`.

- [ ] **Step 4: Fixtures** — `npx tsc --noEmit`; add `use_id: null, use: null` to test fixtures building `IngredientWithLibrary` literals.

- [ ] **Step 5: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/ingredient-uses.ts src/lib/pouriq/menus.ts src/lib/pouriq/server-actions.ts tests/unit
git commit -m "feat(pouriq): persist ingredient uses + recipe-line use_id"
```

---

## Task 5: Uses-management UI (ingredient form)

**Files:** Modify `src/components/pouriq/IngredientForm.tsx` (optionally add `src/components/pouriq/IngredientUsesEditor.tsx`).

- [ ] **Step 1** — When editing an existing ingredient whose `base_unit` is `each` or `g`, render a "Uses" section: the ingredient's current uses (name · unit · yield · live cost-per-use = `useLineCostP(perPurchaseUnitP, yield, 1)`), an add-use control (name + unit select ml/count/g + yield number), remove-use, saved via `saveIngredientUsesAction`. When the ingredient name matches a `PRODUCE_LIBRARY` template, offer its uses as one-click suggested-yield chips.
- [ ] **Step 2** — In the new-ingredient path, a "from produce library" picker: choosing a `ProduceTemplate` prefills `name` + `base_unit` + queues its uses (created after first save; produce sets `yield_pct = 100`).
- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run build`.
```bash
git add src/components/pouriq/IngredientForm.tsx src/components/pouriq/IngredientUsesEditor.tsx
git commit -m "feat(pouriq): manage ingredient uses on the ingredient form"
```

---

## Task 6: Recipe-row use picker

**Files:** Modify `src/components/pouriq/CocktailForm.tsx`.

- [ ] **Step 1** — In each recipe ingredient row, when the chosen library ingredient has uses (fetched/available), show a **use dropdown** (its uses by name) + an amount input labelled in the selected use's unit. The row saves `use_id` + `recipe_qty` (the amount) + `recipe_unit` (the use's unit); `pour_ml`/`unit_count` stay null for use lines. Ingredients WITHOUT uses render exactly as today (no dropdown, unchanged behaviour). A small per-line cost preview uses `ingredientCostPence`.
- [ ] **Step 2: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/components/pouriq/CocktailForm.tsx
git commit -m "feat(pouriq): pick an ingredient use on recipe rows"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review (strictest that existing non-use recipes are unchanged, and the use cost path is right), then `superpowers:finishing-a-development-branch` to open the PR. PR body: Piece A of fresh-produce; **migration 0064 to apply after merge**; Piece B (stock/variance) to follow; no deps.
