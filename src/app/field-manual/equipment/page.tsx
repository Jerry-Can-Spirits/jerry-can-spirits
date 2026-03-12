import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { equipmentListQuery } from '@/sanity/queries'
import EquipmentClient from './EquipmentClient'
import Breadcrumbs from '@/components/Breadcrumbs'

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
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function EquipmentPage() {
  // Fetch equipment server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/specifications)
  const equipment = await client.fetch(equipmentListQuery)

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
      <EquipmentClient equipment={equipment} />
    </>
  )
}
