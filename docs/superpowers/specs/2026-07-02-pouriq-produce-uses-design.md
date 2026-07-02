# Pour IQ — Fresh Produce Uses (Piece A: model + cost)

Date: 2026-07-02
Status: Design agreed; ready for implementation plan.

## Goal

Model fresh produce as ONE ingredient (a lemon, bought each) with opt-in **uses** — each carrying a yield (1 lemon → 30ml juice, → 8 wheels…). Recipes reference a use and cost correctly from its yield, so GP is honest, and a suggested-produce library makes setup effortless. The `yield_qty` per use is the shared pivot so **Piece B (stock/variance) plugs in later** without remodelling.

This is Piece A of a two-part feature (see `project_pouriq_menu_gaps_sequence`). **Piece B (fresh-produce stock + variance) is OUT of scope here** but the model is designed for it.

## Data model — migration 0064

- **New table `pouriq_ingredient_uses`:**
  - `id TEXT PRIMARY KEY`
  - `ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE`
  - `name TEXT NOT NULL` (e.g. "Juice", "Wheel")
  - `recipe_unit TEXT NOT NULL` — `'ml' | 'count' | 'g'` (the unit the use is measured in)
  - `yield_qty REAL NOT NULL` — how much ONE purchase unit yields, in `recipe_unit` (juice 30, wheel 8)
  - `position INTEGER NOT NULL DEFAULT 0`
  - `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - Index on `(ingredient_id)`.
- **New column** on `pouriq_ingredients` (the recipe line): `use_id TEXT REFERENCES pouriq_ingredient_uses(id) ON DELETE SET NULL` (nullable; NULL = the ingredient is used directly, as today).
- A use-based recipe line stores its amount in the existing generic `recipe_qty` + `recipe_unit` fields (e.g. 25 / 'ml' for juice, 1 / 'count' for a wheel); `pour_ml`/`unit_count` stay null. So use-based lines are naturally excluded from the ml-based variance engine (correct — produce stock is Piece B).

## Types

- `IngredientUseRow { id; ingredient_id; name; recipe_unit: 'ml'|'count'|'g'; yield_qty; position; created_at }`.
- The recipe-line row + `IngredientWithLibrary` gain `use_id: string | null` and (when resolved) `use: IngredientUseRow | null`. `listCocktailsForMenu`/`getCocktail` join the use.
- `replaceIngredients` input + `saveCocktailAction`'s ingredient shape gain `use_id: string | null`.

## Cost (pure)

Produce ingredients keep `yield_pct = 100` (the per-use `yield_qty` captures yield; don't double-count). Cost per purchase unit = `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct)` (for base_unit `each`/`g` this is cost per lemon / per g).

New helper in `calculations.ts`:
```ts
export function useLineCostP(costPerPurchaseUnitP: number, yieldQty: number, amount: number): number {
  if (yieldQty <= 0) return 0
  return Math.round((costPerPurchaseUnitP / yieldQty) * amount)
}
```
Extend `ingredientCostPence`: when the line has a resolved `use`, cost = `useLineCostP(usableCostPerBaseUnitP(lib...), line.use.yield_qty, line.recipe_qty ?? 0)`. Otherwise the existing path (unchanged). Unit-tested (juice 25ml from a 30p/30ml-yield lemon → 25p; 1 wheel from 8/lemon → 4p; yield 0 → 0).

## Suggested-produce library

`src/lib/pouriq/produce-library.ts` — a static curated set (~12 common bar produce):
```ts
export interface ProduceTemplate { name: string; base_unit: 'each' | 'g'; uses: { name: string; recipe_unit: 'ml'|'count'|'g'; yield_qty: number }[] }
export const PRODUCE_LIBRARY: ProduceTemplate[] = [ /* lemon, lime, orange, grapefruit, mint, cucumber, ginger, ... */ ]
```
Lemon → Juice 30ml, Wheel 8, Wedge 6, Twist 4. Lime → Juice 25ml, Wheel 8, Wedge 8. Orange → Juice 70ml, Wheel 6, Twist 5. Mint (bunch) → Sprig 12, Leaves 40. Cucumber → Slices 20, Ribbons 12. Etc. Pure data, snapshot-tested for shape. Venues can accept/tweak/add.

## UI

- **Ingredient form** (`IngredientForm`): a "Uses" section (surfaced for `each`/`g` ingredients) listing the ingredient's uses with an add-use control (name + unit + yield), plus suggested-yield chips when the ingredient name matches a `PRODUCE_LIBRARY` template. Remove-use. A small live cost-per-use readout.
- **Fresh-produce quick add:** when creating an ingredient, a "from produce library" picker that prefills base_unit + uses from a `ProduceTemplate`.
- **Recipe ingredient row** (`CocktailForm`): when the chosen library ingredient has uses, show a **use dropdown** (Juice / Wheel / …) + an amount input in that use's unit; the line saves `use_id` + `recipe_qty` + `recipe_unit`. Ingredients without uses behave exactly as today.

## Server actions

Tenant-scoped (via the ingredient's `trade_account_id`), `revalidatePath` the library/menu paths:
- `saveIngredientUsesAction(ingredientId, uses[])` — replace the ingredient's uses (create/update/delete as a set), or discrete create/delete — implementer's choice, keep it simple.
- `saveCocktailAction` extended to persist `use_id` per line (via `replaceIngredients`).

## Scope

- **IN:** the uses table + recipe-line `use_id`, use-aware costing, the produce library, the uses-management UI, the recipe-row use picker.
- **OUT (Piece B / later):** all fresh-produce stock + variance; spoilage/waste curves; auto-detecting produce from invoices; splitting one physical lemon's cost across simultaneous uses beyond the per-use yield.

## Testing

- **Unit (pure):** `useLineCostP` (juice, count, yield 0 guard, rounding); the extended `ingredientCostPence` use path vs the direct path; `PRODUCE_LIBRARY` shape (every use has a positive yield_qty and a valid recipe_unit).
- **Migration 0064:** node:sqlite — table created, `use_id` column added, FK/cascade behaviour (deleting an ingredient removes its uses; deleting a use nulls the recipe line's `use_id`).
- **Flow-through:** `tsc` forces `use_id`/`use` through the recipe-line reads (`menus.ts` join) + `replaceIngredients` + `saveCocktailAction`; fix fixtures.
- Reasoned: the uses UI, the recipe-row picker, the server actions.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; no new npm dependencies.

## Risks / notes

- **Don't double-count yield:** produce `yield_pct` stays 100; the per-use `yield_qty` is the only yield in play for a use. Note this in the produce quick-add (it sets yield_pct 100).
- Use-based lines carry no `pour_ml`, so they're invisible to the current ml variance engine — intended; produce variance is Piece B.
- This touches the recipe editor (`CocktailForm`) and the cost path — verify existing non-use recipes are completely unchanged (regression risk). The use dropdown only appears when the ingredient has uses.
- Migration **0064** (0063 = ABV, in main). Apply to prod after merge.
- Keep the model minimal so Piece B (consumption = `amount ÷ yield_qty` in purchase units) needs no schema change — it reads the same `yield_qty`.
