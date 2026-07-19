import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildPurchaseEvent, sendGa4Purchase } from '@/lib/ga4-measurement-protocol'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'

// A representative orders/create payload: a £45 bottle + a £19.99 accessory
// (clearing the £65 referral/free-shipping floor), with the storefront's
// stitching attributes present and analytics consent granted.
function makeOrder(overrides: Partial<ShopifyOrder> = {}): ShopifyOrder {
  return {
    id: 5555555555,
    order_number: 1042,
    created_at: '2026-07-19T10:00:00Z',
    email: 'buyer@example.com',
    fulfillment_status: null,
    subtotal_price: '64.99',
    currency: 'GBP',
    name: '#1042',
    line_items: [
      { title: 'Expedition Spiced Rum', name: 'Expedition Spiced Rum - 70cl', quantity: 1, product_id: 111, variant_id: 900111, price: '45.00' },
      { title: 'Hip Flask', name: 'Hip Flask - Steel', quantity: 1, product_id: 222, variant_id: 900222, price: '19.99' },
    ],
    note_attributes: [
      { name: '_ga_client_id', value: '1234567890.1699999999' },
      { name: '_ga_session_id', value: '1699999999' },
      { name: '_gclid', value: 'TeSt-GcLiD' },
      { name: '_analytics_consent', value: 'granted' },
    ],
    ...overrides,
  }
}

describe('buildPurchaseEvent', () => {
  it('builds a purchase event with the captured client_id and session_id', () => {
    const built = buildPurchaseEvent(makeOrder())
    expect('skip' in built).toBe(false)
    if ('skip' in built) return
    expect(built.clientId).toBe('1234567890.1699999999')
    expect(built.body.client_id).toBe('1234567890.1699999999')
    const event = (built.body.events as { name: string; params: Record<string, unknown> }[])[0]
    expect(event.name).toBe('purchase')
    expect(event.params.session_id).toBe('1699999999')
    expect(event.params.engagement_time_msec).toBe(1)
  })

  it('uses the Shopify order number as transaction_id (consistent for GA4 dedup)', () => {
    const built = buildPurchaseEvent(makeOrder())
    if ('skip' in built) throw new Error('unexpected skip')
    const params = (built.body.events as { params: Record<string, unknown> }[])[0].params
    expect(params.transaction_id).toBe('1042')
  })

  it('sets value to the subtotal (ex shipping) and currency GBP', () => {
    const built = buildPurchaseEvent(makeOrder())
    if ('skip' in built) throw new Error('unexpected skip')
    const params = (built.body.events as { params: Record<string, unknown> }[])[0].params
    expect(params.value).toBe(64.99)
    expect(params.currency).toBe('GBP')
  })

  it('keys items on the VARIANT id, with name, price and quantity', () => {
    const built = buildPurchaseEvent(makeOrder())
    if ('skip' in built) throw new Error('unexpected skip')
    const params = (built.body.events as { params: Record<string, unknown> }[])[0].params
    expect(params.items).toEqual([
      { item_id: '900111', item_name: 'Expedition Spiced Rum - 70cl', price: 45.0, quantity: 1 },
      { item_id: '900222', item_name: 'Hip Flask - Steel', price: 19.99, quantity: 1 },
    ])
  })

  it('skips (no-client-id) when the storefront captured no client_id', () => {
    const order = makeOrder({
      note_attributes: [{ name: '_analytics_consent', value: 'granted' }],
    })
    expect(buildPurchaseEvent(order)).toEqual({ skip: 'no-client-id' })
  })

  it('skips (consent-declined) when analytics consent was not granted', () => {
    const order = makeOrder({
      note_attributes: [
        { name: '_ga_client_id', value: '1234567890.1699999999' },
        { name: '_analytics_consent', value: 'denied' },
      ],
    })
    expect(buildPurchaseEvent(order)).toEqual({ skip: 'consent-declined' })
  })

  it('skips (consent-declined) when the consent attribute is missing entirely', () => {
    const order = makeOrder({
      note_attributes: [{ name: '_ga_client_id', value: '1234567890.1699999999' }],
    })
    expect(buildPurchaseEvent(order)).toEqual({ skip: 'consent-declined' })
  })
})

describe('sendGa4Purchase', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('does not call the network when GA4 env is not configured', async () => {
    const res = await sendGa4Purchase(makeOrder(), undefined, undefined)
    expect(res).toEqual({ sent: false, reason: 'not-configured' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does not call the network when the order has no client_id (never fakes one)', async () => {
    const order = makeOrder({ note_attributes: [{ name: '_analytics_consent', value: 'granted' }] })
    const res = await sendGa4Purchase(order, 'G-6VJL06YBW2', 'secret')
    expect(res).toEqual({ sent: false, reason: 'no-client-id' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('does not call the network when consent was declined', async () => {
    const order = makeOrder({
      note_attributes: [
        { name: '_ga_client_id', value: '1234567890.1699999999' },
        { name: '_analytics_consent', value: 'denied' },
      ],
    })
    const res = await sendGa4Purchase(order, 'G-6VJL06YBW2', 'secret')
    expect(res).toEqual({ sent: false, reason: 'consent-declined' })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('POSTs to the Measurement Protocol with the id/secret in the query and the event as the body', async () => {
    const res = await sendGa4Purchase(makeOrder(), 'G-6VJL06YBW2', 'sekret')
    expect(res).toEqual({ sent: true })
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe(
      'https://www.google-analytics.com/mp/collect?measurement_id=G-6VJL06YBW2&api_secret=sekret',
    )
    expect(init.method).toBe('POST')
    const body = JSON.parse(init.body as string)
    expect(body.client_id).toBe('1234567890.1699999999')
    expect(body.events[0].params.transaction_id).toBe('1042')
  })

  it('never throws and reports send-failed when the network errors', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('network down'))
    const res = await sendGa4Purchase(makeOrder(), 'G-6VJL06YBW2', 'secret')
    expect(res).toEqual({ sent: false, reason: 'send-failed' })
  })
})
