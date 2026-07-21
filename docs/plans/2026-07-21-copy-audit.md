# Copy, voice, and conversion-language audit — Jerry Can Spirits

Date: 2026-07-21. Reporting audit only: nothing was rewritten. Copy is
regenerated in conversation with the founder; this document is the map.
Authority: `docs/VOICE.md` (voice + fact canon, as updated 21 Jul 2026) and
`docs/PROVENANCE_CHECKLIST.md`.

Coverage: all of `src/` (pages, components, metadata, JSON-LD, alt text,
labels, validation messages, empty states, error pages, age gate, trade
portal, batch passport, `public/passport.html`) · all 18 live Shopify
products (title, seo.title, seo.description, description, image alt) pulled
read-only from the Storefront API · all 299 production Sanity documents
(93 cocktails, 132 ingredients, 37 equipment, 34 guides, 3 products,
cartUpsell) pulled read-only, including the 61,805 words of guide section
prose a first pull missed. Every finding was verified at source; agent
claims that failed verification were corrected before inclusion.

Known context, not re-reported: no aggregateRating / curated Trustpilot
excerpts is deliberate; IWSC 2026 medals are legitimate proof points;
virtual categories via product handles are deliberate architecture.

---

## ACT-TODAY ITEMS (edited outside this repo: Shopify admin / Sanity Studio)

Live, indexed, and in the legal-context claim class:

1. Shopify `seo.description`, premium gift pack: "…Veteran-owned,
   **distilled at Spirit of Wales Distillery**." Former producer, named, in
   an indexed meta description.
2. Shopify `seo.description`, rum and 6-pack: "…**pot-distilled in
   Wales**." (two products).
3. Shopify metafield `specifications/distillation_method` = **"Pot Still"**
   — renders as a visible "Distillation Method" spec row on the rum PDP.
4. Sanity guide `st-davids-day-drinks`, relatedProducts contextNote: "Our
   Expedition Spiced Rum is **distilled at Spirit of Wales Distillery in
   the Brecon Beacons, making it genuinely Welsh-made**." The worst
   surviving sentence in the estate: names the former producer, invents a
   location (SoW was Newport), claims Welsh-made.
5. Sanity 6-pack `history`: "…**same Spirit of Wales distillery**" — while
   the same document's `process` field names Custom Spirit Co. Both breach;
   they also contradict each other.
6. Sanity product docs (all 3) `process` + rum `faqs[4]`: name **"Custom
   Spirit Co in Horsham, West Sussex"** — the current producer, before any
   batch exists there. Breach of no-claims-until-batch; likely feeds FAQ
   markup.

---

## (a) Pour IQ mentions — complete list

**The sanctioned origin-story mention does not exist.** Zero mentions under
`/about`; nothing to keep. Zero in Shopify; zero in Sanity content. All
mentions are in `src/`:

| Location | Content | Flag |
|---|---|---|
| `privacy-policy/page.tsx:161-179, 247, 338` | §3.5 Pour IQ™ licence data processing, retention, Anthropic disclosure | Keep (legal disclosure while JCS Ltd is data controller); revisit at corporate separation |
| `terms-of-service/page.tsx:219-224` | Pour IQ™ trade mark notice (UK00004387466 pending) | Keep (legal); update on separation |
| `trade/page.tsx:149-164` | "Pour IQ™. Menu and cost engineering for independent UK bars." + 3 paras + CTA "Read about Pour IQ" → pour-iq.co.uk | Remove-candidate: product cross-sell, not origin story. Venue audience + outbound link may justify keeping — founder decision |
| `trade/login/layout.tsx:5` | metadata "…and Pour IQ access for licensed venues" | Rework (SERP surface) |
| `trade/landing/page.tsx:56-84` | authenticated tiles: Pour IQ™ / Open Pour IQ™ / Pour IQ™ help | Keep-candidate: functional navigation for live licence holders |
| `trade/pilots/bank-bar-grill/page.tsx` (~20×) | the pilot charter; entire subject is Pour IQ | Keep-candidate: working agreement with a named venue |
| `next.config.ts:199-227` | /trade/pouriq*, /trade/pour-iq*, /api/pouriq* redirects | Keep (bookmark continuity; cleanup already scheduled in comments) |
| `sanity/schemaTypes/tradeHelp.ts`, `sanity/structure.ts` | Studio admin labels referencing the removed /trade/pouriq/help route | Stale, editor-facing only |

