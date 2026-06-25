import { describe, it, expect } from 'vitest'
import { classifyDrinkPerformance, buildMenuPerformance } from '@/lib/pouriq/menu-performance'
import type { CocktailMetrics } from '@/lib/pouriq/types'

function drink(opts: { id: string; sale?: number; gp?: number; complete?: boolean; units?: number }): CocktailMetrics {
  return {
    cocktail_id: opts.id,
    name: opts.id,
    sale_price_p: opts.sale ?? 1000,
    net_sale_p: opts.sale ?? 1000,
    pour_cost_p: 200,
    margin_p: (opts.sale ?? 1000) - 200,
    gp_pct: opts.gp ?? 80,
    cost_complete: opts.complete ?? true,
    ...(opts.units !== undefined ? { volume: { units_sold: opts.units, period_start: '', period_end: '', contribution_p: 0 } } : {}),
  }
}

describe('classifyDrinkPerformance', () => {
  const ctx = { targetGpPct: 70, popularityThreshold: 10, hasSales: true }
  it('flags data problems first', () => {
    expect(classifyDrinkPerformance(drink({ id: 'a', sale: 0 }), ctx)).toBe('needs-price')
    expect(classifyDrinkPerformance(drink({ id: 'b', complete: false }), ctx)).toBe('missing-cost')
  })
  it('uses profitability-only when there are no sales', () => {
    const noSales = { targetGpPct: 70, popularityThreshold: 0, hasSales: false }
    expect(classifyDrinkPerformance(drink({ id: 'c', gp: 80 }), noSales)).toBe('good-margin')
    expect(classifyDrinkPerformance(drink({ id: 'd', gp: 60 }), noSales)).toBe('thin-margin')
  })
  it('places drinks in the four quadrants', () => {
    expect(classifyDrinkPerformance(drink({ id: 'w', gp: 80, units: 20 }), ctx)).toBe('winner')
    expect(classifyDrinkPerformance(drink({ id: 'p', gp: 80, units: 2 }), ctx)).toBe('promote')
    expect(classifyDrinkPerformance(drink({ id: 'f', gp: 60, units: 20 }), ctx)).toBe('fix-margin')
    expect(classifyDrinkPerformance(drink({ id: 'r', gp: 60, units: 2 }), ctx)).toBe('review')
  })
})

describe('buildMenuPerformance', () => {
  it('reports no sales and profitability-only statuses when nothing sold', () => {
    const p = buildMenuPerformance([drink({ id: 'a', gp: 80 }), drink({ id: 'b', gp: 60 })], 70)
    expect(p.hasSales).toBe(false)
    expect(p.statusById).toEqual({ a: 'good-margin', b: 'thin-margin' })
    expect(p.quadrants.winner).toHaveLength(0)
  })
  it('partitions into quadrants using a 70%-of-average threshold', () => {
    // total units 40 over 4 drinks → avg 10 → threshold 7. units>=7 = popular.
    const p = buildMenuPerformance([
      drink({ id: 'w', gp: 80, units: 18 }),
      drink({ id: 'p', gp: 80, units: 2 }),
      drink({ id: 'f', gp: 60, units: 18 }),
      drink({ id: 'r', gp: 60, units: 2 }),
    ], 70)
    expect(p.hasSales).toBe(true)
    expect(p.quadrants.winner.map((m) => m.cocktail_id)).toEqual(['w'])
    expect(p.quadrants.promote.map((m) => m.cocktail_id)).toEqual(['p'])
    expect(p.quadrants.fixMargin.map((m) => m.cocktail_id)).toEqual(['f'])
    expect(p.quadrants.review.map((m) => m.cocktail_id)).toEqual(['r'])
  })
})
