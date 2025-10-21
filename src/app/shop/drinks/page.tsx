import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium Rum - Coming Soon | Jerry Can Spirits',
  description: 'British crafted premium rum launching soon. Small-batch spirits for adventurers and rum enthusiasts.',
}

export default function DrinksPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Bottle Icon */}
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500">
            Premium Rum Launching Soon
          </h1>
          <p className="text-xl text-gray-300 max-w-xl mx-auto">
            British crafted spirits for the modern adventurer. Our premium rum is currently in final preparation
            for deployment to discerning palates.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Small-batch British craftsmanship</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Perfect for classic and contemporary cocktails</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Expedition-tested, adventure-approved</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/#newsletter-signup"
            className="px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Get Early Access
          </Link>
          <Link
            href="/field-manual/cocktails"
            className="px-8 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            View Cocktail Recipes
          </Link>
        </div>
      </div>
    </main>
  )
}
