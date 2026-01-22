import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { equipmentListQuery } from '@/sanity/queries'
import EquipmentClient from './EquipmentClient'

export const metadata: Metadata = {
  title: 'Bar Equipment Guide',
  description: 'Essential bar tools and equipment for crafting perfect cocktails at home. From shakers to strainers to glassware, find everything you need for your bar.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/equipment/',
  },
  openGraph: {
    title: 'Bar Equipment Guide | Jerry Can Spirits®',
    description: 'Essential bar tools and equipment for crafting perfect cocktails.',
  },
}

// This is now a Server Component - data fetching happens server-side
export default async function EquipmentPage() {
  // Fetch equipment server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/specifications)
  const equipment = await client.fetch(equipmentListQuery)

  // Pass data to Client Component for interactive UI
  return <EquipmentClient equipment={equipment} />
}
