const STORAGE_KEY = 'detectedCountry'

/** Read the cached country code from sessionStorage, if present and valid. */
export function getCachedCountry(): string | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return value && /^[A-Z]{2}$/.test(value) ? value : null
  } catch {
    return null
  }
}

/**
 * Resolve the visitor's country code, cache-first.
 * Falls back to /api/geo (Cloudflare geo headers) and caches the result
 * in sessionStorage. No cookies are involved.
 */
export async function detectCountry(): Promise<string | null> {
  const cached = getCachedCountry()
  if (cached) return cached

  try {
    const res = await fetch('/api/geo')
    const { country } = (await res.json()) as { country: string | null }
    if (country) {
      try {
        sessionStorage.setItem(STORAGE_KEY, country)
      } catch {
        // storage may be blocked; fetch again next time
      }
    }
    return country
  } catch {
    return null
  }
}
