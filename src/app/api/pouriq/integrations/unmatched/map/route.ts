// POST /api/pouriq/integrations/unmatched/map
// Maps an unmatched till name to a cocktail and backfills logged sales.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { isRateLimited } from '@/lib/kv'
import { createMapping } from '@/lib/pouriq/pos/item-map'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  if (await isRateLimited(kv, 'pouriq-item-map', access.tradeAccountId, 120, 3600)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  let body: { normalisedName?: string; cocktailId?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const normalisedName = body.normalisedName?.trim()
  const cocktailId = body.cocktailId?.trim()
  if (!normalisedName || !cocktailId) {
    return NextResponse.json({ error: 'normalisedName and cocktailId are required' }, { status: 400 })
  }

  const db = env.DB as D1Database
  try {
    await createMapping(db, access.tradeAccountId, normalisedName, cocktailId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'That cocktail is not available on this account' }, { status: 422 })
  }
}
