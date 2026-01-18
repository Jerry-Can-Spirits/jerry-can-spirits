import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { guidesListQuery } from '@/sanity/queries'
import GuidesClient from './GuidesClient'

// Cloudflare Pages edge runtime
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Spirits Guides & Education | Jerry Can Spirits',
  description: 'Expert guides on cocktail techniques, rum education, and spirits knowledge. Learn from our comprehensive collection of bartending resources.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/guides/',
  },
}

// This is a Server Component - data fetching happens server-side
export default async function GuidesPage() {
  // Fetch guides server-side using optimized list query
  const guides = await client.fetch(guidesListQuery)

  // Pass data to Client Component for interactive UI (search, filters, pagination)
  return <GuidesClient guides={guides} />
}
