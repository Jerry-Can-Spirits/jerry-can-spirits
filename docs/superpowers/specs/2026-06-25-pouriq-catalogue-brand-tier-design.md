# Pour IQ — Catalogue brand tier + collapse fix + invoice matching

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** Follow-on to the comprehensive catalogue (PR #807). That shipped a generic-first catalogue on the new model; reviewing the seed, Dan flagged that a venue scanning three different keg lagers would get three rows called "Lager" (generics collapse distinct brands). This adds a brand tier, stops the name collapse, and makes the catalogue actually power invoice scanning.

**Depends on:** PR #807 merged + migration `0047` applied. **Build branch off `main` AFTER #807 lands** (needs the new two-column catalogue model). New migration `0048`.

## Goal
Cover brand-level products in the shared catalogue so branded lines (Carling, Moretti, Madrí; Smirnoff, Gordon's) import/scan as distinct, correctly-named, correctly-typed products — while generics still serve cocktail-recipe matching. Three parts:
1. **Collapse fix** — a generic match never renames a more-specific line.
2. **Brand tier** — seed common UK on-trade brands as catalogue entries linked to a generic.
3. **Invoice matching uses the catalogue** — so a scanned brand is recognised (this is what makes the brand seed pay off on the "3 kegs" scenario).

## Locked decisions
- **Two tiers in one table** (`pouriq_ingredient_catalogue`): generics (Lager, Vodka) + brands (Carling, Smirnoff). A brand links to its generic via a new nullable `generic` column (= the generic entry's `normalised_name`). Generic rows have `generic = NULL`.
- **Specific beats generic.** The matcher prefers an exact name over an alias, and prefers a brand entry over a generic on an otherwise-equal subset match; and the adopted library name keeps the line's own wording when the line is strictly more specific than the matched entry.
- **Invoice flow gains a catalogue fallback** mirroring menu import (library match wins → else catalogue → else suggestions/no-match). This requires bringing the invoice new-library UI onto the new purchase model (it is still on the old bottle/unit one).
- **Brand seed scope:** ~100-150 UK on-trade brands, focused on the biggest invoice gaps — beers, ciders, and spirits (branded liqueurs like Cointreau/Campari are already catalogue entries). **Wines stay generic** (by colour/style). UK-relevant brands only.
- **Separate PR after #807.** Additive migration `0048` (ADD COLUMN + INSERT brand rows + alias tidy-up); no rebuild.

## Part 1 — Matcher: make specific win (`src/lib/pouriq/ingredient-catalogue.ts`, `match.ts`)
`matchCatalogue` changes (all on the existing token logic):
- **Exact name before alias.** Today the single `.find()` can return a generic whose *alias* equals the input before reaching a brand whose *name* equals it (e.g. input "smirnoff": the Vodka generic carries alias "smirnoff" and is seeded first, so it wins over a later Smirnoff brand entry). Split into two passes: first match on `normalised_name`, then on `aliases`. Exact brand entries then always beat a generic's alias.
- **Brand beats generic on ties.** In the subset/typo scoring, give entries with `generic != null` a small score advantage so, when a line like "Carling Lager" subset-matches both the "Carling" brand and the "Lager" generic with equal token-diff, the brand wins.
- **Adoption name helper** `adoptionName(extractedName, entry)`: if `significantTokens(extractedName)` strictly contains `significantTokens(entry.name)` (line has all the entry's tokens plus more), return the trimmed extracted name; else the entry's canonical `name`. Exported for the consumers. This keeps "Carling Lager" / "Smirnoff Red Vodka" instead of collapsing to "Lager" / "Vodka", while a clean "triple sec" line still adopts the canonical "Triple Sec".

`CatalogueEntry`/`CatalogueRow` gain `generic: string | null`; `listCatalogue` selects it.

## Part 2 — Brand tier seed (migration `0048`)
```sql
ALTER TABLE pouriq_ingredient_catalogue ADD COLUMN generic TEXT;
```
Then INSERT ~100-150 brand rows. Each: `name` (e.g. "Carling"), `normalised_name` (lower/punct/accent-free, e.g. "carling", "madri"), `ingredient_type` (= its generic's type), `base_unit` + `default_pack_size` (= its generic's defaults so it pre-fills sensibly; the invoice/menu line and the collapse-fix carry the real size), `aliases` (minimal — common abbreviations only, e.g. "jack daniels"→ also "jd"), and `generic` (the generic's normalised_name, e.g. "lager", "vodka").

Coverage (indicative, not exhaustive — final list authored in the plan):
- **Lager:** Carling, Foster's, Carlsberg, Stella Artois, Madrí, San Miguel, Peroni, Birra Moretti, Amstel, Heineken, Coors, Cruzcampo, Asahi, Estrella, Camden Hells.
- **Ale/stout:** Guinness, Doom Bar, Neck Oil, Camden Pale, Hobgoblin, Old Speckled Hen.
- **Cider:** Thatchers, Strongbow, Aspall, Inch's, Kopparberg, Rekorderlig, Magners.
- **Vodka:** Smirnoff, Absolut, Russian Standard, Grey Goose, Belvedere, Ciroc, Glen's.
- **Gin:** Gordon's, Bombay Sapphire, Tanqueray, Beefeater, Hendrick's, Whitley Neill, Sipsmith, Brockmans.
- **Rum:** Bacardi, Captain Morgan, Kraken, Havana Club, Lamb's, Sailor Jerry, Wray & Nephew, Malibu.
- **Whisky:** Jack Daniel's, Jameson, Jim Beam, Famous Grouse, Bell's, Glenfiddich, Glenmorangie, Monkey Shoulder, Maker's Mark, Woodford Reserve.
- **Tequila:** Jose Cuervo, Olmeca, Patrón, El Jimador.
- **Brandy/cognac:** Courvoisier, Hennessy, Rémy Martin.
- **Vermouth/aperitif:** Martini (Rosso/Extra Dry), Lillet, Noilly Prat.

**Alias tidy-up:** where a brand becomes its own entry, remove that brand from the matching generic's `aliases` via `UPDATE` (e.g. drop "smirnoff" from Vodka, "kraken"/"captain morgan" from Spiced Rum) so there is one home per brand. (Belt and braces with the matcher's exact-name-before-alias change.)

## Part 3 — Menu-import collapse fix
`src/app/api/pouriq/import/extract/route.ts`: build the `kind:'catalogue'` payload `name` via `adoptionName(i.name, cat)` instead of `cat.name`; add `generic` to the payload if useful downstream (optional). `ImportPreview.tsx` already prefills `name: m.name`, so it inherits the fix.

## Part 4 — Invoice matching uses the catalogue
The invoice flow currently matches the tenant library only and its new-library UI is still on the **old bottle/unit model**. Bring both forward:
- `src/app/api/pouriq/invoices/extract/route.ts`: after `matchInvoiceLine(line, library)`, when not an `auto` library match, fall back to `matchCatalogue(line, catalogue)`; emit a catalogue-prefill (name via `adoptionName`, `ingredient_type`, `base_unit`, `default_pack_size`) in the preview line, mirroring the import extract route. `listCatalogue(db)` once per request.
- `src/components/pouriq/InvoiceLineRow.tsx` + `InvoicePreview.tsx`: migrate the `new` match state from `{ new_pricing_mode: 'bottle'|'unit'; new_pack_size }` to the **purchase model** `{ base_unit: 'ml'|'g'|'each'; pack_size; purchase_qty }` (parity with `IngredientMatchRow` from PR #795), and seed that state from a catalogue prefill when present. Keep the manual "Create new library entry" path working on the new model.
- `src/app/api/pouriq/invoices/commit/route.ts`: it already reads `new_library.base_unit`/`pack_size`; confirm it accepts `purchase_qty` and the catalogue-seeded fields (align with the import commit which already does).

## Migration / data
Additive: `ADD COLUMN generic` (nullable, default NULL = all existing rows are generics), INSERT brand rows, UPDATE to trim promoted aliases. No rebuild, no FK. Applied to prod by Dan after merge.

## Tests
- `matchCatalogue`: input "smirnoff" → Smirnoff brand entry, not Vodka (exact name beats alias); "Carling Lager" → Carling brand, not Lager (brand beats generic on tie); a generic-only input "lager" → Lager.
- `adoptionName`: ("Carling Lager", Lager) → "Carling Lager"; ("triple sec", Triple Sec) → "Triple Sec"; ("Smirnoff Red Vodka", Vodka) → "Smirnoff Red Vodka".
- Migration `0048` schema validity (in-memory): `generic` column present; a seeded brand row has `generic` set to an existing generic's `normalised_name`; no duplicate `normalised_name`; promoted aliases removed from their generic.
- Invoice extract: a line matching only the catalogue returns a catalogue prefill with the new-model fields.
- Invoice line row renders/edits a new-model new-library entry (base_unit/pack_size/purchase_qty) and the commit persists it.

## Out of scope
- Brand→generic **merge UI** (Phase-2 finding D's "this brand = this generic, confirm?" affordance) — data + matching only here.
- Per-brand multi-format catalogues (Carling keg vs bottle vs can as separate rows) — one sensible default per brand; the line/bar sets the real size.
- Crowd-growth of the brand tier from tenant libraries (needs moderation) — future.
- Wine brands; soft-drink brands.

## Success criteria
- Scanning an invoice with Carling, Moretti and Madrí kegs yields three distinct, beer-typed products with their real names (not three "Lager"s).
- A bare "Smirnoff" on an invoice or menu resolves to the Smirnoff brand entry, typed spirit/vodka, pre-filled 700ml.
- A cocktail recipe's bare "vodka" still matches the Vodka generic; "triple sec" still adopts the canonical "Triple Sec".
- The invoice new-library UI is on the purchase model (parity with menu import); costing/variance/stock unchanged.
