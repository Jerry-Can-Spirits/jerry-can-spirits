import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { barIndexQuery, barIngredientsQuery } from '@/sanity/queries'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'
import Breadcrumbs from '@/components/Breadcrumbs'
import { baseOpenGraph } from '@/lib/og'
import BarClient from './BarClient'

const description =
  'Mark the bottles you own and see which cocktails you can make now, and which you are one bottle away from. A free tool from the Jerry Can Spirits Field Manual.'

export const metadata: Metadata = {
  title: "What's in My Bar",
  description,
  alternates: { canonical: 'https://jerrycanspirits.co.uk/field-manual/whats-in-my-bar/' },
  openGraph: {
    ...baseOpenGraph,
    title: "What's in My Bar | Jerry Can Spirits®",
    description,
    url: 'https://jerrycanspirits.co.uk/field-manual/whats-in-my-bar/',
  },
}

export default async function WhatsInMyBarPage() {
  const [cocktails, ingredients] = await Promise.all([
    client.fetch<RawCocktail[]>(barIndexQuery, {}, { next: { revalidate: 3600 } }),
    client.fetch<RawIngredient[]>(barIngredientsQuery, {}, { next: { revalidate: 3600 } }),
  ])
  const barData = buildBarData(cocktails, ingredients)

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs items={[{ label: 'Field Manual', href: '/field-manual/' }, { label: "What's in My Bar" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-3">What&apos;s in my bar</h1>
        <p className="text-lg text-parchment-300 max-w-3xl">
          Stock your backbar, and see what you can pour tonight. Tap a bottle to add it to your shelf.
        </p>
      </div>
      <Suspense>
        <BarClient data={barData} />
      </Suspense>
    </>
  )
}
