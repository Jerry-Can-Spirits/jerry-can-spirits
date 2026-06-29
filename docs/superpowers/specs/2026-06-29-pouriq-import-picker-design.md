# Pour IQ — Unified Ingredient Picker on Import Rows (E2E Batch 2)

Date: 2026-06-29
Status: Design agreed; ready for implementation plan.

## Goal

Make the initial build (menu + invoice import) frictionless by letting the user **pick from what they already have** on every import row, instead of being forced to create duplicates. One searchable picker — pre-selected when the match is confident, a per-line choice when it isn't — across cocktail recipe lines, menu-import rows, and invoice rows. This also makes cocktail costs compute from the real, already-priced ingredient (a costing win, not just a UX one).

## Context

From the whole-menu E2E (run 1, `project_pouriq_e2e_findings.md`). Batch 1 (matcher quality + defaults) shipped in PR #836. Batch 2 covers the onboarding-UX items:
- #9 no-match forces create-new → want a dropdown of possibles + create-new.
- #10 cocktail recipe lines force a new "gin" item instead of selecting the venue's already-priced Gordon's. Highest-confusion point.
- #4 invoice lines (Absolut/Baileys/Kahlua/Archers) don't match existing library entries → duplicates.

The building block already exists: `src/components/pouriq/IngredientPicker.tsx` is a searchable library combobox with an inline create form + catalogue/barcode prefill, used today only in the cocktail editor. The import surfaces (`IngredientMatchRow`, `InvoiceLineRow`) use a bespoke, limited match UI instead.

## Approach (chosen: generalise the existing picker)

Refactor the searchable-list + inline-create core of `IngredientPicker` into one reusable picker, used by the cocktail editor **and** all three import surfaces. The import surfaces wrap it with their pre-computed match and the catalogue-adopt option. Rejected: a parallel import-only picker (drift, duplication) and augmenting each row in place (reimplements search/create per surface).

## 1. The shared picker component

Generalise `IngredientPicker` so its behaviour is driven by props rather than its single current use:

- **Existing props kept:** `libraryEntries`, `selectedEntryId`, `onChange(entry)`.
- **New optional props:**
  - `inferredType?: IngredientType` — seeds the inline create form's type and ranks library matches of that type first.
  - `packPrefill?: { purchase_qty: number; pack_size: number } | null` — from Batch 1's `parsePackFormat`, pre-fills the create form's qty/size.
  - `catalogueSuggestion?: { name; ingredient_type; default_pack_size } | null` — when the extract matched the shared catalogue, surface an "Adopt: <name> — set your price" row that opens the create form pre-filled (name/type/size from catalogue, qty/size from `packPrefill`).
  - `enableScan?: boolean` (default `true`) — import rows pass `false` (barcode scan is a library-page affordance, not an import one).
  - `vatToggle?: boolean` (default `false`) — when true, the inline create form shows the cost-side Inc/Ex VAT control (see §5).

