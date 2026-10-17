import type { ShopifyProduct } from '@/lib/shopify'

// The remaining Batch 001 count, read live from Shopify (the brief of 17 Oct
// 2026: the count comes back, fed from inventory, never rounded). The bottle's
// variant carries the figure; the gift-boxed bundle is a Shopify fixed bundle
// of that bottle and the presentation box, so its stock is the bottle's and
// both pages read the bottle.
export const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
export const GIFT_BOXED_HANDLE = 'expedition-spiced-rum-gift-boxed'

/** The product pages that show the count. */
export const COUNTED_HANDLES = [BOTTLE_HANDLE, GIFT_BOXED_HANDLE]

export const BATCH_LABEL = 'Batch 001'

/** Bottles left, or undefined when Shopify gave no figure or the count is not positive. */
export function remainingBottles(bottle: ShopifyProduct | null | undefined): number | undefined {
  const q = bottle?.variants?.[0]?.quantityAvailable
  return typeof q === 'number' && Number.isInteger(q) && q > 0 ? q : undefined
}

export function batchCountLine(count: number): string {
  return `${BATCH_LABEL}: ${count} ${count === 1 ? 'bottle' : 'bottles'} left`
}
