# Meta Description Audit: Design Document

**Date:** 2026-03-10
**Scope:** Full audit and fix of all meta descriptions across the Next.js site, plus a Shopify SEO checklist.
**Target:** Every public page description 110-160 characters. Consistent Jerry Can Spirits brand voice throughout. No em-dashes, no "Premium" as standalone claim, no generic copy.

---

## Categories of Work

### A — Length fixes to existing descriptions

| File | Current chars | Issue |
|---|---|---|
| `src/app/faq/page.tsx` | 92 | Too short |
| `src/app/shop/page.tsx` | 95 | Too short |
| `src/app/reviews/page.tsx` | 167 | Too long |
| `src/app/shop/drinks/page.tsx` | 167 | Too long |
| `src/app/shop/spirits/page.tsx` | 172 | Too long + em-dash |
| `src/app/ingredients/page.tsx` | 163 | Too long |
| `src/app/ingredients/expedition-spiced-rum/page.tsx` | 163 | Too long |

### B — Brand voice rewrites (correct length, generic copy)

| File | Issue |
|---|---|
| `src/app/shop/barware/page.tsx` | Uses "Premium" (on avoid list) |
| `src/app/field-manual/equipment/page.tsx` | Generic copy, not brand voice |
| `src/app/field-manual/ingredients/page.tsx` | Generic copy, not brand voice |
| `src/app/field-manual/cocktails/page.tsx` | Generic copy, not brand voice |
| `src/app/guides/page.tsx` | Generic copy, not brand voice |

### C — Missing metadata on client component pages

These pages are `'use client'` components and cannot export `metadata`. Fix: create a `layout.tsx` in each route's folder — Next.js uses the closest parent layout's metadata when a page cannot export its own.

| Route | Fix |
|---|---|
| `/contact/` | Update existing `src/app/contact/layout.tsx` to export metadata |
| `/contact/media/` | Create `src/app/contact/media/layout.tsx` |
| `/contact/complaints/` | Create `src/app/contact/complaints/layout.tsx` (noindex) |
| `/contact/enquiries/` | Create `src/app/contact/enquiries/layout.tsx` |

### D — Dynamic fallback fixes

| File | Issue | Fix |
|---|---|---|
| `src/app/shop/[collection]/page.tsx` | Fallback template too short for short collection names (~79 chars for "Barware") | Rewrite template |
| `src/app/field-manual/equipment/[slug]/page.tsx` | No `.slice(0, 160)` cap on `equipment.description` fallback | Add cap |

---

## Approved Descriptions

### A — Length fixes

**`/faq/`** (126 chars)
> Common questions about Jerry Can Spirits. Ingredients, shipping, age verification, cocktail recipes, and everything in between.

**`/shop/`** (130 chars)
> Shop Jerry Can Spirits. Expedition Spiced Rum, cocktail shaker sets, glassware, and expedition gear. Veteran-owned, built properly.

**`/reviews/`** (154 chars)
> Customer reviews of Jerry Can Spirits Expedition Spiced Rum on Trustpilot, Google and Yell. See what people say about our veteran-owned British spiced rum.

**`/shop/drinks/`** (143 chars)
> Small-batch British spiced rum from veteran-owned Jerry Can Spirits. Pot-distilled at Spirit of Wales. Rich vanilla, warm spices, smooth finish.

**`/shop/spirits/`** (153 chars)
> Veteran-owned British craft spirits, small-batch and built properly. Currently: Expedition Spiced Rum, pot-distilled at Spirit of Wales, real ingredients.

**`/ingredients/`** (153 chars)
> Full ingredient lists for Jerry Can Spirits rum. What goes into Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.

**`/ingredients/expedition-spiced-rum/`** (157 chars)
> What is rum spiced with? Expedition Spiced Rum uses Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia bark and agave in Caribbean rum.

---

### B — Brand voice rewrites

**`/shop/barware/`** (130 chars)
> Cocktail shaker sets, bar tools, and glassware for crafting rum cocktails at home. Everything you need to build a proper home bar.

**`/field-manual/equipment/`** (155 chars)
> Bar tools and equipment for serious home bartenders. Guides on cocktail shakers, strainers, glassware, and everything else that earns its place on the bar.

**`/field-manual/ingredients/`** (145 chars)
> Ingredient guides for bartenders who want to know what they're working with. Spirits, liqueurs, mixers, bitters, and garnishes, explained properly.

**`/field-manual/cocktails/`** (154 chars)
> Cocktail recipes from the Jerry Can Spirits Field Manual. From the simple to the technical, each recipe built around real ingredients and proper technique.