The picker's dropdown always offers, in order: **(1)** ranked library matches (name · type · per-unit cost), **(2)** the catalogue-adopt row if `catalogueSuggestion` is set, **(3)** `+ Create new ingredient: "<query>"`. The cocktail editor's current call keeps working unchanged (all new props optional, defaults preserve today's behaviour).

## 2. Per-row behaviour (the three surfaces)

Each import row computes a pre-match (existing logic: `matchIngredient` for library, `matchCatalogue` for catalogue) and renders the shared picker:

- **Confident library match** (exact token-set, or a single unambiguous containment match — see §4): picker shows it **pre-selected** with a "matched" badge. One click opens the dropdown to change it.
- **Catalogue match only**: the catalogue-adopt row is offered; selecting it opens the create form pre-filled (set your price).
- **No match**: picker shows no selection, dropdown open-ready, create-new available.
- Any row can search & pick **any** library entry, adopt the catalogue suggestion, or create new — the user is never forced to create.

Surface specifics:
- **Cocktail recipe lines**: the picked library entry becomes the recipe's ingredient, so the drink's pour cost/GP computes from the real stock cost. The recipe measure (`pour_ml`/`recipe_unit`/`recipe_qty`) is independent of the picker and unchanged.
- **Menu-import ingredient rows**: as today, but with the picker replacing the bespoke match/create UI; gains the VAT toggle (§5).
- **Invoice rows**: picking an existing library entry routes the invoice's net price as a **price change** to that entry (existing commit behaviour); picking/creating resolves #4 without duplicates.

## 3. Repeat-ingredient propagation

When a row is resolved (existing picked or new created), auto-fill **other rows with the identical extracted name** with the same resolution — **except when the line's inferred type is `spirit`**. Rationale (Dan): "Lemon Juice" is always the same so resolve it once; but a gin could be Gordon's in one cocktail and Sipsmith in another, so every spirit line is picked per cocktail. Implementation: keep the existing same-name fill (`onResolvedCommit`) but guard it with `inferredType !== 'spirit'`. Non-identical names never propagate (no generic→brand inference across different texts).

## 4. Invoice/library auto-match robustness (#4)

Reduce the manual picks for obvious cases; the picker remains the guaranteed fallback.
- **Accent-fold in `normalise()`**: add Unicode diacritic stripping (NFD + combining-mark removal) so "Kahlúa" == "Kahlua". This is the confirmed root cause of the Kahlua miss and is a safe, global normalisation improvement (it also helps the catalogue matcher).
- **Pre-select a single unambiguous containment match**: when `matchIngredient` returns exactly one `suggestions` entry via full token containment (e.g. library "Absolut" ⊆ invoice "Absolut Vodka"), treat it as pre-selected in the picker (still overridable). Multiple suggestions stay un-selected (user picks). This must not change `matchIngredient`'s `auto` contract (still exact-only); the pre-select is a UI decision in the row, derived from a single-containment suggestion.
- Tests must confirm no regression: a near-miss that is NOT a clean containment (e.g. "lemon juice" vs "lime juice") stays a non-selected suggestion.

## 5. Menu-import VAT toggle (fold-in: completes the third price_p writer)

The menu-import "set your price" surface is the one cost-entry point without the Inc/Ex VAT toggle (PR #828 covered the library form + invoice scan; PR #835 added only a helper line here). Because Batch 2 rebuilds this surface around the shared picker's create form, add the toggle now:
- The picker's inline create form (when `vatToggle` is true) shows the Inc/Ex control, defaulting to **Ex** (consistent with the invoice flow; the menu-import help text already says ex-VAT).
- The **import-commit route** (`src/app/api/pouriq/import/commit/route.ts`) must convert a gross entry to net via the existing `netPriceP` helper and store `price_includes_vat` + `price_entered_p`, mirroring the invoice-commit route. This closes the known "third writer" follow-up so all three cost-entry surfaces behave identically.

## 6. Keg/serve cost basis (#8 — conditional fold-in)

Half/pint serves of the same keg can show different margins because serve variants don't share the keg's purchase basis. Locate the serve-cost logic during planning. **If** the fix is contained (serve variants of one ingredient derive cost from that ingredient's `price_p`/`purchase_qty`/`pack_size` rather than carrying their own), fold it in. If it requires a broader serve-model change, split it into its own task/PR and note it in the plan. Do not let it block the picker work.

## Out of scope

- **Persistent house-spirit memory** ("gin" always = Gordon's next time): explicitly declined — Dan wants per-cocktail picks.
- Menu sections / per-category GP / non-ml stock / allergens (the whole-menu structural items — separate roadmap).

## Testing

- **Unit (matcher):** accent-fold normalise ("Kahlúa"=="Kahlua"); single-containment pre-select selection logic; non-containment near-miss stays unselected; `matchIngredient` `auto` contract unchanged.
- **Unit (propagation):** identical non-spirit name fills siblings; identical `spirit` name does not.
- **Component (picker):** renders pre-selected match; opens dropdown; search filters; catalogue-adopt opens prefilled create; create-new path; `enableScan=false` hides scan; `vatToggle` shows the control and stores net + basis.
- **Regression:** the cocktail editor's existing `IngredientPicker` usage behaves exactly as before (default props).
- Full `npm run test:unit` green; `npm run build` green.

## Risks / notes

- The picker refactor is the one component with broad reuse — contain changes to it and lean on the existing matcher tests + new component tests. Defaults must preserve the cocktail-editor behaviour exactly.
- Accent-folding touches `normalise`, used everywhere — assert existing matcher tests still pass.
- Pre-select-single-containment must stay conservative (single, full-containment only) to avoid wrong auto-fills.
