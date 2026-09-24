import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBot } from '@/lib/age-gate'

// The age gate is an overlay in every page's HTML, decided before first paint
// by the inline script from @/lib/age-gate (see app/layout.tsx). Nothing is
// redirected here any more: the same HTML serves verified and unverified
// visitors alike, so it caches at the edge and unfurls for link previews. The
// checkout handoff stays hard-gated in /api/checkout, cookie-only, so a
// spoofed crawler UA still cannot reach Shopify checkout.

export function middleware(request: NextRequest) {
  // The CSP and security headers are set in next.config.ts, not here.
  const userAgent = request.headers.get('user-agent')
  const bot = isBot(userAgent)

  const response = NextResponse.next()

  // Set a header to indicate if request is from a known bot. The inline age
  // gate script reads the cookie and skips the gate for crawlers.
  if (bot) {
    response.headers.set('x-is-bot', 'true')
    // Also set a cookie that client-side can read
    response.cookies.set('isBot', 'true', {
      httpOnly: false,  // Must be readable by client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,  // 1 hour
    })
  }

  // Geo-detection via Cloudflare Workers
  // OpenNext maps cf.country -> x-open-next-country -> x-vercel-ip-country
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('x-open-next-country') ||
    request.headers.get('cf-ipcountry')

  if (country) {
    // Cookie for client components (age gate auto-select)
    if (!request.cookies.get('detectedCountry')) {
      response.cookies.set('detectedCountry', country, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 24 hours
      })
    }
    // Header for server components and shipping banner
    response.headers.set('x-visitor-country', country)
  }

  return response
}

// Apply middleware to all routes except static files and API routes that don't need headers
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
