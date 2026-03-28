import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://js.sentry-cdn.com https://*.sentry.io https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://analytics.tiktok.com https://tracker.metricool.com blob:",
  "script-src-elem 'self' 'unsafe-inline' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://fundingchoicesmessages.google.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://static.cloudflareinsights.com https://*.klaviyo.com https://widget.trustpilot.com https://*.trustpilot.com https://connect.facebook.net https://www.instagram.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.googletagservices.com https://analytics.tiktok.com https://tracker.metricool.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
  "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com https://*.trustpilot.com https://*.cookiebot.com",
  "font-src 'self' https://fonts.gstatic.com https://*.trustpilot.com data:",
  "img-src 'self' data: https: https://imagedelivery.net blob:",
  "media-src 'self' https:",
  "connect-src 'self' https://*.cookiebot.com https://fundingchoicesmessages.google.com https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://www.google.com https://www.google.co.uk https://*.doubleclick.net https://*.klaviyo.com https://*.kmail-lists.com https://*.shopify.com https://*.myshopify.com https://shop.jerrycanspirits.co.uk https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io https://*.sentry.io https://cloudflareinsights.com https://*.trustpilot.com https://www.facebook.com https://*.facebook.com https://*.facebook.net https://pagead2.googlesyndication.com https://*.googlesyndication.com https://analytics.tiktok.com https://*.tiktok.com https://tracker.metricool.com https://api.postcodes.io wss: ws:",
  "frame-src 'self' https://consentcdn.cookiebot.com https://*.cookiebot.com https://www.youtube.com https://www.vimeo.com https://cdn.sanity.io https://*.sanity.io https://*.trustpilot.com https://www.instagram.com https://*.instagram.com https://*.cdninstagram.com https://googleads.g.doubleclick.net https://*.googlesyndication.com https://www.googletagmanager.com about: data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://manage.kmail-lists.com",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ')

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

  // Geo-detection via Cloudflare Workers
  // OpenNext maps cf.country → x-open-next-country → x-vercel-ip-country
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

  // CSP applied to all Worker-handled routes. Skips /studio which has its own
  // permissive override in next.config.ts — combining both would apply the
  // stricter policy and break Sanity Studio.
  if (!request.nextUrl.pathname.startsWith('/studio')) {
    response.headers.set('Content-Security-Policy', CONTENT_SECURITY_POLICY)
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
