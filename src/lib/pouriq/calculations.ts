// Pure deterministic calculations for menu profitability and complexity.
// No side effects, no DB access, no AI.

import type {
  CocktailWithIngredients,
  CocktailMetrics,
  IngredientOverlap,
  WasteRisk,
  MenuMetrics,
  DrinkVolumeRow,
} from './types'

// UK VAT rate (20%). Sale prices entered inc-VAT must be divided by
// 1.20 before computing margin so GP% matches what an accountant
// would see on the P&L.
const VAT_DIVISOR = 1.20

export function netSalePrice(sale_price_p: number, priceIncludesVat: boolean): number {
  if (!priceIncludesVat) return sale_price_p
  return Math.round(sale_price_p / VAT_DIVISOR)
}

function ingredientCostPence(i: import('./types').IngredientWithLibrary): number {
  // Unit-priced: library has unit_cost_p; cocktail row has unit_count
  if (i.library.unit_cost_p !== null) {
    const count = i.unit_count ?? 1
    return Math.round(i.library.unit_cost_p * count)
  }
  // Bottle-priced: library has bottle_size_ml + bottle_cost_p; cocktail row has pour_ml
  if (
    i.library.bottle_size_ml !== null &&
    i.library.bottle_cost_p !== null &&
    i.pour_ml !== null
  ) {
    return Math.round((i.library.bottle_cost_p / i.library.bottle_size_ml) * i.pour_ml)
  }
  return 0
}

export function calculateCocktailMetrics(
  cocktail: CocktailWithIngredients,
  priceIncludesVat: boolean,
): CocktailMetrics {
  const pour_cost_p = cocktail.ingredients.reduce((sum, ing) => sum + ingredientCostPence(ing), 0)
  const net_sale_p = netSalePrice(cocktail.sale_price_p, priceIncludesVat)
  const margin_p = net_sale_p - pour_cost_p
  const gp_pct = net_sale_p === 0 ? 0 : (margin_p / net_sale_p) * 100

  const metrics: CocktailMetrics = {
    cocktail_id: cocktail.id,
    name: cocktail.name,
    sale_price_p: cocktail.sale_price_p,
    pour_cost_p,
    margin_p,
    gp_pct: Math.round(gp_pct * 10) / 10,
  }

  if (cocktail.promotional_price_p !== null && cocktail.promotional_price_p !== undefined) {
    const promo_net_p = netSalePrice(cocktail.promotional_price_p, priceIncludesVat)
    const promo_margin_p = promo_net_p - pour_cost_p
    const promo_gp_pct = promo_net_p === 0 ? 0 : (promo_margin_p / promo_net_p) * 100
    metrics.promo = {
      sale_price_p: cocktail.promotional_price_p,
      margin_p: promo_margin_p,
      gp_pct: Math.round(promo_gp_pct * 10) / 10,
      label: cocktail.promotional_label ?? null,
    }
  }

  return metrics
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
      const key = normaliseIngredientName(ing.library.name)
      if (!map.has(key)) map.set(key, { display: ing.library.name.trim(), cocktailIds: new Set() })
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

export function calculateMenuMetrics(
  cocktails: CocktailWithIngredients[],
  priceIncludesVat: boolean,
  volumes: DrinkVolumeRow[] = [],
): MenuMetrics {
  const volumeByCocktail = new Map<string, DrinkVolumeRow>()
  for (const v of volumes) volumeByCocktail.set(v.cocktail_id, v)

  const cocktail_metrics = cocktails.map((c) => {
    const m = calculateCocktailMetrics(c, priceIncludesVat)
    const v = volumeByCocktail.get(c.id)
    if (v) {
      m.volume = {
        units_sold: v.units_sold,
        period_start: v.period_start,
        period_end: v.period_end,
        contribution_p: m.margin_p * v.units_sold,
      }
    }
    return m
  })
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
