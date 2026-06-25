import { describe, it, expect } from 'vitest'
import { batchCostP } from '@/lib/pouriq/prepared'
import { transitiveComponents, wouldCreateCycle, recomputeOrder } from '@/lib/pouriq/prepared'

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

const g = new Map<string, string[]>([
  ['syrup', ['sugar']],
  ['sour', ['syrup', 'lemon']],
])

describe('transitiveComponents', () => {
  it('returns all components transitively', () => {
    expect([...transitiveComponents(g, 'sour')].sort()).toEqual(['lemon', 'sugar', 'syrup'])
  })
})
describe('wouldCreateCycle', () => {
  it('rejects adding a parent into its child or itself', () => {
    expect(wouldCreateCycle(g, 'sugar', 'syrup')).toBe(true)
    expect(wouldCreateCycle(g, 'syrup', 'syrup')).toBe(true)
    expect(wouldCreateCycle(g, 'syrup', 'lemon')).toBe(false)
  })
})
describe('recomputeOrder', () => {
  it('orders affected prepared ingredients deepest-first', () => {
    expect(recomputeOrder(g, 'sugar')).toEqual(['syrup', 'sour'])
    expect(recomputeOrder(g, 'lemon')).toEqual(['sour'])
  })
})

import { sumProductionAfter } from '@/lib/pouriq/prepared'

describe('sumProductionAfter', () => {
  const rows = [
    { amount: 4000, produced_at: '2026-06-01T10:00:00Z' },
    { amount: 1000, produced_at: '2026-06-10T10:00:00Z' },
    { amount: 500, produced_at: '2026-05-20T10:00:00Z' },
  ]
  it('sums only rows strictly after the anchor', () => {
    expect(sumProductionAfter(rows, '2026-06-01T10:00:00Z')).toBe(1000)
  })
  it('sums all when anchor is before everything', () => {
    expect(sumProductionAfter(rows, '2026-01-01T00:00:00Z')).toBe(5500)
  })
  it('is 0 when anchor is after everything', () => {
    expect(sumProductionAfter(rows, '2026-07-01T00:00:00Z')).toBe(0)
  })
})
