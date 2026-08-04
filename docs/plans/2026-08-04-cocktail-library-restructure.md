# Cocktail library restructure

**Status:** design, not approved
**Date:** 4 August 2026

Turning the Field Manual from a browsable list into a reference that explains
cocktails rather than merely listing them. The competitive claim is not volume:
Difford's has around 6,000 entries, most of them variants. Actual canon is far
smaller. Ours should be the library that says what matters and why.

---

## What already exists

Measured against the live dataset, not assumed. 348 cocktails:

| Field | Populated | Notes |
| --- | --- | --- |
| `family` | 348 / 348 | 23 families |
| `baseSpirit` | 347 / 348 | 24 distinct |
| `difficulty` | 348 / 348 | novice / wayfinder / trailblazer |
| `flavorProfile` | 347 / 348 | |
| `tags` | 348 / 348 | |
| `relatedCocktails` | 348 / 348 | |
| `longDescription` | 348 / 348 | carries the origin story |
| `faqs` | 348 / 348 | |
| `glassware` | reference | typed relation, not a string |
| `variants` | **17 / 348** | the weak link |

The families are the real ones: sours (85), martinis (43), highballs (41),
old-fashioneds (26), manhattans (20), tiki (19), punches (19), fizzes (16),
collins (13), negronis (11), plus twelve smaller groups.

Six of the nine metadata types in the brief — origin story, difficulty,
glassware, flavour profile, family tree, substitutions at ingredient level —
already exist and are fully populated. This is a classification exercise on
existing records, not a rebuild.

**Genuinely missing:** era, canon tier, strength profile, cocktail-level
substitutions, and `variants` at any useful coverage.

---

## Era and canon tier are two axes, not one

The brief collapses them. They are orthogonal and collapsing them loses
information:

- **Era** — when the drink was created.
- **Canon tier** — how established it is now.

A Pisco Sour is Classic Era *and* a regional standard. A Penicillin (2005) is
Modern Canon *and* a core modern classic. One field forces a false choice and
guarantees permanent argument about placement. Two fields, each cheap to add
and each independently filterable.

### Era

| Value | Range | |
| --- | --- | --- |
| `golden-age` | pre-1950 | |
| `long-decline` | 1950–1990 | |
| `modern-canon` | 1990–2010 | |
| `contemporary` | 2010–present | |
| `jerry-can-original` | — | our own |

The brief called 1950–1990 "Post-Tiki Revival". That is backwards: tiki's
golden age ran roughly 1934 to the 1960s, and the *revival* was the 1990s and
2000s under Beachbum Berry. 1950–1990 is when tiki declined and sour mix took
over. Being anti-pretentious does not survive being wrong about the basics, and
this is the kind of error the audience we want would spot instantly. "The Long
Decline" is both accurate and closer to the voice.

### Canon tier

| Value | Rough size | |
| --- | --- | --- |
| `core-classic` | 150–200 | in every major guide: Savoy, PDT, Death & Co |
| `modern-classic` | 80–120 | globally recognised since 1990 |
| `regional-standard` | 100–200 | matters deeply somewhere specific |
| `emerging` | 50–100 | on influential menus, not yet cemented |
| `jerry-can-original` | our signature layer | |

---

## Strength profile

The one genuinely new descriptive field. Not ABV of the finished drink, which
we cannot calculate honestly without dilution modelling, but a banded
characterisation the audience actually uses:

`spirit-forward` · `balanced` · `long-and-refreshing` · `low-abv` · `zero-proof`

This is also the axis menu balance scoring needs.

---

## Where the moat actually is

Taxonomy is table stakes. Difford's has it in effect. The differentiator is
**menu intelligence**, and we are half-equipped for it already: **136 of 270
ingredients carry `priceRange` or `rrp`**.

Complete that and cost-per-serve becomes computable across the whole library.
No competitor publishes that, because none of them hold structured ingredient
pricing. From cost-per-serve follow the things a venue actually asks:

- filter by venue type
- compare by complexity, cost, speed
- build a menu and score its balance (spirit-forward vs citrus, long vs short)

That is also the piece that serves trade, where Pour IQ lives. The consumer
guide and the venue tool would share one data spine rather than two.

---

## Sequence

1. **Add `era` and `canonTier`; classify the 348.** Cheap, immediate, makes the
   library navigable and is the precondition for everything else.
2. **Fill `variants`.** 17 of 348 is the weakest link in a family-tree claim.
3. **Finish ingredient pricing, 136 → 270.** Unlocks menu intelligence.
4. **Then** add missing canon drinks.

Adding cocktails first would be the wrong order. Classifying 348 well beats
holding 450 badly, and "we define what matters" is only credible if what we
already hold is impeccably organised. Step 4 also overlaps the existing Sanity
content programme and should be planned with it, not beside it.

---

## Constraint: the hub already ships too much

`/field-manual/cocktails/` currently returns a **943 kB HTML document, 666 kB of
it RSC flight payload — 71% of the response**. All 348 cocktails ship in one
document with no pagination, and each card's props are serialised twice: once
as rendered HTML, once as flight payload for hydration.

Adding fields to the list query makes this worse in direct proportion. Any
work in step 1 must either keep the new fields out of `cocktailsListQuery` or
fix the hub's delivery first. Filtering happens in a client component, which is
what forces the whole dataset into the payload; server-side filtering via
`searchParams`, pagination, or shipping a minimal index and fetching detail on
demand would each break that link.

This is a hard prerequisite, not a nice-to-have: the restructure's whole point
is richer per-cocktail metadata, and the current architecture charges every
visitor for all of it on every hub load.

---

## Open questions

- Who arbitrates canon tier? It is a judgement call and will attract argument.
  A documented source list (Savoy, PDT, Death & Co, Difford's) makes it
  defensible rather than personal.
- Does `era` apply to a drink's creation or its popularisation? The Margarita
  is disputed 1930s–1940s; the Espresso Martini is 1983 by creation and 2010s
  by ubiquity. Pick one rule and state it in the field description.
- Strength profile for variants: a single cocktail can span bands across its
  variants. Field on the parent, or on each variant?
