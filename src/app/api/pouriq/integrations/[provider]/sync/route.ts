import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getConnection, markSyncSuccess, markSyncError } from '@/lib/pouriq/pos/connections'
import { createSquareAdapter } from '@/lib/pouriq/pos/providers/square'
import { ingestOrderLines } from '@/lib/pouriq/pos/ingest'
import type { PosProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (provider !== 'square') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connection = await getConnection(db, access.tradeAccountId, provider as PosProvider)
  if (!connection) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 })
  }
  const adapter = createSquareAdapter({
    SQUARE_APP_ID: env.SQUARE_APP_ID,
    SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
    SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    SQUARE_ENV: env.SQUARE_ENV,
  })
  // Sync from last_synced_at - 1 hour overlap (for safety), or 7 days
  // back on the very first sync.
  const since = connection.last_synced_at
    ? new Date(new Date(connection.last_synced_at).getTime() - 60 * 60 * 1000)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  try {
    const lines = await adapter.fetchOrdersSince(connection, since)
    const result = await ingestOrderLines(db, connection, lines)
    if (!result.paused) {
      await markSyncSuccess(db, connection.id)
    }
    return NextResponse.json({
      ok: true,
      paused: result.paused === true,
      matched: result.matched,
      unmatched: result.unmatched,
      since: since.toISOString(),
    })
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'pos-sync', provider } })
    await markSyncError(db, connection.id, (e as Error).message ?? 'unknown').catch(() => {})
    return NextResponse.json({ error: 'sync failed' }, { status: 500 })
  }
}
