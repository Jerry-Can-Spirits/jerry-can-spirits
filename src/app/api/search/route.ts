import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'

export const runtime = 'edge'

interface SearchResult {
  type: 'product' | 'page' | 'recipe' | 'equipment' | 'ingredient' | 'guide'
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

interface SanityEquipment {
  _id: string
  name: string
  slug: { current: string }
  description: string
  usage: string
  category?: string
  image?: string
}

interface SanityIngredient {
  _id: string
  name: string
  slug: { current: string }
  description: string
  usage: string
  category?: string
  image?: string
}

interface SanityGuide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category?: string
  image?: string
}

// Static searchable pages
const searchablePages: SearchResult[] = [
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey', url: '/about/story', category: 'About' },
  { type: 'page', title: 'Team', description: 'Meet the Jerry Can Spirits team', url: '/about/team', category: 'About' },
  { type: 'page', title: 'Dan Freeman', description: 'Director & Founder - Royal Engineer, distiller, and spirits enthusiast', url: '/about/team/dan-freeman', category: 'Team' },
  { type: 'page', title: 'Ethos', description: 'Our values and craftsmanship', url: '/ethos', category: 'About' },
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes and guides', url: '/field-manual', category: 'Resources' },
  { type: 'page', title: 'Guides', description: 'Expert spirits guides and tutorials', url: '/guides', category: 'Resources' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails', url: '/field-manual/cocktails', category: 'Field Manual' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware', url: '/field-manual/equipment', category: 'Field Manual' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and components', url: '/field-manual/ingredients', category: 'Field Manual' },
  { type: 'page', title: 'Contact', description: 'Get in touch with us', url: '/contact', category: 'Support' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions', url: '/faq', category: 'Support' },
  { type: 'page', title: 'Drinks', description: 'Premium rum collection', url: '/shop/drinks', category: 'Shop' },
  { type: 'page', title: 'Barware', description: 'Bar tools and equipment', url: '/shop/barware', category: 'Shop' },
  { type: 'page', title: 'Clothing', description: 'Adventure apparel', url: '/shop/clothing', category: 'Shop' },
]

// Sanity search queries
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

const equipmentSearchQuery = `*[_type == "equipment" && (
  name match $searchTerm ||
  description match $searchTerm ||
  usage match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  usage,
  category,
  "image": image.asset->url
}`

const ingredientsSearchQuery = `*[_type == "ingredient" && (
  name match $searchTerm ||
  description match $searchTerm ||
  usage match $searchTerm ||
  category match $searchTerm
)] | order(_createdAt desc) [0...10] {
  _id,
  name,
  slug,
  description,
  usage,
  category,
  "image": image.asset->url
}`

const guidesSearchQuery = `*[_type == "guide" && (
  title match $searchTerm ||
  excerpt match $searchTerm ||
  introduction match $searchTerm ||
  category match $searchTerm
)] | order(publishedAt desc) [0...10] {
  _id,
  title,
  slug,
  excerpt,
  category,
  "image": heroImage.asset->url
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
        url: `/cocktails/${cocktail.slug.current}`,
        image: cocktail.image,
        category: cocktail.category || 'Cocktails',
      }))
      results.push(...cocktailMatches)
    } catch (error) {
      console.error('Error searching Sanity cocktails:', error)
    }

    // Search Sanity equipment
    try {
      const equipment = await client.fetch(equipmentSearchQuery, {
        searchTerm: `*${query}*`
      })

      const equipmentMatches = equipment.map((item: SanityEquipment) => ({
        type: 'equipment' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/equipment/${item.slug.current}`,
        image: item.image,
        category: item.category || 'Equipment',
      }))
      results.push(...equipmentMatches)
    } catch (error) {
      console.error('Error searching Sanity equipment:', error)
    }

    // Search Sanity ingredients
    try {
      const ingredients = await client.fetch(ingredientsSearchQuery, {
        searchTerm: `*${query}*`
      })

      const ingredientMatches = ingredients.map((item: SanityIngredient) => ({
        type: 'ingredient' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/ingredients/${item.slug.current}`,
        image: item.image,
        category: item.category || 'Ingredients',
      }))
      results.push(...ingredientMatches)
    } catch (error) {
      console.error('Error searching Sanity ingredients:', error)
    }

    // Search Sanity guides
    try {
      const guides = await client.fetch(guidesSearchQuery, {
        searchTerm: `*${query}*`
      })

      const guideMatches = guides.map((item: SanityGuide) => ({
        type: 'guide' as const,
        title: item.title,
        description: item.excerpt,
        url: `/guides/${item.slug.current}`,
        image: item.image,
        category: item.category ? item.category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Guides',
      }))
      results.push(...guideMatches)
    } catch (error) {
      console.error('Error searching Sanity guides:', error)
    }

    // Limit total results and return
    return NextResponse.json({ results: results.slice(0, 12) })
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
