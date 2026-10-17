/**
 * The remaining Batch 001 count, read from the bottle's Shopify variant and
 * shown on the bottle page, the gift-boxed page and the offer landing page.
 * The rules: the exact figure, never rounded; nothing at all when Shopify
 * gives no figure or the count is not positive, so an unknown never reads as
 * zero and zero never reads as a claim.
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import BatchCount from '@/components/BatchCount'
import { BOTTLE_HANDLE, COUNTED_HANDLES, GIFT_BOXED_HANDLE, batchCountLine, remainingBottles } from '@/lib/batch-stock'
import type { ShopifyProduct } from '@/lib/shopify'

const render = (count?: number) => renderToStaticMarkup(createElement(BatchCount, { count }))

function bottle(quantityAvailable?: number): ShopifyProduct {
  return {
    id: 'gid://shopify/Product/15224526569849',
    title: 'Jerry Can Spirits - Expedition Spiced Rum',
    handle: BOTTLE_HANDLE,
    description: '',
    priceRange: { minVariantPrice: { amount: '40.00', currencyCode: 'GBP' } },
    images: [],
    variants: [
      {
        id: 'gid://shopify/ProductVariant/1',
        title: 'Default Title',
        price: { amount: '40.00', currencyCode: 'GBP' },
        availableForSale: true,
        ...(quantityAvailable === undefined ? {} : { quantityAvailable }),
      },
    ],
  }
}

describe('BatchCount', () => {
  it('renders the exact count with the batch label', () => {
    expect(render(404)).toContain('Batch 001: 404 bottles left')
    expect(render(397)).toContain('Batch 001: 397 bottles left')
  })

  it('renders nothing when the count is unknown', () => {
    expect(render(undefined)).toBe('')
  })

  it('renders nothing at zero or below', () => {
    expect(render(0)).toBe('')
    expect(render(-3)).toBe('')
  })

  it('says bottle, not bottles, for the last one', () => {
    expect(batchCountLine(1)).toBe('Batch 001: 1 bottle left')
  })

  it('uses no exclamation mark or em-dash', () => {
    expect(render(12)).not.toMatch(/[—!]/)
  })
})

describe('remainingBottles', () => {
  it('reads the bottle variant quantityAvailable', () => {
    expect(remainingBottles(bottle(404))).toBe(404)
  })

  it('is undefined without a figure, without a product, or at zero', () => {
    expect(remainingBottles(bottle())).toBeUndefined()
    expect(remainingBottles(null)).toBeUndefined()
    expect(remainingBottles(undefined)).toBeUndefined()
    expect(remainingBottles(bottle(0))).toBeUndefined()
    expect(remainingBottles(bottle(-1))).toBeUndefined()
  })

  it('counts on the bottle and the gift-boxed bundle, and reads the bottle for both', () => {
    expect(COUNTED_HANDLES).toEqual([BOTTLE_HANDLE, GIFT_BOXED_HANDLE])
    expect(BOTTLE_HANDLE).toBe('jerry-can-spirits-expedition-spiced-rum')
    expect(GIFT_BOXED_HANDLE).toBe('expedition-spiced-rum-gift-boxed')
  })
})
