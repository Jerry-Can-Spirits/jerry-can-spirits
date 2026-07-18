// src/lib/trade-products.ts
// Canonical list of products available on the trade order portal.
// Add new products here — prices are always fetched live from Shopify.

import { getProduct } from '@/lib/shopify'

export type TradeCategory = 'spirits' | 'glassware' | 'bar-tools' | 'sustainability'

export interface TradeProductVariant {
  id: string      // gid://shopify/ProductVariant/...
  title: string   // 'Default Title' | 'Silver' | 'Gold' | etc.
  price: string   // '210.0' — raw amount string from Shopify
}

export interface TradeProduct {
  handle: string
  title: string
  category: TradeCategory
  featuredImage?: { url: string; altText: string | null }
  variants: TradeProductVariant[]
  // Items the trade-tier Shopify discount codes do NOT apply to (e.g. the
  // Ecologi tree donation, which always charges £1 regardless of tier).
  // Mirrors the product scope configured on the Shopify discount itself —
  // keep this flag in sync with the discount code's eligibility rules.
  excludeFromDiscount?: boolean
}

export const CATEGORY_LABELS: Record<TradeCategory, string> = {
  spirits: 'Spirits',
  glassware: 'Glassware',
  'bar-tools': 'Bar Tools',
  sustainability: 'Give Back',
}

export const TRADE_PRODUCTS: Array<{
  handle: string
  category: TradeCategory
  excludeFromDiscount?: boolean
}> = [
  { handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles', category: 'spirits' },
  // Single bottle for low-volume trade accounts. Excluded from trade
  // discount codes — the margin doesn't support discounting at single-unit
  // volume, and most venues claim the VAT back regardless.
  { handle: 'jerry-can-spirits-expedition-spiced-rum', category: 'spirits', excludeFromDiscount: true },
  { handle: 'crystal-ice-hiball-42cl', category: 'glassware' },
  { handle: 'hiball-glass-38cl', category: 'glassware' },
  { handle: 'club-ice-tumbler-26cl', category: 'glassware' },
  { handle: 'hurricane-cocktail-glass-42cl', category: 'glassware' },
  { handle: 'bar-blade-bottle-opener', category: 'bar-tools' },
  { handle: 'stainless-steel-jigger', category: 'bar-tools' },
  { handle: 'uk-tree-fund', category: 'sustainability', excludeFromDiscount: true },
]

// Resolve every TRADE_PRODUCTS entry to its live Shopify product via
// getProduct(handle) — an EXACT handle lookup (product(handle:)), variants
// first: 10. This is the single source of truth for the trade catalogue: the
// order page renders from it and the checkout guard derives its allowed set
// from it, so a product visible in the portal is always purchasable and the two
// cannot drift. (An earlier version resolved the guard via getProductsByHandles
// — a fuzzy products(query:"handle:...") search built for upsell — which
// silently dropped sized glassware and the multi-bottle pack and blocked their
// orders.)
export async function getTradeProducts(): Promise<TradeProduct[]> {
  const results = await Promise.all(
    TRADE_PRODUCTS.map(
      async ({ handle, category, excludeFromDiscount }): Promise<TradeProduct | null> => {
        const product = await getProduct(handle)
        if (!product) return null
        return {
          handle,
          title: product.title,
          category,
          featuredImage: product.images[0] ?? undefined,
          variants: (product.variants || []).map((v) => ({
            id: v.id,
            title: v.title,
            price: v.price.amount,
          })),
          excludeFromDiscount,
        }
      },
    ),
  )
  return results.filter((p): p is TradeProduct => p !== null)
}

// The set of Shopify variant IDs orderable through the trade portal: every
// variant of every resolved trade product. The checkout validates a submitted
// cart against this, so an authenticated account cannot build a cart from
// arbitrary (non-trade) Shopify variants (finding #6). Derived from
// getTradeProducts() — the exact source the order page displays.
export async function getTradeVariantIdSet(): Promise<Set<string>> {
  const products = await getTradeProducts()
  const ids = new Set<string>()
  for (const product of products) {
    for (const variant of product.variants) ids.add(variant.id)
  }
  return ids
}
