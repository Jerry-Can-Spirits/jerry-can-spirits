import 'server-only'
import { sumBucketsInWindow } from './variance'
import { computeOnHandBottles } from './stock'

export interface RollingStockRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number
  yield_pct: number
  on_hand_bottles: number | null
  needs_opening_count: boolean
  anchor_count_at: string | null
  anchor_count_qty: number | null
  receipts_since: number
  expected_usage_bottles: number
}

// The stockable universe: every bottle-priced library ingredient, whether or not
// it appears in a recipe. Usage is recipe-derived (0 when an ingredient is
// stocked but used in no cocktail/serve).
interface LibraryMetaRow { id: string; name: string; bottle_size_ml: number; yield_pct: number }
interface RecipeLineRow { cocktail_id: string; library_ingredient_id: string; pour_ml: number }
interface VolumeRow { cocktail_id: string; period_start: string; period_end: string; units_sold: number }
interface EventRow { library_ingredient_id: string; counted_at: string; count_qty: number }
interface ReceiptRow { library_ingredient_id: string; received_at: string; qty: number }

async function readTenantLibrary(db: D1Database, tradeAccountId: string): Promise<LibraryMetaRow[]> {
  const res = await db.prepare(`
    SELECT id, name, bottle_size_ml, yield_pct
    FROM pouriq_ingredients_library
    WHERE trade_account_id = ?1 AND bottle_size_ml IS NOT NULL AND bottle_cost_p IS NOT NULL
  `).bind(tradeAccountId).all<LibraryMetaRow>()
  return res.results ?? []
}

async function readTenantRecipes(db: D1Database, tradeAccountId: string): Promise<RecipeLineRow[]> {
  const res = await db.prepare(`
    SELECT c.id AS cocktail_id, i.library_ingredient_id AS library_ingredient_id, i.pour_ml AS pour_ml
    FROM pouriq_cocktails c
    JOIN pouriq_menus m ON m.id = c.menu_id
    JOIN pouriq_ingredients i ON i.cocktail_id = c.id
    WHERE m.trade_account_id = ?1 AND i.pour_ml IS NOT NULL
  `).bind(tradeAccountId).all<RecipeLineRow>()
  return res.results ?? []
}

async function readTenantVolumes(db: D1Database, tradeAccountId: string): Promise<VolumeRow[]> {
  const res = await db.prepare(`
    SELECT v.cocktail_id AS cocktail_id, v.period_start AS period_start, v.period_end AS period_end, v.units_sold AS units_sold
    FROM pouriq_drink_volumes v
    JOIN pouriq_cocktails c ON c.id = v.cocktail_id
    JOIN pouriq_menus m ON m.id = c.menu_id
    WHERE m.trade_account_id = ?1
  `).bind(tradeAccountId).all<VolumeRow>()
  return res.results ?? []
}

async function readTenantEvents(db: D1Database, tradeAccountId: string): Promise<EventRow[]> {
  const res = await db.prepare(`
    SELECT library_ingredient_id, counted_at, count_qty
    FROM pouriq_stock_count_events
    WHERE trade_account_id = ?1
    ORDER BY counted_at ASC
  `).bind(tradeAccountId).all<EventRow>()
  return res.results ?? []
}

async function readTenantReceipts(db: D1Database, tradeAccountId: string): Promise<ReceiptRow[]> {
  const res = await db.prepare(
    `SELECT library_ingredient_id, received_at, qty FROM pouriq_stock_receipts WHERE trade_account_id = ?1`
  ).bind(tradeAccountId).all<ReceiptRow>()
  return res.results ?? []
}

