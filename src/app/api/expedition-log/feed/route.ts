// GET /api/expedition-log/feed?batch=batch-001&limit=5
// Public read API for the QR landing page: recent log entries + a count for
// one batch. Only fields that already appear publicly on /expedition-log/
// are returned. CORS-open (public data) and edge-cached.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'nodejs'

const BATCH_ID_RE = /^[A-Za-z0-9][A-Za-z0-9\-]{0,49}$/

export async function GET(request: Request) {
  const url = new URL(request.url)
  const batch = (url.searchParams.get('batch') ?? '').trim()
  if (!BATCH_ID_RE.test(batch)) {
    return NextResponse.json({ error: 'Invalid batch' }, { status: 400 })
  }
  const limitRaw = parseInt(url.searchParams.get('limit') ?? '5', 10)
  const limit = Math.min(10, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : 5))

  const { env } = await getCloudflareContext()
  const db = env.DB

  const [entriesRes, countRes] = await Promise.all([
    db
      .prepare(
        `SELECT name, location, created_at FROM expedition_log WHERE batch_id = ?1 ORDER BY created_at DESC LIMIT ?2`,
      )
      .bind(batch, limit)
      .all<{ name: string; location: string | null; created_at: string }>(),
    db
      .prepare(`SELECT COUNT(*) AS n FROM expedition_log WHERE batch_id = ?1`)
      .bind(batch)
      .first<{ n: number }>(),
  ])

  return NextResponse.json(
    { count: countRes?.n ?? 0, entries: entriesRes.results ?? [] },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=30, s-maxage=60',
      },
    },
  )
}
