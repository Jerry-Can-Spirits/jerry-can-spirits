import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountByPin } from '@/lib/d1'
import { verifyTradeCookie, TRADE_COOKIE_NAME } from '@/lib/trade-cookie'
import { createCart, addToCart, applyDiscount } from '@/lib/shopify'

export async function POST(request: Request) {
  let body: { quantity?: unknown }
  try {
    body = await request.json() as { quantity?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const quantity = typeof body.quantity === 'number'
    ? Math.floor(body.quantity)
    : parseInt(String(body.quantity), 10)

  if (!quantity || quantity < 1 || quantity > 100) {
    return NextResponse.json({ error: 'Invalid quantity.' }, { status: 400 })
  }

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
  const variantId = env.TRADE_CASE_VARIANT_ID as string | undefined

  if (!secret || !variantId) {
    console.error('TRADE_SESSION_SECRET or TRADE_CASE_VARIANT_ID not configured')
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
    const cartWithItem = await addToCart(cart.id, variantId, quantity)
    const cartWithDiscount = await applyDiscount(cartWithItem.id, [account.discount_code])

    return NextResponse.json({ checkoutUrl: cartWithDiscount.checkoutUrl })
  } catch (err) {
    console.error('Trade checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout. Please try again.' }, { status: 500 })
  }
}
