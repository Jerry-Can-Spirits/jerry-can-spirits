# Pour IQ — Comprehensive matching catalogue (modernise + seed + compound splitting)

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** [[pouriq-ingredient-model-redesign]] follow-on. Slices 1-3 moved the tenant ingredient library to the new model (`base_unit` ml/g/each + `pack_size`), but the shared **catalogue tables** still carry the legacy `pricing_mode 'bottle'|'unit'` / `bottle_size_ml` naming and are only lightly seeded. This work modernises them, seeds them comprehensively for UK bars, and teaches the importer to split compound ingredient lines.

**Depends on:** Slices 1-3 (merged). Build branch `feat/pouriq-catalogue-comprehensive` off `main`.

## Goal
Make menu import match well on day one for any UK bar: a rich, brand-aware catalogue on the new ingredient model, so a bar adopts a common ingredient by entering only its own price. Clear the last legacy column naming. Split compound "A & B juice" lines into their atoms so each costs correctly.

## Locked decisions
- **Modernise + comprehensive seed** (not seed-only): the catalogue moves to the new model so it can express weight/count products and stops carrying the legacy naming Dan flagged.
- **Brand↔generic via the existing `aliases` column** — no new logic. A generic entry lists brand synonyms (Peach Schnapps ← `archers`), and `matchCatalogue` already matches on aliases.
- **Compound splitting included now**, with the measurement **even-split 50/50** as the costing default (bar adjusts in the preview).
- **UK-relevant brands only** in aliases (Expedition Spiced Rum / Smirnoff; never Tito's).

## Part 1 — Modernise the catalogue tables

### Ingredient catalogue (`pouriq_ingredient_catalogue`) — rebuild
Safe to `DROP`/`CREATE`/re-seed: nothing in `src` writes to it (only `listCatalogue` reads it) and nothing FKs into it — adoption *copies* a match into the tenant library. New schema:

```sql
CREATE TABLE pouriq_ingredient_catalogue (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  normalised_name TEXT NOT NULL UNIQUE,
  ingredient_type TEXT NOT NULL CHECK (ingredient_type IN
    ('spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','soft-drink','food','other')),
  base_unit TEXT NOT NULL CHECK (base_unit IN ('ml','g','each')),
  default_pack_size REAL,
  aliases TEXT NOT NULL DEFAULT '[]',
  verified INTEGER NOT NULL DEFAULT 1,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
Changes vs old: `pricing_mode` (CHECK `'bottle'|'unit'`) → `base_unit` (CHECK `'ml'|'g'|'each'`); `default_bottle_size_ml INTEGER` → `default_pack_size REAL`; `ingredient_type` CHECK extended with `'soft-drink'`,`'food'` to match the current `IngredientType` union; `aliases` promoted into the create (added ad-hoc in 0035). Old `bottle` → `ml`, old `unit` → `each` when carrying existing rows forward into the comprehensive seed (Part 2 supersedes the row set).

### Barcode catalogue (`pouriq_barcode_catalogue`) — column rename only
Holds live tenant contributions, so no rebuild. Rename for naming consistency (SQLite/D1 supports `RENAME COLUMN`; preserves rows):
```sql
ALTER TABLE pouriq_barcode_catalogue RENAME COLUMN bottle_size_ml TO pack_size_ml;
```
Barcode entries stay implicitly ml (scanned bottles/cans); no `base_unit` column added — out of scope, keeps the contribution path simple.

### Code touch points
- `src/lib/pouriq/ingredient-catalogue.ts`: `CatalogueEntry`/`CatalogueRow` swap `pricing_mode` + `default_pack_size_ml` for `base_unit: 'ml'|'g'|'each'` + `default_pack_size: number | null`; `listCatalogue` SELECT reads `base_unit, default_pack_size` directly (no alias). `matchCatalogue` unchanged (matches names/aliases).
- `src/lib/pouriq/barcode-catalogue.ts`: drop the `bottle_size_ml AS pack_size_ml` alias in `findCatalogueEntry`; update the `contributeCatalogueEntry` INSERT/UPDATE column to `pack_size_ml`. `BarcodeCatalogueEntry` already uses `pack_size_ml` — no type change.
- `src/app/api/pouriq/import/extract/route.ts`: the `kind:'catalogue'` preview payload (type at L35 + construction ~L165-172) carries `base_unit` + `default_pack_size` instead of `pricing_mode` + `default_pack_size_ml`.
- `src/components/pouriq/ImportPreview.tsx`: the catalogue match type (L24) + prefill (L81-91) simplify to `base_unit: m.base_unit` and `pack_size: m.default_pack_size ?? (m.base_unit === 'each' ? 1 : 700)`, dropping the `pricing_mode === 'unit'` mapping. This also lets a `g` catalogue entry (sugar) pre-stage correctly.

## Part 2 — Comprehensive seed
Rebuild's `INSERT` covers standard UK-bar coverage **plus every product on the Bank pilot menu** (`c:\Users\dan\Downloads\TheBankDrinks-July-2024-PRINT[10].pdf` — concrete product list captured in the plan). Categories:
- **Spirits** (`ml`, 700): rum (white/dark/spiced/aged/overproof/Navy), gin (London dry/Old Tom/pink/Navy), vodka, whisky (blended Scotch/single malt/bourbon/rye/Irish), tequila (blanco/reposado/añejo), mezcal, brandy/cognac, pisco, cachaça, absinthe.
- **Liqueurs** (`ml`, 700; vermouth 750; bitters 100-200): triple sec/Cointreau, Campari, Aperol, vermouths, coffee liqueur, amaretto, elderflower, peach schnapps, curaçao, Chambord, maraschino, Bénédictine, Irish cream, limoncello, sloe gin, melon, crème de cassis/mûre, falernum, Angostura/orange/Peychaud's bitters.
- **Wine/sparkling** (`ml`, 750): prosecco, champagne, cava, red/white/rosé, aperitif wine.
- **Beer/cider** (`each`/`ml`): lager, IPA, stout, alcoholic ginger beer, cider.
- **Mixers + soft drinks** (`ml`, 200 split bottle or 1000): tonic (+ light/elderflower/Med), soda, cola, lemonade, ginger beer, ginger ale, bitter lemon, fever-tree-style range.
- **Juices** (`ml`, 1000): lime, lemon, orange, cranberry, pineapple, grapefruit, apple, tomato, passion fruit purée, mango, elderflower cordial.
- **Syrups** (`ml`, 1000): sugar/simple, grenadine, agave, honey, orgeat, vanilla, cinnamon, raspberry, passion fruit.
- **Garnish** (`each`): lime, lemon, orange, mint sprig, cherry, olive, cucumber, salt/sugar rim.
- **Weight/count staples** (now expressible): caster sugar (`g`), egg / egg white (`each`), single/double cream (`ml`), coffee beans (`g`).

**Aliases (brand↔generic), UK-relevant:** e.g. Peach Schnapps ← `archers`; Coffee Liqueur ← `kahlua`,`tia maria`; Triple Sec ← `cointreau` (and a distinct Cointreau entry); Cola ← `coke`,`coca cola`,`pepsi`; Lemonade ← `sprite`,`7up`,`r whites`; Tonic Water ← `schweppes`,`fever tree`; Ginger Beer ← `old jamaica`; Irish Cream ← `baileys`; Spiced Rum ← `expedition spiced`,`kraken`,`captain morgan`; Vodka ← `smirnoff`,`absolut`. Aliases stored pre-normalised lower-case JSON, matching `parseAliases`.

`ingredient_type` values restricted to the (extended) CHECK / `IngredientType` union. Every row gets a `base_unit` and (where volume/weight) a `default_pack_size`.

## Part 3 — Compound ingredient splitting
New pure helper `splitCompoundIngredients` (in `src/lib/pouriq/measurement-parse.ts` or a small `compound.ts`), applied in `extract/route.ts` to the extracted `{ name, raw_measurement }[]` **before** matching.

Behaviour:
- Fires only when a name is `X <sep> Y <noun>` where `<sep>` ∈ {`&`, `and`, `/`} and `<noun>` ∈ {`juice`,`syrup`,`purée`/`puree`,`cordial`,`bitters`,`liqueur`}. Conservative: a trailing recognised noun is required, so `"salt & pepper"`, `"gin & tonic"` (no noun) do not split.
- Produces two ingredients: `"X <noun>"` and `"Y <noun>"` (e.g. `"Lime & Apple juice"` → `"Lime juice"` + `"Apple juice"`; `"Lemon and Lime cordial"` → `"Lemon cordial"` + `"Lime cordial"`).
- **Measurement even-split 50/50:** parse `raw_measurement`; if a numeric ml/cl/oz quantity is present, each line gets half (e.g. `50ml` → `25ml` + `25ml`), re-serialised in the original unit. If unparseable, both lines carry the original `raw_measurement` (no guess).
- Supports 2-way splits only (the overwhelmingly common case); 3+ atoms are left intact (no split) rather than guessed.

Pure and unit-tested; the route maps `ingredients.flatMap(splitCompound...)` before the existing per-ingredient match loop, so matching/preview/commit are unchanged downstream.

## Tests
- Migration schema validity (in-memory `node:sqlite`): new `pouriq_ingredient_catalogue` schema applies; `base_unit`/`ingredient_type` CHECKs reject bad values; barcode `RENAME COLUMN` leaves a `pack_size_ml` column.
- Seed sanity: a handful of representative rows exist with the right `base_unit` (sugar=`g`, lime garnish=`each`, vodka=`ml`/700) and a brand alias resolves (`matchCatalogue('Archers', entries)` → Peach Schnapps; `matchCatalogue('Baileys', …)` → Irish Cream).
- `splitCompoundIngredients`: `"Lime & Apple juice" 50ml` → two lines 25ml each; `"salt & pepper"` unchanged; `"gin and tonic"` unchanged; unparseable measure keeps original on both; 3-way left intact.
- `ingredient-catalogue.ts` / `ImportPreview.tsx` adoption: a `g` catalogue match pre-stages `base_unit:'g'`.

## Gates
`npm run test:unit` (all green) + `npx opennextjs-cloudflare build`. Migration applied to **prod by Dan after merge** (additive rename + curated re-seed of a no-FK table; low risk).

## Out of scope
- Barcode catalogue gaining `base_unit` (stays ml).
- 3+ atom compound splitting; compound splitting for non-listed nouns.
- Any change to costing, variance, stock, or the tenant library schema.
- Auto-contributing tenant library rows back into the ingredient catalogue.

## Success criteria
- Importing the Bank menu matches the large majority of lines to catalogue entries (incl. brand names via aliases), each pre-staged on the correct `base_unit`.
- "Lime & Apple juice 50ml" imports as two correctly-costed 25ml lines.
- No legacy `pricing_mode` / `bottle_size_ml` naming remains in the catalogue layer; costing/variance/stock unchanged.
