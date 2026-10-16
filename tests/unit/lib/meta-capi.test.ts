import { createHash } from 'node:crypto'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const state: { kv: KVNamespace } = { kv: null as unknown as KVNamespace }

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: { SITE_OPS: state.kv, META_CAPI_ACCESS_TOKEN: 'test-token' },
  }),
}))

vi.mock('@/lib/server-error-capture', () => ({
  captureServerError: async () => {},
  captureServerMessage: async () => {},
}))

import {
  EXTERNAL_ID_PATTERN,
  FB_ID_PATTERN,
  buildFbc,
  buildFbp,
  clearMetaCookies,
  ensureMetaCookies,
  hashEmail,
  hashExternalId,
  readCookie,
  subdomainIndex,
  trackEventDual,
  type CookieJar,
} from '@/lib/meta-capi'
import { POST as eventsPost } from '@/app/api/meta/events/route'
import { POST as clearPost } from '@/app/api/meta/clear-identity/route'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

// Mimics document.cookie: reads return name=value pairs, writes set or delete one.
function fakeJar(initial: Record<string, string> = {}): CookieJar & { store: Map<string, string> } {
  const store = new Map(Object.entries(initial))
  return {
    store,
    get cookie() {
      return [...store].map(([k, v]) => `${k}=${v}`).join('; ')
    },
    set cookie(line: string) {
      const [pair, ...attrs] = line.split(';').map(s => s.trim())
      const [name, ...rest] = pair.split('=')
      if (attrs.includes('Max-Age=0')) store.delete(name)
      else store.set(name, rest.join('='))
    },
  }
}

const site = { hostname: 'jerrycanspirits.co.uk', href: 'https://jerrycanspirits.co.uk/', protocol: 'https:' }

function mockKv(): KVNamespace {
  const store = new Map<string, string>()
  return {
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => {
      store.set(k, v)
    },
  } as unknown as KVNamespace
}

describe('hashing and normalisation', () => {
  it('trims and lowercases email before SHA-256', async () => {
    expect(await hashEmail('  John_Smith@Gmail.com ')).toBe(sha256('john_smith@gmail.com'))
  })

  it('hashes external_id to lowercase hex, stable for the same id', async () => {
    const id = '0b6c1c8e-2f7a-4d1e-9a3b-5c6d7e8f9a0b'
    const hashed = await hashExternalId(id)
    expect(hashed).toBe(sha256(id))
    expect(hashed).toMatch(/^[0-9a-f]{64}$/)
    expect(await hashExternalId(id)).toBe(hashed)
  })
})

describe('fbp and fbc format', () => {
  it('counts domain labels for the subdomain index', () => {
    expect(subdomainIndex('com')).toBe(0)
    expect(subdomainIndex('example.com')).toBe(1)
    expect(subdomainIndex('jerrycanspirits.co.uk')).toBe(2)
  })

  it('builds fb.<index>.<ms>.<value>', () => {
    expect(buildFbp('jerrycanspirits.co.uk', 1596403881668, 1116446470)).toBe('fb.2.1596403881668.1116446470')
    expect(buildFbc('example.com', 1554763741205, 'IwAR2F4-dbP0')).toBe('fb.1.1554763741205.IwAR2F4-dbP0')
    expect(buildFbp('jerrycanspirits.co.uk', 1596403881668, 1)).toMatch(FB_ID_PATTERN)
  })
})

describe('ensureMetaCookies', () => {
  it('creates _fbp and jcs_eid, and no _fbc without a fbclid', () => {
    const jar = fakeJar()
    const id = ensureMetaCookies(jar, site, 1700000000000)
    expect(readCookie(jar.cookie, '_fbp')).toMatch(/^fb\.2\.1700000000000\.\d+$/)
    expect(readCookie(jar.cookie, '_fbc')).toBeUndefined()
    expect(id).toMatch(EXTERNAL_ID_PATTERN)
    expect(readCookie(jar.cookie, 'jcs_eid')).toBe(id)
  })

  it('keeps an existing Pixel _fbp and a stable external id', () => {
    const jar = fakeJar({ _fbp: 'fb.2.1596403881668.1116446470' })
    const first = ensureMetaCookies(jar, site)
    const second = ensureMetaCookies(jar, site)
    expect(second).toBe(first)
    expect(readCookie(jar.cookie, '_fbp')).toBe('fb.2.1596403881668.1116446470')
  })

  it('builds _fbc from fbclid, keeping case, and replaces it only for a new fbclid', () => {
    const jar = fakeJar()
    const withClick = (fbclid: string) => ({ ...site, href: `https://jerrycanspirits.co.uk/?fbclid=${fbclid}` })
    ensureMetaCookies(jar, withClick('IwAR2F4-AbC'), 1700000000000)
    expect(readCookie(jar.cookie, '_fbc')).toBe('fb.2.1700000000000.IwAR2F4-AbC')
    ensureMetaCookies(jar, withClick('IwAR2F4-AbC'), 1800000000000)
    expect(readCookie(jar.cookie, '_fbc')).toBe('fb.2.1700000000000.IwAR2F4-AbC')
    ensureMetaCookies(jar, withClick('Other'), 1800000000000)
    expect(readCookie(jar.cookie, '_fbc')).toBe('fb.2.1800000000000.Other')
  })

  it('clearMetaCookies removes all three', () => {
    const jar = fakeJar()
    ensureMetaCookies(jar, { ...site, href: 'https://jerrycanspirits.co.uk/?fbclid=x' })
    expect(jar.store.size).toBe(3)
    clearMetaCookies(jar)
    expect(jar.store.size).toBe(0)
  })
})

