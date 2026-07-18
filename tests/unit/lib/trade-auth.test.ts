import { describe, expect, it, vi } from 'vitest'

// getTradeVariantIdSet resolves the trade catalogue via getProduct(handle) —
// an exact per-handle lookup, the same call the order page renders from. Mock
// it so the test is deterministic and offline: each TRADE_PRODUCTS handle
// resolves to a single-variant product keyed by its handle, except the 6-bottle
// pack, which resolves to MULTIPLE variants (the regression that the old
// fuzzy-search resolver dropped).
vi.mock('@/lib/shopify', () => ({
  getProduct: vi.fn(async (handle: string) => {
    if (handle === 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles') {
      return {
        title: 'Expedition Pack',
        images: [],
        variants: [
          { id: 'gid://shopify/ProductVariant/pack-1', title: '6 x 70cl', price: { amount: '210' } },
          { id: 'gid://shopify/ProductVariant/pack-2', title: '6 x 5cl', price: { amount: '35' } },
        ],
      }
    }
    return {
      title: handle,
      images: [],
      variants: [{ id: `gid://shopify/ProductVariant/${handle}`, title: 'Default', price: { amount: '10' } }],
    }
  }),
}))

import {
  isRateLimited,
  getTradeFailedAttempts,
  incrementTradeFailedAttempts,
  clearTradeFailedAttempts,
  TRADE_MAX_ATTEMPTS,
  getTradeFailedAttemptsForPin,
  incrementTradeFailedAttemptsForPin,
  TRADE_PIN_MAX_ATTEMPTS,
  getGlobalFailedAttempts,
  incrementGlobalFailedAttempts,
  TRADE_GLOBAL_MAX_ATTEMPTS,
} from '@/lib/kv'
import { getTradeVariantIdSet } from '@/lib/trade-products'

// Minimal in-memory KVNamespace. TTL is irrelevant to the counter logic under
// test (a tripped counter clears via TTL in production; here we assert values).
function mockKv(): KVNamespace {
  const store = new Map<string, string>()
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => { store.set(k, v) },
    delete: async (k: string) => { store.delete(k) },
  } as unknown as KVNamespace
}

describe('global failed-login velocity (finding #5 — distributed enumeration)', () => {
  it('bounds enumeration that the per-IP and per-PIN counters both miss', async () => {
    const kv = mockKv()
    // Simulate a distributed enumeration: every guess from a fresh IP and a
    // fresh PIN — exactly the shape that defeats per-IP and per-PIN counters.
    for (let i = 0; i < TRADE_GLOBAL_MAX_ATTEMPTS; i++) {
      await incrementTradeFailedAttempts(kv, `10.0.0.${i}`)
      await incrementTradeFailedAttemptsForPin(kv, `guess-${i}`)
      await incrementGlobalFailedAttempts(kv)
    }

    // Each per-IP and per-PIN counter saw exactly one failure — neither trips.
    expect(await getTradeFailedAttempts(kv, '10.0.0.0')).toBe(1)
    expect(await getTradeFailedAttemptsForPin(kv, 'guess-0')).toBe(1)
    expect(1).toBeLessThan(TRADE_MAX_ATTEMPTS)
    expect(1).toBeLessThan(TRADE_PIN_MAX_ATTEMPTS)

    // The global counter, however, has reached its ceiling: the login route
    // refuses further attempts once getGlobalFailedAttempts >= the ceiling.
    expect(await getGlobalFailedAttempts(kv)).toBeGreaterThanOrEqual(TRADE_GLOBAL_MAX_ATTEMPTS)
  })
})

describe('per-IP ceiling (venue-safe — shared wifi)', () => {
  it('does not lock out a venue after legitimate mistypes below the ceiling', async () => {
    const kv = mockKv()
    const venueIp = '203.0.113.7' // one bar behind a single NAT'd wifi IP

    // Several staff fat-finger their PINs during a Friday rush.
    for (let i = 0; i < TRADE_MAX_ATTEMPTS - 1; i++) {
      await incrementTradeFailedAttempts(kv, venueIp)
    }

    // Still below the ceiling — the venue is not locked out.
    expect(await getTradeFailedAttempts(kv, venueIp)).toBeLessThan(TRADE_MAX_ATTEMPTS)

    // And a successful login clears the counter, leaving no lingering penalty.
    await clearTradeFailedAttempts(kv, venueIp)
    expect(await getTradeFailedAttempts(kv, venueIp)).toBe(0)
  })

  it('ceiling is venue-safe (well above a plausible burst of mistypes)', () => {
    expect(TRADE_MAX_ATTEMPTS).toBeGreaterThanOrEqual(20)
  })
})

describe('trade checkout guard (finding #6)', () => {
  it('includes EVERY variant of a multi-variant trade product (6-bottle pack regression)', async () => {
    const tradeVariants = await getTradeVariantIdSet()
    // Both variants of the multi-variant pack must be orderable. The old
    // fuzzy products(query:"handle:...") resolver dropped multi-variant and
    // sized products entirely, blocking their orders in production.
    expect(tradeVariants.has('gid://shopify/ProductVariant/pack-1')).toBe(true)
    expect(tradeVariants.has('gid://shopify/ProductVariant/pack-2')).toBe(true)
  })

  it('includes the sized glassware the old guard rejected', async () => {
    const tradeVariants = await getTradeVariantIdSet()
    expect(tradeVariants.has('gid://shopify/ProductVariant/hiball-glass-38cl')).toBe(true)
    expect(tradeVariants.has('gid://shopify/ProductVariant/crystal-ice-hiball-42cl')).toBe(true)
    expect(tradeVariants.has('gid://shopify/ProductVariant/hurricane-cocktail-glass-42cl')).toBe(true)
  })

  it('still rejects a variantId that is not in the trade catalogue', async () => {
    const tradeVariants = await getTradeVariantIdSet()
    // A real Shopify variant that is NOT on the trade portal — the checkout
    // rejects any line whose variantId is absent from this set (the security
    // property must survive the fix).
    expect(tradeVariants.has('gid://shopify/ProductVariant/999999')).toBe(false)
  })

  it('throttles repeated createCart per account', async () => {
    const kv = mockKv()
    const accountId = 'acct-1'
    // 20 checkouts in the window are allowed…
    for (let i = 0; i < 20; i++) {
      expect(await isRateLimited(kv, 'trade-checkout', accountId, 20, 600)).toBe(false)
    }
    // …the 21st is throttled.
    expect(await isRateLimited(kv, 'trade-checkout', accountId, 20, 600)).toBe(true)
  })
})
