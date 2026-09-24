// The rum is one liquid sold four ways. The product pages for those four were
// siblings that never mentioned each other except through an algorithmic
// "worth looking at" grid at the bottom, so a visitor on the bottle page had
// no way to see the six-pack existed without leaving. This is the family and
// the order the formats are shown in, from the entry price up. The
// presentation box is not a format: it is an add-on the cart offers once the
// bottle is in it (PresentationBoxUpsell), and it stays there.
export interface ProductFormat {
  handle: string
  /** Short label for the format chip. Never the full product title. */
  label: string
  /** One line under the label. What this format is for. */
  note: string
}

export const RUM_FORMATS: ProductFormat[] = [
  {
    handle: 'jerry-can-spirits-expedition-spiced-rum',
    label: 'Bottle',
    note: '700ml, 40% ABV',
  },
  {
    handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
    label: 'Six-pack',
    note: 'Six bottles, one case',
  },
  {
    handle: 'jerry-can-spirits-premium-gift-pack',
    label: 'Gift pack',
    note: 'Bottle, hiball, jigger and coaster, boxed',
  },
]

/** The formats to show on a product page, or an empty list for products outside the family. */
export function formatsForHandle(handle: string): ProductFormat[] {
  return RUM_FORMATS.some((f) => f.handle === handle) ? RUM_FORMATS : []
}

// How many 700ml bottles of the rum a product actually contains.
//
// Keyed by Shopify product id because that is the only identifier that has
// held still: the six-pack's SKU has already been renamed once
// (RUM-SPICED-003 to JCSES7040-DP-X6), and matching on the title counted the
// Bar Blade as a bottle because its name begins "Jerry Can Spirits".
//
// Anything absent is zero, which is the safe direction for a public count: a
// new format nobody adds here under-reports rather than overstating what was
// sold. The webhook logs when an order of ours comes to zero.
export const BOTTLES_PER_UNIT: Record<number, number> = {
  15224526569849: 1, // jerry-can-spirits-expedition-spiced-rum
  15320931172729: 6, // jerry-can-spirits-expedition-pack-spiced-rum-6-bottles
  15224531845497: 1, // jerry-can-spirits-premium-gift-pack
  // Not bottles, and previously counted as one each by the title match:
  // 15489763017081 presentation box, 15245613269369 bar blade.
}

/** Bottles of rum in a set of order line items. */
export function countBottles(lineItems: Array<{ product_id: number; quantity: number }>): number {
  return lineItems.reduce((sum, li) => sum + (BOTTLES_PER_UNIT[li.product_id] ?? 0) * li.quantity, 0)
}
