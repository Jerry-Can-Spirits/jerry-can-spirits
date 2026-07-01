# Pour IQ — Allergens + Dietary

Date: 2026-07-01
Status: Design agreed; ready for implementation plan.

## Goal

Let a venue record the 14 UK-regulated allergens and dietary suitability (vegetarian / vegan / gluten-free) per ingredient, roll them up to each drink, and show them on spec cards (staff) and the printed menu (customers) — without ever implying safety that hasn't been confirmed. Legally relevant (Natasha's Law), so **an untagged ingredient is "unknown", never "safe".**

## Migration 0062

On `pouriq_ingredients_library`:
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN allergens TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pouriq_ingredients_library ADD COLUMN dietary TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pouriq_ingredients_library ADD COLUMN allergens_reviewed INTEGER NOT NULL DEFAULT 0;
```
Additive, safe defaults (everything starts unreviewed with no tags). `allergens`/`dietary` hold JSON arrays of string keys. `IngredientLibraryRow` gains `allergens: string`, `dietary: string` (raw JSON), `allergens_reviewed: number`. The `SELECT *` reads carry them; the field-by-field cocktail join mappers in `menus.ts` (`listCocktailsForMenu`, `getCocktail`) must add `l.allergens`, `l.dietary`, `l.allergens_reviewed` to the library object.

## Constants + parsing (pure)

`src/lib/pouriq/allergens.ts`:
- `ALLERGENS = ['celery','gluten','crustaceans','eggs','fish','lupin','milk','molluscs','mustard','nuts','peanuts','sesame','soya','sulphites'] as const`; `AllergenKey` union; `ALLERGEN_LABELS` (title-case display).
- `DIETARY = ['vegetarian','vegan'] as const`; `DietaryKey` union. (Gluten-free is derived, not stored.)
- `parseTags(json: string): string[]` — safe `JSON.parse`; returns `[]` on error/non-array.
- `cocktailAllergenInfo(ingredients: { library: { allergens: string; dietary: string; allergens_reviewed: number } }[]): { contains: AllergenKey[]; reviewed: boolean; vegetarian: boolean; vegan: boolean; glutenFree: boolean }`:
  - `reviewed` = the drink has ≥1 ingredient AND **every** ingredient has `allergens_reviewed === 1`.
  - `contains` = sorted union of every ingredient's parsed `allergens` (in `ALLERGENS` order).
  - `vegan` = `reviewed && every` ingredient's dietary includes `'vegan'`.
  - `vegetarian` = `reviewed && every` ingredient's dietary includes `'vegetarian'` OR `'vegan'` (vegan implies vegetarian).
  - `glutenFree` = `reviewed && !contains.includes('gluten')`.
  - When not `reviewed`: `vegan/vegetarian/glutenFree` are all `false` (no positive claim without full review).
  - Unit-tested exhaustively (this is the legal-safety core).

## Entry (IngredientForm)

When editing an ingredient, an "Allergens & dietary" section:
- 14 allergen chips (toggle multi-select) bound to the parsed `allergens`.
- `vegetarian` / `vegan` toggles (ticking `vegan` auto-ticks `vegetarian`).
- A "These allergen details are confirmed" checkbox → sets `allergens_reviewed = 1`. Ticking it with no allergens selected is valid (= "confirmed: none").
- Saved via the existing `saveLibraryEntryAction` (extend `LibraryEntryInput` with `allergens: string[]`, `dietary: string[]`, `allergens_reviewed: boolean`; serialize to JSON in `insertLibraryEntry`/`updateLibraryEntry`).
- A small inline note: unreviewed ingredients show as "not yet confirmed" wherever they surface.

## Display (toggle-able)

- **Spec cards** (`SpecCard`): a `showAllergens` toggle (default on when any ingredient has data). Renders `Contains: milk, sulphites` (from `contains`), dietary badges (V / Ve / GF), and a distinct **"Allergen info incomplete"** line when `!reviewed`. Print-aware.
- **Printed menu** (`MenuBuilder` preview/print): a `showAllergens` control (alongside show-prices/photos). When on, each drink shows a compact `Contains:` line + dietary badges; incomplete drinks show "allergen info incomplete". Print-aware.
- Both read `cocktailAllergenInfo(cocktail.ingredients)`.

## Attention nudge

In `getAttentionRows` (`attention.ts`), mirror the completeness/estimated pattern: when the menu has ingredients with `allergens_reviewed === 0`, push a row "N ingredients need an allergen review." (unique count), `href: '/trade/pouriq/library'`, severity medium.

## Scope

- **IN:** migration 0062; the constants + parsing + propagation helper; entry UI; spec-card + printed-menu display with toggles; the attention nudge.
- **OUT (noted follow-ons):** catalogue-wide allergen pre-seeding (deliberate, careful, later — Dan's call); customer/staff *filtering* ("show vegan only" / "hide nuts"); "may contain / traces"; auto-deriving a prepared sub-recipe's allergens from its components (v1: tag prepared ingredients directly); allergen-key symbol/number legend on the menu.

## Testing

- **Unit (pure):** `parseTags` (valid, empty, malformed → []); `cocktailAllergenInfo` — union of allergens; `reviewed` false when any ingredient unreviewed; vegan/vegetarian/GF all false when unreviewed; vegan implies vegetarian; GF blocked by a gluten allergen; empty-ingredient drink → not reviewed / no claims.
- **Migration 0062:** node:sqlite — columns added with defaults (`'[]'`, `'[]'`, `0`); existing rows get them.
- **Set-point/flow-through:** `tsc` forces the new `IngredientLibraryRow` fields through the `menus.ts` join mappers + the `LibraryEntryInput`; fix fixtures.
- Reasoned: the entry save (serialize), the display toggles, the attention row.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; no new npm dependencies.

## Risks / notes

- **Legal safety is the point:** never show a positive dietary claim or imply "allergen-free" for an unreviewed drink. The `reviewed`-gates-everything rule in `cocktailAllergenInfo` is the safeguard; test it hard.
- JSON-in-TEXT columns: parse defensively (`parseTags` never throws) so a malformed value can't crash a menu render.
- `IngredientForm` is large (1180 lines) — add the allergen section as a self-contained block; consider a small `AllergenPicker` sub-component to keep it readable, but no new files are required if it stays a contained block.
- Migration **0062** (0061 = cocktail updated_at, in main). Apply to prod after merge.
- The `menus.ts` join mappers build the library object field-by-field, so they DO need the three new columns added (unlike the `{...c}` cocktail spread) — tsc will flag.
