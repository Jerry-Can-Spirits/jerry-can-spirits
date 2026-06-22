// "Needs attention" aggregator for the Pour IQ hub — pulls the signals a
// time-strapped operator should act on into one ordered list, scoped to the
// active menu for the menu-specific ones.

import type { MenuMetrics } from './types'
import { countUnmatched } from './pos/item-map'
import { listConnections } from './pos/connections'
import { getActiveMenu, listCocktailsForMenu } from './menus'
import { listVolumesForPeriod, currentPeriod } from './volumes'
import { calculateMenuMetrics } from './calculations'

export interface AttentionRow {
  key: string
  label: string
  href: string
}

// Pure: the menu-specific counts derived from computed metrics. Incomplete-cost
// drinks are never counted as under-target — their GP isn't trustworthy.
export function deriveMenuAttention(
  metrics: MenuMetrics,
  targetGpPct: number,
): { incompleteCostCount: number; underTargetCount: number } {
  const underTargetCount = metrics.cocktail_metrics.filter(
    (m) => m.cost_complete && m.sale_price_p > 0 && m.gp_pct < targetGpPct,
  ).length
  return { incompleteCostCount: metrics.incomplete_cost_count, underTargetCount }
}

const PROVIDER_LABELS: Record<string, string> = { square: 'Square', zettle: 'Zettle', sumup: 'SumUp' }

export async function getAttentionRows(db: D1Database, tradeAccountId: string): Promise<AttentionRow[]> {
  const [unmatched, connections, activeMenu] = await Promise.all([
    countUnmatched(db, tradeAccountId),
    listConnections(db, tradeAccountId),
    getActiveMenu(db, tradeAccountId),
  ])
  const rows: AttentionRow[] = []
  const enabled = connections.filter((c) => c.enabled === 1)

  // 1. Sales paused — a POS is connected but there's no active menu to route to.
  if (enabled.length > 0 && !activeMenu) {
    rows.push({ key: 'paused', label: 'Sales are paused — set an active menu', href: '/trade/pouriq' })
  }
  // 2. Sync errors, per connection.
  for (const c of connections) {
    if (c.last_sync_error) {
      rows.push({
        key: `sync-${c.provider}`,
        label: `${PROVIDER_LABELS[c.provider] ?? c.provider} sync error — reconnect`,
        href: '/trade/pouriq/settings/integrations',
      })
    }
  }
  // 3. Unmatched till items.
  if (unmatched > 0) {
    rows.push({
      key: 'unmatched',
      label: `${unmatched} unmatched till ${unmatched === 1 ? 'item' : 'items'} — sales not counting`,
      href: '/trade/pouriq/unmatched',
    })
  }
  // 4 & 5. Active-menu cost/GP signals.
  if (activeMenu) {
    const period = currentPeriod(activeMenu.volume_cadence)
    const [cocktails, volumes] = await Promise.all([
      listCocktailsForMenu(db, activeMenu.id),
      listVolumesForPeriod(db, activeMenu.id, period.start, period.end),
    ])
    const metrics = calculateMenuMetrics(cocktails, activeMenu.prices_include_vat === 1, volumes)
    const { incompleteCostCount, underTargetCount } = deriveMenuAttention(metrics, activeMenu.target_gp_pct)
    if (incompleteCostCount > 0) {
      rows.push({
        key: 'prices',
        label: `${incompleteCostCount} drink${incompleteCostCount === 1 ? '' : 's'} need prices on ${activeMenu.name}`,
        href: `/trade/pouriq/${activeMenu.id}`,
      })
    }
    if (underTargetCount > 0) {
      rows.push({
        key: 'gp',
        label: `${underTargetCount} drink${underTargetCount === 1 ? '' : 's'} under target GP on ${activeMenu.name}`,
        href: `/trade/pouriq/${activeMenu.id}`,
      })
    }
  }
  return rows
}
