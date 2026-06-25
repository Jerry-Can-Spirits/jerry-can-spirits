import { describe, it, expect } from 'vitest'
import { calculateMenuMetrics } from '@/lib/pouriq/calculations'
import { deriveMenuAttention } from '@/lib/pouriq/attention'
import type {
  CocktailWithIngredients,
  IngredientWithLibrary,
  IngredientLibraryRow,
} from '@/lib/pouriq/types'

function ingredient(opts: { price_p?: number }): IngredientWithLibrary {
  const library: IngredientLibraryRow = {
    id: 'lib', trade_account_id: 't', name: 'x', ingredient_type: 'spirit',
    base_unit: 'each', pack_size: 1, price_p: opts.price_p ?? 0, pack_format: null, subcategory: null,
    is_prepared: 0,
    purchase_qty: 1,
    yield_pct: 100,
    barcode: null, notes: null, created_at: '', updated_at: '',
  }
  return { id: 'ing', cocktail_id: 'c', library_ingredient_id: 'lib', pour_ml: null, unit_count: 1, recipe_unit: null, recipe_qty: null, library }
}

function cocktail(id: string, salePriceP: number, ings: IngredientWithLibrary[]): CocktailWithIngredients {
  return {
    id, menu_id: 'm', name: id, sale_price_p: salePriceP,
    promotional_price_p: null, promotional_label: null, promotional_days: null,
    promotional_valid_from: null, promotional_valid_until: null, position: 0,
    field_manual_slug: null, notes: null, description: null, description_updated_at: null,
    glass: null,
    is_serve: 0,
    ingredients: ings,
  }
}

describe('deriveMenuAttention', () => {
  // GOOD: net 800, cost 200 → gp 75% (>= target 70). HEALTHY.
  const good = cocktail('Good', 800, [ingredient({ price_p: 200 })])
  // LOW: net 500, cost 300 → gp 40% (< target). UNDER TARGET.
  const low = cocktail('Low', 500, [ingredient({ price_p: 300 })])
  // INCOMPLETE: unpriced ingredient → cost_complete false. NOT under-target.
  const incomplete = cocktail('Incomplete', 600, [ingredient({})])

  it('counts only costed drinks below target as under-target', () => {
    const metrics = calculateMenuMetrics([good, low], false, [])
    const out = deriveMenuAttention(metrics, 70)
    expect(out.underTargetCount).toBe(1) // only Low
    expect(out.incompleteCostCount).toBe(0)
  })

  it('does not count incomplete-cost drinks as under-target, and counts them separately', () => {
    const metrics = calculateMenuMetrics([good, incomplete], false, [])
    const out = deriveMenuAttention(metrics, 70)
    expect(out.underTargetCount).toBe(0)     // incomplete excluded despite no real GP
    expect(out.incompleteCostCount).toBe(1)
  })

  it('is all-zero when every costed drink meets target', () => {
    const metrics = calculateMenuMetrics([good], false, [])
    const out = deriveMenuAttention(metrics, 70)
    expect(out).toEqual({ incompleteCostCount: 0, underTargetCount: 0 })
  })
})
