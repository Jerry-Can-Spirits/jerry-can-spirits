import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDiscountCode, createReferrerRewardCode } from '@/lib/shopify-admin'

const RUM = 'gid://shopify/Product/1'
const SHAKER = 'gid://shopify/Product/2'

// A mint is two requests: the product list the code is scoped to, then the
// create mutation. The stub answers each by what the request asks for.
function stubShopify() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
    const { query } = JSON.parse((init as RequestInit).body as string) as { query: string }
    const data = query.includes('DiscountableProducts')
      ? {
          products: {
            nodes: [
              { id: RUM, handle: 'jerry-can-spirits-expedition-spiced-rum', isGiftCard: false },
              { id: SHAKER, handle: 'stainless-steel-cocktail-shaker', isGiftCard: false },
              { id: 'gid://shopify/Product/3', handle: 'uk-tree-fund', isGiftCard: false },
              { id: 'gid://shopify/Product/4', handle: 'jerry-can-spirits-gift-card', isGiftCard: true },
            ],
          },
        }
      : {
          discountCodeBasicCreate: {
            codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/1' },
            userErrors: [],
          },
        }
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

describe('referral codes', () => {
  let fetchSpy: ReturnType<typeof stubShopify>

  beforeEach(() => {
    fetchSpy = stubShopify()
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  function sentInput() {
    const init = fetchSpy.mock.calls.at(-1)?.[1] as RequestInit
    return JSON.parse(init.body as string).variables.input
  }

  it('the reward code sends a 10 percent discount value, not a fixed amount', async () => {
    await createReferrerRewardCode('JCS-REWARD-TEST1234', 'test-admin-token')
    expect(sentInput().customerGets.value).toEqual({ percentage: 0.10 })
  })

  // A code on the whole order took 10% off the UK Tree Fund donation (found
  // 17 Nov 2026). Both codes are scoped to products, with the donation and the
  // gift card left out.
  it('the shared referral code does not discount the tree fund donation', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    expect(sentInput().customerGets.items).toEqual({ products: { productsToAdd: [RUM, SHAKER] } })
  })

  it('the referrer reward code does not discount the tree fund donation', async () => {
    await createReferrerRewardCode('JCS-REWARD-TEST1234', 'test-admin-token')
    expect(sentInput().customerGets.items).toEqual({ products: { productsToAdd: [RUM, SHAKER] } })
  })

  // The £65 minimum was removed by ruling on 31 Aug 2026: the £40 price broke
  // its basket arithmetic, and WELCOME10 (no minimum) meant a referred friend
  // got a worse deal than a popup visitor. These tests pin the ABSENCE — a
  // minimum quietly reappearing in a mint input is the regression they catch.
  it('the shared referral code carries no minimum order value', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    expect(sentInput().minimumRequirement).toBeUndefined()
  })

  it('the referrer reward code carries no minimum order value', async () => {
    await createReferrerRewardCode('JCS-REWARD-TEST1234', 'test-admin-token')
    expect(sentInput().minimumRequirement).toBeUndefined()
  })

  it('both codes expire ~90 days from mint (endsAt is set)', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    const input = sentInput()
    expect(input.endsAt).toBeTruthy()
    const days = (Date.parse(input.endsAt) - Date.parse(input.startsAt)) / (1000 * 60 * 60 * 24)
    expect(Math.round(days)).toBe(90)
  })
})
