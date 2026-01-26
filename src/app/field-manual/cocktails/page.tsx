import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { cocktailsListQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: 'Cocktail Recipes',
  description: 'Discover our collection of rum cocktail recipes. From classic serves to signature creations, find the perfect drink for any occasion.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/cocktails/',
  },
  openGraph: {
    title: 'Cocktail Recipes | Jerry Can Spirits®',
    description: 'Discover our collection of rum cocktail recipes for any occasion.',
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function CocktailsPage() {
  // Fetch cocktails server-side using optimized list query
  // Only fetches fields needed for preview cards (not full ingredients/instructions)
  const cocktails = await client.fetch(cocktailsListQuery)

  // Pass data to Client Component for interactive UI
  return (
    <>
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
