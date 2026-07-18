import { vi, describe, it, expect, beforeEach } from 'vitest'

// Route-level tests for the trade login handler: the six-digit PIN floor, and
// the DoS-safety property that the global failed-login counter (a site-wide
// lockout) is only fed by a genuine verify failure — never by a cheap 400 from
// malformed or sub-floor input, which an attacker could otherwise use to lock
// out every venue at negligible cost.

const state: { kv: KVNamespace; dbFirst: unknown } = {
  kv: null as unknown as KVNamespace,
  dbFirst: null,
}

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: {
      SITE_OPS: state.kv,
      // No PIN_PEPPER, so the route takes the legacy plaintext SELECT; dbFirst
      // controls whether an account "matches".
      DB: {
        prepare: () => ({
          bind: () => ({ first: async () => state.dbFirst, run: async () => ({}) }),
        }),
      },
    },
  }),
}))

vi.mock('@/lib/trade-portal/session', () => ({
  createTradeSession: async () => 'sid',
  setTradeSessionCookie: async () => {},
}))

import { POST } from '@/app/api/trade/login/route'
import { getGlobalFailedAttempts } from '@/lib/kv'

function mockKv(): KVNamespace {
  const store = new Map<string, string>()
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v)
    },
    delete: async (k: string) => {
      store.delete(k)
    },
  } as unknown as KVNamespace
}

function post(body: unknown) {
  return POST(
    new Request('https://jerrycanspirits.co.uk/api/trade/login', {
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

describe('trade login PIN floor + counter DoS-safety', () => {
  beforeEach(() => {
    state.kv = mockKv()
    state.dbFirst = null
  })

  it('rejects a five-digit PIN (below the six-digit floor) with 400', async () => {
    const res = await post({ pin: '12345' })
    expect(res.status).toBe(400)
  })

  it('a sub-floor PIN does NOT increment the global counter', async () => {
    await post({ pin: '12345' })
    expect(await getGlobalFailedAttempts(state.kv)).toBe(0)
  })

  it('a malformed body returns 400 and does NOT increment the global counter', async () => {
    const res = await post('not json{')
    expect(res.status).toBe(400)
    expect(await getGlobalFailedAttempts(state.kv)).toBe(0)
  })

  it('a well-formed unknown six-digit PIN returns 401 and DOES increment the global counter', async () => {
    state.dbFirst = null // no account matches
    const res = await post({ pin: '999999' })
    expect(res.status).toBe(401)
    expect(await getGlobalFailedAttempts(state.kv)).toBe(1)
  })
})
