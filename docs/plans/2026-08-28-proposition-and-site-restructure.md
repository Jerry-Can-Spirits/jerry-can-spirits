# Proposition and site restructure

Approved by Dan, 28 August 2026, after the PR-executive and marketing-company
calls. This is the design document: what the site sells, how each surface
sells it, and what gets cut. No code changes ship from this document directly —
each phase becomes its own branch and PR, and every piece of customer-facing
copy passes through `docs/VOICE.md` and the provenance checklist before it
ships.

## The evidence this rests on

90 days of GA4, GSC and Shopify (30 May – 27 Aug 2026):

- ~1,963 sessions and 868 age-gate hits site-wide; the homepage took 1,590
  views against 189 for /shop/ and 109 for the product page. The homepage is
  where the site's one chance mostly begins and ends.
- The Field Manual and guides pull ~130k search impressions on
  homework-intent queries (abv-vs-proof alone: 48k impressions) and produced
  £119 of attributed organic revenue. Authority engine: working. Till: absent.
- A commercial-intent gift cluster already ranks with no page built for it:
  "unusual rum gifts for him" at position 2.2, "rum gifts for men" 10.6,
  "rum gifts" 25, "gifts for rum lovers" 37.
- ~80% of the ~250 buyers to date are strangers from socials/ads (Dan's
  estimate), not friends, family or the veteran community.
- GA4 purchase attribution was broken until PR #1208 (GS2 cookie parsing);
  channel revenue numbers before its deploy understate every channel and
  overstate "Unassigned". ~50% of customers decline analytics consent, so GA
  is a half-sample by design — read it as directional, double it for scale.

## The proposition

The one thing a stranger should walk away able to retell:

> Two Royal Signals veterans started a spirits house, and their first bottle
> took two IWSC medals within the year.

Every surface serves one of four jobs, and anything that serves none is
footer material or cut:

1. **Proof** — the medals, stated precisely, linked to IWSC.
2. **Story** — the founders; why veterans make rum carefully.
3. **Product** — seven real spices, the judges' note, the house serves.
4. **Reassurance** — 5% to military charities, the Covenant, the tree fund,
   reviews, delivery terms.

Rejected as propositions, deliberately:

- "We source from the UK" — under commercial review (possible China
  sourcing); a proposition that may become untrue is not a proposition.
  Provenance claims also carry their own sign-off rules regardless.
- "Imagine what we could build with budget" — investor language. To a
  customer it discounts the bottle in their hand. Never in customer copy.
- "We drink what we make" — true, but self-asserted; it is the voice of the
  copy, not the claim of the hero.
- "We give back" — reassurance tier, not the headline. Nobody buys £40 rum
  because of 5%; it settles a decision already forming.

## The claims sheet (exact wording, verified 28 Aug 2026)

Source: https://www.iwsc.net/results/detail/172185/expedition-spiced-spiced-rum

| Claim | Status |
|---|---|
| IWSC Silver 2026 — Rum & Cola (the serve) | TRUE — usable with category named |
| IWSC Bronze 2026 — Spirit | TRUE — usable with category named |
| "Two IWSC medals in our first year" | TRUE — the approved headline form |
| "Our rum won IWSC Silver" | **FALSE — never use.** The Silver is the Rum & Cola category; the spirit took Bronze |

Judges' note, verbatim, quotable with attribution to IWSC:

> "A hint of coconut leads to vibrant ginger and citrus, with gingerbread and
> winter spices."

The IWSC listing prefixes this with "from Wales". Dan's decision 28 Aug: the
listing stands — it is true of batch 1 and it is IWSC's page. Our own copy
continues to use only the approved production framing; batch 2 entries will
carry the new origin.

## Homepage

The homepage is the pitch page, not a foyer. Six blocks, one CTA destination,
in this order:

1. **Hero** — the two-medals proposition and a single CTA to the bottle.
   No carousel, no Field Manual preview, no competing links above the fold.
2. **Proof bar** — "IWSC 2026: Silver, Rum & Cola · Bronze, Spirit", linked
   to the IWSC result page, with the judges' note quoted.
3. **Story** — the founders, one photograph, three sentences, one link to
   the full story page.
4. **Product** — the bottle, the seven real spices, the Storm & Spice serve.
5. **Reassurance** — 5% to military charities, Armed Forces Covenant, tree
   fund, reviews.
6. **CTA repeated** — same destination. One CTA per page (VOICE rule).

Leaves the homepage: the Field Manual preview block and every link that
competes with the buy path.

## Product page

Modelled on the Nomadic Watches limited-edition structure (the reference the
marketing company set), translated to what is genuinely ours. Explicitly not
adopted: the choose-your-number mechanic.

