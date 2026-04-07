// HMAC-signed cookie utilities for the trade order portal.
// The cookie stores { pin, iat } signed with TRADE_SESSION_SECRET.
// The discount code is never stored client-side.

export const TRADE_COOKIE_NAME = 'jcs_trade'
export const TRADE_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days in seconds

function toBase64url(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function fromBase64url(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(
    str.length + ((4 - (str.length % 4)) % 4),
    '='
  )
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0))
}

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

export interface TradeCookiePayload {
  pin: string
  iat: number
}

/** Create a signed cookie value from a payload. */
export async function signTradeCookie(
  payload: TradeCookiePayload,
  secret: string
): Promise<string> {
  const data = toBase64url(new TextEncoder().encode(JSON.stringify(payload)))
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${toBase64url(sig)}`
}

/** Verify and decode a cookie value. Returns null if invalid or expired. */
export async function verifyTradeCookie(
  cookieValue: string,
  secret: string
): Promise<TradeCookiePayload | null> {
  const parts = cookieValue.split('.')
  if (parts.length !== 2) return null

  const [data, sig] = parts

  try {
    const key = await getKey(secret)
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64url(sig),
      new TextEncoder().encode(data)
    )
    if (!valid) return null

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64url(data))
    ) as TradeCookiePayload

    // Reject if older than 30 days
    const age = (Date.now() - payload.iat) / 1000
    if (age > TRADE_COOKIE_MAX_AGE) return null

    return payload
  } catch {
    return null
  }
}
