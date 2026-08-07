/**
 * Fetches representative URLs from production and asserts each one's status.
 *
 * This exists because of the facet routes. They were verified against
 * `next start`, which serves prerendered HTML from local disk, and shipped in
 * #1088 as 45 pages that returned 404 to every real visitor for two days. The
 * build log listed them, the deploy log said Success, and every check anyone
 * ran measured something other than the deployed Worker.
 *
 * Run after any deploy that introduces routes:
 *
 *   npm run verify:live
 *   npm run verify:live -- /some/new/route/ /another/
 *   npm run verify:live -- --base=https://jerry-can-spirits-prod.dan-a98.workers.dev
 *
 * The workers.dev base hits the deployed Worker directly, bypassing the zone,
 * which is the instrument to reach for when Cloudflare is challenging requests
 * to the apex domain.
 */

const DEFAULT_BASE = 'https://jerrycanspirits.co.uk'

// A crawler user agent: middleware.ts redirects any non-bot document
// navigation to the age gate, so a browser UA measures the gate, not the page.
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'

// One URL per prerendered route family. A family missing from here is a family
// this check cannot see, which is the whole failure being guarded against.
const EXPECT_200 = [
  '/',
  '/field-manual/cocktails/',
  '/field-manual/cocktails/whiskey-sour/',
  '/field-manual/cocktails/style/sours/',
  '/field-manual/cocktails/style/sours/page/2/',
  '/field-manual/cocktails/spirit/gin/',
  '/field-manual/cocktails/spirit/whiskey/page/2/',
  '/field-manual/equipment/copper-mug/',
  '/field-manual/ingredients/peychauds-bitters/',
  '/field-manual/whats-in-my-bar/',
  '/guides/winter-cocktails-guide/',
  '/shop/spiced-rum/',
  '/shop/product/jerry-can-spirits-expedition-spiced-rum/',
]

// The negative half. Asserting only 200s would pass just as happily if a facet
// route started rendering an empty listing for any string someone typed, which
// is the failure dynamicParams = false was originally there to prevent. That
// guard now lives in notFound() inside CocktailFacetPage, so it needs a check
// that fails when it is absent.
const EXPECT_404 = [
  '/field-manual/cocktails/style/not-a-real-facet/',
  '/field-manual/cocktails/spirit/not-a-real-spirit/',
  '/field-manual/cocktails/style/sours/page/999/',
  '/field-manual/cocktails/style/sours/page/abc/',
]

async function check(base: string, path: string, want: number) {
  const url = `${base}${path}`
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA },
      // A 308 or 307 where a 200 is expected is itself the finding. Following
      // redirects would hide it behind a green tick.
      redirect: 'manual',
    })
    const ok = res.status === want
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(res.status).padEnd(3)} (want ${want})  ${path}`)
    return ok
  } catch (err) {
    console.log(`FAIL  ERR (want ${want})  ${path}  ${(err as Error).message}`)
    return false
  }
}

async function main() {
  const args = process.argv.slice(2)
  const baseArg = args.find((a) => a.startsWith('--base='))
  const base = (baseArg ? baseArg.slice('--base='.length) : DEFAULT_BASE).replace(/\/$/, '')
  const extra = args.filter((a) => !a.startsWith('--'))

  const expect200 = extra.length > 0 ? extra : EXPECT_200
  // Explicit paths are checked on their own: someone verifying one new route
  // does not want the whole suite, and the negative cases are about the facet
  // routes specifically.
  const expect404 = extra.length > 0 ? [] : EXPECT_404

  console.log(`Verifying ${expect200.length + expect404.length} URLs against ${base}\n`)

  const results = [
    ...(await Promise.all(expect200.map((p) => check(base, p, 200)))),
    ...(await Promise.all(expect404.map((p) => check(base, p, 404)))),
  ]

  const failed = results.filter((r) => !r).length
  console.log()
  if (failed > 0) {
    console.error(`${failed} of ${results.length} URLs did not return the expected status.`)
    process.exit(1)
  }
  console.log(`All ${results.length} URLs returned the expected status.`)
}

main()
