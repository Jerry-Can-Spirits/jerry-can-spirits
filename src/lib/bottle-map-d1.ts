// The bottle map's D1 reads and writes. The rules are in bottle-map.ts.

import {
  AGGREGATE_BOTTLE_MAP_SQL,
  UPSERT_BOTTLE_MAP_SQL,
  bottleMapRowFromOrder,
  summariseBottleMap,
  type BottleMapGroup,
  type BottleMapRow,
  type BottleMapSummary,
} from '@/lib/bottle-map'
import { captureServerError } from '@/lib/server-error-capture'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'
import { attributeTradeOrder } from '@/lib/trade-portal/orders'

/** Write the row once; a retry or a re-run rewrites the same values. */
export async function upsertBottleMapRow(db: D1Database, row: BottleMapRow): Promise<void> {
  await db
    .prepare(UPSERT_BOTTLE_MAP_SQL)
    .bind(row.order_id, row.created_at, row.country, row.outward_code, row.town, row.bottles)
    .run()
}

/** Remove an order's row (cancellation, or a customer asking not to appear). */
export async function deleteBottleMapRow(db: D1Database, orderId: number | string): Promise<void> {
  await db.prepare('DELETE FROM bottle_map WHERE order_id = ?1').bind(String(orderId)).run()
}

/**
 * Called from the orders/create webhook after the idempotency guard. Never
 * throws: a missed order is picked up by the next run of the backfill script,
 * and a customer's order must not fail over a map. Runs attributeTradeOrder
 * again rather than threading syncTradeOrder's result through, because that
 * function returns nothing by design; the cost is one to three D1 reads.
 */
export async function recordBottleMapOrder(db: D1Database, order: ShopifyOrder): Promise<void> {
  try {
    const isTrade = (await attributeTradeOrder(db, order)) !== null
    const decision = bottleMapRowFromOrder(order, isTrade)
    if (decision.skip) {
      console.log(`[bottle-map] order #${order.order_number} not mapped: ${decision.skip}`)
      return
    }
    await upsertBottleMapRow(db, decision.row)
    console.log(
      `[bottle-map] order #${order.order_number} -> ${decision.row.outward_code ?? decision.row.country}, ${decision.row.bottles} bottles`,
    )
  } catch (err) {
    console.error('[bottle-map] record failed for order #%s (non-fatal):', order.order_number, err)
    await captureServerError(err, { tags: { source: 'shopify-webhook', phase: 'bottle-map' } })
  }
}

/** The aggregate the page and the API serve. */
export async function getBottleMap(db: D1Database): Promise<BottleMapSummary> {
  const result = await db.prepare(AGGREGATE_BOTTLE_MAP_SQL).all<BottleMapGroup>()
  return summariseBottleMap(result.results ?? [])
}
