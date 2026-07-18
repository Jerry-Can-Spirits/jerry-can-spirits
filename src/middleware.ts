import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AGE_COOKIE, isAgeExcludedPath, isAgeVerified } from '@/lib/age-gate'

// Known SEO and search engine bot user agents
// These bots need access to content for indexing/analysis while humans still see age gate
const BOT_USER_AGENTS = [
  // Search engines
  'googlebot',
  'bingbot',
  'msnbot',          // Microsoft/Bing legacy
  'bingpreview',     // Bing link preview
  'adidxbot',        // Bing ads
  'microsoftpreview', // Microsoft previews
  'slurp',           // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot',         // Facebook
  'ia_archiver',     // Alexa

  // SEO tools
  'semrushbot',
  'ahrefsbot',
  'mj12bot',         // Majestic
  'dotbot',          // Moz
  'rogerbot',        // Moz
  'screaming frog',
  'sitebulb',
  'deepcrawl',
  'oncrawl',
  'seobilitybot',
  'serpstatbot',
  'dataforseo',
  'surfer bot',      // SurferSEO Site Audit (exact User-Agent)
  'surfer',          // SurferSEO fallback

  // Social media
  'twitterbot',
  'linkedinbot',
  'pinterestbot',
  'whatsapp',
  'telegrambot',

  // Validation tools
  'w3c_validator',
  'lighthouse',
  'pagespeed',
  'gtmetrix',

  // Google services
  'mediapartners-google',
  'adsbot-google',
  'apis-google',
  'google-inspectiontool',
]

function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_USER_AGENTS.some(bot => ua.includes(bot))
}

// A top-level navigation (as opposed to an RSC/data fetch or a prefetch): the
// browser marks it as a document, or there are no fetch-metadata headers at all
// (a direct hit / curl). Only these are gated, so client-side data fetches are
// never redirected.
function isDocumentNavigation(request: NextRequest): boolean {
  const dest = request.headers.get('sec-fetch-dest')
  if (dest) return dest === 'document'
  return !request.headers.has('rsc') && !request.headers.has('next-router-prefetch')
}

export function middleware(request: NextRequest) {
  // The CSP and security headers are set in next.config.ts, not here.
  const userAgent = request.headers.get('user-agent')
  const bot = isBot(userAgent)

  // Server-enforced age verification. A top-level GET to a gated path without a
  // verified cookie is redirected to the gate before the page renders — the
  // real enforcement the client overlay never provided. Verified users pass;
  // search crawlers are allowed to browse for indexing (the checkout handoff is
  // separately hard-gated in /api/checkout, cookie-only, so a spoofed crawler
  // UA still cannot reach Shopify checkout).
  if (
    request.method === 'GET' &&
    isDocumentNavigation(request) &&
    !bot &&
    !isAgeExcludedPath(request.nextUrl.pathname) &&
    !isAgeVerified(request.cookies.get(AGE_COOKIE)?.value)
  ) {
    const gate = new URL('/age-check/', request.url)
    gate.searchParams.set('return', request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(gate)
  }

  const response = NextResponse.next()

  // Set a header to indicate if request is from a known bot
  // ClientWrapper can read this to bypass age gate for SEO crawlers
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
