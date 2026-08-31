import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDiscountCode, createReferrerRewardCode } from '@/lib/shopify-admin'

describe('createReferrerRewardCode', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/1' },
              userErrors: [],
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('sends a 10 percent discount value, not a fixed amount', async () => {
    await createReferrerRewardCode('JCS-REWARD-TEST1234', 'test-admin-token')

    expect(fetchSpy).toHaveBeenCalledOnce()
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    const body = JSON.parse(init.body as string)
    expect(body.variables.input.customerGets.value).toEqual({ percentage: 0.10 })
  })
})

describe('referral code terms — no minimum order value, 90-day expiry', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            discountCodeBasicCreate: {
              codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/1' },
              userErrors: [],
            },
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  function sentInput() {
    const init = fetchSpy.mock.calls[0][1] as RequestInit
    return JSON.parse(init.body as string).variables.input
  }

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
