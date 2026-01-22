import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { ingredientsListQuery } from '@/sanity/queries'
import IngredientsClient from './IngredientsClient'

export const metadata: Metadata = {
  title: 'Cocktail Ingredients Guide',
  description: 'Comprehensive guide to cocktail ingredients. Learn about spirits, liqueurs, mixers, bitters, and garnishes to elevate your home bar and craft perfect drinks.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/ingredients/',
  },
  openGraph: {
    title: 'Cocktail Ingredients Guide | Jerry Can Spirits®',
    description: 'Comprehensive guide to cocktail ingredients for perfect drinks.',
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function IngredientsPage() {
  // Fetch ingredients server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/storage)
  const ingredients = await client.fetch(ingredientsListQuery)

  // Pass data to Client Component for interactive UI
  return <IngredientsClient ingredients={ingredients} />
}
