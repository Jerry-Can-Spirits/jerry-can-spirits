import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { ingredientsListQuery } from '@/sanity/queries'
import IngredientsClient from './IngredientsClient'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import HubIndex from '@/components/HubIndex'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Cocktail Ingredients Guide',
  description: 'Ingredient guides for bartenders who want to know what they\'re working with. Spirits, liqueurs, mixers, bitters, and garnishes, explained properly.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/ingredients/',
  },
  openGraph: {
    title: 'Cocktail Ingredients Guide | Jerry Can Spirits®',
    description: 'Ingredient guides for bartenders who want to know what they\'re working with. Spirits, liqueurs, mixers, bitters, and garnishes, explained properly.',
    url: 'https://jerrycanspirits.co.uk/field-manual/ingredients/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Cocktail Ingredients Guide | Jerry Can Spirits®',
    description: 'Ingredient guides for bartenders who want to know what they\'re working with. Spirits, liqueurs, mixers, bitters, and garnishes, explained properly.',
    images: OG_IMAGE,
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function IngredientsPage() {
  // Fetch ingredients server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/storage)
  const ingredients = await client.fetch(ingredientsListQuery, {}, { next: { revalidate: 3600 } })

  // ItemList of URL references only; the full Article schema lives on each
  // ingredient page. Publisher references the site-wide #organization node.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Ingredient Guides',
    description: 'Cocktail ingredient guides: spirits, liqueurs, bitters, mixers, fresh ingredients and garnishes.',
    url: 'https://jerrycanspirits.co.uk/field-manual/ingredients/',
    publisher: { '@id': 'https://jerrycanspirits.co.uk/#organization' },
    numberOfItems: ingredients.length,
    itemListElement: ingredients.map((item: { name: string; slug: { current: string } }, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: `https://jerrycanspirits.co.uk/field-manual/ingredients/${item.slug.current}/`,
    })),
  }

  // Pass data to Client Component for interactive UI
  return (
    <>
      <StructuredData data={itemListSchema} id="ingredients-itemlist-schema" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Ingredients' },
          ]}
        />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Premium Ingredients
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Quality Components
            <br />
            <span className="text-gold-300">Exceptional Results</span>
          </h1>
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Every great cocktail starts with quality ingredients. Discover our carefully curated selection
            of spirits, mixers, and fresh components that elevate your home bar.
          </p>
        </div>
      </section>
      <Suspense>
        <IngredientsClient ingredients={ingredients} />
      </Suspense>
      <HubIndex
        heading={`All ${ingredients.length} ingredients, A to Z`}
        items={ingredients.map((i: { name: string; slug: { current: string } }) => ({
          name: i.name,
          href: `/field-manual/ingredients/${i.slug.current}/`,
        }))}
      />
    </>
  )
}
