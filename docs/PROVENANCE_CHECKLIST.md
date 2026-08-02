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
  sweeteners, and bourbon oak for maturation" (as grouped on the ingredients
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

## Rule when a hit is a real claim

- Remove the claim where deletion leaves a clean, truthful sentence.
- Stop and report where deletion breaks the sentence. Do not invent replacement
  copy; the founder writes it.
- Fix structured data first.

## Sources of recurrence

`CLAUDE.md` and `docs/VOICE.md` carry the brand's product facts. If either
lists molasses, a Welsh provenance, or a botanical count other than seven as a
fact, every new copy task will reintroduce it. Keep both aligned with this
checklist.

`docs/guides-published/` and `docs/plans/` contain historical drafts. Never
source copy from them. Files known to contain superseded provenance claims
carry a warning header pointing back to this checklist.
