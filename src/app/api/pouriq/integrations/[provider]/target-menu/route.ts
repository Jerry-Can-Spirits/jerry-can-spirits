import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import type { PosProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

const KNOWN_PROVIDERS: PosProvider[] = ['square', 'eposnow', 'lightspeed', 'toast']

export async function POST(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (!KNOWN_PROVIDERS.includes(provider as PosProvider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as { menuId?: string | null }
  const menuId = body.menuId && body.menuId.length > 0 ? body.menuId : null

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  // Defense in depth: confirm the menu (if specified) belongs to this tenant.
  if (menuId) {
    const owns = await db
      .prepare(`SELECT 1 AS one FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
      .bind(menuId, access.tradeAccountId)
      .first<{ one: number }>()
    if (!owns) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }
  }

  const result = await db
    .prepare(`UPDATE pouriq_pos_connections SET target_menu_id = ?1, updated_at = datetime('now') WHERE trade_account_id = ?2 AND provider = ?3`)
    .bind(menuId, access.tradeAccountId, provider as PosProvider)
    .run()

  if (!result.success) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, target_menu_id: menuId })
}