Decisions needed: whether the trade cross-sell block survives as a
venue-facing exception, and whether an origin-story mention is written for
/about/story (none exists to keep).

## (b) AI-pattern and voice-breach copy — 25 worst, ranked

(S) = src, (C) = Sanity CMS.

1. (C) The flagship's own Sanity ingredient description: "A **premium**
   spiced rum **crafted** to balance warmth, complexity, and
   drinkability…" — the banned claim on our own rum, PLUS a flavour-profile
   conflict: "butterscotch, caramel, black pepper" contradicts VOICE.md's
   official profile. Needs owner sign-off, not silent fix.
2. (S) `AddToCartButton.tsx:96` "Buy it now" — banned "Buy now" verbatim on
   the highest-intent button on the site.
3. (S) `HeroSection.tsx:97-111` hero carries two CTAs (Order Now + Our
   Story) — one-CTA rule broken on the most valuable viewport.
4. (S) `page.tsx:237` "Whether you're mixing drinks at home or just
   unwinding…" — banned hedging formula on home.
5. (C) SYSTEMIC: ~579 em-dashes across the CMS corpus (187 in
   descriptions/tips/metas + 392 in guide section prose) vs a hard rule of
   zero. 91 of 93 cocktails are clean — the house style works without them;
   mechanical sweep.
6. (S) `FieldManualPreview.tsx:69-70,127` (home): "From timeless classics
   to bold innovations, each recipe is engineered for perfection." +
   "expertly crafted".
7. (C) 6-pack `whatsIncluded[0]`: "700ml bottle of our **premium** Spiced
   Rum" — banned claim + truncated product name.
8. (S) `shop/product/[handle]/page.tsx:686` "Ships for £5.00." — the
   never-£45.00 rule at the decision point.
9. (S) `AgeGate.tsx:252` "…embark on the adventure - we'll be here when
   you're of age!" — exclamation + hype in a legally required modal.
10. (C) SYSTEMIC: ingredient `professionalTip` template — 76 of 132 open
    "If…"; 35 share the exact "If X, it's usually Y — not Z" skeleton.
11. (C) SYSTEMIC: ~24 Fever-Tree ingredient descriptions are pasted
    supplier marketing ("perfectly balanced" ×7, "carbonated to
    perfection", "finest Sicilian lemons") — another company's copy.
12. (S) `passport.html:379` "If you've enjoyed it — don't wait." —
    manufactured urgency + em-dash on the printed-QR surface (7 more
    em-dashes in the file; also see fact conflict below).
13. (S) Press kit `contact/media/page.tsx:165,597`: "Whether you're an
    outdoors type…" + descriptor "Premium British Craft Rum" — in the
    paragraphs designed for journalist reprint.
14. (C) SYSTEMIC: seasonal-guide excerpt formula "Celebrate X with A, B,
    and C. From perfect P to Q." across 7 SEO-carrying guides (st-georges,
    st-davids, burns-night, easter, winter, autumn, st-patricks).
15. (S) Field-manual landings (`ingredients/page.tsx:53-63`,
    `equipment/page.tsx:59-63`): "Premium Ingredients… carefully curated…
    elevate your home bar" / "Engineered for Excellence… transform good
    ingredients into exceptional cocktails" — stock copy on both heroes.
16. (S) `faq/page.tsx:43,103` "Yes! Our rum is crafted using traditional
    methods…" / "Yes! We offer corporate gifting…" — exclamations +
    craft-without-substance.
17. (S) Cart/basket terminology split: "cart" (CartDrawer,
    StickyAddToCart) vs "basket" (CartUpsell, CompleteTheServe) in one
    funnel.
