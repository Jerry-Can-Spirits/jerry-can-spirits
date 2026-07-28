# "What's in my bar?" — design

**Date:** 2026-07-28
**Status:** Approved direction (Dan, 28 Jul, via visual brainstorm). Spec for implementation.

## Goal

An interactive Field Manual tool where a visitor marks the bottles they own and
instantly sees which cocktails they can make now, and which they are one bottle
away from. It turns the structured cocktail/ingredient data (348 cocktails, 194
distinct referenced ingredients, ~100% structured) into an engagement and
retention feature, and — via a small set of gateway pages (phase 2) — into
long-tail SEO. Diffords Guide has a version of this; ours is differentiated by
the backbar presentation and the tight integration with the ingredient wiki.

## Scope

Two deliverables that share data, built in sequence:

1. **This spec — the interactive tool.** Match engine + backbar UX + results +
   saved bar.
2. **Phase 2 (separate spec) — SEO gateway pages.** Curated, indexable listing
   pages that funnel into the finished tool. Out of scope here; sketched at the
   end so the tool is built to support them.

## Data and freshness

### The match index is Sanity-live, not a frozen build artifact

The tool must reflect newly added cocktails without a redeploy. The matcher page
is a server component that queries Sanity for the compact index and passes it to
the client tool, with **ISR revalidation** (align with the existing site cadence;
`revalidate` on the order of an hour, plus on-demand revalidation if wired
later). A cocktail added in Sanity the normal way (structured `ingredients[]`
with `ingredientRef`s) appears in the tool within the revalidation window with no
code change. This "index is ISR-fresh from Sanity" property is a hard
requirement, not an implementation detail, and must not regress to a baked file.

### The index shape (compact, client-shipped)

Per cocktail: `{ slug, name, baseSpirit, coreIngredientIds: string[] }` where
`coreIngredientIds` is the cocktail's `ingredients[].ingredientRef._ref` set
**minus assumed basics** (see below). Garnishes are already a separate field, so
they are naturally excluded and never block a match. The full set for 348
cocktails is a few hundred KB — shipped inline/as props, matched entirely
client-side (no API round-trips, works offline, pairs with a `localStorage`
bar). Ingredient display data (name, slug, category) comes from the ingredient
docs, keyed by id.

### Assumed basics

A small, reviewable allow-list of ingredients every bar is assumed to have, so
they never count against a match: **water, ice** (and hot water). Derived as a
named constant reviewed against the ingredient docs, not guessed per cocktail.
Everything else is a real requirement. A cocktail whose only "missing" items are
basics counts as makeable.

### Shelf ↔ ingredient-category mapping

Ingredient docs carry a `category`. Shelves group them:

- **Spirits** ← `spirits`
- **Wines & Liqueurs** ← `liqueurs`, `creme-liqueurs`, `anise-herbal`, `wine`, `champagne`
- **Mixers & syrups** ← `mixers`
- **Fresh & juice** ← `fresh`
- **Bitters & aromatics** ← `bitters`, `aromatics`
- *(garnishes are excluded from the backbar and from matching)*

Mapping lives in one constant so it is easy to adjust.

### Quick-start common bottles (per shelf)

Each shelf is pre-stocked with its most useful bottles shown **dimmed** (tap to
own). "Most useful" is data-derived at build/index time: rank each ingredient by
how many cocktails reference it, take the top N per shelf (e.g. ~8 spirits, ~8
liqueurs/fortified, ~8 mixers, ~6 fresh, ~4 bitters). The long tail (all 194) is
reachable via search. Ranking is computed from the same Sanity data, so it stays
current.

## The match engine (isolated unit)

A pure, UI-agnostic module. Input: the set of owned ingredient ids. Output:

```
match(ownedIds: Set<string>, index: CocktailIndex[]): {
  makeable: Cocktail[]                              // every coreIngredientId owned
  oneAway: { cocktail: Cocktail; missingId: string }[]  // exactly one core id missing
}
```

- **makeable**: `coreIngredientIds ⊆ ownedIds`.
- **oneAway**: exactly one core id not in `ownedIds`; the missing id is returned.
- Assumed basics are removed from `coreIngredientIds` at index build, so the
  engine needs no special-casing.
- Deterministic ordering (e.g. makeable by name or by fewest ingredients;
  oneAway grouped later by missing id). No UI, no framework, no network — unit
  testable in isolation.

The **future guided nudge (the "C" upgrade)** is derived from `oneAway`: group by
`missingId`, count, rank → "add Campari to unlock 3 more." No engine change; it is
a second presentation over the same output. The tool ships the "one bottle away"
results now; promoting it to a selection-time nudge is a later UI layer.

## UX

### Layout — two panel, backbar left, results right

- **Left panel — "Your Backbar".** Category shelves (order above). Each shelf
  shows its common bottles as slots; **owned = lit (gold), available = dimmed**.
  Tapping toggles ownership. Each slot is sized to hold a **bottle image/artwork
  later** (image-ready from day one; text label until images exist).
  - **Per-shelf "＋ add"**: opens a picker/search **scoped to that shelf's
    categories only** (Spirits add lists only spirits). Adds the chosen bottle to
    that shelf as a lit slot.
  - **Global search**: a single field that searches all ~194 ingredients and adds
    to the correct shelf.
