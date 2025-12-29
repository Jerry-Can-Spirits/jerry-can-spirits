import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'

export const runtime = 'edge'

interface SearchResult {
  type: 'product' | 'page' | 'recipe'
  title: string
  description?: string
  url: string
  image?: string
  category?: string
}

interface SanityCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  category?: string
  image?: string
}

// Static searchable pages
const searchablePages: SearchResult[] = [
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey', url: '/about/story', category: 'About' },
  { type: 'page', title: 'Ethos', description: 'Our values and craftsmanship', url: '/ethos', category: 'About' },
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes and guides', url: '/field-manual', category: 'Resources' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails', url: '/field-manual/cocktails', category: 'Field Manual' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware', url: '/field-manual/equipment', category: 'Field Manual' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and components', url: '/field-manual/ingredients', category: 'Field Manual' },
  { type: 'page', title: 'Contact', description: 'Get in touch with us', url: '/contact', category: 'Support' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions', url: '/faq', category: 'Support' },
  { type: 'page', title: 'Drinks', description: 'Premium rum collection', url: '/shop/drinks', category: 'Shop' },
  { type: 'page', title: 'Barware', description: 'Bar tools and equipment', url: '/shop/barware', category: 'Shop' },
  { type: 'page', title: 'Clothing', description: 'Adventure apparel', url: '/shop/clothing', category: 'Shop' },
]

// Cocktails query for Sanity
const cocktailsSearchQuery = `*[_type == "cocktail" && (
  name match $searchTerm ||
  description match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  category,
  "image": image.asset->url
}`

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.toLowerCase()
    const results: SearchResult[] = []

    // Search static pages
    const pageMatches = searchablePages.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery)
      const descMatch = item.description?.toLowerCase().includes(searchQuery)
      const categoryMatch = item.category?.toLowerCase().includes(searchQuery)
      return titleMatch || descMatch || categoryMatch
    })
    results.push(...pageMatches)

    // Search Shopify products (skip if credentials not configured)
    if (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      try {
        const products = await getProducts()
        const productMatches = products
          .filter(product => {
            const titleMatch = product.title.toLowerCase().includes(searchQuery)
            const descMatch = product.description.toLowerCase().includes(searchQuery)
            const tagMatch = product.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
            return titleMatch || descMatch || tagMatch
          })
          .map(product => ({
            type: 'product' as const,
            title: product.title,
            description: product.description.substring(0, 100) + (product.description.length > 100 ? '...' : ''),
            url: `/shop/product/${product.handle}`,
            image: product.images[0]?.url,
            category: 'Shop',
          }))
        results.push(...productMatches)
      } catch (error) {
        console.error('Error searching Shopify products:', error)
      }
    }

    // Search Sanity cocktails
    try {
      const cocktails = await client.fetch(cocktailsSearchQuery, {
        searchTerm: `*${query}*`
      })

      const cocktailMatches = cocktails.map((cocktail: SanityCocktail) => ({
        type: 'recipe' as const,
        title: cocktail.name,
        description: cocktail.description,
        url: `/field-manual/cocktails#${cocktail.slug.current}`,
        image: cocktail.image,
        category: cocktail.category || 'Cocktails',
      }))
      results.push(...cocktailMatches)
    } catch (error) {
      console.error('Error searching Sanity cocktails:', error)
    }

    // Limit total results and return
    return NextResponse.json({ results: results.slice(0, 12) })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
