import { test, expect, APIRequestContext } from '@playwright/test'

// The age-gated Shopify checkout handoff (/api/checkout). A client-side
// window.location straight to Shopify cannot be enforced server-side, so the
// Buy-it-now / Proceed-to-checkout paths route through this route handler,
// which requires a verified session (no crawler bypass) and validates the
// Shopify destination before handing off.
const STORE_HOST = 'shop.jerrycanspirits.co.uk'
const CHECKOUT_TARGET = `https://${STORE_HOST}/cart/c/CARTTOKEN123`
const route = (to: string = CHECKOUT_TARGET) => '/api/checkout/?to=' + encodeURIComponent(to)
const VERIFIED = { cookie: 'ageVerified=true' }
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
const isRedirect = (s: number) => [301, 302, 307, 308].includes(s)
const BASE = 'http://localhost:3000'

async function hop(request: APIRequestContext, url: string, headers: Record<string, string> = {}) {
  const res = await request.get(url, { maxRedirects: 0, headers })
  return { status: res.status(), loc: res.headers()['location'] ?? '' }
}

test.describe('Age-gated checkout handoff', () => {
  test('unverified checkout redirects to the age gate, not Shopify', async ({ request }) => {
    const { status, loc } = await hop(request, route())
    expect(isRedirect(status)).toBe(true)
    const target = new URL(loc, BASE)
    expect(target.pathname).toContain('/age-check')
    expect(target.host).not.toBe(STORE_HOST) // Shopify appears only in the return query, never as the target
  })

  test('unverified checkout is gated even with a spoofed bot User-Agent', async ({ request }) => {
    const { status, loc } = await hop(request, route(), { 'user-agent': GOOGLEBOT })
    expect(isRedirect(status)).toBe(true)
    const target = new URL(loc, BASE)
    expect(target.pathname).toContain('/age-check')
    expect(target.host).not.toBe(STORE_HOST)
  })

  test('verified checkout hands off to Shopify', async ({ request }) => {
    const { status, loc } = await hop(request, route(), VERIFIED)
    expect(isRedirect(status)).toBe(true)
    const target = new URL(loc, BASE)
    expect(target.host).toBe(STORE_HOST)
    expect(target.href).toContain('CARTTOKEN123')
  })

  test('verified checkout to a non-Shopify destination is rejected (open-redirect guard)', async ({ request }) => {
    const { status } = await hop(request, route('https://evil.example.com/steal'), VERIFIED)
    expect(status).toBe(400)
  })

  test('verified checkout with no destination falls back to home, never a dead end', async ({ request }) => {
    const { status, loc } = await hop(request, '/api/checkout/', VERIFIED)
    expect(isRedirect(status)).toBe(true)
    expect(new URL(loc, BASE).pathname).toBe('/')
  })

  test('cart survives the gate: the Shopify cart token round-trips through verification', async ({ request }) => {
    // Unverified: the checkout URL (with its cart token) is preserved in the
    // return path back to checkout.
    const gated = await hop(request, route())
    expect(gated.loc).toContain('/age-check')
    expect(gated.loc).toContain('CARTTOKEN123')
    // Verified: the same route now hands off to Shopify with the cart intact.
    const after = await hop(request, route(), VERIFIED)
    expect(new URL(after.loc, BASE).host).toBe(STORE_HOST)
    expect(after.loc).toContain('CARTTOKEN123')
  })
})
