# Pour IQ — ABV + Alcohol Units

Date: 2026-07-02
Status: Design agreed; ready for implementation plan.

## Goal

Record an ABV per ingredient and show a per-drink **ABV% and UK alcohol units** on spec cards + the printed menu. The per-pour cocktail ABV (computed from the actual recipe, not a fixed label figure) is a genuinely distinctive touch — few tools calculate it. Mirrors the allergen/cost "per-drink value derived from ingredients" pattern.

## Migration 0063

```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN abv REAL NOT NULL DEFAULT 0;
```
Additive, safe default (0 = non-alcoholic). `IngredientLibraryRow` gains `abv: number`. The `SELECT *` reads carry it; the field-by-field cocktail join mappers in `menus.ts` (`listCocktailsForMenu`, `getCocktail`) must add `l.abv`.

## Constants + propagation (pure)

`src/lib/pouriq/abv.ts`:
- `ALCOHOLIC_TYPES = new Set<IngredientType>(['spirit','liqueur','wine','beer','cider'])`; `isAlcoholicType(t)`.
- `cocktailAbv(ingredients: { pour_ml: number | null; library: { abv: number; ingredient_type: IngredientType } }[]): { abvPct: number; units: number; complete: boolean }`:
  - **complete** = every ingredient whose `ingredient_type` is alcoholic has `abv > 0`. (A mocktail with no alcoholic ingredients is complete — a known 0%.) Non-alcoholic ingredients at abv 0 are correct, not incomplete. This is inference from `ingredient_type` — no separate reviewed flag.
  - **alcoholMl** = Σ `pour_ml × (abv / 100)` over ingredients that have a `pour_ml` (null-pour / unit-count ingredients contribute nothing in v1).
  - **volumeMl** = Σ `pour_ml`.
  - **abvPct** = `volumeMl > 0 ? round1(alcoholMl / volumeMl * 100) : 0`.
  - **units** = `round1(alcoholMl / 10)` (UK: 1 unit = 10 ml pure alcohol).
  - Pure, unit-tested. "As poured" — excludes ice/dilution (noted).

## Entry

An "ABV %" field on the ingredient form, surfaced for alcoholic ingredient types (spirit/liqueur/wine/beer/cider); a plain number input (0-100, one decimal). Saved via `saveLibraryEntryAction` (extend `LibraryEntryInput` + `IngredientLibraryInsert` with `abv?: number`; `insertLibraryEntry`/`updateLibraryEntry` write it).

## Display (toggle-able, like allergens)

- **Spec cards** (`SpecCard` + `SpecCardsView` toggle `showAbv`, default on when any ingredient is alcoholic): when complete, "ABV {abvPct}% · {units} units"; when incomplete, "ABV estimate incomplete". Print-aware.
- **Printed menu** (`MenuBuilder` control alongside show-prices/photos/allergens): compute `cocktailAbv` per drink on the builder PAGE (server) and pass `{ abvPct, units, complete }` per drink into the client (same pattern as allergen info); render "ABV {x}% · {y} units" / incomplete flag. Print-aware.

## Attention nudge

In `getAttentionRows` (`attention.ts`), mirror the allergen-review block: when the menu has alcoholic-type ingredients with `abv === 0` (unique count), push "N alcoholic ingredients need an ABV." (`href: '/trade/pouriq/library'`, severity medium).

## Scope

- **IN:** migration 0063; the constants + `cocktailAbv`; ingredient-form entry; spec-card + printed-menu display with toggles; the attention nudge.
- **OUT (noted):** ice/dilution modelling; volume from unit/count-measured alcoholic ingredients (v1 counts only `pour_ml`); statutory unit rounding; per-serve "units per serve" legal labelling rules.

## Testing

- **Unit (pure):** `cocktailAbv` — a 50ml 40% spirit in a 200ml drink → abvPct 10, units 2.0, complete; an alcoholic ingredient with abv 0 → complete false; a mocktail (juice only) → complete true, abvPct 0, units 0; no `pour_ml` ingredients → abvPct 0 (no divide-by-zero); rounding to 1 dp.
- **Migration 0063:** node:sqlite — column added with default 0; existing rows get 0.
- **Flow-through:** `tsc` forces `abv` through the `menus.ts` join mappers + `LibraryEntryInput`; fix fixtures.
- Reasoned: entry save/round-trip, the display toggles, the attention row.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; no new npm dependencies.

## Risks / notes

- **"As poured" ABV** understates real served strength (ignores ice melt / dilution) and overstates for long drinks left to melt — acceptable + industry-normal for a recipe figure; keep the wording "ABV" not "as served". Document in the help guide.
- Alcoholic ingredient with abv still 0 → the drink is flagged incomplete rather than showing a misleadingly low ABV. The attention nudge drives filling these in.
- `abv REAL` — parse defensively on entry (clamp 0-100); a spirit typo like 400 would skew a drink. Validate the input range in the form + action.
- Migration **0063** (0062 = allergens, in main). Apply to prod after merge.
