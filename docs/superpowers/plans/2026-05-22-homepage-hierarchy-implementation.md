# Homepage Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two PRs today — (A) live-state cleanup + Monday £35→£40 price switch, then (B) trust-led homepage hierarchy redesign with a hardcoded pull-quote strip and paired Trustpilot + Press social proof.

**Architecture:** PR A is rename + copy work across ~10 files plus a structured-data fix; no new components. PR B introduces two server components (`PullQuoteStrip`, `PairedSocialProof`) and reorders the homepage section composition. PR B branches off PR A so it picks up the `OrderSection` rename cleanly; both target `main`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind, Sanity, Cloudflare Pages. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-22-homepage-hierarchy-klaviyo-popup-design.md`

**Deferred to a later plan:** PR C (newsletter copy → PDF magnet) — gated on Klaviyo flow + PDF being live in production.

---

## File Structure

### PR A — modified files

- `src/components/HeroSection.tsx` — remove £35 price block, replace with brand-aligned tagline
- `src/components/PreOrderSection.tsx` → **renamed** to `src/components/OrderSection.tsx`; internal rename of `getPreOrderData` → `getOrderData`; fallback prices £35→£40, `compareAtPrice` 45→null; "Founding Supporter price" copy → "Founding batch"
- `src/components/PreOrderProgressBar.tsx` → **renamed** to `src/components/OrderProgressBar.tsx`; props interface renamed
- `src/app/page.tsx` — update `PreOrderSection` import to `OrderSection` (section reorder is PR B, not PR A)
- `src/components/AnnouncementBar.tsx` — copy rewrite (lines 57–63)
- `src/app/shop/product/[handle]/page.tsx` — `schema.org/PreOrder` → `schema.org/OutOfStock` (line 344); variable `preorderSoldMeta` → `bottlesSoldMeta`
- `src/app/contact/media/page.tsx` — line 1025 copy
- `public/llms.txt` — line 47 copy
- `src/lib/shopify-webhooks.ts` — function rename `incrementPreOrderSold` → `incrementBottlesSold`
- `src/app/api/webhooks/shopify/route.ts` — import + call site update
- `tests/e2e/shop.spec.ts` — describe/it descriptions, assertion regex update

### PR B — modified and new files

- `src/components/PullQuoteStrip.tsx` — **new** server component, hardcoded two-quote grid
- `src/components/PairedSocialProof.tsx` — **new** server component composing existing `TrustpilotWidget` + `PressAwards`
- `src/app/page.tsx` — section composition reorder, remove `TickerStrip` import + usage, remove Trustpilot date gate at line 321

---

## Phase A — Live State Cleanup + Monday Price Switch

### Task A1: Branch creation

**Files:** none

- [ ] **Step 1: Fetch latest and branch from origin/main**

```bash
git fetch origin && git checkout -b chore/live-state-cleanup-price-switch origin/main
```

Expected: switched to new branch, tracking origin/main.

---

### Task A2: Hero — remove £35 line

**Files:**
- Modify: `src/components/HeroSection.tsx:86-94`

- [ ] **Step 1: Edit the price block**

Replace the entire `Founding Supporter Pricing` block (lines 86–94):

```tsx
            {/* Founding Supporter Pricing */}
            <div className="mb-8 p-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20">
              <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-2 text-center">
                Now Shipping
              </div>
              <p className="text-parchment-200 text-center text-sm">
                Founding Supporter price: £35. Orders are being fulfilled and shipped.
              </p>
            </div>
```

With:

```tsx
            {/* Now Shipping */}
            <div className="mb-8 p-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20">
              <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-2 text-center">
                Now Shipping
              </div>
              <p className="text-parchment-200 text-center text-sm">
                Numbered first batch. Limited to 700.
              </p>
            </div>
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output (success).

---

### Task A3: Rename PreOrderProgressBar → OrderProgressBar

**Files:**
- Rename: `src/components/PreOrderProgressBar.tsx` → `src/components/OrderProgressBar.tsx`

