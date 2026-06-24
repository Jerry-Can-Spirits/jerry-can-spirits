import { describe, it, expect } from 'vitest'
import { receiptBottlesFromInvoiceLine, computeOnHandBottles } from '@/lib/pouriq/stock'

describe('receiptBottlesFromInvoiceLine', () => {
  it('passes quantity through when purchase_qty is 1', () => {
    expect(receiptBottlesFromInvoiceLine(12, 1)).toBe(12)
  })
  it('multiplies by purchase_qty for cases', () => {
    expect(receiptBottlesFromInvoiceLine(1, 24)).toBe(24)
    expect(receiptBottlesFromInvoiceLine(2, 24)).toBe(48)
  })
  it('treats purchase_qty 0 as 1 (defensive)', () => {
    expect(receiptBottlesFromInvoiceLine(5, 0)).toBe(5)
  })
  it('returns null when quantity is unknown', () => {
    expect(receiptBottlesFromInvoiceLine(null, 24)).toBeNull()
  })
})

describe('computeOnHandBottles', () => {
  const base = { anchorCountQty: 10, receiptsSinceBottles: 5, usageSinceMl: 3500, bottleSizeMl: 700, yieldPct: 100 }
  it('on-hand = count + receipts - usage/yield (in bottles)', () => {
    expect(computeOnHandBottles(base)).toBeCloseTo(10, 6)
  })
  it('lower yield depletes faster', () => {
    expect(computeOnHandBottles({ ...base, yieldPct: 50 })).toBeCloseTo(5, 6)
  })
  it('can go negative (caller clamps for display)', () => {
    expect(computeOnHandBottles({ ...base, usageSinceMl: 14000 })).toBeCloseTo(-5, 6)
  })
})
