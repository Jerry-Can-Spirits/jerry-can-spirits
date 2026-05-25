import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createReferrerRewardCode } from '@/lib/shopify-admin'

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
