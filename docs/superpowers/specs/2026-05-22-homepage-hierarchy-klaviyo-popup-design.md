# Homepage Hierarchy + Klaviyo Popup — Design

**Date:** 2026-05-22
**Branch:** `spec/homepage-hierarchy-klaviyo-popup`
**Status:** Draft, pending user review

---

## Summary

Restructure the homepage to lead with trust before the buy ask, replace the
`£35` founding-supporter discount framing with a premium positioning, and
introduce a Klaviyo popup whose lead magnet is a Field Manual PDF rather than
a 10% discount code. Done in three PRs, plus parallel non-code work in the
Klaviyo dashboard.

## Background

Trade feedback (external review) flagged:

1. Hero bottle was not clickable. **Already fixed** in PR #712 (out of scope here).
2. Weak homepage hierarchy — social proof buried at the bottom.
3. Discount-led pricing conflicts with premium positioning.
4. No email-capture popup; lead magnet missing.

Independent decisions taken before this spec:

- Founding Supporter price (`£35`) ends Monday 2026-05-25; product price returns to RRP `£40`. No site-wide announcement — quiet transition.
- Discount removed; "Founding Supporter" identity (numbered first batch, registry) preserved without the price framing.

## Goals

1. Visitors meet social proof within the first scroll, not at the page bottom.
2. Premium positioning is consistent — no price-led messaging in the hero, no
   `£X off` framing.
3. Email capture grows the list with a content-based magnet (no discount).
4. All "pre-order" language and structured data is replaced with "shop / live"
   equivalents, because the brand is live and shipping.

### Success criteria

- Homepage builds Trustpilot rating + Press & Awards above the fold or
  immediately on first scroll.
- Newsletter section (inline) and popup both promise the same lead magnet
  (the Field Manual PDF). No `£X off` copy anywhere.
- AnnouncementBar, media kit, structured data, and `llms.txt` no longer say
  "pre-order".
- `OrderSection` component name reflects current state (not `PreOrderSection`).

## Non-Goals

- `viewedItem` Klaviyo tracking on product pages (separate PR, ~15 min)
- Trustpilot review-request flow (Klaviyo dashboard, owner: Dan)
- Customer photo grid on homepage (waiting on UGC volume)
- Founding Supporter registry page (innovation backlog)
- Shopify metafield rename (`custom.pre_order_sold` stays — data migration cost > benefit; key is invisible to users)
- Square POS / Pour IQ work

---

## Design — Homepage Hierarchy

### Final section order in `src/app/page.tsx`

