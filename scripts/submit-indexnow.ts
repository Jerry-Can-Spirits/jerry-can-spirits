/**
 * IndexNow bulk URL submission script.
 *
 * Submits all site URLs to IndexNow (Bing, Yandex + Google pilot).
 * Run after deploy or whenever significant content changes:
 *   npx tsx scripts/submit-indexnow.ts
 *
 * Requires SANITY_PROJECT_ID and SANITY_DATASET env vars (or .env.local).
 */

import { createClient } from '@sanity/client'

const INDEXNOW_KEY = 'a7e2b5f9c3d1e6a8b4d2f0e5c9a3b7d1'
const BASE_URL = 'https://jerrycanspirits.co.uk'
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

async function getAllUrls(sanity: ReturnType<typeof createClient>): Promise<string[]> {
  const staticUrls = [
    '/',
    '/about/story/',
    '/about/team/',
    '/about/team/dan-freeman/',
    '/about/team/rhys-williams/',
    '/ethos/',
    '/field-manual/',
    '/field-manual/cocktails/',
    '/field-manual/equipment/',
    '/field-manual/ingredients/',
    '/guides/',
    '/contact/',
    '/contact/enquiries/',
    '/contact/media/',
    '/contact/complaints/',
    '/privacy-policy/',
    '/terms-of-service/',
    '/cookie-policy/',
    '/shipping-returns/',
    '/accessibility/',
    '/armed-forces-covenant/',
    '/faq/',
    '/reviews/',
    '/friends/',
    '/sustainability/',
    '/ingredients/',
    '/ingredients/expedition-spiced-rum/',
    '/batch/',
    '/shop/',
    '/shop/drinks/',
    '/shop/barware/',
    '/shop/clothing/',
  ].map(path => `${BASE_URL}${path}`)

  // Fetch dynamic content slugs from Sanity
  const [cocktails, ingredients, equipment, guides] = await Promise.all([
    sanity.fetch<Array<{ slug: { current: string } }>>(`*[_type == "cocktail" && defined(slug.current)]{ slug }`),
    sanity.fetch<Array<{ slug: { current: string } }>>(`*[_type == "ingredient" && defined(slug.current)]{ slug }`),
    sanity.fetch<Array<{ slug: { current: string } }>>(`*[_type == "equipment" && defined(slug.current)]{ slug }`),
    sanity.fetch<Array<{ slug: { current: string } }>>(`*[_type == "guide" && defined(slug.current)]{ slug }`),
  ])

  const dynamicUrls = [
    ...cocktails.map(c => `${BASE_URL}/field-manual/cocktails/${c.slug.current}/`),
    ...ingredients.map(i => `${BASE_URL}/field-manual/ingredients/${i.slug.current}/`),
    ...equipment.map(e => `${BASE_URL}/field-manual/equipment/${e.slug.current}/`),
    ...guides.map(g => `${BASE_URL}/guides/${g.slug.current}/`),
  ]

  return [...staticUrls, ...dynamicUrls]
}

async function submitToIndexNow(urls: string[]): Promise<void> {
  // IndexNow accepts up to 10,000 URLs per request
  const payload = {
    host: 'jerrycanspirits.co.uk',
    key: INDEXNOW_KEY,
    keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  }

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })

  if (res.ok || res.status === 202) {
    console.log(`✓ Submitted ${urls.length} URLs — HTTP ${res.status}`)
  } else {
    const body = await res.text()
    throw new Error(`IndexNow returned HTTP ${res.status}: ${body}`)
  }
}

async function main() {
  // Load .env.local if present (dotenv is optional)
  try {
    const dotenv = await import('dotenv')
    dotenv.config({ path: '.env.local' })
  } catch {
    // dotenv not installed — env vars must be set externally
  }

  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '5mtjmb0t',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
    useCdn: false,
    apiVersion: '2024-01-01',
  })

  // Patch getAllUrls to accept sanity client
  const urls = await getAllUrls(sanity)
  console.log(`Submitting ${urls.length} URLs to IndexNow...`)
  await submitToIndexNow(urls)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
