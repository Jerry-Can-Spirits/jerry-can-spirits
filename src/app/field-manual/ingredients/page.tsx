import { client } from '@/sanity/client'
import { ingredientsQuery } from '@/sanity/queries'
import IngredientsClient from './IngredientsClient'

// This is now a Server Component - data fetching happens server-side
export default async function IngredientsPage() {
  // Fetch ingredients server-side
  const ingredients = await client.fetch(ingredientsQuery)

  // Pass data to Client Component for interactive UI
  return <IngredientsClient ingredients={ingredients} />
}
