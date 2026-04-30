import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyTradeCookie, TRADE_COOKIE_NAME } from '@/lib/trade-cookie'
import { revokeTradeSession, isAllowedOrigin } from '@/lib/kv'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TRADE_COOKIE_NAME}=([^;]+)`)
  )
  const cookieValue = cookieMatch?.[1]

  if (cookieValue) {
    const { env } = await getCloudflareContext()
    const secret = env.TRADE_SESSION_SECRET as string | undefined
    if (secret) {
      const payload = await verifyTradeCookie(cookieValue, secret)
      if (payload?.sid) {
        const kv = env.SITE_OPS as KVNamespace
        await revokeTradeSession(kv, payload.sid)
      }
    }
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(TRADE_COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
