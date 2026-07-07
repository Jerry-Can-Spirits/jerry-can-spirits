import { describe, it, expect } from 'vitest'
import { ingredientCostPence, usableCostPerBaseUnitP, bottlePourCostP, unitPourCostP } from '@/lib/pouriq/calculations'
import { rowContributionP } from '@/lib/pouriq/cost-impact-loader'
import { contributionP } from '@/lib/pouriq/multi-cost-impact'
import type { IngredientWithLibrary, IngredientLibraryRow } from '@/lib/pouriq/types'

// Shared test fixture: a 1000ml keg priced at 500p, 50% yield, 50ml pour.
// Old yield-blind formula would give 25p; yield-aware gives 50p.
const PRICE_P = 500
const PACK_SIZE = 1000
const PURCHASE_QTY = 1
const YIELD_PCT = 50
const POUR_ML = 50

function mkIng(yield_pct: number): IngredientWithLibrary {
  const library: IngredientLibraryRow = {
    id: 'lib', trade_account_id: 't', name: 'x', ingredient_type: 'spirit',
    base_unit: 'ml', pack_size: PACK_SIZE, price_p: PRICE_P, purchase_qty: PURCHASE_QTY, yield_pct,
    price_includes_vat: 0, price_entered_p: null,
    pack_format: null, subcategory: null,
    is_prepared: 0,
    barcode: null, notes: null, cost_confidence: 'set', created_at: '', updated_at: '',
    allergens: '[]', dietary: '[]', allergens_reviewed: 0, abv: 0,
  }
  return { id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib', pour_ml: POUR_ML, unit_count: null, recipe_unit: null, recipe_qty: null, use_id: null, use: null, library }
}

const ROW_BASE = {
  lib_price_p: PRICE_P,
  lib_purchase_qty: PURCHASE_QTY,
  lib_pack_size: PACK_SIZE,
  lib_base_unit: 'ml' as const,
  ingredient_pour_ml: POUR_ML,
  ingredient_unit_count: null,
}

describe('cost-impact yield_pct agreement', () => {
  const menuCost = ingredientCostPence(mkIng(YIELD_PCT))
  const oldFormula = bottlePourCostP(PRICE_P, PACK_SIZE, PURCHASE_QTY, POUR_ML)

  it('old yield-blind formula gives a lower cost than yield-aware at 50%', () => {
    expect(oldFormula).toBeLessThan(menuCost)
  })

  it('rowContributionP (cost-impact-loader) matches ingredientCostPence at yield 50%', () => {
    const result = rowContributionP({ ...ROW_BASE, lib_yield_pct: YIELD_PCT })
    expect(result).toBe(menuCost)
  })

  it('rowContributionP differs from old yield-blind value at yield 50%', () => {
    const result = rowContributionP({ ...ROW_BASE, lib_yield_pct: YIELD_PCT })
    expect(result).not.toBe(oldFormula)
  })

  it('contributionP (multi-cost-impact) matches ingredientCostPence at yield 50%', () => {
    const result = contributionP({ ...ROW_BASE, lib_yield_pct: YIELD_PCT }, PRICE_P)
    expect(result).toBe(menuCost)
  })

  it('contributionP differs from old yield-blind value at yield 50%', () => {
    const result = contributionP({ ...ROW_BASE, lib_yield_pct: YIELD_PCT }, PRICE_P)
    expect(result).not.toBe(oldFormula)
  })

  it('at yield 100% rowContributionP matches old formula (no regression)', () => {
    const result = rowContributionP({ ...ROW_BASE, lib_yield_pct: 100 })
    expect(result).toBe(oldFormula)
  })

  it('at yield 100% contributionP matches old formula (no regression)', () => {
    const result = contributionP({ ...ROW_BASE, lib_yield_pct: 100 }, PRICE_P)
    expect(result).toBe(oldFormula)
  })
})

describe('cost-impact yield_pct — each unit', () => {
  // 6 limes for 300p, yield 100% (each items typically have no yield loss)
  const EACH_PRICE = 300
  const EACH_QTY = 6
  const EACH_PACK = 1
  const UNIT_COUNT = 2

  const eachRow = {
    lib_price_p: EACH_PRICE,
    lib_purchase_qty: EACH_QTY,
    lib_pack_size: EACH_PACK,
    lib_base_unit: 'each' as const,
    ingredient_pour_ml: null,
    ingredient_unit_count: UNIT_COUNT,
    lib_yield_pct: 100,
  }

  it('rowContributionP for each unit matches unitPourCostP at 100% yield', () => {
    expect(rowContributionP(eachRow)).toBe(unitPourCostP(EACH_PRICE, EACH_QTY, UNIT_COUNT))
  })

  it('contributionP for each unit matches unitPourCostP at 100% yield', () => {
    expect(contributionP(eachRow, EACH_PRICE)).toBe(unitPourCostP(EACH_PRICE, EACH_QTY, UNIT_COUNT))
  })
})
