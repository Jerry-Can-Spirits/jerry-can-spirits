// Hourly cron: poll every active connection for orders since its
// last_synced_at. Idempotent — the upsert in ingestOrderLines bucketizes
// by (cocktail, period) and ON CONFLICT additive-merges, so overlapping
// runs from webhook + cron don't double-count beyond a small window
// (within the same period).

import { createSquareAdapter } from './providers/square'
import { ingestOrderLines } from './ingest'
import { markSyncSuccess, markSyncError } from './connections'
import type { PosConnection } from './types'

interface Env {
  DB: D1Database
  SQUARE_APP_ID: string
  SQUARE_APP_SECRET: string
  SQUARE_WEBHOOK_SIGNATURE_KEY: string
  SQUARE_ENV?: string
}

export async function runHourlyPosBackfill(env: Env): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE enabled = 1`)
    .all<PosConnection>()
  const connections = result.results ?? []
  for (const conn of connections) {
    try {
      if (conn.provider === 'square') {
        const adapter = createSquareAdapter(env)
        const since = conn.last_synced_at
          ? new Date(new Date(conn.last_synced_at).getTime() - 60 * 60 * 1000)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const lines = await adapter.fetchOrdersSince(conn, since)
        const result = await ingestOrderLines(db, conn, lines)
        if (!result.paused) {
          await markSyncSuccess(db, conn.id)
        }
      }
      // Future providers: dispatch here.
    } catch (e) {
      await markSyncError(db, conn.id, (e as Error).message ?? 'unknown').catch(() => {})
    }
  }
}