- [ ] **Step 1: Git-rename the file**

```bash
git mv src/components/PreOrderProgressBar.tsx src/components/OrderProgressBar.tsx
```

- [ ] **Step 2: Rename the props interface and default export**

In `src/components/OrderProgressBar.tsx`, replace `PreOrderProgressBarProps` with `OrderProgressBarProps` (both at the interface declaration line 5 and its consumer line 10), and rename the function from `PreOrderProgressBar` to `OrderProgressBar`.

```tsx
interface OrderProgressBarProps {
  sold: number
  total: number
}

export default function OrderProgressBar({ sold, total }: OrderProgressBarProps) {
  // ... existing body unchanged
}
```

- [ ] **Step 3: Typecheck — expect failure in OrderSection**

```bash
npx tsc --noEmit
```

Expected: type error in `src/components/PreOrderSection.tsx` because it still imports `PreOrderProgressBar`. Fixed in next task.

---

### Task A4: Rename PreOrderSection → OrderSection + price/copy updates

**Files:**
- Rename: `src/components/PreOrderSection.tsx` → `src/components/OrderSection.tsx`

- [ ] **Step 1: Git-rename the file**

```bash
git mv src/components/PreOrderSection.tsx src/components/OrderSection.tsx
```

- [ ] **Step 2: Update import and function name**

In `src/components/OrderSection.tsx` line 4, change:

```tsx
import PreOrderProgressBar from './PreOrderProgressBar'
```

To:

```tsx
import OrderProgressBar from './OrderProgressBar'
```

Function rename at line 12 (`getPreOrderData` → `getOrderData`) and line 77 (`export default async function PreOrderSection()` → `export default async function OrderSection()`).

At the call site (line 78–79):

```tsx
  const { totalSold, bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice } =
    await getOrderData()
```

At line 128 update the JSX usage:

```tsx
              <OrderProgressBar sold={totalSold} total={TOTAL_BOTTLES} />
```

- [ ] **Step 3: Update fallback prices**

Line 21 — replace:

```tsx
    let bottlePrice = '35'
    let bottleCompareAtPrice: string | null = '45'
```

With:

```tsx
    let bottlePrice = '40'
    let bottleCompareAtPrice: string | null = null
```

Line 67–73 catch-block — replace:

```tsx
    return {
      totalSold: null,
      bottlePrice: '35',
      bottleCompareAtPrice: '45',
      giftSetPrice: '85',
      giftSetCompareAtPrice: null,
    }
```

With:

```tsx
    return {
      totalSold: null,
      bottlePrice: '40',
      bottleCompareAtPrice: null,
      giftSetPrice: '85',
      giftSetCompareAtPrice: null,
    }
```

- [ ] **Step 4: Update Founding Supporter copy**

Line 124 — replace:

```tsx
              700 bottles. Each one numbered. Founding Supporter pricing.
```

With:

```tsx
              700 bottles. Each one numbered. The founding batch.
```

Line 141 — replace:

```tsx
                  <span>Founding Supporter price: £{bottlePrice}</span>
```

With:

```tsx
                  <span>Founding batch. £{bottlePrice} per bottle.</span>
```

- [ ] **Step 5: Typecheck — expect failure in page.tsx**

```bash
npx tsc --noEmit
```

Expected: type error in `src/app/page.tsx` because it still imports `PreOrderSection`. Fixed in next task.

---

### Task A5: Update page.tsx import

**Files:**
- Modify: `src/app/page.tsx:7,188-190`

- [ ] **Step 1: Update import**

Line 7 — replace:

```tsx
import PreOrderSection from "@/components/PreOrderSection";
```

With:

```tsx
import OrderSection from "@/components/OrderSection";
```

- [ ] **Step 2: Update comment and JSX**

Lines 188–190 — replace:

```tsx
        {/* Pre-Order Section - Primary CTA */}
        <ScrollReveal>
          <PreOrderSection />
        </ScrollReveal>
```

With:

