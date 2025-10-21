import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Expedition Gear - Coming Soon | Jerry Can Spirits',
  description: 'Adventure-ready apparel and branded merchandise launching soon. Jerry Can Spirits clothing and accessories.',
}

export default function ClothingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Shirt Icon */}
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500">
            Expedition Gear Coming Soon
          </h1>
          <p className="text-xl text-gray-300 max-w-xl mx-auto">
            Adventure-ready apparel and branded merchandise for the modern explorer. Quality gear
            that performs wherever your journey takes you.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Premium branded apparel and accessories</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Adventure-tested materials and designs</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Limited edition expedition collectibles</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-gold-500 mt-1">✓</span>
            <p className="text-gray-300">Perfect for adventurers and enthusiasts alike</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/#newsletter-signup"
            className="px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Get Notified at Launch
          </Link>
          <Link
            href="/about/story"
            className="px-8 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            Our Story
          </Link>
        </div>
      </div>
    </main>
  )
}
