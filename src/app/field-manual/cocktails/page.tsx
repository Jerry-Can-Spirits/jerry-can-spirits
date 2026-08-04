import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { cocktailsListQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'
import HubIndex from '@/components/HubIndex'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Cocktail Recipes',
  description: 'Cocktail recipes from the Jerry Can Spirits Field Manual. From the simple to the technical, each recipe built around real ingredients and proper technique.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
  },
  openGraph: {
    title: 'Cocktail Recipes | Jerry Can Spirits®',
    description: 'Cocktail recipes from the Jerry Can Spirits Field Manual. From the simple to the technical, each recipe built around real ingredients and proper technique.',
    url: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Cocktail Recipes | Jerry Can Spirits®',
    description: 'Cocktail recipes from the Jerry Can Spirits Field Manual. From the simple to the technical, each recipe built around real ingredients and proper technique.',
    images: OG_IMAGE,
  },
}

interface CocktailListItem {
  _id: string
  name: string
  slug: { current: string }
  description: string
  difficulty: string
  family: string
  baseSpirit: string
  tags: string[]
  featured: boolean
  image: string | null
  imageAlt: string | null
}

// Cut at the last word boundary at or before `max`, so a card never ends
// mid-word. Returns the original when it is already short enough, so short
// descriptions are untouched rather than re-allocated.
function truncateOnWord(text: string, max: number): string {
  if (!text || text.length <= max) return text
  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()
}

// This is now a Server Component - data fetching happens server-side
export default async function CocktailsPage() {
  // Fetch cocktails server-side using optimized list query
  // Only fetches fields needed for preview cards (not full ingredients/instructions)
  const fetched: CocktailListItem[] = await client.fetch(cocktailsListQuery, {}, { next: { revalidate: 3600 } })

  // The card clamps description to three lines (line-clamp-3), roughly 150
  // characters, but the mean description is 1,002. The rest was serialised
  // into the flight payload purely to be hidden by CSS: description alone was
  // 350 kB of a 457 kB list payload, 77% of it. Truncating before the props
  // cross the server/client boundary is the whole saving.
  //
  // 180 rather than the card's ~150: the client search box matches description
  // text, so a little surplus above the clamp keeps search useful until the
  // dedicated search index lands. 300 was measured too and cost 42 kB more for
  // 5 points less reduction, buying searchable text that the search index will
  // make redundant anyway.
  const cocktails: CocktailListItem[] = fetched.map((c) => ({
    ...c,
    description: truncateOnWord(c.description, 180),
  }))

  // Build ItemList schema for recipe collection
  // Note: Using URL references instead of inline Recipe objects to avoid
  // incomplete Recipe validation errors in Google Search Console.
  // Full Recipe schema is provided on each individual cocktail page.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Cocktail Recipes',
    description: 'Rum cocktail recipes from classic serves to signature creations.',
    url: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
    numberOfItems: cocktails.length,
    itemListElement: cocktails.map((cocktail, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: cocktail.name,
      url: `https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.slug.current}/`,
    })),
  }

  // Pass data to Client Component for interactive UI
  return (
    <>
      <StructuredData data={itemListSchema} id="cocktails-itemlist-schema" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Cocktails' },
          ]}
        />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Cocktail Collection
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Master the Classics
            <br />
            <span className="text-gold-300">Engineer New Adventures</span>
          </h1>
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Each cocktail is carefully crafted to highlight quality spirits and balanced flavours.
            Start with the classics, then explore our signature variations designed for the modern explorer.
          </p>
        </div>
      </section>
      <Suspense>
        <CocktailsClient cocktails={cocktails} />
      </Suspense>
      <HubIndex
        heading={`All ${cocktails.length} cocktails, A to Z`}
        items={cocktails.map((c) => ({ name: c.name, href: `/field-manual/cocktails/${c.slug.current}/` }))}
      />
    </>
  )
}