```tsx
        {/* Order Section - Primary CTA */}
        <ScrollReveal>
          <OrderSection />
        </ScrollReveal>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A6: AnnouncementBar copy rewrite

**Files:**
- Modify: `src/components/AnnouncementBar.tsx:56-64`

- [ ] **Step 1: Replace the announcement copy and CTA text**

Replace lines 56–64:

```tsx
              <span className="text-xs sm:text-sm">
                <span className="font-semibold">Pre-order Expedition Spiced Rum</span>
                <span className="hidden sm:inline">. Limited to 700 bottles</span>
                <span className="mx-1 sm:mx-2">|</span>
                <span>April 2026</span>
              </span>
              <span className="font-semibold underline underline-offset-2 text-xs sm:text-sm whitespace-nowrap">
                Pre-order Now
              </span>
```

With:

```tsx
              <span className="text-xs sm:text-sm">
                <span className="font-semibold">Expedition Spiced Rum</span>
                <span className="hidden sm:inline">. Numbered first batch, limited to 700</span>
                <span className="mx-1 sm:mx-2">|</span>
                <span>Shipping now</span>
              </span>
              <span className="font-semibold underline underline-offset-2 text-xs sm:text-sm whitespace-nowrap">
                Shop Now
              </span>
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A7: Structured-data availability fix

**Files:**
- Modify: `src/app/shop/product/[handle]/page.tsx:240,252,344`

- [ ] **Step 1: Update the schema.org PreOrder fallback**

Line 344 — replace:

```tsx
        : 'https://schema.org/PreOrder',
```

With:

```tsx
        : 'https://schema.org/OutOfStock',
```

- [ ] **Step 2: Rename internal variable (lines 240, 244, 245, 252) for consistency**

Find and rename `preorderSoldMeta` to `bottlesSoldMeta` in this file (4 occurrences expected). The Shopify metafield key string `'pre_order_sold'` stays unchanged — it is data storage, not user-facing.

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A8: Media kit + llms.txt copy

**Files:**
- Modify: `src/app/contact/media/page.tsx:1025`
- Modify: `public/llms.txt:47`

- [ ] **Step 1: Update media kit page copy**

Line 1025 — replace:

```tsx
                <p className="text-parchment-200 text-sm">Pre-orders before launch</p>
```

With:

```tsx
                <p className="text-parchment-200 text-sm">Launched April 2026</p>
```

- [ ] **Step 2: Update llms.txt**

Line 47 — replace:

```
Main landing page with brand story, pre-order options, and field manual preview.
```

With:

```
Main landing page with brand story, shop, and field manual preview.
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A9: Webhook function rename

**Files:**
- Modify: `src/lib/shopify-webhooks.ts:72-146`
- Modify: `src/app/api/webhooks/shopify/route.ts:6,98`

- [ ] **Step 1: Rename the function in shopify-webhooks.ts**

In `src/lib/shopify-webhooks.ts`, rename `incrementPreOrderSold` to `incrementBottlesSold` (line 72 comment, line 75 export signature). The metafield key string `'pre_order_sold'` (line 95, 134) stays unchanged.

Update the console.log at line 146 from:

```ts
  console.log(`[webhook] Updated pre_order_sold for product ${safeProductId}: ${currentValue} → ${newValue}`);
```

To:

```ts
  console.log(`[webhook] Updated bottles sold for product ${safeProductId}: ${currentValue} → ${newValue}`);
```

- [ ] **Step 2: Update the webhook route import and call site**

In `src/app/api/webhooks/shopify/route.ts`:

Line 6 — replace:

```ts
  incrementPreOrderSold,
```

With:

```ts
  incrementBottlesSold,
```

Line 95 comment — replace:

```ts
  // Auto-increment pre_order_sold metafield for each product in the order
```

With:

```ts
  // Auto-increment the bottles-sold metafield for each product in the order
```

Line 98 — replace:

```ts
      await incrementPreOrderSold(item.product_id, item.quantity, adminToken);
```

With:

```ts
      await incrementBottlesSold(item.product_id, item.quantity, adminToken);
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A10: E2E test description updates

