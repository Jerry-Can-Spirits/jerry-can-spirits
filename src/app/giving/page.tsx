import type { Metadata } from 'next'
import Link from 'next/link'
import { getD1, getCharities, getCharityContributions } from '@/lib/d1'
import CharityCard from '@/components/CharityCard'
import ContributionsList from '@/components/ContributionsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Where the 5% Goes | Jerry Can Spirits®',
  description:
    'Jerry Can Spirits donates 5% of profits to armed forces charities. A transparent record of who receives what, and when.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/giving/',
  },
}

export default async function GivingPage() {
  const db = await getD1()
  const [charities, contributions] = await Promise.all([
    getCharities(db),
    getCharityContributions(db),
  ])

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. Header */}
        <div className="mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Giving Back
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Where the 5% Goes
          </h1>
          <p className="text-parchment-300 text-lg max-w-2xl">
            Five percent of profits from every bottle sold goes to armed forces charities. This page is the record.
          </p>
        </div>

        {/* 2. Commitment block — always shown */}
        <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">The Pledge</h2>
          <div className="space-y-4 text-parchment-300 leading-relaxed">
            <p>
              From the first bottle sold, five percent of profits is committed to armed forces charities. Not a one-off donation. Not a marketing claim. A standing commitment, built into how we run the company.
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

        {/* 3. Charity partners — conditional */}
        <div className="mb-12">
          {charities.length > 0 ? (
            <>
              <h2 className="text-2xl font-serif font-bold text-white mb-6">Our Charity Partners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charities.map((charity) => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-parchment-400">
              We are reviewing armed forces charities to partner with. We will announce our chosen partners ahead of our first donation.
            </p>
          )}
        </div>

        {/* 4. Contributions to date — only shown when data exists */}
        {contributions.length > 0 && (
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-6">Contributions to Date</h2>
            <ContributionsList contributions={contributions} charities={charities} />
          </div>
        )}

      </div>
    </main>
  )
}
