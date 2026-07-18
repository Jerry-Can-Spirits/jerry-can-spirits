const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const
const STORAGE_KEY = 'utm_params'

export function captureUtmParams(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const captured: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const val = params.get(key)
    if (val) captured[key] = val
  }
  if (Object.keys(captured).length === 0) return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured))
  } catch {
    // sessionStorage may be blocked
  }
}

export function appendUtmToCheckout(checkoutUrl: string): string {
  if (typeof window === 'undefined') return checkoutUrl
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return checkoutUrl
    const utm = JSON.parse(stored) as Record<string, string>
    const url = new URL(checkoutUrl)
    for (const [key, val] of Object.entries(utm)) {
      url.searchParams.set(key, val)
    }
    return url.toString()
  } catch {
    return checkoutUrl
  }
}

// Route a finished Shopify checkout URL through the first-party age gate at
// /api/checkout, which enforces age verification server-side before handing off
// to Shopify (a client-side navigation straight to Shopify cannot be gated).
export function gatedCheckout(checkoutUrl: string): string {
  // Trailing slash: next.config has trailingSlash enabled, so the un-slashed
  // form would 308-redirect before the route runs.
  return '/api/checkout/?to=' + encodeURIComponent(checkoutUrl)
}
