import { FREE_SHIPPING_THRESHOLD_GBP } from './pricing'
import { resolveCategory, type CartLine } from './shopify'

// Apparel is printed and posted by Gelato under its own Shopify shipping
// profile ("Gelato: Free shipping": GB flat rate £0, no condition), with the
// postage built into the price. Shopify judges the free-delivery threshold on
// the General profile's own items, so a shirt in the basket neither pays
// postage nor counts towards free postage for anything else. Before this the
// drawer summed the whole basket and told a buyer with one £29.99 shirt they
// were £5.01 short of free delivery (Dan, 27 Oct 2026).

export function postsFree(line: CartLine): boolean {
  return resolveCategory(line.merchandise.product.productType, line.merchandise.product.tags) === 'clothing'
}

export interface PostageProgress {
  /** What the threshold is judged on: the basket less anything that posts free. */
  subtotal: number
  shortfall: number
  hasApparel: boolean
  /** Nothing in the basket pays postage, so there is no threshold to show. */
  apparelOnly: boolean
}

/** cartSubtotal is the cart's subtotalAmount, so a basket without apparel is judged exactly as before. */
export function postageProgress(lines: CartLine[], cartSubtotal: number): PostageProgress {
  const apparel = lines.filter(postsFree)
  const apparelTotal = apparel.reduce((sum, l) => sum + parseFloat(l.cost?.totalAmount.amount ?? '0'), 0)
  const subtotal = Math.max(0, cartSubtotal - apparelTotal)
  return {
    subtotal,
    shortfall: FREE_SHIPPING_THRESHOLD_GBP - subtotal,
    hasApparel: apparel.length > 0,
    apparelOnly: apparel.length > 0 && apparel.length === lines.length,
  }
}