- **Right panel — results, live.** Two tiers: **You can make (N)** and **One
  bottle away (N)**, the latter with an inline "add X" hint per row. Updates on
  every toggle.
- **Responsive**: two-panel on desktop; folds to a single column on mobile
  (shelves stack, results below). Mobile-first per the house standard.
- **Empty state** (nothing owned): a short prompt plus the dimmed shelves ready
  to tap; results panel invites the first pick.

### Rendering — the backbar visual (code-native)

The backbar is built entirely in code (CSS + inline SVG), no image assets, because
the bottles are dynamic (any of ~194, added/removed live) and stateful (lit when
owned, dark when not) — a baked illustration cannot do that.

- **Bottle silhouettes = a small SVG shape library keyed by *vessel type*.** A
  dozen-ish lightweight vector shapes: tall spirit bottle, wine bottle, squat
  liqueur, juice carton, soda can, dash bottle (bitters), etc. Crisp at any size,
  tiny, recolourable, and the shape carries the ingredient name as a label until
  real artwork exists.
- **Vessel-type mapping.** Each ingredient resolves to a vessel shape, derived
  primarily from its `category` (spirits → spirit bottle, wine → wine bottle,
  fresh → carton, mixers → bottle/can, bitters → dash bottle) with a small
  override map for exceptions. Start with a code-side map (no schema change);
  an optional `vesselType` field on the ingredient doc can be added later for
  editorial control.
- **Shelves and lighting in CSS.** Dark-wood shelf planks; one overhead spotlight
  per slot that is **lit over owned bottles (amber glow + brightness), off over
  the rest**. Toggling ownership switches the light — the interaction and the
  aesthetic are the same gesture.
- **Accessibility.** Owned state is a real button/checkbox with an `aria-pressed`
  / checked state and a visible check, never colour-only. Spotlights, cones and
  wood are decorative (`aria-hidden`). Keyboard operable; shelves labelled.
- **Refinement is expected.** Bottle spacing/density (slots currently too far
  apart), the exact silhouette shapes, and a proper wood texture are visual polish
  to iterate during the build or in a later design pass; they do not change the
  architecture. A designer can supply a nicer silhouette set / texture that drops
  into the same system.

### Persistence

The owned set is saved to `localStorage` (e.g. `jcs:bar`) so the bar persists
across visits. No account, no server state. A "clear my bar" control resets it.

### Placement and entry points

- Route: `/field-manual/whats-in-my-bar/` (trailing slash per convention),
  linked from the Field Manual hub and cocktail pages ("Can you make this? Check
  your bar").
- Client component with the static index passed from the ISR server page, in a
  `Suspense` boundary consistent with the other Field Manual tools.

## SEO

The tool itself is one page (a combinatorial tool cannot be meaningfully
indexed; matching the batch-scaler precedent). SEO value comes from **phase 2
gateway pages** — a curated, finite set of substantial, data-derived listing
pages that rank for real queries and link into the tool, e.g.:

- "Cocktails you can make with [starter bar of 5 bottles]"
- "3-ingredient cocktails" / "2-ingredient cocktails"
- "Cocktails with gin and lime" (top researched pairings only)

Each carries real intro copy (not a thin auto-combo) and an auto-updating list.
Finite and curated to avoid doorway-page spam. Specced separately once the tool
ships.

## Voice, provenance, accessibility

- Microcopy follows `docs/VOICE.md` (British, measured, no hype, no em dashes).
- No provenance surface here (it is a tool over third-party and house recipes);
  the JCS product appears only where it naturally does as a cocktail base.
- Accessibility: shelves and toggles are real buttons/checkboxes with labels;
  owned state is not colour-only (a check/aria-pressed state); search inputs
  labelled; keyboard operable.

## Error handling and edge cases

- **Ref-less cocktail** (name-only ingredient lines): excluded from confident
  matching. Log/report these at index build so they can be fixed; do not silently
  mis-match. (Currently ~0.4% of lines; the linking work keeps it near zero.)
- **Ingredient with no doc**: cannot appear on a shelf/search; also flagged at
  index build. (Standard build gives every ingredient a doc.)
- **Dangling ref** (deleted ingredient still referenced): the index build drops
  unresolved ids; the cocktail matches on its remaining core ids.
- **No matches**: results panel shows an encouraging empty tier plus the nearest
  "one away" suggestions.

## Testing

- **Engine unit tests** (vitest, the existing harness): makeable is a strict
  subset; oneAway is exactly-one-missing with the right missing id; basics never
  block; garnishes never block; deterministic ordering. Fixtures modelled on real
  cocktails (Daiquiri, Negroni, Martini).
- **Index build test**: shape, basics stripped, ref-less/no-doc reporting.
- **Component**: toggling a bottle updates both tiers; category-scoped add lists
  only its categories; persistence round-trips through `localStorage`.

## Out of scope (later passes)

- Photographic bottle art / bespoke illustration in the slots (the code-native
  SVG silhouettes are in scope; real artwork drops into the same slots later).
- Visual polish: final silhouette shapes, bottle spacing/density, wood texture.
- An editorial `vesselType` field on the ingredient doc (start with a code map).
- The "C" guided nudge as a selection-time feature (engine already supports it).
- Phase 2 SEO gateway pages (separate spec).
- Allergen/dietary filtering (needs a dietary data layer first).
