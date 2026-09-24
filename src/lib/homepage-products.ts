import type { ShopifyProduct } from './shopify'
import { CATEGORIES } from './categories'

// What the homepage shop section shows: every purchasable product with its
// price, in three rows a visitor can scroll sideways, so the rum is never
// buried under the cheap kit (Dan, 24 Sep 2026: with one price-sorted grid
// capped at twelve, the bottle, gift pack and six-pack were the three cut).
//
// Rules:
//  - accessories to the bottle are not products in their own right: the
//    presentation box is offered in the cart once the bottle is in it, and the
//    tree fund is an optional contribution at checkout;
//  - anything not for sale is left off rather than shown greyed out;
//  - the rum leads: bottle, gift pack, six-pack, cheapest first. Then the
//    glassware the serves were built in, then the tools, each cheapest first.
//    Glassware is whatever the two glass collections list, so the homepage
//    cannot disagree with the shop about what a glass is.
export const HOMEPAGE_EXCLUDED_HANDLES = [
  'uk-tree-fund',
  'jerry-can-spirits-expedition-spiced-rum-presentation-box',
]

export interface HomepageRow {
  key: 'rum' | 'glassware' | 'tools'
  title: string
  blurb: string
  href: string
  cta: string
  products: ShopifyProduct[]
}

const GLASSWARE_HANDLES = new Set([
  ...(CATEGORIES['rum-glasses'].productHandles ?? []),
  ...(CATEGORIES['cocktail-glasses-glassware'].productHandles ?? []),
])

function price(p: ShopifyProduct): number {
  const n = parseFloat(p.priceRange?.minVariantPrice?.amount ?? '')
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
}

function forSale(p: ShopifyProduct): boolean {
  if (p.availableForSale === false) return false
  if (p.variants && p.variants.length > 0) return p.variants.some((v) => v.availableForSale)
  return true
}

const byPrice = (a: ShopifyProduct, b: ShopifyProduct) => price(a) - price(b)

export function homepageProductRows(products: ShopifyProduct[]): HomepageRow[] {
  const eligible = products.filter((p) => !HOMEPAGE_EXCLUDED_HANDLES.includes(p.handle) && forSale(p))
  const rum = eligible.filter((p) => p.productType === 'Spirits')
  const glassware = eligible.filter((p) => p.productType !== 'Spirits' && GLASSWARE_HANDLES.has(p.handle))
  const tools = eligible.filter((p) => p.productType !== 'Spirits' && !GLASSWARE_HANDLES.has(p.handle))

  const rows: HomepageRow[] = [
    {
      key: 'rum',
      title: 'The rum.',
      blurb: 'The bottle on its own, boxed with the glass and jigger to serve it, or six at once.',
      href: '/shop/spiced-rum/',
      cta: 'All spirits',
      products: rum.sort(byPrice),
    },
    {
      key: 'glassware',
      title: 'Glassware.',
      blurb: 'The glasses the serves were built in.',
      href: '/shop/rum-glasses/',
      cta: 'All glassware',
      products: glassware.sort(byPrice),
    },
    {
      key: 'tools',
      title: 'Bar tools.',
      blurb: 'The jigger, the shaker, the stones, and the small things a first order can start with.',
      href: '/shop/bar-accessories/',
      cta: 'All bar tools',
      products: tools.sort(byPrice),
    },
  ]
  return rows.filter((r) => r.products.length > 0)
}
