# Savoy attribution — triage of the 257 unattributed cocktails

**Status: candidates, not attributions.** Nothing here has been checked against a
source. `recipeSource` must not be set from this list. It exists to shrink the
search from 257 drinks to about fifty, so that a verified pass is a session's
work rather than a month's.

## The sourcing problem, and why nothing is attributed yet

`scripts/patch-cocktail-fields.ts` states the rule: *set `recipeSource` only
where a specification was actually checked against the source, because an
authority guessed at is worse than an authority absent.* That rule is why the
IBA pass could be trusted, and it is why this list stops short of attributing.

No machine-readable Savoy text is available:

- **archive.org** holds three scans; all are lending-restricted and `_djvu.txt`
  redirects to a borrow wall. Working around an access control on an
  in-copyright work is not on the table.
- **EUVS** publishes it as a flipbook viewer, not text.
- **Wikisource** does not have it. **Gutenberg** does not have it.

**On copyright.** The Savoy Cocktail Book is often described as out of
copyright. That is true in the US, where 1930 publications entered the public
domain in 2026 under the 95-year rule. It is probably not true here: Craddock
died in 1963 and UK literary copyright runs life plus seventy, to 2034.

It does not block the work. **A recipe as a bare formula is fact and method, not
literary expression**, so citing what the Savoy specifies is fine — exactly as we
cite the IBA, whose text is also in copyright. What we must not do is reproduce
Craddock's prose. His specification, our words.

So the pass needs a copy of the book. Everything below is preparation for that.

## Group 1 — believed to be in the Savoy, check first (about 45)

Adonis · Affinity · Alaska · Alexander · Bamboo · Bijou · Blackthorn ·
Blood & Sand · Bobby Burns · Bradford · Bronx · Brooklyn · Cameron's Kick ·
Champs-Élysées · Charlie Chaplin · Chrysanthemum · Coronation No. 1 ·
Corpse Reviver No. 1 · East India No. 2 · Ford Cocktail · Gibson · Gimlet ·
Gin Cocktail · Gin Rickey · Gin Sling · Gin Sour · Gypsy Queen · Harvard ·
Honeysuckle · Hunter · Income Tax · Jack Rose · Japanese Cocktail ·
Knickerbocker · Morning Glory Fizz · Pegu Club · Pink Lady · Poet's Dream ·
Rattlesnake · Rob Roy · Shamrock Sour · Tom Collins · Turf Club · Ward Eight ·
Widow's Kiss

These are the ones worth opening the book for. Several are already close to what
we publish, which is what makes them cheap to confirm and cheap to correct.

## Group 2 — older than the Savoy, so the credit belongs elsewhere

The authority enum already carries `thomas`, `embury`, `waldorf` and `regan`, so
these have somewhere correct to go and should not be swept into `savoy` for
convenience. The Savoy reprints plenty of older drinks; being in it does not make
it the source.

- **Jerry Thomas (1862)** — Tom and Jerry, Improved Whiskey Cocktail,
  Stone Fence, Japanese Cocktail, Fish House Punch
- **Embury (1948)** — Monte Carlo. Recorded in
  [[project-jcs-audit5-conversion]]'s sibling note as already verified there;
  confirm before setting.

## Group 3 — demonstrably not Savoy, do not spend time on them

Everything post-1930, everything tiki, everything modern. Adios Motherfucker,
Appletini, B-52, Baby Guinness, Boston Trash Can, Breakfast Martini, Division
Bell, Earl Grey MarTEAni, Eastern Standard, Espresso-adjacent drinks, Gold Rush,
Grateful Dead, Jet Pilot, Jungle-era tiki, Kamikaze, Left Hand, London Calling,
Mezcal anything, Naked and Famous relatives, Nuclear Daiquiri, Oaxacan Old
Fashioned, Old Pal, Paper Plane relatives, Penicillin relatives, Pickleback,
Purple Rain, Red Hook, Revolver, Right Hand, Screaming Orgasm, Sgroppino, Shaft,
Slippery Nipple, Texas Iced Tea, Tia Mia, Tokyo Iced Tea, Toronto, Vancouver,
Woo Woo, and every Virgin/mocktail build.

Also excluded: our own house drinks — Jerry Can Julep, The Expedition Punch,
The Old Standard, Explorers Gold, Welsh Gold, Snowdonia Sour, Dragon's Breath.
Those want `house`, and `houseVariation` is required when they get it.

## What to do when the book is to hand

1. Take Group 1 in order. For each, compare our ingredients and measures against
   the printed specification.
2. Where they match, set `authority: savoy` and `sourceCheckedAt`.
3. Where they diverge, decide as the IBA pass did: the printed spec becomes the
   recipe and our version becomes a variation, or we keep ours and say why.
4. **Sweep the prose in the same pass.** The IBA repair proved a rename reaches
   the recipe line, the section heading, the section body and the description,
   and that `audit-name-drift.ts` catches none of it.
5. Drinks in the book that we do not have yet are new pages, written to
   `docs/COCKTAIL_CONTENT_STANDARD.md`.
