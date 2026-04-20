import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { client } from '@/sanity/lib/client'
import { getProducts } from '@/lib/shopify'
import { searchStaticPages, type SearchResult } from '@/lib/search-content'
import Breadcrumbs from '@/components/Breadcrumbs'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search results for "${q}"` : 'Search',
    description: q ? `Search results for "${q}" on Jerry Can Spirits.` : 'Search Jerry Can Spirits for products, cocktails, guides and more.',
    robots: { index: false, follow: true },
  }
}

const LOGO = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/images-logo-webp/public'

const TYPE_LABELS: Record<SearchResult['type'], string> = {
  product: 'Product',
  recipe: 'Cocktail',
  ingredient: 'Ingredient',
  equipment: 'Equipment',
  guide: 'Guide',
  page: 'Page',
}

const TYPE_ORDER: SearchResult['type'][] = ['product', 'recipe', 'ingredient', 'equipment', 'guide', 'page']

async function runSearch(query: string): Promise<SearchResult[]> {
  const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (!tokens.length) return []

  const sanityTerm = tokens.length > 1 ? query.trim() : `*${query.trim()}*`
  const results: SearchResult[] = []
  const seen = new Set<string>()

  const add = (items: SearchResult[]) => {
    for (const item of items) {
      if (!seen.has(item.url)) {
        seen.add(item.url)
        results.push(item)
      }
    }
  }

  // Static pages
  add(searchStaticPages(tokens))

  // Shopify products
  try {
    const products = await getProducts()
    add(
      products
        .filter(p => {
          const text = [p.title, p.description, ...(p.tags ?? [])].join(' ').toLowerCase()
          return tokens.every(t => text.includes(t))
        })
        .map(p => ({
          type: 'product' as const,
          title: p.title,
          description: p.description?.substring(0, 120),
          url: `/shop/product/${p.handle}`,
          image: p.images[0]?.url,
          category: 'Shop',
        }))
    )
  } catch { /* non-fatal */ }

  // Sanity cocktails
  try {
    const cocktails = await client.fetch<Array<{ name: string; slug: { current: string }; description: string; category?: string; image?: string }>>(
      `*[_type == "cocktail" && (name match $t || description match $t)] | order(_createdAt desc) [0...10] { name, slug, description, category, "image": image.asset->url }`,
      { t: sanityTerm }
    )
    add(cocktails.map(c => ({
      type: 'recipe' as const,
      title: c.name,
      description: c.description,
      url: `/field-manual/cocktails/${c.slug.current}/`,
      image: c.image,
      category: c.category ?? 'Cocktails',
    })))
  } catch { /* non-fatal */ }

  // Sanity ingredients
  try {
    const ingredients = await client.fetch<Array<{ name: string; slug: { current: string }; description: string; category?: string; image?: string }>>(
      `*[_type == "ingredient" && (name match $t || description match $t || usage match $t)] | order(_createdAt desc) [0...10] { name, slug, description, category, "image": image.asset->url }`,
      { t: sanityTerm }
    )
    add(ingredients.map(i => ({
      type: 'ingredient' as const,
      title: i.name,
      description: i.description,
      url: `/field-manual/ingredients/${i.slug.current}/`,
      image: i.image,
      category: i.category ?? 'Ingredients',
    })))
  } catch { /* non-fatal */ }

  // Sanity equipment
  try {
    const equipment = await client.fetch<Array<{ name: string; slug: { current: string }; description: string; category?: string; image?: string }>>(
      `*[_type == "equipment" && (name match $t || description match $t || usage match $t)] | order(_createdAt desc) [0...10] { name, slug, description, category, "image": image.asset->url }`,
      { t: sanityTerm }
    )
    add(equipment.map(e => ({
      type: 'equipment' as const,
      title: e.name,
      description: e.description,
      url: `/field-manual/equipment/${e.slug.current}/`,
      image: e.image,
      category: e.category ?? 'Equipment',
    })))
  } catch { /* non-fatal */ }

  // Sanity guides
  try {
    const guides = await client.fetch<Array<{ title: string; slug: { current: string }; excerpt: string; category?: string; image?: string }>>(
      `*[_type == "guide" && (title match $t || excerpt match $t)] | order(publishedAt desc) [0...10] { title, slug, excerpt, category, "image": heroImage.asset->url }`,
      { t: sanityTerm }
    )
    add(guides.map(g => ({
      type: 'guide' as const,
      title: g.title,
      description: g.excerpt,
      url: `/guides/${g.slug.current}/`,
      image: g.image,
      category: g.category ?? 'Guides',
    })))
  } catch { /* non-fatal */ }

  // Sort by type priority
  return results.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type))
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const results = query ? await runSearch(query) : []

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Search' }]} />

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">
          {query ? `Results for "${query}"` : 'Search'}
        </h1>

        {/* Search form */}
        <form action="/search" method="GET" className="mb-10">
          <label htmlFor="search-input" className="sr-only">Search</label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-300" aria-hidden="true" />
            <input
              id="search-input"
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search products, cocktails, guides..."
              autoFocus={!query}
              className="w-full pl-12 pr-4 py-4 bg-jerry-green-800/40 border border-gold-500/30 rounded-xl text-white placeholder-parchment-400 text-lg focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>
        </form>

        {/* Results */}
        {query ? (
          results.length > 0 ? (
            <div className="space-y-2">
              <p className="text-parchment-400 text-sm mb-6">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.map((result, i) => (
                <Link
                  key={i}
                  href={result.url}
                  className="flex items-start gap-4 p-4 rounded-xl bg-jerry-green-800/20 border border-gold-500/10 hover:border-gold-500/30 hover:bg-jerry-green-800/40 transition-all group"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-jerry-green-800/60 border border-gold-500/10 flex items-center justify-center">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt=""
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        sizes="56px"
                      />
                    ) : (
                      <Image
                        src={LOGO}
                        alt=""
                        width={32}
                        height={32}
                        className="object-contain opacity-40"
                        sizes="32px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                        {TYPE_LABELS[result.type]}
                      </span>
                      {result.category && result.category !== TYPE_LABELS[result.type] && (
                        <span className="text-xs text-parchment-500">{result.category}</span>
                      )}
                    </div>
                    <h2 className="font-semibold text-parchment-50 group-hover:text-gold-300 transition-colors leading-snug">
                      {result.title}
                    </h2>
                    {result.description && (
                      <p className="text-sm text-parchment-400 mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-gold-500/40 group-hover:text-gold-400 transition-colors text-lg mt-1" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <MagnifyingGlassIcon className="w-12 h-12 text-gold-300/20 mx-auto mb-4" aria-hidden="true" />
              <p className="text-parchment-300 text-lg mb-2">No results for &ldquo;{query}&rdquo;</p>
              <p className="text-parchment-500 text-sm">
                Try a different term, or{' '}
                <Link href="/field-manual/" className="text-gold-400 hover:text-gold-300 underline">
                  browse the Field Manual
                </Link>
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-20">
            <MagnifyingGlassIcon className="w-12 h-12 text-gold-300/20 mx-auto mb-4" aria-hidden="true" />
            <p className="text-parchment-400">Enter a search term above to get started.</p>
          </div>
        )}
      </div>
    </main>
  )
}
