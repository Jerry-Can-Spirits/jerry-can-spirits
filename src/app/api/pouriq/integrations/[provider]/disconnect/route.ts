import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { deleteConnection } from '@/lib/pouriq/pos/connections'
import type { PosProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (!['square', 'eposnow', 'lightspeed', 'toast'].includes(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  await deleteConnection(db, access.tradeAccountId, provider as PosProvider)
  return NextResponse.json({ ok: true })
}
