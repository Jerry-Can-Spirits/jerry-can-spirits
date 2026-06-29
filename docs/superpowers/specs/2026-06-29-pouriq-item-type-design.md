# Pour IQ — Menu Item Type (Batch 3, Piece 1)

Date: 2026-06-29
Status: Design agreed; ready for implementation plan.

## Goal

Give every menu drink a coarse `item_type` (cocktail / beer / cider / wine / spirit / soft-drink / food / other) so the product can tell a cocktail from a beer. Immediately powers the spec-card filter (E2E finding #11 — spec cards default to cocktails instead of every drink). Also the foundation for later consumers: per-category GP targets, the menu matrix split, and Piece 2's custom menu sections (see `project_pouriq_menu_builder_vision` in memory).

`item_type` is a property OF the drink, for filtering/analytics — distinct from per-menu presentation sections (Piece 2), which are custom and nestable.

## Approach

Store `item_type` as a real column on `pouriq_cocktails`, set at import, manually overridable, and backfilled — rather than derived live. Deriving on the fly is simpler but can't be manually overridden and is awkward to query for analytics. Rejected alternatives: pure-derived (no override), AI-infers-drink-type (non-deterministic; the ingredient-based heuristic is reliable and free).

## 1. Data model

- **Migration:** `ALTER TABLE pouriq_cocktails ADD COLUMN item_type TEXT NOT NULL DEFAULT 'cocktail';` (additive; no table rebuild).
- **Type:** in `src/lib/pouriq/types.ts`, `export const ITEM_TYPES = ['cocktail','beer','cider','wine','spirit','soft-drink','food','other'] as const` and `export type ItemType = typeof ITEM_TYPES[number]`. Add `item_type: ItemType` to `CocktailRow`.
- **Heuristic helper** (pure, unit-tested) in `src/lib/pouriq/` — `itemTypeFromIngredients(ingredientTypes: IngredientType[]): ItemType`:
  - length > 1 → `'cocktail'`
  - length === 0 → `'cocktail'`
  - length === 1 → map the single `ingredient_type`:
    - `beer`→`beer`, `cider`→`cider`, `wine`→`wine`
    - `spirit`→`spirit`, `liqueur`→`spirit`
    - `soft-drink`→`soft-drink`, `alcohol-free`→`soft-drink`, `mixer`→`soft-drink`, `juice`→`soft-drink`
    - `food`→`food`
    - anything else (`syrup`, `garnish`, `bitters`, `other`, …) → `'other'`

## 2. Three set-points

- **Import commit** (`src/app/api/pouriq/import/commit/route.ts`): when inserting a new drink into `pouriq_cocktails`, compute `item_type` via `itemTypeFromIngredients` from that drink's extracted ingredient types and write it to the new column.
- **Drink editor** (`src/components/pouriq/CocktailForm.tsx`): an `item_type` `<select>` (the eight values) bound to the drink, saved via its existing save path. Manual override; defaults to the drink's current `item_type` (or `cocktail` for new drinks). This is the only manual surface needed (confirmed: no bulk-edit elsewhere).
- **Backfill migration:** in the same migration file, after adding the column, set `item_type` for existing **single-ingredient** drinks from their one ingredient's library type; multi-ingredient and zero-ingredient drinks keep the `cocktail` default. Sketch (verify column names against the live schema first):
  ```sql
  UPDATE pouriq_cocktails
  SET item_type = (
    SELECT CASE il.ingredient_type
      WHEN 'beer' THEN 'beer' WHEN 'cider' THEN 'cider' WHEN 'wine' THEN 'wine'
      WHEN 'spirit' THEN 'spirit' WHEN 'liqueur' THEN 'spirit'
      WHEN 'soft-drink' THEN 'soft-drink' WHEN 'alcohol-free' THEN 'soft-drink'
      WHEN 'mixer' THEN 'soft-drink' WHEN 'juice' THEN 'soft-drink'
      WHEN 'food' THEN 'food' ELSE 'other' END
    FROM pouriq_ingredients i
    JOIN pouriq_ingredients_library il ON il.id = i.library_ingredient_id
    WHERE i.cocktail_id = pouriq_cocktails.id
  )
  WHERE (SELECT COUNT(*) FROM pouriq_ingredients WHERE cocktail_id = pouriq_cocktails.id) = 1;
  ```
  Validate against a SQLite reproduction of the live schema (node:sqlite) before prod; assert the column exists, every value is in `ITEM_TYPES`, and the single-ingredient mapping matches the helper.

## 3. Spec-card filter (#11)

- The specs page (`src/app/trade/pouriq/[menuId]/specs/page.tsx`) already loads `cocktails` with their joined ingredients; thread each drink's `item_type` into `SpecCardsView`.
- `SpecCardsView` (`src/components/pouriq/SpecCardsView.tsx`): default the visible set to `item_type === 'cocktail'`. Add a small category filter to the existing `no-print` toolbar — a set of toggle chips for the `item_type`s actually present on the menu, with `cocktail` on by default and the rest off. Ticking a category includes those drinks' cards (so a bar can add notes + print cards for beers etc.).
- The printed output respects the filter. If the filter leaves zero cards, show a gentle "no cards for the selected categories" note (no-print).

## Out of scope (future consumers — read item_type later, not built here)

- Per-category GP targets and the menu matrix split (Phase 9).
- Piece 2: custom, nestable per-menu sections + the menu-builder studio (its own spec).
- Bulk item_type editing on the menu detail list (confirmed not needed now).

## Testing

- **Unit:** `itemTypeFromIngredients` — multi → cocktail; zero → cocktail; each single-ingredient mapping (beer/cider/wine/spirit/liqueur/soft-drink/alcohol-free/mixer/juice/food/other).
- **Migration:** node:sqlite validation as above.
- **Behaviour:** spec cards default to cocktails only; toggling a category reveals those cards; a menu of all cocktails is unchanged.
- Full `npm run test:unit` green; `npm run build` green. (No new dependencies — keep the lock untouched.)

## Risks / notes

- Additive column with a safe default; existing reads are unaffected (drinks without the column read the default). The backfill only narrows single-ingredient drinks away from `cocktail`.
- Keep the heuristic in one pure helper so the import set-point, the backfill intent, and the tests all agree.
- No new npm dependencies (avoids the lock-file issue that hit #840).
