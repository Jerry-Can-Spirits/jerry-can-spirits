import { it, expect } from 'vitest'
import { categoryGp } from '@/lib/pouriq/category-gp'

const row = (item_type: string, gp_pct: number, margin_p: number, net_sale_p: number, units_sold: number, over: object = {}) =>
  ({ item_type: item_type as never, gp_pct, margin_p, net_sale_p, units_sold, cost_complete: true, sale_price_p: 1000, ...over })

it('groups by label (beer+cider merge), blends with volumes', () => {
  const [bc] = categoryGp([row('beer', 50, 300, 600, 10), row('cider', 60, 400, 700, 5)], 68)
  // (300*10 + 400*5) / (600*10 + 700*5) * 100 = 5000/9500 = 52.6
  expect(bc.label).toBe('Beer & Cider'); expect(bc.drink_count).toBe(2)
  expect(bc.basis).toBe('blended'); expect(bc.gp_pct).toBe(52.6); expect(bc.under_target).toBe(true)
})
it('average basis when no volumes; not under a lower target', () => {
  const [c] = categoryGp([row('cocktail', 70, 500, 700, 0), row('cocktail', 74, 520, 700, 0)], 68)
  expect(c.basis).toBe('average'); expect(c.gp_pct).toBe(72); expect(c.under_target).toBe(false)
})
it('excludes incomplete-cost drinks; a category left empty is omitted', () => {
  expect(categoryGp([row('wine', 60, 0, 0, 0, { cost_complete: false })], 68)).toEqual([])
})
it('returns categories in canonical order', () => {
  const rows = categoryGp([row('food', 60, 0, 0, 0), row('cocktail', 70, 0, 0, 0), row('beer', 50, 0, 0, 0)], 68)
  expect(rows.map((r) => r.label)).toEqual(['Cocktails', 'Beer & Cider', 'Food'])
})
