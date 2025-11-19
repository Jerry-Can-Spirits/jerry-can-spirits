import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Determine if this is a Studio route
  const isStudioRoute = pathname.startsWith('/studio')

  // Build Content Security Policy
  let csp: string

  if (isStudioRoute) {
    // Less restrictive CSP for Sanity Studio
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:",
      "style-src 'self' 'unsafe-inline' https: data:",
      "font-src 'self' https: data:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https: data:",
      "connect-src 'self' https: wss: ws:",
      "frame-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https:",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  } else {
    // Stricter CSP for all other routes
    csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.klaviyo.com https://tagmanager.google.com https://static.cloudflareinsights.com blob:",
      "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.klaviyo.com https://tagmanager.google.com https://static.cloudflareinsights.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com",
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.klaviyo.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' http://localhost:* https://www.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://region1.google-analytics.com https://*.klaviyo.com https://cdn.sanity.io https://*.sanity.io https://*.ingest.sentry.io https://cloudflareinsights.com wss: ws:",
      "frame-src 'self' https://www.youtube.com https://www.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://manage.kmail-lists.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  }

  // Set Content Security Policy
  response.headers.set('Content-Security-Policy', csp)

  // Set other security headers for all routes
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  )

  // Add Strict-Transport-Security for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
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
