# Garnish linking — design

**Date:** 2026-07-25
**Status:** Approved (design)

## Problem

On a cocktail page the garnish renders under Glassware as a plain string
(`CocktailRecipeDisplay.tsx` line 275): `Garnish: {cocktail.garnish}`. The
garnish ingredient is not clickable, and the same garnishes are *also* listed
as ingredient lines, so they appear twice.

We want garnishes to:

1. Render only under Glassware (out of the Ingredients list).
2. Have each garnish that has an ingredient page hyperlinked to it, with the
   surrounding descriptor text left plain.

Example — the Champs-Élysées garnish
`Lemon twist expressed over the glass and rested on the rim` should render as:

> **Garnish:** [Lemon Twist](/field-manual/ingredients/lemon-twist/) expressed over the glass and rested on the rim

## Constraints from the data

- 310 cocktails have a `garnish` field.
- **143 are compound** — two or three garnishes in one string, e.g.
  `Luxardo Maraschino Cherry, orange slice and Angostura bitters pattern`.
  Each linkable element must link independently.
- Several elements have **no ingredient page** and must stay plain text:
  `gardenia flower`, `Angostura bitters pattern`, `optional flaming demerara sugar cube`.
- **28 are "none"/prose**: `None traditionally. Serve with a stirrer or short straw.`
  These must render as plain text with no links.
- Garnish strings do not always match a page name exactly: `Mint sprig` vs the
  page `Fresh Mint Sprig`, `nutmeg` vs `Freshly Grated Nutmeg`.

## Approach: render-time linkifier

Chosen over a structured garnish field (schema change + 310-field migration +
changed Studio editing) and over driving the section off ingredient lines
(~80 cocktails have a garnish string but no matching lines). The linkifier keeps
the authoring workflow unchanged (garnish stays a typed sentence) and needs no
migration.

### 1. Linkifier utility — `src/lib/linkifyGarnish.tsx`

Pure function:

```
linkifyGarnish(garnish: string, vocab: GarnishVocab): React.ReactNode[]
```

- `GarnishVocab` is an array of `{ name: string; slug: string }` entries, sorted
  longest-name-first.
- Scans the garnish string for vocabulary entries, matching **case-insensitively**
  on **whole words** (word-boundary aware so `Orange` inside `Orange Slice` is not
  matched separately, and `slice` alone is not matched).
- Matches are **non-overlapping**, taken longest-first, left to right; already
  consumed spans are skipped so a compound string yields multiple independent links.
- Each match becomes a `<Link href={/field-manual/ingredients/${slug}/}>` (note the
  trailing slash, per the repo `trailingSlash: true` convention) with the same
  link styling used elsewhere; unmatched spans are returned as plain strings.
- No match anywhere (e.g. the "none" strings) returns the original string as a
  single plain node.

The function returns nodes (not HTML) so React handles escaping; it is a `.tsx`
file because it produces `<Link>` elements.

### 2. Vocabulary + alias map

- The base vocabulary is every ingredient doc's `name` (fetched `{name, "slug": slug.current}`).
  Matching against all ingredients, not only the `garnishes` category, lets
  `Angostura bitters` inside `Angostura bitters pattern` link to its bitters page.
- A small hand-curated **alias map** (in `linkifyGarnish.tsx`) covers common
  garnish spellings that do not match a page name:
  `mint sprig → fresh-mint-sprig`, `nutmeg → freshly-grated-nutmeg`,
  `cherry → maraschino-cherry`, `cinnamon → ground-cinnamon` (extend as gaps appear).
  Aliases are merged into the vocabulary as extra `{name, slug}` entries.

### 3. Data flow

- The cocktail page (`src/app/field-manual/cocktails/[slug]/page.tsx`, a server
  component) fetches the vocabulary once (a small `*[_type=="ingredient"]{name, slug}`
  query, added to the existing data fetch) and passes it as a prop to
  `CocktailRecipeDisplay`.
- `CocktailRecipeDisplay` line 275 renders `{linkifyGarnish(cocktail.garnish, vocab)}`
  in place of the raw string. Empty/undefined garnish keeps its current behaviour.
- No change to the `garnish` schema field.

### 4. Remove garnishes from the Ingredients list (one-off Sanity sweep)

A script (run via `npx sanity exec`, then deleted — the established pattern)
removes garnish lines from every cocktail's `ingredients` array so garnishes live
solely in the `garnish` field and drop out of the Recipe JSON-LD
(`recipeIngredient`).

- A line is a garnish line if its `ingredientRef` resolves to
  `category == "garnishes"`, or (for name-only lines) its name matches the garnish
  vocabulary / a garnish word list (`twist|wheel|wedge|slice|peel|sprig|zest|
  cherry|umbrella|salt rim|pickled onion|nutmeg|cinnamon stick`), excluding the
  drink's structural ingredients.
- Removal uses keyed-element unset (`unset(['ingredients[_key=="K"]'])`, **all
  paths in one `unset([...])` array**) — the mechanism proven on the ice sweep.
- Verify with fresh document reads after the write (Sanity read-after-write lag
  means a `count()` immediately after can be stale); loop until a pass starts clean.
- The script prints every removed line name for eyeball verification before it is
  trusted, and is idempotent/re-runnable.

### 5. Tests

Unit tests for `linkifyGarnish` (`tests/unit/lib/linkifyGarnish.test.ts`):

- Simple single garnish → one link + plain descriptor.
- Compound (`Maraschino Cherry, orange slice and Angostura bitters pattern`) →
  two/three links, unmatched element plain.
- Brand-prefixed (`Luxardo Maraschino Cherry`) → links the `Maraschino Cherry` span.
- Alias (`Mint sprig`, `nutmeg`) → links via the alias map.
- "None traditionally…" → no links, single plain node.
- Overlap guard (`Orange Slice` does not also match a bare `Orange`/`Slice`).

## Known limitation

Coverage is not 100% on day one: any garnish phrasing not matching a name or
alias renders as plain text. This is graceful (no broken links) and the alias map
is trivially extendable as gaps are noticed.

## Delivery

- **Code PR** (this branch): `linkifyGarnish.tsx`, the page/query wiring, the
  `CocktailRecipeDisplay` render change, and the unit tests.
- **Data sweep**: the garnish-line removal script, run once against the dataset
  (not committed as a persistent file — temp script, run then removed).

## Out of scope

- Converting `garnish` to a structured field.
- Backfilling garnish ingredient pages for elements that lack one (they simply
  stay plain text).
- Any change to how garnishes are authored in Studio.
