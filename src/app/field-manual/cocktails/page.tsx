import { client } from '@/sanity/client'
import { cocktailsQuery } from '@/sanity/queries'
import CocktailsClient from './CocktailsClient'

// This is now a Server Component - data fetching happens server-side
export default async function CocktailsPage() {
  // Fetch cocktails server-side
  const cocktails = await client.fetch(cocktailsQuery)

  // Pass data to Client Component for interactive UI
  return <CocktailsClient cocktails={cocktails} />
}
