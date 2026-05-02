/**
 * Server-side email domain validation via DNS-over-HTTPS.
 *
 * Catches the common "fake domain" failure mode where syntax validation
 * passes but the domain doesn't actually exist or accept mail. Real
 * mailbox-existence checks would need a paid API (ZeroBounce etc.); this
 * stops typos and obvious junk.
 *
 * Uses Cloudflare's public DoH endpoint, which is callable from Workers
 * edge runtime with no extra dependencies. Falls back to "accept" on
 * lookup failure so a transient DoH outage doesn't block legitimate users.
 */

interface DohAnswer {
  data: string
  type: number
}

interface DohResponse {
  Status: number
  Answer?: DohAnswer[]
}

const DOH_URL = 'https://cloudflare-dns.com/dns-query'
const DOH_TIMEOUT_MS = 1500

async function dnsQuery(domain: string, type: 'MX' | 'A'): Promise<DohAnswer[] | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DOH_TIMEOUT_MS)
  try {
    const res = await fetch(`${DOH_URL}?name=${encodeURIComponent(domain)}&type=${type}`, {
      headers: { Accept: 'application/dns-json' },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = (await res.json()) as DohResponse
    if (data.Status !== 0) return null
    return data.Answer ?? []
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Returns true if the domain has at least one MX or A record, or if the
 * DoH lookup itself fails (we don't want to lock real users out when DNS
 * is having a moment). Returns false only when DoH responds successfully
 * with no records at all.
 */
export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  const at = email.lastIndexOf('@')
  if (at < 0) return false
  const domain = email.slice(at + 1).toLowerCase()
  if (!domain) return false

  const [mx, a] = await Promise.all([
    dnsQuery(domain, 'MX'),
    dnsQuery(domain, 'A'),
  ])

  // Both lookups failed (network / DoH outage) — accept rather than block.
  if (mx === null && a === null) return true

  const hasMx = mx !== null && mx.length > 0
  const hasA = a !== null && a.length > 0
  return hasMx || hasA
}
