// POST /api/pouriq/login
// Body: { pin: string }
// Sets the jcs_trade_sid cookie on success.
//
// Env: SITE_OPS (KV), DB (D1)

import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  isAllowedOrigin,
  isRateLimited,
  incrementTradeFailedAttempts,
  clearTradeFailedAttempts,
  TRADE_MAX_ATTEMPTS,
} from '@/lib/kv'
import { createPourIqSession, setSessionCookie } from '@/lib/pouriq/session'

export const runtime = 'nodejs'

const LOGIN_RATE_LIMIT = 10 // per hour per IP

interface LoginBody {
  pin?: string
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'pouriq-login', ip, LOGIN_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  }

  let body: LoginBody
  try {
    body = (await request.json()) as LoginBody
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const pin = body.pin?.trim()
  // Length-only sanity check. Format (digits, alphanumeric, etc.) is not enforced
  // here because the existing trade_accounts table has no format constraint —
  // the DB lookup below is the source of truth.
  if (!pin || pin.length < 4 || pin.length > 32) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 })
  }

  const failedAttempts = await incrementTradeFailedAttempts(kv, ip)
  if (failedAttempts > TRADE_MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const account = await db
    .prepare(`SELECT id FROM trade_accounts WHERE pin = ?1 AND active = 1`)
    .bind(pin)
    .first<{ id: string }>()
  if (!account) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  await clearTradeFailedAttempts(kv, ip)
  const sid = await createPourIqSession(kv, account.id)
  await setSessionCookie(sid)
  return NextResponse.json({ success: true })
}
