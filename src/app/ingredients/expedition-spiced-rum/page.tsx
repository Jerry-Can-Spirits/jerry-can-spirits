import type { Metadata } from 'next'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'

// FAQ Schema for rich snippets
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is Expedition Spiced Rum gluten-free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Expedition Spiced Rum is gluten-free. It contains no major allergens and is also dairy-free, nut-free, and vegan-friendly.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Expedition Spiced Rum vegan?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, Expedition Spiced Rum is vegan-friendly. We use no animal products in our rum or during the production process.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is Expedition Spiced Rum made from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expedition Spiced Rum is made with Caribbean rum, Madagascan vanilla pods, Ceylon cinnamon, ginger, orange peel, cloves, allspice, cassia bark, and agave syrup for natural sweetness. It\'s rested on bourbon barrel chips and blended at Spirit of Wales Distillery in Newport, South Wales.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does Expedition Spiced Rum taste like?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On the nose, warm waves of Madagascan vanilla rise first, followed by Ceylon cinnamon and toasted bourbon oak, with orange peel, clove and allspice. The palate is silky and naturally sweet from agave syrup, with ginger heat, cassia bark, and baking spices. The finish is long, warming, and gently dry with oak tannins, vanilla, and a flicker of ginger.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the alcohol content of Expedition Spiced Rum?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expedition Spiced Rum is 40% alcohol by volume (ABV), bottled in 700ml bottles.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many calories are in Expedition Spiced Rum?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expedition Spiced Rum contains approximately 1,846 kcal per 700ml bottle. A single measure (25ml) contains 66 kcal, and a double (50ml) contains 132 kcal.',
      },
    },
    {
      '@type': 'Question',
      name: 'What spices are in Expedition Spiced Rum?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Expedition Spiced Rum is made with Madagascan vanilla pods, Ceylon cinnamon, allspice, cloves, orange peel, cassia bark, ginger, and agave syrup. It is matured with bourbon barrel chips for added depth.',
      },
    },
  ],
}

export const metadata: Metadata = {
  title: "Ingredients - Expedition Spiced Rum",
  description: "What goes into Jerry Can Spirits Expedition Spiced Rum. Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia, and agave, steeped in Caribbean rum.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/ingredients/expedition-spiced-rum/',
  },
  openGraph: {
    title: 'Expedition Spiced Rum Ingredients | Jerry Can Spirits®',
    description: 'What goes into Jerry Can Spirits Expedition Spiced Rum. Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia, and agave, steeped in Caribbean rum.',
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
      <StructuredData data={faqSchema} id="ingredients-faq-schema" />
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
            <div className="grid sm:grid-cols-4 gap-6 text-center mb-8">
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Bottle</p>
                <p className="text-2xl font-serif text-white">700ml</p>
              </div>
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Alcohol</p>
                <p className="text-2xl font-serif text-white">40% ABV</p>
              </div>
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Energy</p>
                <p className="text-2xl font-serif text-white">1,846 kcal</p>
                <p className="text-parchment-400 text-xs mt-1">per 700ml bottle</p>
              </div>
              <div>
                <p className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-1">Origin</p>
                <p className="text-2xl font-serif text-white">Wales, UK</p>
              </div>
            </div>

            {/* Per Serve Info */}
            <div className="border-t border-gold-500/20 pt-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-4 text-center">Energy Per Serve</h3>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-jerry-green-900/50 rounded-lg p-4 text-center">
                  <p className="text-parchment-400 text-sm mb-1">Single (25ml)</p>
                  <p className="text-xl font-serif text-white">66 kcal</p>
                </div>
                <div className="bg-jerry-green-900/50 rounded-lg p-4 text-center">
                  <p className="text-parchment-400 text-sm mb-1">Double (50ml)</p>
                  <p className="text-xl font-serif text-white">132 kcal</p>
                </div>
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
                <ul className="grid sm:grid-cols-2 gap-2">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Madagascan Vanilla Pods</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ceylon Cinnamon</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Allspice</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Cloves</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Orange Peel</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Cassia Bark</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Ginger</span>
                  </li>
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Agave Syrup</span>
                  </li>
                </ul>
              </div>

              {/* Maturation */}
              <div className="border-b border-gold-500/20 pb-6">
                <h3 className="text-lg font-semibold text-gold-300 mb-3">Maturation</h3>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Bourbon Barrel Chips</span>
                  </li>
                </ul>
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
                If you have specific dietary concerns, please <Link href="/contact/" className="text-gold-300 hover:text-gold-400 underline">contact us</Link> before purchasing.
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

            <div className="space-y-6">
              <div>
                <h3 className="text-gold-300 font-semibold text-lg mb-2">Nose</h3>
                <p className="text-parchment-300 leading-relaxed">
                  Warm waves of Madagascan vanilla rise first, rich and creamy, followed by elegant Ceylon cinnamon and notes of toasted bourbon oak. A lift of orange peel brightens the aroma, while clove and allspice bring depth and warmth.
                </p>
              </div>
              <div>
                <h3 className="text-gold-300 font-semibold text-lg mb-2">Palate</h3>
                <p className="text-parchment-300 leading-relaxed">
                  Silky and naturally sweet upfront, thanks to agave syrup, moving into a complex heart of ginger heat, cassia bark, and layered baking spices. The citrus notes reappear mid-palate, balancing the richness with a subtle, zesty edge.
                </p>
              </div>
              <div>
                <h3 className="text-gold-300 font-semibold text-lg mb-2">Finish</h3>
                <p className="text-parchment-300 leading-relaxed">
                  Long, warming, and gently dry. Oak tannins linger alongside vanilla, winter spice, and a final flicker of ginger. Clean, refined, and crafted for sipping.
                </p>
              </div>
            </div>

            {/* Character Summary */}
            <div className="mt-8 pt-6 border-t border-gold-500/20">
              <h3 className="text-gold-300 font-semibold text-lg mb-2">Character</h3>
              <p className="text-parchment-300 leading-relaxed italic">
                A modern, naturally sweetened spiced rum with bright citrus top notes, creamy vanilla depth, and a bourbon-barrel backbone. Smooth enough to sip neat, bold enough for standout cocktails.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop/product/expedition-spiced-rum/"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
            >
              <span>Order a Bottle</span>
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
