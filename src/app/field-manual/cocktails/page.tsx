import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { cocktailsListQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: 'Cocktail Recipes',
  description: 'Discover our collection of rum cocktail recipes. From classic serves to signature creations, find the perfect drink for any occasion.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
  },
  openGraph: {
    title: 'Cocktail Recipes | Jerry Can Spirits®',
    description: 'Discover our collection of rum cocktail recipes. From classic serves to signature creations, find the perfect drink for any occasion.',
    url: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function CocktailsPage() {
  // Fetch cocktails server-side using optimized list query
  // Only fetches fields needed for preview cards (not full ingredients/instructions)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cocktails: any[] = await client.fetch(cocktailsListQuery)

  // Build ItemList schema for recipe collection
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
      item: {
        '@type': 'Recipe',
        name: cocktail.name,
        url: `https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.slug.current}/`,
        description: cocktail.description || `${cocktail.name} cocktail recipe`,
        image: cocktail.image || '',
      },
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
      <CocktailsClient cocktails={cocktails} />
    </>
  )
}
