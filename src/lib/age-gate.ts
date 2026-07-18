// Server-enforced age verification — shared rules so middleware, /api/checkout
// and /age-check cannot drift apart. The cookie itself is set client-side by
// AgeGate.tsx (non-HttpOnly, so the browser can set it and the server can read
// it); this module only reads and reasons about it, it does not change how it
// is set.

export const AGE_COOKIE = 'ageVerified'
export const AGE_COOKIE_VALUE = 'true'

// Paths never gated. Getting this list wrong breaks the site, so each entry has
// a reason:
//  - /age-check    the gate route itself — gating it would redirect-loop.
//  - /api/         every API route (Shopify webhook, cart, search, and
//                  /api/checkout, which enforces the gate itself). Data
//                  endpoints, not the gated content.
//  - /_next/       framework data/RSC payloads.
//  - /trade        the trade portal / Pour IQ app — its own PIN auth, B2B, and
//                  a trade buyer does not age-verify as a consumer.
//  - legal pages   a minor may read the privacy policy without verifying.
const EXCLUDED_PREFIXES = [
  '/age-check',
  '/api/',
  '/_next/',
  '/trade/',
  '/terms-of-service',
  '/privacy-policy',
  '/cookie-policy',
]

// Exact paths (no sub-tree): the trade landing itself, and the crawler files
// that search engines must fetch without a gate.
const EXCLUDED_EXACT = ['/trade', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest']

export function isAgeExcludedPath(pathname: string): boolean {
  if (EXCLUDED_EXACT.includes(pathname)) return true
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isAgeVerified(cookieValue: string | undefined): boolean {
  return cookieValue === AGE_COOKIE_VALUE
}

// Return targets must be same-origin absolute paths. Reject external URLs and
// protocol-relative //host to close an open-redirect via the ?return param.
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}
