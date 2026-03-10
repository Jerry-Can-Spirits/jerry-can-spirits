# Meta Description Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring every public page's meta description to 110-160 chars with consistent Jerry Can Spirits brand voice, and add missing metadata to four contact sub-pages.

**Architecture:** All changes are `metadata` string updates in existing page.tsx/layout.tsx files, two new layout.tsx files for contact sub-pages that are client components, and two small logic fixes in dynamic `generateMetadata` functions. No structural changes.

**Tech Stack:** Next.js 15 App Router, TypeScript. No new dependencies.

---

## Worktree Setup

```bash
# Check for existing worktree directory
ls -d .worktrees 2>/dev/null || echo "NOT_FOUND"

# Verify it's gitignored
git check-ignore -q .worktrees && echo "IGNORED" || echo "NOT IGNORED - add to .gitignore first"

# Create worktree on a new branch
git worktree add .worktrees/meta-desc-audit -b feat/meta-description-audit

cd .worktrees/meta-desc-audit
npm install
```

Verify baseline: `npm run build` should pass with 0 type errors before making any changes.

---

## Task 1: Fix `/faq/`, `/shop/`, `/reviews/` descriptions

**Files:**
- Modify: `src/app/faq/page.tsx`
- Modify: `src/app/shop/page.tsx`
- Modify: `src/app/reviews/page.tsx`

**Step 1: Update /faq/ description**

In `src/app/faq/page.tsx`, replace:
```
description: "Common questions about Jerry Can Spirits, shipping, ingredients, and cocktail recipes.",
```
With:
```
description: "Common questions about Jerry Can Spirits. Ingredients, shipping, age verification, cocktail recipes, and everything in between.",
```

**Step 2: Update /shop/ description**

In `src/app/shop/page.tsx`, replace:
```
description: "Browse all Jerry Can Spirits collections. Expedition Spiced Rum, barware, glassware, clothing and more.",
```
With:
```
description: "Shop Jerry Can Spirits. Expedition Spiced Rum, cocktail shaker sets, glassware, and expedition gear. Veteran-owned, built properly.",
```

**Step 3: Update /reviews/ description**

In `src/app/reviews/page.tsx`, replace:
```
description: "Read customer reviews of Jerry Can Spirits Expedition Spiced Rum on Trustpilot, Google and Yell. See what people say about our veteran-owned, small-batch craft spirits.",
```
With:
```
description: "Customer reviews of Jerry Can Spirits Expedition Spiced Rum on Trustpilot, Google and Yell. See what people say about our veteran-owned British spiced rum.",
```

**Step 4: Verify build**

```bash
npm run build
```
Expected: compiles with 0 type errors.

**Step 5: Commit**

```bash
git add src/app/faq/page.tsx src/app/shop/page.tsx src/app/reviews/page.tsx
git commit -m "fix: correct meta description length on faq, shop and reviews pages"
```

---

## Task 2: Fix `/shop/drinks/`, `/shop/spirits/`, `/shop/barware/` descriptions

**Files:**
- Modify: `src/app/shop/drinks/page.tsx`
- Modify: `src/app/shop/spirits/page.tsx`
- Modify: `src/app/shop/barware/page.tsx`

**Step 1: Update /shop/drinks/ description**

In `src/app/shop/drinks/page.tsx`, replace the current description (167 chars) with:
```
description: "Small-batch British spiced rum from veteran-owned Jerry Can Spirits. Pot-distilled at Spirit of Wales. Rich vanilla, warm spices, smooth finish.",
```

**Step 2: Update /shop/spirits/ description**

In `src/app/shop/spirits/page.tsx`, replace the current description (172 chars, contains em-dash) with:
```
description: "Veteran-owned British craft spirits, small-batch and built properly. Currently: Expedition Spiced Rum, pot-distilled at Spirit of Wales, real ingredients.",
```

**Step 3: Update /shop/barware/ description**

In `src/app/shop/barware/page.tsx`, replace the current description (uses "Premium") with:
```
description: "Cocktail shaker sets, bar tools, and glassware for crafting rum cocktails at home. Everything you need to build a proper home bar.",
```

**Step 4: Also update the openGraph description fields** in each of these files to match the new descriptions exactly. The `openGraph.description` field is typically a slightly shorter version — use the same string, it fits within OG limits.

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add src/app/shop/drinks/page.tsx src/app/shop/spirits/page.tsx src/app/shop/barware/page.tsx
git commit -m "fix: correct meta description length and remove brand violations on shop collection pages"
```

---

## Task 3: Fix `/ingredients/` and `/ingredients/expedition-spiced-rum/` descriptions

**Files:**
- Modify: `src/app/ingredients/page.tsx`
- Modify: `src/app/ingredients/expedition-spiced-rum/page.tsx`

**Step 1: Update /ingredients/ description**

In `src/app/ingredients/page.tsx`, replace:
```
description: "Full ingredient lists for Jerry Can Spirits rum. See what goes into our Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.",
```
With:
```
description: "Full ingredient lists for Jerry Can Spirits rum. What goes into Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.",
```

**Step 2: Update /ingredients/expedition-spiced-rum/ description**

In `src/app/ingredients/expedition-spiced-rum/page.tsx`, replace:
```
description: "What is rum spiced with? Our Expedition Spiced Rum uses Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia bark, and agave in Caribbean rum.",
```
With:
```
description: "What is rum spiced with? Expedition Spiced Rum uses Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia bark and agave in Caribbean rum.",
```

**Step 3: Update openGraph.description fields** in both files to match.

**Step 4: Verify build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add src/app/ingredients/page.tsx src/app/ingredients/expedition-spiced-rum/page.tsx
git commit -m "fix: trim ingredients page meta descriptions to under 160 chars"
```

