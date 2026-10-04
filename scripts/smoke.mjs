// API and page smoke test. Hits the routes a customer depends on and checks
// each answers the way it should. No logins, no orders, nothing written.
//
//   node scripts/smoke.mjs                          # the live site
//   node scripts/smoke.mjs http://localhost:8787    # a local Worker (opennextjs-cloudflare preview)
//
// Why it exists: on 28 Sep 2026 a dependency bump deployed at 21:07 and every
// route under /api/ returned 500 until 14:58 the next day. Pages kept rendering
// because they are prerendered, so nothing noticed, and /api/checkout is the
// age-gate handoff to Shopify, so nobody could buy for eighteen hours. CI runs
// this against a local build of the Worker on every pull request, against the
// live site after each deploy, and on a timer.
//
// Exit code 1 on any failure. A 5xx anywhere is always a failure, whatever the
// route expected. A request that never reaches the server (DNS, a reset, a
// timeout) is tried once more after a pause, because a runner-side blip on
// 3 Oct 2026 failed a scheduled run in 88 ms and emailed about it; a page that
// answers wrongly is never retried, because a wrong answer is the finding.

const base = (process.argv[2] || 'https://jerrycanspirits.co.uk').replace(/\/$/, '')
const timeoutMs = 20_000
const retryAfterMs = 3_000

// Requests carry the age-verified cookie so the server age gate (which 307s
// any browser without it) lets the pages through. Against the live site the
// zone's bot protection challenges a script and answers 403, so the request
// also carries a token in X-JCS-Smoke that a WAF rule on the zone recognises
// and lets past the challenge (SMOKE_TOKEN in CI's secrets and in the rule).
// A local Worker has no bot protection and needs no token.
const headers = {
  'User-Agent': 'JCS-Smoke/1.0 (+https://jerrycanspirits.co.uk)',
  Cookie: 'ageVerified=true',
  Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
  ...(process.env.SMOKE_TOKEN ? { 'X-JCS-Smoke': process.env.SMOKE_TOKEN } : {}),
}

// The stylesheet the page names has to exist. On 24 Sep 2026 a deploy left
// the edge cache serving a homepage whose stylesheet the new build had
// deleted, so the page rendered unstyled while every status code was 200.
async function stylesheetLoads(text) {
  const match = text.match(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/) || text.match(/<link[^>]+href="([^"]+\.css[^"]*)"[^>]+rel="stylesheet"/)
  if (!match) return 'no stylesheet link in the page'
  const href = match[1].startsWith('http') ? match[1] : base + match[1]
  const res = await fetch(href, { headers })
  return res.status === 200 ? null : `stylesheet ${match[1]} answered ${res.status}`
}

// expect: the statuses that mean "working". Anything else fails. 5xx always fails.
// assert: given the body, returns a reason to fail or null.
const checks = [
  // Pages: prerendered, but the render path still has to work.
  { name: 'home', method: 'GET', path: '/', expect: [200], assert: stylesheetLoads },
  { name: 'shop', method: 'GET', path: '/shop/', expect: [200] },
  // The product page has to carry a price read live from Shopify and the
  // Product structured data; a page that renders but shows no price is a
  // page nobody can buy from, and the status would still be 200.
  {
    name: 'product page',
    method: 'GET',
    path: '/shop/product/jerry-can-spirits-expedition-spiced-rum/',
    expect: [200],
    assert: (text) =>
      !/£\d/.test(text) ? 'no price on the page' : !text.includes('"@type":"Product"') ? 'no Product structured data' : null,
  },
  { name: 'cocktail page', method: 'GET', path: '/field-manual/cocktails/mojito/', expect: [200] },
  { name: 'team page', method: 'GET', path: '/about/team/', expect: [200] },
  { name: 'trade login page', method: 'GET', path: '/trade/login/', expect: [200] },

  // API reads.
  { name: 'api geo', method: 'GET', path: '/api/geo/', expect: [200] },
  { name: 'api recent orders', method: 'GET', path: '/api/recent-orders/', expect: [200] },
  { name: 'api search', method: 'GET', path: '/api/search/?q=rum', expect: [200] },
  { name: 'api cart upsell', method: 'GET', path: '/api/cart-upsell/', expect: [200] },
  { name: 'api social stats', method: 'GET', path: '/api/social-stats/', expect: [200] },

  // The checkout handoff: with the cookie it redirects to Shopify; without one
  // it would send the visitor to the age check. Either is the route working.
  { name: 'api checkout', method: 'GET', path: '/api/checkout/', expect: [301, 302, 303, 307, 308], redirect: 'manual' },

  // API writes, sent empty: the route must reject them itself (400 or 401),
  // which proves the module loaded and the handler ran. 403 is deliberately
  // not accepted: it is what the bot challenge answers, and would mask a
  // blocked route as a working one.
  { name: 'api contact (empty)', method: 'POST', path: '/api/contact/', body: '{}', expect: [400, 401, 422] },
  { name: 'api klaviyo signup (empty)', method: 'POST', path: '/api/klaviyo-signup/', body: '{}', expect: [400, 401, 422] },
  { name: 'api trade application (empty)', method: 'POST', path: '/api/trade-application/', body: '{}', expect: [400, 401, 422] },
  { name: 'api trade login (empty)', method: 'POST', path: '/api/trade/login/', body: '{}', expect: [400, 401, 422] },
  { name: 'api trade checkout (empty)', method: 'POST', path: '/api/trade/checkout/', body: '{}', expect: [400, 401, 422] },
  { name: 'api shopify webhook (unsigned)', method: 'POST', path: '/api/webhooks/shopify/', body: '{}', expect: [400, 401] },
  { name: 'api sanity webhook (unsigned)', method: 'POST', path: '/api/webhooks/sanity/', body: '{}', expect: [400, 401] },
]

async function request(check) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(base + check.path, {
      method: check.method,
      headers: check.body ? { ...headers, 'Content-Type': 'application/json' } : headers,
      body: check.body,
      redirect: check.redirect || 'follow',
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

async function run(check) {
  const started = Date.now()
  let res
  try {
    res = await request(check)
  } catch (first) {
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs))
    try {
      res = await request(check)
    } catch (err) {
      const why = err.name === 'AbortError' ? 'timed out' : err.message
      return { ok: false, line: `FAIL ----  ${String(Date.now() - started).padStart(5)}ms  ${check.method.padEnd(4)} ${check.path} (${why}, twice; first: ${first.name === 'AbortError' ? 'timed out' : first.message})` }
    }
  }
  const ms = Date.now() - started
  let ok = check.expect.includes(res.status) && res.status < 500
  let detail = ''
  if (!ok) {
    const text = (await res.text().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160)
    detail = ` (expected ${check.expect.join('/')}) ${text}`
  } else if (check.assert) {
    const text = await res.text().catch(() => '')
    const reason = await check.assert(text)
    if (reason) {
      ok = false
      detail = ` (${reason})`
    }
  }
  return { ok, line: `${ok ? 'ok  ' : 'FAIL'} ${String(res.status).padEnd(4)} ${String(ms).padStart(5)}ms  ${check.method.padEnd(4)} ${check.path}${detail}` }
}

console.log(`smoke: ${base}`)
const results = await Promise.all(checks.map(run))
for (const r of results) console.log(r.line)
const failed = results.filter((r) => !r.ok).length
console.log(failed ? `\n${failed} of ${results.length} checks failed` : `\nall ${results.length} checks passed`)
process.exit(failed ? 1 : 0)
