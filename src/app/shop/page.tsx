import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/Breadcrumbs'
import { CATEGORIES } from '@/lib/categories'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Shop',
  description: 'Shop Jerry Can Spirits. Expedition Spiced Rum, cocktail shaker sets, glassware, and expedition gear. Veteran-owned, built properly.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shop/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Shop | Jerry Can Spirits®',
    description: 'Shop Jerry Can Spirits. Expedition Spiced Rum, cocktail shaker sets, glassware, and expedition gear. Veteran-owned, built properly.',
    url: 'https://jerrycanspirits.co.uk/shop/',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Shop | Jerry Can Spirits®',
    description: 'Shop Jerry Can Spirits. Expedition Spiced Rum, cocktail shaker sets, glassware, and expedition gear. Veteran-owned, built properly.',
    images: OG_IMAGE,
  },
}

// Curated display order for the shop hub — virtual SEO pages first (intent-driven),
// then Shopify collection pages. Bespoke pages (spirits/barware/clothing) are listed
// explicitly since they have no CATEGORIES entry.
const CURATED_HANDLES: Array<{ handle: string; title?: string; description?: string }> = [
  { handle: 'rum-gifts' },
  { handle: 'spiced-rum' },
  { handle: 'cocktail-making-kits' },
  { handle: 'bar-accessories' },
  { handle: 'gifts-for-him' },
  { handle: 'gifts-for-her' },
  { handle: 'rum-glasses' },
  { handle: 'gift-sets' },
  { handle: 'gifts-and-experience' },
  { handle: 'hip-flasks' },
  { handle: 'cocktail-glasses-glassware' },
  { handle: 'cocktail-shakers' },
  { handle: 'ice-chilling' },
  { handle: 'bundles' },
  { handle: 'new-releases' },
  { handle: 'spirits', title: 'Spirits', description: 'Expedition Spiced Rum. 40% ABV, 700ml, veteran-owned.' },
  { handle: 'barware', title: 'Barware', description: 'Professional bar tools and glassware for the home bar.' },
  { handle: 'clothing', title: 'Clothing', description: 'Expedition apparel built for the field.' },
]

function titleFromHandle(handle: string): string {
  return handle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ShopPage() {
  // Curated sections: pull title/description from CATEGORIES where available
  const curatedItems = CURATED_HANDLES.map(({ handle, title, description }) => {
    const cat = CATEGORIES[handle]
    return {
      handle,
      title: cat?.h1 ?? title ?? titleFromHandle(handle),
      description: cat?.metaDescription ?? description ?? null,
    }
  })

  const allItems = curatedItems

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
          <p className="text-parchment-300 text-lg max-w-2xl mx-auto">
            Find what you are looking for. Each collection is built around a purpose.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {allItems.map((item) => (
            <Link
              key={item.handle}
              href={`/shop/${item.handle}/`}
              className="group p-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
            >
              <h2 className="text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                {item.title}
              </h2>
              {item.description && (
                <p className="text-parchment-400 text-sm mt-2 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
              )}
              <span className="text-gold-300 text-sm font-semibold group-hover:translate-x-1 transition-transform inline-block mt-4">
                Browse →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
