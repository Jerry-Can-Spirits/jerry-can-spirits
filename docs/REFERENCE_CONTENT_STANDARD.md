# Jerry Can Spirits — Ingredient & Equipment Page Writing Standard

The standard every ingredient and equipment page is written and reviewed
against. Binding.

`docs/VOICE.md` governs the brand voice across the whole site and takes
precedence where the two overlap. `docs/COCKTAIL_CONTENT_STANDARD.md` is the
equivalent for cocktails and this document does not repeat it: **every rule in
sections 1, 2 and 12 of that document applies here unchanged**, including the
one that produced it.

**Write about the ingredient, never about the page.** A page that discusses its
own existence, its place in a list, or the CMS it lives in is writing about the
wrong subject. `scripts/self-reference.ts` counts the breaches and
`scripts/audit-reference-standard.ts` reports them per page.

---

## 0. Why this document exists

The cocktail corpus has had a written standard and an audit since 8 August
2026. The 298 ingredient and 72 equipment pages have had neither, and it shows.

MEASURED 14 August 2026 by `scripts/audit-reference-standard.ts`:

| | Pages | Miss at least one band |
|---|---|---|
| Ingredients | 298 | **282** |
| Equipment | 72 | **72** |

That is not a corpus of bad writing. Every ingredient page carries a
description, a usage note and FAQs — the structural work was done. What they
lack is depth: a long description around half the length the cocktail pages
hold, and FAQ answers written to fill a box rather than answer a question.

## 1. The exemplars

The reference pages are the seventeen written on 13 and 14 August 2026:

**Cynar · Frangelico · Grappa · Chamomile Cordial · Tabasco · Donn's Mix ·
Jamaican Rum · Demerara Rum · Gold Rum · Pernod · Palo Cortado · Cuban
Aguardiente · Sugar Cane Juice · Grapefruit Soda · Kina Lillet · Cocchi
Americano · Lagavulin 16**

**Where a rule here and those pages disagree, the pages win and this document
is wrong.** Read two before writing or editing any reference page — Cynar for
a product with a myth to puncture, Demerara Rum for one where the production
method is the story.

Every number in section 2 was derived from them by
`npx sanity exec scripts/audit-reference-standard.ts --with-user-token -- --derive`
rather than asserted. The cocktail standard was first written with bands its own
best page failed on three counts out of four, and an audit against a bent ruler
reports the corpus failing when it is the ruler at fault. Re-derive rather than
edit these numbers by hand.

## 2. The bands

MEASURED across the seventeen exemplars, 14 August 2026:

| Field | Min | Median | Max | Band |
|---|---|---|---|---|
| Description | 35 | 42 | 53 | **35–60** |
| Long description | 349 | 375 | 422 | **330–450** |
| Sections | 4 | 4 | 4 | **4** |
| Usage | 34 | 46 | 51 | **30–65** |
| Storage | 22 | 37 | 46 | — |
| Top tips | 3 | 3 | 3 | **3** |
| FAQs | 4 | 4 | 4 | **4**, answers 35–60w |

Floors sit at or below the lowest exemplar deliberately. A band that fails the
page it was derived from is measuring the wrong thing.

## 3. Description

40-odd words, and it does one job: say what the thing is and why anyone would
care, in a way that is true of this product and no other.

The failure mode is the category sentence — "a warming sweetener made by
combining natural honey with fresh ginger, balancing floral sweetness with
gentle heat" — which would serve for any of a hundred syrups and tells a reader
nothing they could not guess from the name.

**Prefer the specific fact that reframes the thing.** Cynar opens on the
artichoke because everybody asks about it. Kina Lillet opens by saying it
cannot be bought. Grappa opens on pomace, because the reputation people arrive
with is fifty years out of date.

## 4. Usage

Where it goes and in what measure, naming real drinks. 30–65 words.

Name a cocktail only if the recipe actually references this ingredient — the
Islay Scotch Whisky page claimed the Penicillin for months after the recipe
moved to Lagavulin 16. `scripts/audit-prose-mismatch.ts` catches the inverse on
cocktail pages and the same discipline applies here.

## 5. The four sections

Four headings, each with a separate job, and no heading that could be swapped
onto another page without editing.

The shape that works, drawn from the exemplars:

1. **What it is** — production, category, the thing people get wrong
2. **How it differs from its neighbour** — the comparison a reader is actually
   making: Cynar against Campari, Frangelico against amaretto, grappa against
   brandy
3. **Where it belongs** — the drinks, and why those and not others
4. **Buying or keeping it** — brands, storage, what a bad one tastes like

Do not write a section on flavour alone. The description and the flavour
profile already carry it, and a third pass reads as padding.

## 6. FAQs

Four, answers 35–60 words, each answering a question somebody would type.

**"What is X?" is a legitimate first FAQ and a poor second one.** The remaining
three should be the objections and confusions: *Does Cynar taste like
artichoke? Is grappa the same as brandy? Can you still buy Kina Lillet?* If an
answer restates the description, the question was invented to fill a slot.

## 7. Brands and claims

Name brands where a reader needs one to buy well, and say what separates them.
Do not rank a competitor's product against a Jerry Can one on a reference page;
`docs/VOICE.md` governs what may be claimed and the claims discipline there is
binding.

Where the ingredient is a Jerry Can product, it appears because it is the
subject, not because the page is selling.

## 8. The tools

| Script | What it does |
|---|---|
| `audit-reference-standard.ts` | Bands, worst first. `--derive` re-derives them from the exemplars; `--type=equipment` switches corpus |
| `patch-reference-fields.ts` | Applies copy by content address — FAQ by question, section by heading. Throws on an address that has moved |
| `create-ingredient.ts` | Creates a page. Refuses to overwrite |
| `self-reference.ts` | Shared with the cocktail audits |

Dry run everything. Every defect found during the cocktail pass was found by a
dry run and none by reading afterwards.

## 9. Equipment

Everything above applies, with two differences: `tips` replaces `topTips`, and
there is no flavour profile. The section shape becomes:

1. **What it does** — the mechanism, not the marketing
2. **Choosing one** — what separates a good one from a cheap one
3. **Using it properly** — the technique people get wrong
4. **Care and lifespan** — why the good one lasts

No exemplar equipment page exists yet. The first one written to this standard
becomes it, and section 1 should be updated to name it.
