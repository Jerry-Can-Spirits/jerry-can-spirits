'use client'

import { useRouter } from 'next/navigation'

// Branded shop-load failure state. Replaces the old red "Shopify Connection
// Failed" box that printed the raw error string and named the platform. The
// customer only needs to know it's our end and to retry. Copy is founder-final.
export default function ShopError() {
  const router = useRouter()
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white">
            We can&apos;t load the shop right now.
          </h1>
          <p className="text-lg text-parchment-300 leading-relaxed">
            This is our end, not yours. Give it a moment and try again.
          </p>
          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center justify-center min-h-[44px] px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    </main>
  )
}
