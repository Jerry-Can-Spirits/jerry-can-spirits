import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { guidesListQuery } from '@/sanity/queries'
import GuidesClient from './GuidesClient'
import StructuredData from '@/components/StructuredData'

// Cloudflare Pages edge runtime
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Spirits Guides & Education',
  description: 'Expert guides on cocktail techniques, rum education, and spirits knowledge. Learn from our comprehensive collection of bartending resources.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/guides/',
  },
  openGraph: {
    title: 'Spirits Guides & Education | Jerry Can Spirits®',
    description: 'Expert guides on cocktail techniques, rum education, and spirits knowledge. Learn from our comprehensive collection of bartending resources.',
    url: 'https://jerrycanspirits.co.uk/guides/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
}

// Guide type for ItemList schema
interface GuideListItem {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  heroImage?: string
}

// This is a Server Component - data fetching happens server-side
export default async function GuidesPage() {
  // Fetch guides server-side using optimized list query
  const guides: GuideListItem[] = await client.fetch(guidesListQuery)

  // Build ItemList schema for article collection
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Guides & Education',
    description: 'Expert guides on cocktail techniques, rum education, and spirits knowledge.',
    url: 'https://jerrycanspirits.co.uk/guides/',
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Article',
        name: guide.title,
        url: `https://jerrycanspirits.co.uk/guides/${guide.slug.current}/`,
        description: guide.excerpt || `${guide.title} - spirits guide`,
        image: guide.heroImage || '',
      },
    })),
  }

  // Pass data to Client Component for interactive UI (search, filters, pagination)
  return (
    <>
      <StructuredData data={itemListSchema} id="guides-itemlist-schema" />
      <GuidesClient guides={guides} />
    </>
  )
}
