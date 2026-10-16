import { NextResponse } from 'next/server'
import { captureServerError, captureServerMessage } from '@/lib/server-error-capture'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import {
  EXTERNAL_ID_COOKIE,
  EXTERNAL_ID_MAX_AGE,
  EXTERNAL_ID_PATTERN,
  FBC_COOKIE,
  FBP_COOKIE,
  FBP_FBC_MAX_AGE,
  FB_ID_PATTERN,
  fbclidFromUrl,
  hashExternalId,
  readCookie,
} from '@/lib/meta-capi'

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
  consent?: unknown
}

function isValidBody(body: IncomingBody): body is {
  eventName: string
  eventID: string
  eventTime: number
  eventSourceUrl: string
  customData: Record<string, unknown>
  consent: true
} {
  return (
    // Server-side consent gate: never forward identifiers to Meta CAPI without an
    // explicit marketing-consent flag. The client also gates, but a client bug, a
    // race before Cookiebot loads, or a direct POST must not leak PII.
    body.consent === true
    && typeof body.eventName === 'string' && body.eventName.length > 0 && body.eventName.length < 100
    && typeof body.eventID === 'string' && body.eventID.length > 0 && body.eventID.length < 100
    && typeof body.eventTime === 'number' && Number.isFinite(body.eventTime)
    && typeof body.eventSourceUrl === 'string' && body.eventSourceUrl.length < 2048
    && typeof body.customData === 'object' && body.customData !== null
  )
}

function validCookie(cookieHeader: string | null, name: string, pattern: RegExp): string | undefined {
  const value = readCookie(cookieHeader, name)
  return value && pattern.test(value) ? value : undefined
}

function refreshCookie(name: string, value: string, maxAge: number): string {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax; Secure`
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
    await captureServerMessage('META_CAPI_ACCESS_TOKEN not set', { level: 'error' })
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
  const fbp = validCookie(cookieHeader, FBP_COOKIE, FB_ID_PATTERN)
  const fbcCookie = validCookie(cookieHeader, FBC_COOKIE, FB_ID_PATTERN)
  // No _fbc cookie but the page URL carries a fbclid: Meta's documented
  // server-side form, subdomain index 1 and the time first observed.
  const fbclid = fbcCookie ? undefined : fbclidFromUrl(raw.eventSourceUrl)
  const fbc = fbcCookie ?? (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined)
  const externalId = validCookie(cookieHeader, EXTERNAL_ID_COOKIE, EXTERNAL_ID_PATTERN)
  const em = readCookie(cookieHeader, 'jcs_em')
  const userAgent = request.headers.get('user-agent') ?? undefined

  const userData: Record<string, unknown> = {
    client_ip_address: ip !== 'unknown' ? ip : undefined,
    client_user_agent: userAgent,
    fbp,
    fbc,
    external_id: externalId ? [await hashExternalId(externalId)] : undefined,
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
      await captureServerMessage('Meta CAPI rejected event', {
        level: 'warning',
        extra: { status: res.status, response: text.slice(0, 500), eventName: raw.eventName, eventID: raw.eventID },
      })
    }
  } catch (err) {
    await captureServerError(err, {
      tags: { source: 'meta-capi' },
      extra: { eventName: raw.eventName, eventID: raw.eventID },
    })
  }

  // Re-issue the consented identity cookies from the server so they keep their
  // full lifetime; browsers cap script-written cookies (Safari: seven days).
  const response = NextResponse.json({ ok: true })
  if (fbp) response.headers.append('Set-Cookie', refreshCookie(FBP_COOKIE, fbp, FBP_FBC_MAX_AGE))
  if (fbcCookie) response.headers.append('Set-Cookie', refreshCookie(FBC_COOKIE, fbcCookie, FBP_FBC_MAX_AGE))
  if (externalId) response.headers.append('Set-Cookie', refreshCookie(EXTERNAL_ID_COOKIE, externalId, EXTERNAL_ID_MAX_AGE))
  return response
}
