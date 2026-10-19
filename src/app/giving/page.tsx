import type { Metadata } from 'next'
import Link from 'next/link'
import { getD1, getCharities, getCharityContributions } from '@/lib/d1'
import CharityCard from '@/components/CharityCard'
import ContributionsList from '@/components/ContributionsList'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import { baseOpenGraph } from '@/lib/og'
import { CHARITY_DESCRIPTION, CHARITY_LOGO, CHARITY_NAME, CHARITY_STATEMENT_FULL, CHARITY_WEBSITE } from '@/lib/charity'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Where the 5% Goes',
  description:
    "Jerry Can Spirits donates 5% of profits to Combat Stress, the veterans' mental health charity. A transparent record of who receives what, and when.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/giving/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Where the 5% Goes | Jerry Can Spirits®',
    description: "Jerry Can Spirits donates 5% of profits to Combat Stress, the veterans' mental health charity. A transparent record of who receives what, and when.",
    url: 'https://jerrycanspirits.co.uk/giving/',
  },
}

export default async function GivingPage() {
  const db = await getD1()
  const [charities, contributions] = await Promise.all([
    getCharities(db),
    getCharityContributions(db),
  ])
  const partners = charities.length > 0 ? charities : [{
    id: 'combat-stress',
    name: CHARITY_NAME,
    description: CHARITY_DESCRIPTION,
    logo_url: CHARITY_LOGO.primaryDark,
    website_url: CHARITY_WEBSITE,
    sort_order: 1,
  }]

  return (
    <main>
      {/* 1. Header */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Giving Back"
            intro="5% of our profits go to Combat Stress, the veterans' mental health charity. This page is the record."
          >
            Where the 5% Goes
          </SectionHeading>
        </div>
      </section>

      {/* 2. Commitment block — always shown */}
      <section className="band-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-8">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">The Pledge</h2>
            <div className="space-y-4 text-parchment-300 leading-relaxed">
              <p>
                From the first bottle sold, {CHARITY_STATEMENT_FULL} Not a one-off donation. Not a marketing claim. A standing commitment, built into how we run the company.
              </p>
              <p>
                We launched in April 2026. We have not yet reached a profit position from which to donate. When we do, it will appear here.
              </p>
              <p>
                The full commitment is set out on our{' '}
                <Link
                  href="/armed-forces-covenant/"
                  className="text-gold-400 hover:text-gold-300 transition-colors"
                >
                  Armed Forces Covenant page
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Charity partners — conditional */}
      <section className="band-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Our Charity Partner</SectionHeading>
          <ScrollRow
            ariaLabel="Our charity partner"
            cols="md:grid-cols-2"
            items={partners.map((charity) => (
              <div key={charity.id} className="h-full">
                <CharityCard charity={charity} />
              </div>
            ))}
          />
        </div>
      </section>

      {/* 4. Contributions to date — only shown when data exists */}
      {contributions.length > 0 && (
        <section className="band-light py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading>Contributions to Date</SectionHeading>
            <ContributionsList contributions={contributions} charities={charities} />
          </div>
        </section>
      )}
    </main>
  )
}
