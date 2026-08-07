# Provenance and process claims checklist

Claims about where or how Expedition Spiced Rum is produced carry legal exposure
(there is active legal context with a former producer). They have resurfaced
more than once after being "removed", because they are scattered across copy,
metadata, and structured data rather than held in one place. Run this before
shipping any copy change, and never add, change, or restore a claim in this class
without founder sign-off.

## Approved framing (safe to use)

- British, small batches
- Caribbean rum base
- "macerated by our British partner distillery" is the only approved production
  formulation. Not "at". Not "blended". Not any other verb.
- The standing ingredient formulation: "seven real spices, two natural
  sweeteners, and bourbon oak" (as grouped on the ingredients
  page, which the bottle QR points to). When listing individually: Madagascan
  vanilla, Ceylon cinnamon, Peruvian ginger, Spanish orange peel, Sri Lankan
  cloves, Guatemalan allspice, Indonesian cassia bark; Mexican agave syrup and
  Sussex glucose syrup; bourbon barrel chips. Never state a bare "botanicals"
  count; count-only phrasing produced the seven/eight/nine confusion. The
  flavour profile in VOICE.md describes taste; never conflate the lists.
- No bottle count in brand-level copy. Counts are batch attributes: a batch
  page may state its own figure, past tense, scoped to that batch. Brand copy
  says "small, numbered batches" and stops there.

## Banned constructions (about our rum)

- made at, made in, produced at, produced in, blended at
- distilled, distilled in, pot still, pot-distilled, column still
- molasses as a claim about our rum. The Caribbean rum base is fermented
  upstream, before our process begins, so a molasses claim describes work we
  do not do.
- British-made
- A Welsh location: "distilled in Wales", "Welsh-distilled", "Welsh water",
  "Welsh-made"
- Any specific water source ("Pure Welsh Water", "spring water", and the like)
- Any named producer in the present tense
- Any production-location claim beyond "British"

## Spirit of Wales Distillery (standing commercial decision, August 2026)

