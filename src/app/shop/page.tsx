import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getAllCollections } from '@/lib/shopify'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop | Jerry Can Spirits',
  description: 'Browse all Jerry Can Spirits collections. Expedition Spiced Rum, barware, glassware, clothing and more.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/',
  },
  openGraph: {
    title: 'Shop | Jerry Can Spirits®',
    description: 'Browse all Jerry Can Spirits collections. Expedition Spiced Rum, barware, glassware, clothing and more.',
  },
}

function titleFromHandle(handle: string): string {
  return handle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default async function ShopPage() {
  let collections: { handle: string; title: string }[] = []
  try {
    collections = await getAllCollections()
  } catch {
    // fall through to empty state
  }

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs items={[{ label: 'Shop' }]} />
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              All Collections
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Browse the Shop
          </h1>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {collections.length === 0 ? (
          <div className="text-center text-parchment-300">No collections found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.handle}
                href={`/shop/${collection.handle}/`}
                className="group p-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                <h2 className="text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                  {collection.title || titleFromHandle(collection.handle)}
                </h2>
                <span className="text-gold-300 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block mt-3">
                  Browse →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
