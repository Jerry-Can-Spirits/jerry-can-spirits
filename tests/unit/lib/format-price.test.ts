/**
 * The reason this file exists is "£NaN".
 *
 * Ten hand-rolled copies of formatPrice all did parseFloat().toFixed(2) with no
 * guard, so a missing price rendered as a currency symbol followed by NaN. The
 * behaviour that replaced it is worth pinning: a value that cannot be parsed
 * produces a placeholder, never a number and never a zero.
 */
import { describe, it, expect } from 'vitest'
import { formatPrice, PRICE_UNAVAILABLE } from '@/lib/format-price'

describe('formatPrice', () => {
  // VOICE: "£45, never £45.00". Pence appear only when there are pence.
  it('formats a string amount, pence only when there are pence', () => {
    expect(formatPrice('35', 'GBP')).toBe('£35')
    expect(formatPrice('35.5', 'GBP')).toBe('£35.50')
    expect(formatPrice('1.99', 'GBP')).toBe('£1.99')
    expect(formatPrice('40.00', 'GBP')).toBe('£40')
  })

  it('formats a number amount, which CartUpsell passes', () => {
    expect(formatPrice(20, 'GBP')).toBe('£20')
    expect(formatPrice(22.5, 'GBP')).toBe('£22.50')
  })

  it('defaults to sterling, which TradeOrderForm relied on by hardcoding it', () => {
    expect(formatPrice('45')).toBe('£45')
  })

  it('knows the three currencies the shop uses', () => {
    expect(formatPrice('10', 'USD')).toBe('$10')
    expect(formatPrice('10', 'EUR')).toBe('€10')
  })

  it('falls back to the code for a currency it does not know', () => {
    expect(formatPrice('10', 'JPY')).toBe('JPY10')
  })

  // The whole point.
  it('never renders NaN', () => {
    for (const bad of ['', '  ', 'free', null, undefined, NaN]) {
      expect(formatPrice(bad as never, 'GBP')).toBe(PRICE_UNAVAILABLE)
    }
  })

  it('does not turn an unparseable price into zero', () => {
    expect(formatPrice(undefined)).not.toBe('£0.00')
    expect(formatPrice(undefined)).not.toBe('£0')
  })
})
