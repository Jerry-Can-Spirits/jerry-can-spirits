# Presentation Box Cart Upsell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deliberate, image-led presentation-box upsell to the cart drawer that appears only when the Expedition Spiced Rum is in the cart, with a quantity stepper bounded by the rum quantity, and surface the box on three gift-themed collection pages.

**Architecture:** A new client component `PresentationBoxUpsell` rendered above `CartUpsell` in `CartDrawer`. It mirrors `CarbonOffsetToggle`'s data-fetch pattern (fetch product by handle on mount, cache variant id) and uses `useCart()` for state. Collection-page additions are three single-line edits to `src/lib/categories.ts`.

**Tech Stack:** Next.js 15 (App Router) client component, React 19, Tailwind CSS, Shopify Storefront API via `getProduct`, existing `CartContext`.

**Testing approach:** This codebase has no unit or component test framework (only Playwright e2e). Verification is via `npm run lint`, `npm run build`, and manual browser testing on the dev server. We do not introduce a new test framework for one component.

**Spec:** `docs/superpowers/specs/2026-05-05-presentation-box-upsell-design.md`

---

## File Structure

- **Create:** `src/components/PresentationBoxUpsell.tsx` — the new component (single responsibility: render the upsell card and handle add-to-cart).
- **Modify:** `src/components/CartDrawer.tsx` — one import + one render line above `<CartUpsell />`.
- **Modify:** `src/lib/categories.ts` — append the box handle to three `productHandles` arrays.

---

## Task 1: Create the PresentationBoxUpsell component

**Files:**
- Create: `src/components/PresentationBoxUpsell.tsx`

**Reference patterns:**
- `src/components/CarbonOffsetToggle.tsx` — single-product fetch by handle, find-line-in-cart logic, isActing flag.
- `src/components/CartUpsell.tsx` lines 191-272 — image rendering, button styling, formatPrice helper.
- `src/components/CartDrawer.tsx` lines 339-400 — quantity stepper styling and aria patterns.

- [ ] **Step 1: Create the file with the component**

Create `src/components/PresentationBoxUpsell.tsx` with this exact content:

```tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { useCart } from '@/contexts/CartContext'
import { getProduct, type ShopifyProduct } from '@/lib/shopify'

const BOX_HANDLE = 'jerry-can-spirits-expedition-spiced-rum-presentation-box'
const RUM_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'

function formatPrice(amount: string, currencyCode: string): string {
  const price = parseFloat(amount)
  const symbols: Record<string, string> = {
    GBP: '£',
    USD: '$',
    EUR: '€',
  }
  const symbol = symbols[currencyCode] || currencyCode
  return `${symbol}${price.toFixed(2)}`
}

export default function PresentationBoxUpsell() {
  const { cart, addToCart, isLoading } = useCart()
  const [product, setProduct] = useState<ShopifyProduct | null>(null)
  const [variantId, setVariantId] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    getProduct(BOX_HANDLE)
      .then(p => {
        if (p?.variants?.[0]?.id) {
          setProduct(p)
          setVariantId(p.variants[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const rumQuantityInCart = useMemo(() => {
    if (!cart) return 0
    return cart.lines
      .filter(line => line.merchandise.product.handle === RUM_HANDLE)
      .reduce((sum, line) => sum + line.quantity, 0)
  }, [cart])

  useEffect(() => {
    if (rumQuantityInCart > 0 && quantity > rumQuantityInCart) {
      setQuantity(rumQuantityInCart)
    }
  }, [rumQuantityInCart, quantity])

  if (!product || !variantId) return null
  if (rumQuantityInCart === 0) return null

  const boxPrice = product.priceRange.minVariantPrice
  const totalAmount = (parseFloat(boxPrice.amount) * quantity).toFixed(2)
  const totalPriceDisplay = formatPrice(totalAmount, boxPrice.currencyCode)
  const unitPriceDisplay = formatPrice(boxPrice.amount, boxPrice.currencyCode)
  const image = product.images?.[0]

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1)
  }

  const handleIncrement = () => {
    if (quantity < rumQuantityInCart) setQuantity(quantity + 1)
  }

  const handleAdd = async () => {
    if (isAdding || isLoading || !variantId) return
    setIsAdding(true)
    try {
      await addToCart(variantId, quantity)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="py-4 border-t border-gold-500/20">
      <div className="bg-jerry-green-800/30 rounded-lg border border-gold-500/20 p-4">
        <div className="flex gap-4">
          <div className="relative w-20 h-20 flex-shrink-0 bg-jerry-green-800/20 rounded-lg overflow-hidden">
            {image ? (
              <Image
                src={image.url}
                alt={image.altText || product.title}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gold-300">
              Add the presentation box.
            </h3>
            <p className="text-xs text-parchment-400 mt-1">
              Built for gifting. Adds {unitPriceDisplay} each.
            </p>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={quantity <= 1 || isAdding || isLoading}
                  aria-label="Decrease box quantity"
                  className="w-8 h-8 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5 text-parchment-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>

                <span className="text-white font-semibold w-6 text-center text-sm" aria-live="polite">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={quantity >= rumQuantityInCart || isAdding || isLoading}
                  aria-label="Increase box quantity"
                  className="w-8 h-8 flex items-center justify-center bg-jerry-green-800/50 hover:bg-jerry-green-800 rounded border border-gold-500/20 transition-colors disabled:opacity-40"
                >
                  <svg className="w-3.5 h-3.5 text-parchment-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || isLoading}
                aria-label={`Add ${quantity} presentation ${quantity === 1 ? 'box' : 'boxes'} for ${totalPriceDisplay}`}
                className="ml-auto px-4 py-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 text-sm font-semibold rounded transition-colors disabled:opacity-50"
              >
                {isAdding ? 'Adding...' : `Add ${totalPriceDisplay}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npm run lint`
Expected: PASS with no new errors. (Pre-existing warnings unrelated to this file are fine.)

- [ ] **Step 3: Commit**

```bash
git add src/components/PresentationBoxUpsell.tsx
git commit -m "feat: add PresentationBoxUpsell component"
```

---

## Task 2: Render the component in CartDrawer

**Files:**
- Modify: `src/components/CartDrawer.tsx` (add import; insert one render line above `<CartUpsell />`)

- [ ] **Step 1: Add the import**

In `src/components/CartDrawer.tsx`, find this block at the top of the file:

```tsx
import CartUpsell from './CartUpsell'
import CarbonOffsetToggle from './CarbonOffsetToggle'
```

Replace with:

```tsx
import CartUpsell from './CartUpsell'
import CarbonOffsetToggle from './CarbonOffsetToggle'
import PresentationBoxUpsell from './PresentationBoxUpsell'
```

- [ ] **Step 2: Render the component above CartUpsell**

In the same file, find this block (around line 618-619):

```tsx
              {/* Cross-sell Products */}
              <CartUpsell />
```

Replace with:

```tsx
              {/* Presentation box upsell (only when rum is in cart) */}
              <PresentationBoxUpsell />

              {/* Cross-sell Products */}
              <CartUpsell />
```

- [ ] **Step 3: Type-check and build**

Run: `npm run lint`
Expected: PASS with no new errors.

Run: `npm run build`
Expected: PASS. Successful Next.js build with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CartDrawer.tsx
git commit -m "feat: render PresentationBoxUpsell in cart drawer"
```

---

## Task 3: Add the box to gift collection pages

**Files:**
- Modify: `src/lib/categories.ts` (three `productHandles` arrays)

- [ ] **Step 1: Update `rum-gifts`**

In `src/lib/categories.ts`, find the `rum-gifts` block and its `productHandles`:

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
    ],
```

Replace with:

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'jerry-can-spirits-expedition-spiced-rum-presentation-box',
    ],
```

- [ ] **Step 2: Update `gifts-for-him`**

In `src/lib/categories.ts`, find the `gifts-for-him` block and its `productHandles`:

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
```

Replace with:

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'jerry-can-spirits-expedition-spiced-rum-presentation-box',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
```

