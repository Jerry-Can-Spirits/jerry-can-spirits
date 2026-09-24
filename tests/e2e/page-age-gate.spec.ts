import { test, expect, APIRequestContext } from '@playwright/test'

// The page-level age gate is an overlay carried in every gated page's HTML and
// decided before first paint by the inline script in app/layout.tsx (see
// src/lib/age-gate.ts). Nothing is redirected: the same HTML serves verified and
// unverified visitors, crawlers included. These pin that, and the paths that
// must never carry a gate at all. The browser-level behaviour (the overlay
// appears, "Yes, Enter" dismisses it) is in age-gate.spec.ts.
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const VERIFIED = { cookie: 'ageVerified=true' }
const GATE_HEADING = 'WELCOME, EXPLORER'

async function hop(request: APIRequestContext, path: string, headers: Record<string, string> = {}) {
  const res = await request.get(path, { maxRedirects: 0, headers })
  return { status: res.status(), loc: res.headers()['location'] ?? '', body: await res.text() }
}

test.describe('Page-level age gate (overlay in the page)', () => {
  test('unverified content page is served with the gate in its HTML', async ({ request }) => {
    const { status, loc, body } = await hop(request, '/shop/')
    expect(status).toBe(200)
    expect(loc).toBe('')
    expect(body).toContain(GATE_HEADING)
    expect(body).toContain('data-age-verified') // the inline script that decides before paint
  })

  test('verified visitor gets the same page, not a redirect', async ({ request }) => {
    const { status, loc } = await hop(request, '/shop/', VERIFIED)
    expect(status).toBe(200)
    expect(loc).toBe('')
  })

  test('search crawler is served the content, flagged as a bot', async ({ request }) => {
    const res = await request.get('/shop/', { maxRedirects: 0, headers: { 'user-agent': GOOGLEBOT } })
    expect(res.status()).toBe(200)
    expect(res.headers()['x-is-bot']).toBe('true')
  })

  test('the legacy gate route still answers', async ({ request }) => {
    const { status } = await hop(request, '/age-check/')
    expect(status).toBe(200)
  })

  // These paths must never carry the gate. Getting this wrong either breaks
  // indexing (robots/sitemap) or the law (a minor may read the legal pages, and
  // the trade portal has its own auth).
  const excluded = ['/privacy-policy/', '/terms-of-service/', '/cookie-policy/']
  for (const path of excluded) {
    test(`no gate on ${path}`, async ({ request }) => {
      const { status, body } = await hop(request, path)
      expect(status).toBe(200)
      expect(body).not.toContain(GATE_HEADING)
    })
  }

  test('API routes are untouched', async ({ request }) => {
    // /api/geo is a plain GET data route. (/api/checkout enforces verification
    // itself; that is covered in checkout-age-gate.spec.ts.)
    const { status, loc } = await hop(request, '/api/geo/')
    expect(loc).toBe('')
    expect(status).toBe(200)
  })
})

// The files that exist for crawlers must answer 200 with no age cookie.
test.describe('crawler-facing files are never age-gated', () => {
  const CRAWLER_PATHS = [
    '/robots.txt',
    '/sitemap.xml',
    '/llms.txt',
    '/manifest.json',
    '/.well-known/security.txt',
  ]

  for (const path of CRAWLER_PATHS) {
    test(`${path} returns 200 without an age cookie`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 })
      expect(res.status()).toBe(200)
    })
  }
})