18. (S) `OrderSection.tsx:120-124` heading restated by its own paragraph;
    `:149` "Exclusive access to limited releases" (scarcity-adjacent).
19. (C) guide `garnishing-like-a-pro`: "Elevate every drink…" in both
    introduction and excerpt.
20. (S) `about/story/page.tsx:427,145`: "It's not just a name. It's the
    standard…" (reversal formula) + "Whether you're on some grand
    expedition or just getting through a tough Tuesday".
21. (S) `SupportingOurForces.tsx:19` "isn't just a pledge - it's
    personal." — reversal formula on home.
22. (C) Guide excerpts/metas: "From X to Y" filler ×18, "Discover…"
    openers ×12, "Master the art of…" ×3 — the rendered SERP text.
23. (S) Form-success exclamation cluster: "Message Sent Successfully!",
    "Complaint Submitted Successfully!" (tone-deaf), "Media Inquiry Sent!"
    (American spelling — house style enquiry), "Thank you for signing
    up!", "Thanks for rating!", "✓ Copied!".
24. (S) `field-manual/ingredients/[slug]/page.tsx:340,388` "Buy Now" ×2 —
    banned verbatim.
25. (S) `friends/page.tsx:122` Fever-Tree partner blurb ("finest
    ingredients… From their iconic… full potential") — the most
    machine-written paragraph in src (the :92 barware blurb is similar).

Conversion lens (money surfaces): home's reason-to-act (numbered first
batch) is stated 3+ times — VOICE's own "three times becomes hype"; hero
breaks one-CTA; product page strong except items 2 and 8; cart clean except
the cart/basket split and one em-dash (`CartDrawer.tsx:581`); the trade
portal is on-voice throughout — commercial specifics read as substance.

Sanity near-misses below the cap: tiki-sour (19 em-dashes in one doc),
caipirinha (8), christmas-drinks-pairings (7), muddling-masterclass (6),
how-to-read-a-rum-label (6), "stirred to perfection" in alaska/bijou metas,
"offers the perfect occasion/excuse" opener ×3, "deserves" ×26 as a corpus
fingerprint. Guide section prose adds elevate ×16, "premium" ×37,
"perfectly" ×18. src near-misses: "the same exceptional liquid"
(bottle certificate), "From the streets to the summit" (clothing),
"delivering exceptional experiences" (careers).

## (c) Weak product descriptions — the commercial core

0 of 18 products fully pass VOICE's three-question test (what is it / what
does it do for you / why this one). Closest: hip flask, spirit stones,
slate coaster, UK Tree Fund (two of three each). The rum passes only via
its Sanity enrichment, not its description.

**The defining failure: none of the 13 accessory descriptions mentions
Expedition Spiced Rum or names a serve.** VOICE: accessories are the way
the rum is meant to be served. The `categories.ts` collection copy does
that selling; the PDPs — where the decision happens — never do. They read
as generic barware competing with Amazon on price. This is the likeliest
single cause of accessories not selling.

Ranked findings (condensed; handles in brackets):

1. CLUSTER: no accessory mentions the rum — all 13 accessory handles.
   Direction: anchor every accessory in one named Expedition Spiced Rum
   serve.
2. CLUSTER: identical "two-to-three sentences + Features bullet-dump"
   skeleton across all 13 accessories; the bullets restate the sentences.
   Direction: what/for-you/why-this-one structure; specs to one line.
3. Crystal ICE Hiball 42cl — the IWSC-Silver serve vessel and the
   gift-pack glass, sold as generic glassware leading with "G&Ts,
   spritzes". Direction: sell it as the glass for the award serve.
4. Club ICE Tumbler 26cl — the slow-sip vessel with no serve named;
   duplicates the hiball's "textured pattern catches light" line.
5. CLUSTER: the pair ritual is invisible — all six Pair/Single glasses say
   "Buy singly or as a pair" only in seo.descriptions; no PDP body sells
   why two. The pair is the AOV lever.
