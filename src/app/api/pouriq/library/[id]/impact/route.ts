// GET /api/pouriq/library/[id]/impact
// Returns the data needed to render a cost-change ripple analysis:
// the ingredient itself, plus every affected cocktail with its current
// pour cost and the per-cocktail contribution of this specific ingredient.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getLibraryEntry } from '@/lib/pouriq/ingredient-library'
import type {
  CostImpactPayload,
  ImpactCocktail,
  ImpactIngredient,
} from '@/lib/pouriq/cost-impact'

export const runtime = 'nodejs'

interface RawRow {
  cocktail_id: string
  cocktail_name: string
  cocktail_sale_price_p: number
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  ingredient_library_id: string
  ingredient_pour_ml: number | null
  ingredient_unit_count: number | null
  lib_bottle_size_ml: number | null
  lib_bottle_cost_p: number | null
  lib_unit_cost_p: number | null
}

function rowContributionP(row: RawRow): number {
  if (row.lib_unit_cost_p !== null) {
    const count = row.ingredient_unit_count ?? 1
    return Math.round(row.lib_unit_cost_p * count)
  }
  if (
    row.lib_bottle_size_ml !== null &&
    row.lib_bottle_cost_p !== null &&
    row.ingredient_pour_ml !== null
  ) {
    return Math.round((row.lib_bottle_cost_p / row.lib_bottle_size_ml) * row.ingredient_pour_ml)
  }
  return 0
}

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const entry = await getLibraryEntry(db, id, access.tradeAccountId)
  if (!entry) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Pull all ingredient rows for every cocktail that uses this library
  // entry, in one round trip. We need ALL ingredients of each affected
  // cocktail so we can sum the current pour cost server-side.
  const result = await db
    .prepare(`
      WITH affected AS (
        SELECT DISTINCT c.id AS cocktail_id
        FROM pouriq_ingredients i
        JOIN pouriq_cocktails c ON c.id = i.cocktail_id
        JOIN pouriq_menus m ON m.id = c.menu_id
        WHERE i.library_ingredient_id = ?1
          AND m.trade_account_id = ?2
      )
      SELECT
        c.id AS cocktail_id,
        c.name AS cocktail_name,
        c.sale_price_p AS cocktail_sale_price_p,
        m.id AS menu_id,
        m.name AS menu_name,
        m.target_gp_pct AS menu_target_gp_pct,
        i.library_ingredient_id AS ingredient_library_id,
        i.pour_ml AS ingredient_pour_ml,
        i.unit_count AS ingredient_unit_count,
        lib.bottle_size_ml AS lib_bottle_size_ml,
        lib.bottle_cost_p AS lib_bottle_cost_p,
        lib.unit_cost_p AS lib_unit_cost_p
      FROM affected a
      JOIN pouriq_cocktails c ON c.id = a.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      JOIN pouriq_ingredients i ON i.cocktail_id = c.id
      JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
      ORDER BY m.name, c.name
    `)
    .bind(id, access.tradeAccountId)
    .all<RawRow>()

  const rows = result.results ?? []

  const byCocktail = new Map<string, RawRow[]>()
  for (const row of rows) {
    if (!byCocktail.has(row.cocktail_id)) byCocktail.set(row.cocktail_id, [])
    byCocktail.get(row.cocktail_id)!.push(row)
  }

  const affected: ImpactCocktail[] = []
  for (const cocktailRows of byCocktail.values()) {
    const first = cocktailRows[0]
    let totalPourCost = 0
    let thisContribution = 0
    let pourMl: number | null = null
    let unitCount: number | null = null
    for (const r of cocktailRows) {
      const contribution = rowContributionP(r)
      totalPourCost += contribution
      if (r.ingredient_library_id === id) {
        thisContribution += contribution
        pourMl = r.ingredient_pour_ml
        unitCount = r.ingredient_unit_count
      }
    }
    affected.push({
      cocktail_id: first.cocktail_id,
      cocktail_name: first.cocktail_name,
      menu_id: first.menu_id,
      menu_name: first.menu_name,
      menu_target_gp_pct: first.menu_target_gp_pct,
      sale_price_p: first.cocktail_sale_price_p,
      current_pour_cost_p: totalPourCost,
      current_ingredient_contribution_p: thisContribution,
      pour_ml: pourMl,
      unit_count: unitCount,
    })
  }

  const ingredient: ImpactIngredient = {
    id: entry.id,
    name: entry.name,
    ingredient_type: entry.ingredient_type,
    bottle_size_ml: entry.bottle_size_ml,
    bottle_cost_p: entry.bottle_cost_p,
    unit_cost_p: entry.unit_cost_p,
  }

  const payload: CostImpactPayload = { ingredient, affected }
  return NextResponse.json(payload)
}
