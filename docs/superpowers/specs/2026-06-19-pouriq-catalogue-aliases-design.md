# Pour IQ: Catalogue Aliases + Additions — Design

**Date:** 2026-06-19
**Status:** Approved (follow-up to the ingredient catalogue, PR #763 / migration 0034)

## Problem

Real menus name the same ingredient different ways — "Cointreau" vs "triple sec", "Chambord" vs "crème de mûre", "Disaronno" vs "amaretto", "Passoã" vs "passion fruit liqueur". The catalogue matcher is spelling-based (normalise + Levenshtein), so these don't match each other. And the seed has gaps the pilot's menu hits.

## Solution

1. **Aliases:** each catalogue entry gains a list of synonyms. The matcher checks name **and** aliases. One canonical ingredient (the bar prices once) absorbs its brand/synonym spellings, so a menu mixing terms doesn't create duplicate library entries.
2. **More ingredients** the pilot's menu needs.

Principle: **generic is canonical, brand/synonym is an alias** — except where there's no common generic (Chambord stays Chambord).

## Data model — migration `0035_catalogue_aliases.sql`

- `ALTER TABLE pouriq_ingredient_catalogue ADD COLUMN aliases TEXT NOT NULL DEFAULT '[]'` — JSON array of **normalised** alias strings (lowercased; both accented and unaccented forms stored, e.g. "crème de cassis" and "creme de cassis", since `normalise` does not strip accents).
- **Aliases on existing rows:** Amaretto ← `disaronno`; Angostura Bitters ← `aromatic bitters`.
- **New rows** (deduped against the 83 already present — tomato juice, elderflower cordial/liqueur, amaretto already exist, skipped):
  - Liqueurs: Blackcurrant Liqueur (aliases: crème de cassis / creme de cassis / cassis), Blackberry Liqueur (crème de mûre / creme de mure / mure), Passion Fruit Liqueur (passoã / passoa), Peychaud's Bitters (150ml), Chocolate Bitters (150ml).
  - Syrups: Falernum (700), Maple Syrup (1000).
  - Other (bottle): Cream of Coconut (500), Coconut Milk (400), Hot Sauce (100, aliases: tabasco), Cherry Purée (juice, 1000).
  - Garnishes / unit: Salt, Black Pepper (alias: pepper), Celery, Vanilla Ice Cream, Chocolate Ice Cream.

## Matcher — `src/lib/pouriq/ingredient-catalogue.ts`

- `CatalogueEntry` gains `aliases: string[]`. `listCatalogue` selects the `aliases` column and JSON-parses it (defaulting to `[]` on any parse error).
- `matchCatalogue`: exact match when `target === normalised_name` **or** `aliases.includes(target)`; fuzzy (Levenshtein ≤ 2 / substring) checked against the name and each alias. Returns the single best entry or null, as before.

## Testing

Extend `tests/unit/lib/pouriq-ingredient-catalogue.test.ts`: an alias resolves to its canonical entry (e.g. "disaronno" → Amaretto; "crème de mûre" → Blackberry Liqueur); exact name still wins; unrelated input still returns null. Seed migration applies; row count increases.

`npx tsc --noEmit`, `npx next lint`, `npm run build`, `npm run test:unit`.

## Out of scope

Crowd-growth, EAN-13 linkage, a browse screen — all unchanged from the parent spec. No UI change (the import preview already renders catalogue matches; aliases only affect which entry is matched).

## Migration note

`0035` applies on top of `0034` (already on prod). Additive column + rows; no destructive change.
