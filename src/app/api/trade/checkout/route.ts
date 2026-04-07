import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import { verifyTradeCookie, TRADE_COOKIE_NAME } from '@/lib/trade-cookie'
import { createCart, addLinesToCart, applyDiscount } from '@/lib/shopify'

interface CheckoutLine {
  variantId: string
  quantity: number
}

export async function POST(request: Request) {
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

  const lines: CheckoutLine[] = []
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

    if (!variantId || variantId.length > 100) {
      return NextResponse.json({ error: 'Invalid order data.' }, { status: 400 })
    }
    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ error: 'Quantity must be between 1 and 100.' }, { status: 400 })
    }

    lines.push({ variantId, quantity })
  }

  // Read + verify the trade session cookie
  const cookieHeader = request.headers.get('cookie') ?? ''
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${TRADE_COOKIE_NAME}=([^;]+)`)
  )
  const cookieValue = cookieMatch?.[1]

  if (!cookieValue) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const secret = env.TRADE_SESSION_SECRET as string | undefined

  if (!secret) {
    console.error('TRADE_SESSION_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  const payload = await verifyTradeCookie(cookieValue, secret)
  if (!payload) {
    return NextResponse.json({ error: 'Session expired. Please re-enter your PIN.' }, { status: 401 })
  }

  const db = env.DB as D1Database
  const account = await getTradeAccountByPin(db, payload.pin)
  if (!account) {
    return NextResponse.json({ error: 'Account not found. Please contact us.' }, { status: 401 })
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
