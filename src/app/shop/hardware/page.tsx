import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bar Hardware - Coming Soon | Jerry Can Spirits',
  description: 'Professional bar tools and equipment for home mixologists. Premium barware launching soon.',
}

export default function HardwarePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Tools Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-jerry-green-800/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-gold-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500">
            Bar Hardware Coming Soon
          </h1>
          <p className="text-xl text-gray-300 max-w-xl mx-auto">
            Professional-grade bar tools for the home mixologist. Precision equipment to help you
            craft the perfect cocktail every time.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Precision jiggers and measuring tools</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Professional shakers and strainers</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Quality glassware for every occasion</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Essential bar accessories and gadgets</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/#newsletter-signup"
            className="px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Join the Waitlist
          </Link>
          <Link
            href="/field-manual/equipment"
            className="px-8 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            Equipment Guide
          </Link>
        </div>
      </div>
    </main>
  )
}
