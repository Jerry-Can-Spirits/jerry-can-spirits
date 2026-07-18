// First-party age gate for the Shopify checkout handoff. A client-side
// window.location to Shopify's domain cannot be enforced server-side, so the
// three "Buy it now" / "Proceed to checkout" paths route here first: this
// route requires a verified session (no crawler bypass — a spoofed bot UA has
// no cookie), then redirects to Shopify. It also validates the destination is
// our own Shopify store, closing an open-redirect.
//
// Fail-open discipline for a revenue path: a VERIFIED user with a valid
// checkout URL is always sent straight to Shopify. An unverified user is a
// normal flow — sent to the gate and returned to checkout with their cart
// intact (Shopify's cart is server-side, keyed by the token in the URL). Only
// a genuinely invalid destination (attack or bug — never the real Shopify URL)
// errors, and that is logged.

import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AGE_COOKIE, isAgeVerified } from '@/lib/age-gate'

const STORE_HOST = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN

export function GET(request: NextRequest) {
  const verified = isAgeVerified(request.cookies.get(AGE_COOKIE)?.value)

  // Unverified: normal flow. Send to the gate, come back here after verifying
  // so the handoff completes with the cart intact. Never a dead end.
  if (!verified) {
    const gate = new URL('/age-check/', request.url)
    gate.searchParams.set('return', '/api/checkout/' + request.nextUrl.search)
    return NextResponse.redirect(gate)
  }

  const to = request.nextUrl.searchParams.get('to')
  if (!to) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  let target: URL
  try {
    target = new URL(to)
  } catch {
    Sentry.captureException(new Error('Age-gated checkout: unparseable destination'), {
      tags: { source: 'age-checkout' },
      extra: { to: to.slice(0, 200) },
    })
    return new NextResponse('Invalid checkout destination.', { status: 400 })
  }

  // Only ever redirect to our own Shopify store over HTTPS. This never trips
  // for the real checkout URL; a mismatch is an attack or a bug.
  if (target.protocol !== 'https:' || !STORE_HOST || target.host !== STORE_HOST) {
    Sentry.captureException(new Error('Age-gated checkout: rejected non-Shopify destination'), {
      tags: { source: 'age-checkout' },
      extra: { host: target.host },
    })
    return new NextResponse('Invalid checkout destination.', { status: 400 })
  }

  return NextResponse.redirect(target.toString(), 302)
}
