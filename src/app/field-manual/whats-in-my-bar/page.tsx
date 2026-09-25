import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { barIndexQuery, barIngredientsQuery } from '@/sanity/queries'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
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
    // One dark band: the backbar cabinet is drawn in its own wood hexes,
    // which no light-band token can re-point, so the tool stays on the
    // ground it was painted for. BarClient carries the bottom padding.
    <section className="band-dark pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'Field Manual', href: '/field-manual/' }, { label: "What's in My Bar" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          as="h1"
          intro="Stock your backbar, and see what you can pour tonight. Tap a bottle to add it to your shelf."
        >
          What&apos;s in my bar
        </SectionHeading>
      </div>
      <Suspense>
        <BarClient data={barData} />
      </Suspense>
    </section>
  )
}
