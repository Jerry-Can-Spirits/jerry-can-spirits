# Trade Order Portal Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A PIN-gated `/trade/order/` page where approved trade accounts can select a quantity and check out at their tier price, with discount codes applied server-side and the public `/trade/` page no longer exposing pricing.

**Architecture:** Trade accounts are stored in D1 (`trade_accounts` table: PIN, discount code, tier, venue name). A `POST /api/trade/verify` route validates a PIN and sets an HMAC-signed httpOnly cookie. A `POST /api/trade/checkout` route reads that cookie, looks up the discount code server-side, creates a Shopify cart via the Storefront API with the correct variant + quantity + discount, and returns the checkout URL. The discount code never reaches the browser.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1, Shopify Storefront API (`createCart`, `addToCart`, `applyDiscount` already in `src/lib/shopify.ts`), Web Crypto API (HMAC-SHA-256 for cookie signing), Next.js route handlers, Tailwind CSS.

---

## Before writing any code — Shopify + Cloudflare setup (Dan does this)

These steps must be done before the code can be tested. They don't require any code changes.

### Shopify

1. In Shopify admin, create a new product:
   - **Title:** Expedition Spiced — Trade Case (6 Bottles)
   - **Price:** £210.00 (inc VAT — this is the standard tier price)
   - **Track quantity:** off (or set to a high number)
   - **Only available in specific sales channels:** consider hiding from the public storefront so it can't be found by browsing
   - Save the product and copy the **variant ID** from the URL or via Storefront API — it will look like `gid://shopify/ProductVariant/12345678901234`

2. In Shopify admin → Discounts, create discount codes:
   - `TRADE-INTRO` — fixed amount £30 off (brings £210 to £180 for first orders)
   - `TRADE-STANDARD` — no discount needed (or create a £0 code for tracking purposes)
   - `TRADE-PARTNER` — configure based on agreed partner pricing

   These codes go in the `discount_code` column of `trade_accounts` rows. Dan controls which code each venue gets.

### Cloudflare secrets (via Wrangler CLI or Cloudflare dashboard)

Run locally in the project root:

```bash
# Generate a random 32-char secret (run this in terminal, paste output as value)
openssl rand -base64 32

# Add to Cloudflare Workers secrets
npx wrangler secret put TRADE_SESSION_SECRET
# paste the generated value when prompted

# Add the Shopify variant ID (full gid:// format)
npx wrangler secret put TRADE_CASE_VARIANT_ID
# paste: gid://shopify/ProductVariant/YOUR_VARIANT_ID
```

For local dev, add to `.env.local`:
```
TRADE_SESSION_SECRET=any-local-dev-secret-min-32-chars
TRADE_CASE_VARIANT_ID=gid://shopify/ProductVariant/YOUR_VARIANT_ID
```

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `migrations/0013_trade_accounts.sql` | Create | D1 table for trade accounts |
| `src/lib/d1.ts` | Modify | Add `getTradeAccountByPin` query |
| `src/lib/trade-cookie.ts` | Create | HMAC cookie sign/verify utilities |
| `src/app/api/trade/verify/route.ts` | Create | POST: validates PIN, sets cookie |
| `src/app/api/trade/checkout/route.ts` | Create | POST: creates Shopify cart + discount, returns checkoutUrl |
| `src/components/TradeOrderForm.tsx` | Create | Client component: PIN entry → order form |
| `src/app/trade/order/page.tsx` | Create | Server page wrapper for TradeOrderForm |
| `src/app/trade/page.tsx` | Modify | Remove pricing table, add order portal CTA |

---

## Chunk 1: Database + D1 helpers

### Task 1: D1 migration — trade_accounts table

**Files:**
- Create: `migrations/0013_trade_accounts.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Trade accounts: PIN-gated access for approved trade customers
-- Each row is one venue with their PIN, tier, and discount code.
-- Apply with: npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0013_trade_accounts.sql

CREATE TABLE IF NOT EXISTS trade_accounts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  pin TEXT NOT NULL UNIQUE,
  discount_code TEXT NOT NULL,
  tier TEXT NOT NULL CHECK(tier IN ('intro', 'standard', 'partner')),
  venue_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Apply migration to remote D1**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0013_trade_accounts.sql
```

