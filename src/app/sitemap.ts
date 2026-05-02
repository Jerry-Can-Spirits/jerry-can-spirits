import { MetadataRoute } from 'next'
import { getProducts, getAllCollections, type ShopifyProduct } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'
import {
  cocktailsSitemapQuery,
  equipmentSitemapQuery,
  ingredientsSitemapQuery,
  guidesSitemapQuery
} from '@/sanity/queries'
import { getD1, getAllBatches } from '@/lib/d1'

// Regenerate the sitemap at most once per hour. force-dynamic produced a
// fresh "lastModified" on every Googlebot fetch, which Google treats as a
// fake freshness signal and discards.
export const revalidate = 3600

// Bump when the static-route layout meaningfully changes (new routes,
// removed routes, etc.). Using a literal keeps the timestamp stable across
// requests instead of changing every hour with revalidate.
const STATIC_LAST_MODIFIED = new Date('2026-05-01')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  // Fetch all products from Shopify
  let products: ShopifyProduct[] = []
  try {
    products = await getProducts()
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Generate product URLs from real Shopify updatedAt timestamps
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/shop/product/${product.handle}/`,
    lastModified: product.updatedAt ? new Date(product.updatedAt) : STATIC_LAST_MODIFIED,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch all cocktails from Sanity
  let cocktails: Array<{ slug: { current: string }; _updatedAt: string }> = []
  try {
    cocktails = await client.fetch(cocktailsSitemapQuery)
  } catch (error) {
    console.error('Error fetching cocktails for sitemap:', error)
  }

  const cocktailUrls: MetadataRoute.Sitemap = cocktails.map((cocktail) => ({
    url: `${baseUrl}/field-manual/cocktails/${cocktail.slug.current}/`,
    lastModified: new Date(cocktail._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Fetch all equipment from Sanity
  let equipment: Array<{ slug: { current: string }; _updatedAt: string }> = []
  try {
    equipment = await client.fetch(equipmentSitemapQuery)
  } catch (error) {
    console.error('Error fetching equipment for sitemap:', error)
  }

  const equipmentUrls: MetadataRoute.Sitemap = equipment.map((item) => ({
    url: `${baseUrl}/field-manual/equipment/${item.slug.current}/`,
    lastModified: new Date(item._updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Fetch all ingredients from Sanity
  let ingredients: Array<{ slug: { current: string }; _updatedAt: string }> = []
  try {
    ingredients = await client.fetch(ingredientsSitemapQuery)
  } catch (error) {
    console.error('Error fetching ingredients for sitemap:', error)
  }

  const ingredientUrls: MetadataRoute.Sitemap = ingredients.map((item) => ({
    url: `${baseUrl}/field-manual/ingredients/${item.slug.current}/`,
    lastModified: new Date(item._updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Fetch all guides from Sanity
  let guides: Array<{ slug: { current: string }; _updatedAt: string }> = []
  try {
    guides = await client.fetch(guidesSitemapQuery)
  } catch (error) {
    console.error('Error fetching guides for sitemap:', error)
  }

  const guideUrls: MetadataRoute.Sitemap = guides.map((item) => ({
    url: `${baseUrl}/guides/${item.slug.current}/`,
    lastModified: new Date(item._updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.9, // High priority for SEO-focused content
  }))

  // Fetch dynamic collection URLs — excludes pages already hardcoded above and redirected slugs.
  // Any collection in this set that is also a static route would appear twice in the sitemap.
  const EXCLUDED_COLLECTIONS = new Set([
    // Bespoke collection pages with their own route files
    'spirits', 'barware', 'clothing',
    // Old slugs that 308 → bar-accessories
    'accessories', 'bar-measuring-tools',
    // SEO category pages hardcoded as static routes above
    'rum-gifts', 'spiced-rum', 'cocktail-making-kits', 'bar-accessories',
    'gifts-for-him', 'gifts-for-her', 'rum-glasses', 'hip-flasks',
    'ice-chilling', 'cocktail-glasses-glassware', 'cocktail-shakers',
    'new-releases', 'bundles', 'gift-sets', 'gifts-and-experience',
  ])
  let dynamicCollectionUrls: MetadataRoute.Sitemap = []
  try {
    const allCollections = await getAllCollections()
    dynamicCollectionUrls = allCollections
      .filter(c => !EXCLUDED_COLLECTIONS.has(c.handle))
      .map(c => ({
        url: `${baseUrl}/shop/${c.handle}/`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
  } catch (error) {
    console.error('Error fetching collections for sitemap:', error)
  }

  // Fetch all batches from D1
  let batchUrls: MetadataRoute.Sitemap = []
  try {
    const db = await getD1()
    const batches = await getAllBatches(db)
    batchUrls = batches.map((batch) => ({
      url: `${baseUrl}/batch/${batch.id.replace('batch-', '')}/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Error fetching batches for sitemap:', error)
  }

  // Define all static routes with priorities and change frequencies
  // All URLs include trailing slash to match trailingSlash: true config
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // About pages
    {
      url: `${baseUrl}/about/story/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/team/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/team/dan-freeman/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/team/rhys-williams/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ethos/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Field Manual pages
    {
      url: `${baseUrl}/field-manual/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/field-manual/cocktails/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/field-manual/equipment/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/field-manual/ingredients/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Guides pages
    {
      url: `${baseUrl}/guides/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Contact pages
    {
      url: `${baseUrl}/contact/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact/enquiries/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/media/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/complaints/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Legal & Policy pages
    {
      url: `${baseUrl}/privacy-policy/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-returns/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/accessibility/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/armed-forces-covenant/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    // Careers page
    {
      url: `${baseUrl}/careers/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    // Security policy
    {
      url: `${baseUrl}/security-policy/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    // FAQ page
    {
      url: `${baseUrl}/faq/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Stockists page
    {
      url: `${baseUrl}/stockists/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/trade/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // HTML sitemap
    {
      url: `${baseUrl}/sitemap/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Reviews page
    {
      url: `${baseUrl}/reviews/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Friends & Partners page
    {
      url: `${baseUrl}/friends/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Sustainability & Ingredients pages
    {
      url: `${baseUrl}/sustainability/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ingredients/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ingredients/expedition-spiced-rum/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Giving & community pages
    {
      url: `${baseUrl}/giving/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/expedition-log/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Batch pages
    {
      url: `${baseUrl}/batch/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Shop pages
    {
      url: `${baseUrl}/shop/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/spirits/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/barware/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/clothing/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // SEO category pages
    {
      url: `${baseUrl}/shop/rum-gifts/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/spiced-rum/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/cocktail-making-kits/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/bar-accessories/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/gifts-for-him/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/gifts-for-her/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/rum-glasses/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/hip-flasks/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/ice-chilling/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/cocktail-glasses-glassware/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/cocktail-shakers/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/new-releases/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/bundles/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/gift-sets/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/gifts-and-experience/`,
      lastModified: STATIC_LAST_MODIFIED,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  return [...routes, ...productUrls, ...cocktailUrls, ...equipmentUrls, ...ingredientUrls, ...guideUrls, ...batchUrls, ...dynamicCollectionUrls]
}
