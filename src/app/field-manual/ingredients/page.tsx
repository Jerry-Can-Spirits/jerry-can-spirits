import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/client'
import { ingredientsListQuery } from '@/sanity/queries'
import IngredientsClient from './IngredientsClient'
import Breadcrumbs from '@/components/Breadcrumbs'
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
}

// This is now a Server Component - data fetching happens server-side
export default async function IngredientsPage() {
  // Fetch ingredients server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/storage)
  const ingredients = await client.fetch(ingredientsListQuery, {}, { next: { revalidate: 3600 } })

  // Pass data to Client Component for interactive UI
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Ingredients' },
          ]}
        />
      </div>
      <Suspense>
        <IngredientsClient ingredients={ingredients} />
      </Suspense>
    </>
  )
}
