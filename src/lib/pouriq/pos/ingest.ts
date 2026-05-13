import type { PosConnection, PosOrderLine } from './types'
import { matchPosItemToCocktail } from './match'
import { currentPeriod } from '../volumes'
import { listCocktailsForMenu, listMenusForTradeAccount } from '../menus'

/**
 * Take a batch of POS order lines, match each to a cocktail across
 * the tenant's menus, aggregate quantity by (cocktail, period), and
 * upsert into pouriq_drink_volumes. Source on the row is marked 'pos'.
 *
 * Lines that don't match any cocktail are silently ignored at this
 * layer — they'll surface in the integrations UI's "unmatched items"
 * panel via a separate query.
 */
export async function ingestOrderLines(
  db: D1Database,
  connection: PosConnection,
  lines: PosOrderLine[],
): Promise<{ matched: number; unmatched: number }> {
  if (lines.length === 0) return { matched: 0, unmatched: 0 }

  // Build the cocktail pool across all menus in this tenant once.
  const menus = await listMenusForTradeAccount(db, connection.trade_account_id)
  const cocktailsByMenu = new Map<string, Awaited<ReturnType<typeof listCocktailsForMenu>>>()
  for (const m of menus) {
    cocktailsByMenu.set(m.id, await listCocktailsForMenu(db, m.id))
  }
  const allCocktails = Array.from(cocktailsByMenu.values()).flat()

  // Bucket by (menu_id, cocktail_id, period_start, period_end, units).
  type Key = string
  const bucket = new Map<Key, { menuId: string; cocktailId: string; period_start: string; period_end: string; units: number }>()
  let matched = 0
  let unmatched = 0
  for (const line of lines) {
    const cocktail = matchPosItemToCocktail(line.name, allCocktails)
    if (!cocktail) { unmatched++; continue }
    matched++
    // Find which menu this cocktail belongs to so we can apply the menu's
    // cadence when bucketing into a period.
    let menuId: string | null = null
    for (const [mid, list] of cocktailsByMenu.entries()) {
      if (list.some((c) => c.id === cocktail.id)) { menuId = mid; break }
    }
    if (!menuId) continue
    const menu = menus.find((m) => m.id === menuId)
    if (!menu) continue
    const period = currentPeriod(menu.volume_cadence, new Date(line.sold_at))
    const key = `${menuId}::${cocktail.id}::${period.start}::${period.end}`
    const existing = bucket.get(key)
    if (existing) existing.units += line.quantity
    else bucket.set(key, {
      menuId, cocktailId: cocktail.id,
      period_start: period.start, period_end: period.end,
      units: line.quantity,
    })
  }

  // Apply each bucket as an additive upsert (existing units + new units).
  // We can't use the volumes.ts upsertVolumes helper because that REPLACES
  // units; for POS we need to ADD.
  for (const v of bucket.values()) {
    await db
      .prepare(`
        INSERT INTO pouriq_drink_volumes (cocktail_id, period_start, period_end, units_sold, source)
        VALUES (?1, ?2, ?3, ?4, 'pos')
        ON CONFLICT(cocktail_id, period_start, period_end) DO UPDATE SET
          units_sold = units_sold + excluded.units_sold,
          source = CASE WHEN source = 'manual' THEN 'manual' ELSE 'pos' END,
          updated_at = datetime('now')
      `)
      .bind(v.cocktailId, v.period_start, v.period_end, Math.round(v.units))
      .run()
  }

  return { matched, unmatched }
}
