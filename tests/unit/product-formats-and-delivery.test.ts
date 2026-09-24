/**
 * Two small sources of truth that copy across the site now reads from.
 *
 * The delivery promise was stated four different ways before it was a
 * constant; the assertion here is that the short and long forms agree with
 * each other and with the ruling. The rum family is the list a product page
 * uses to show its sibling formats, so its membership and order are pinned:
 * a handle rename in Shopify would silently drop a format from the strip.
 */
import { describe, expect, it } from 'vitest'
import { DELIVERY_PROMISE, DELIVERY_PROMISE_SENTENCE, DELIVERY_WINDOW_LABEL, DISPATCH_CUTOFF_LABEL } from '@/lib/delivery'
import { RUM_FORMATS, formatsForHandle } from '@/lib/product-formats'

describe('delivery promise', () => {
  it('reads order by 3pm, delivered in 1 to 2 working days', () => {
    expect(DISPATCH_CUTOFF_LABEL).toBe('3pm')
    expect(DELIVERY_WINDOW_LABEL).toBe('1 to 2 working days')
    expect(DELIVERY_PROMISE).toBe('Order by 3pm, delivered in 1 to 2 working days')
  })

  it('long form carries the same cutoff and window and the weekend rule', () => {
    expect(DELIVERY_PROMISE_SENTENCE).toContain('before 3pm')
    expect(DELIVERY_PROMISE_SENTENCE).toContain('within 1 to 2 working days')
    expect(DELIVERY_PROMISE_SENTENCE).toContain('weekend')
  })

  it('never says 3 to 5 days again', () => {
    for (const s of [DELIVERY_PROMISE, DELIVERY_PROMISE_SENTENCE]) {
      expect(s).not.toMatch(/3\s*(-|to)\s*5/)
      expect(s).not.toMatch(/[–—!]/)
    }
  })
})

describe('rum formats', () => {
  it('lists bottle, six-pack and gift pack in that order', () => {
    expect(RUM_FORMATS.map((f) => f.handle)).toEqual([
      'jerry-can-spirits-expedition-spiced-rum',
      'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
      'jerry-can-spirits-premium-gift-pack',
    ])
    expect(RUM_FORMATS.map((f) => f.label)).toEqual(['Bottle', 'Six-pack', 'Gift pack'])
  })

  it('shows the family on every member page and nothing elsewhere', () => {
    for (const f of RUM_FORMATS) expect(formatsForHandle(f.handle)).toBe(RUM_FORMATS)
    expect(formatsForHandle('stainless-steel-jigger')).toEqual([])
    expect(formatsForHandle('jerry-can-spirits-expedition-spiced-rum-presentation-box')).toEqual([])
  })

  it('keeps chip copy short and in voice', () => {
    for (const f of RUM_FORMATS) {
      expect(f.label.length).toBeLessThanOrEqual(12)
      expect(f.note).not.toMatch(/[–—!]/)
    }
  })
})
