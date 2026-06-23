import { describe, it, expect } from 'vitest'
import { ingredientCostComplete, calculateCocktailMetrics, calculateMenuMetrics } from '@/lib/pouriq/calculations'
import type {
  CocktailWithIngredients,
  IngredientWithLibrary,
  IngredientLibraryRow,
  DrinkVolumeRow,
} from '@/lib/pouriq/types'

interface IngOpts {
  unit_cost_p?: number | null
  bottle_size_ml?: number | null
  bottle_cost_p?: number | null
  pour_ml?: number | null
  unit_count?: number | null
}

function ingredient(opts: IngOpts): IngredientWithLibrary {
  const library: IngredientLibraryRow = {
    id: 'lib', trade_account_id: 't', name: 'x', ingredient_type: 'spirit',
    bottle_size_ml: opts.bottle_size_ml ?? null,
    bottle_cost_p: opts.bottle_cost_p ?? null,
    unit_cost_p: opts.unit_cost_p ?? null,
    purchase_qty: 1,
    barcode: null, notes: null, created_at: '', updated_at: '',
  }
  return {
    id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib',
    pour_ml: opts.pour_ml ?? null, unit_count: opts.unit_count ?? null, library,
  }
}

function cocktail(id: string, salePriceP: number, ings: IngredientWithLibrary[]): CocktailWithIngredients {
  return {
    id, menu_id: 'm', name: id, sale_price_p: salePriceP,
    promotional_price_p: null, promotional_label: null, promotional_days: null,
    promotional_valid_from: null, promotional_valid_until: null, position: 0,
    field_manual_slug: null, notes: null, description: null, description_updated_at: null,
    ingredients: ings,
  }
}

function volume(cocktailId: string, units: number): DrinkVolumeRow {
  return {
    id: cocktailId, cocktail_id: cocktailId, period_start: '2026-06-01', period_end: '2026-06-30',
    units_sold: units, source: 'pos', created_at: '', updated_at: '',
  }
}

describe('ingredientCostComplete', () => {
  it('is true for a unit-priced ingredient', () => {
    expect(ingredientCostComplete(ingredient({ unit_cost_p: 50, unit_count: 1 }))).toBe(true)
  })
  it('is true for a fully bottle-priced ingredient', () => {
    expect(ingredientCostComplete(ingredient({ bottle_size_ml: 700, bottle_cost_p: 1400, pour_ml: 50 }))).toBe(true)
  })
  it('is false when pour_ml is missing', () => {
    expect(ingredientCostComplete(ingredient({ bottle_size_ml: 700, bottle_cost_p: 1400 }))).toBe(false)
  })
  it('is false when bottle_cost_p is missing', () => {
    expect(ingredientCostComplete(ingredient({ bottle_size_ml: 700, pour_ml: 50 }))).toBe(false)
  })
  it('is false with no pricing at all', () => {
    expect(ingredientCostComplete(ingredient({}))).toBe(false)
  })
})

describe('calculateCocktailMetrics cost_complete + net_sale_p', () => {
  it('is complete when every ingredient is priced', () => {
    const m = calculateCocktailMetrics(cocktail('A', 800, [ingredient({ unit_cost_p: 200, unit_count: 1 })]), false)
    expect(m.cost_complete).toBe(true)
  })
  it('is incomplete when one ingredient is unpriced', () => {
    const m = calculateCocktailMetrics(
      cocktail('A', 800, [ingredient({ unit_cost_p: 200, unit_count: 1 }), ingredient({})]),
      false,
    )
    expect(m.cost_complete).toBe(false)
  })
  it('is incomplete for a zero-ingredient drink', () => {
    expect(calculateCocktailMetrics(cocktail('A', 800, []), false).cost_complete).toBe(false)
  })
  it('nets VAT out of net_sale_p when prices include VAT', () => {
    const m = calculateCocktailMetrics(cocktail('A', 1200, [ingredient({ unit_cost_p: 100, unit_count: 1 })]), true)
    expect(m.net_sale_p).toBe(1000) // 1200 / 1.2
  })
})

describe('calculateMenuMetrics blended GP + exclusions', () => {
  // A: net 800, cost 200 → margin 600, gp 75%; B: net 500, cost 250 → margin 250, gp 50%.
  const A = cocktail('A', 800, [ingredient({ unit_cost_p: 200, unit_count: 1 })])
  const B = cocktail('B', 500, [ingredient({ unit_cost_p: 250, unit_count: 1 })])
  // C: incomplete (unpriced), would look like a huge margin if counted.
  const C = cocktail('C', 1000, [ingredient({})])

  it('computes blended GP weighted by net revenue when volumes exist', () => {
    const m = calculateMenuMetrics([A, B], false, [volume('A', 10), volume('B', 4)])
    // (600*10 + 250*4) / (800*10 + 500*4) = 7000 / 10000 = 70.0
    expect(m.blended_gp_pct).toBe(70)
    expect(m.headline_basis).toBe('blended')
    expect(m.headline_gp_pct).toBe(70)
  })

  it('falls back to the average with no volumes', () => {
    const m = calculateMenuMetrics([A, B], false, [])
    expect(m.blended_gp_pct).toBeNull()
    expect(m.headline_basis).toBe('average')
    expect(m.avg_gp_pct).toBe(62.5) // (75 + 50) / 2
    expect(m.headline_gp_pct).toBe(62.5)
  })

  it('excludes incomplete-cost drinks from average, blended, best/worst, and counts them', () => {
    const m = calculateMenuMetrics([A, B, C], false, [volume('A', 10), volume('B', 4), volume('C', 99)])
    expect(m.incomplete_cost_count).toBe(1)
    expect(m.blended_gp_pct).toBe(70) // C's volume ignored
    expect(m.avg_gp_pct).toBe(62.5)   // C excluded
    expect(m.best_margin?.cocktail_id).toBe('A')
    expect(m.worst_margin?.cocktail_id).toBe('B') // not C, despite C's inflated margin
  })
})
