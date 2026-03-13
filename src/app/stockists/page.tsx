import type { Metadata } from 'next'
import StockistFinder from '@/components/StockistFinder'

export const metadata: Metadata = {
  title: 'Find a Stockist',
  description: 'Find Jerry Can Spirits Expedition Spiced Rum near you. Enter your postcode to locate your nearest stockist.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/stockists/',
  },
}

export default function StockistsPage() {
  return (
    <main className="min-h-screen py-20">
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

        {/* Finder */}
        <StockistFinder />

        {/* Trade enquiries */}
        <div className="mt-16 p-8 bg-jerry-green-800/20 rounded-xl border border-gold-500/20 max-w-2xl">
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