6. Jigger — measures stated, ritual unsold; "home bars and busy service
   alike" hedging; four finishes with no point of view.
7. Shaker — weakest tool copy; no capacity/seal/parts spec; the
   cocktail-shakers collection stakes "Seals Every Time" and the PDP backs
   none of it; "classic recipes and new experiments alike" filler.
8. Spirit stones — function present, ritual absent; the ice-chilling
   collection's no-dilution argument never reaches the PDP; shares the
   logo-merch opener with bar blade/keyring.
9. Hip flask — best accessory copy, still no rum; seo claims
   "military-grade build" (unsubstantiated superlative brushing the
   support-the-troops register).
10. Corrected finding: `completeTheServe` IS populated on the rum (hiball,
    hurricane, tumbler — the cross-sell rail works on the flagship). It is
    null on the 6-pack and gift pack, and no accessory has a Sanity doc to
    point back. Direction: populate the two rum SKUs and add reciprocal
    accessory entries.
11. Only 3 of 18 products have Sanity enrichment (the three rum SKUs);
    every accessory renders a bare PDP (no FAQ, whatsIncluded, tip).
12. Premium Gift Pack — hype register ("ready to impress", banned
    "elevate", "any spirits enthusiast" crowd address); zero proof points;
    Shopify contents list omits the gift box its own Sanity FAQ promises —
    the sources disagree on what the customer receives.
13. Presentation Box — visibly broken HTML on the live PDP ("boxDesigned",
    "experienceIdeal", "giftingEnhances" run together) + "elevate", "truly
    gift-worthy", "unboxing experience". Fix markup first.
14. Rum PDP — the weakest rum copy on the site: "smooth caramel depth,
    warming spice, and a bold character" (tricolon), "Perfect for sipping,
    mixing, gifting" (hedging, contradicts sip-first), zero proof points.
    The spiced-rum collection copy answers everything; the PDP a click
    deeper answers nothing. Direction: rebuild from categories.ts +
    proof points.
15. Rum vs 6-pack — near-duplicate descriptions incl. verbatim
    Professional Tip and Serving Suggestions blocks; 6-pack opens "Ideal
    for parties" (not-a-party-brand line).
16. Stale producer claims in Shopify/Sanity product copy — see ACT-TODAY.
17. Image alt text null on all 30 images of all 18 products.
18. seo.title null on 10 of 18 products including the flagship.
19. Titles are spec labels ("Hiball Glass – 38cl"), inconsistent naming
    across the glass families.
20. Hurricane + jam jar sell off-catalogue drinks ("tropical cocktails",
    "outdoor events") with no route back to the rum; jam jar drifts toward
    the party register.
21. Bar blade + keyring share the logo-merch skeleton; "the tool used by
    bartenders the world over" fails the interchangeability test.
22. Slate coaster — nearly there (real why-this-one); missing serve
    context and its gift-pack role.