describe('trackEventDual consent gate', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function stubBrowser(marketing: boolean | undefined) {
    const jar = fakeJar()
    const fetchMock = vi.fn(async () => new Response(null))
    const fbq = vi.fn()
    vi.stubGlobal('document', jar)
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('window', {
      location: site,
      fbq,
      Cookiebot: marketing === undefined ? undefined : { consent: { marketing } },
    })
    return { jar, fetchMock, fbq }
  }

  it('sets no cookie and sends nothing without marketing consent', () => {
    for (const consent of [false, undefined]) {
      const { jar, fetchMock, fbq } = stubBrowser(consent)
      trackEventDual('PageView')
      expect(jar.store.size).toBe(0)
      expect(fetchMock).not.toHaveBeenCalled()
      expect(fbq).not.toHaveBeenCalled()
    }
  })

  it('with consent, the cookies exist before the server event and the pixel shares its event_id', () => {
    const { jar, fetchMock, fbq } = stubBrowser(true)
    trackEventDual('PageView')
    expect(readCookie(jar.cookie, '_fbp')).toMatch(FB_ID_PATTERN)
    expect(readCookie(jar.cookie, 'jcs_eid')).toMatch(EXTERNAL_ID_PATTERN)
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    const body = JSON.parse(init.body as string) as { eventID: string }
    expect(fbq).toHaveBeenCalledWith('track', 'PageView', {}, { eventID: body.eventID })
  })
})

describe('/api/meta/events', () => {
  type GraphBody = { data: Array<{ event_id: string; user_data: Record<string, unknown> }> }
  let graphCalls: GraphBody[]

  beforeEach(() => {
    state.kv = mockKv()
    graphCalls = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        graphCalls.push(JSON.parse(init.body as string) as GraphBody)
        return new Response('{}')
      }),
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const eid = '0b6c1c8e-2f7a-4d1e-9a3b-5c6d7e8f9a0b'
  function send(body: Record<string, unknown>, cookie?: string) {
    return eventsPost(
      new Request('https://jerrycanspirits.co.uk/api/meta/events/', {
        method: 'POST',
        headers: { 'cf-connecting-ip': '203.0.113.7', 'user-agent': 'test-agent', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify({
          eventName: 'PageView',
          eventID: 'evt-1',
          eventTime: Math.floor(Date.now() / 1000),
          eventSourceUrl: 'https://jerrycanspirits.co.uk/',
          customData: {},
          ...body,
        }),
      }),
    )
  }

  it('without the consent flag: 400, nothing sent, no cookie set', async () => {
    const res = await send({}, `_fbp=fb.2.1596403881668.1; jcs_eid=${eid}`)
    expect(res.status).toBe(400)
    expect(graphCalls).toHaveLength(0)
    expect(res.headers.get('set-cookie')).toBeNull()
  })

  it('sends fbp, fbc and the hashed external_id, never the raw id, and refreshes the cookies', async () => {
    const res = await send(
      { consent: true },
      `_fbp=fb.2.1596403881668.1116446470; _fbc=fb.2.1700000000000.IwAR; jcs_eid=${eid}`,
    )
    expect(res.status).toBe(200)
    const event = graphCalls[0].data[0]
    expect(event.event_id).toBe('evt-1')
    expect(event.user_data.fbp).toBe('fb.2.1596403881668.1116446470')
    expect(event.user_data.fbc).toBe('fb.2.1700000000000.IwAR')
    expect(event.user_data.external_id).toEqual([sha256(eid)])
    expect(JSON.stringify(graphCalls[0])).not.toContain(eid)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('_fbp=fb.2.1596403881668.1116446470; Path=/; Max-Age=7776000')
    expect(setCookie).toContain(`jcs_eid=${eid}; Path=/; Max-Age=31536000`)
  })

  it('builds fbc from a fbclid in the page URL when no _fbc cookie exists', async () => {
    await send({ consent: true, eventSourceUrl: 'https://jerrycanspirits.co.uk/?fbclid=IwAR2F4-AbC' })
    expect(graphCalls[0].data[0].user_data.fbc).toMatch(/^fb\.1\.\d{13}\.IwAR2F4-AbC$/)
  })

  it('ignores malformed identity cookies', async () => {
    const res = await send({ consent: true }, '_fbp=bogus; jcs_eid=not-a-uuid')
    const userData = graphCalls[0].data[0].user_data
    expect(userData.fbp).toBeUndefined()
    expect(userData.external_id).toBeUndefined()
    expect(res.headers.get('set-cookie')).toBeNull()
  })
})

describe('/api/meta/clear-identity', () => {
  it('expires jcs_em, jcs_eid, _fbp and _fbc', async () => {
    const res = await clearPost(
      new Request('https://jerrycanspirits.co.uk/api/meta/clear-identity/', { method: 'POST' }),
    )
    expect(res.status).toBe(204)
    const setCookie = res.headers.get('set-cookie') ?? ''
    for (const name of ['jcs_em', 'jcs_eid', '_fbp', '_fbc']) {
      expect(setCookie).toMatch(new RegExp(`(^|, )${name}=; [^,]*Max-Age=0`))
    }
  })
})
