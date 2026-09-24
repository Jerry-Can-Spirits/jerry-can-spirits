import type { ShopifyProduct } from './shopify'

// What the homepage grid shows and in what order. The grid exists so a first
// visit sees everything purchasable with a price, including the pieces a
// first order can be built from for very little, without leaving the page.
//
// Rules, in order:
//  - accessories to the bottle are not products in their own right: the
//    presentation box is offered in the cart once the bottle is in it, and the
//    tree fund is an optional contribution at checkout;
//  - anything not for sale is left off rather than shown greyed out;
//  - spirits first, cheapest first, so the bottle leads and the six-pack sits
//    after the gift pack; then everything else cheapest first, so the row
//    under the spirits is the low-ticket kit.
export const HOMEPAGE_EXCLUDED_HANDLES = [
  'uk-tree-fund',
  'jerry-can-spirits-expedition-spiced-rum-presentation-box',
]

export const HOMEPAGE_GRID_LIMIT = 12

function price(p: ShopifyProduct): number {
  const n = parseFloat(p.priceRange?.minVariantPrice?.amount ?? '')
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function forSale(p: ShopifyProduct): boolean {
  if (p.availableForSale === false) return false
  if (p.variants && p.variants.length > 0) return p.variants.some((v) => v.availableForSale)
  return true
}

export function selectHomepageProducts(products: ShopifyProduct[], limit = HOMEPAGE_GRID_LIMIT): ShopifyProduct[] {
  const eligible = products.filter((p) => !HOMEPAGE_EXCLUDED_HANDLES.includes(p.handle) && forSale(p))
  const spirits = eligible.filter((p) => p.productType === 'Spirits').sort((a, b) => price(a) - price(b))
  const rest = eligible.filter((p) => p.productType !== 'Spirits').sort((a, b) => price(a) - price(b))
  return [...spirits, ...rest].slice(0, limit)
}
