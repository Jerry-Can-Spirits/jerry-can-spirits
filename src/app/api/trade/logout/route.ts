// POST /api/trade/logout
// Revokes the trade session and clears the cookie.

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import {
  getTradeSessionCookieValue,
  revokeTradeSession,
  clearTradeSessionCookie,
} from '@/lib/trade-portal/session'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sid = await getTradeSessionCookieValue()
  if (sid) {
    const { env } = await getCloudflareContext()
    const kv = env.SITE_OPS as KVNamespace
    await revokeTradeSession(kv, sid)
  }
  await clearTradeSessionCookie()
  return NextResponse.json({ success: true })
}
