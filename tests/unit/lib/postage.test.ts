import { describe, expect, it } from 'vitest'
import { postageProgress, postsFree } from '@/lib/postage'
import { FREE_SHIPPING_THRESHOLD_GBP } from '@/lib/pricing'
import type { CartLine } from '@/lib/shopify'

function line(handle: string, productType: string, amount: string, tags: string[] = []): CartLine {
  return {
    id: `gid://shopify/CartLine/${handle}`,
    quantity: 1,
    merchandise: {
      id: `gid://shopify/ProductVariant/${handle}`,
      title: 'Default Title',
      product: { id: `gid://shopify/Product/${handle}`, title: handle, handle, productType, tags },
      price: { amount, currencyCode: 'GBP' },
    },
    cost: { totalAmount: { amount, currencyCode: 'GBP' } },
  }
}

const shirt = line('explorers-inventory-t-shirt', 'Apparel', '29.99', ['Accessories', 'Gift', 'Premium'])
const blade = line('bar-blade-bottle-opener', 'Barware', '7.50')
const bottle = line('jerry-can-spirits-expedition-spiced-rum', 'Spirits', '40.00')

describe('postsFree', () => {
  it('is apparel, by productType or by Gelato print material', () => {
    expect(postsFree(shirt)).toBe(true)
    expect(postsFree(line('x', 'Print Material', '25.00'))).toBe(true)
    expect(postsFree(blade)).toBe(false)
    expect(postsFree(bottle)).toBe(false)
  })
})

describe('postageProgress', () => {
  it('judges a basket without apparel exactly on the cart subtotal', () => {
    const p = postageProgress([blade], 7.5)
    expect(p).toEqual({ subtotal: 7.5, shortfall: FREE_SHIPPING_THRESHOLD_GBP - 7.5, hasApparel: false, apparelOnly: false })
  })

  it('shows no shortfall for a shirt on its own', () => {
    const p = postageProgress([shirt], 29.99)
    expect(p.apparelOnly).toBe(true)
    expect(p.subtotal).toBe(0)
  })

  it('leaves the shirt out of the sum when it sits with other items', () => {
    const p = postageProgress([shirt, blade], 37.49)
    expect(p.hasApparel).toBe(true)
    expect(p.apparelOnly).toBe(false)
    expect(p.subtotal).toBeCloseTo(7.5)
    expect(p.shortfall).toBeCloseTo(FREE_SHIPPING_THRESHOLD_GBP - 7.5)
  })

  it('still unlocks when the rest of the basket clears the threshold', () => {
    const p = postageProgress([shirt, bottle], 69.99)
    expect(p.shortfall).toBeLessThanOrEqual(0)
  })
})
