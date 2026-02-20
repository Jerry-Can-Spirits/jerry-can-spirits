import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

export function middleware(request: NextRequest) {
  // Note: Security headers are configured in next.config.ts for Cloudflare Pages compatibility
  // Middleware headers don't work reliably on Cloudflare Pages Edge Runtime

  const response = NextResponse.next()
  const userAgent = request.headers.get('user-agent')

  // Set a header to indicate if request is from a known bot
  // ClientWrapper can read this to bypass age gate for SEO crawlers
  if (isBot(userAgent)) {
    response.headers.set('x-is-bot', 'true')
    // Also set a cookie that client-side can read
    response.cookies.set('isBot', 'true', {
      httpOnly: false,  // Must be readable by client JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60,  // 1 hour
    })
  }

  // Geo-detection via Cloudflare Workers cf object
  // Sets country code for age gate auto-selection and shipping banner
  const cf = (request as NextRequest & { cf?: { country?: string } }).cf
  const country = cf?.country || request.headers.get('cf-ipcountry')

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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
