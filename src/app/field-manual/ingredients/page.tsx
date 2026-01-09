import { client } from '@/sanity/client'
import { ingredientsListQuery } from '@/sanity/queries'
import IngredientsClient from './IngredientsClient'

// This is now a Server Component - data fetching happens server-side
export default async function IngredientsPage() {
  // Fetch ingredients server-side using optimized list query
  // Only fetches fields needed for preview cards (not full usage/tips/storage)
  const ingredients = await client.fetch(ingredientsListQuery)

  // Pass data to Client Component for interactive UI
  return <IngredientsClient ingredients={ingredients} />
}
