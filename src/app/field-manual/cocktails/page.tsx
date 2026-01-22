import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { cocktailsListQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'

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
  return <CocktailsClient cocktails={cocktails} />
}
