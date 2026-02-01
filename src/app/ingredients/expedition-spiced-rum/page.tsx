import type { Metadata } from 'next'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: "Ingredients - Expedition Spiced Rum",
  description: "What goes into Jerry Can Spirits Expedition Spiced Rum. Caribbean rum base, Welsh water, local brewery molasses, and carefully selected spices.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/ingredients/expedition-spiced-rum/',
  },
  openGraph: {
    title: 'Expedition Spiced Rum Ingredients | Jerry Can Spirits®',
    description: 'What goes into Jerry Can Spirits Expedition Spiced Rum. Caribbean rum base, Welsh water, local brewery molasses, and carefully selected spices.',
    url: 'https://jerrycanspirits.co.uk/ingredients/expedition-spiced-rum/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ExpeditionSpicedRumIngredients() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Ingredients', href: '/ingredients' },
            { label: 'Expedition Spiced Rum' },
          ]}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              What&apos;s In The Bottle
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            Expedition Spiced Rum
            <br />
            <span className="text-gold-300">Ingredients</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            No secrets, no gimmicks. Here&apos;s exactly what goes into our rum.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Product Info */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <div className="grid sm:grid-cols-3 gap-6 text-center mb-8">
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Bottle</p>
                <p className="text-2xl font-serif text-white">700ml</p>
              </div>
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Alcohol</p>
                <p className="text-2xl font-serif text-white">40%</p>
              </div>
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Origin</p>
                <p className="text-2xl font-serif text-white">Wales, UK</p>
              </div>
            </div>
          </div>
        </section>

        {/* Ingredients List */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              Ingredients
            </h2>

            <div className="space-y-6 text-parchment-300">
              {/* Base Spirit */}
              <div className="border-b border-gold-500/20 pb-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Base Spirit</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Caribbean Rum</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Welsh Brewery Molasses</span>
                  </li>
                </ul>
              </div>

              {/* Spices & Botanicals */}
              <div className="border-b border-gold-500/20 pb-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Spices &amp; Botanicals</h3>
                <p className="text-parchment-400 italic mb-4">Full ingredient list coming soon.</p>
                {/* Placeholder for actual ingredients - uncomment and populate when ready
                <ul className="grid sm:grid-cols-2 gap-2">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Vanilla</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Cinnamon</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Nutmeg</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Clove</span>
                  </li>
                </ul>
                */}
              </div>

              {/* Water */}
              <div>
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Water</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Pure Welsh Water</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Allergen Info */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              Allergen Information
            </h2>

            <div className="text-parchment-300">
              <p className="mb-4">
                Our Expedition Spiced Rum contains no major allergens. It is:
              </p>
              <ul className="grid sm:grid-cols-2 gap-2">
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Gluten-free</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Dairy-free</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Nut-free</span>
                </li>
                <li className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Vegan-friendly</span>
                </li>
              </ul>
              <p className="mt-6 text-sm text-parchment-400">
                If you have specific dietary concerns, please <Link href="/contact" className="text-gold-300 hover:text-gold-400 underline">contact us</Link> before purchasing.
              </p>
            </div>
          </div>
        </section>

        {/* Tasting Notes */}
        <section className="py-12">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
              Tasting Notes
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="text-gold-300 font-semibold">Nose:</span>
                  <span className="text-parchment-300 ml-2">Vanilla and caramel upfront, with warm spice notes</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="text-gold-300 font-semibold">Palate:</span>
                  <span className="text-parchment-300 ml-2">Rich and smooth, warm spice through the middle</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <span className="text-gold-300 font-semibold">Finish:</span>
                  <span className="text-parchment-300 ml-2">Smooth enough to sip neat, bold enough for cocktails</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop/product/expedition-spiced-rum"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
            >
              <span>Order a Bottle</span>
            </Link>
            <Link
              href="/sustainability"
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
