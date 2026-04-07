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

Adding a new product to the trade portal in future is one entry in this array. Price data is never stored here — it is always fetched from Shopify at runtime.

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

Becomes a proper async server component. Fetches all trade product data from the Shopify Storefront API in parallel at request time. Passes resolved product data (title, variants with id/title/price) to `TradeOrderForm` as props.

If a product fetch fails, the page still renders — that product is omitted rather than breaking the whole page.

### Modified: `src/components/TradeOrderForm.tsx`

Accepts a `products` prop of type `TradeProduct[]` (resolved from Shopify). The PIN/session flow is unchanged.

On the order form stage:

- Products are grouped under three category headers: **Spirits**, **Glassware**, **Bar Tools**
- Each variant is its own row: variant title (or product title for single-variant products), price per unit, quantity stepper (default 0, minimum 0)
- The jigger renders as three separate rows under Bar Tools (Silver, Gold, Gunmetal)
- A running total updates live across all selected items
- "Your trade discount will be applied at checkout." displayed below the total — always visible, not conditional
- Checkout button disabled when total quantity is zero across all items

Form state: `Record<variantId, number>` — a map of variant ID to quantity.

### Modified: `src/app/api/trade/checkout/route.ts`

Request body changes from `{ quantity: number }` to `{ lines: Array<{ variantId: string, quantity: number }> }`.

Validation:
- At least one line with quantity > 0
- Each quantity is a positive integer ≤ 100
- Each variantId is a non-empty string ≤ 100 chars (format check only — Shopify will reject invalid IDs)

Adds all valid lines to the cart (one `addToCart` call per line), then applies the discount code once. Returns `{ checkoutUrl }`.

## Data Flow

```
page.tsx (server)
  → fetch trade product handles from TRADE_PRODUCTS config
  → query Shopify Storefront API for each handle in parallel
  → resolve to TradeProduct[] (title, variants: [{id, title, price}])
  → pass as props to TradeOrderForm

TradeOrderForm (client)
  PIN stage → unchanged
  Order stage:
    → render products grouped by category
    → maintain variantId → quantity map in state
    → compute running total from quantities × prices
    → on submit → POST /api/trade/checkout with lines array

/api/trade/checkout (server)
  → verify HMAC cookie → look up account in D1
  → validate lines
  → createCart → addToCart (×N lines) → applyDiscount
  → return checkoutUrl
```

## Type Definitions

```ts
// Resolved product data passed from server to client
export interface TradeProductVariant {
  id: string        // gid://shopify/ProductVariant/...
  title: string     // 'Default Title' | 'Silver' | 'Gold' | etc.
  price: string     // '210.0'
}

export interface TradeProduct {
  handle: string
  title: string
  category: 'spirits' | 'glassware' | 'bar-tools'
  variants: TradeProductVariant[]
}
```

## Category Labels

| Key | Display label |
|---|---|
| `spirits` | Spirits |
| `glassware` | Glassware |
| `bar-tools` | Bar Tools |

## Variant Row Display

For single-variant products (where variant title is `'Default Title'`), show the product title only. For multi-variant products (jigger), show `{productTitle} — {variantTitle}`.

## Error Handling

- If Shopify is unreachable when fetching product data, the page renders with an error state rather than crashing
- If a product handle resolves to null (product deleted from Shopify), it is silently omitted from the list
- Checkout route validation errors return 400 with a user-facing message

## What Is Not Changing

- PIN entry stage and cookie mechanism — unchanged
- D1 `trade_accounts` table — unchanged
- `/api/trade/verify` route — unchanged
- `/trade/page.tsx` — unchanged
- Discount application — server-side only, code never reaches browser
