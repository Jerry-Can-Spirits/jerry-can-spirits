import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/client'
import { equipmentListQuery } from '@/sanity/queries'
import EquipmentClient from './EquipmentClient'
import Breadcrumbs from '@/components/Breadcrumbs'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Bar Equipment Guide',
  description: 'Bar tools and equipment for serious home bartenders. Guides on cocktail shakers, strainers, glassware, and everything else that earns its place on the bar.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/equipment/',
  },
  openGraph: {
    title: 'Bar Equipment Guide | Jerry Can Spirits®',
    description: 'Bar tools and equipment for serious home bartenders. Guides on cocktail shakers, strainers, glassware, and everything else that earns its place on the bar.',
    url: 'https://jerrycanspirits.co.uk/field-manual/equipment/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Bar Equipment Guide | Jerry Can Spirits®',
    description: 'Bar tools and equipment for serious home bartenders. Guides on cocktail shakers, strainers, glassware, and everything else that earns its place on the bar.',
    images: OG_IMAGE,
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function EquipmentPage() {
  // Fetch equipment server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/specifications)
  const equipment = await client.fetch(equipmentListQuery, {}, { next: { revalidate: 3600 } })

  // Pass data to Client Component for interactive UI
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Equipment' },
          ]}
        />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Essential Barware
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Tools of the Trade
            <br />
            <span className="text-gold-300">Engineered for Excellence</span>
          </h1>
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Professional-grade equipment doesn&apos;t require professional budgets. Discover the essential tools
            that transform good ingredients into exceptional cocktails.
          </p>
        </div>
      </section>
      <Suspense>
        <EquipmentClient equipment={equipment} />
      </Suspense>
    </>
  )
}
