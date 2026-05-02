import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isRateLimited } from '@/lib/kv'
import { getProducts } from '@/lib/shopify'
import { client } from '@/sanity/lib/client'
import { searchStaticPages, type SearchResult } from '@/lib/search-content'

const SEARCH_RATE_LIMIT = 20

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
    const { env } = await getCloudflareContext()
    const ip = (request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
    const kv = env.SITE_OPS as KVNamespace
    if (await isRateLimited(kv, 'search', ip, SEARCH_RATE_LIMIT, 60)) {
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
    }

    const searchParams = request.nextUrl.searchParams
    const rawQuery = searchParams.get('q')

    if (!rawQuery || rawQuery.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Cap length and strip non-alphanumeric/space characters before
    // building the GROQ wildcard expression. `match` on a parameterised
    // value is safe from operator-injection, but pathological inputs like
    // 10MB strings or `***...` patterns can still degrade Sanity perf.
    const query = rawQuery.trim().slice(0, 80).replace(/[^A-Za-z0-9 ]+/g, ' ').trim()
    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const searchQuery = query.toLowerCase()
    const searchTokens = searchQuery.split(/\s+/).filter(Boolean)
    const sanitySearchTerm = searchTokens.length > 1 ? query : `*${query}*`
    const results: SearchResult[] = []

    // Search static pages
    results.push(...searchStaticPages(searchTokens))

    // Search Shopify products (skip if credentials not configured)
    if (process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN && process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
      try {
        const products = await getProducts()
        const productMatches = products
          .filter(product => {
            const text = [product.title, product.description, ...(product.tags || [])].join(' ').toLowerCase()
            return searchTokens.every(token => text.includes(token))
          })
          .map(product => ({
            type: 'product' as const,
            title: product.title,
            description: product.description.substring(0, 100) + (product.description.length > 100 ? '...' : ''),
            url: `/shop/product/${product.handle}/`,
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
        searchTerm: sanitySearchTerm
      })

      const cocktailMatches = cocktails.map((cocktail: SanityCocktail) => ({
        type: 'recipe' as const,
        title: cocktail.name,
        description: cocktail.description,
        url: `/field-manual/cocktails/${cocktail.slug.current}/`,
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
        searchTerm: sanitySearchTerm
      })

      const equipmentMatches = equipment.map((item: SanityEquipment) => ({
        type: 'equipment' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/equipment/${item.slug.current}/`,
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
        searchTerm: sanitySearchTerm
      })

      const ingredientMatches = ingredients.map((item: SanityIngredient) => ({
        type: 'ingredient' as const,
        title: item.name,
        description: item.description,
        url: `/field-manual/ingredients/${item.slug.current}/`,
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
        searchTerm: sanitySearchTerm
      })

      const guideMatches = guides.map((item: SanityGuide) => ({
        type: 'guide' as const,
        title: item.title,
        description: item.excerpt,
        url: `/guides/${item.slug.current}/`,
        image: item.image,
        category: item.category ? item.category.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Guides',
      }))
      results.push(...guideMatches)
    } catch (error) {
      console.error('Error searching Sanity guides:', error)
    }

    // Limit total results and return. Cache identical queries briefly in
    // the user's browser to absorb the inevitable double-search spam.
    return NextResponse.json(
      { results: results.slice(0, 12) },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    )
  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 })
  }
}
