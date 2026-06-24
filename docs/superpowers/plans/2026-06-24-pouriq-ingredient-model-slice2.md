# Ingredient Model Slice 2 (recipe units) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Express recipe lines in natural serve units (wedge, wheel, dash, bean, g, ml) that convert to the ingredient's base unit, while cost/variance/stock keep using the exact base amount. Serve units are defined once per ingredient (reusable) plus a standard global set by dimension. Unlocks gram ingredients in recipes. Coffee-bean garnish is the canonical test.

**Architecture:** Additive only (no table rebuild). New `pouriq_ingredient_serve_units` table; recipe lines (`pouriq_ingredients`) gain `recipe_unit` + `recipe_qty` for display/entry while `pour_ml`/`unit_count` remain the cost source of truth (`base_amount = recipe_qty × base_per_unit`, computed at entry). Pure conversion helpers; serve-unit CRUD on the ingredient form; a unit picker in recipe entry; spec-card display by unit.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-24-pouriq-ingredient-model-slice2-design.md`.

**Branch:** `feat/pouriq-ingredient-model-slice2` (off `main`, which has Slice 1). Next migration number: **0044**.

**Model recap (Slice 1):** `IngredientLibraryRow` has `base_unit` ('ml'|'g'|'each'), `pack_size`, `price_p`, `purchase_qty`, `yield_pct`. `ingredientCostPence` uses `amount = base_unit==='each' ? unit_count : pour_ml`. Recipe line = `pouriq_ingredients(cocktail_id, library_ingredient_id, pour_ml, unit_count)`; `replaceIngredients` in `menus.ts`.

**Safety:** each task ends with `npx tsc --noEmit` clean + `npm run test:unit` green (and `npm run build` from the UI tasks on). Cost/variance/stock code is NOT changed (it reads the base amount, which entry keeps populating).

---

### Task 1: Migration 0044 — serve-units table + recipe-line columns + backfill

**Files:** Create `migrations/0044_recipe_units.sql`; Test `tests/unit/lib/pouriq-recipe-units-migration.test.ts`

- [ ] **Step 1: Write the migration**
```sql
-- Slice 2: recipe units. Per-ingredient serve units + recipe lines expressed in
-- a unit + qty (display/entry) while pour_ml/unit_count remain the base amount.
CREATE TABLE pouriq_ingredient_serve_units (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_per_unit REAL NOT NULL CHECK (base_per_unit > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_serve_units_ingredient ON pouriq_ingredient_serve_units (library_ingredient_id);
CREATE UNIQUE INDEX uniq_serve_unit_name ON pouriq_ingredient_serve_units (library_ingredient_id, name);

ALTER TABLE pouriq_ingredients ADD COLUMN recipe_unit TEXT;
ALTER TABLE pouriq_ingredients ADD COLUMN recipe_qty REAL;

-- Backfill existing lines so spec cards keep rendering: qty = the base amount,
-- unit = 'item' for unit-priced lines else the ingredient's base unit.
UPDATE pouriq_ingredients
SET recipe_qty = COALESCE(pour_ml, unit_count),
    recipe_unit = CASE
      WHEN unit_count IS NOT NULL THEN 'item'
      ELSE (SELECT base_unit FROM pouriq_ingredients_library lib WHERE lib.id = pouriq_ingredients.library_ingredient_id)
    END
WHERE recipe_unit IS NULL;
```

- [ ] **Step 2: Validate + backfill test** in `tests/unit/lib/pouriq-recipe-units-migration.test.ts` (in-memory `node:sqlite`): create minimal `pouriq_ingredients_library` (id, base_unit) + `pouriq_ingredients` (cocktail_id, library_ingredient_id, pour_ml, unit_count) old shape; insert a lib ml row + an each row; insert an ingredient line with pour_ml=50 (→ ml lib) and one with unit_count=0.125 (→ each lib); run the migration (strip nothing — no PRAGMA); assert: the ml line → recipe_unit='ml', recipe_qty=50; the each line → recipe_unit='item', recipe_qty=0.125; serve-units table exists.

- [ ] **Step 3: Commit**
```bash
git add migrations/0044_recipe_units.sql tests/unit/lib/pouriq-recipe-units-migration.test.ts
git commit -m "feat(pouriq): recipe-unit columns + serve-units table (0044)"
```
Do NOT apply to the local D1 yet (apply in Task 9 verification).

---

### Task 2: Conversion helpers (TDD) + types

**Files:** Modify `src/lib/pouriq/measures.ts`, `src/lib/pouriq/types.ts`; Test `tests/unit/lib/pouriq-serve-units.test.ts`

- [ ] **Step 1: Failing test** `tests/unit/lib/pouriq-serve-units.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { STANDARD_SERVE_UNITS, serveUnitsFor, recipeBaseAmount } from '@/lib/pouriq/measures'

describe('STANDARD_SERVE_UNITS', () => {
  it('has dash=0.6ml and barspoon=5ml for ml base', () => {
    const ml = STANDARD_SERVE_UNITS.ml
    expect(ml.find(u => u.name === 'dash')?.base_per_unit).toBe(0.6)
    expect(ml.find(u => u.name === 'barspoon')?.base_per_unit).toBe(5)
    expect(ml.find(u => u.name === 'ml')?.base_per_unit).toBe(1)
  })
  it('has g=1 for g base and item=1 for each base', () => {
    expect(STANDARD_SERVE_UNITS.g.find(u => u.name === 'g')?.base_per_unit).toBe(1)
    expect(STANDARD_SERVE_UNITS.each.find(u => u.name === 'item')?.base_per_unit).toBe(1)
  })
})

describe('serveUnitsFor', () => {
  it('merges standard units for the base dimension with custom units', () => {
    const list = serveUnitsFor('each', [{ name: 'wedge', base_per_unit: 1 / 6 }])
    expect(list.find(u => u.name === 'item')).toBeTruthy()
    expect(list.find(u => u.name === 'wedge')?.base_per_unit).toBeCloseTo(0.1667, 3)
  })
  it('lets a custom unit override a standard one of the same name', () => {
    const list = serveUnitsFor('ml', [{ name: 'dash', base_per_unit: 0.9 }])
    expect(list.find(u => u.name === 'dash')?.base_per_unit).toBe(0.9)
  })
})

describe('recipeBaseAmount', () => {
  it('multiplies qty by the per-unit conversion', () => {
    expect(recipeBaseAmount(3, 0.2)).toBeCloseTo(0.6, 6) // 3 coffee beans @ 0.2g
    expect(recipeBaseAmount(2, 1 / 6)).toBeCloseTo(0.3333, 4) // 2 lime wedges
    expect(recipeBaseAmount(2, 0.6)).toBeCloseTo(1.2, 6) // 2 dashes
  })
})
```

- [ ] **Step 2:** Run (FAIL), then implement in `measures.ts`:
```ts
export type BaseUnit = 'ml' | 'g' | 'each'
export interface ServeUnit { name: string; base_per_unit: number }

// Standard serve units available for any ingredient of the matching base unit,
// with no per-ingredient setup. base_per_unit is in that base unit.
export const STANDARD_SERVE_UNITS: Record<BaseUnit, ServeUnit[]> = {
  ml: [
    { name: 'ml', base_per_unit: 1 },
    { name: 'dash', base_per_unit: 0.6 },
    { name: 'barspoon', base_per_unit: 5 },
    { name: 'tsp', base_per_unit: 5 },
  ],
  g: [
    { name: 'g', base_per_unit: 1 },
    { name: 'pinch', base_per_unit: 0.3 },
  ],
  each: [{ name: 'item', base_per_unit: 1 }],
}

// Standard units for the base dimension + the ingredient's custom units.
// A custom unit overrides a standard one of the same name.
export function serveUnitsFor(baseUnit: BaseUnit, custom: ServeUnit[]): ServeUnit[] {
  const byName = new Map<string, ServeUnit>()
  for (const u of STANDARD_SERVE_UNITS[baseUnit]) byName.set(u.name, u)
  for (const u of custom) byName.set(u.name, u)
  return [...byName.values()]
}

// The base-unit amount stored on the recipe line (in pour_ml for ml/g, unit_count for each).
export function recipeBaseAmount(recipe_qty: number, base_per_unit: number): number {
  return recipe_qty * base_per_unit
}
```

- [ ] **Step 3: Types** in `types.ts`: add
```ts
export interface ServeUnitRow {
  id: string
  library_ingredient_id: string
  name: string
  base_per_unit: number
  created_at: string
}
```
and add `recipe_unit: string | null`, `recipe_qty: number | null` to the recipe-line/`IngredientWithLibrary` ingredient row interfaces (alongside `pour_ml`/`unit_count`). Update any test fixtures that build those rows (add `recipe_unit: null, recipe_qty: null` or real values).

- [ ] **Step 4:** Run tests (PASS), `npx tsc --noEmit` clean. Commit:
```bash
git add src/lib/pouriq/measures.ts src/lib/pouriq/types.ts tests/
git commit -m "feat(pouriq): serve-unit conversion helpers + types"
```

---

### Task 3: Serve-units data access + server actions

**Files:** Create `src/lib/pouriq/serve-units.ts` (or add to `ingredient-library.ts`); Modify `src/lib/pouriq/server-actions.ts`

- [ ] **Step 1:** Data access (tenant-guarded via the library ingredient's ownership):
  - `listServeUnits(db, libraryIngredientId): Promise<ServeUnitRow[]>` (by ingredient).
  - `listServeUnitsForTenant(db, tradeAccountId): Promise<Map<string, ServeUnitRow[]>>` (all the tenant's serve units grouped by ingredient — for recipe-entry/spec rendering, one query).
- [ ] **Step 2:** Server actions in `server-actions.ts`, each verifying the ingredient belongs to the tenant (`SELECT 1 FROM pouriq_ingredients_library WHERE id=?1 AND trade_account_id=?2`):
  - `saveServeUnitAction(libraryIngredientId, name, base_per_unit)` — upsert (`ON CONFLICT(library_ingredient_id, name) DO UPDATE SET base_per_unit=excluded.base_per_unit`). Validate name non-empty, base_per_unit > 0. `revalidatePath('/trade/pouriq/library')` and the ingredient edit path.
  - `deleteServeUnitAction(serveUnitId)` — delete, ownership-checked via a join to the library ingredient.
- [ ] **Step 3:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): serve-unit data access + CRUD actions`.

---

### Task 4: replaceIngredients + recipe-save path carry unit/qty

**Files:** Modify `src/lib/pouriq/menus.ts` (`replaceIngredients` + the cocktail/ingredient row SELECTs/mappers), `src/lib/pouriq/server-actions.ts` (`saveCocktailAction`/`saveServeAction` ingredient input).

- [ ] **Step 1:** Extend the recipe-ingredient input shape (used by `replaceIngredients` and the save actions) to include `recipe_unit: string | null` and `recipe_qty: number | null` alongside `pour_ml`/`unit_count`. `replaceIngredients` INSERT writes all four columns. The cocktail-row SELECTs/mappers (menus.ts ~lines 170, 268) select + map `recipe_unit`, `recipe_qty`.
- [ ] **Step 2:** `tsc` clean; `npm run test:unit` green; `npm run build`. Commit `feat(pouriq): persist recipe_unit/recipe_qty on recipe lines`.

---

### Task 5: Ingredient form — "Serve units" section

**Files:** Modify `src/components/pouriq/IngredientForm.tsx`; load serve units into its data.

- [ ] **Step 1:** Add a "Serve units" section to the ingredient edit form (near the Advanced costing disclosure). It lists the ingredient's custom serve units and allows add/edit/delete via `saveServeUnitAction`/`deleteServeUnitAction` (use `useTransition` + `router.refresh()`; shared error). Entry UX by base unit:
  - **count (each)**: "[N] [unit name] per item" → store `base_per_unit = 1 / N` (e.g. 6 wedges per lime → 1/6). 
  - **weight (g)**: "1 [unit name] = [X] g" → `base_per_unit = X` (e.g. bean = 0.2).
  - **volume (ml)**: "1 [unit name] = [X] ml" → `base_per_unit = X`.
  Show the standard units for the base dimension as read-only chips ("ml, dash, barspoon, tsp always available") so the user knows they exist. Persistent helper text per field.
  - The new-ingredient (create) form can defer serve units until after first save (needs an id); show "save the ingredient first to add custom serve units" on create, full section on edit. (Or save units after the ingredient insert returns an id — simpler to gate on edit.)
- [ ] **Step 2:** The page that renders `IngredientForm` for edit (`/trade/pouriq/library/[id]/edit`) loads `listServeUnits` and passes them in. Confirm the route exists and wire it.
- [ ] **Step 3:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): define custom serve units on the ingredient`.

---

### Task 6: Recipe entry — unit picker

**Files:** Modify `src/components/pouriq/CocktailForm.tsx`, `src/components/pouriq/ServeForm.tsx`, `src/components/pouriq/IngredientMatchRow.tsx`; the pages that render them load tenant serve units.

- [ ] **Step 1:** Replace the current pour/unit chips (and the Slice-1 `PortionHelper`) with a **unit picker**: when an ingredient is selected, offer `serveUnitsFor(ingredient.base_unit, customUnitsForThatIngredient)` as a dropdown/segmented control + a `recipe_qty` number input. On change, compute `base = recipeBaseAmount(qty, selectedUnit.base_per_unit)`; set `pour_ml = base, unit_count = null` for ml/g base, or `unit_count = base, pour_ml = null` for each base; and carry `recipe_unit = selectedUnit.name`, `recipe_qty = qty` into the save payload (Task 4 shape). Show a live per-serve cost readout using `ingredientCostPence`-equivalent (or `usableCostPerBaseUnitP × base`).
  - The customer (per-ingredient) serve units come from the tenant serve-units map loaded by the page; pass it to these components.
  - Remove `PortionHelper` (its job is now the unit picker) OR keep it only if it still adds value; prefer removal to avoid two ways to do the same thing.
- [ ] **Step 2:** The pages rendering CocktailForm/ServeForm/IngredientMatchRow (the menu edit page, serves page, import page) load `listServeUnitsForTenant` and pass the map down.
- [ ] **Step 3:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): recipe entry by serve unit + qty`.

---

### Task 7: Spec card + displays render the unit

**Files:** Modify `src/components/pouriq/SpecCard.tsx` (`formatMeasure`), `IngredientList.tsx` if it shows measures, `menu-copy.ts`, any other measure display.

- [ ] **Step 1:** `formatMeasure` (SpecCard) renders `{recipe_qty} {recipe_unit}` with pluralisation (`1 dash`, `2 dashes`, `3 beans`, `50 ml`, `1 wedge`, `2 wedges`). `ml`/`g` show as `50 ml` / `5 g` (no pluralise); count-style units pluralise (`bean`→`beans`, `wedge`→`wedges`, `item`→`items`; show the ingredient context where helpful). Fall back to the base amount (`pour_ml`ml / `unit_count`) when `recipe_unit` is null. A small shared `formatServeMeasure(recipe_unit, recipe_qty, pour_ml, unit_count)` helper (pure, testable) is ideal.
- [ ] **Step 2:** Add a unit test for `formatServeMeasure` (dash/beans/ml/wedge/null-fallback). `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): spec card + displays show the serve unit`.

---

### Task 8: Import recipe lines default a unit

**Files:** Modify `src/components/pouriq/IngredientMatchRow.tsx` / `ImportPreview.tsx` / `import/commit` route as needed.

- [ ] **Step 1:** An imported recipe line sets `recipe_unit` to the matched ingredient's base unit (or a parsed unit when the menu states one, e.g. "dash"/"barspoon" recognised by the measurement parser → that standard unit), and `recipe_qty` to the parsed amount; `base_amount` computed via `recipeBaseAmount`. Confirm the commit writes `recipe_unit`/`recipe_qty` (Task 4 shape).
- [ ] **Step 2:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): imported recipe lines carry a serve unit`.

---

### Task 9: Verification + finish

- [ ] **Step 1:** `npm run test:unit`, `npm run build`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build` — all green.
- [ ] **Step 2:** Apply `0044` to the LOCAL D1 and smoke: define a custom unit (coffee → bean = 0.2 g; lime → 6 wedges per item), build a cocktail using "3 beans" and "1 wedge", confirm the spec card shows them and the cost is right; confirm an existing cocktail still renders (backfilled units) and re-costs identically.
- [ ] **Step 3:** `superpowers:finishing-a-development-branch` → PR. PR body: **apply migration 0044 to prod after merge**; note cost/variance/stock unchanged (base amount is the source of truth); Slice 2 of 3 (prepared recipes = Slice 3); cross-dimension (lime→ml juice) deferred.

---

## Notes / risks
- **Additive migration** (no rebuild) — lower risk than Slice 1. Backfill keeps existing spec cards rendering.
- **Cost/variance/stock untouched** — they read `pour_ml`/`unit_count` (base amount), which the entry path keeps populating. `recipe_unit`/`recipe_qty` are display + re-edit only.
- **`pour_ml` holds grams** for g-base recipe lines (legacy column name). Accepted; future rename to `base_amount` out of scope.
- **Out of scope:** cross-dimension yields (count→volume), prepared recipes (Slice 3), the `pour_ml` rename.
