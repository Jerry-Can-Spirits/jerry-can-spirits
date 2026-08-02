import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { guidesListQuery } from '@/sanity/queries'
import GuidesClient from './GuidesClient'
import Breadcrumbs from '@/components/Breadcrumbs'
import HubIndex from '@/components/HubIndex'
import StructuredData from '@/components/StructuredData'
import { OG_IMAGE } from '@/lib/og'

// ISR — a single Sanity list query with no per-request state, so it edge-caches
// and revalidates hourly (the /guides/[slug] detail pages are already SSG).
export const revalidate = 3600

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
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Spirits Guides & Education | Jerry Can Spirits®',
    description: 'Spirits guides and rum education from Jerry Can Spirits. Cocktail techniques, ingredient deep-dives, and the knowledge to build a proper home bar.',
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

  // Build ItemList schema for article collection. URL references only, not
  // inlined Article objects: the full Article schema lives on each guide page,
  // and inlined copies invite incomplete-markup validation errors. Publisher
  // references the site-wide #organization node by @id rather than inlining
  // another anonymous copy.
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Jerry Can Spirits Guides & Education',
    description: 'Cocktail techniques, ingredient deep-dives and home bar knowledge from the makers of Expedition Spiced Rum.',
    url: 'https://jerrycanspirits.co.uk/guides/',
    publisher: { '@id': 'https://jerrycanspirits.co.uk/#organization' },
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: guide.title,
      url: `https://jerrycanspirits.co.uk/guides/${guide.slug.current}/`,
    })),
  }

  // Pass data to Client Component for interactive UI (search, filters, pagination)
  return (
    <>
      <StructuredData data={itemListSchema} id="guides-itemlist-schema" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs items={[{ label: 'Guides' }]} />
      </div>
      {/* Hero rendered server-side (static, no searchParams) so the <h1> is in
          the initial HTML. It previously lived inside GuidesClient, which sits
          in the Suspense boundary below, so crawlers saw the empty fallback and
          reported a missing H1 on /guides/. */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Knowledge Base
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Spirits Guides
            <br />
            <span className="text-gold-300">& Education</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Cocktail techniques, ingredient deep-dives and the knowledge to build a proper home bar. Written by the founders of an IWSC-medalled rum, not a content team.
          </p>
        </div>
      </section>
      {/* Suspense boundary so the client search/filter UI's useSearchParams
          does not force the whole route dynamic — matches the field-manual
          pages, which are static with the same pattern. */}
      <Suspense>
        <GuidesClient guides={guides} />
      </Suspense>
      <HubIndex
        heading={`All ${guides.length} guides, A to Z`}
        items={guides.map((g) => ({ name: g.title, href: `/guides/${g.slug.current}/` }))}
      />
    </>
  )
}
