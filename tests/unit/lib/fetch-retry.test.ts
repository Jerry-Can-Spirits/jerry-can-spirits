import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  BUILD_POLICY,
  RUNTIME_POLICY,
  backoffMs,
  isGraphQLMutation,
  isTransientError,
  rejectTransientStatus,
  withRetry,
} from '@/lib/fetch-retry'

function connectTimeout() {
  return new TypeError('fetch failed', {
    cause: Object.assign(new Error('Connect Timeout Error'), { code: 'UND_ERR_CONNECT_TIMEOUT' }),
  })
}

const httpError = (statusCode: number) => Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isTransientError', () => {
  it.each([
    ['connect timeout', connectTimeout()],
    ['bare fetch failed', new TypeError('fetch failed')],
    ['ECONNRESET', Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' })],
    ['abort from the request timer', Object.assign(new Error('aborted'), { name: 'AbortError' })],
    ['429', httpError(429)],
    ['502', httpError(502)],
    ['503', Object.assign(new Error('x'), { status: 503 })],
    ['504', httpError(504)],
  ])('retries %s', (_, err) => {
    expect(isTransientError(err)).toBe(true)
  })

  it.each([
    ['400', httpError(400)],
    ['401', httpError(401)],
    ['404', httpError(404)],
    ['500', httpError(500)],
    ['a GraphQL error', new Error('Failed to fetch product')],
    ['a TypeError from code', new TypeError("Cannot read properties of undefined (reading 'x')")],
    ['DNS not found', new TypeError('fetch failed', { cause: Object.assign(new Error('x'), { code: 'ENOTFOUND' }) })],
    ['a non-error', 'fetch failed'],
  ])('does not retry %s', (_, err) => {
    expect(isTransientError(err)).toBe(false)
  })
})

describe('backoffMs', () => {
  it('grows x3 per retry and stays within +/-25% jitter', () => {
    expect(backoffMs(0, 500, () => 0)).toBe(375)
    expect(backoffMs(0, 500, () => 1)).toBe(625)
    expect(backoffMs(1, 500, () => 0.5)).toBe(1500)
    for (let i = 0; i < 200; i++) {
      const d = backoffMs(1, 500)
      expect(d).toBeGreaterThanOrEqual(1125)
      expect(d).toBeLessThanOrEqual(1875)
    }
  })

  it('caps the base delay at 4s', () => {
    expect(backoffMs(2, 500, () => 0.5)).toBe(4000)
    expect(backoffMs(6, 500, () => 1)).toBe(5000)
  })
})

describe('withRetry', () => {
  const noSleep = vi.fn(async () => {})

  function failing(err: unknown, thenValue?: string) {
    let calls = 0
    const fn = vi.fn(async () => {
      calls++
      if (thenValue !== undefined && calls > 1) return thenValue
      throw err
    })
    return fn
  }

  it('makes three attempts at build', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const fn = failing(connectTimeout())
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('fetch failed')
    expect(fn).toHaveBeenCalledTimes(BUILD_POLICY.attempts)
    expect(BUILD_POLICY.attempts).toBe(3)
  })

  it('makes two attempts at runtime', async () => {
    const fn = failing(connectTimeout())
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('fetch failed')
    expect(fn).toHaveBeenCalledTimes(RUNTIME_POLICY.attempts)
    expect(RUNTIME_POLICY.attempts).toBe(2)
  })

  it('waits the build backoff between attempts', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const sleep = vi.fn(async () => {})
    await expect(withRetry(failing(httpError(503)), { sleep, random: () => 0.5 })).rejects.toThrow()
    expect(sleep.mock.calls).toEqual([[500], [1500]])
  })

  it('returns the value once a retry succeeds', async () => {
    const fn = failing(connectTimeout(), 'ok')
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry a 4xx', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const fn = failing(httpError(404))
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('HTTP 404')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('honours an explicit attempt count', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build')
    const fn = failing(connectTimeout())
    await expect(withRetry(fn, { attempts: 1, sleep: noSleep })).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('rejectTransientStatus', () => {
  it('passes a 200 and a 404 through', async () => {
    const ok = new Response('{}', { status: 200 })
    const missing = new Response('{}', { status: 404 })
    await expect(rejectTransientStatus(ok)).resolves.toBe(ok)
    await expect(rejectTransientStatus(missing)).resolves.toBe(missing)
  })

  it('throws a retryable error on 503', async () => {
    const err = await rejectTransientStatus(new Response('busy', { status: 503 })).catch((e: unknown) => e)
    expect(isTransientError(err)).toBe(true)
  })
})

describe('isGraphQLMutation', () => {
  it('spots a mutation after leading whitespace', () => {
    expect(isGraphQLMutation(JSON.stringify({ query: '\n    mutation AddToCart($cartId: ID!) { x }' }))).toBe(true)
  })

  it('treats queries and an empty body as safe to retry', () => {
    expect(isGraphQLMutation(JSON.stringify({ query: '\n    query GetProduct { x }' }))).toBe(false)
    expect(isGraphQLMutation(JSON.stringify({ query: '{ products { x } }' }))).toBe(false)
    expect(isGraphQLMutation(undefined)).toBe(false)
  })
})

describe('Shopify Storefront client wiring', () => {
  const productBody = JSON.stringify({ data: { product: null } })

  async function loadShopify(fetchMock: ReturnType<typeof vi.fn>) {
    vi.resetModules()
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN', 'example.myshopify.com')
    vi.stubEnv('NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN', 'test-token')
    vi.stubGlobal('fetch', fetchMock)
    return import('@/lib/shopify')
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('retries a product query after a connect timeout', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(connectTimeout())
      .mockResolvedValue(new Response(productBody, { headers: { 'Content-Type': 'application/json' } }))
    const { getProduct } = await loadShopify(fetchMock)
    await expect(getProduct('x')).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sends a cart mutation once', async () => {
    const fetchMock = vi.fn().mockRejectedValue(connectTimeout())
    const { createCart } = await loadShopify(fetchMock)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(createCart()).rejects.toThrow()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
