import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { getTradeSessionCookieValue, readTradeSession } from '@/lib/trade-portal/session'
import { createCart, addLinesToCart, applyDiscount } from '@/lib/shopify'
import { getTradeVariantIdSet } from '@/lib/trade-products'

interface CheckoutLine {
  variantId: string
  quantity: number
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  let body: { lines?: unknown }
  try {
    body = await request.json() as { lines?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // Validate lines array
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return NextResponse.json({ error: 'No items selected.' }, { status: 400 })
  }
  if (body.lines.length > 50) {
    return NextResponse.json({ error: 'Too many items in order.' }, { status: 400 })
  }

  const lines: CheckoutLine[] = []
  const seen = new Set<string>()
  for (const item of body.lines) {
    if (
      typeof item !== 'object' || item === null ||
      typeof (item as Record<string, unknown>).variantId !== 'string' ||
      typeof (item as Record<string, unknown>).quantity !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }

    const variantId = ((item as Record<string, unknown>).variantId as string).trim()
    const quantity = Math.floor((item as Record<string, unknown>).quantity as number)

    if (!variantId.startsWith('gid://shopify/ProductVariant/')) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }
    const numericSuffix = variantId.slice('gid://shopify/ProductVariant/'.length)
    if (!/^\d+$/.test(numericSuffix)) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }
    if (seen.has(variantId)) {
      return NextResponse.json({ error: 'Duplicate items in order.' }, { status: 400 })
    }
    seen.add(variantId)
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100.' }, { status: 400 })
    }

    lines.push({ variantId, quantity })
  }

  const sid = await getTradeSessionCookieValue()
  if (!sid) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  const session = await readTradeSession(kv, sid)
  if (!session) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }

  const account = await db
    .prepare(`SELECT id, tier, discount_code FROM trade_accounts WHERE id = ?1 AND active = 1`)
    .bind(session.tradeAccountId)
    .first<{ id: string; tier: string; discount_code: string }>()
  if (!account) {
    return NextResponse.json({ error: 'Account not found' }, { status: 401 })
  }

  // Throttle checkout creation per account — an authenticated session must not
  // be able to spam createCart (each call hits Shopify). Keyed on the account,
  // so it bounds a compromised session even across rotating IPs (finding #6).
  if (await isRateLimited(kv, 'trade-checkout', account.id, 20, 600)) {
    return NextResponse.json({ error: 'Too many orders in a short time. Please wait a moment and try again.' }, { status: 429 })
  }

  // Restrict the cart to the trade catalogue. Without this an authenticated
  // account could build a cart from ANY Shopify variant, not just trade SKUs
  // (finding #6). The trade variant set is the server-side source of truth;
  // fail safe (503) if it cannot be resolved rather than allowing an unchecked
  // cart through.
  let tradeVariantIds: Set<string>
  try {
    tradeVariantIds = await getTradeVariantIdSet()
  } catch {
    return NextResponse.json({ error: 'Unable to validate your order right now. Please try again shortly.' }, { status: 503 })
  }
  if (tradeVariantIds.size === 0) {
    return NextResponse.json({ error: 'Product catalogue unavailable. Please try again shortly.' }, { status: 503 })
  }
  for (const line of lines) {
    if (!tradeVariantIds.has(line.variantId)) {
      return NextResponse.json({ error: 'One or more items are not available on the trade portal.' }, { status: 400 })
    }
  }

  try {
    const cart = await createCart()
    const cartWithItems = await addLinesToCart(cart.id, lines)
    const cartWithDiscount = account.discount_code
      ? await applyDiscount(cartWithItems.id, [account.discount_code])
      : cartWithItems

    return NextResponse.json({ checkoutUrl: cartWithDiscount.checkoutUrl })
  } catch (err) {
    console.error('Trade checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 })
  }
}
