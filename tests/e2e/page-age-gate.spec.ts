import { test, expect, APIRequestContext } from '@playwright/test'

// The page-level age gate, enforced in src/middleware.ts: a top-level GET to a
// gated path without a verified cookie is redirected to /age-check before the
// page renders. Middleware only runs on the OpenNext/workerd preview (or a real
// deploy), not `next start`, so playwright.config points the webServer at the
// preview. Requests carry no sec-fetch-dest / rsc headers, so the middleware
// treats them as top-level document navigations, exactly what the gate targets.
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const VERIFIED = { cookie: 'ageVerified=true' }
const isRedirect = (s: number) => [301, 302, 307, 308].includes(s)

async function hop(request: APIRequestContext, path: string, headers: Record<string, string> = {}) {
  const res = await request.get(path, { maxRedirects: 0, headers })
  return { status: res.status(), loc: res.headers()['location'] ?? '' }
}

test.describe('Page-level age gate (middleware)', () => {
  test('unverified content page redirects to the gate with a return path', async ({ request }) => {
    const { status, loc } = await hop(request, '/shop/')
    expect(isRedirect(status)).toBe(true)
    expect(loc).toContain('/age-check')
    expect(decodeURIComponent(loc)).toContain('/shop/') // the return path, so the visitor lands back where they were
  })

  test('verified visitor is not gated', async ({ request }) => {
    const { status } = await hop(request, '/shop/', VERIFIED)
    expect(status).toBe(200)
  })

  test('search crawler is allowed through to index, no cookie needed', async ({ request }) => {
    const { status } = await hop(request, '/shop/', { 'user-agent': GOOGLEBOT })
    expect(status).toBe(200)
  })

  test('the gate route does not redirect to itself (no loop)', async ({ request }) => {
    const { status } = await hop(request, '/age-check/')
    expect(status).toBe(200)
  })

  // Excluded paths must never be redirected to the gate. Getting this wrong
  // either breaks indexing (robots/sitemap) or the law (a minor may read the
  // legal pages, and the trade portal has its own auth).
  const excluded = ['/robots.txt', '/sitemap.xml', '/privacy-policy/', '/terms-of-service/', '/cookie-policy/']
  for (const path of excluded) {
    test(`not gated: ${path}`, async ({ request }) => {
      const { status, loc } = await hop(request, path)
      expect(loc).not.toContain('/age-check')
      expect(status).toBeLessThan(400)
    })
  }

  test('API routes are not gated by middleware', async ({ request }) => {
    // /api/geo is a plain GET data route: middleware excludes /api/ wholesale, so
    // the Shopify webhook, cart and search endpoints are never redirected to the
    // gate. (/api/checkout enforces verification itself; that is covered in
    // checkout-age-gate.spec.ts.)
    const { status, loc } = await hop(request, '/api/geo/')
    expect(loc).not.toContain('/age-check')
    expect(status).toBe(200)
  })
})