**`/guides/`** (145 chars)
> Spirits guides and rum education from Jerry Can Spirits. Cocktail techniques, ingredient deep-dives, and the knowledge to build a proper home bar.

---

### C — New metadata for contact pages

**`/contact/`** (126 chars) — index
> Get in touch with Jerry Can Spirits. Questions about our rum, press and media enquiries, or just want to know more. We're here.

**`/contact/media/`** (148 chars) — index
> Press assets, product photography, brand guidelines, and media contact for Jerry Can Spirits. Everything a journalist or stockist needs in one place.

**`/contact/complaints/`** (124 chars) — **noindex**
> Submit a complaint or report an issue with your Jerry Can Spirits order. We take every concern seriously and resolve it quickly.

**`/contact/enquiries/`** (135 chars) — index
> Send a general enquiry to Jerry Can Spirits. Questions about Expedition Spiced Rum, trade and wholesale, stockists, or upcoming events.

---

### D — Dynamic fallback templates

**`/shop/[collection]/`** new template (131 chars for "Barware"):
```
`Shop ${title} from Jerry Can Spirits. Veteran-owned British rum, cocktail barware, and expedition gear. Built properly, no shortcuts.`
```

**`/field-manual/equipment/[slug]/`**: Add `.slice(0, 160)` cap:
```typescript
description: equipment.metaDescription || equipment.description?.slice(0, 160)
```

---

## Shopify SEO Checklist

These descriptions go in **Shopify Admin > Products > [product] > Search engine listing > Meta description**.

The product page uses `product.seo?.description` first — so setting this field in Shopify overrides everything.

### Known products

**Expedition Spiced Rum** (`jerry-can-spirits-expedition-spiced-rum`) — 160 chars
> Expedition Spiced Rum by Jerry Can Spirits. 40% ABV, 700ml. Madagascan vanilla, Ceylon cinnamon, ginger, orange peel. Veteran-owned, pot-distilled in Wales.

**Premium Gift Pack** (`jerry-can-spirits-premium-gift-pack`) — update with actual pack contents
> Jerry Can Spirits gift pack. Expedition Spiced Rum plus [contents]. Veteran-owned British spiced rum, pot-distilled at Spirit of Wales, real ingredients.

**Expedition Pack — 6 Bottles** (`jerry-can-spirits-expedition-pack-spiced-rum-6-bottles`) — 150 chars
> Six bottles of Expedition Spiced Rum. 40% ABV, 700ml each. Veteran-owned British spiced rum, pot-distilled in Wales with real botanicals. No shortcuts.

**Stainless Steel Jigger** (`stainless-steel-jigger`) — 154 chars
> Stainless steel jigger from Jerry Can Spirits. Precision-weighted, dual measure. Built for cocktail making at home. Compact, easy to clean, built to last.

**Stainless Steel Hip Flask 500ml** (`stainless-steel-hip-flask-500ml`) — 157 chars
> Stainless steel hip flask, 500ml. From Jerry Can Spirits. Leak-proof, military-grade build. Compact enough for a jacket pocket, durable enough for the field.

### For any other products
Follow this pattern:
- Lead with the product name and key spec (size, material, ABV where relevant)
- Include one functional benefit
- Close with a brand signal (veteran-owned, built properly, real ingredients, no shortcuts)
- 110-160 chars, no em-dashes, no "Premium" as standalone

---

## Files Changed Summary

| File | Change type |
|---|---|
| `src/app/faq/page.tsx` | Update description |
| `src/app/shop/page.tsx` | Update description |
| `src/app/reviews/page.tsx` | Update description |
| `src/app/shop/drinks/page.tsx` | Update description |
| `src/app/shop/spirits/page.tsx` | Update description |
| `src/app/shop/barware/page.tsx` | Update description |
| `src/app/ingredients/page.tsx` | Update description |
| `src/app/ingredients/expedition-spiced-rum/page.tsx` | Update description |
| `src/app/field-manual/equipment/page.tsx` | Update description |
| `src/app/field-manual/ingredients/page.tsx` | Update description |
| `src/app/field-manual/cocktails/page.tsx` | Update description |
| `src/app/guides/page.tsx` | Update description |
| `src/app/contact/layout.tsx` | Add metadata export |
| `src/app/contact/media/layout.tsx` | Create with metadata |
| `src/app/contact/complaints/layout.tsx` | Create with metadata (noindex) |
| `src/app/contact/enquiries/layout.tsx` | Create with metadata |
| `src/app/shop/[collection]/page.tsx` | Improve fallback template |
| `src/app/field-manual/equipment/[slug]/page.tsx` | Add slice cap to fallback |
