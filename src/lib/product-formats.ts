// The rum is one liquid sold several ways. The product pages for those four were
// siblings that never mentioned each other except through an algorithmic
// "worth looking at" grid at the bottom, so a visitor on the bottle page had
// no way to see the six-pack existed without leaving. This is the family and
// the order the formats are shown in, from the entry price up. The bottle
// and box together is a format (gift boxed); the presentation box on its own
// is not: it is an add-on the cart offers once the
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
    handle: 'expedition-spiced-rum-gift-boxed',
    label: 'Gift boxed',
    note: 'The bottle in its presentation box',
  },
  {
    handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
    label: 'Six bottles',
    note: 'One case',
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
  //
  // Deliberately absent: 15828640039289 expedition-spiced-rum-gift-boxed. It
  // is a Shopify fixed bundle, and an order for a bundle carries its component
  // lines (the bottle above and the presentation box), grouped under the
  // bundle, never a line for the bundle itself. The bottle is already counted
  // here; adding the bundle would count every gift-boxed sale twice.
}

/** Formats sold as a Shopify fixed bundle, counted through their component lines. */
export const BUNDLE_FORMATS: Record<string, number[]> = {
  'expedition-spiced-rum-gift-boxed': [15224526569849, 15489763017081],
}

/** Bottles of rum in a set of order line items. */
export function countBottles(lineItems: Array<{ product_id: number; quantity: number }>): number {
  return lineItems.reduce((sum, li) => sum + (BOTTLES_PER_UNIT[li.product_id] ?? 0) * li.quantity, 0)
}

// The same count keyed by SKU, for Shopify's orders export, which carries
// SKUs and no product ids (scripts/backfill-bottle-map.ts --csv). The webhook
// keeps to product ids above: a SKU has already been renamed once, and a
// renamed SKU here would silently stop counting.
export const BOTTLES_PER_SKU: Record<string, number> = {
  'JCSES7040-DP': 1, // jerry-can-spirits-expedition-spiced-rum
  'JCSES7040-DP-X6': 6, // jerry-can-spirits-expedition-pack-spiced-rum-6-bottles
  'RUM-SPICED-002': 1, // jerry-can-spirits-premium-gift-pack
  // Zero, so absent: SKU-1109 presentation box, and the barware.
}

/**
 * The gift-boxed bundle's own SKU. In an export its line may sit beside the
 * bottle and box component lines or stand alone; either way the order holds
 * one bottle per unit.
 */
export const GIFT_BOXED_SKU = 'JCSES-GIFTSET'

/** Bottles of rum in an export's line items, counted by SKU. */
export function countBottlesBySku(lineItems: Array<{ sku?: string | null; quantity: number }>): number {
  const hasBottleLine = lineItems.some((li) => li.sku === 'JCSES7040-DP')
  return lineItems.reduce((sum, li) => {
    if (li.sku === GIFT_BOXED_SKU) return hasBottleLine ? sum : sum + li.quantity
    return sum + (BOTTLES_PER_SKU[li.sku ?? ''] ?? 0) * li.quantity
  }, 0)
}
