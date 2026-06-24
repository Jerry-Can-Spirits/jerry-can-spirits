# Pour IQ — Ingredient model redesign, Slice 2: recipe units

**Date:** 2026-06-24
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** [[pouriq-ingredient-model-redesign]]. Slice 1 unified the *purchase* side (base_unit ml/g/each). Slice 2 unifies the *recipe usage* side: a recipe line is expressed in a natural **serve unit** (wedge, wheel, dash, bean, sprig, ml, g) that converts to the ingredient's base unit. The coffee-bean garnish (bean ≈ 0.2 g on a weight ingredient) is the canonical test. Also unlocks gram ingredients in cocktail recipes.

**Depends on:** Slice 1 (#803) merged. Build branch rebases onto main after #803 lands.

## Goal
Let a recipe say "3 beans", "1 wedge", "2 dashes", "50 ml", "1/2 lime" naturally, while cost/variance/stock keep using the exact base amount. Serve-unit conversions are defined once on the ingredient (reusable) plus a standard global set by dimension.

## Locked decisions
- **Conversions defined ON the ingredient** (reusable serve units), plus standard global units by base dimension.
- **Full slice**: standard units + per-ingredient custom units + grams in recipes + spec-card display + coffee-bean.
- **Recipe line keeps the base amount as the cost source of truth** (`pour_ml` for ml/g, `unit_count` for each — unchanged from Slice 1) and ADDS `recipe_unit` + `recipe_qty` for display/entry. Conversion at entry.
- **Cross-dimension deferred** (a count item used as a volume, e.g. lime → 15 ml juice). Handle via a separate juice ingredient or a Slice 3 prepared recipe.

## The conversion model
`base_amount = recipe_qty × base_per_unit(unit)`, where `base_per_unit` is in the ingredient's base unit (ml, g, or each):
- **Standard units** (global constants by base dimension; no per-ingredient setup):
  - volume (base ml): `ml`=1, `dash`=0.6, `barspoon`=5, `tsp`=5 (reuse the values in `measures.ts`).
  - weight (base g): `g`=1, `pinch`=0.3.
  - count (base each): `item`=1 (the whole item; label can show the ingredient name, e.g. "1 lime").
- **Per-ingredient custom units** (`pouriq_ingredient_serve_units`): the ingredient adds named units with a `base_per_unit` in its base unit:
  - Count item (each base): lime → `wedge`=1/6 (0.1667), `wheel`=1/8 (0.125). (Entered as "N per item" → base_per_unit = 1/N.)
  - Weight item (g base): coffee → `bean`=0.2 g. (Entered as "1 unit = X g".)
  - Volume item (ml base): custom volume units rare; standard units cover most.
The effective unit list offered for an ingredient = standard units for its base dimension + its custom serve units.

Examples (all same-dimension; cross-dimension deferred):
- coffee beans (g base): "3 beans" → base_amount(g) = 3 × 0.2 = 0.6 g; cost = 0.6 × cost/g.
- lime (each base): "2 wedges" → unit_count = 2 × (1/6) = 0.333; cost = 0.333 × cost/each.
- bitters (ml base): "2 dashes" → pour_ml = 2 × 0.6 = 1.2 ml.
- vodka (ml base): "50 ml" → pour_ml = 50.

## Data model (migration `00NN`)
1. New table:
```sql
CREATE TABLE pouriq_ingredient_serve_units (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  name TEXT NOT NULL,            -- 'wedge', 'wheel', 'bean', 'sprig', ...
  base_per_unit REAL NOT NULL,   -- in the ingredient's base unit (ml/g/each)
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_serve_units_ingredient ON pouriq_ingredient_serve_units (library_ingredient_id);
CREATE UNIQUE INDEX uniq_serve_unit_name ON pouriq_ingredient_serve_units (library_ingredient_id, name);
```
2. Recipe line additions (additive `ALTER TABLE pouriq_ingredients`):
```sql
ALTER TABLE pouriq_ingredients ADD COLUMN recipe_unit TEXT;     -- display/entry unit name
ALTER TABLE pouriq_ingredients ADD COLUMN recipe_qty REAL;      -- quantity in recipe_unit
```
3. Backfill existing recipe lines (so spec cards keep rendering): for each row, set `recipe_qty` and `recipe_unit` from the existing base amount + the ingredient's base_unit:
   - `pour_ml` not null → `recipe_unit = lib.base_unit` (will be 'ml' for existing data; 'g' once weight ingredients are used), `recipe_qty = pour_ml`.
   - else `unit_count` not null → `recipe_unit = 'item'`, `recipe_qty = unit_count`.
   (A migration UPDATE joining `pouriq_ingredients` → `pouriq_ingredients_library` for base_unit.)
`pour_ml`/`unit_count` remain the base amount (cost source of truth). `recipe_unit`/`recipe_qty` are display + re-edit. NOTE: `pour_ml` holds the base amount in the base unit (ml OR g); the column name is legacy. A future cleanup may rename `pour_ml`→`base_amount`; out of scope here.

## Conversion helpers (`src/lib/pouriq/measures.ts` or `calculations.ts`)
- `STANDARD_SERVE_UNITS: Record<'ml'|'g'|'each', Array<{ name: string; base_per_unit: number }>>` (the standard sets above).
- `serveUnitsFor(baseUnit, customUnits)` → merged list offered in the recipe-entry picker.
- `recipeBaseAmount(recipe_qty, base_per_unit)` = `recipe_qty * base_per_unit` → the value stored in pour_ml (ml/g) or unit_count (each).
- Pure + unit-tested.

## Cost / variance / stock
UNCHANGED. They read the base amount (`pour_ml`/`unit_count`) which the entry path keeps populating. Adding recipe_unit/qty does not touch `ingredientCostPence`, the variance loaders, or the stock loader. (Confirm: `ingredientCostPence` already uses pour_ml for ml/g and unit_count for each — grams in pour_ml work today.)

## UI
- **Ingredient form** (`IngredientForm.tsx`): a "Serve units" section (under or near Advanced). Add/edit/remove custom units: name + conversion. For count base, a friendly "N {unit}s per item" entry (→ base_per_unit = 1/N); for weight base, "1 {unit} = X g"; for volume, "1 {unit} = X ml". Persist via the serve-units table (server action). Standard units are shown as always-available (read-only) so the user knows they exist.
- **Recipe entry** (`CocktailForm.tsx`, `ServeForm.tsx`, `IngredientMatchRow.tsx`): replace the pour/unit chips with a **unit picker** = standard units for the ingredient's base dimension + its custom serve units, plus a qty input. On change, compute and store base_amount (pour_ml/unit_count) AND recipe_unit/recipe_qty. The Slice-1 PortionHelper is superseded by this (remove or fold in). Keep a live per-serve cost readout.
- **Spec card + displays** (`SpecCard.tsx` `formatMeasure`, `IngredientList`, menu-copy, anywhere a measure renders): show `{recipe_qty} {recipe_unit}` with sensible pluralisation (`2 wedges`, `1 dash`, `50 ml`, `3 beans`). Fall back to the base amount if recipe_unit is null.
- **Import** (`IngredientMatchRow`/import commit): an imported recipe line defaults `recipe_unit` to the matched ingredient's base unit (or a parsed unit if the menu states one, e.g. "dash"), `recipe_qty` = the parsed amount; base_amount computed as today.

## replaceIngredients / save path
`replaceIngredients` (menus.ts) and the recipe-save inputs gain `recipe_unit`/`recipe_qty` alongside `pour_ml`/`unit_count`. The entry UI computes base_amount from unit×qty and passes both.

## Migration of existing custom-portion data
None exists yet (serve units are new). The Slice-1 PortionHelper stored only a computed unit_count (no named unit), so existing lines backfill to base-unit display (above) — acceptable; users can re-pick a named unit on edit.

## Out of scope
- Cross-dimension yields (count → volume), e.g. lime → ml of juice. Use a separate ingredient or Slice 3 prepared recipe.
- Renaming `pour_ml` → `base_amount` (future cleanup).
- Prepared/in-house recipes (Slice 3).

## Tests
- `recipeBaseAmount` + `serveUnitsFor` (standard + custom merge; count "N per item" → 1/N).
- Coffee-bean: g ingredient + custom unit bean=0.2; "3 beans" → base 0.6 g; `ingredientCostPence` cost = round(cost/g × 0.6).
- Lime wedge: each ingredient + wedge=1/6; "2 wedges" → unit_count 0.333; cost correct.
- Dash: ml ingredient, standard dash=0.6; "2 dashes" → pour_ml 1.2.
- Migration backfill: existing pour_ml row → recipe_unit='ml'/qty; unit_count row → recipe_unit='item'/qty.
- Spec-card `formatMeasure` renders the unit + plural.

## Success criteria
- A bartender enters "3 coffee beans", "1 lime wedge", "2 dashes", "50 ml" naturally; the spec card shows exactly that; cost/variance/stock are exact (via the base amount).
- Serve units are defined once per ingredient and reused across recipes; standard units need no setup.
- Gram ingredients are usable in recipes.
- Existing recipes keep rendering (backfilled to base-unit display) and re-cost identically.
