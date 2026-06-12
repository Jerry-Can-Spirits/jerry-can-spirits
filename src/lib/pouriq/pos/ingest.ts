import type { PosConnection, PosOrderLine } from './types'
import { matchPosItemToCocktail } from './match'
import { currentPeriod } from '../volumes'
import { listCocktailsForMenu, listMenusForTradeAccount } from '../menus'

/**
 * Take a batch of POS order lines, match each to a cocktail in the
 * connection's target menu, aggregate quantity by (cocktail, period),
 * and upsert into pouriq_drink_volumes with source = 'pos'.
 *
 * When `connection.target_menu_id` is null (or points at a deleted
 * menu), ingest is paused and the function returns immediately with
 * `paused: true`. Callers must skip advancing `last_synced_at` in
 * that case so the next sync after a target menu is picked still
 * fetches the orders that arrived while paused.
 */
export async function ingestOrderLines(
  db: D1Database,
  connection: PosConnection,
  lines: PosOrderLine[],
): Promise<{ matched: number; unmatched: number; paused?: boolean }> {
  if (!connection.target_menu_id) {
    return { matched: 0, unmatched: 0, paused: true }
  }
  if (lines.length === 0) return { matched: 0, unmatched: 0 }

  // Limit the cocktail pool to the designated target menu. Other menus
  // (e.g. the previous season's, a draft, a clone for what-if analysis)
  // are intentionally excluded so each menu's volume reflects only the
  // period when it was actually live.
  const allMenus = await listMenusForTradeAccount(db, connection.trade_account_id)
  const targetMenu = allMenus.find((m) => m.id === connection.target_menu_id)
  if (!targetMenu) {
    // Target menu was deleted — pause until a new one is picked.
    return { matched: 0, unmatched: 0, paused: true }
  }

  // Order-level dedup: the hourly cron re-fetches a one-hour overlap and
  // webhooks can deliver orders the cron later fetches again. Volumes are
  // additive, so each order must be ingested exactly once per connection.
  // INSERT OR IGNORE marks the order seen; only orders whose insert took
  // effect (meta.changes > 0) are processed. Runs after the paused checks
  // so paused orders stay unseen and are picked up by the post-pause sync.
  const orderIds = Array.from(new Set(lines.map((l) => l.external_order_id)))
  const seenResults = await db.batch(
    orderIds.map((oid) =>
      db
        .prepare(`INSERT OR IGNORE INTO pouriq_pos_seen_orders (connection_id, external_order_id) VALUES (?1, ?2)`)
        .bind(connection.id, oid),
    ),
  )
  const freshOrderIds = new Set(orderIds.filter((_, i) => (seenResults[i]?.meta.changes ?? 0) > 0))
  lines = lines.filter((l) => freshOrderIds.has(l.external_order_id))
  if (lines.length === 0) return { matched: 0, unmatched: 0 }
  const menus = [targetMenu]
  const cocktailsByMenu = new Map<string, Awaited<ReturnType<typeof listCocktailsForMenu>>>()
  cocktailsByMenu.set(targetMenu.id, await listCocktailsForMenu(db, targetMenu.id))
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