---

## Task 4: Brand voice rewrites — Field Manual listing and guides pages

**Files:**
- Modify: `src/app/field-manual/equipment/page.tsx`
- Modify: `src/app/field-manual/ingredients/page.tsx`
- Modify: `src/app/field-manual/cocktails/page.tsx`
- Modify: `src/app/guides/page.tsx`

**Step 1: Update /field-manual/equipment/ description**

Replace existing description with:
```
description: "Bar tools and equipment for serious home bartenders. Guides on cocktail shakers, strainers, glassware, and everything else that earns its place on the bar.",
```

**Step 2: Update /field-manual/ingredients/ description**

Replace existing description with:
```
description: "Ingredient guides for bartenders who want to know what they're working with. Spirits, liqueurs, mixers, bitters, and garnishes, explained properly.",
```

**Step 3: Update /field-manual/cocktails/ description**

In `src/app/field-manual/cocktails/page.tsx`, replace existing description with:
```
description: "Cocktail recipes from the Jerry Can Spirits Field Manual. From the simple to the technical, each recipe built around real ingredients and proper technique.",
```

**Step 4: Update /guides/ description**

In `src/app/guides/page.tsx`, replace existing description with:
```
description: "Spirits guides and rum education from Jerry Can Spirits. Cocktail techniques, ingredient deep-dives, and the knowledge to build a proper home bar.",
```

