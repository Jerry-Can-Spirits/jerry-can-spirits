import type { Metadata } from 'next'
import Image from 'next/image'
import StockistFinder from '@/components/StockistFinder'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: 'Find a Stockist',
  description: 'Find Jerry Can Spirits Expedition Spiced Rum near you. Enter your postcode to locate your nearest stockist.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/stockists/',
  },
}

const featuredStockists = [
  {
    name: 'The Bank Bar & Grill',
    address: '28 Corporation St, Blackpool FY1 1EJ',
    description: 'Family run Bar & Grill restaurant in the centre of Blackpool. Serving Brunch and evening A La Carte Menu.',
    website: 'https://www.thebankblackpool.com/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/9084080c-6c1f-45e5-e29f-9b939ad44100/public',
    type: 'Bar & Grill',
    location: 'Blackpool, Lancashire',
  },
]

const stockistSchema = featuredStockists.map((stockist) => ({
  '@context': 'https://schema.org',
  '@type': 'BarOrPub',
  name: stockist.name,
  address: {
    '@type': 'PostalAddress',
    streetAddress: '28 Corporation St',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1EJ',
    addressCountry: 'GB',
  },
  url: stockist.website,
  description: stockist.description,
  servesCuisine: 'British',
}))

export default function StockistsPage() {
  return (
    <main className="min-h-screen py-20">
      <StructuredData data={stockistSchema} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Stockists
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            Find Expedition Spiced
          </h1>
          <p className="text-xl text-parchment-300 max-w-2xl">
            Enter your postcode to find the nearest stockist. Retail availability expanding from April 2026.
          </p>
        </div>

        {/* Featured Stockists */}
        <div className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-white mb-6">
            Stocking Expedition Spiced
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredStockists.map((stockist) => (
              <div
                key={stockist.name}
                className="bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-6 hover:border-gold-500/40 transition-all"
              >
                <div className="flex items-center justify-center bg-white rounded-lg p-2 mb-5 h-24 border border-gold-500/10">
                  <div className="relative w-full h-full">
                    <Image
                      src={stockist.logo}
                      alt={`${stockist.name} logo`}
                      fill
                      className="object-contain"
                      sizes="200px"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-white mb-1">
                  {stockist.name}
                </h3>
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  {stockist.type}
                </p>
                <p className="text-parchment-400 text-sm mb-3">
                  {stockist.location}
                </p>
                <p className="text-parchment-300 text-sm leading-relaxed mb-5">
                  {stockist.description}
                </p>

                <div className="flex flex-col gap-2">
                  <p className="text-parchment-500 text-xs">
                    {stockist.address}
                  </p>
                  <a
                    href={stockist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
                  >
                    Visit website
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finder */}
        <div className="mb-16">
          <h2 className="text-2xl font-serif font-bold text-white mb-6">
            Search by postcode
          </h2>
          <StockistFinder />
        </div>

        {/* Trade enquiries */}
        <div className="p-8 bg-jerry-green-800/20 rounded-xl border border-gold-500/20 max-w-2xl">
          <h2 className="text-xl font-serif font-bold text-white mb-3">
            Interested in stocking us?
          </h2>
          <p className="text-parchment-300 text-sm leading-relaxed mb-6">
            We work with independent retailers, bars, and restaurants who hold themselves to the same standard we do. If that is you, we would like to hear from you.
          </p>
          <a
            href="/contact/enquiries/"
            className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
          >
            Trade Enquiries
          </a>
        </div>

      </div>
    </main>
  )
}
