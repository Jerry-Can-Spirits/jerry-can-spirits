# Provenance and process claims checklist

Claims about where or how Expedition Spiced Rum is produced carry legal exposure
(there is active legal context with a former producer). They have resurfaced
more than once after being "removed", because they are scattered across copy,
metadata, and structured data rather than held in one place. Run this before
shipping any copy change, and never add, change, or restore a claim in this class
without founder sign-off.

## Approved framing (safe to use)

- British, small batches, our British partner distillery
- Caribbean rum base; macerated or blended at our British partner distillery

## Do not assert

- A Welsh location: "distilled in Wales", "Welsh-distilled", "Welsh water"
- Any specific water source ("Pure Welsh Water", "spring water", and the like)
- That we use molasses. The Caribbean rum base is fermented upstream, before our
  process begins, so a molasses claim describes work we do not do.
- The former producer, its name, or its location
- Any production-location claim beyond "British" until the current partner has
  produced a batch

## The grep

Run from the repo root. Structured data (JSON-LD) is the priority: it is
machine-readable and the most consequential place for an unverifiable claim.

    rg -n -i "molasses|welsh|wales|newport|pontyclun|distilled in wales|welsh water|spring water" src

Read every hit. A hit is acceptable only if it is: the approved framing above;
the legal "England and Wales" jurisdiction in the terms of service; a generic rum
fact ("rum is distilled from sugarcane or molasses"); or a non-claim identifier
(a `distillation_date` field, a Sanity schema field, a code comment).

## Rule when a hit is a real claim

- Remove the claim where deletion leaves a clean, truthful sentence.
- Stop and report where deletion breaks the sentence. Do not invent replacement
  copy; the founder writes it.
- Fix structured data first.

## Sources of recurrence

`CLAUDE.md` and `docs/VOICE.md` carry the brand's product facts. If either lists
molasses or a Welsh provenance as a fact, every new copy task will reintroduce
it. Keep both aligned with the approved framing above.
