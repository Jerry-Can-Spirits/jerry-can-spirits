import type { ShopifyProduct } from './shopify'

// Gift pages by budget. Each band page lists an explicit set of handles, the
// way every other category page does, and then applies the band as a guard at
// render: a product whose live price has drifted above the band drops off the
// page rather than sitting under a heading it no longer belongs to. "Under" is
// inclusive of the boundary, which is how shoppers and every comparable gift
// guide read it: a £20 hip flask belongs on the under-£20 page.

/** The lowest variant price, or NaN when the product carries none. */
export function minPrice(p: ShopifyProduct): number {
  return parseFloat(p.priceRange?.minVariantPrice?.amount ?? '')
}

/**
 * Keeps products priced at or under the band and orders them from the top
 * of the band down, so the page leads with the fullest gift the budget buys.
 * Products with no parseable price are dropped: a page cannot vouch for a
 * price it does not know. Sort is stable, so equal prices keep list order.
 */
export function applyPriceBand(products: ShopifyProduct[], maxPrice: number): ShopifyProduct[] {
  return products
    .map((p, i) => ({ p, i, price: minPrice(p) }))
    .filter(({ price }) => Number.isFinite(price) && price <= maxPrice)
    .sort((a, b) => b.price - a.price || a.i - b.i)
    .map(({ p }) => p)
}

export const GIFT_BANDS = [20, 50, 100] as const
export type GiftBand = (typeof GIFT_BANDS)[number]

export function giftBandSlug(max: GiftBand): string {
  return `gifts-under-${max}`
}

export function giftBandLabel(max: GiftBand): string {
  return `Gifts under £${max}`
}
