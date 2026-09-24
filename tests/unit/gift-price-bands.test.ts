/**
 * Gift pages by budget.
 *
 * The guard is the point: a band page promises every product on it is at or
 * under the number in the heading, and that promise is kept at render from
 * live prices rather than by trusting a handle list written on one day. The
 * config assertions pin what the guard cannot see: that the three bands nest,
 * that each carries the shared gift FAQs and cluster links, and that the
 * heading, slug and guard all come from one number.
 */
import { describe, expect, it } from 'vitest'
import { applyPriceBand, GIFT_BANDS, giftBandLabel, giftBandSlug, minPrice } from '@/lib/price-band'
import { CATEGORIES } from '@/lib/categories'
import type { ShopifyProduct } from '@/lib/shopify'

function product(handle: string, amount: string): ShopifyProduct {
  return {
    id: `gid://shopify/Product/${handle}`,
    title: handle,
    handle,
    description: '',
    priceRange: { minVariantPrice: { amount, currencyCode: 'GBP' }, maxVariantPrice: { amount, currencyCode: 'GBP' } },
    images: [],
  }
}

describe('applyPriceBand', () => {
  it('keeps products at or under the band, inclusive, and drops the rest', () => {
    const kept = applyPriceBand([product('a', '7.50'), product('b', '20.00'), product('c', '20.01'), product('d', '40.00')], 20)
    expect(kept.map((p) => p.handle)).toEqual(['b', 'a'])
  })

  it('orders from the top of the band down, keeping list order for equal prices', () => {
    const kept = applyPriceBand([product('x', '10.00'), product('y', '12.50'), product('z', '10.00'), product('w', '18.50')], 20)
    expect(kept.map((p) => p.handle)).toEqual(['w', 'y', 'x', 'z'])
  })

  it('drops a product with no parseable price rather than guessing', () => {
    const p = product('nan', '')
    expect(Number.isNaN(minPrice(p))).toBe(true)
    expect(applyPriceBand([p, product('ok', '5.00')], 20).map((x) => x.handle)).toEqual(['ok'])
  })
})

describe('gift band pages', () => {
  it('exist for 20, 50 and 100 with slug, heading and guard from one number', () => {
    for (const max of GIFT_BANDS) {
      const slug = giftBandSlug(max)
      const cfg = CATEGORIES[slug]
      expect(cfg, slug).toBeDefined()
      expect(cfg.h1).toBe(giftBandLabel(max))
      expect(cfg.h1).toBe(`Gifts under £${max}`)
      expect(cfg.maxPrice).toBe(max)
      expect(cfg.faqs?.length).toBeGreaterThan(0)
      expect(cfg.relatedLinks?.some((l) => l.href === `/shop/${slug}/`)).toBe(true)
    }
  })

  it('nest: everything on the smaller page is on the larger one', () => {
    const [b20, b50, b100] = GIFT_BANDS.map((m) => CATEGORIES[giftBandSlug(m)].productHandles ?? [])
    for (const h of b20) expect(b50, h).toContain(h)
    for (const h of b50) expect(b100, h).toContain(h)
    expect(b50).toContain('jerry-can-spirits-expedition-spiced-rum')
    expect(b100).toContain('jerry-can-spirits-premium-gift-pack')
    expect(b20).not.toContain('jerry-can-spirits-expedition-spiced-rum')
  })

  it('leave the six-pack, the presentation box and the tree fund off every band', () => {
    for (const max of GIFT_BANDS) {
      const handles = CATEGORIES[giftBandSlug(max)].productHandles ?? []
      expect(handles).not.toContain('jerry-can-spirits-expedition-pack-spiced-rum-6-bottles')
      expect(handles).not.toContain('jerry-can-spirits-expedition-spiced-rum-presentation-box')
      expect(handles).not.toContain('uk-tree-fund')
    }
  })

  it('carry no product prices in copy, only the band in the heading', () => {
    for (const max of GIFT_BANDS) {
      const cfg = CATEGORIES[giftBandSlug(max)]
      const copy = [cfg.metaDescription, ...cfg.introBody].join(' ')
      expect(copy).not.toMatch(/£\d/)
      expect(copy).not.toMatch(/[–—!]/)
    }
  })

  it('every gift page links to the three bands', () => {
    for (const slug of ['rum-gifts', 'gifts-for-him', 'gifts-for-her']) {
      const links = CATEGORIES[slug].relatedLinks ?? []
      for (const max of GIFT_BANDS) expect(links.some((l) => l.href === `/shop/${giftBandSlug(max)}/`), `${slug} → ${max}`).toBe(true)
    }
  })
})
