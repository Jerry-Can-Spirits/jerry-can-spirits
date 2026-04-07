// src/lib/trade-products.ts
// Canonical list of products available on the trade order portal.
// Add new products here — prices are always fetched live from Shopify.

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
}

export const CATEGORY_LABELS: Record<TradeCategory, string> = {
  spirits: 'Spirits',
  glassware: 'Glassware',
  'bar-tools': 'Bar Tools',
  sustainability: 'Give Back',
}

export const TRADE_PRODUCTS: Array<{ handle: string; category: TradeCategory }> = [
  { handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles', category: 'spirits' },
  { handle: 'crystal-ice-hiball-42cl', category: 'glassware' },
  { handle: 'hiball-glass-38cl', category: 'glassware' },
  { handle: 'club-ice-tumbler-26cl', category: 'glassware' },
  { handle: 'hurricane-cocktail-glass-42cl', category: 'glassware' },
  { handle: 'bar-blade-bottle-opener', category: 'bar-tools' },
  { handle: 'stainless-steel-jigger', category: 'bar-tools' },
  { handle: 'uk-tree-fund', category: 'sustainability' },
]