Expected output: `Executed 1 command`

- [ ] **Step 3: Add a test row for local dev (remote)**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command \
  "INSERT INTO trade_accounts (pin, discount_code, tier, venue_name) VALUES ('TEST1234', 'TRADE-INTRO', 'intro', 'Test Venue');"
```

- [ ] **Step 4: Commit**

```bash
git add migrations/0013_trade_accounts.sql
git commit -m "feat: add trade_accounts D1 migration"
```

---

### Task 2: Add getTradeAccountByPin to D1 lib

**Files:**
- Modify: `src/lib/d1.ts`

- [ ] **Step 1: Add the TradeAccount interface and query function**

At the end of `src/lib/d1.ts`, append:

```typescript
// ── Trade Account Queries ─────────────────────────────────────────────

export interface TradeAccount {
  id: string;
  pin: string;
  discount_code: string;
  tier: 'intro' | 'standard' | 'partner';
  venue_name: string;
  active: number;
}

export async function getTradeAccountByPin(
  db: D1Database,
  pin: string,
): Promise<TradeAccount | null> {
  return db
    .prepare('SELECT * FROM trade_accounts WHERE pin = ? AND active = 1')
    .bind(pin)
    .first<TradeAccount>();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/d1.ts
git commit -m "feat: add getTradeAccountByPin D1 query"
```

---

## Chunk 2: Cookie utilities + API routes

### Task 3: HMAC cookie signing utilities

**Files:**
- Create: `src/lib/trade-cookie.ts`

This module signs and verifies the trade session cookie. The cookie stores the PIN and a timestamp, HMAC-signed with `TRADE_SESSION_SECRET`. The discount code never leaves the server.

- [ ] **Step 1: Create the file**

```typescript
// src/lib/trade-cookie.ts
// HMAC-signed cookie utilities for the trade order portal.
// The cookie stores { pin, iat } signed with TRADE_SESSION_SECRET.
// The discount code is never stored client-side.

export const TRADE_COOKIE_NAME = 'jcs_trade'
export const TRADE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

function toBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  )
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface TradeCookiePayload {
  pin: string
  iat: number
}