**Step 5: Update openGraph.description** in all four files to match.

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add src/app/field-manual/equipment/page.tsx src/app/field-manual/ingredients/page.tsx src/app/field-manual/cocktails/page.tsx src/app/guides/page.tsx
git commit -m "fix: rewrite Field Manual and guides meta descriptions to match brand voice"
```

---

## Task 5: Add metadata to contact sub-pages via layout files

The contact sub-pages (`/contact/media/`, `/contact/complaints/`, `/contact/enquiries/`) are all `'use client'` components. They cannot export `metadata`. The fix is to create a `layout.tsx` in each sub-route folder — Next.js will use the closest parent layout's metadata when a page cannot export its own.

The parent `src/app/contact/layout.tsx` already exports metadata for `/contact/` itself, but it applies to all sub-routes that don't have their own override. This task creates those overrides.

**Files:**
- Modify: `src/app/contact/layout.tsx`
- Create: `src/app/contact/media/layout.tsx`
- Create: `src/app/contact/complaints/layout.tsx`
- Create: `src/app/contact/enquiries/layout.tsx`

**Step 1: Update /contact/ layout metadata**

In `src/app/contact/layout.tsx`, the current description is 141 chars and acceptable, but update it to match the approved copy:

Replace:
```typescript
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Jerry Can Spirits for enquiries, partnerships, or feedback. Contact our veteran-owned team via email or our online forms.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
  openGraph: {
    title: 'Contact Us | Jerry Can Spirits®',
    description: 'Get in touch with Jerry Can Spirits for enquiries, partnerships, or feedback. Contact our veteran-owned team.',
    url: 'https://jerrycanspirits.co.uk/contact/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}
```
With:
```typescript
export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Jerry Can Spirits. Questions about our rum, press and media enquiries, or just want to know more. We're here.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/contact/",
  },
  openGraph: {
    title: 'Contact Us | Jerry Can Spirits®',
    description: "Get in touch with Jerry Can Spirits. Questions about our rum, press and media enquiries, or just want to know more.",
    url: 'https://jerrycanspirits.co.uk/contact/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}
```

**Step 2: Create /contact/media/layout.tsx**

Create `src/app/contact/media/layout.tsx`:
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Media Centre',
  description: 'Press assets, product photography, brand guidelines, and media contact for Jerry Can Spirits. Everything a journalist or stockist needs in one place.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/media/',
  },
  openGraph: {
    title: 'Media Centre | Jerry Can Spirits®',
    description: 'Press assets, product photography, brand guidelines, and media contact for Jerry Can Spirits.',
    url: 'https://jerrycanspirits.co.uk/contact/media/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

**Step 3: Create /contact/complaints/layout.tsx**

Create `src/app/contact/complaints/layout.tsx`:
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complaints',
  description: 'Submit a complaint or report an issue with your Jerry Can Spirits order. We take every concern seriously and resolve it quickly.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/complaints/',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

**Step 4: Create /contact/enquiries/layout.tsx**

Create `src/app/contact/enquiries/layout.tsx`:
```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Make an Enquiry',
  description: 'Send a general enquiry to Jerry Can Spirits. Questions about Expedition Spiced Rum, trade and wholesale, stockists, or upcoming events.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/enquiries/',
  },
  openGraph: {
    title: 'Make an Enquiry | Jerry Can Spirits®',
    description: 'Send a general enquiry to Jerry Can Spirits. Questions about our rum, trade and wholesale, stockists, or upcoming events.',
    url: 'https://jerrycanspirits.co.uk/contact/enquiries/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

export default function EnquiriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

**Step 5: Verify build**

```bash
npm run build
```
Expected: 0 type errors. The new layout files are server components — no `'use client'` directive, so they can export metadata fine.

**Step 6: Commit**

```bash
git add src/app/contact/layout.tsx src/app/contact/media/layout.tsx src/app/contact/complaints/layout.tsx src/app/contact/enquiries/layout.tsx
git commit -m "feat: add metadata to contact sub-pages via route layouts"
```

---

## Task 6: Fix dynamic fallback descriptions

**Files:**
- Modify: `src/app/shop/[collection]/page.tsx`
- Modify: `src/app/field-manual/equipment/[slug]/page.tsx`

**Step 1: Fix /shop/[collection]/ fallback**

In `src/app/shop/[collection]/page.tsx`, find the `generateMetadata` function and the fallback description. It currently reads something like:
```typescript
description: `${title} from Jerry Can Spirits. Veteran-owned British craft spirits and barware.`
```

Replace it with:
```typescript
description: `Shop ${title} from Jerry Can Spirits. Veteran-owned British rum, cocktail barware, and expedition gear. Built properly, no shortcuts.`,
```

Also update the `openGraph.description` in the same function to use the same template.

**Step 2: Fix /field-manual/equipment/[slug]/ fallback**

In `src/app/field-manual/equipment/[slug]/page.tsx`, find the `generateMetadata` function. The fallback description currently passes the full `equipment.description` with no length cap:
```typescript
description: equipment.metaDescription || equipment.description,
```

Replace with:
```typescript
description: equipment.metaDescription || equipment.description?.slice(0, 160),
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add "src/app/shop/[collection]/page.tsx" "src/app/field-manual/equipment/[slug]/page.tsx"
git commit -m "fix: improve dynamic meta description fallbacks for shop collections and equipment pages"
```

---

## Task 7: Final build verification and PR

**Step 1: Full build**

```bash
npm run build
```
Expected: clean build, 0 type errors, 0 lint errors.

**Step 2: Spot-check in browser (dev server)**

```bash
npm run dev
```

Open these URLs and check `<meta name="description">` in browser DevTools (Elements tab, search for `description`):
- `http://localhost:3000/faq/` — should read "Common questions about Jerry Can Spirits..."
- `http://localhost:3000/contact/media/` — should read "Press assets, product photography..."
- `http://localhost:3000/contact/complaints/` — should have `robots: noindex`
- `http://localhost:3000/shop/spirits/` — should not contain an em-dash

**Step 3: Push and open PR**

```bash
git push -u origin feat/meta-description-audit
gh pr create \
  --title "fix: meta description audit — length, brand voice and missing contact metadata" \
  --body "Fixes all meta descriptions flagged by Ahrefs (too short/too long), rewrites generic Field Manual descriptions in brand voice, adds missing metadata to contact sub-pages via layout files, and tightens dynamic fallback logic. See docs/plans/2026-03-10-meta-description-audit-design.md for full audit and Shopify checklist."
```

---

## Shopify Checklist (manual — no code changes)

Go to **Shopify Admin > Products > [product] > Search engine listing** and set the Meta description field for each:

| Product | Handle | Meta description to set |
|---|---|---|
| Expedition Spiced Rum | `jerry-can-spirits-expedition-spiced-rum` | Expedition Spiced Rum by Jerry Can Spirits. 40% ABV, 700ml. Madagascan vanilla, Ceylon cinnamon, ginger, orange peel. Veteran-owned, pot-distilled in Wales. |
| Gift Pack | `jerry-can-spirits-premium-gift-pack` | Jerry Can Spirits gift pack. Expedition Spiced Rum plus [confirm pack contents]. Veteran-owned British spiced rum, pot-distilled at Spirit of Wales, real ingredients. |
| 6-Bottle Expedition Pack | `jerry-can-spirits-expedition-pack-spiced-rum-6-bottles` | Six bottles of Expedition Spiced Rum. 40% ABV, 700ml each. Veteran-owned British spiced rum, pot-distilled in Wales with real botanicals. No shortcuts. |
| Stainless Steel Jigger | `stainless-steel-jigger` | Stainless steel jigger from Jerry Can Spirits. Precision-weighted, dual measure. Built for cocktail making at home. Compact, easy to clean, built to last. |
| Hip Flask 500ml | `stainless-steel-hip-flask-500ml` | Stainless steel hip flask, 500ml. From Jerry Can Spirits. Leak-proof, military-grade build. Compact enough for a jacket pocket, durable enough for the field. |

For any other products follow this pattern: product name + key spec + one functional benefit + brand signal (veteran-owned / built properly / real ingredients / no shortcuts). 110-160 chars, no em-dashes.
