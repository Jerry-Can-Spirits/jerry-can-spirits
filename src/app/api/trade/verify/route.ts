import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import {
  signTradeCookie,
  TRADE_COOKIE_NAME,
  TRADE_COOKIE_MAX_AGE,
  TradeCookiePayload,
} from '@/lib/trade-cookie'
import {
  getTradeFailedAttempts,
  incrementTradeFailedAttempts,
  clearTradeFailedAttempts,
  createTradeSession,
  TRADE_MAX_ATTEMPTS,
  isAllowedOrigin,
} from '@/lib/kv'

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: { pin?: unknown }
  try {
    body = await request.json() as { pin?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
  if (!pin || pin.length > 50) {
    return NextResponse.json({ error: 'Invalid PIN.' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const secret = env.TRADE_SESSION_SECRET as string | undefined

  if (!secret) {
    console.error('TRADE_SESSION_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const kv = env.SITE_OPS as KVNamespace
  const ip =
    (request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown')
      .split(',')[0]
      .trim()

  const failedAttempts = await getTradeFailedAttempts(kv, ip)
  if (failedAttempts >= TRADE_MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again in 15 minutes.' },
      { status: 429 },
    )
  }

  const db = env.DB as D1Database
  const account = await getTradeAccountByPin(db, pin)

  if (!account) {
    await incrementTradeFailedAttempts(kv, ip)
    return NextResponse.json({ error: 'Invalid PIN.' }, { status: 401 })
  }

  await clearTradeFailedAttempts(kv, ip)

  const sid = crypto.randomUUID()
  await createTradeSession(kv, sid)

  const payload: TradeCookiePayload = { pin, iat: Date.now(), sid }
  const cookieValue = await signTradeCookie(payload, secret)

  const res = NextResponse.json({
    venue_name: account.venue_name,
    tier: account.tier,
  })

  res.cookies.set(TRADE_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: TRADE_COOKIE_MAX_AGE,
    path: '/',
  })

  return res
}
