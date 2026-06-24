import { describe, it, expect } from 'vitest'
import { STANDARD_SERVE_UNITS, serveUnitsFor, recipeBaseAmount } from '@/lib/pouriq/measures'

describe('STANDARD_SERVE_UNITS', () => {
  it('has dash=0.6ml and barspoon=5ml for ml base', () => {
    const ml = STANDARD_SERVE_UNITS.ml
    expect(ml.find(u => u.name === 'dash')?.base_per_unit).toBe(0.6)
    expect(ml.find(u => u.name === 'barspoon')?.base_per_unit).toBe(5)
    expect(ml.find(u => u.name === 'ml')?.base_per_unit).toBe(1)
  })
  it('has g=1 for g base and item=1 for each base', () => {
    expect(STANDARD_SERVE_UNITS.g.find(u => u.name === 'g')?.base_per_unit).toBe(1)
    expect(STANDARD_SERVE_UNITS.each.find(u => u.name === 'item')?.base_per_unit).toBe(1)
  })
})

describe('serveUnitsFor', () => {
  it('merges standard units for the base dimension with custom units', () => {
    const list = serveUnitsFor('each', [{ name: 'wedge', base_per_unit: 1 / 6 }])
    expect(list.find(u => u.name === 'item')).toBeTruthy()
    expect(list.find(u => u.name === 'wedge')?.base_per_unit).toBeCloseTo(0.1667, 3)
  })
  it('lets a custom unit override a standard one of the same name', () => {
    const list = serveUnitsFor('ml', [{ name: 'dash', base_per_unit: 0.9 }])
    expect(list.find(u => u.name === 'dash')?.base_per_unit).toBe(0.9)
  })
})

describe('recipeBaseAmount', () => {
  it('multiplies qty by the per-unit conversion', () => {
    expect(recipeBaseAmount(3, 0.2)).toBeCloseTo(0.6, 6)
    expect(recipeBaseAmount(2, 1 / 6)).toBeCloseTo(0.3333, 4)
    expect(recipeBaseAmount(2, 0.6)).toBeCloseTo(1.2, 6)
  })
})
