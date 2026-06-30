# Pour IQ — Priced Serves (E2E run-2 R15 + R14)

Date: 2026-06-30
Status: Design agreed; ready for implementation plan.

## Goal

Let an ingredient carry multiple **priced serves** (single/double spirits, wine by glass, BIB/post-mix by half/pint, a mixer "splash") so a venue can price a by-the-measure list. Each priced serve is a **sellable serve** that the POS maps to and that depletes stock, with **live GP per serve**. Folds in R14 (show the ml next to serve sizes). This is the whole-menu enabler: you can't price a spirits/wine/soft list without it.

## Key reuse insight (why this is smaller than it looks)

A "serve" already exists: `ServeManager` creates an `is_serve = 1` row in `pouriq_cocktails` on a hidden serves menu, with a recipe (ingredients × pour_ml). The POS unmatched-review maps a sale to a serve (`target: 'serve'`), and stock/variance deplete via `sales × recipe pour_ml`. So a serve is **already POS-mappable + stock-depleting**. The only gaps: `saveServeAction` **hardcodes `sale_price_p = 0`** (serves have no price today), and creating them is clunky (manual, multi-step, no GP, no presets).

So R15 = **price the serves + a fast way to create single-ingredient priced serves from the ingredient**, reusing the `is_serve` model entirely. No parallel "priced serve unit" system.

## Model

- **No new table.** A priced single-ingredient serve = an `is_serve` cocktail with `name`, a real `sale_price_p`, and exactly one ingredient at a pour size (`pour_ml`). The size IS that ingredient's `pour_ml`; the cost basis is the ingredient's net cost × pour_ml.
- **Listing an ingredient's serves**: `is_serve` cocktails (on the tenant's serves menu) whose recipe is exactly one ingredient referencing this `library_ingredient_id`. (Multi-ingredient serves like a built G&T are composed serves, correctly not listed as a simple priced serve.)
- `sale_price_p` already exists on `pouriq_cocktails`. **No migration expected** — confirm at build.

## Changes

### 1. Serves carry a real price
- `saveServeAction` accepts `sale_price_p` and stores it on insert/update (replace the hardcoded `0`). Existing serves keep `0` until edited.
- A focused action `createIngredientServeAction(libraryIngredientId, name, pourMl, salePriceP)` creates a single-ingredient `is_serve` cocktail (on the serves menu via `getOrCreateServesMenu`) with that one ingredient at `pourMl` and the price. Tenant-scoped; verifies the library ingredient belongs to the tenant; `revalidatePath` the library + serves paths.
- `ServeManager` gains a price field and shows GP per serve.

### 2. Create priced serves from the ingredient form
- A **"Serves" section** on the library ingredient surface (the ingredient detail/edit page that renders `IngredientForm`): lists this ingredient's single-ingredient serves with **size (ml)**, **price**, and **live GP**; an "add serve" control.
- **Presets by `item_type`** pre-fill name + size: spirit → Single 25 / Double 50; wine → Small 125 / Medium 175 / Large 250 / Bottle 750; soft-drink/mixer (post-mix) → Splash 25 / Small (half) 284 / Pint 568; beer/cider → Half 284 / Pint 568. The user sets the price; **GP and ml show live**. Each preset creates one serve via `createIngredientServeAction`. Default name `"<Ingredient name> <Preset>"`, editable.

### 3. GP per serve (pure helper)
- `serveGp({ costPerMlNetP, pourMl, salePriceP, pricesIncludeVat }): number | null` → GP% (null when price is 0). Cost = `costPerMlNetP × pourMl`; sale base = `pricesIncludeVat ? netPriceP(salePriceP, true) : salePriceP`. Reuses `netPriceP` and the existing per-ml net cost (from the ingredient's `price_p`/`purchase_qty`/`pack_size`/`yield_pct`). Pure, no server imports, unit-tested.

### 4. R14 — show ml next to serve sizes
- Wherever serve-size presets / small-medium-large buttons appear (the new ingredient Serves UI, and the existing serve/recipe size buttons), show the ml next to the label, e.g. "Small (125ml)".

### 5. POS + stock + variance — unchanged
- Priced serves are `is_serve` cocktails, so POS mapping (`UnmatchedReview` → `target: 'serve'`), stock depletion, and variance already work. No changes there. (Surfacing GP in `ServeManager` is the only addition.)

## Splash + composition
- "Splash" is a small priced serve (e.g. 25ml) on a mixer/post-mix ingredient — just another serve. "Double + splash" and "Gin & Tonic" compose from serves via the existing multi-ingredient `is_serve` serves. **Auto-summing composed prices is a fast-follow**, not this build.

## Scope

- **IN:** price serves (`saveServeAction` + `createIngredientServeAction`); the ingredient-form Serves UI (presets / GP / ml); GP-per-serve helper; R14 ml display; GP shown in `ServeManager`.
- **OUT / future:** composed-serve auto-pricing (G&T = sum of serves); bulk-applying presets across many ingredients at once; a dedicated `serve_source_library_id` link (infer by single-ingredient recipe for now); context-specific splash pricing.

## Testing

- **Unit:** `serveGp` — inc/ex VAT, zero price (null), zero cost (100%), normal cases.
- The create/price actions: reasoned + any unit-testable pure pieces (e.g. default-name builder, preset table).
- **No jsdom component tests** (no new deps); keep logic in pure helpers.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; **no new npm dependencies**.

## Risks / notes

- Serves live on a hidden serves menu (`getOrCreateServesMenu`) — create from the ingredient must target it.
- Listing serves by single-ingredient recipe is a small join; fine at venue scale.
- Existing price-less serves (sale_price_p = 0) remain valid (GP shows null/blank until priced).
- Likely no migration; if one is needed it is **0059** (0058 is reserved for the menu-sections PR #845).
