import { describe, it, expect } from 'vitest'
import { deriveSalesSummary } from '@/lib/pouriq/dashboard'
import type { MenuMetrics, CocktailMetrics } from '@/lib/pouriq/types'

function cocktail(name: string, sale_price_p: number, units?: number): CocktailMetrics {
  return {
    cocktail_id: name,
    name,
    sale_price_p,
    net_sale_p: sale_price_p,
    pour_cost_p: 0,
    margin_p: sale_price_p,
    gp_pct: 100,
    cost_complete: true,
    ...(units !== undefined
      ? { volume: { units_sold: units, period_start: '', period_end: '', contribution_p: 0 } }
      : {}),
  }
}

function metricsWith(cs: CocktailMetrics[]): MenuMetrics {
  return {
    avg_gp_pct: 0,
    blended_gp_pct: null,
    headline_gp_pct: 0,
    headline_basis: 'average',
    incomplete_cost_count: 0,
    best_margin: null,
    worst_margin: null,
    waste_risk_count: 0,
    cocktail_metrics: cs,
    ingredient_overlap: [],
    waste_risks: [],
  }
}

describe('deriveSalesSummary', () => {
  it('sums revenue + serves and ranks top sellers, ignoring unsold drinks', () => {
    const m = metricsWith([cocktail('Margarita', 900, 10), cocktail('Mojito', 800, 25), cocktail('Negroni', 1000)])
    const s = deriveSalesSummary(m)
    expect(s.revenue_p).toBe(900 * 10 + 800 * 25)
    expect(s.serves).toBe(35)
    expect(s.top.map((t) => t.name)).toEqual(['Mojito', 'Margarita'])
  })
  it('is zero when nothing has sold this period', () => {
    expect(deriveSalesSummary(metricsWith([cocktail('Negroni', 1000)]))).toEqual({ revenue_p: 0, serves: 0, top: [] })
  })
})
