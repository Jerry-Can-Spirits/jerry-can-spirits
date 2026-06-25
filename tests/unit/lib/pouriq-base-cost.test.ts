import { describe, it, expect } from 'vitest'
import { costPerBaseUnitP, usableCostPerBaseUnitP, ingredientCostPence } from '@/lib/pouriq/calculations'
import type { IngredientWithLibrary, IngredientLibraryRow } from '@/lib/pouriq/types'

function mkIng(
  base_unit: 'ml' | 'g' | 'each',
  pack_size: number,
  price_p: number,
  purchase_qty: number,
  yield_pct: number,
  pour_ml: number | null,
  unit_count: number | null,
): IngredientWithLibrary {
  const library: IngredientLibraryRow = {
    id: 'lib', trade_account_id: 't', name: 'x', ingredient_type: 'spirit',
    base_unit, pack_size, price_p, purchase_qty, yield_pct,
    pack_format: null, subcategory: null,
    is_prepared: 0,
    barcode: null, notes: null, created_at: '', updated_at: '',
  }
  return { id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib', pour_ml, unit_count, recipe_unit: null, recipe_qty: null, library }
}

describe('costPerBaseUnitP', () => {
  it('700ml bottle for £20 -> ~0.0286p/ml', () => {
    expect(costPerBaseUnitP(2000, 1, 700)).toBeCloseTo(2000 / 700, 6)
  })
  it('case of 24x200ml for £14.40 -> 0.003p/ml', () => {
    expect(costPerBaseUnitP(1440, 24, 200)).toBeCloseTo((1440 / 24) / 200, 6)
  })
  it('40 lemons for £8 -> 20p each', () => {
    expect(costPerBaseUnitP(800, 40, 1)).toBeCloseTo(20, 6)
  })
  it('5kg sugar for £6 -> 0.0012p/g', () => {
    expect(costPerBaseUnitP(600, 1, 5000)).toBeCloseTo(600 / 5000, 6)
  })
  it('defends against zero packs/size', () => {
    expect(costPerBaseUnitP(700, 0, 0)).toBeCloseTo(700, 6)
  })
})

describe('usableCostPerBaseUnitP', () => {
  it('is a no-op at 100% yield', () => {
    expect(usableCostPerBaseUnitP(2000, 1, 700, 100)).toBeCloseTo(2000 / 700, 6)
  })
  it('raises cost as yield drops (lime 75%)', () => {
    expect(usableCostPerBaseUnitP(800, 40, 1, 75)).toBeCloseTo(20 / 0.75, 6)
  })
  it('treats 0/negative yield as 100%', () => {
    expect(usableCostPerBaseUnitP(2000, 1, 700, 0)).toBeCloseTo(2000 / 700, 6)
  })
})

describe('ingredientCostPence — new base-unit model regression', () => {
  it('50ml pour from a 700ml/£20 bottle at 100% yield = 143p', () => {
    // Math.round((2000/700)*50) = Math.round(142.857) = 143
    const i = mkIng('ml', 700, 2000, 1, 100, 50, null)
    expect(ingredientCostPence(i)).toBe(143)
  })

  it('150ml pour from a case of 24×200ml at £14.40 = 45p', () => {
    // per-ml = (1440/24)/200 = 0.3p/ml; 0.3*150 = 45
    const i = mkIng('ml', 200, 1440, 24, 100, 150, null)
    expect(ingredientCostPence(i)).toBe(45)
  })

  it('1/8 lemon at 33p each = 4p', () => {
    // Math.round(33*0.125) = Math.round(4.125) = 4
    const i = mkIng('each', 1, 33, 1, 100, null, 0.125)
    expect(ingredientCostPence(i)).toBe(4)
  })

  it('yield 75% on a 50ml pour raises cost vs 100%', () => {
    // 100%: 143p; 75%: Math.round((2000/700/0.75)*50) = Math.round(190.476) = 190
    const full = mkIng('ml', 700, 2000, 1, 100, 50, null)
    const lossy = mkIng('ml', 700, 2000, 1, 75, 50, null)
    expect(ingredientCostPence(lossy)).toBeGreaterThan(ingredientCostPence(full))
    expect(ingredientCostPence(lossy)).toBe(190)
  })
})
