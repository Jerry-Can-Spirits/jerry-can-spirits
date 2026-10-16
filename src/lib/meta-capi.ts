declare global {
  interface Window {
    fbq?: (
      track: string,
      event: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string }
    ) => void
    Cookiebot?: {
      consent: {
        marketing: boolean
        statistics: boolean
        preferences: boolean
        necessary: boolean
      }
      renew: () => void
    }
  }
}

export interface MetaEventBody {
  eventName: string
  eventID: string
  eventTime: number
  eventSourceUrl: string
  customData: Record<string, unknown>
  // Explicit marketing-consent flag; the /api/meta/events route re-checks this
  // before forwarding any identifiers to Meta CAPI, so client-side gating is not
  // the only guard.
  consent: true
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Meta's em rule: trim, lowercase, then SHA-256.
export async function hashEmail(email: string): Promise<string> {
  return sha256Hex(email.trim().toLowerCase())
}

// The same hashed value goes to the Pixel (init external_id) and to CAPI, so
// both legs of a deduplicated event carry an identical external_id.
export async function hashExternalId(id: string): Promise<string> {
  return sha256Hex(id.trim().toLowerCase())
}

// First-party marketing cookies. None is written until marketing consent is
// granted; the clear-identity route and CookiebotOnDecline remove them.
export const FBP_COOKIE = '_fbp'
export const FBC_COOKIE = '_fbc'
export const EXTERNAL_ID_COOKIE = 'jcs_eid'
export const FBP_FBC_MAX_AGE = 60 * 60 * 24 * 90
export const EXTERNAL_ID_MAX_AGE = 60 * 60 * 24 * 365

// fb.<subdomainIndex>.<creationTimeMs>.<random or fbclid>, allowing the
// suffix Meta's parameter builder appends.
export const FB_ID_PATTERN = /^fb\.\d\.\d{10,13}\.[A-Za-z0-9_.-]{1,500}$/
export const FBCLID_PATTERN = /^[A-Za-z0-9_-]{1,500}$/
export const EXTERNAL_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export function readCookie(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined
  for (const part of cookieHeader.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return v.join('=')
  }
  return undefined
}

// Meta counts the labels of the domain the cookie is set on (example.com is
// 1), so a host-only cookie on jerrycanspirits.co.uk is 2, as the Pixel writes.
export function subdomainIndex(hostname: string): number {
  return Math.min(9, Math.max(0, hostname.split('.').length - 1))
}

export function buildFbp(hostname: string, nowMs: number, random: number): string {
  return `fb.${subdomainIndex(hostname)}.${nowMs}.${random}`
}

export function buildFbc(hostname: string, nowMs: number, fbclid: string): string {
  return `fb.${subdomainIndex(hostname)}.${nowMs}.${fbclid}`
}

export function fbclidFromUrl(url: string): string | undefined {
  try {
    const fbclid = new URL(url).searchParams.get('fbclid')
    return fbclid && FBCLID_PATTERN.test(fbclid) ? fbclid : undefined
  } catch {
    return undefined
  }
}

export interface CookieJar {
  cookie: string
}

function writeCookie(jar: CookieJar, name: string, value: string, maxAge: number, secure: boolean): void {
  jar.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure ? '; Secure' : ''}`
}

// Creates _fbp, _fbc (from a fbclid in the URL) and jcs_eid when missing, so
// the first server event of a visit carries them instead of racing the Pixel
// script, which reuses the _fbp it finds. Callers must already hold marketing
// consent. Returns the raw external id.
export function ensureMetaCookies(
  jar: CookieJar,
  location: { hostname: string; href: string; protocol: string },
  nowMs: number = Date.now(),
): string {
  const secure = location.protocol === 'https:'

  if (!FB_ID_PATTERN.test(readCookie(jar.cookie, FBP_COOKIE) ?? '')) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0]
    writeCookie(jar, FBP_COOKIE, buildFbp(location.hostname, nowMs, random), FBP_FBC_MAX_AGE, secure)
  }

  const fbclid = fbclidFromUrl(location.href)
  const existingFbc = readCookie(jar.cookie, FBC_COOKIE)
  if (fbclid && (!existingFbc || existingFbc.split('.').slice(3).join('.') !== fbclid)) {
    writeCookie(jar, FBC_COOKIE, buildFbc(location.hostname, nowMs, fbclid), FBP_FBC_MAX_AGE, secure)
  }

  let externalId = readCookie(jar.cookie, EXTERNAL_ID_COOKIE)
  if (!externalId || !EXTERNAL_ID_PATTERN.test(externalId)) {
    externalId = crypto.randomUUID()
    writeCookie(jar, EXTERNAL_ID_COOKIE, externalId, EXTERNAL_ID_MAX_AGE, secure)
  }
  return externalId
}

export function clearMetaCookies(jar: CookieJar): void {
  for (const name of [FBP_COOKIE, FBC_COOKIE, EXTERNAL_ID_COOKIE]) {
    jar.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`
  }
}

export function trackEventDual(
  eventName: string,
  customData: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return
  if (!window.Cookiebot?.consent?.marketing) return

  ensureMetaCookies(document, window.location)

  const eventID = crypto.randomUUID()
  const eventTime = Math.floor(Date.now() / 1000)
  const eventSourceUrl = window.location.href

  if (window.fbq) {
    window.fbq('track', eventName, customData, { eventID })
  }

  const body: MetaEventBody = {
    eventName,
    eventID,
    eventTime,
    eventSourceUrl,
    customData,
    // Reached only after the window.Cookiebot.consent.marketing gate above.
    consent: true,
  }

  fetch('/api/meta/events/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {
    // Pixel leg already fired. Server-side failure is invisible to the user.
  })
}

export {}
