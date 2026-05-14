import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  getLibraryEntry,
  getLibraryEntryUsage,
} from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'
import { SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'
import type {
  CostImpactPayload,
  ImpactCocktail,
  ImpactIngredient,
} from '@/lib/pouriq/cost-impact'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

interface RawRow {
  cocktail_id: string
  cocktail_name: string
  cocktail_sale_price_p: number
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  menu_prices_include_vat: number
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

async function loadImpactPayload(
  db: D1Database,
  ingredientId: string,
  tradeAccountId: string,
  entry: { id: string; name: string; ingredient_type: string; bottle_size_ml: number | null; bottle_cost_p: number | null; unit_cost_p: number | null },
): Promise<CostImpactPayload> {
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
        m.prices_include_vat AS menu_prices_include_vat,
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
    .bind(ingredientId, tradeAccountId)
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
      if (r.ingredient_library_id === ingredientId) {
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
      menu_prices_include_vat: first.menu_prices_include_vat === 1,
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

  return { ingredient, affected }
}

export default async function EditLibraryEntryPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const entry = await getLibraryEntry(db, id, access.tradeAccountId)
  if (!entry) notFound()

  const usage = await getLibraryEntryUsage(db, id)
  const impactPayload = await loadImpactPayload(db, id, access.tradeAccountId, entry)

  const byMenu = new Map<string, { menuName: string; cocktails: Array<{ id: string; name: string }> }>()
  for (const u of usage) {
    if (!byMenu.has(u.menu_id)) byMenu.set(u.menu_id, { menuName: u.menu_name, cocktails: [] })
    byMenu.get(u.menu_id)!.cocktails.push({ id: u.cocktail_id, name: u.cocktail_name })
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3 mb-8">
          <h1 className="text-3xl font-serif font-bold text-white">{entry.name}</h1>
          {usage.length > 0 && (
            <Link
              href={`/trade/pouriq/library/what-if?ingredient=${encodeURIComponent(entry.id)}`}
              className={SECONDARY_BUTTON_SM}
            >
              Test a cost change
            </Link>
          )}
        </div>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
          <IngredientForm entry={entry} usageCount={usage.length} impactPayload={impactPayload} />
        </div>

        {byMenu.size > 0 && (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <h2 className="text-lg font-serif font-bold text-white mb-4">Used in</h2>
            <div className="space-y-4">
              {Array.from(byMenu.entries()).map(([menuId, info]) => (
                <div key={menuId}>
                  <Link href={`/trade/pouriq/${menuId}`} className="text-sm font-medium text-gold-300 hover:text-gold-200 underline">
                    {info.menuName}
                  </Link>
                  <ul className="mt-1 text-sm text-parchment-300 list-inside list-disc">
                    {info.cocktails.map((c) => (
                      <li key={c.id}>
                        <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${c.id}`} className="hover:text-parchment-100 underline">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
