/**
 * Resolve the visitor's country code from /api/geo/ (Cloudflare geo headers).
 * Nothing is stored on the device, no cookie and no web storage, so it is
 * safe before consent. The cost is one small request per mount instead of a
 * session-storage hit.
 */
export async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch('/api/geo/')
    const { country } = (await res.json()) as { country: string | null }
    return country
  } catch {
    return null
  }
}