**Files:**
- Modify: `tests/e2e/shop.spec.ts:72-80,118-127`

- [ ] **Step 1: Update product-page test description and matcher**

Lines 72–80 — replace:

```ts
  test('product pages have pricing information or pre-order info', async ({ page }) => {
```

With:

```ts
  test('product pages have pricing information', async ({ page }) => {
```

Lines 76–80 — replace the comment + locator:

```ts
    // Check for price or pre-order messaging
    const priceOrPreorder = page.locator('text=/£|price|pre-order|coming soon/i')
    const isVisible = await priceOrPreorder.first().isVisible({ timeout: 3000 }).catch(() => false)

    // Either pricing or pre-order messaging should be present
```

With:

```ts
    // Check for price messaging
    const priceLocator = page.locator('text=/£|price|out of stock/i')
    const isVisible = await priceLocator.first().isVisible({ timeout: 3000 }).catch(() => false)

    // Pricing should be present on a live product page
```

- [ ] **Step 2: Update the Pre-order Section describe block**

Lines 118–127 — replace:

```ts
test.describe('Pre-order Section', () => {
  test('pre-order section is visible on homepage', async ({ page }) => {
    await page.goto('/')

    // Look for pre-order related content
    const preorderSection = page.locator('text=/pre-order|notify|coming soon|launch/i').first()
    const isVisible = await preorderSection.isVisible({ timeout: 5000 }).catch(() => false)

    // Pre-order or launch information should be present
```

With:

```ts
test.describe('Order Section', () => {
  test('order section is visible on homepage', async ({ page }) => {
    await page.goto('/')

    // Look for order-related content
    const orderSection = page.locator('text=/order|shop|founding batch|numbered/i').first()
    const isVisible = await orderSection.isVisible({ timeout: 5000 }).catch(() => false)

    // Order information should be present on the live homepage
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task A11: Full build verification

**Files:** none

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 2: Run a production build**

```bash
npm run build
```

Expected: build completes without errors. Cloudflare Pages OpenNext build output may emit warnings, but no errors.

- [ ] **Step 3: Boot the dev server**

```bash
npm run dev
```

Expected: server starts, listens on `http://localhost:3000`. Keep it running for the next step.

- [ ] **Step 4: Walk through pages in browser**

Open `http://localhost:3000`, then:
- Hero shows "Now Shipping. Numbered first batch. Limited to 700." (no `£35`)
- AnnouncementBar shows "Expedition Spiced Rum. Numbered first batch, limited to 700 | Shipping now" and "Shop Now"
- Scroll to the Order Section — fallback price is `£40` (will be live price once Shopify variant updates Monday). No `£45` strikethrough.
- Visit `/contact/media` — Pre-orders line now reads "Launched April 2026"
- Visit `/shop/product/jerry-can-spirits-expedition-spiced-rum/` — view source, search for `availability` in the JSON-LD, confirm it is `InStock` (variant available) or `OutOfStock` (out of stock); no `PreOrder` references

Stop the dev server when done.

---

### Task A12: Commit and push PR A

**Files:** none

- [ ] **Step 1: Stage all changes**

```bash
git add -A
```

Note: this includes both git-renamed files and modified files. Verify with `git status` that only the files listed in the "File Structure → PR A" section above are staged.

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(live): pre-order cleanup + Monday price switch (£35 → £40)

Renames PreOrderSection / PreOrderProgressBar to OrderSection /
OrderProgressBar to reflect the brand being live and shipping. Internal
server function incrementPreOrderSold renamed to incrementBottlesSold;
Shopify metafield key custom.pre_order_sold stays (data layer).

Hero copy drops the £35 line in favour of "Numbered first batch.
Limited to 700." AnnouncementBar swaps "Pre-order" framing for "Shop
Now". Media kit and llms.txt updated accordingly. Structured-data
availability fallback fixed from schema.org/PreOrder to OutOfStock.

