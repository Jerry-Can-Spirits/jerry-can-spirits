import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the visitor's country code from Cloudflare geo headers.
 * Deliberately cookie-free: clients cache the result in sessionStorage
 * (src/lib/geo.ts) so no pre-consent cookie is ever set.
 */
export async function GET(request: Request) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-open-next-country') ||
    request.headers.get('cf-ipcountry') ||
    null

  const response = NextResponse.json({ country })

  // Tiny response, cache per-user for 24h
  response.headers.set('Cache-Control', 'private, max-age=86400')

  return response
}
