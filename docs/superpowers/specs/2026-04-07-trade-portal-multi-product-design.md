# Trade Portal — Multi-Product Order Form Design

## Goal

Expand the trade order portal from a single-product (rum case) form to a multi-product order form that fetches live prices from Shopify, groups products by category, supports multiple variants per product, and applies trade discounts at checkout.

## Context

The trade portal lives at `/trade/order/`. It is PIN-gated — venues enter their trade PIN, which is validated against the `trade_accounts` D1 table and sets a signed HMAC cookie. On the order form stage, they select quantities and proceed to Shopify checkout with their tier discount applied server-side.

The current implementation hardcodes £210 for the rum case and supports a single line item in the checkout. This design replaces that with a dynamic multi-product form.

## Architecture

### New file: `src/lib/trade-products.ts`

Defines the canonical list of trade products as a static config. Each entry has:

- `handle` — Shopify product handle
- `category` — display grouping (`'spirits' | 'glassware' | 'bar-tools'`)

Adding a new product to the trade portal in future is one entry in this array. Price data is never stored here — it is always fetched from Shopify at runtime. Category is sourced from this config, not from Shopify taxonomy, so display grouping stays independent of Shopify.

```ts
export const TRADE_PRODUCTS = [
  { handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles', category: 'spirits' },
  { handle: 'crystal-ice-hiball-42cl', category: 'glassware' },
  { handle: 'hiball-glass-38cl', category: 'glassware' },
  { handle: 'club-ice-tumbler-26cl', category: 'glassware' },
  { handle: 'hurricane-cocktail-glass-42cl', category: 'glassware' },
  { handle: 'bar-blade-bottle-opener', category: 'bar-tools' },
  { handle: 'stainless-steel-jigger', category: 'bar-tools' },
] as const
```

### Modified: `src/app/trade/order/page.tsx`

Becomes a proper async server component. Calls the existing `getProduct(handle)` from `src/lib/shopify.ts` for each handle in `TRADE_PRODUCTS`, in parallel via `Promise.all`. Maps the results to `TradeProduct[]` and passes them to `TradeOrderForm` as props.

Uses the public Shopify Storefront API credentials (`NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN`) — the same credentials used everywhere in the codebase. No elevated permissions needed.

If all fetches fail (Shopify unreachable), passes an `error` prop to `TradeOrderForm` with the message: `"Product catalogue unavailable. Please contact us to place your order."`. If a single product fetch returns null (product deleted from Shopify), that product is silently omitted from the list.

### Modified: `src/components/TradeOrderForm.tsx`

Accepts two additional props:
- `products: TradeProduct[]` — resolved from Shopify
- `error?: string` — set when product catalogue fetch failed

If `error` is set, the order form stage renders the error message with a contact link instead of the product list.

On the order form stage (no error):

- Products are grouped under three category headers: **Spirits**, **Glassware**, **Bar Tools**
- Each variant is its own row: variant name, price per unit formatted as `£X.XX`, quantity stepper (default 0, minimum 0)
- For single-variant products (variant title is `'Default Title'`), the row label is the product title. For multi-variant products, the row label is `{productTitle} — {variantTitle}` (e.g. "Stainless Steel Jigger — Silver")
- The jigger renders as three separate rows under Bar Tools (Silver, Gold, Gunmetal)
- Running total updates live: sum of `quantity × parseFloat(price)` across all variants, formatted as `£X.XX`
- "Your trade discount will be applied at checkout." displayed below the total — always visible
- Checkout button disabled when no variant has quantity > 0

Form state: `Record<variantId, number>` — a map of variant ID to quantity.

### Modified: `src/app/api/trade/checkout/route.ts`

Request body changes from `{ quantity: number }` to `{ lines: Array<{ variantId: string, quantity: number }> }`.

Removes the read of `env.TRADE_CASE_VARIANT_ID` — variant IDs now come from the client via the `lines` array.

Validation:
- At least one line with quantity > 0
- Each quantity is a positive integer ≤ 100
- Each variantId is a non-empty string ≤ 100 chars (format check only — Shopify will reject invalid IDs)

Adds all valid lines to the cart in a single `cartLinesAdd` mutation via a new `addLinesToCart(cartId, lines[])` function in `src/lib/shopify.ts`. This replaces the current sequential `addToCart` approach and avoids N serial round-trips to Shopify.

Then applies the discount code once. Returns `{ checkoutUrl }`.

### New function: `addLinesToCart` in `src/lib/shopify.ts`

```ts
addLinesToCart(cartId: string, lines: Array<{ variantId: string, quantity: number }>): Promise<Cart>
```

Uses the `cartLinesAdd` mutation with the full `lines` array in a single API call. Returns a `Cart`. This is more efficient than the existing `addToCart` which adds one line at a time.

## Data Flow

```
page.tsx (server)
  → read TRADE_PRODUCTS config
  → call getProduct(handle) for each in parallel via Promise.all
  → map to TradeProduct[] (omitting nulls)
  → if all null/failed → pass error prop to TradeOrderForm
  → else → pass products prop to TradeOrderForm

TradeOrderForm (client)
  PIN stage → unchanged
  Order stage (error prop set):
    → render error message + contact link
  Order stage (products prop):
    → render products grouped by category
    → maintain Record<variantId, number> in state
    → compute running total (parseFloat(price) × quantity, formatted £X.XX)
    → on submit → POST /api/trade/checkout with lines array

/api/trade/checkout (server)
  → verify HMAC cookie → look up account in D1
  → validate lines
  → createCart → addLinesToCart (single batch call) → applyDiscount
  → return checkoutUrl
```

## Type Definitions

Defined in `src/lib/trade-products.ts` and imported by both `page.tsx` and `TradeOrderForm.tsx`:

```ts
export interface TradeProductVariant {
  id: string        // gid://shopify/ProductVariant/...
  title: string     // 'Default Title' | 'Silver' | 'Gold' | etc.
  price: string     // '210.0' — format from Shopify Storefront API
}

export interface TradeProduct {
  handle: string
  title: string
  category: 'spirits' | 'glassware' | 'bar-tools'
  variants: TradeProductVariant[]
}
```

## Price Formatting

All prices displayed as `£X.XX` using `parseFloat(price).toFixed(2)`. Currency is always GBP for trade orders. The `currencyCode` from Shopify is not displayed.

## Category Labels

| Key | Display label |
|---|---|
| `spirits` | Spirits |
| `glassware` | Glassware |
| `bar-tools` | Bar Tools |

## What Is Not Changing

- PIN entry stage and cookie mechanism — unchanged
- D1 `trade_accounts` table — unchanged
- `/api/trade/verify` route — unchanged
- `/trade/page.tsx` — unchanged
- Discount application — server-side only, code never reaches browser
- `TRADE_SESSION_SECRET` Cloudflare secret — still required
- `TRADE_CASE_VARIANT_ID` Cloudflare secret — **removed** from route.ts (variant IDs now come from the client); the secret itself can remain in Cloudflare but is no longer read by the code
