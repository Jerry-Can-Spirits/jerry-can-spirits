import { MetadataRoute } from 'next'
import { getProducts, getAllCollections, type ShopifyProduct } from '@/lib/shopify'
import { client } from '@/sanity/client'
import {
  cocktailsSitemapQuery,
  equipmentSitemapQuery,
  ingredientsSitemapQuery,
  guidesSitemapQuery
} from '@/sanity/queries'
import { getD1, getAllBatches } from '@/lib/d1'

// Ensure sitemap works on Cloudflare Pages Edge Runtime
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  // Get current date for lastModified
  const currentDate = new Date()

  // Fetch all products from Shopify
  let products: ShopifyProduct[] = []
  try {
    products = await getProducts()
  } catch (error) {
    console.error('Error fetching products for sitemap:', error)
  }

  // Generate product URLs dynamically (with trailing slash to match trailingSlash config)
  const productUrls: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${baseUrl}/shop/product/${product.handle}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch all cocktails from Sanity (optimized - only slug field)
  let cocktails: Array<{ slug: { current: string } }> = []
  try {
    cocktails = await client.fetch(cocktailsSitemapQuery)
  } catch (error) {
    console.error('Error fetching cocktails for sitemap:', error)
  }

  // Generate cocktail URLs dynamically (with trailing slash)
  const cocktailUrls: MetadataRoute.Sitemap = cocktails.map((cocktail) => ({
    url: `${baseUrl}/field-manual/cocktails/${cocktail.slug.current}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Fetch all equipment from Sanity (optimized - only slug field)
  let equipment: Array<{ slug: { current: string } }> = []
  try {
    equipment = await client.fetch(equipmentSitemapQuery)
  } catch (error) {
    console.error('Error fetching equipment for sitemap:', error)
  }

  // Generate equipment URLs dynamically (with trailing slash)
  const equipmentUrls: MetadataRoute.Sitemap = equipment.map((item) => ({
    url: `${baseUrl}/field-manual/equipment/${item.slug.current}/`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Fetch all ingredients from Sanity (optimized - only slug field)
  let ingredients: Array<{ slug: { current: string } }> = []
  try {
    ingredients = await client.fetch(ingredientsSitemapQuery)
  } catch (error) {
    console.error('Error fetching ingredients for sitemap:', error)
  }

  // Generate ingredient URLs dynamically (with trailing slash)
  const ingredientUrls: MetadataRoute.Sitemap = ingredients.map((item) => ({
    url: `${baseUrl}/field-manual/ingredients/${item.slug.current}/`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Fetch all guides from Sanity (optimized - only slug field)
  let guides: Array<{ slug: { current: string } }> = []
  try {
    guides = await client.fetch(guidesSitemapQuery)
  } catch (error) {
    console.error('Error fetching guides for sitemap:', error)
  }

  // Generate guide URLs dynamically (HIGH PRIORITY for SEO, with trailing slash)
  const guideUrls: MetadataRoute.Sitemap = guides.map((item) => ({
    url: `${baseUrl}/guides/${item.slug.current}/`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9, // High priority for SEO-focused content
  }))

  // Fetch dynamic collection URLs (excludes bespoke pages and redirected old slugs)
  const EXCLUDED_COLLECTIONS = new Set([
    'spirits', 'barware', 'clothing',
    'accessories', 'bar-measuring-tools', // 308 → /shop/bar-accessories/
  ])
  let dynamicCollectionUrls: MetadataRoute.Sitemap = []
  try {
    const allCollections = await getAllCollections()
    dynamicCollectionUrls = allCollections
      .filter(c => !EXCLUDED_COLLECTIONS.has(c.handle))
      .map(c => ({
        url: `${baseUrl}/shop/${c.handle}/`,
        lastModified: currentDate,
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
      lastModified: currentDate,
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
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    // About pages
    {
      url: `${baseUrl}/about/story/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/team/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about/team/dan-freeman/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about/team/rhys-williams/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ethos/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Field Manual pages
    {
      url: `${baseUrl}/field-manual/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/field-manual/cocktails/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/field-manual/equipment/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/field-manual/ingredients/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Guides pages
    {
      url: `${baseUrl}/guides/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // Contact pages
    {
      url: `${baseUrl}/contact/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact/enquiries/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/media/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact/complaints/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Legal & Policy pages
    {
      url: `${baseUrl}/privacy-policy/`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service/`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookie-policy/`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/shipping-returns/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/accessibility/`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/armed-forces-covenant/`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    // Careers page
    {
      url: `${baseUrl}/careers/`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    // Security policy
    {
      url: `${baseUrl}/security-policy/`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    // FAQ page
    {
      url: `${baseUrl}/faq/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Stockists page
    {
      url: `${baseUrl}/stockists/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/trade/`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    // HTML sitemap
    {
      url: `${baseUrl}/sitemap/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    // Reviews page
    {
      url: `${baseUrl}/reviews/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Friends & Partners page
    {
      url: `${baseUrl}/friends/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Sustainability & Ingredients pages
    {
      url: `${baseUrl}/sustainability/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ingredients/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/ingredients/expedition-spiced-rum/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Giving & community pages
    {
      url: `${baseUrl}/giving/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/expedition-log/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Batch pages
    {
      url: `${baseUrl}/batch/`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    // Shop pages
    {
      url: `${baseUrl}/shop/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/spirits/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/barware/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/clothing/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // SEO category pages
    {
      url: `${baseUrl}/shop/rum-gifts/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/spiced-rum/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/cocktail-making-kits/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/bar-accessories/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/gifts-for-him/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/gifts-for-her/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/rum-glasses/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/hip-flasks/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/ice-chilling/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/cocktail-glasses-glassware/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/cocktail-shakers/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shop/new-releases/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/bundles/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/gift-sets/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/shop/gifts-and-experience/`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]

  return [...routes, ...productUrls, ...cocktailUrls, ...equipmentUrls, ...ingredientUrls, ...guideUrls, ...batchUrls, ...dynamicCollectionUrls]
}
