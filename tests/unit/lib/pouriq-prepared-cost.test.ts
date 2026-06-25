import { describe, it, expect } from 'vitest'
import { batchCostP } from '@/lib/pouriq/prepared'

describe('batchCostP', () => {
  it('sums component costs (sugar -> simple syrup)', () => {
    const cost = batchCostP([
      { price_p: 100, purchase_qty: 1, pack_size: 1000, yield_pct: 100, amount_base: 1000 },
    ])
    expect(cost).toBe(100)
  })
  it('adds multiple components and applies yield', () => {
    const cost = batchCostP([
      { price_p: 1, purchase_qty: 1, pack_size: 1000, yield_pct: 100, amount_base: 500 },
      { price_p: 1000, purchase_qty: 1, pack_size: 1600000, yield_pct: 100, amount_base: 500 },
    ])
    expect(cost).toBe(1)
  })
  it('is 0 for no components', () => {
    expect(batchCostP([])).toBe(0)
  })
})