| Section | Content |
|---|---|
| Hero | Bottle, price, one CTA |
| Medal strip | The two medals, categories named, IWSC link |
| Taste | Judges' note first (third-party), house tasting notes after |
| Founders | The story section — their "collaborator bio" equivalent |
| The making | Seven spices, Caribbean rum base, approved production framing |
| Batch | Small batches, numbered bottles — the batch/bottle numbering already printed on labels. True scarcity, no gimmick |
| Serves | Storm & Spice and the house neat serve |
| FAQ | Shipping, age verification, gifting |
| Trust | Free shipping threshold, 5%, returns — at the conversion moment |

## Navigation and cut list

Primary nav: **Shop · Our Rum · Our Story · Trade · Field Manual** — five
items, selling first, Field Manual last.

- /ethos/, /sustainability/, /giving/ → one reassurance destination (fold
  into the story page or a single "what we stand for" page). Three pages,
  one job.
- /expedition-log/, /first-pour/, /friends/, /stockists/, /careers/ →
  footer.
- Nothing is deleted in this phase; demotion first, deletion only with
  redirects and a second decision.

## Field Manual policy: the moat, not the pitch

The Field Manual exists as an SEO and authority engine — deliberately, and
it works: it is the reason the site outranks its size, and it feeds
answer-engine presence Shopify alone could never build. Even at 1-in-100
conversion it pays in awareness. Nothing here shrinks it. What changes is
direction of new investment and the absence of any till inside it.

1. **Stop growing the homework wing.** No new content targeting
   definitional queries (abv-vs-proof class). Existing pages stay live and
   keep earning authority at zero cost.

2. **The Expedition block** — a "make it with ours" unit (bottle, one line,
   price, link) on cocktail pages, targeted by schema, not by hand:
   - **Included:** `baseSpirit == "spiced-rum"` AND no ingredient
     referencing a branded rum AND `recipeSource.authority` not `brand` or
     `brand-serve`. Currently 8 pages, most already house recipes.
   - **Excluded, permanently:** any cocktail whose spec names another
     producer's product (Painkiller/Pusser's, Dark 'n Stormy/Gosling's — both
     trademarked recipes), any `brand` recipe, and any `brand-serve` page
     (Fever-Tree's and Franklin & Sons' own published serves — the same
     respect we expect for ours).
   - **Tier 2, editorial:** the wider rum family (56 pages: white 20, dark
     14, aged 12, spiced 8, overproof 2). The gate is the ingredient, not
     the authority: an IBA or classic spec that calls for a *generic* rum
     ("dark rum", "white rum") can honestly carry the till, because the
     official spec names no brand — Dark 'n Stormy is the counterexample
     proving the rule, IBA authority yet Gosling's named, so excluded.
     Where the substitution suits the drink, the page gains a labelled
     house variant through the existing `variants` mechanism — the classic
     spec untouched, "our serve" beneath it. This is per-page editorial
     judgement (does a spiced rum genuinely work in this drink?), not a
     link pasted into 100 pages, and it is scoped as ongoing work, not a
     single PR.
   - Honest sizing: the 8 automatic pages are a small lever; the editorial
     tier is where the real coverage is, at the cost of real work.

3. **Redirect the content engine at commercial intent.** Same machine, new
   targets, in order:
   - A real gifts landing page for the cluster already ranking ("rum gifts",
     "rum gift sets", "gifts for rum lovers", "unusual rum gifts for him" —
     ~800 impressions of purchase intent, position 2.2 on the last with no
     dedicated page).
   - "Best spiced rum UK"-class comparison-intent pages, honestly written
     under the claims discipline.
   - Serve-and-occasion pages that feature Expedition where it genuinely
     belongs.

## Measurement

- Attribution: PR #1208 must be deployed and DebugView-verified before
  before/after comparisons mean anything. Baseline week first.
- Paid Social is the first question the fixed data answers: 96 sessions,
  £0 attributed. If that holds post-fix, the ads, not the site, are the
  problem.
- Success metrics for this restructure: homepage → product page click-through,
  product page conversion, gift-cluster rankings and clicks, AOV.

## Phasing (each phase = one branch, one PR)

1. **Claims + proof** — medal strip and claims-sheet wording on product page
   and homepage hero. Smallest, highest-certainty.
2. **Homepage restructure** — the six blocks.
3. **Product page restructure** — the Nomadic-mapped sections.
4. **Nav + cut list** — demotion and folding.
5. **Expedition block** — schema-targeted, with the exclusion rule tested.
6. **Gifts landing page** — first content-engine redirect target.
7. **Tier-2 variants** — editorial, ongoing, after everything above.

## Out of scope

- Any change to what is claimed about production or sourcing (China
  decision pending; provenance rules apply regardless).
- The choose-your-number mechanic.
- Deleting Field Manual content.
- Trade portal (just restructured separately: flat 10%, TRADE10).