export async function loadStockLevels(db: D1Database, tradeAccountId: string): Promise<RollingStockRow[]> {
  const [library, recipes, volumes, events, receipts] = await Promise.all([
    readTenantLibrary(db, tradeAccountId),
    readTenantRecipes(db, tradeAccountId),
    readTenantVolumes(db, tradeAccountId),
    readTenantEvents(db, tradeAccountId),
    readTenantReceipts(db, tradeAccountId),
  ])

  const volumesByCocktail = new Map<string, VolumeRow[]>()
  for (const v of volumes) {
    const arr = volumesByCocktail.get(v.cocktail_id) ?? []
    arr.push(v); volumesByCocktail.set(v.cocktail_id, arr)
  }

  // Recipe pour lines per ingredient (for theoretical usage). Lines for
  // non-bottle-priced ingredients are simply never looked up (only library ids
  // below are iterated).
  const linesByIngredient = new Map<string, Array<{ cocktail_id: string; pour_ml: number }>>()
  for (const r of recipes) {
    const arr = linesByIngredient.get(r.library_ingredient_id) ?? []
    arr.push({ cocktail_id: r.cocktail_id, pour_ml: r.pour_ml })
    linesByIngredient.set(r.library_ingredient_id, arr)
  }

  const eventsByIngredient = new Map<string, EventRow[]>()
  for (const e of events) {
    const arr = eventsByIngredient.get(e.library_ingredient_id) ?? []
    arr.push(e); eventsByIngredient.set(e.library_ingredient_id, arr)
  }

  const receiptsByIngredient = new Map<string, ReceiptRow[]>()
  for (const r of receipts) {
    const arr = receiptsByIngredient.get(r.library_ingredient_id) ?? []
    arr.push(r); receiptsByIngredient.set(r.library_ingredient_id, arr)
  }

  // Usage window runs from the anchor count to the far future so the CURRENT open
  // POS period (whose bucket period_end is later than today) is still counted.
  // Without this, mid-week/mid-month sales would not draw down on-hand until the
  // period closed. Buckets are keyed by (cocktail, period) so each counts once.
  const WINDOW_END = '9999-12-31'

  const rows: RollingStockRow[] = []
  for (const meta of library) {
    const ingId = meta.id
    const ingEvents = eventsByIngredient.get(ingId) ?? []
    const ingReceipts = receiptsByIngredient.get(ingId) ?? []
    const lines = linesByIngredient.get(ingId) ?? []
    // ingEvents already sorted ascending by counted_at from the DB query
    const anchor = ingEvents.length > 0 ? ingEvents[ingEvents.length - 1] : null

    if (anchor === null) {
      const receiptsSince = ingReceipts.reduce((sum, r) => sum + r.qty, 0)
      rows.push({
        library_ingredient_id: ingId,
        library_name: meta.name,
        bottle_size_ml: meta.bottle_size_ml,
        yield_pct: meta.yield_pct,
        on_hand_bottles: null,
        needs_opening_count: true,
        anchor_count_at: null,
        anchor_count_qty: null,
        receipts_since: receiptsSince,
        expected_usage_bottles: 0,
      })
    } else {
      const receiptsSince = ingReceipts
        .filter((r) => r.received_at > anchor.counted_at)
        .reduce((sum, r) => sum + r.qty, 0)

      let usageSinceMl = 0
      for (const line of lines) {
        const buckets = volumesByCocktail.get(line.cocktail_id) ?? []
        usageSinceMl += sumBucketsInWindow(buckets, anchor.counted_at.slice(0, 10), WINDOW_END) * line.pour_ml
      }

      const on_hand = computeOnHandBottles({
        anchorCountQty: anchor.count_qty,
        receiptsSinceBottles: receiptsSince,
        usageSinceMl,
        bottleSizeMl: meta.bottle_size_ml,
        yieldPct: meta.yield_pct,
      })

      const expected_usage_bottles = anchor.count_qty + receiptsSince - on_hand

      rows.push({
        library_ingredient_id: ingId,
        library_name: meta.name,
        bottle_size_ml: meta.bottle_size_ml,
        yield_pct: meta.yield_pct,
        on_hand_bottles: on_hand,
        needs_opening_count: false,
        anchor_count_at: anchor.counted_at,
        anchor_count_qty: anchor.count_qty,
        receipts_since: receiptsSince,
        expected_usage_bottles,
      })
    }
  }

  rows.sort((a, b) => a.library_name.localeCompare(b.library_name))
  return rows
}
