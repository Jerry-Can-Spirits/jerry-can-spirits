import type { PosConnection, PosOrderLine } from './types'
import { matchPosItemToCocktail, normalise } from './match'
import { loadAliases } from './item-map'
import { currentPeriod } from '../volumes'
import { listCocktailsForMenu, listMenusForTradeAccount } from '../menus'
import type { MenuRow } from '../types'

export interface BucketEntry {
  cocktailId: string
  periodStart: string
  periodEnd: string
  units: number
}

interface CocktailLine {
  cocktail_id: string
  quantity: number
  sold_at: string
}

// Pure: turn matched lines into (cocktail, period) buckets using the menu's
// cadence. Shared by live ingest and by mapping backfill so both attribute
// volume identically.
export function bucketLines(menu: Pick<MenuRow, 'volume_cadence'>, lines: CocktailLine[]): BucketEntry[] {
  const bucket = new Map<string, BucketEntry>()
  for (const line of lines) {
    const period = currentPeriod(menu.volume_cadence, new Date(line.sold_at))
    const key = `${line.cocktail_id}::${period.start}::${period.end}`
    const existing = bucket.get(key)
    if (existing) existing.units += line.quantity
    else bucket.set(key, {
      cocktailId: line.cocktail_id,
      periodStart: period.start,
      periodEnd: period.end,
      units: line.quantity,
    })
  }
  return Array.from(bucket.values())
}

// Additive upsert (existing units + new units). POS volume accumulates,
// unlike the manual volumes.ts upsert which REPLACES.
export async function upsertAdditiveVolumes(db: D1Database, entries: BucketEntry[]): Promise<void> {
  for (const v of entries) {
    await db
      .prepare(`
        INSERT INTO pouriq_drink_volumes (cocktail_id, period_start, period_end, units_sold, source)
        VALUES (?1, ?2, ?3, ?4, 'pos')
        ON CONFLICT(cocktail_id, period_start, period_end) DO UPDATE SET
          units_sold = units_sold + excluded.units_sold,
          source = CASE WHEN source = 'manual' THEN 'manual' ELSE 'pos' END,
          updated_at = datetime('now')
      `)
      .bind(v.cocktailId, v.periodStart, v.periodEnd, Math.round(v.units))
      .run()
  }
}

/**
 * Take a batch of POS order lines, resolve each to a cocktail in the
 * connection's target menu (ignored alias → mapped alias → exact/fuzzy),
 * aggregate by (cocktail, period), and additively upsert into
 * pouriq_drink_volumes. Lines that resolve to nothing are logged to
 * pouriq_pos_unmatched_lines for review and later backfill.
 *
 * When `connection.target_menu_id` is null (or points at a deleted menu),
 * ingest is paused and returns `paused: true`; callers must skip advancing
 * `last_synced_at` so the next sync backfills orders received while paused.
 */
export async function ingestOrderLines(
  db: D1Database,
  connection: PosConnection,
  lines: PosOrderLine[],
): Promise<{ matched: number; unmatched: number; paused?: boolean }> {
  // Keep the unmatched-line log bounded to the 90-day backfill window.
  await db
    .prepare(`DELETE FROM pouriq_pos_unmatched_lines WHERE created_at < datetime('now','-90 days')`)
    .run()
    .catch(() => {})

  if (!connection.target_menu_id) {
    return { matched: 0, unmatched: 0, paused: true }
  }
  if (lines.length === 0) return { matched: 0, unmatched: 0 }

  // Limit the cocktail pool to the designated target menu. Other menus
  // (previous season's, drafts, what-if clones) are intentionally excluded
  // so each menu's volume reflects only its live period.
  const allMenus = await listMenusForTradeAccount(db, connection.trade_account_id)
  const targetMenu = allMenus.find((m) => m.id === connection.target_menu_id)
  if (!targetMenu) {
    return { matched: 0, unmatched: 0, paused: true }
  }

  // Order-level dedup: the hourly cron re-fetches a one-hour overlap and
  // webhooks can deliver orders the cron later fetches again. Volumes are
  // additive, so each order must be ingested exactly once per connection.
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

  const cocktails = await listCocktailsForMenu(db, targetMenu.id)
  const cocktailByNormName = new Map(cocktails.map((c) => [normalise(c.name), c]))
  const aliases = await loadAliases(db, connection.trade_account_id)

  const matchedLines: CocktailLine[] = []
  const unmatchedLines: PosOrderLine[] = []
  for (const line of lines) {
    const norm = normalise(line.name)
    const alias = aliases.get(norm)
    if (alias?.ignored) continue // suppressed non-cocktail till button

    let cocktailId: string | null = null
    if (alias?.cocktail_name) {
      // Resolve by name so the mapping survives a seasonal menu change.
      cocktailId = cocktailByNormName.get(alias.cocktail_name)?.id ?? null
    }
    if (!cocktailId) {
      cocktailId = matchPosItemToCocktail(line.name, cocktails)?.id ?? null
    }

    if (cocktailId) {
      matchedLines.push({ cocktail_id: cocktailId, quantity: line.quantity, sold_at: line.sold_at })
    } else {
      unmatchedLines.push(line)
    }
  }

  await upsertAdditiveVolumes(db, bucketLines(targetMenu, matchedLines))

  if (unmatchedLines.length > 0) {
    await db.batch(
      unmatchedLines.map((l) =>
        db
          .prepare(`
            INSERT INTO pouriq_pos_unmatched_lines
              (connection_id, trade_account_id, normalised_name, raw_name, quantity, sold_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
          `)
          .bind(connection.id, connection.trade_account_id, normalise(l.name), l.name, Math.round(l.quantity), l.sold_at),
      ),
    )
  }

  return { matched: matchedLines.length, unmatched: unmatchedLines.length }
}
