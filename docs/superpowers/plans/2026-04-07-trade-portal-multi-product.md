# Trade Portal Multi-Product Order Form — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the trade order portal from a single rum case form to a multi-product form with live Shopify pricing, category grouping, multi-variant support, and a batched checkout.

**Architecture:** A static config (`trade-products.ts`) defines which Shopify handles appear on the trade portal and their category. The server page fetches live prices via `getProduct()` in parallel and passes resolved product data to the client form. The form replaces the single quantity state with a `Record<variantId, number>` map. The checkout route accepts a `lines` array and batches all items into one `cartLinesAdd` call via a new `addLinesToCart` helper.

**Tech Stack:** Next.js 15 App Router, TypeScript, Shopify Storefront API, Cloudflare Workers runtime, Tailwind CSS.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/lib/trade-products.ts` | Create | TRADE_PRODUCTS config + TradeProduct/TradeProductVariant types |
| `src/lib/shopify.ts` | Modify | Add `addLinesToCart(cartId, lines[])` — batch cart mutation |
| `src/app/trade/order/page.tsx` | Modify | Async server component — fetch products, pass to form |
| `src/components/TradeOrderForm.tsx` | Modify | Multi-product form with categories, variant rows, running total |
| `src/app/api/trade/checkout/route.ts` | Modify | Accept lines array, remove TRADE_CASE_VARIANT_ID, use addLinesToCart |

---

## Chunk 1: Data layer

### Task 1: Create trade-products config and types

**Files:**
- Create: `src/lib/trade-products.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/lib/trade-products.ts
// Canonical list of products available on the trade order portal.
// Add new products here — prices are always fetched live from Shopify.

export type TradeCategory = 'spirits' | 'glassware' | 'bar-tools'

export interface TradeProductVariant {
  id: string      // gid://shopify/ProductVariant/...
  title: string   // 'Default Title' | 'Silver' | 'Gold' | etc.
  price: string   // '210.0' — raw amount string from Shopify
}

export interface TradeProduct {
  handle: string
  title: string
  category: TradeCategory
  variants: TradeProductVariant[]
}

export const CATEGORY_LABELS: Record<TradeCategory, string> = {
  spirits: 'Spirits',
  glassware: 'Glassware',
  'bar-tools': 'Bar Tools',
}

