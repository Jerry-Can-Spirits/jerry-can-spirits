/**
 * The homepage shop rows.
 *
 * The section promises a first visit sees everything purchasable with a
 * price, the rum first and never buried. So the rule is pinned: the spirits
 * row leads cheapest first, glassware is whatever the glass collections list,
 * everything else is a tool, accessories and the tree fund never appear,
 * nothing unavailable appears, and an empty row is dropped.
 */
import { describe, expect, it } from 'vitest'
import { homepageProductRows } from '@/lib/homepage-products'
import type { ShopifyProduct } from '@/lib/shopify'

function p(handle: string, amount: string, productType: string, available = true): ShopifyProduct {
  return {
    id: `gid://shopify/Product/${handle}`,
    title: handle,
    handle,
    description: '',
    productType,
    priceRange: { minVariantPrice: { amount, currencyCode: 'GBP' }, maxVariantPrice: { amount, currencyCode: 'GBP' } },
    images: [],
    variants: [{ id: `v-${handle}`, title: 'Default Title', price: { amount, currencyCode: 'GBP' }, availableForSale: available }],
  }
}

const catalogue = [
  p('metal-logo-keyring', '7.50', 'Barware'),
  p('jerry-can-spirits-premium-gift-pack', '90.00', 'Spirits'),
  p('uk-tree-fund', '1.00', ''),
  p('crystal-ice-hiball-42cl', '18.50', 'Barware'),
  p('stainless-steel-jigger', '12.50', 'Barware'),
  p('jerry-can-spirits-expedition-spiced-rum', '40.00', 'Spirits'),
  p('jerry-can-spirits-expedition-spiced-rum-presentation-box', '1.99', ''),
  p('hiball-glass-38cl', '10.00', 'Barware'),
  p('jerry-can-spirits-expedition-pack-spiced-rum-6-bottles', '228.00', 'Spirits'),
  p('bar-blade-bottle-opener', '7.50', 'Barware'),
  p('sold-out-thing', '15.00', 'Barware', false),
]

const handles = (rows: ReturnType<typeof homepageProductRows>, key: string) =>
  rows.find((r) => r.key === key)?.products.map((x) => x.handle)

describe('homepageProductRows', () => {
  it('leads with the rum, cheapest first: bottle, gift pack, six-pack', () => {
    const rows = homepageProductRows(catalogue)
    expect(rows[0].key).toBe('rum')
    expect(handles(rows, 'rum')).toEqual([
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-premium-gift-pack',
      'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
    ])
  })

  it('puts the glass collections in the glassware row and everything else in tools, cheapest first', () => {
    const rows = homepageProductRows(catalogue)
    expect(rows.map((r) => r.key)).toEqual(['rum', 'glassware', 'tools'])
    expect(handles(rows, 'glassware')).toEqual(['hiball-glass-38cl', 'crystal-ice-hiball-42cl'])
    expect(handles(rows, 'tools')).toEqual(['metal-logo-keyring', 'bar-blade-bottle-opener', 'stainless-steel-jigger'])
  })

  it('never shows the tree fund, the presentation box or anything not for sale', () => {
    const all = homepageProductRows(catalogue).flatMap((r) => r.products.map((x) => x.handle))
    expect(all).not.toContain('uk-tree-fund')
    expect(all).not.toContain('jerry-can-spirits-expedition-spiced-rum-presentation-box')
    expect(all).not.toContain('sold-out-thing')
  })

  it('shows every eligible product somewhere, exactly once', () => {
    const all = homepageProductRows(catalogue).flatMap((r) => r.products.map((x) => x.handle))
    expect(all).toHaveLength(8)
    expect(new Set(all).size).toBe(8)
  })

  it('drops a row with nothing in it', () => {
    const rows = homepageProductRows(catalogue.filter((x) => x.productType !== 'Spirits'))
    expect(rows.map((r) => r.key)).toEqual(['glassware', 'tools'])
  })

  it('every row links to its shop page with a trailing slash', () => {
    for (const row of homepageProductRows(catalogue)) {
      expect(row.href).toMatch(/^\/shop\/[a-z-]+\/$/)
    }
  })

  it('treats a product with no variants and no availability flag as for sale', () => {
    const bare: ShopifyProduct = { ...p('bare', '9.00', 'Barware'), variants: undefined }
    expect(handles(homepageProductRows([bare]), 'tools')).toEqual(['bare'])
  })
})
