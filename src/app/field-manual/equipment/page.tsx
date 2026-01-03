import { client } from '@/sanity/client'
import { equipmentQuery } from '@/sanity/queries'
import EquipmentClient from './EquipmentClient'

// This is now a Server Component - data fetching happens server-side
export default async function EquipmentPage() {
  // Fetch equipment server-side
  const equipment = await client.fetch(equipmentQuery)

  // Pass data to Client Component for interactive UI
  return <EquipmentClient equipment={equipment} />
}
