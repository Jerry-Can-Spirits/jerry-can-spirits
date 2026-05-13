// GET /api/pouriq/library/by-barcode?code=XXXXX
// Returns the tenant's library entry matching this barcode, or null.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { findLibraryEntryByBarcode } from '@/lib/pouriq/ingredient-library'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim()
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const entry = await findLibraryEntryByBarcode(db, access.tradeAccountId, code)
  return NextResponse.json({ entry })
}
