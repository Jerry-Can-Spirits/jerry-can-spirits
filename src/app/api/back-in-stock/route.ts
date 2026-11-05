import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isRateLimited, isAllowedOrigin } from '@/lib/kv'
import { emailDomainAcceptsMail } from '@/lib/email-validation'

export const dynamic = 'force-dynamic'

// Registers a Klaviyo back-in-stock subscription against the Shopify variant.
// Klaviyo watches the variant's inventory and fires the "Back in Stock" flow
// when it returns. The subscription is a one-off service request, not a
// marketing opt-in, so no consent flag and no list.
export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { env } = await getCloudflareContext()
  const key = env.KLAVIYO_PRIVATE_KEY as string | undefined
  const kv = env.SITE_OPS as KVNamespace

  let body: { email?: string; variantId?: string; website?: string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.website && body.website.trim() !== '') {
    return NextResponse.json({ success: true })
  }

  const ip = (request.headers.get('CF-Connecting-IP') ?? 'unknown').split(',')[0].trim()
  if (await isRateLimited(kv, 'back-in-stock', ip, 5, 60)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  const variantId = body.variantId?.split('/').pop() ?? ''
  if (!/^[A-Za-z0-9.@_+-]+$/.test(email) || email.indexOf('@') < 1 || email.length > 254) {
    return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
  }
  if (!/^\d+$/.test(variantId)) {
    return NextResponse.json({ error: 'Unknown product' }, { status: 400 })
  }
  if (!(await emailDomainAcceptsMail(email))) {
    return NextResponse.json({ error: 'That email domain does not appear to accept mail. Please check and try again.' }, { status: 400 })
  }
  if (!key) {
    console.error('[back-in-stock] KLAVIYO_PRIVATE_KEY not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const res = await fetch('https://a.klaviyo.com/api/back-in-stock-subscriptions/', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      revision: '2026-10-15',
    },
    body: JSON.stringify({
      data: {
        type: 'back-in-stock-subscription',
        attributes: {
          channels: ['EMAIL'],
          profile: { data: { type: 'profile', attributes: { email } } },
        },
        relationships: {
          variant: { data: { type: 'catalog-variant', id: `$shopify:::$default:::${variantId}` } },
        },
      },
    }),
  })

  if (!res.ok) {
    console.error('[back-in-stock] Klaviyo rejected subscription:', res.status, await res.text())
    return NextResponse.json({ error: '' }, { status: 502 })
  }
  return NextResponse.json({ success: true })
}