23. Rule-of-three constructions inside otherwise plain copy ("Fast to
    chill, easy to handle, simple to clean"; "Flat, fast and built to
    last") + an em-dash in the UK Tree Fund description.
24. seo.descriptions ending in filler labels ("Jerry Can Spirits
    barware.") on shaker, bar blade, coasters, keyring.
25. UK Tree Fund — competent copy; punctuation + seo.title only.

Duplicate clusters: rum/6-pack shared blocks; the 13-accessory Features
skeleton; bar-blade/keyring/stones logo opener; tumbler/hiball shared
sentence; all 3 Sanity product docs share the entire
process/tastingNotes/servingSuggestions block verbatim (~15 sentences).

## Provenance — complete survivor list (no cap)

Beyond the six ACT-TODAY items. Classes: [PROCESS] process claim,
[LOCATION] production location beyond "British", [PRODUCER] named producer,
[INGREDIENT] molasses/water as ours.

JSON-LD (machine-read, fix first):
- `ethos/page.tsx:55` "distilled at our British partner distillery… their
  pot stills" [PROCESS]
- `ethos/page.tsx:68-71` "copper pot stills provide extended vapour
  contact… vapour form longer, building complex esters" [PROCESS] —
  detailed and unverifiable at the new partner
- `shop/spirits/page.tsx:389,405` "blend and distil… The distillation,
  blending, spicing…" (FAQPage; visible twins :447,:461) [PROCESS]
- `faq/page.tsx:31` "pot-distilled at our British partner distillery"
  (feeds FAQPage + visible) [PROCESS]

High-exposure visible copy:
- homepage `page.tsx:234` "put it through the pot stills"; `:286` "Pot
  stilled… Extended copper contact" [PROCESS]
- `HomepageFAQ.tsx:37` comparison row Distillation: "Pot still" [PROCESS]
- ethos body `:274` "copper pot stills… Extended vapour contact. Proper
  copper interaction."; `:283-284` "ester chambers"; `:287-288` "Expert
  distillers"; `:291-292` "The copper does the work… Multiple vapour
  chambers"; `:326` "• Pot distilled"; `:112` alt text "copper pot still…
  distillation process" [PROCESS]
- product page `:723` "Distilled at our British partner distillery"
  (every spirit PDP) [PROCESS]
- `shop/spirits` metadata ×3 + body `:194` "pot-distilled" [PROCESS]

categories.ts (13) + search: lines 25, 38, 52, 64, 69, 82, 92, 145, 177,
183-184, 349, 360, 374 "pot-distilled"/"the distillation process";
`search-content.ts:38` [PROCESS].

Other src: `sustainability:185-186` "UK Distillation / Distilled at…"
[PROCESS]; `batch/page.tsx:70` "from distillation to your door" (mild);
`trade/resources/brand-story:69` "one named production partner" (no
partner is publicly named — truthfulness tension); `contact/media:988`
Q3-2025 recipe-development timeline entry (that partner was factually SoW —
borderline); Organization JSON-LD `knowsAbout: "Small-Batch Distilling"`
(borderline).

Sanity deep content: `botanicals-behind-expedition-spiced-rum` contextNote
"blended at Spirit of Wales Distillery" [PRODUCER]; "Welsh molasses" ×4 —
cocktails `the-old-standard` (description + longDescription ×2),
`expedition-punch`, `jerry-can-julep` [INGREDIENT+LOCATION];
`rum-rhum-or-ron` contextNote "Caribbean molasses-based rum" applied to our
product (founder judgement). Guide section prose verified clean — its
pot-still/molasses/Brecon hits are generic rum/gin education.

Trade surfaces verified clean (bartender guides, fact sheet, tasting
notes, brand-story: all "macerated at our British partner distillery").
Resulting verb inconsistency: consumer surfaces say "pot-distilled", trade
and VOICE canon say "macerated", for the same product.

MUST NEVER BE REINTRODUCED (regeneration guard-rails):
1. Welsh anything as ours.
2. Any named producer — Spirit of Wales (former, legal context) AND Custom
   Spirit Co / Horsham / West Sussex (current, no batch yet). Only "our
   British partner distillery".
3. Any distillation/process claim as ours: pot-distilled, pot still(s),
   copper contact/interaction, extended vapour contact, ester chambers,
   "we distil", "the distillation", "expert distillers". Approved verbs:
   macerated, blended, steeped, made, produced.
4. Any water-source claim.
5. Molasses as our ingredient or process (generic rum education stays
   permitted).
6. Any production location beyond "British"/"made in Britain".
7. Watch item: "700 numbered bottles" — 16 src copy instances + 5
   component instances; founding-era quantity not on the proof-points
   list; carry forward only with founder confirmation.

## Retired language — complete

Shopify clean; Sanity clean. src: `search-content.ts:25` ("founding
supporters" + keyword string), `Header.tsx:116` (nav description "Founding
supporters"), `privacy-policy:114`. Variants: `OrderSection.tsx:124,141`
("The founding batch" / "Founding batch. £{price}"),
`BottleCertificate.tsx:23` ("Founders and early supporters edition" —
arguably a legitimate batch-1 artefact label; founder call). The
expedition-log page itself is already clean; only the pointers are stale.

## Fact consistency — divergences from VOICE.md canon

- RRP £45: media kit + kit page state "£40.00" (wrong figure AND banned
  format); trade fact-sheet rrp_p 4000; OrderSection fallback £40. Canon
  £45 interacts with the 1 Aug price rise — founder to reconcile which
  number each surface states, and when.
- Nine botanicals: the word "nine" appears nowhere on the site. The
  botanicals guide says ten in excerpt/meta and nine in its own intro;
  lists vary 6–10 items across surfaces; "glucose syrup" (product-data,
  ingredients page) drives the ten-count; the trade-page list (allspice,
  agave) differs from categories.ts (cassia bark, clove).
- 5% of profits: four incompatible live formulations — "5% of every sale"
  (categories ×9, product page), "5-15% of net profits" (home
  `SupportingOurForces:32`), "a portion of profits" (FAQ ×2), "5% of
  annual net profits" (covenant, media). Canon: 5% of profits. Several sit
  in JSON-LD-adjacent blocks.
- Founders: `faq:94,156` "founded by a former Royal Corps of Signals
  serviceman" (SINGULAR, in FAQPage JSON-LD and visible);
  `armed-forces-covenant:153` "our founder's". Canon: two founders.
  Passport: `passport.html:197` "12+ years combined service" contradicts
  `:134` "17+ years" in the same document.
- "No investors" (story metadata ×4) vs `friends:29` "Danny Hughes, one of
  our investors and a fellow veteran". VOICE's hierarchy says "No hidden
  investors" — true; the flat form is false.
- Pre-launch copy still live: `story:535` "Still tweaking our inaugural
  rum… not yet turning a profit" — on a page carrying IWSC medals.
- 40% ABV format: `trade/page.tsx:77` "Forty percent ABV."; Sanity 6-pack
  "40% VOL". 700ml: all four Shopify rum-SKU descriptions say "70cl".
- Full-name rule (bare "Expedition Spiced" as first/only mention):
  first-pour, friends, stockists, trade landing, brand-story, all four
  trade sheets (fed by `product-data.ts:9 name: 'Expedition Spiced'`), the
  pilot page, story's meta descriptions, both award components' schemaText.
- Unverified specifics — founder to confirm before regeneration carries
  them: 700-bottle count; Black Tot Day founding (31 Jul 2025); 6 Apr 2026
  launch; 19 Jun 2026 IWSC date; "Rum & Cola serve category" naming; jerry
  can "designed in 1937 / NATO standard" vs "engineered by the Germans in
  the 1930s" (HomepageFAQ); Dan 2012-2024 / Falklands, Afghanistan,
  Estonia; Rhys 2011-2016 / F1; ERS Bronze; IWSC judges'-note verbatim;
  £840–£1,344 serve economics; Ecologi 1 tree + 1kg CO₂; "Caribbean WHITE
  rum" (canon says "Caribbean rum"); dietary absolutes; EANs/pallet specs.

## SEO exposure — what must survive regeneration

Dual-hardcoded schema blocks (rewrite must change both halves in one
commit): story FAQ (ALREADY DRIFTED from its visible twin), shop/spirits
FAQ, and three schema-only orphan FAQPages with no visible Q&A (ethos,
sustainability, ingredients). Sustainability's schema answer to "Where is
Jerry Can Spirits rum made?" conflicts with shop/spirits' answer to the
identical Question name. Story + ingredients Article descriptions mirror
their metas. Single-sourced and safe: home FAQ, faq page (bar two
hasRichAnswer overrides), collection schemas, product Sanity-fed blocks,
guides ItemList, stockists, friends.

Canonical defects/risks:
- `/shop/gift-sets/` and `/shop/gifts-and-experience/` are byte-identical
  pages from one config object (`categories.ts:378-379`), each
  self-canonical — the one true duplicate-URL defect.
- Cluster A: the "Caribbean rum base… 700 numbered bottles" skeleton ~16×
  across 8 indexable URLs; shop/spirits' intro is a near-verbatim copy of
  the spiced-rum collection's — the two pages most likely to compete for
  "british spiced rum".
- gifts-for-him / gifts-for-her: whole-page mirrors.
- Cluster C: bar-accessories vs /shop/barware shared home-bar sentences.
- Over-length titles (rendered incl. template): reviews 82, ingredients
  79, story 72, shop/spirits 70, trade 66, barware 62.

Thin content: guides landing (<50 words), reviews, clothing, bundles,
new-releases, gift-sets; in Sanity, ALL 132 ingredients (median 71 words)
and ALL 37 equipment docs (median 54) — every ingredient/equipment
longDescription is null corpus-wide. 168 of 299 CMS docs lack metas
(mitigated by code fallbacks: "{name} Guide" + description slice).
Cocktails and guides are structurally healthy on metas (zero over-length,
zero duplicates); 7 guides use excerpt = metaDescription verbatim.

Proof-point coverage (money pages):

| Page | IWSC | 17 yrs | 5% | Batch № | Botanicals | £45 |
|---|---|---|---|---|---|---|
| Home | Y | Y | wrong (5-15%) | Y | Y | N |
| Product (rum) | Y | N | Y | Y | partial | N |
| About/story | N | N | N | N | N | N |
| Trade landing | N | N | Y | N | Y | N |
| Guides landing | N | N | N | N | N | N |
| spiced-rum / shop/spirits | N | Y | partial | Y | Y | N |

The IWSC medals appear on exactly three surfaces (home PressAwards,
awarded PDPs, media page) — absent from the trade page where they sell
hardest, and from story, every collection, ethos, faq, reviews. RRP £45
appears in no customer copy anywhere. About/story and guides landing are
zero-proof money pages.

---

## The ten pages to regenerate first

1. Shopify product copy (all 18, in admin) — the three provenance-critical
   seoDescriptions + the Pot Still metafield first; then the 13 accessory
   descriptions (the audit's biggest commercial lever), the rum PDP body,
   alt text, seo.titles.
2. About/story — pre-launch language live, zero proof points, drifted FAQ
   schema, over-length title, "No investors" claim; the Pour IQ
   origin-story mention would live here.
3. Trade landing — IWSC medals absent where they sell hardest; bare
   product name; the Pour IQ block decision.
4. Home — two-CTA hero, hedging formula, FieldManualPreview stock copy,
   "5-15%", reason-to-act stated three times.
5. Ethos — the heaviest concentration of process claims (copper / vapour /
   esters ×6) including an orphaned schema-only FAQPage.
6. shop/spirits + the spiced-rum collection — near-duplicate intros
   competing for the money query; dual-hardcoded FAQ; pot-distilled ×4.
7. FAQ page — singular-founder error in JSON-LD, exclamations,
   pot-distilled, "portion of profits".
8. categories.ts corpus — Cluster A dedup, 13 pot-distilled instances, the
   gift-sets duplicate URL, retired-language pointers.
9. Sanity: st-davids + botanicals guides — the Brecon Beacons sentence,
   the SoW contextNote, ten-vs-nine self-contradiction; plus the
   seasonal-excerpt formula across 7 guides.
10. Sanity systemics — the ~579 em-dashes (mechanical sweep), the
    professionalTip template (96 docs), the Fever-Tree supplier copy
    (~24 docs).

## Off-repo surfaces for the next pass

Klaviyo email flows (repo feeds: the "Referral Link Generated" event
payload display text in the order webhook; signup `interests` values) ·
the bottle label · the QR thank-you video script · social templates ·
Shopify admin copy beyond products: transactional notification emails,
checkout/redirect theme copy on shop.jerrycanspirits.co.uk · Shopify
metafield values (only `distillation_method` was audited; the other
`specifications/*` values render as spec rows and were not swept) · the
Ecologi profile page · Trustpilot/Google review responses.
