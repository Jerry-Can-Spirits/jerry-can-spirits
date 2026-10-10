# Jerry Can Spirits: Ingredient and Equipment Page Standard

The standard every ingredient and equipment page is written and reviewed
against. Binding.

`docs/VOICE.md` governs the brand voice across the whole site and takes
precedence where the two overlap. `docs/COCKTAIL_CONTENT_STANDARD.md` sets the
register for the Field Manual, and its sections 1, 2 and 17 apply here
unchanged. `docs/PROVENANCE_CHECKLIST.md` governs anything said about our own
rum.

**Write about the subject, never about the page.** A page that discusses its
own existence, its place in a list, or the CMS it lives in has changed subject.
`scripts/self-reference.ts` holds the patterns and
`scripts/audit-reference-standard.ts` reports them per page.

---

## 0. Where this came from

The first version of this document (14 August 2026) set four FAQs, four
sections and a long description of 330 to 450 words, derived from seventeen
ingredient pages written that week. It carried all 297 ingredient pages to
those bands over August.

The library has since moved on. The cocktail pass (376 pages, 9 and 10 October
2026) and the equipment pass (all 73 pages, 10 October) worked to a stricter
brief: an answer-first description, six to ten FAQs drawn from real search
queries, one comparison table, a visible updated date, metas that answer the
search, and every figure sourced or hedged. Measured on 10 October, no
ingredient page carried a table and 271 of 311 showed no date. Programme
decision 2 (10 October) replaced the August standard with this one before the
first ingredient rewrite batch.

The exemplars are now **the 73 equipment pages** as rewritten on 10 October
and, for ingredients, **the first two P5 rewrite batches** once they ship.
Where a rule here and those pages disagree, the pages win and this document is
wrong.

## 1. The bands

Every number below was derived by `audit-reference-standard.ts --derive`, not
asserted. Each floor sits at or below the lowest exemplar and each ceiling at
or above the highest: a band that fails the page it came from is measuring the
wrong thing. Re-derive rather than edit these numbers by hand. They live in
`scripts/reference-bands.ts`, which the audit and `patch-reference-fields.ts`
both import.

### Equipment

MEASURED 10 October 2026 across all 73 equipment pages:

| Field | Min | Median | Max | Band |
|---|---|---|---|---|
| Description (words) | 50 | 65 | 86 | **50 to 90** |
| Long description (words, excluding the table) | 207 | 280 | 577 | **200 to 600** |
| Sections (headings) | 3 | 4 | 6 | **3 to 6** |
| Comparison tables | 1 | 1 | 1 | **exactly 1** |
| Usage (words) | 25 | 42 | 65 | **25 to 70** |
| Tips | 4 | 4 | 4 | not checked |
| FAQs | 6 | 7 | 9 | **6 to 10** |
| FAQ answers (words) | 31 | 44 | 68 | **30 floor** |
| Meta title (characters) | 40 | 53 | 60 | **60 max** |
| Meta description (characters) | 118 | 149 | 155 | **155 max** |

```
npx sanity exec scripts/audit-reference-standard.ts --with-user-token -- --derive --type=equipment
```

The long description is shorter than the August figure because the table now
carries the comparison the prose used to spell out, and the FAQs carry more of
the questions. Do not pad the body back to 330.

### Ingredients: provisional

No ingredient page is written to this standard yet, so the ingredient bands
borrow the equipment figures. FAQ count, table, date, meta lengths and the
facts checks in section 7 are fixed; the word bands are not. Re-derive them
from the first two P5 batches and record the result here and in
`scripts/reference-bands.ts`:

```
npx sanity exec scripts/audit-reference-standard.ts --with-user-token -- --derive --type=ingredient --slugs=<the batch slugs, comma separated>
```

## 2. Description: answer first

The first sentence answers the question the reader typed. For an ingredient
that is usually what it is, what it is made from and how strong it is; for
equipment, what it is, its typical size in metric and what it is for. Two or
three sentences.

The searches that reach these pages are "what is X", "what is X made from",
"what does X taste like", "how strong is X" and "does X have nuts". Answer
those before anything else. "Kina Lillet was discontinued in 1986" beats any
sentence about mystique.

The failure modes are the category sentence that would serve for any of a
hundred products, and the throat-clearing opener that reassures instead of
answering. The content writing review of 8 October lists both with examples.

## 3. Meta title and description

Title 60 characters at most, description 155, both answer-first. Put the
words people search in the title and the answer in the description: a figure,
a fact, the UK angle. "X Guide: [tagline]" titles and descriptions ending
"What it is, how to use it and..." are the pattern being replaced.

## 4. The long description and its table

Three to six headings, each a statement with a separate job, none of which
could be swapped onto another page without editing. Do not write a section on
flavour alone; the description and flavour profile carry it.

Shapes that work:

- **Ingredient:** what it is and how it is made; how it differs from the
  bottle people confuse it with; where it belongs and why; buying and keeping
  it.
- **Equipment:** what it does (the mechanism, not the marketing); choosing
  one; using it properly; care and lifespan.

**One inline `comparisonTable`**, placed in the long description where the
comparison is made: the ingredient against its neighbours (strength, sugar,
flavour, typical drinks), the glass against its neighbours (capacity, shape,
drinks), the tool against its alternatives. Every figure in a table follows
section 6.

## 5. FAQs