The former producer is not to appear anywhere in customer-facing content. Not
as an editorial feature, not as a production credit, not as a link, not in an
image caption or alt text. This is not open to interpretation. The same applies
to its brand names (Steeltown, Dragon's Breath) in any context that concerns us.

**The carve-out (added August 2026).** The policy governs *what we say*. It does
not extend to a printed label from a concluded production run stating a legally
required fact. Batch 001 was produced at Spirit of Wales; the label identifying
the producer is accurate for the bottle it is on, and naming the producer is a
legal requirement rather than a marketing claim we chose to make. The policy
exists to stop us advertising a former partner. It was never meant to make a
legally required statement on our own bottle unpublishable.

What follows from that:

- Do not retouch or alter a label in product photography. Editing a legal
  production statement in a photograph is a worse problem than publishing it.
- Do not photograph the producer line into new customer-facing imagery. Where a
  shot makes it legible, remove or reframe the shot, not the label.
- Batch 001 stock, its labels, and any legal or regulatory document are outside
  this policy entirely.

**This rule cannot be enforced by the grep.** In August 2026 the product page
was publishing a 1600px photograph of the side label reading "Produced in Wales
by Spirit of Wales Distillery for Jerry Can Spirits Ltd". Every text sweep had
been clean because the claim was in pixels. When product photography changes,
look at the images.

**Retired form: "bourbon oak for maturation".** Superseded August 2026 and not
to be reintroduced. The oak is chips macerated with the botanicals, not a cask
the spirit sits in, so "for maturation" was the inaccurate part of an otherwise
approved sentence. The formulation is now "seven real spices, two natural
sweeteners, and bourbon oak".

## Next print run

Copy corrected on the site that is still printed on Batch 001 labels. No action
on existing stock: the label is accurate for what it is, and the site is the
surface that can be right now.

- `Bottle_Story` back label — "notes of toasted bourbon oak". The site says
  "toasted oak", because chips are not cask maturation.
- `Bottle_Story` back label — "Clean, refined, and crafted for sipping". The
  site says "Clean. Refined and built for sipping", because craft without
  substance is on the avoid list.

## Batch pages

Batch-level pages (/batch/...) carry the batch number, bottling information and
botanicals. No producer, no place. Brand-level copy uses the approved
formulation only.

## The grep

Run from the repo root before shipping any copy change. Structured data
(JSON-LD) is the priority: it is machine-readable and the most consequential
place for an unverifiable claim.

    rg -n -i "molasses|welsh|wales|newport|brecon|steeltown|dragon|spirit of wales|pontyclun|distill|pot.still|made at|made in|produced at|produced in|blended at|british-made|spring water" src public

Read every hit. A hit is acceptable only if it is: the approved framing above;
the legal "England and Wales" jurisdiction in the terms of service; a generic
rum fact about the category or another producer ("rum is distilled from
sugarcane or molasses"); editorial content about unrelated third parties
(Penderyn, Welsh gin); or a non-claim identifier (a schema field, a code
comment).

## Known acceptable hits (reviewed, do not re-investigate)

These trip the grep every time and have been ruled on. Leave them alone.

- `Pontyclun, South Wales` on `/friends/` — Harlequin Print Group, our
  packaging supplier. The town coincides with the former producer's; the
  company is unrelated and the entry is a legitimate supplier credit.
- `The packaging is British-made, by partners we name` on `/ethos/` — true,
  scoped to packaging rather than the rum, and the suppliers are named on the
  same page.
- `Rum is distilled from sugarcane or molasses` in the homepage FAQ — a fact
  about the category, not a claim about ours.
- `England and Wales` in the terms of service — legal jurisdiction.
- `Essentials in Distilling (CIBD)` on the team page — a founder's
  qualification, not a production claim.
- `British Distillers Alliance` on `/friends/` — trade body membership.
- `Own our own distillery` on `/about/story/` — a stated future ambition,
  explicitly not a present claim.

## Rule when a hit is a real claim

- Remove the claim where deletion leaves a clean, truthful sentence.
- Stop and report where deletion breaks the sentence. Do not invent replacement
  copy; the founder writes it.
- Fix structured data first.

## Commercial relationships (standing position, August 2026)

No affiliate programme is live. There are no affiliate links, no programme,
and no commercial relationship with Master of Malt or any other retailer.

The `budgetLink` and `premiumLink` fields on the ingredient and equipment
schemas are retained, dormant and unpopulated, against a future decision that
has not been taken. They are optional and cost nothing while empty. Their
presence is not evidence of a programme.

Publish no affiliate disclosure until a programme actually exists. A
disclosure describing a relationship we do not have is as inaccurate as an
undisclosed one that we do, and it is a statement about our commercial
position rather than a piece of boilerplate. If a programme is ever joined,
the disclosure goes back at the same time as the first live link, never
before and never after.

Note that `affiliate_dt_id` in the cart is unrelated: it is referral tracking
passed to Shopify checkout, not a retailer affiliate scheme.

## Surfaces the sweep must cover

A copy correction is not finished when the page that reported it is fixed.
The same sentence is usually duplicated into surfaces nobody is looking at,
and those surfaces are read by exactly the people least able to check them.

Sweep all of these, every time:

- The page reported, and any other page carrying the same sentence.
- **The media kit and press materials** — `src/app/contact/media/page.tsx`
  and `src/app/contact/media/kit/page.tsx`. Journalists copy press material
  verbatim, so a stale claim there outlives the correction and comes back
  attributed to us. This has now happened twice: the tasting note said
  "toasted bourbon oak" in the media kit after the site had been corrected.
- **The trade portal** — `src/lib/trade-portal/product-data.ts` and
  `src/app/trade/resources/`. Trade buyers receive fact sheets as documents;
  a wrong fact there is quoted in a listing and cannot be edited afterwards.
- **Structured data** — FAQPage and Product JSON-LD. Machine-facing, so a
  wrong word is quoted back by answer engines with no context.
- **`src/lib/search-content.ts`** — titles and descriptions surfaced by site
  search.
- **`src/app/llms.txt/route.ts`** — written specifically for machine readers.

## Sources of recurrence

`CLAUDE.md` and `docs/VOICE.md` carry the brand's product facts. If either
lists molasses, a Welsh provenance, or a botanical count other than seven as a
fact, every new copy task will reintroduce it. Keep both aligned with this
checklist.

`docs/guides-published/` and `docs/plans/` contain historical drafts. Never
source copy from them. Files known to contain superseded provenance claims
carry a warning header pointing back to this checklist.
