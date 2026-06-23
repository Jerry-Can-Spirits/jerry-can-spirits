# Pour IQ — Field-Manual recipe import

**Date:** 2026-06-23
**Status:** Draft for review (spec-first; no code yet)
**Origin:** E2E stage 2/3 feedback. Bars see a link to the Field Manual version of a drink; they want to *import our recipe* (ingredients + measures + method) instead of building their own, and have our method populate the spec-card Directions.

## Feasibility
Field Manual cocktails are **fully structured** in Sanity (`src/sanity/schemaTypes/cocktail.ts`): an `ingredients[]` array of `{ name (string), amount (string, e.g. "50ml"), ingredientRef?, description? }`, plus `instructions[]` (method steps) and `note` (Expert Tip). No prose parsing needed — import is largely a **reuse of the menu-import pipeline** fed by one cocktail.

## Goal
Let a bar pull a Jerry Can recipe into their Pour IQ menu — ingredients matched to their library/catalogue (so it costs correctly once priced), our method in the spec-card Directions — via two entry points:
1. **Browse & import as a new drink.**
2. **Use our recipe on an existing FM-linked drink** (replace theirs).

## Shared core: fetch + convert

**GROQ queries (Sanity layer):**
- `listFieldManualCocktails()` → `[{ title, slug, baseSpirit }]` for the picker (searchable, optionally filterable by base spirit).
- `getFieldManualRecipe(slug)` → `{ title, slug, ingredients: [{ name, amount }], instructions: string[], note: string | null }`.

**Converter** `fieldManualToPreviewDrink(recipe, libraryEntries, catalogue)` → a single `PreviewDrinkInput` (the existing menu-import shape):
- For each ingredient: parse `amount` with the **existing menu-import measurement parser** (`"50ml"`→`pour_ml`; `"2 dashes"`, `"1/2"`→`unit_count`; unparseable like `"top up with soda"`→needs manual pour/unit in the preview), and match `name` via the tightened **`matchIngredient` → `matchCatalogue` → suggestions** pipeline.
- Directions string = `instructions[]` joined (numbered/newline) + the Expert Tip appended if present.
- `sale_price_p` left null (the bar sets it).

This runs server-side (Sanity fetch + matching against the tenant's library + catalogue), mirroring how the menu-import extract endpoint builds preview rows.

## Flow 1 — browse & import as a new drink
- Entry: from the add-drink surface, a **"Start from a Jerry Can recipe"** action opens a searchable FM cocktail picker (from `listFieldManualCocktails`).
- Pick → server fetches + converts the recipe → render the **existing `ImportPreview`** with that one drink, so the bar reviews ingredient matches, fills/adopts prices (library/catalogue/create), and sets the **sale price**.
- Commit (via the existing import-commit path, extended — see below) creates the `pouriq_cocktails` row with the matched ingredients, the Directions in `notes`, and **`field_manual_slug` set to the imported slug** (so the spec-card "Full method" link points at our version).

## Flow 2 — use our recipe on an existing FM-linked drink
- Entry: on a `pouriq_cocktails` row that already has `field_manual_slug`, a **"Use our recipe"** button.
- Fetch + convert that slug → same preview → on confirm (a gate, since it **discards the bar's current recipe for that drink**), **replace** the cocktail's ingredients and set `notes` to our Directions, **keeping** the drink's existing `name` and `sale_price_p`.

## Reuse vs new surface
**Reuse:** measurement parser, `matchIngredient`/`matchCatalogue`, `ImportPreview` (+ bulk-fill), ingredient library/catalogue, the import-commit transaction.
**New:**
- 2 GROQ queries + `getFieldManualRecipe`/`listFieldManualCocktails` in the Sanity lib.
- `fieldManualToPreviewDrink` converter (+ unit tests with sample FM recipes).
- FM cocktail **picker** component (searchable list).
- **"Use our recipe"** button on the FM-linked cocktail.
- **import-commit extension:** carry per-drink `notes` (Directions) and an optional `field_manual_slug`; add an **"update existing cocktail"** mode (replace ingredients + notes for a given `cocktail_id`, keep name + price) for flow 2.

## Edge cases
- **Unparseable amounts** ("top up", "to taste") → row needs a manual pour/unit in the preview (same as menu import); never silently zero.
- **No library/catalogue match** → falls to suggestions / create-new, exactly as menu import.
- **FM cocktail with `baseSpirit === 'spiced-rum'`** is our own drink — fine to import; the "Need the Rum?" CTA logic is unaffected (that's a Field Manual render concern, not Pour IQ).
- **Sanity fetch failure** → surface a clear error; no partial import.

## Out of scope (future)
Non-cocktail Field Manual content (equipment/ingredient guides); live re-sync if we later edit the FM recipe (this is a one-time copy); editing Field Manual content from Pour IQ; bulk-importing multiple FM cocktails at once.

## Success criteria
- A bar can search our Field Manual, import a cocktail as a new menu drink with ingredients matched to their library and our method in Directions, set their price, and commit — reusing the familiar import-preview UX.
- On an FM-linked drink, "Use our recipe" cleanly replaces their recipe with ours (with a confirm), keeping name + price.
- Unmatched ingredients / unparseable measures are surfaced for the bar to resolve, never faked.