export const TRADE_PRODUCTS: Array<{ handle: string; category: TradeCategory }> = [
  { handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles', category: 'spirits' },
  { handle: 'crystal-ice-hiball-42cl', category: 'glassware' },
  { handle: 'hiball-glass-38cl', category: 'glassware' },
  { handle: 'club-ice-tumbler-26cl', category: 'glassware' },
  { handle: 'hurricane-cocktail-glass-42cl', category: 'glassware' },
  { handle: 'bar-blade-bottle-opener', category: 'bar-tools' },
  { handle: 'stainless-steel-jigger', category: 'bar-tools' },
]
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/trade-products.ts
git commit -m "feat: add trade-products config and types"
```

---

### Task 2: Add addLinesToCart to shopify.ts

**Files:**
- Modify: `src/lib/shopify.ts`

The existing `addToCart` uses the `cartLinesAdd` mutation with a single-item `lines` array. `addLinesToCart` uses the same mutation with multiple items. Add it directly after the existing `addToCart` function.

- [ ] **Step 1: Add the function after `addToCart` (around line 582)**

```typescript
// Add multiple items to cart in a single mutation
export async function addLinesToCart(
  cartId: string,
  lines: Array<{ variantId: string; quantity: number }>
): Promise<Cart> {
  const query = `
    mutation AddLinesToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
          discountCodes {
            code
            applicable
          }
        }
      }
    }
  `

  const variables = {
    cartId,
    lines: lines.map(({ variantId, quantity }) => ({
      merchandiseId: variantId,
      quantity,
    })),
  }

  try {
    const { data, errors } = await getClient().request(query, { variables })

    if (errors) {
      console.error('GraphQL Errors:', errors)
      throw new Error('Failed to add lines to cart')
    }

    if (!data?.cartLinesAdd?.cart) {
      throw new Error('No cart data returned from Shopify')
    }

    return {
      ...data.cartLinesAdd.cart,
      lines: data.cartLinesAdd.cart.lines.edges.map((edge: CartLineEdge) => edge.node),
    }
  } catch (error) {
    console.error('Error adding lines to cart:', error)
    throw error
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/shopify.ts
git commit -m "feat: add addLinesToCart batch mutation to shopify lib"
```

---

## Chunk 2: Server page + checkout route

### Task 3: Update /trade/order/page.tsx to fetch products server-side

**Files:**
- Modify: `src/app/trade/order/page.tsx`

Replace the static server component with an async one that fetches live product data from Shopify and passes it to `TradeOrderForm`.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/app/trade/order/page.tsx
import type { Metadata } from 'next'
import { getProduct } from '@/lib/shopify'
import { TRADE_PRODUCTS, type TradeProduct } from '@/lib/trade-products'
import TradeOrderForm from '@/components/TradeOrderForm'

export const metadata: Metadata = {
  title: 'Trade Order Portal | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default async function TradeOrderPage() {
  let products: TradeProduct[] = []
  let fetchError: string | undefined

  try {
    const results = await Promise.all(
      TRADE_PRODUCTS.map(async ({ handle, category }) => {
        const product = await getProduct(handle)
        if (!product) return null

        return {
          handle,
          title: product.title,
          category,
          variants: product.variants.map((v) => ({
            id: v.id,
            title: v.title,
            price: v.price.amount,
          })),
        } satisfies TradeProduct
      })
    )

    products = results.filter((p): p is TradeProduct => p !== null)

    if (products.length === 0) {
      fetchError = 'Product catalogue unavailable. Please contact us to place your order.'
    }
  } catch {
    fetchError = 'Product catalogue unavailable. Please contact us to place your order.'
  }

  return (
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Trade
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
          Place a Trade Order
        </h1>
        <p className="text-parchment-400 text-sm mb-12 max-w-lg">
          Enter your trade PIN to access your account and place an order.
        </p>
        <TradeOrderForm products={products} error={fetchError} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: errors on `TradeOrderForm` props (not yet updated) — that is expected at this stage.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/order/page.tsx
git commit -m "feat: fetch trade products server-side in order page"
```

---

### Task 4: Update checkout route to accept lines array

**Files:**
- Modify: `src/app/api/trade/checkout/route.ts`

Replace single `{ quantity }` body with `{ lines: Array<{variantId, quantity}> }`. Remove `TRADE_CASE_VARIANT_ID`. Use `addLinesToCart` instead of `addToCart`.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/app/api/trade/checkout/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import { verifyTradeCookie, TRADE_COOKIE_NAME } from '@/lib/trade-cookie'
import { createCart, addLinesToCart, applyDiscount } from '@/lib/shopify'

interface CheckoutLine {
  variantId: string
  quantity: number
}

export async function POST(request: Request) {
  let body: { lines?: unknown }
  try {
    body = await request.json() as { lines?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Validate lines array
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: 'No items selected.' }, { status: 400 })
  }

  const lines: CheckoutLine[] = []
  for (const item of body.lines) {
    if (
      typeof item !== 'object' || item === null ||
      typeof (item as Record<string, unknown>).variantId !== 'string' ||
      typeof (item as Record<string, unknown>).quantity !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }

    const variantId = ((item as Record<string, unknown>).variantId as string).trim()
    const quantity = Math.floor((item as Record<string, unknown>).quantity as number)

    if (!variantId || variantId.length > 100) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100.' }, { status: 400 })
    }

    lines.push({ variantId, quantity })
  }

  // Read + verify the trade session cookie
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TRADE_COOKIE_NAME}=([^;]+)`)
  )
  const cookieValue = cookieMatch?.[1]

  if (!cookieValue) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const secret = env.TRADE_SESSION_SECRET as string | undefined

  if (!secret) {
    console.error('TRADE_SESSION_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const payload = await verifyTradeCookie(cookieValue, secret)
  if (!payload) {
    return NextResponse.json({ error: 'Session expired. Please re-enter your PIN.' }, { status: 401 })
  }

  const db = env.DB as D1Database
  const account = await getTradeAccountByPin(db, payload.pin)
  if (!account) {
    return NextResponse.json({ error: 'Account not found. Please contact us.' }, { status: 401 })
  }

  try {
    const cart = await createCart()
    const cartWithItems = await addLinesToCart(cart.id, lines)
    const cartWithDiscount = account.discount_code
      ? await applyDiscount(cartWithItems.id, [account.discount_code])
      : cartWithItems

    return NextResponse.json({ checkoutUrl: cartWithDiscount.checkoutUrl })
  } catch (err) {
    console.error('Trade checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: still errors on `TradeOrderForm` props — expected until Task 5.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/trade/checkout/route.ts
git commit -m "feat: update checkout route to accept multi-line orders"
```

---

## Chunk 3: Multi-product form

### Task 5: Rewrite TradeOrderForm for multi-product

**Files:**
- Modify: `src/components/TradeOrderForm.tsx`

Replace the single-product order stage with a grouped multi-product form. The PIN stage and loading spinner are unchanged.

- [ ] **Step 1: Rewrite the file**

```typescript
// src/components/TradeOrderForm.tsx
'use client'

import { useState } from 'react'
import {
  type TradeProduct,
  type TradeCategory,
  CATEGORY_LABELS,
} from '@/lib/trade-products'

type Stage = 'pin' | 'order' | 'loading'

interface VerifyResponse {
  venue_name: string
  tier: string
  error?: string
}

interface CheckoutResponse {
  checkoutUrl: string
  error?: string
}

const TIER_LABEL: Record<string, string> = {
  intro: 'Intro',
  standard: 'Standard',
  partner: 'Partner',
}

const CATEGORY_ORDER: TradeCategory[] = ['spirits', 'glassware', 'bar-tools']

function formatPrice(amount: string): string {
  return `£${parseFloat(amount).toFixed(2)}`
}

interface TradeOrderFormProps {
  products: TradeProduct[]
  error?: string
}

export default function TradeOrderForm({ products, error: catalogueError }: TradeOrderFormProps) {
  const [stage, setStage] = useState<Stage>('pin')
  const [pin, setPin] = useState('')
  const [venueName, setVenueName] = useState('')
  const [tier, setTier] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [formError, setFormError] = useState('')

  const setQuantity = (variantId: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, Math.min(99, value)) }))
  }

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0)

  const runningTotal = products
    .flatMap((p) => p.variants)
    .reduce((sum, v) => sum + parseFloat(v.price) * (quantities[v.id] ?? 0), 0)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json() as VerifyResponse

      if (!res.ok) {
        setFormError(data.error ?? 'Invalid PIN.')
        setStage('pin')
        return
      }

      setVenueName(data.venue_name)
      setTier(data.tier)
      setStage('order')
    } catch {
      setFormError('Something went wrong. Please try again.')
      setStage('pin')
    }
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setStage('loading')

    const lines = Object.entries(quantities)
      .filter(([, qty]) => qty > 0)
      .map(([variantId, quantity]) => ({ variantId, quantity }))

    try {
      const res = await fetch('/api/trade/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      })
      const data = await res.json() as CheckoutResponse

      if (!res.ok || !data.checkoutUrl) {
        setFormError(data.error ?? 'Failed to start checkout. Please try again.')
        setStage('order')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setFormError('Something went wrong. Please try again.')
      setStage('order')
    }
  }

  if (stage === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-parchment-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">One moment...</span>
        </div>
      </div>
    )
  }

  if (stage === 'pin') {
    return (
      <div className="max-w-sm">
        <p className="text-parchment-400 text-sm mb-8">
          Enter the trade access PIN from your welcome email.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="trade-pin" className="block text-parchment-500 text-xs uppercase tracking-widest mb-2">
              Trade PIN
            </label>
            <input
              id="trade-pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              autoComplete="off"
              className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-600 text-sm focus:outline-none focus:border-gold-400 transition-colors tracking-widest"
              placeholder="••••••••"
            />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <button
            type="submit"
            disabled={!pin.trim()}
            className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </form>
        <p className="mt-6 text-parchment-600 text-xs">
          Don&apos;t have a PIN?{' '}
          <a href="/trade/" className="text-gold-500 hover:text-gold-400 underline">
            Make a trade enquiry
          </a>
        </p>
      </div>
    )
  }

  // stage === 'order'
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <p className="text-gold-400 text-sm font-semibold mb-1">{venueName}</p>
        <p className="text-parchment-500 text-xs uppercase tracking-widest">
          {TIER_LABEL[tier] ?? tier} account
        </p>
      </div>

      {catalogueError ? (
        <div className="p-6 bg-jerry-green-800/20 border border-gold-500/20 rounded-xl">
          <p className="text-parchment-300 text-sm">{catalogueError}</p>
          <a
            href="mailto:partnerships@jerrycanspirits.co.uk"
            className="mt-4 inline-block text-gold-400 hover:text-gold-300 text-sm underline"
          >
            Contact us
          </a>
        </div>
      ) : (
        <form onSubmit={handleOrder} className="space-y-10">
          {CATEGORY_ORDER.map((category) => {
            const categoryProducts = products.filter((p) => p.category === category)
            if (categoryProducts.length === 0) return null

            return (
              <div key={category}>
                <h2 className="text-parchment-500 text-xs uppercase tracking-widest mb-4 pb-2 border-b border-gold-500/10">
                  {CATEGORY_LABELS[category]}
                </h2>
                <div className="space-y-4">
                  {categoryProducts.flatMap((product) =>
                    product.variants.map((variant) => {
                      const label =
                        variant.title === 'Default Title'
                          ? product.title
                          : `${product.title} — ${variant.title}`
                      const qty = quantities[variant.id] ?? 0

                      return (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between gap-4 py-3 border-b border-gold-500/10 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{label}</p>
                            <p className="text-parchment-500 text-xs mt-0.5">{formatPrice(variant.price)} each</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => setQuantity(variant.id, qty - 1)}
                              className="w-8 h-8 rounded border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-base font-bold"
                            >
                              −
                            </button>
                            <span className="text-white text-sm font-serif font-bold w-6 text-center">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuantity(variant.id, qty + 1)}
                              className="w-8 h-8 rounded border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-base font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}

          {/* Running total */}
          <div className="pt-4 border-t border-gold-500/20">
            <div className="flex items-baseline justify-between mb-1">
              <p className="text-parchment-500 text-xs uppercase tracking-widest">Order total</p>
              <p className="text-gold-400 text-xl font-serif font-bold">
                {formatPrice(runningTotal.toString())}
              </p>
            </div>
            <p className="text-parchment-600 text-xs mb-6">
              Your trade discount will be applied at checkout.
            </p>

            {formError && <p className="text-red-400 text-sm mb-4">{formError}</p>}

            <button
              type="submit"
              disabled={totalItems === 0}
              className="w-full sm:w-auto px-8 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to Checkout
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-parchment-600 text-xs">
        Questions?{' '}
        <a href="mailto:partnerships@jerrycanspirits.co.uk" className="text-gold-500 hover:text-gold-400 underline">
          Get in touch
        </a>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript — should now be clean**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TradeOrderForm.tsx
git commit -m "feat: rewrite TradeOrderForm for multi-product with category grouping"
```

---

## Chunk 4: Final checks and PR

### Task 6: Final verification and push

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Verify the order page renders**

Start the dev server and visit `/trade/order/`. Confirm:
- PIN entry stage renders correctly
- After entering the test PIN (`TEST1234`), the order form appears
- Products appear grouped under Spirits, Glassware, Bar Tools
- Jigger shows three separate rows (Silver, Gold, Gunmetal)
- Quantity steppers work — minimum 0
- Running total updates as quantities change
- "Your trade discount will be applied at checkout." is visible
- Checkout button disabled when all quantities are 0
- Checkout button proceeds to Shopify with discount applied

```bash
npx wrangler pages dev .open-next/assets --d1=DB=35c6ef4c-fab0-4666-9065-052b84ecdb9a
```

- [ ] **Step 3: Push and open PR**

```bash
git push -u origin feat/trade-multi-product
gh pr create --title "feat: multi-product trade order portal with live Shopify pricing" --body "$(cat <<'EOF'
## Summary
- Trade order portal now shows all trade products grouped by category (Spirits, Glassware, Bar Tools)
- Live prices fetched from Shopify at request time — no hardcoded amounts
- Jigger shows as three separate rows (Silver, Gold, Gunmetal) — all orderable in one order
- Running total updates live as quantities change
- Checkout batches all selected lines in one Shopify cartLinesAdd call
- Trade discount still applied server-side only

## New files
- `src/lib/trade-products.ts` — product config and shared types

## Test Plan
- [ ] Visit `/trade/order/`, enter trade PIN
- [ ] Confirm products appear in three category groups
- [ ] Adjust quantities across multiple products — running total updates correctly
- [ ] Jigger rows: Silver, Gold, Gunmetal each independently adjustable
- [ ] Checkout disabled when all quantities zero
- [ ] Proceed to checkout — all selected items appear in Shopify cart with discount applied
EOF
)"
```
