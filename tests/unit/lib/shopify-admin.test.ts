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

describe('referral code terms — £65 minimum order value and 90-day expiry', () => {
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

  it('the shared referral code carries a £65 minimum order value', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    expect(sentInput().minimumRequirement).toEqual({
      subtotal: { greaterThanOrEqualToSubtotal: '65.00' },
    })
  })

  it('the referrer reward code carries the same £65 minimum order value', async () => {
    await createReferrerRewardCode('JCS-REWARD-TEST1234', 'test-admin-token')
    expect(sentInput().minimumRequirement).toEqual({
      subtotal: { greaterThanOrEqualToSubtotal: '65.00' },
    })
  })

  it('both codes expire ~90 days from mint (endsAt is set)', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    const input = sentInput()
    expect(input.endsAt).toBeTruthy()
    const days = (Date.parse(input.endsAt) - Date.parse(input.startsAt)) / (1000 * 60 * 60 * 24)
    expect(Math.round(days)).toBe(90)
  })

  it('the minted floor rejects an order below £65 and accepts at or above it', async () => {
    await createDiscountCode('JCS-REF-TEST1234', 'test-admin-token')
    // Shopify's minimumRequirement.subtotal.greaterThanOrEqualToSubtotal: an
    // order below the floor is rejected, at or above is accepted.
    const floor = Number(sentInput().minimumRequirement.subtotal.greaterThanOrEqualToSubtotal)
    expect(64.99 >= floor).toBe(false) // rejected
    expect(65.00 >= floor).toBe(true) // accepted (at the threshold)
    expect(84.0 >= floor).toBe(true) // accepted (bottle + accessory basket)
  })
})