1. `HeroSection` (no `£35` line; clickable bottle from PR #712)
2. `PullQuoteStrip` *(new)*
3. `FounderStorySnippet`
4. `WhyJerryCan`
5. `PairedSocialProof` *(new — composes `TrustpilotWidget` + `PressAwards`)*
6. `OrderSection` *(renamed from `PreOrderSection`; Monday price applied)*
7. `SupportingOurForces`
8. `HomepageExpeditionMap`
9. `FieldManualPreview`
10. `HomepageFAQ`
11. Newsletter section (PDF magnet copy)
12. SEO content section

### New components

#### `src/components/PullQuoteStrip.tsx`

Server component. No JS. Renders two hardcoded review quotes in a two-column
grid (stacks on mobile under 720px). Sits directly under the hero.

**Quotes (locked):**

> "A cut above. Don't discuss top end rum without mentioning Expedition Spiced."

> "You can really see the work that's gone behind this beautiful drink."

Each quote shows: opening curly quote mark, the quote in serif type, 5-star
glyph + "Verified customer · Trustpilot" attribution. A small "Read all
reviews on Trustpilot →" link sits at the foot of the section.

The first quote is lightly trimmed from the verbatim review for length —
original: *"Absolutely special flavour. Nothing on the market tastes like
this. First off the quality on the bottle and label are a cut above and
nowhere should anyone discuss top end rum without mentioning expedition
spiced."* Trim preserves meaning.

#### `src/components/PairedSocialProof.tsx`

Server component. Composes `TrustpilotWidget` and `PressAwards` into a single
section with one shared subhead. Does not refactor either child component;
existing files stay untouched. Replaces the bottom-of-page Trustpilot
placement.

### Modified components

#### `src/components/HeroSection.tsx`

Remove the price block at lines 87–94 (`Founding Supporter price: £35.
Orders are being fulfilled and shipped.`). Replace with brand-aligned tagline
block, copy:

> **Now Shipping**
> Numbered first batch. Limited to 700.

No price mention.

#### `src/components/OrderSection.tsx` (renamed from `PreOrderSection.tsx`)

- Fallback `bottlePrice = '40'` (was `'35'`)
- Fallback `bottleCompareAtPrice = null` (was `'45'`)
- Function rename `getPreOrderData` → `getOrderData`
- Component rename per filename
- Copy at line 124: `"700 bottles. Each one numbered. Founding Supporter pricing."` → `"700 bottles. Each one numbered. The founding batch."`
- Copy at line 141: `"Founding Supporter price: £{bottlePrice}"` → `"Founding batch. £{bottlePrice} per bottle."`

#### `src/components/OrderProgressBar.tsx` (renamed from `PreOrderProgressBar.tsx`)

Rename props interface `PreOrderProgressBarProps` → `OrderProgressBarProps`.
No behaviour change.

#### `src/components/AnnouncementBar.tsx`

Copy rewrite at lines 57–63:

Main text span:

> **Expedition Spiced Rum.** Numbered first batch, limited to 700 | Shipping now

CTA span (replaces "Pre-order Now"): **Shop Now**

Drops the "April 2026" reference (it's May). Keeps scarcity signal. Pipe
separator matches the existing visual pattern in the bar.

#### `src/app/page.tsx`

- Reorder section composition per the list above
- Remove `<TickerStrip ... />` import and usage (component file kept — may be reused later)
- Remove the conditional `{new Date() >= new Date('2026-04-06T00:00:00Z') && (...)}` at line 321 — launch is in the past, gate is dead code
- Update import: `PreOrderSection` → `OrderSection`
- Newsletter section copy rewrite at lines 230–235:
  - Headline: `"10% off your first order."` → `"The Field Manual sampler."`
  - Body: `"Sign up and we will send you a 10% discount code."` → `"Three signature recipes, the serving ritual, and a tasting note card. Yours when you join the expedition."`

#### `src/app/shop/product/[handle]/page.tsx`

Line 344: `'https://schema.org/PreOrder'` → `'https://schema.org/OutOfStock'`.
SEO signal — when a variant goes out of stock now, it's sold out, not
pre-order.

Internal variable `preorderSoldMeta` (lines 240, 252) → `bottlesSoldMeta`.
The Shopify metafield key stays `custom.pre_order_sold` (data layer).

#### `src/app/contact/media/page.tsx`

Line 1025: `"Pre-orders before launch"` → `"Launched April 2026"`.

#### `public/llms.txt`

Line 47: `"brand story, pre-order options, and field manual preview"` → `"brand story, shop, and field manual preview"`.

#### `src/lib/shopify-webhooks.ts`

Function rename `incrementPreOrderSold` → `incrementBottlesSold`. Variables
referencing the metafield key (`pre_order_sold`) stay as-is (the key itself
doesn't change).

#### `src/app/api/webhooks/shopify/route.ts`

Import + call site update to `incrementBottlesSold`.

#### `tests/e2e/shop.spec.ts`

Update `describe` and `it` blocks at lines 72, 118–127 to use "order" /
"shop" language. Update assertions that match `/pre-order|coming soon/i` to
match the new copy.

---

## Design — Klaviyo Popup + Lead Magnet

### The popup

**Built in Klaviyo dashboard, not code.** The Klaviyo SDK is already loaded
via `src/components/KlaviyoScript.tsx` with Cookiebot consent gating. Once a
form is published, it appears automatically.

- **Type:** popup (Klaviyo Sign-Up Forms → popup)
- **Trigger:** exit intent on desktop + scroll past 50% on all devices
- **Frequency cap:** suppress for 7 days if dismissed; never show again if
  submitted
- **Suppression cookie:** also suppress if `jcs_newsletter_signup=1` cookie
  is set (set by inline `NewsletterSignup.tsx:38` on submission). Configure
  via Klaviyo's first-party cookie targeting
- **Subscribes to:** new list `field-manual-sampler` (not the existing
  `RcxQRP` inline-form list). Better attribution and segmentation
- **Field:** email only (skip first name — capture later via flow)

### Popup copy

- Headline: **"The Field Manual sampler."**
- Subhead: "Three recipes. The serving ritual. A tasting note card. Yours when you join the expedition."
- Field: email
- Button: **"Send it over"**
- Fineprint: "One email a month. Unsubscribe any time."

### The flow

Built in Klaviyo Flows. Triggered by new subscriber to `field-manual-sampler`
list:

1. **Email 1 (immediate):** *"Your Field Manual companion"* — direct
   download link to the PDF, ~80 words of welcome, signed by Dan and Rhys
2. **Email 2 (3 days later):** *"Tried the Old Standard?"* — prompts back
   to the Field Manual cocktail page for the full recipe
3. **Email 3 (10 days later):** transition to main newsletter list
   (`RcxQRP`). Asks if they want to stay subscribed

Profile gets tag `lead-magnet:field-manual-sampler` for future segmentation.

### Code touchpoints for the popup

- **None for the popup itself** — Klaviyo SDK already loaded
- Inline newsletter section copy rewrite (covered in `src/app/page.tsx`
  changes above)
- `NewsletterSignup.tsx` constant `NEWSLETTER_LIST_ID = 'RcxQRP'` stays — the inline form keeps that list; only the popup uses the new `field-manual-sampler` list

---

## PDF Content Brief

**Title:** *The Field Manual: First Pour Companion*
**Format:** A5 portrait (148 × 210 mm), 8 pages, 2–3 MB target, embedded fonts
**Hosting:** Cloudflare R2 at `pdf.jerrycanspirits.co.uk/field-manual-first-pour-v1.pdf` (versioned filename)
**Source of truth (markdown):** `docs/lead-magnet/field-manual-first-pour-companion.md` (to be drafted)

### Page-by-page

| Page | Content                  | Source                                                   |
|------|--------------------------|----------------------------------------------------------|
| 1    | Cover                    | Fresh — title, subline, JCS mark, batch reference        |
| 2    | Foreword (signed)        | Fresh — ~120 words, brand voice, Dan & Rhys              |
| 3    | The serving ritual       | Adapted from `botanicals-behind-expedition-spiced-rum.md`|
| 4    | The Old Standard         | Sanity `/field-manual/cocktails/the-old-standard`        |
| 5    | Storm & Spice            | Sanity `/field-manual/cocktails/storm-and-spice`         |
| 6    | Explorers Gold (Rum & Honey) | Sanity `/field-manual/cocktails/explorers-gold-rum-and-honey` |
| 7    | Tasting note card        | Fresh — printable, recurring-use design                  |
| 8    | Back cover               | Brand line, Trustpilot + Instagram, single CTA           |

Each recipe page ends with: *"Full notes at jerrycanspirits.co.uk/field-manual/cocktails/[slug]"* — drives traffic back to the on-site Field Manual and supports SEO (especially Explorers Gold — Rum & Honey, 3,600 vol target).

### Voice constraints

Per `CLAUDE.md`:
- No em-dashes, no emojis, no exclamation marks unless quoted speech
- No hype language (grab, smash, epic, amazing, incredible, game-changer)
- Short sentences. White space respected
- Recipes use imperative-direct ("Pour 50ml...")

### Deliverable

Single markdown file with every word of the 8 pages, in order. User and
co-founder do one editorial pass, then lay it out in Canva or InDesign.

---

## Implementation Plan — Three PRs

### PR A — Live state cleanup + Monday price switch

**Must merge before Monday 2026-05-25 morning. Shopify variant update happens at the same moment as the merge.**

Scope:
- Component renames: `PreOrderSection` → `OrderSection`, `PreOrderProgressBar` → `OrderProgressBar`, internal symbols
- Server function rename: `incrementPreOrderSold` → `incrementBottlesSold`
- Hero copy: remove `£35` price block, replace with "Now Shipping. Numbered first batch. Limited to 700."
- Fallback prices in `OrderSection.tsx`: 35→40, compareAt 45→null
- Founding Supporter price-framing copy updates throughout `OrderSection.tsx`
- `AnnouncementBar.tsx`, `contact/media/page.tsx`, `llms.txt` copy updates
- Structured data: `schema.org/PreOrder` → `schema.org/OutOfStock`
- E2E test description and assertion updates
- Update import in `src/app/page.tsx` to use `OrderSection`

Shopify side (Dan, separately, at same moment):
- Update Expedition Spiced Rum variant: price `35` → `40`, clear `compareAtPrice`
- Audit any Klaviyo email flows for "£35" copy and update

Verification: build, typecheck, run E2E, hard-refresh production after
variant update to confirm displayed price matches.

### PR B — Homepage hierarchy redesign

**Ships after PR A merges. No Monday-morning urgency.**

Scope:
- New: `src/components/PullQuoteStrip.tsx` (hardcoded pair locked in this spec)
- New: `src/components/PairedSocialProof.tsx` (composes existing widgets)
- `src/app/page.tsx` section reorder per spec
- Remove `TickerStrip` usage (file kept)
- Remove Trustpilot date gate at line 321

Verification: build, typecheck, dev server walk-through, confirm new section
order, confirm pull-quote strip renders correctly desktop and mobile, confirm
Trustpilot widget still loads in new position, Lighthouse check that LCP
hasn't regressed.

### PR C — PDF magnet inline newsletter copy

**Ships only after PDF + Klaviyo flow are live in dashboard.**

Scope:
- Rewrite newsletter section copy in `src/app/page.tsx:230–235` from "10% off" to PDF magnet wording (matches popup)
- No other code changes

Verification: dev server, submit inline form with test email, confirm signup
completes, confirm Klaviyo flow fires the welcome email with PDF link.

### Parallel non-code work (Dan, in Klaviyo dashboard)

- Create `field-manual-sampler` list
- Build popup form with exit-intent + 50% scroll trigger
- Build 3-email flow (PDF welcome, day-3 prompt, day-10 transition)
- Upload PDF to Cloudflare R2 + configure custom subdomain `pdf.jerrycanspirits.co.uk`
- Confirm Shopify ↔ Klaviyo integration is connected (checkout events)
- Audit existing Klaviyo flows for `£35` copy

### Parallel content work (Claude, in repo)

- Draft `docs/lead-magnet/field-manual-first-pour-companion.md` — full markdown of all 8 pages, recipes pulled from Sanity, fresh foreword and tasting card

---

## Future Considerations

- **PDF designer:** Canva (Dan) or designer? Out of scope for this spec; affects timeline only.
- **PDF v2 cadence:** when to refresh recipes. Recommend annual or per-batch.

---

## Out of Scope

- `viewedItem` Klaviyo tracking on product pages
- Trustpilot review-request Klaviyo flow
- Post-purchase customer-photo request email (separate Klaviyo flow work)
- Customer photo grid on homepage (waiting on UGC volume)
- Founding Supporter registry page
- Shopify metafield rename
- Pour IQ / trade portal work
