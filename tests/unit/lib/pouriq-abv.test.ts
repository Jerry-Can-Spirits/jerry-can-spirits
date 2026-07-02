import { describe, it, expect } from 'vitest'
import { cocktailAbv } from '@/lib/pouriq/abv'

const ing = (abv: number, type: string, pour_ml: number | null = 50) => ({ pour_ml, library: { abv, ingredient_type: type as never } })

describe('cocktailAbv', () => {
  it('computes abv% and units from the pour', () => {
    const r = cocktailAbv([ing(40, 'spirit', 50), ing(0, 'juice', 150)]) // alcohol 20ml / 200ml
    expect(r.abvPct).toBe(10); expect(r.units).toBe(2); expect(r.complete).toBe(true)
  })
  it('incomplete when an alcoholic ingredient has no abv', () => {
    expect(cocktailAbv([ing(0, 'spirit', 50)]).complete).toBe(false)
  })
  it('mocktail is complete at 0', () => {
    const r = cocktailAbv([ing(0, 'juice', 150), ing(0, 'syrup', 20)])
    expect(r).toEqual({ abvPct: 0, units: 0, complete: true })
  })
  it('no poured volume -> 0 abv, no divide by zero', () => {
    expect(cocktailAbv([{ pour_ml: null, library: { abv: 40, ingredient_type: 'spirit' as never } }]))
      .toEqual({ abvPct: 0, units: 0, complete: true })
  })
})