OrderSection fallback prices updated to £40 with no compareAtPrice so
the strikethrough disappears. The live displayed price still flows
from Shopify; Shopify variant update happens Monday 2026-05-25 at the
same moment this merges.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Push**

```bash
git push -u origin chore/live-state-cleanup-price-switch
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --base main --head chore/live-state-cleanup-price-switch --title "chore(live): pre-order cleanup + Monday price switch (£35 → £40)" --body "$(cat <<'EOF'
## Summary

Implements **PR A** from spec \`docs/superpowers/specs/2026-05-22-homepage-hierarchy-klaviyo-popup-design.md\` (spec PR #713).

- Component renames: \`PreOrderSection\` → \`OrderSection\`, \`PreOrderProgressBar\` → \`OrderProgressBar\`
- Internal server function rename: \`incrementPreOrderSold\` → \`incrementBottlesSold\`
- Hero £35 line removed; replaced with "Numbered first batch. Limited to 700."
- AnnouncementBar copy: "Pre-order" → "Shop Now", "April 2026" → "Shipping now"
- Media kit + llms.txt: "Pre-orders" language updated
- Structured-data fix: \`schema.org/PreOrder\` → \`schema.org/OutOfStock\`
- OrderSection fallback prices: £35 → £40, compareAtPrice 45 → null
- E2E test descriptions updated

## Coordinated Shopify change (Dan, at merge time)

Update Expedition Spiced Rum variant in Shopify admin:
- Price \`35\` → \`40\`
- Clear \`compareAtPrice\`

The live displayed price flows from Shopify, so this must happen at the same moment this PR merges.

## Test plan

- [x] Typecheck
- [x] Production build
- [x] Dev server walk-through: Hero, AnnouncementBar, Order section, media kit, product page JSON-LD
- [ ] Confirm Shopify variant updated to £40 at merge time
- [ ] Hard-refresh production after deploy and confirm displayed price is £40

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Phase B — Homepage Hierarchy Redesign

### Task B1: Branch creation

**Files:** none

- [ ] **Step 1: Branch from PR A's tip so PR B picks up the OrderSection rename**

```bash
git checkout -b feat/homepage-hierarchy-redesign chore/live-state-cleanup-price-switch
```

Expected: switched to new branch based on `chore/live-state-cleanup-price-switch`.

**Note:** When PR A merges to main, rebase this branch onto main before merging PR B:

```bash
git fetch origin && git rebase origin/main
```

---

### Task B2: Create PullQuoteStrip component

**Files:**
- Create: `src/components/PullQuoteStrip.tsx`

- [ ] **Step 1: Write the component**

```tsx
import Link from 'next/link'

interface PullQuote {
  text: string
  attribution: string
}

const QUOTES: PullQuote[] = [
  {
    text: "A cut above. Don't discuss top end rum without mentioning Expedition Spiced.",
    attribution: 'Verified customer · Trustpilot',
  },
  {
    text: "You can really see the work that's gone behind this beautiful drink.",
    attribution: 'Verified customer · Trustpilot',
  },
]

const TRUSTPILOT_URL = 'https://uk.trustpilot.com/review/jerrycanspirits.co.uk'

