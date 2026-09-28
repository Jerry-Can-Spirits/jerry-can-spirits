import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import TeamMeetRow from '@/components/TeamMeetRow'
import { OG_IMAGE } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

// Placeholder page, 28 Sep 2026: the route, links and sitemap entry exist so
// the bio drops in when it arrives. Only the name is confirmed; role, bio,
// quote and photo are still to come. Fill the schema's jobTitle, the
// eyebrow, the quick facts and the panel together.
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Danny Hughes',
  url: 'https://jerrycanspirits.co.uk/about/team/danny-hughes/',
  worksFor: ORG_REF,
}

const DESCRIPTION = 'Danny Hughes is part of the team at Jerry Can Spirits. Full profile to follow.'

export const metadata: Metadata = {
  title: 'Danny Hughes',
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/danny-hughes/',
  },
  openGraph: {
    title: 'Danny Hughes | Jerry Can Spirits®',
    description: DESCRIPTION,
    url: 'https://jerrycanspirits.co.uk/about/team/danny-hughes',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Danny Hughes | Jerry Can Spirits®',
    description: DESCRIPTION,
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DannyHughesPage() {
  return (
    <main>
      <StructuredData data={personSchema} id="danny-hughes-person-schema" />

      {/* Who he is: header, photo slot, quick facts and the bio. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about/story' },
              { label: 'Team', href: '/about/team' },
              { label: 'Danny Hughes' },
            ]}
            className="mb-8"
          />

          <Link
            href="/about/team/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Team</span>
          </Link>

          <SectionHeading as="h1">Danny Hughes</SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left column: photo slot and quick facts */}
            <div className="lg:col-span-1 space-y-6">
              <div className="relative">
                <div className="aspect-square bg-linear-to-br from-jerry-green-700/50 to-jerry-green-900/50 rounded-xl flex items-center justify-center border border-gold-500/20">
                  <svg className="w-24 h-24 text-gold-500/30" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="absolute top-2 right-2 px-3 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                  <span className="text-jerry-green-900 text-xs font-semibold">Photo Coming Soon</span>
                </div>
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-4 pb-2 border-b border-gold-500/20">
                  Quick Facts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Role</p>
                    <p className="text-parchment-200">Details to follow.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: the bio, once it arrives */}
            <div className="lg:col-span-2">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-5">
                <h2 className="text-2xl font-serif font-bold text-white">About Danny</h2>
                <p className="text-parchment-200 leading-relaxed">Details to follow.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TeamMeetRow current="danny-hughes" />
    </main>
  )
}
