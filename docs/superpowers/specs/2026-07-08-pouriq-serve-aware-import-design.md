# Serve-aware menu import + catalogue autocomplete (E1 + E4) — Design

Date: 2026-07-08
Status: approved by Dan (brainstorming session 2026-07-08)
Source: Pour IQ E2E findings 2026-07-08 (F2, E1, E4; relates to E2 already shipped).

## Purpose

When a whole-venue menu is imported, a product sold in more than one measure (a keg of Guinness sold as a half and a pint; a bottle of gin sold as 25ml and 50ml; a bottle of wine sold as 125/175/250) should become **one correctly-sized, priced-once library ingredient** with each menu line carrying its own **serve**. Today the importer makes a separate, mis-sized library entry per line, drops the serve entirely at commit, and defaults draught to a bottle size — so the same keg is entered twice at the wrong size and costs come out wrong (finding F2). This also folds in E4: catalogue name-autocomplete on the manual Add-ingredient form, reusing the import matcher.

## Key finding that shapes the design

The **data model already supports "one product, many serves."** A recipe line (`pouriq_ingredients`) points to one library ingredient and stores `pour_ml`, `recipe_unit`, `recipe_qty`. Standard serves (pint 568, half 284, 25/50ml, wine 125/175/250, glass) live in code (`STANDARD_SERVE_UNITS` in `src/lib/pouriq/measures.ts`) and are available on any ml ingredient with no DB rows. So "one Guinness keg, a half serve and a pint serve" is already expressible as one library entry + two recipe lines. **No core-model change or migration is required.** The work is entirely in extraction, the import preview, and the import commit route.

## The costing rule (resolved during design)

- **Price once, on the keg.** One library entry for Guinness: `pack_format = keg`, `pack_size = 50000`, `price = £110` (net). Cost/ml = £110 / 50000 = £0.0022.
- **Serve costs are derived, never entered.** Pint 568ml → £1.25; half 284ml → £0.62. The type-aware cost readout (E2, already shipped) shows "per half / per pint" the moment the keg price is entered, so the derivation is visible.
- **Sale price stays 1:1 with the menu line.** "Guinness Pint £6.20" and "Guinness Half £3.50" are two separate menu items, each keeping its own customer price exactly as printed. Grouping happens **only on the cost side** (shared keg ingredient). A single menu price is never split, combined, or moved across serves.
- **Never invent an unlisted serve.** Multi-serve grouping only applies when the menu itself lists more than one measure of the product as separate priced items. "Guinness £6.20" as a single line is one drink at one serve; no half is invented.
- **Optional wastage:** the entry's `yield_pct` (default 100) can be lowered (e.g. 90 for line loss) to nudge every derived serve cost up proportionally. Off by default.

## Architecture and data flow (Approach A)

Approach A reuses the existing bulk-fill grouping and serve-unit machinery rather than building a new grouping engine (Approach B) or rewriting the extraction contract into a `products[]` shape (Approach C).

1. **Serve-aware extraction.** The extract route (`src/app/api/pouriq/import/extract/route.ts`) per-ingredient output gains `base_product` (name with the measure stripped) and `serve` (a token from a fixed vocabulary). The extraction prompt (`src/lib/pouriq/import-prompts.ts`, same file the F1 cider guard was added to) separates measure from product and maps menu wording to the vocabulary. Backwards-compatible: no serve → behaves exactly as today (raw pour). Stripping the serve also improves matching ("Guinness" matches better than "Guinness Pint"). The serve → pack-default mapping (below) keys off the serve token's measure class; the serves on one grouped product are the same class, so the default is unambiguous.
2. **Matching (unchanged).** `base_product` runs through the existing library + catalogue matcher.
3. **Grouping via existing bulk-fill.** The grouping key changes from `extracted_name` to the **resolved product identity** — `catalogue_id` when matched, else normalised `base_product`. Same-product lines merge into one library entry; genuinely different products stay separate (the safety valve against false merges).
4. **Serve-aware pack default (the F2 fix).** A grouped product with any draught serve (half_pint/pint) defaults to `pack_format = keg` + keg `pack_size` (50000ml, editable, 20L/30L chips) instead of the catalogue's bottle default. Wine serves → 750ml bottle; spirit serves → 700ml bottle. Set **once for the product**, from the serve.
5. **Commit persists serves.** `CommitIngredient` in `src/app/api/pouriq/import/commit/route.ts` gains `recipe_unit` and `recipe_qty`; the INSERT writes them. The client already sends them (dropped today). No schema change — columns exist on `pouriq_ingredients` since migration 0044.

