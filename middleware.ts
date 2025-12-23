import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Note: Security headers are configured in next.config.ts for Cloudflare Pages compatibility
  // Middleware headers don't work reliably on Cloudflare Pages Edge Runtime
  // This middleware is reserved for future dynamic logic only

  const response = NextResponse.next()
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
