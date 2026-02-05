import type { Metadata } from 'next'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: "Product Ingredients",
  description: "Full ingredient lists for Jerry Can Spirits rum. See what goes into our Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/ingredients/',
  },
  openGraph: {
    title: 'Product Ingredients | Jerry Can Spirits®',
    description: 'Full ingredient lists for Jerry Can Spirits rum. See what goes into our Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.',
    url: 'https://jerrycanspirits.co.uk/ingredients/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const products = [
  {
    name: 'Expedition Spiced Rum',
    slug: 'expedition-spiced-rum',
    description: 'Our flagship spiced rum. Caribbean rum base infused with Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, allspice, cassia bark, and agave.',
    bottle: '700ml',
    alcohol: '40%',
  },
  // Add more products here as they launch
]

export default function IngredientsIndex() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Ingredients' },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Full Transparency
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            Product
            <br />
            <span className="text-gold-300">Ingredients</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            No secrets, no gimmicks. Select a product to see exactly what goes into each bottle.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Products Grid */}
        <section className="py-12">
          <div className="space-y-6">
            {products.map((product) => (
              <Link
                key={product.slug}
                href={`/ingredients/${product.slug}`}
                className="block bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                      {product.name}
                    </h2>
                    <p className="text-parchment-300 mb-4">
                      {product.description}
                    </p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-gold-400">{product.bottle}</span>
                      <span className="text-parchment-400">•</span>
                      <span className="text-gold-400">{product.alcohol}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center gap-2 text-gold-300 group-hover:text-gold-400 transition-colors">
                      <span>View Ingredients</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              Why We Share This
            </h2>
            <p className="text-parchment-300 mb-4">
              We believe you should know exactly what you&apos;re drinking. Each product page includes the full ingredient list, allergen information, and tasting notes.
            </p>
            <p className="text-parchment-400 text-sm">
              Questions about ingredients? <Link href="/contact/" className="text-gold-300 hover:text-gold-400 underline">Get in touch</Link>.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop/"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
            >
              <span>Shop All Products</span>
            </Link>
            <Link
              href="/sustainability/"
              className="inline-flex items-center justify-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-700 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-gold-500/30 hover:border-gold-500/60 transition-all duration-300"
            >
              <span>Sustainability</span>
            </Link>
          </div>
        </section>

      </div>

      <BackToTop />
    </main>
  )
}