## Serve vocabulary

Fixed token set the extraction maps to, each with a base-per-unit (ml):
`25ml` (25), `50ml` (50), `half_pint` (284), `pint` (568), `125ml` (125), `175ml` (175), `250ml` (250), `glass` (default per type, e.g. 200 for soft/mixer), `null` (no measure given).

Serve → pack default:
- draught (`half_pint`, `pint`) → `pack_format = keg`, `pack_size = 50000`
- wine (`125ml`/`175ml`/`250ml`) → bottle, `pack_size = 750`
- spirit (`25ml`/`50ml`) → bottle, `pack_size = 700`
- else → the catalogue `default_pack_size` (unchanged)

## Preview UX

Row-per-drink stays (no rewrite). For a grouped product:
- **Priced once, shown as shared.** Bulk-fill already propagates a resolved product's price + pack to all its rows once the grouping key is product identity. The price and keg-size control appear **once** on the product; other rows read "priced via [product] (keg)" with a "shared with N other drink(s)" note. One place to set the keg → the F2 "set on one row, forget the other" failure is structurally gone.
- **Serve per line.** Each drink line shows its serve, pre-filled from the AI via the existing `ServeUnitPicker` in `IngredientMatchRow`, editable.
- **Keg size once.** Keg chip (50L default; 20L/30L) on the grouped product.
- **No-measure edge.** A product line with no measure gets a sensible default serve (pint for draught) and is flagged for review, not guessed silently.

## E4 — catalogue autocomplete on manual Add-ingredient

- **New route** `GET /api/pouriq/catalogue/search?q=&type=`, auth-gated via `checkPourIqAccess`, backed by the existing `listCatalogue(db)` + `matchCatalogue(q, entries, type)` in `src/lib/pouriq/ingredient-catalogue.ts`. No new matching logic — an HTTP wrapper returning the top N.
- **Name field → combobox** in `IngredientForm.tsx`: debounced typing (~200ms) calls the route; suggestions show name + type; picking one prefills name/ingredient_type/base_unit/pack_size using the **exact prefill logic already in `handleScan`** (the barcode path). Barcode prefill stays a parallel path. A name not in the catalogue proceeds as free text — nothing blocks.

## Testing

- **Unit (pure, vitest):** serve-token → ml mapping; serve → pack-default logic; grouping-key derivation (catalogue_id vs normalised base_product).
- **Commit route:** `recipe_unit`/`recipe_qty` are persisted (the bug fix); two lines sharing a product write ONE library entry + TWO recipe lines with different serves.
- **Catalogue search route:** returns expected matches; type filter works.
- **Manual E2E (Dan's next menu import):** Guinness half+pint → one keg priced once, both costed correctly; wine 125/175/250 share one bottle; spirits 25/50 share one bottle; manual-add autocomplete surfaces catalogue hits. Extraction quality is model-driven → validated here; the prompt change is additive so measure-less menus don't regress.

## Out of scope (explicitly)

- **Purchase-model clarity** (F8 packs-bought-from-"case of 6"; F3 packs-bought vs pack-size vs items-per-pack confusion). This is the PURCHASE axis; E1 is the SERVE axis. It gets its own sibling design.
- **Invoice viewer / table fixes** (F9 inline "refused to connect" iframe/CSP; F10 applied-lines table overflow).
- **Any change to how sale prices work** — sale price stays 1:1 with the menu line.
- No change to the core recipe-line schema (already sufficient).
