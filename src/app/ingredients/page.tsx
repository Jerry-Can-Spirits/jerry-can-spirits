import type { Metadata } from 'next'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: "Product Ingredients",
  description: "Full ingredient lists for Jerry Can Spirits rum. What goes into Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/ingredients/',
  },
  openGraph: {
    title: 'Product Ingredients | Jerry Can Spirits®',
    description: 'Full ingredient lists for Jerry Can Spirits rum. What goes into Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.',
    url: 'https://jerrycanspirits.co.uk/ingredients/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Product Ingredients | Jerry Can Spirits®',
    description: 'Full ingredient lists for Jerry Can Spirits rum. What goes into Expedition Spiced Rum: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and more.',
    images: OG_IMAGE,
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
    description: 'Our flagship spiced rum. Caribbean rum base: seven real spices, two natural sweeteners, and bourbon oak.',
    bottle: '700ml',
    alcohol: '40%',
  },
  // Add more products here as they launch
]

export default function IngredientsIndex() {
  return (
    <main>
      {/* Hero Section */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Breadcrumbs
            items={[
              { label: 'What’s In It' },
            ]}
          />
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Full Transparency"
            intro="No secrets, no gimmicks. Select a product to see exactly what goes into each bottle."
          >
            Product
            <br />
            <span className="text-gold-300">What’s In It</span>
          </SectionHeading>
        </div>
      </section>

      {/* Products Grid */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {products.map((product) => (
              <Link
                key={product.slug}
                href={`/ingredients/${product.slug}/`}
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
                  <div className="shrink-0">
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
        </div>
      </section>

      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* See These Ingredients in Action */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              See These Ingredients in Action
            </h2>
            <p className="text-parchment-300 mb-6">
              Curious how these flavours come together in a glass? Browse our cocktail recipes and see what you can make.
            </p>
            <Link
              href="/field-manual/cocktails/"
              className="inline-flex items-center justify-center space-x-2 text-gold-300 hover:text-gold-400 underline font-semibold transition-colors"
            >
              <span>Explore Cocktail Recipes</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Info Section */}
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

          {/* CTA */}
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
        </div>
      </section>

      <BackToTop />
    </main>
  )
}
