# Batch 002: the per-bottle QR scheme

Groundwork agreed with Dan, 31 August 2026, parked until batch 002 label
artwork begins. This document exists so that conversation starts from here
rather than from zero. It pairs with the Batch 002 model notes (flat
numbering, "Batch No. 00X / Bottle xxx/xxx" labels).

## The one unavoidable fact

A QR code is a printed URL and knows nothing about the bottle it is stuck
to. If a scan is to identify the bottle, every bottle's code must differ.
For ~1,500 bottles that means 1,500 distinct codes. There is no trick that
avoids this; the design work is deciding who bears the complexity, and the
answer is: almost nobody, because the labels are already variable-data
printed (every batch 001 label carries a unique bottle number), so a
per-bottle QR is one more column in the print data, not a new process.

## The signing scheme (decided in principle)

Signed URLs, not random tokens and not bare sequential numbers:

    /b/002/147/x7ktm2

The tail is an HMAC of batch + bottle number under a secret key, truncated
to a short slug. Properties:

- Intrinsic: derived by formula, nothing stored per bottle, no D1
  pre-seeding. We generate the full CSV (bottle number, URL) in one script.
- Unforgeable: the server recomputes the signature on scan; a guessed URL
  fails. Genuine proof of holding the label, unlike the type-a-number
  lookup (which stays, as the fallback for scuffed codes).
- Key rotation safe: the batch pins its key version, so old labels keep
  working forever.

Sequential URLs (guessable) buy convenience but no proof; random tokens buy
nothing over HMAC and cost a seeding step. Both rejected.

Site-side work when the time comes: one route, one verify function, one
CSV generator. A single comfortable PR. The bottle page
(/batch/[batchNumber]/[bottleId]) is the landing infrastructure and already
validates against the bottles table; the batch 002 flat-numbering URL
scheme is designed with the batch, per the standing note in that route.

## The QR squared complication (and asset)

The batch 001 label QR resolves to a QR squared hosted module: a full
digital product passport (ingredients with origins, nutrition, units and
CMO guidance, commitments, founders video, serves, and the Expedition Log
iframed from our own domain with ?batch=001). This is a genuine asset and
ahead of most UK spirits brands. QR squared therefore is not just a code
generator; they host the passport experience, and they are the FIRST
conversation, before Label Apeel.

Their platform strips scripts from HTML modules (documented in the module's
own comments), so any per-bottle behaviour inside the passport must come
from server-side substitution, never JavaScript.

Two viable architectures, decided by one QR squared capability:

- **Shape A — serialized codes into the passport.** One module template,
  1,500 codes, each carrying a serial the module can use via server-side
  merge fields (in the Log iframe src, links, text). Best experience if
  supported. Our pre-computed signature travels as part of the substituted
  URL, so their platform never computes anything.
- **Shape B — serialized redirect to our domain.** Each code redirects to
  /b/002/{serial}/{sig}; we host the bottle layer and link back into the
  passport content. Works on any platform that does serialized redirects;
  the fallback if merge fields do not exist.

## Questions for QR squared (ask first)

1. Serialized campaigns: 1,500 unique codes against one landing module, in
   one job, from a CSV we supply? Pricing at that volume, and per year.
2. The crux: server-side merge fields — can the per-code serial be
   substituted into the module HTML (iframe src, links, text)?
3. If not: can each code redirect to a URL pattern on our domain with the
   serial substituted?
4. Non-negotiable: what happens to printed codes if the subscription
   lapses or is downgraded? Bottles outlive contracts. If codes die, the
   per-bottle chain must not run through their domain.
5. Print handoff: vector files per code or a data file, and will they
   liaise with Label Apeel directly?
6. GS1 Digital Link support: retail is moving to 2D barcodes at the till
   (Sunrise 2027). A GS1-compliant QR can eventually BE the barcode - one
   code that scans at checkout and opens the passport. If supported, mint
   batch 002 future-proof at no extra effort.

## Questions for Label Apeel (same day, parallel)

1. Confirm variable-data printing with the QR as a second variable element
   on our exact stock and finish - they already vary the bottle number, so
   this should be the same workflow.
2. What input do they want: CSV plus template (codes generated in-press) or
   individual vector files? This answer defines QR squared's deliverable,
   or removes them from the print chain entirely.
3. Minimum QR size and quiet zone guaranteed scannable on our substrate,
   and whether the varnish/finish over the code affects scanning.
4. Do they scan-verify printed codes as press QA (grade check on samples)?
5. Cost delta versus the current run; any setup fee.
6. Spoilage: can a single damaged label (say #147) be reprinted on demand?

## Facts to reconcile before batch 002 ships

- The passport says "Batch Size: 700 bottles"; D1 holds 840 produced (700
  general release plus founder/premium editions). Meanwhile the site's
  order section documents a deliberate decision NOT to publish batch
  sizes. One position, applied to both surfaces.
- The passport is hand-maintained HTML carrying a second copy of facts the
  site derives from constants (batch number, bottled date, batch size,
  shop URL). At batch 002 it must be updated by checklist - or, better
  long-term, made to iframe more from our domain the way the Log already
  is, so facts live once.

## Trigger

When batch 002 label artwork planning starts: send both vendor emails,
forward the answers, and the concrete scheme (route, verify function, CSV
generator, and the chosen architecture) becomes one PR plus one spreadsheet.