/** Create a signed cookie value from a payload. */
export async function signTradeCookie(
  payload: TradeCookiePayload,
  secret: string
): Promise<string> {
  const data = toBase64url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${toBase64url(sig)}`
}

/** Verify and decode a cookie value. Returns null if invalid or expired. */
export async function verifyTradeCookie(
  cookieValue: string,
  secret: string
): Promise<TradeCookiePayload | null> {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null

  const [data, sig] = parts

  try {
    const key = await getKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64url(sig),
      new TextEncoder().encode(data)
    )
    if (!valid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64url(data))
    ) as TradeCookiePayload

    // Reject if older than 30 days
    const age = (Date.now() - payload.iat) / 1000
    if (age > TRADE_COOKIE_MAX_AGE) return null

    return payload
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/trade-cookie.ts
git commit -m "feat: add HMAC trade cookie sign/verify utilities"
```

---

### Task 4: POST /api/trade/verify route

**Files:**
- Create: `src/app/api/trade/verify/route.ts`

Accepts `{ pin: string }`. Looks up the PIN in D1. If valid, sets the signed httpOnly cookie and returns `{ venue_name, tier }`. The discount code is never returned.

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/trade/verify/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import {
  signTradeCookie,
  TRADE_COOKIE_NAME,
  TRADE_COOKIE_MAX_AGE,
} from '@/lib/trade-cookie'

export async function POST(request: Request) {
  let body: { pin?: unknown }
  try {
    body = await request.json() as { pin?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
  if (!pin || pin.length > 50) {
    return NextResponse.json({ error: 'Invalid PIN.' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const secret = env.TRADE_SESSION_SECRET as string | undefined

  if (!secret) {
    console.error('TRADE_SESSION_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const db = env.DB as D1Database
  const account = await getTradeAccountByPin(db, pin)

  if (!account) {
    // Constant-time-ish response to avoid timing attacks
    await new Promise((r) => setTimeout(r, 200))
    return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 })
  }

  const cookieValue = await signTradeCookie({ pin, iat: Date.now() }, secret)

  const res = NextResponse.json({
    venue_name: account.venue_name,
    tier: account.tier,
  })

  res.cookies.set(TRADE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: TRADE_COOKIE_MAX_AGE,
    path: '/',
  })

  return res
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/trade/verify/route.ts
git commit -m "feat: add POST /api/trade/verify PIN validation route"
```

---

### Task 5: POST /api/trade/checkout route

**Files:**
- Create: `src/app/api/trade/checkout/route.ts`

Reads the signed cookie, re-validates the PIN in D1, then creates a Shopify cart with the trade case variant + requested quantity + discount code. Returns `{ checkoutUrl }`. The discount code is applied entirely server-side.

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/trade/checkout/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import { verifyTradeCookie, TRADE_COOKIE_NAME } from '@/lib/trade-cookie'
import { createCart, addToCart, applyDiscount } from '@/lib/shopify'

export async function POST(request: Request) {
  let body: { quantity?: unknown }
  try {
    body = await request.json() as { quantity?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const quantity = typeof body.quantity === 'number'
    ? Math.floor(body.quantity)
    : parseInt(String(body.quantity), 10)

  if (!quantity || quantity < 1 || quantity > 100) {
    return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
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
  const variantId = env.TRADE_CASE_VARIANT_ID as string | undefined

  if (!secret || !variantId) {
    console.error('TRADE_SESSION_SECRET or TRADE_CASE_VARIANT_ID not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const payload = await verifyTradeCookie(cookieValue, secret)
  if (!payload) {
    return NextResponse.json({ error: 'Session expired. Please re-enter your PIN.' }, { status: 401 })
  }

  // Re-validate PIN is still active in D1
  const db = env.DB as D1Database
  const account = await getTradeAccountByPin(db, payload.pin)
  if (!account) {
    return NextResponse.json({ error: 'Account not found. Please contact us.' }, { status: 401 })
  }

  // Create cart, add item, apply discount — all server-side
  try {
    const cart = await createCart()
    const cartWithItem = await addToCart(cart.id, variantId, quantity)
    const cartWithDiscount = await applyDiscount(cartWithItem.id, [account.discount_code])

    return NextResponse.json({ checkoutUrl: cartWithDiscount.checkoutUrl })
  } catch (err) {
    console.error('Trade checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/trade/checkout/route.ts
git commit -m "feat: add POST /api/trade/checkout server-side cart creation"
```

---

## Chunk 3: Trade order page

### Task 6: TradeOrderForm client component

**Files:**
- Create: `src/components/TradeOrderForm.tsx`

Two states: PIN entry and order form. PIN entry validates against `/api/trade/verify`. On success, shows the order form with a quantity selector. On submit, calls `/api/trade/checkout` and redirects to the returned checkout URL.

- [ ] **Step 1: Create the component**

```typescript
// src/components/TradeOrderForm.tsx
'use client'

import { useState } from 'react'

type Stage = 'pin' | 'order' | 'loading'

interface VerifyResponse {
  venue_name: string
  tier: 'intro' | 'standard' | 'partner'
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

export default function TradeOrderForm() {
  const [stage, setStage] = useState<Stage>('pin')
  const [pin, setPin] = useState('')
  const [venueName, setVenueName] = useState('')
  const [tier, setTier] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [error, setError] = useState('')

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() }),
      })
      const data = await res.json() as VerifyResponse

      if (!res.ok) {
        setError(data.error ?? 'Invalid PIN.')
        setStage('pin')
        return
      }

      setVenueName(data.venue_name)
      setTier(data.tier)
      setStage('order')
    } catch {
      setError('Something went wrong. Please try again.')
      setStage('pin')
    }
  }

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStage('loading')

    try {
      const res = await fetch('/api/trade/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })
      const data = await res.json() as CheckoutResponse

      if (!res.ok || !data.checkoutUrl) {
        setError(data.error ?? 'Failed to start checkout. Please try again.')
        setStage('order')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError('Something went wrong. Please try again.')
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
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
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
    <div className="max-w-sm">
      <p className="text-gold-400 text-sm font-semibold mb-1">{venueName}</p>
      <p className="text-parchment-500 text-xs uppercase tracking-widest mb-8">
        {TIER_LABEL[tier] ?? tier} account
      </p>

      <form onSubmit={handleOrder} className="space-y-6">
        <div>
          <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">Product</p>
          <p className="text-white font-semibold">Expedition Spiced — Trade Case</p>
          <p className="text-parchment-400 text-sm">6 × 700ml bottles, 40% ABV</p>
        </div>

        <div>
          <label htmlFor="trade-quantity" className="block text-parchment-500 text-xs uppercase tracking-widest mb-2">
            Cases
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-lg font-bold"
            >
              −
            </button>
            <span className="text-white text-xl font-serif font-bold w-8 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(99, quantity + 1))}
              className="w-10 h-10 rounded-lg border border-gold-500/30 text-gold-300 hover:border-gold-400 hover:text-gold-200 transition-colors flex items-center justify-center text-lg font-bold"
            >
              +
            </button>
            <span className="text-parchment-400 text-sm">
              {quantity * 6} bottles total
            </span>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold text-sm uppercase tracking-wide rounded-lg hover:bg-gold-400 transition-colors"
        >
          Proceed to Checkout
        </button>
      </form>

      <p className="mt-6 text-parchment-600 text-xs">
        Your trade pricing will be applied automatically at checkout.
        Questions?{' '}
        <a href="mailto:partnerships@jerrycanspirits.co.uk" className="text-gold-500 hover:text-gold-400 underline">
          Get in touch
        </a>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TradeOrderForm.tsx
git commit -m "feat: add TradeOrderForm client component with PIN + order stages"
```

---

### Task 7: /trade/order/page.tsx

**Files:**
- Create: `src/app/trade/order/page.tsx`

Minimal server wrapper. No indexing (noindex meta) — this page is private.

- [ ] **Step 1: Create the page**

```typescript
// src/app/trade/order/page.tsx
import type { Metadata } from 'next'
import TradeOrderForm from '@/components/TradeOrderForm'

export const metadata: Metadata = {
  title: 'Trade Order Portal | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default function TradeOrderPage() {
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
        <TradeOrderForm />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/trade/order/page.tsx
git commit -m "feat: add /trade/order/ page with noindex and TradeOrderForm"
```

---

## Chunk 4: Update public trade page

### Task 8: Remove pricing table, add order portal CTA

**Files:**
- Modify: `src/app/trade/page.tsx`

Two changes: (1) delete Section 4 (the pricing table) entirely; (2) add a brief "Already a trade customer?" block above the enquiry form section pointing to `/trade/order/`.

- [ ] **Step 1: Delete Section 4 (lines 124–166)**

Remove the entire `{/* ── Section 4: Pricing ── */}` section — everything from the opening `<section className="py-16 border-t border-gold-500/10">` that contains "Pricing" through to and including its closing `</section>`.

- [ ] **Step 2: Add the existing customer CTA block before Section 6**

Replace the opening of Section 6 (`{/* ── Section 6: Enquiry Form ── */}`) with:

```tsx
      {/* ── Existing Trade Customer ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-8 max-w-xl">
            <h2 className="text-xl font-serif font-bold text-white mb-2">
              Already a trade customer?
            </h2>
            <p className="text-parchment-400 text-sm mb-6">
              Use your trade portal to place or repeat an order.
            </p>
            <a
              href="/trade/order/"
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
            >
              Trade Order Portal
            </a>
          </div>
        </div>
      </section>

      {/* ── Section 6: Enquiry Form ── */}
```

- [ ] **Step 3: Verify the file compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/page.tsx
git commit -m "feat: remove public pricing table, add trade order portal CTA"
```

---

## Adding a new trade account (operational, no code change needed)

When a venue is approved, run one Wrangler command to add them:

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command \
  "INSERT INTO trade_accounts (pin, discount_code, tier, venue_name) VALUES ('YOURPIN', 'TRADE-INTRO', 'intro', 'The Bank Bar & Grill');"
```

- Choose any PIN (suggest 8 characters, e.g. random letters/numbers)
- Set `discount_code` to the Shopify discount code for their tier
- Set `tier` to `intro`, `standard`, or `partner`
- Send the venue: their PIN + a link to `https://jerrycanspirits.co.uk/trade/order/`

To deactivate an account (e.g. lapsed venue): set `active = 0`:

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command \
  "UPDATE trade_accounts SET active = 0 WHERE venue_name = 'The Bank Bar & Grill';"
```
