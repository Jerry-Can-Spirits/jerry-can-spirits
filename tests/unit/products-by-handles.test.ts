/**
 * Fetching several products by handle.
 *
 * The "Ways to buy" block on the rum pages showed the six-pack only on the
 * six-pack's own page. The lookup asked the Storefront API for
 * `products(query: "handle:a OR handle:b")`, and that filter is not honoured:
 * measured against the live shop, it returned all 18 products in store order,
 * quoted or not. Asking for two therefore returned the first two in the shop,
 * and the six-pack sits sixteenth.
 *
 * These pin the shape that replaced it: one exact lookup per handle, no search.
 */
import { describe, expect, it } from 'vitest'
import { productsByHandlesQuery } from '@/lib/shopify'

const SIX = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'
const GIFT = 'jerry-can-spirits-premium-gift-pack'

describe('productsByHandlesQuery', () => {
  it('looks each handle up exactly, rather than searching for it', () => {
    const q = productsByHandlesQuery([SIX, GIFT])
    expect(q).toContain(`product(handle: "${SIX}")`)
    expect(q).toContain(`product(handle: "${GIFT}")`)
  })

  it('never uses the search filter that caused this', () => {
    const q = productsByHandlesQuery([SIX, GIFT])
    expect(q).not.toContain('handle:' + SIX)
    expect(q).not.toMatch(/products\s*\(/)
    expect(q).not.toContain(' OR ')
  })

  it('asks for one alias per handle, so nothing can crowd anything out', () => {
    const q = productsByHandlesQuery([SIX, GIFT, 'a-third'])
    expect(q.match(/p\d+: product\(handle:/g)).toHaveLength(3)
    expect(q).toContain('p0:')
    expect(q).toContain('p2:')
  })

  it('escapes the handle into the query rather than pasting it in', () => {
    const q = productsByHandlesQuery(['odd"handle'])
    expect(q).toContain('product(handle: "odd\\"handle")')
  })

  it('asks for the fields the formats block renders', () => {
    const q = productsByHandlesQuery([SIX])
    for (const field of ['handle', 'priceRange', 'minVariantPrice', 'availableForSale', 'variants']) {
      expect(q, field).toContain(field)
    }
  })
})