export default function PullQuoteStrip() {
  return (
    <section
      aria-label="Customer reviews"
      className="border-t border-b border-gold-500/20 bg-jerry-green-900/60 py-14 sm:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
          {QUOTES.map((quote, index) => (
            <figure key={index} className="relative">
              <span
                aria-hidden="true"
                className="block text-5xl text-gold-400/80 leading-none font-serif mb-2"
              >
                &ldquo;
              </span>
              <blockquote className="text-lg sm:text-xl text-parchment-50 font-serif leading-snug mb-4">
                {quote.text}
              </blockquote>
              <figcaption className="text-xs uppercase tracking-widest text-gold-300 font-semibold">
                <span aria-hidden="true" className="text-gold-400 mr-2 tracking-[0.1em]">
                  ★★★★★
                </span>
                {quote.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={TRUSTPILOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest text-gold-300/80 hover:text-gold-300 transition-colors"
          >
            Read all reviews on Trustpilot →
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task B3: Create PairedSocialProof component

**Files:**
- Create: `src/components/PairedSocialProof.tsx`

- [ ] **Step 1: Inspect the existing components**

Read `src/components/TrustpilotWidget.tsx` and `src/components/PressAwards.tsx` to confirm their export signatures. `TrustpilotWidget` takes props (`templateId`, `height`, `token`, `theme`); `PressAwards` is a self-contained section.

- [ ] **Step 2: Write the composing component**

```tsx
import TrustpilotWidget from './TrustpilotWidget'
import PressAwards from './PressAwards'

export default function PairedSocialProof() {
  return (
    <section
      aria-label="Customer trust and press coverage"
      className="py-16 bg-jerry-green-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              What people are saying
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gold-500 mb-4">
            Field reports
          </h2>
          <p className="text-parchment-200 text-lg max-w-2xl mx-auto">
            We will let the bottles do the talking.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <TrustpilotWidget
            templateId="56278e9abfbbba0bdcd568bc"
            height="52px"
            token="1b8d76a8-b743-471a-8f16-321500842e93"
            theme="dark"
          />
        </div>
      </div>

      <PressAwards />
    </section>
  )
}
```

**Note:** the apostrophe-free "We will let the bottles do the talking" replaces the existing "We&apos;ll let the bottles do the talking." text from `page.tsx:334` to stay consistent with brand voice rules (no apostrophe issues, no em-dashes).

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task B4: Update page.tsx imports and remove dead code

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update the imports block**

At the top of `src/app/page.tsx`, the existing imports are:

```tsx
import ReactDOM from 'react-dom';
import HeroSection from "@/components/HeroSection";
import TrustpilotWidget from "@/components/TrustpilotWidget";
import HomepageExpeditionMap from "@/components/HomepageExpeditionMap";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import OrderSection from "@/components/OrderSection";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import SupportingOurForces from "@/components/SupportingOurForces";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import HomepageFAQ from "@/components/HomepageFAQ";
import PressAwards from "@/components/PressAwards";
import ScrollReveal from "@/components/ScrollReveal";
import TickerStrip from "@/components/TickerStrip";
import NewsletterSignup from "@/components/NewsletterSignup";
import Link from 'next/link'
import type { Metadata } from 'next'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
```

Remove `TrustpilotWidget`, `PressAwards`, and `TickerStrip` imports (they're now composed inside `PairedSocialProof`). Add `PullQuoteStrip` and `PairedSocialProof` imports. Result:

```tsx
import ReactDOM from 'react-dom';
import HeroSection from "@/components/HeroSection";
import HomepageExpeditionMap from "@/components/HomepageExpeditionMap";
import StructuredData from "@/components/StructuredData";
import ScrollToHash from "@/components/ScrollToHash";
import OrderSection from "@/components/OrderSection";
import FounderStorySnippet from "@/components/FounderStorySnippet";
import SupportingOurForces from "@/components/SupportingOurForces";
import FieldManualPreview from "@/components/FieldManualPreview";
import WhyJerryCan from "@/components/WhyJerryCan";
import HomepageFAQ from "@/components/HomepageFAQ";
import ScrollReveal from "@/components/ScrollReveal";
import NewsletterSignup from "@/components/NewsletterSignup";
import PullQuoteStrip from "@/components/PullQuoteStrip";
import PairedSocialProof from "@/components/PairedSocialProof";
import Link from 'next/link'
import type { Metadata } from 'next'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
```

---

### Task B5: Reorder the homepage section composition

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace the section composition**

Find the block starting with `<HeroSection />` (around line 180) and ending with the close of the SEO content section. Replace the existing composition with the new order:

```tsx
      <div>
        <HeroSection />

        {/* Pull-quote strip — instant social proof under the hero */}
        <PullQuoteStrip />

        {/* Founder story — story leads, builds belief */}
        <ScrollReveal>
          <FounderStorySnippet />
        </ScrollReveal>

        {/* Why Jerry Can — value proposition */}
        <ScrollReveal>
          <WhyJerryCan />
        </ScrollReveal>

        {/* Paired social proof — Trustpilot widget + Press & Awards together */}
        <ScrollReveal>
          <PairedSocialProof />
        </ScrollReveal>

        {/* Order Section — the buy ask, after belief is built */}
        <ScrollReveal>
          <OrderSection />
        </ScrollReveal>

        {/* Supporting our forces — pledge */}
        <ScrollReveal>
          <SupportingOurForces />
        </ScrollReveal>

        {/* Expedition log map — community */}
        <HomepageExpeditionMap />

        {/* Field Manual preview — content engagement */}
        <ScrollReveal>
          <FieldManualPreview />
        </ScrollReveal>

        {/* FAQ — objection handling before final CTA */}
        <HomepageFAQ />

        {/* Newsletter signup — final CTA */}
        <section id="newsletter-signup" className="py-20 border-t border-gold-500/10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Join the Expedition
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">
              10% off your first order.
            </h2>
            <p className="text-parchment-300 mb-8">
              Sign up and we will send you a 10% discount code.
            </p>
            <NewsletterSignup />
          </div>
        </section>

        {/* SEO-Rich Content Section — kept for crawlers, lowest priority */}
```

**Important:** the newsletter section copy ("10% off your first order.") is **NOT** rewritten in this PR. The PDF magnet copy swap is PR C, gated on the Klaviyo PDF flow being live in production. Leaving the 10% inline form intact for now ensures visitors who sign up still get something meaningful.

The existing SEO content section block (the two-column "Why We Started Making Rum" + "Why We Do It This Way" + key features grid) stays unchanged after this newsletter section.

- [ ] **Step 2: Remove the conditional Trustpilot block at the bottom**

Find the existing Trustpilot block (was at line 321 of the pre-edit file):

```tsx
        {/* Trustpilot Reviews Section - Hidden until April 2026 launch */}
        {/* CSP is configured for Trustpilot, will activate automatically at launch */}
        {new Date() >= new Date('2026-04-06T00:00:00Z') && (
          <section className="py-16 bg-jerry-green-900/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                ...
              </div>
              <div className="max-w-2xl mx-auto">
                <TrustpilotWidget
                  templateId="56278e9abfbbba0bdcd568bc"
                  height="52px"
                  token="1b8d76a8-b743-471a-8f16-321500842e93"
                  theme="dark"
                />
              </div>
            </div>
          </section>
        )}
```

Delete this entire conditional block. The Trustpilot widget is now rendered inside `PairedSocialProof` higher up the page.

- [ ] **Step 3: Confirm `TickerStrip` is no longer referenced anywhere in the file**

Search the file for `TickerStrip`. There should be no remaining references after the import removal in Task B4 and the section removal here.

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

---

### Task B6: Full build verification

**Files:** none

- [ ] **Step 1: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: no output.

- [ ] **Step 2: Run a production build**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 3: Boot the dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000`.

- [ ] **Step 4: Walk through the homepage end to end**

In the browser:

- Hero loads, bottle clickable (per PR #712), no £35 reference
- **Pull-quote strip appears directly under the hero.** Two quotes in a two-column grid on desktop; stacks to single column on a narrow viewport (devtools, narrow to <720px). Five-star glyph and "Verified customer · Trustpilot" attribution show. "Read all reviews on Trustpilot →" link at the foot opens in a new tab and points to the Trustpilot review URL.
- Scroll: Founder Story → Why Jerry Can → **Paired Social Proof** (Trustpilot widget + Press & Awards together) → Order Section → Forces → Map → Field Manual → FAQ → Newsletter (still 10% off — intentional, deferred to PR C) → SEO content
- TickerStrip is gone from the page
- No Trustpilot block at the bottom of the page (removed; the widget is now inside `PairedSocialProof`)
- No 404s, no client-side errors in devtools console

Stop the dev server when done.

- [ ] **Step 5: Lighthouse check (LCP regression guard)**

In Chrome devtools → Lighthouse → run a desktop performance audit on `http://localhost:3000`. Note the LCP value. Compare with the pre-change baseline if you have one; flag in the PR if it has worsened by more than 0.3s.

---

### Task B7: Commit and push PR B

**Files:** none

- [ ] **Step 1: Stage all changes**

```bash
git add -A
```

Verify with `git status` that staged files are the two new components and `src/app/page.tsx`.

- [ ] **Step 2: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(homepage): trust-led hierarchy redesign with paired social proof

Restructures the homepage to lead with trust before the buy ask, per
the spec at docs/superpowers/specs/2026-05-22-homepage-hierarchy-klaviyo-popup-design.md.

Adds two server components: PullQuoteStrip (hardcoded two-quote grid
directly under the hero, no widget flash, instant LCP) and
PairedSocialProof (composes the existing Trustpilot widget and Press
& Awards into a single block at the moment of decision, right before
the Order section).

Removes the values-led TickerStrip from the homepage and the
conditional date-gated Trustpilot block at the bottom of the page,
both superseded by the new components. Newsletter copy stays as 10%
off for now — PDF magnet rewrite is PR C, gated on the Klaviyo flow
going live.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 3: Push**

```bash
git push -u origin feat/homepage-hierarchy-redesign
```

- [ ] **Step 4: Open the PR**

```bash
gh pr create --base main --head feat/homepage-hierarchy-redesign --title "feat(homepage): trust-led hierarchy redesign with paired social proof" --body "$(cat <<'EOF'
## Summary

Implements **PR B** from spec \`docs/superpowers/specs/2026-05-22-homepage-hierarchy-klaviyo-popup-design.md\` (spec PR #713).

Restructures the homepage to lead with trust before the buy ask:

1. \`HeroSection\`
2. **\`PullQuoteStrip\`** *(new)* — two hardcoded Trustpilot quotes directly under the hero
3. \`FounderStorySnippet\` — story leads
4. \`WhyJerryCan\`
5. **\`PairedSocialProof\`** *(new)* — Trustpilot widget + Press & Awards composed into one block
6. \`OrderSection\` — the buy ask
7. \`SupportingOurForces\`
8. \`HomepageExpeditionMap\`
9. \`FieldManualPreview\`
10. \`HomepageFAQ\`
11. Newsletter signup *(copy unchanged — PDF magnet rewrite is PR C)*
12. SEO content section

Removes the values-led \`TickerStrip\` and the conditional date-gated Trustpilot block at the bottom of the page.

## Depends on

PR A (\`chore/live-state-cleanup-price-switch\`) must merge first because this branch is based on it. Rebase onto \`main\` after PR A merges.

## Test plan

- [x] Typecheck
- [x] Production build
- [x] Dev server walk-through, desktop + narrow viewport
- [x] Lighthouse LCP check
- [ ] Hard-refresh production after deploy, confirm new section order
- [ ] Confirm Trustpilot widget renders inside the paired social-proof block
- [ ] Confirm pull-quote strip stacks correctly on mobile

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Self-Review Notes (filled in during writing)

**Spec coverage:**
- All PR A scope items have a task: hero copy (A2), component renames (A3, A4), page.tsx import (A5), AnnouncementBar (A6), structured data (A7), media kit + llms.txt (A8), webhooks (A9), E2E tests (A10).
- All PR B scope items have a task: PullQuoteStrip (B2), PairedSocialProof (B3), page.tsx reorder (B4, B5), TickerStrip removal (B5), date gate removal (B5).
- PR C scope explicitly deferred — noted in B5 step 1.

**Placeholder scan:** none — all code blocks are concrete.

**Type consistency:** `OrderProgressBarProps` defined in A3, consumed in A4. `getOrderData` defined in A4. Both new components have explicit interfaces.

**Note on Shopify metafield key:** stays as `pre_order_sold` throughout. This is intentional — the key is data storage, not user-facing. Renaming requires a Shopify data migration not in scope.
