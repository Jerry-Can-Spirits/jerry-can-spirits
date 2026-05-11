// Pure deterministic calculations for menu profitability and complexity.
// No side effects, no DB access, no AI.

import type {
  CocktailWithIngredients,
  CocktailMetrics,
  IngredientOverlap,
  WasteRisk,
  MenuMetrics,
} from './types'

function ingredientCostPence(i: CocktailWithIngredients['ingredients'][0]): number {
  if (i.unit_cost_p !== null) return i.unit_cost_p
  if (i.bottle_size_ml === null || i.bottle_cost_p === null || i.pour_ml === null) return 0
  return Math.round((i.bottle_cost_p / i.bottle_size_ml) * i.pour_ml)
}

export function calculateCocktailMetrics(cocktail: CocktailWithIngredients): CocktailMetrics {
  const pour_cost_p = cocktail.ingredients.reduce((sum, ing) => sum + ingredientCostPence(ing), 0)
  const margin_p = cocktail.sale_price_p - pour_cost_p
  const gp_pct = cocktail.sale_price_p === 0 ? 0 : (margin_p / cocktail.sale_price_p) * 100
  return {
    cocktail_id: cocktail.id,
    name: cocktail.name,
    sale_price_p: cocktail.sale_price_p,
    pour_cost_p,
    margin_p,
    gp_pct: Math.round(gp_pct * 10) / 10,
  }
}

function normaliseIngredientName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function calculateIngredientOverlap(
  cocktails: CocktailWithIngredients[],
): IngredientOverlap[] {
  const map = new Map<string, { display: string; cocktailIds: Set<string> }>()
  for (const c of cocktails) {
    for (const ing of c.ingredients) {
      const key = normaliseIngredientName(ing.name)
      if (!map.has(key)) map.set(key, { display: ing.name.trim(), cocktailIds: new Set() })
      map.get(key)!.cocktailIds.add(c.id)
    }
  }
  return Array.from(map.entries())
    .map(([, v]) => ({
      ingredient_name: v.display,
      cocktail_count: v.cocktailIds.size,
      cocktail_ids: Array.from(v.cocktailIds),
    }))
    .sort((a, b) => b.cocktail_count - a.cocktail_count)
}

export function calculateWasteRisks(
  cocktails: CocktailWithIngredients[],
  overlap: IngredientOverlap[],
): WasteRisk[] {
  const cocktailById = new Map(cocktails.map((c) => [c.id, c]))
  const single = overlap.filter((o) => o.cocktail_count === 1)
  return single.map((o) => {
    const cocktailId = o.cocktail_ids[0]
    const cocktail = cocktailById.get(cocktailId)
    return {
      ingredient_name: o.ingredient_name,
      cocktail_id: cocktailId,
      cocktail_name: cocktail?.name ?? 'Unknown',
      reason: `Used only in "${cocktail?.name ?? 'one cocktail'}" — risk of slow stock rotation.`,
    }
  })
}

export function calculateMenuMetrics(cocktails: CocktailWithIngredients[]): MenuMetrics {
  const cocktail_metrics = cocktails.map(calculateCocktailMetrics)
  const ingredient_overlap = calculateIngredientOverlap(cocktails)
  const waste_risks = calculateWasteRisks(cocktails, ingredient_overlap)

  const validGps = cocktail_metrics.filter((m) => m.sale_price_p > 0)
  const avg_gp_pct = validGps.length === 0
    ? 0
    : Math.round((validGps.reduce((s, m) => s + m.gp_pct, 0) / validGps.length) * 10) / 10

  const sorted = [...cocktail_metrics].sort((a, b) => b.margin_p - a.margin_p)
  const best_margin = sorted[0] ?? null
  const worst_margin = sorted[sorted.length - 1] ?? null

  return {
    avg_gp_pct,
    best_margin,
    worst_margin,
    waste_risk_count: waste_risks.length,
    cocktail_metrics,
    ingredient_overlap,
    waste_risks,
  }
}
