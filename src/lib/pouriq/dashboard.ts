import type { MenuMetrics } from './types'
import { getAttentionRows, deriveMenuAttention, type AttentionRow } from './attention'
import { getActiveMenu, listCocktailsForMenu } from './menus'
import { listVolumesForPeriod, currentPeriod } from './volumes'
import { calculateMenuMetrics } from './calculations'

export interface SalesSummary { revenue_p: number; serves: number; top: Array<{ name: string; units: number }> }
export interface ProfitabilitySummary {
  headline_gp_pct: number
  headline_basis: 'blended' | 'average'
  below_target: number
  incomplete: number
}
export interface DashboardData {
  attention: AttentionRow[]
  sales: SalesSummary | null
  profitability: ProfitabilitySummary | null
  activeMenuId: string | null
}

// Pure: period revenue / serves / top sellers from computed menu metrics.
export function deriveSalesSummary(metrics: MenuMetrics): SalesSummary {
  let revenue_p = 0
  let serves = 0
  const sellers: Array<{ name: string; units: number }> = []
  for (const c of metrics.cocktail_metrics) {
    const u = c.volume?.units_sold ?? 0
    if (u <= 0) continue
    revenue_p += u * c.sale_price_p
    serves += u
    sellers.push({ name: c.name, units: u })
  }
  sellers.sort((a, b) => b.units - a.units)
  return { revenue_p, serves, top: sellers.slice(0, 3) }
}

export async function loadDashboard(db: D1Database, tradeAccountId: string): Promise<DashboardData> {
  // getAttentionRows is the single source for attention; it computes the active
  // menu's metrics internally. We recompute once more here for the sales /
  // profitability tiles — a few extra reads on a force-dynamic page, acceptable.
  const attention = await getAttentionRows(db, tradeAccountId)
  const activeMenu = await getActiveMenu(db, tradeAccountId)
  if (!activeMenu) return { attention, sales: null, profitability: null, activeMenuId: null }

  const period = currentPeriod(activeMenu.volume_cadence)
  const [cocktails, volumes] = await Promise.all([
    listCocktailsForMenu(db, activeMenu.id),
    listVolumesForPeriod(db, activeMenu.id, period.start, period.end),
  ])
  const metrics = calculateMenuMetrics(cocktails, activeMenu.prices_include_vat === 1, volumes)
  const { underTargetCount } = deriveMenuAttention(metrics, activeMenu.target_gp_pct)
  return {
    attention,
    sales: deriveSalesSummary(metrics),
    profitability: {
      headline_gp_pct: metrics.headline_gp_pct,
      headline_basis: metrics.headline_basis,
      below_target: underTargetCount,
      incomplete: metrics.incomplete_cost_count,
    },
    activeMenuId: activeMenu.id,
  }
}
