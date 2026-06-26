import { describe, it, expect } from 'vitest'
import { netPriceP } from '@/lib/pouriq/calculations'

describe('netPriceP', () => {
  it('passes ex-VAT prices through unchanged', () => {
    expect(netPriceP(1440, false)).toBe(1440)
    expect(netPriceP(0, false)).toBe(0)
  })

  it('divides inc-VAT prices by 1.20 and rounds to whole pence', () => {
    expect(netPriceP(1440, true)).toBe(1200) // £14.40 inc -> £12.00 net
    expect(netPriceP(1200, true)).toBe(1000) // £12.00 inc -> £10.00 net
    expect(netPriceP(999, true)).toBe(833)   // round(832.5)
    expect(netPriceP(0, true)).toBe(0)
  })
})