**Six to ten.** Draw the questions from real Search Console queries where they
exist (the export of 8 October,
`Downloads/jerrycanspirits.co.uk-Performance-on-Search-2026-10-08/Queries.csv`);
otherwise use the questions a buyer or home bartender would ask: what is it,
how strong is it, does it contain nuts or gluten, how long does it keep once
opened, what can I use instead, what drinks use it. Equipment adds size,
dishwasher, chilling and "can I use X instead".

Write the question as somebody would type it, not as a clipped heading. Each
answer must say something the description does not. No chatbot openers
("Absolutely.", "Great question"). Answers run about 30 to 60 words; the
floor is 30.

## 6. Facts, sources and consistency

**Every figure sourced or hedged.** ABV, sugar, capacity, dates, history. Brand
facts carry a source and a checked date in the batch notes (decision 11).
Hedge what is uncertain ("usually 150 to 180ml", "generally attributed to").
Never invent a manufacturer's figure. Cut unsourced superlatives: oldest,
first, best, most popular, iconic, "one of the most".

**Consistency with our recipes.** Name a cocktail only if its recipe
references this page (`*[_type=="cocktail" && references($id)]`). Technique
lines match the library standard (shake hard 10 to 12 seconds; stir 20 to 30,
or 15 to 20 over one cube; dry shake 10 to 15). Glass capacities hold the
recipe with its ice. On ingredients, any ABV in prose agrees with
`abvPercent`, the figure recipe units are calculated from (decision 3).

**No duplicated sentences across pages.** Vary the frame between pages in the
same family; twenty liqueurs will drift into one template if you let them.
Run a five-word overlap check against pages updated in the last two days.

**Range, not substitution.** Expedition Spiced Rum appears only where spiced
rum is the subject or the spec. Never offer it as a stand-in for dark, white,
aged, overproof or agricole rum.

**No affiliate language.** No programme exists. No retailer named as a place to
buy, no prices unless sourced and dated, nothing that implies a relationship
with any producer (CLAUDE.md, "Provenance and process claims").

## 7. Ingredient facts fields

The structured fields added in PR #1409 carry the facts; the prose does not
restate them in a form that can drift.

| Field | Rule |
|---|---|
| `abvPercent` | One figure, the one recipe units use. Any range goes in `abvNote`. |
| `legalCategory` | Set on every page. What UK law lets it be sold as, which is not always its name: sloe gin is a liqueur. `legalNote` qualifies it. |
| `allergens` | The UK 14. Sulphites go here, not in prose. |
| `allergensReviewed` | Ticked whenever allergens are set, and on a checked page with none. Unticked, the page prints no allergen line. |
| `allergenNote` | Branded products: "Recipes change; check the bottle". |
| `storage`, `keepsFor` | `keepsFor` set on anything perishable: everything except spirits, spirit drinks and liqueurs, and every house preparation. |
| `substitutes` | References, each with a note on the swap. |
| `prep` | House recipes only. Ratios and keeping times come from the house prep rules (decision 4) and the chart on the `syrup` page. |

The allergen line is field-driven (decision 10). Prose warnings only where the
allergen is a surprise: almond in orgeat, anchovy in Worcestershire sauce,
celery seed, barley in a mixer. `scripts/audit-allergens.ts` holds that
register.

Raw egg wording follows the FSA (decision 8): British Lion eggs are fine raw
for vulnerable groups, including in pregnancy; a pasteurised carton is the
alternative; the standard measure is "15ml, about half a white". The allergen
line is separate.

No images in this pass (decision 9). The byline stays the organisation
(decision 11). `updatedAt` is shown on the page; set it when the content
materially changes.

`spiced-rum` and `jerry-can-spirits-expedition-spiced-rum` stay out of every
rewrite batch until the label position is settled (decision 6).

## 8. Equipment specifics

`tips` replaces `topTips`; there is no flavour profile. Specifications give
capacity and dimensions as typical ranges in ml and cm, and the material
plainly. `ownProduct` only where the shop sells it today. Safety and care
where relevant: thermal shock, blades, fire, N2O chargers, dry ice never in a
drink, responsible serve.

## 9. The tools

| Script | What it does |
|---|---|
| `audit-reference-standard.ts` | Checks every rule here that a script can count, worst first, with a tally by rule. `--type=equipment` switches corpus; `--derive` prints the distribution the bands come from. Read-only. |
| `reference-bands.ts` | The bands, shared by the audit and the patch script. |
| `patch-reference-fields.ts` | Applies copy by content address (FAQ by question, section by heading). Throws on an address that has moved. Its dry run measures against the same bands. |
| `audit-formulaic-copy.ts` | The formulaic patterns and self-reference across all types. |
| `audit-allergens.ts` | The surprising-allergen register against published prose. |
| `audit-prose-mismatch.ts` | Cocktails named in prose against the recipes. |
| `audit-provenance-claims.ts` | Claims about our own rum. Tier 1 must be empty. |

What the audit checks, per page: description, long description, sections and
usage inside their bands; six to ten FAQs, none under 30 words; exactly one
comparison table; `updatedAt` set; meta title and description present and
within 60 and 155 characters; no self-reference. On ingredients also:
`legalCategory` set, `allergensReviewed` ticked where allergens are set, and
`keepsFor` set on perishables.

What no script checks: whether the description answers the question, whether
a figure is sourced, whether a named cocktail really uses the ingredient, and
whether a sentence says anything. Those are the reading. Dry run everything;
every defect found during the cocktail pass was found by a dry run and none by
reading afterwards.
