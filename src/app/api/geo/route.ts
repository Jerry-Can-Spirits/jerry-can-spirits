import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Returns the visitor's country code from Cloudflare geo headers.
 * Also sets a `detectedCountry` cookie so subsequent page loads
 * don't need to call this again.
 */
export async function GET(request: Request) {
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-open-next-country') ||
    request.headers.get('cf-ipcountry') ||
    null

  const response = NextResponse.json({ country })

  if (country) {
    response.cookies.set('detectedCountry', country, {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    })
  }

  // Tiny response, cache per-user for 24h
  response.headers.set('Cache-Control', 'private, max-age=86400')

  return response
}
