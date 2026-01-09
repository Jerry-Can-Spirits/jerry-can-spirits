import { client } from '@/sanity/client'
import { cocktailsListQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'

// This is now a Server Component - data fetching happens server-side
export default async function CocktailsPage() {
  // Fetch cocktails server-side using optimized list query
  // Only fetches fields needed for preview cards (not full ingredients/instructions)
  const cocktails = await client.fetch(cocktailsListQuery)

  // Pass data to Client Component for interactive UI
  return <CocktailsClient cocktails={cocktails} />
}