- [ ] **Step 3: Update `gifts-for-her`**

In `src/lib/categories.ts`, find the `gifts-for-her` block and its `productHandles` (identical to `gifts-for-him`):

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
```

Replace with:

```ts
    productHandles: [
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'jerry-can-spirits-expedition-spiced-rum-presentation-box',
      'stainless-steel-jigger',
      'stainless-steel-spirit-stones',
      'crystal-ice-hiball-42cl',
    ],
```

- [ ] **Step 4: Type-check**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/categories.ts
git commit -m "feat: surface presentation box on gift collection pages"
```

---

## Task 4: Manual browser verification

**Goal:** Confirm the upsell behaves correctly end-to-end on the dev server.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open: `http://localhost:3000`

- [ ] **Step 2: Verify hidden state**

Open the cart drawer with an empty cart (or with only non-rum items). Expected: `PresentationBoxUpsell` does not render. `CartUpsell` renders as before.

- [ ] **Step 3: Verify visible state with rum in cart**

Add the rum (`/shop/product/jerry-can-spirits-expedition-spiced-rum`) to the cart. Open the cart. Expected:

- The presentation-box card is visible above "Complete Your Order".
- Box image renders.
- Stepper shows `1`, decrement disabled, increment disabled (rum qty is 1).
- Add button shows the box's unit price formatted as `Add £X.XX`.

- [ ] **Step 4: Verify stepper bound matches rum quantity**

Increase rum quantity in the cart drawer to 3. Expected:

- Stepper increment now enables; tap to reach `3`. Cannot exceed.
- Add button price updates to `3 × box price`.

- [ ] **Step 5: Verify add behaviour**

With stepper at `2`, click `Add £X.XX`. Expected:

- Cart shows a new line item: presentation box, qty 2.
- The upsell card remains visible (per spec: stay visible after adding).

Click `Add £X.XX` again at qty 1. Expected:

- The existing box line increments to qty 3 (Shopify cart merge), or a new line is added if Shopify creates a duplicate. If a duplicate appears, file a follow-up to detect-and-update instead.

- [ ] **Step 6: Verify clamp on rum reduction**

Reduce rum quantity to 1 in the cart drawer. Expected:

- Card stepper clamps from `>1` down to `1` automatically (the existing box line is unaffected).

- [ ] **Step 7: Verify card hides when rum is removed**

Remove all rum lines from the cart. Expected:

- The upsell card disappears.
- Any box lines already in the cart stay (they are normal products now).

- [ ] **Step 8: Verify collection pages**

The collection-page route is `src/app/shop/[collection]/page.tsx`, so URLs use the collection slug directly. Visit:

- `/shop/rum-gifts/`
- `/shop/gifts-for-him/`
- `/shop/gifts-for-her/`

Expected: the presentation box appears in each grid alongside the existing products.

- [ ] **Step 9: No commit needed for this task**

Manual verification only. If any step fails, return to the relevant task and fix.

---

## Task 5: Push the branch and open the PR

- [ ] **Step 1: Push**

```bash
git push -u origin feat/presentation-box-upsell
```

- [ ] **Step 2: Open PR with body**

Use `gh pr create` against `main` with title `feat: presentation box cart upsell`. Body should reference:

- The spec at `docs/superpowers/specs/2026-05-05-presentation-box-upsell-design.md`.
- A short summary: cart-drawer upsell appears only when the rum is in the cart, quantity bounded by rum quantity, also added to three gift collection pages.
- A test-plan checklist mirroring Task 4 steps 2 to 8.

- [ ] **Step 3: Wait for CI**

CI pipeline must pass before merge. If it fails, fix and push.

---

## Out-of-scope follow-ups (do not implement here)

- Bottle+box bundle product in Shopify (Shopify task, no code).
- Any rum-product-page copy referring to a bundled box (separate edit if found during verification).
- Adding the spec/plan files to git (track them in their own commit if desired; not required for this feature).
