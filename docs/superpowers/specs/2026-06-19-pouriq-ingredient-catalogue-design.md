# Pour IQ: Shared Ingredient Catalogue — Design

**Date:** 2026-06-19
**Status:** Approved

## Problem

Menu import matches each extracted ingredient against the **bar's own library**. A new bar's library is sparse, so most ingredients come back "needs a choice" — a real import of 39 cocktails produced 74 auto-matches and **104 needing manual handling**. Every bar re-creates the same common ingredients (rum types, vermouths, citrus juices, syrups) by hand. There is no shared source of common ingredients to draw from.

## Solution

A **shared master ingredient catalogue**: a global, curated, price-less list of common bar ingredients. During menu import, ingredients that aren't in the bar's own library are matched against the catalogue; the bar adopts a catalogue ingredient by simply entering the price they pay, which creates a priced library entry for them. Over time most common ingredients auto-suggest with one price to confirm.

This is distinct from the existing **EAN-13 barcode catalogue** (specific scanned bottles, keyed by barcode, for barcode-scan prefill). The two stay separate by design — different keys (generic name vs barcode), different consumers (import name-match vs scan exact-match), different growth/moderation. They may be presented as one "ingredient knowledge base" in the UI later, and optionally linked (a scanned product → its generic), but that is out of scope here.

## Decisions (from brainstorming)

- Comprehensive curated **seed** now (the bigger the better — all rum variants, etc.).
- Import wires the catalogue in: unmatched-against-library ingredients are **matched against the catalogue and adopted inline with a price**.
- **Crowd-growth deferred** to a later, moderated phase (bars' own generic ingredients feeding the catalogue).
- **No standalone browse screen** in v1 — the import preview is the adopt surface.
- Separate table from the barcode catalogue.

## Architecture

### Data model — migration `0034_ingredient_catalogue.sql`

```sql
CREATE TABLE pouriq_ingredient_catalogue (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,                 -- canonical display name, e.g. "Dark Rum"
  normalised_name TEXT NOT NULL UNIQUE, -- for matching + dedup
  ingredient_type TEXT NOT NULL CHECK (ingredient_type IN
    ('spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other')),
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('bottle','unit')),
  default_bottle_size_ml INTEGER,     -- typical size for bottle items (e.g. 700); null for unit items
  verified INTEGER NOT NULL DEFAULT 1,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
No cost column, ever — each bar enters its own. `pricing_mode` tells the adopt UI whether to ask for a bottle cost (+ size) or a unit cost.

### Comprehensive seed (same migration, or `0035_ingredient_catalogue_seed.sql`)

~100 common UK bar ingredients across every type. Indicative coverage:
- **Spirits:** white/dark/spiced/aged/overproof rum; London dry gin, Old Tom gin; vodka; blended/single-malt scotch, bourbon, rye, Irish whiskey; blanco/reposado/añejo tequila, mezcal; cognac/brandy.
- **Liqueurs:** triple sec/Cointreau, Campari, Aperol, sweet & dry vermouth, coffee liqueur, amaretto, elderflower, peach schnapps, blue curaçao, Chambord, maraschino, Bénédictine.
- **Mixers:** tonic, soda water, cola, ginger beer, ginger ale, lemonade.
- **Juices:** lime, lemon, orange, cranberry, pineapple, grapefruit, apple, tomato.
- **Syrups:** sugar/simple, grenadine, agave, honey, orgeat.
- **Garnishes (unit-priced):** lime, lemon, orange (each), mint sprig, olives, cherries, salt rim.

Each row: canonical name, normalised name, type, pricing_mode, sensible default size (bottle items) — authored in the migration; the list is easy to extend later.

### Matching — `src/lib/pouriq/ingredient-catalogue.ts`

- `listCatalogue(db)` → all rows (global, ~100; one query).
- `matchCatalogue(name, rows)` → the single best catalogue row when confident (exact normalised match, or Levenshtein ≤ 2), else null. Reuses the existing `normalise` / `levenshtein` from `pos/match.ts` (or the import `match.ts`).

### Import wiring — `src/app/api/pouriq/import/extract/route.ts`

Load the catalogue alongside the tenant library. Per extracted ingredient, precedence:
1. Library auto-match → `auto` (the bar's own priced entry always wins).
2. Else a confident catalogue match → new kind `catalogue`.
3. Else library suggestions → `suggestions` (unchanged).
4. Else `no-match`.

New preview match kind:
```ts
| { kind: 'catalogue'; catalogue_id: string; name: string; ingredient_type: IngredientType; pricing_mode: 'bottle' | 'unit'; default_bottle_size_ml: number | null }
```

### Adopt-with-price — `src/components/pouriq/ImportPreview.tsx`

For a `catalogue` ingredient, render it pre-filled (name + type from the catalogue) with a single price control: a bottle cost + size (size defaulted from `default_bottle_size_ml`) when `pricing_mode === 'bottle'`, or a unit cost when `'unit'`. On commit it flows through the **existing `new_library` path** — so a priced library entry is created for the bar, and next time it auto-matches from their own library.

**Commit route unchanged** (`import/commit` already creates inline `new_library` entries). The catalogue is purely a pre-fill + match source.

## Testing

Unit (`tests/unit`):
- `matchCatalogue`: exact normalised match; fuzzy ("dark rum" ↔ "Dark Rum", "fresh lime juice" ↔ "Lime Juice" within threshold); returns null below confidence.
- Precedence: a library auto-match beats a catalogue match; catalogue used only when the library has no auto-match.
- The seed migration applies (DDL parses; row count > 0 locally).

`npx tsc --noEmit`, `npx next lint`, `npm run build`.

## Out of scope

- Crowd-growth from bars' generic ingredients (later, moderated).
- Standalone catalogue browse/adopt screen (import preview is the v1 surface).
- Merging with / linking to the EAN-13 barcode catalogue.
- Backfilling existing menus.

## Migration note

`0034` (+ seed) to apply to prod D1 at deploy. Additive — new table only; no change to existing tables or data.
