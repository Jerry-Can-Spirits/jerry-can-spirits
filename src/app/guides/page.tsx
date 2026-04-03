import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { guidesListQuery } from '@/sanity/queries'
import GuidesClient from './GuidesClient'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'
import { OG_IMAGE } from '@/lib/og'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Spirits Guides & Education',
  description: 'Spirits guides and rum education from Jerry Can Spirits. Cocktail techniques, ingredient deep-dives, and the knowledge to build a proper home bar.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/guides/',
  },
  openGraph: {
    title: 'Spirits Guides & Education | Jerry Can Spirits®',
    description: 'Spirits guides and rum education from Jerry Can Spirits. Cocktail techniques, ingredient deep-dives, and the knowledge to build a proper home bar.',
    url: 'https://jerrycanspirits.co.uk/guides/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
}

interface GuideListItem {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  featured: boolean
  isPillar: boolean
  publishedAt: string | null
  heroImage?: string | null
  heroImageAlt?: string | null
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs items={[{ label: 'Guides' }]} />
      </div>
      <GuidesClient guides={guides} />
    </>
  )
}
