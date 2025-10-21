import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shop - Coming Soon | Jerry Can Spirits',
  description: 'Premium British rum and adventure gear launching soon. Join our mailing list for exclusive early access and launch updates.',
}

export default function ShopPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Icon/Compass */}
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500">
            Adventure Awaits
          </h1>
          <p className="text-xl text-gray-300 max-w-xl mx-auto">
            Our expedition shop is preparing for deployment. Premium British rum, professional barware,
            and adventure-ready gear will be available soon.
          </p>
        </div>

        {/* Coming Soon Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="p-6 bg-jerry-green-800/20 rounded-lg border border-gold-500/20 hover:border-gold-500/40 transition-colors">
            <h3 className="font-semibold text-gold-500 mb-2">Premium Rum</h3>
            <p className="text-sm text-gray-400">British crafted spirits for discerning adventurers</p>
          </div>
          <div className="p-6 bg-jerry-green-800/20 rounded-lg border border-gold-500/20 hover:border-gold-500/40 transition-colors">
            <h3 className="font-semibold text-gold-500 mb-2">Bar Hardware</h3>
            <p className="text-sm text-gray-400">Professional tools for the home mixologist</p>
          </div>
          <div className="p-6 bg-jerry-green-800/20 rounded-lg border border-gold-500/20 hover:border-gold-500/40 transition-colors">
            <h3 className="font-semibold text-gold-500 mb-2">Expedition Gear</h3>
            <p className="text-sm text-gray-400">Adventure-ready apparel and accessories</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <Link
            href="/#signup"
            className="px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Join the Waitlist
          </Link>
          <Link
            href="/field-manual"
            className="px-8 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500/10 transition-colors"
          >
            Explore Field Manual
          </Link>
        </div>
      </div>
    </main>
  )
}
