// Cost-change ripple analysis.
//
// Given an ingredient and a hypothetical new cost, recompute the affected
// cocktails' pour cost / margin / GP without touching the database.
//
// The server endpoint returns each affected cocktail with the *current*
// full pour cost and the per-cocktail contribution from this specific
// ingredient. The client subtracts the old contribution and adds the
// new contribution to get the projected numbers.

export interface ImpactIngredient {
  id: string
  name: string
  ingredient_type: string
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
}

export interface ImpactCocktail {
  cocktail_id: string
  cocktail_name: string
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  menu_prices_include_vat: boolean
  sale_price_p: number
  current_pour_cost_p: number
  current_ingredient_contribution_p: number
  // The cocktail's usage of THIS ingredient — needed to recompute the
  // new contribution under a hypothetical cost.
  pour_ml: number | null
  unit_count: number | null
}

export interface CostImpactPayload {
  ingredient: ImpactIngredient
  affected: ImpactCocktail[]
}

export type PricingMode = 'bottle' | 'unit'

export function pricingMode(i: ImpactIngredient): PricingMode {
  return i.unit_cost_p !== null ? 'unit' : 'bottle'
}

/**
 * Compute the new contribution of this ingredient to a single cocktail's
 * pour cost given a hypothetical new cost (in pence). Returns pence rounded
 * to the nearest integer, mirroring `calculations.ts`.
 */
export function newIngredientContributionP(
  ingredient: ImpactIngredient,
  cocktail: ImpactCocktail,
  newCostP: number,
): number {
  if (pricingMode(ingredient) === 'unit') {
    const count = cocktail.unit_count ?? 1
    return Math.round(newCostP * count)
  }
  if (
    ingredient.bottle_size_ml !== null &&
    cocktail.pour_ml !== null
  ) {
    return Math.round((newCostP / ingredient.bottle_size_ml) * cocktail.pour_ml)
  }
  return 0
}

export interface ProjectedCocktail extends ImpactCocktail {
  projected_pour_cost_p: number
  projected_margin_p: number
  projected_gp_pct: number
  current_gp_pct: number
  current_margin_p: number
  below_target_now: boolean
  below_target_after: boolean
}

const VAT_DIVISOR = 1.20
function netSalePrice(sale_price_p: number, includeVat: boolean): number {
  if (!includeVat) return sale_price_p
  return Math.round(sale_price_p / VAT_DIVISOR)
}

export function projectCocktail(
  ingredient: ImpactIngredient,
  cocktail: ImpactCocktail,
  newCostP: number,
): ProjectedCocktail {
  const newContribution = newIngredientContributionP(ingredient, cocktail, newCostP)
  const projected_pour_cost_p =
    cocktail.current_pour_cost_p - cocktail.current_ingredient_contribution_p + newContribution
  const net_sale_p = netSalePrice(cocktail.sale_price_p, cocktail.menu_prices_include_vat)
  const current_margin_p = net_sale_p - cocktail.current_pour_cost_p
  const projected_margin_p = net_sale_p - projected_pour_cost_p
  const current_gp_pct =
    net_sale_p === 0 ? 0 : (current_margin_p / net_sale_p) * 100
  const projected_gp_pct =
    net_sale_p === 0 ? 0 : (projected_margin_p / net_sale_p) * 100
  return {
    ...cocktail,
    projected_pour_cost_p,
    projected_margin_p,
    projected_gp_pct: Math.round(projected_gp_pct * 10) / 10,
    current_gp_pct: Math.round(current_gp_pct * 10) / 10,
    current_margin_p,
    below_target_now: current_gp_pct < cocktail.menu_target_gp_pct,
    below_target_after: projected_gp_pct < cocktail.menu_target_gp_pct,
  }
}

export interface MenuRollup {
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  cocktail_count: number
  current_avg_gp_pct: number
  projected_avg_gp_pct: number
  newly_below_target: number
}

export function rollupByMenu(projected: ProjectedCocktail[]): MenuRollup[] {
  const map = new Map<string, ProjectedCocktail[]>()
  for (const p of projected) {
    if (!map.has(p.menu_id)) map.set(p.menu_id, [])
    map.get(p.menu_id)!.push(p)
  }
  const rollups: MenuRollup[] = []
  for (const [menuId, cocktails] of map.entries()) {
    const first = cocktails[0]
    const avg = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((s, n) => s + n, 0) / xs.length)
    const current_avg_gp_pct = avg(cocktails.map((c) => c.current_gp_pct))
    const projected_avg_gp_pct = avg(cocktails.map((c) => c.projected_gp_pct))
    const newly_below_target = cocktails.filter(
      (c) => !c.below_target_now && c.below_target_after,
    ).length
    rollups.push({
      menu_id: menuId,
      menu_name: first.menu_name,
      menu_target_gp_pct: first.menu_target_gp_pct,
      cocktail_count: cocktails.length,
      current_avg_gp_pct: Math.round(current_avg_gp_pct * 10) / 10,
      projected_avg_gp_pct: Math.round(projected_avg_gp_pct * 10) / 10,
      newly_below_target,
    })
  }
  rollups.sort((a, b) => a.menu_name.localeCompare(b.menu_name))
  return rollups
}

/**
 * Drinks that would cross from at/above their menu's target GP to below
 * it as a result of the cost change. Used by the inline cost-ripple flow
 * to decide whether to fire the confirm modal on save — only newly-below
 * drinks warrant interruption; already-below drinks are not regressions
 * caused by this change.
 */
export function getNewlyBelowTarget(projected: ProjectedCocktail[]): ProjectedCocktail[] {
  return projected.filter((p) => !p.below_target_now && p.below_target_after)
}
