import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'

export const runtime = 'nodejs'

const META_PIXEL_ID = '825009767240821'
const RATE_LIMIT = 60 // events per minute per IP
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7
const ONE_MINUTE_SECONDS = 60

interface IncomingBody {
  eventName?: unknown
  eventID?: unknown
  eventTime?: unknown
  eventSourceUrl?: unknown
  customData?: unknown
}

function isValidBody(body: IncomingBody): body is {
  eventName: string
  eventID: string
  eventTime: number
  eventSourceUrl: string
  customData: Record<string, unknown>
} {
  return (
    typeof body.eventName === 'string' && body.eventName.length > 0 && body.eventName.length < 100
    && typeof body.eventID === 'string' && body.eventID.length > 0 && body.eventID.length < 100
    && typeof body.eventTime === 'number' && Number.isFinite(body.eventTime)
    && typeof body.eventSourceUrl === 'string' && body.eventSourceUrl.length < 2048
    && typeof body.customData === 'object' && body.customData !== null
  )
}

function readCookie(cookieHeader: string | null, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return undefined
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const accessToken = (env as unknown as { META_CAPI_ACCESS_TOKEN?: string }).META_CAPI_ACCESS_TOKEN
  const testCode = (env as unknown as { META_CAPI_TEST_CODE?: string }).META_CAPI_TEST_CODE
  const kv = env.SITE_OPS as KVNamespace

  if (!accessToken) {
    Sentry.captureMessage('META_CAPI_ACCESS_TOKEN not set', 'error')
    return NextResponse.json({ ok: true })
  }

  const ip = (
    request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-forwarded-for')
    ?? 'unknown'
  ).split(',')[0].trim()

  if (await isRateLimited(kv, 'meta-capi', ip, RATE_LIMIT, 60)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let raw: IncomingBody
  try {
    raw = (await request.json()) as IncomingBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isValidBody(raw)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const now = Math.floor(Date.now() / 1000)
  const eventTime = (raw.eventTime < now - SEVEN_DAYS_SECONDS || raw.eventTime > now + ONE_MINUTE_SECONDS)
    ? now
    : raw.eventTime

  const cookieHeader = request.headers.get('cookie')
  const fbp = readCookie(cookieHeader, '_fbp')
  const fbc = readCookie(cookieHeader, '_fbc')
  const em = readCookie(cookieHeader, 'jcs_em')
  const userAgent = request.headers.get('user-agent') ?? undefined

  const userData: Record<string, unknown> = {
    client_ip_address: ip !== 'unknown' ? ip : undefined,
    client_user_agent: userAgent,
    fbp,
    fbc,
    em: em ? [em] : undefined,
  }
  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key]
  }

  const payload: Record<string, unknown> = {
    data: [{
      event_name: raw.eventName,
      event_time: eventTime,
      event_id: raw.eventID,
      event_source_url: raw.eventSourceUrl,
      action_source: 'website',
      user_data: userData,
      custom_data: raw.customData,
    }],
  }
  if (testCode) {
    payload.test_event_code = testCode
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      Sentry.captureMessage('Meta CAPI rejected event', {
        level: 'warning',
        extra: { status: res.status, response: text.slice(0, 500), eventName: raw.eventName, eventID: raw.eventID },
      })
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { source: 'meta-capi' },
      extra: { eventName: raw.eventName, eventID: raw.eventID },
    })
  }

  return NextResponse.json({ ok: true })
}
