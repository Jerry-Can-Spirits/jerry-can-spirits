# Design Spec: /trade Landing Page

**Date:** 2026-03-23
**Status:** Approved for implementation

---

## Overview

A dedicated trade landing page at `/trade/` that speaks to bar owners, restaurant managers, and hotel F&B buyers. The page operates as a separate experience from the consumer site — same brand, different audience. It presents the economics of stocking Expedition Spiced Rum, the partnership terms, and a structured enquiry form that feeds Klaviyo.

The voice matches the rest of the site: measured, grounded, direct. No pitch-deck energy. No hype. A founder talking to someone they respect.

---

## Page Structure

### Section 1 — Hero

**Purpose:** Establish who this page is for and set the tone immediately.

**Headline:** "For Venues That Hold Themselves to a Higher Standard"

**Subtext (1–2 sentences):** Briefly states what Expedition Spiced is, that this page is for trade buyers, and that the conversation starts with an enquiry. No CTA button here — let the page earn it.

**Visual:** Dark, consistent with the rest of the site. No bottle imagery forced in — let the text carry the section.

---

### Section 2 — Why It Works Behind the Bar

**Purpose:** Give bar staff and owners the story they need to sell the product.

Three short statements (not a bullet list — rendered as individual text blocks or cards):

1. **A story worth telling** — Veteran-founded, British, no shortcuts, real ingredients. Customers ask questions. That's a conversation your staff can have.
2. **Built for mixing and sipping** — Vanilla, cinnamon, allspice, orange peel, ginger, cassia, agave, bourbon oak. Complex enough to stand alone. Structured enough for cocktails.
3. **5% of every bottle to military charities** — Something your customers can feel good about ordering.

These are not bullet points — each gets a heading and one or two sentences of prose.

---

### Section 3 — What You're Working With

**Purpose:** Honest serve economics, framed as useful context not a sales argument.

A quiet visual block — not a table, more like a factual summary:

- A case is 6 bottles, 700ml each, 40% ABV
- A standard 25ml serve yields approximately 28 serves per bottle — around 168 serves per case
- Suggested serve price: £8–£12 depending on your venue
- That puts a case's revenue potential between £1,344 and £2,016

Framing note: copy says something like "Here is what you are working with" — not "Here is the profit you will make." The numbers speak for themselves.

---

### Section 4 — Pricing

**Purpose:** Transparent trade pricing, cleanly presented, ex VAT with inc VAT shown alongside.

A three-row table:

| Tier | Per Bottle (ex VAT) | Per Case (ex VAT) | Inc VAT | When |
|---|---|---|---|---|
| Intro | ~£25 | £150 | £180 | First order |
| Standard | ~£29 | £175 | £210 | Ongoing orders |
| Partner | ~£25–£27 | £150–£160 | £180–£192 | High-volume, earned |

Notes below the table:
- Cases of 6 bottles
- Delivery terms confirmed on enquiry
- Partner pricing is not applied automatically — it reflects a track record of sell-through and active placement

One sentence framing: "We price to reward relationships, not just transactions."

---

### Section 5 — What Works Well for Both Sides

**Purpose:** Set soft partnership expectations without a checklist or conditions.

Short prose section — no bullet list. Something like:

> We do not send bottles out to sit on a back shelf. When it works, it works because both sides are invested. What we have found helps: listing Expedition Spiced by name on your menu, building one serve around it, and letting us know how it lands. We are happy to help with serve suggestions, menu wording, or a visit from the founders if you are local to us.

Tone: collaborative, personal, not corporate. The founders are reachable — that is a differentiator.

---

### Section 6 — Enquiry Form

**Purpose:** Structured enough to start a real conversation, short enough not to put people off.

**Fields:**
- Your name (text, required)
- Email address (email, required)
- Venue name (text, required)
- Venue type (select: Bar / Restaurant / Hotel / Other, required)
- Approximate covers (select: Under 50 / 50–150 / 150–300 / 300+, required)
- Anything else you want to tell us (textarea, optional)
- Honeypot field (hidden, existing pattern)

**Submission behaviour:**
- Posts to `/api/contact/` with `formType: 'trade'`
- Extra fields passed as properties: `venue_name`, `venue_type`, `covers`
- Klaviyo event name: `'Trade Enquiry'`
- Success message: "Received. We will be in touch within two working days."
- Error message: "Something went wrong. Email us directly at trade@jerrycanspirits.co.uk"

---

## API Changes Required

**File:** `src/app/api/contact/route.ts`

1. Add `'trade'` to the `formType` union in `ContactFormData`
2. Add `venue_name`, `venue_type`, `covers` as optional fields on `ContactFormData`
3. Add `venue_name`, `venue_type`, `covers` as optional fields on `EventProperties`
4. Make the existing `!name || !email || !subject || !message` validation guard `formType`-aware:
   - For `formType === 'trade'`: require `name`, `email`, `venue_name`, `venue_type`, `covers` — `subject` and `message` are not required
   - For all other form types: existing validation unchanged
5. In the `case 'trade':` switch branch:
   - `eventName = 'Trade Enquiry'`
   - `properties.subject = 'Trade Enquiry'` (hardcoded — no subject field on trade form)
   - `properties.inquiry_type = 'trade'`
   - Store `venue_name`, `venue_type`, `covers` on properties if present
6. `message` for trade submissions maps to an optional "anything else" note — pass through if provided, omit if not

---

## New Files

- `src/app/trade/page.tsx` — Server component, static metadata, renders sections
- `src/components/TradeEnquiryForm.tsx` — Client component, form state, posts to API

---

## Metadata

```
title: 'Stock Expedition Spiced Rum | Trade Enquiries | Jerry Can Spirits'
description: 'Trade pricing, serve economics and partnership information for bars, restaurants and hotels. Enquire to stock Expedition Spiced Rum.'
canonical: 'https://jerrycanspirits.co.uk/trade/'
```

No index robots restriction — this page should be discoverable.

---

## Navigation

- Add a quiet "Trade" link to the site footer (not main nav — keeps the consumer experience clean)
- Update `src/app/stockists/page.tsx` line ~140: change the "Trade Enquiries" CTA `href` from `/contact/enquiries/` to `/trade/`

---

## Out of Scope

- Shopify B2B / gated trade login (future phase)
- Automated Klaviyo reorder flows (future phase)
- Bar of the month feature (future phase)
- Downloadable POS assets (future phase)
