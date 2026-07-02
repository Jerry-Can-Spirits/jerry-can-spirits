import { describe, it, expect } from 'vitest'
import { useLineCostP, ingredientCostPence, ingredientCostComplete } from '@/lib/pouriq/calculations'
import type { IngredientWithLibrary, IngredientLibraryRow, IngredientUseRow } from '@/lib/pouriq/types'

it('costs a use from its yield', () => {
  expect(useLineCostP(30, 30, 25)).toBe(25)   // 30p/lemon, 30ml/lemon, 25ml -> 25p
  expect(useLineCostP(30, 8, 1)).toBe(4)       // 30p/lemon, 8 wheels, 1 wheel -> 3.75 -> 4p
})
it('guards a zero/negative yield', () => {
  expect(useLineCostP(30, 0, 25)).toBe(0)
})

// Factory helpers for use-aware cost tests
function mkLib(overrides: Partial<IngredientLibraryRow> = {}): IngredientLibraryRow {
  return {
    id: 'lib', trade_account_id: 't', name: 'Lemon', ingredient_type: 'garnish',
    base_unit: 'each', pack_size: 1, price_p: 30, purchase_qty: 1, yield_pct: 100,
    price_includes_vat: 0, price_entered_p: null, pack_format: null, subcategory: null,
    is_prepared: 0, barcode: null, notes: null, cost_confidence: 'set',
    created_at: '', updated_at: '', allergens: '[]', dietary: '[]', allergens_reviewed: 0, abv: 0,
    ...overrides,
  }
}

function mkUse(overrides: Partial<IngredientUseRow> = {}): IngredientUseRow {
  return {
    id: 'u', ingredient_id: 'lib', name: 'Juice', recipe_unit: 'ml', yield_qty: 30,
    position: 0, created_at: '',
    ...overrides,
  }
}

function mkUseLine(
  use: IngredientUseRow | null,
  recipe_qty: number | null,
  libOverrides: Partial<IngredientLibraryRow> = {},
): IngredientWithLibrary {
  return {
    id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib',
    pour_ml: null, unit_count: null,
    recipe_unit: use?.recipe_unit ?? null,
    recipe_qty,
    use_id: use?.id ?? null,
    use,
    library: mkLib(libOverrides),
  }
}

describe('ingredientCostPence — use path', () => {
  it('juice use: 30p/lemon, 30ml yield, 25ml recipe_qty -> 25p', () => {
    const i = mkUseLine(mkUse({ yield_qty: 30 }), 25)
    expect(ingredientCostPence(i)).toBe(25)
  })

  it('wheel use: 30p/lemon, 8 wheels yield, 1 wheel recipe_qty -> 4p (rounds)', () => {
    const i = mkUseLine(mkUse({ name: 'Wheel', recipe_unit: 'count', yield_qty: 8 }), 1)
    expect(ingredientCostPence(i)).toBe(4)
  })

  it('non-use each line is unchanged (regression)', () => {
    const i: IngredientWithLibrary = {
      id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib',
      pour_ml: null, unit_count: 0.125,
      recipe_unit: null, recipe_qty: null,
      use_id: null, use: null,
      library: mkLib({ price_p: 33 }),
    }
    // Math.round(33 * 0.125) = 4
    expect(ingredientCostPence(i)).toBe(4)
  })

  it('non-use ml line is unchanged (regression)', () => {
    const i: IngredientWithLibrary = {
      id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib',
      pour_ml: 50, unit_count: null,
      recipe_unit: null, recipe_qty: null,
      use_id: null, use: null,
      library: mkLib({ base_unit: 'ml', pack_size: 700, price_p: 2000, purchase_qty: 1 }),
    }
    // Math.round((2000/700) * 50) = 143
    expect(ingredientCostPence(i)).toBe(143)
  })
})

describe('ingredientCostComplete — use path', () => {
  it('true for a use line with recipe_qty set', () => {
    expect(ingredientCostComplete(mkUseLine(mkUse(), 25))).toBe(true)
  })

  it('false for a use line with recipe_qty null', () => {
    expect(ingredientCostComplete(mkUseLine(mkUse(), null))).toBe(false)
  })

  it('false for a use line when price_p is zero', () => {
    expect(ingredientCostComplete(mkUseLine(mkUse(), 25, { price_p: 0 }))).toBe(false)
  })

  it('non-use each line completeness is unchanged (regression)', () => {
    const priced: IngredientWithLibrary = {
      id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib',
      pour_ml: null, unit_count: 1,
      recipe_unit: null, recipe_qty: null,
      use_id: null, use: null,
      library: mkLib({ price_p: 30 }),
    }
    expect(ingredientCostComplete(priced)).toBe(true)
    const missing: IngredientWithLibrary = { ...priced, unit_count: null }
    expect(ingredientCostComplete(missing)).toBe(false)
  })
})
