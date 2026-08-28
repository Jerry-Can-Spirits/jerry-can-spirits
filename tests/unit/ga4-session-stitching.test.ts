/**
 * GA4 session-id extraction across both generations of the _ga_<container>
 * cookie.
 *
 * The bug this pins: Google moved the cookie from dot-delimited GS1 to
 * $-delimited GS2, and the storefront's parts[2] shortcut silently started
 * stamping the whole GS2 payload onto carts. GA4 could not parse it, so every
 * stitched purchase opened a fresh sourceless session — 65% of tracked revenue
 * in "Unassigned". Nothing errored anywhere, which is why it needs a test: the
 * only symptom was a slowly wrong report.
 */
import { describe, it, expect } from 'vitest'
import { normaliseGaSessionId } from '@/lib/analytics-stitch-keys'
import { buildPurchaseEvent } from '@/lib/ga4-measurement-protocol'
import type { ShopifyOrder } from '@/lib/shopify-webhooks'

// Verbatim (bar the trailing hash) from a live order's note attributes — the
// exact malformed value the old code produced from a GS2 cookie.
const GS2_BLOB = 's1787916017$o251$g1$t1787916018$j59$l0$h0$dK9aIuWcvc1SnBl79gZQszUDMcKgV'

describe('normaliseGaSessionId', () => {
  it('passes through a GS1-style bare id', () => {
    expect(normaliseGaSessionId('1712345678')).toBe('1712345678')
  })

  it('extracts the id from a GS2 payload', () => {
    expect(normaliseGaSessionId(GS2_BLOB)).toBe('1787916017')
  })

  it('returns undefined rather than junk when there is no id', () => {
    // A session_id GA4 cannot parse is the bug all over again; absent is the
    // correct degraded state — the purchase still sends, just sessionless.
    expect(normaliseGaSessionId(undefined)).toBeUndefined()
    expect(normaliseGaSessionId('')).toBeUndefined()
    expect(normaliseGaSessionId('o251$g1')).toBeUndefined()
    expect(normaliseGaSessionId('deleted')).toBeUndefined()
  })
})

function order(sessionAttr?: string): ShopifyOrder {
  return {
    order_number: 1300,
    subtotal_price: '36.00',
    currency: 'GBP',
    line_items: [{ variant_id: 42, name: 'Expedition Spiced Rum', title: 'Rum', price: '36.00', quantity: 1 }],
    note_attributes: [
      { name: '_ga_client_id', value: '849197517.1774795738' },
      { name: '_analytics_consent', value: 'granted' },
      ...(sessionAttr !== undefined ? [{ name: '_ga_session_id', value: sessionAttr }] : []),
    ],
  } as unknown as ShopifyOrder
}

describe('buildPurchaseEvent session stitching', () => {
  const params = (o: ShopifyOrder) => {
    const built = buildPurchaseEvent(o)
    if ('skip' in built) throw new Error(`unexpected skip: ${built.skip}`)
    return (built.body.events as Array<{ params: Record<string, unknown> }>)[0].params
  }

  it('sends the bare numeric id from a pre-fix blob attribute', () => {
    // Carts stamped before the fix keep converting after the deploy; the
    // webhook must salvage them rather than forward the blob.
    expect(params(order(GS2_BLOB)).session_id).toBe('1787916017')
  })

  it('sends a clean id untouched', () => {
    expect(params(order('1787916017')).session_id).toBe('1787916017')
  })

  it('omits session_id entirely when the attribute is missing or junk', () => {
    expect(params(order()).session_id).toBeUndefined()
    expect(params(order('deleted')).session_id).toBeUndefined()
  })
})
