import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { fieldManualCountsQuery } from '@/sanity/queries'

// Round down to nearest 10
function roundDownToTen(n: number): number {
  return Math.floor(n / 10) * 10
}

export const metadata: Metadata = {
  title: "Field Manual - Cocktail Recipes, Bar Equipment & Ingredients",
  description: "Free cocktail recipes, bar equipment guides, and ingredient breakdowns. No jargon, no gatekeeping - just clear instructions for making great drinks at home.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/',
  },
  openGraph: {
    title: "Field Manual | Jerry Can Spirits®",
    description: "Free cocktail recipes and bar guides. No jargon, no gatekeeping - just clear instructions for making great drinks at home.",
  },
}

export default async function FieldManualHome() {
  // Fetch live counts from Sanity
  const counts = await client.fetch<{ cocktails: number; ingredients: number; equipment: number }>(fieldManualCountsQuery)

  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-12 relative">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Field Manual
              </span>
            </div>
            
            {/* Hero Image */}
            <div className="relative w-full max-w-4xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden border border-gold-500/20 mb-8 shadow-2xl">
              <Image
                src="/images/hero/Cocktail_Hero.webp"
                alt="Jerry Can Spirits Field Manual - Cocktail Guide"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/60 to-transparent" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            The Adventurer's Guide
            <br />
            <span className="text-gold-300">to Exceptional Cocktails</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Everything you need to make proper cocktails at home. Recipes that actually work, equipment recommendations that won't bankrupt you, and ingredient guides written in plain English. We built this because most cocktail resources are either gatekeeping nonsense or trying to sell you something. This one's free - we just want you to make great drinks.
          </p>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8 relative z-10">
        <div className="bg-gradient-to-r from-jerry-green-800/80 via-jerry-green-700/80 to-jerry-green-800/80 backdrop-blur-sm rounded-xl border border-gold-500/30 py-6 px-8">
          <div className="grid grid-cols-3 divide-x divide-gold-500/30">
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.cocktails)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Cocktail Recipes</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.ingredients)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Ingredients</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.equipment)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Equipment Guides</div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-6">
            Great Drinks, <span className="text-gold-300">Without the Gatekeeping</span>
          </h2>
          <div className="space-y-4 text-parchment-300 leading-relaxed">
            <p>
              You don't need a cocktail certification or a shelf full of obscure spirits to make exceptional drinks at home.
              The Field Manual cuts through the pretence and unnecessary jargon that can make mixology feel out of reach.
            </p>
            <p>
              Every recipe is written in plain English with clear measurements. We focus on what genuinely matters —
              and filter out the noise. Whether you're mixing your first Cuba Libre or experimenting with house-made
              syrups, this guide meets you exactly where you are.
            </p>
            <p className="text-gold-300 font-medium">
              Good technique, quality ingredients, and a willingness to experiment. That's all it takes.
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:items-stretch">
          
          {/* Cocktails Section */}
          <Link href="/field-manual/cocktails" className="group h-full">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Cocktails</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Recipes That Work
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Classic cocktails, modern twists, and everything in between. Each recipe tested, measured properly, and written so you can actually make it at home.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Clear measurements & methods
                  </div>
                  <div className="text-parchment-300">
                    • Difficulty ratings
                  </div>
                  <div className="text-parchment-300">
                    • Variations for what you have
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Ingredients Section */}
          <Link href="/field-manual/ingredients" className="group h-full">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Ingredients</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    What Goes In
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Spirits, mixers, bitters, syrups, and garnishes explained. What they are, when to use them, and what to buy at different price points.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Budget & premium options
                  </div>
                  <div className="text-parchment-300">
                    • Substitutions that work
                  </div>
                  <div className="text-parchment-300">
                    • Storage & shelf life
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Equipment Section */}
          <Link href="/field-manual/equipment" className="group h-full">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Equipment</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Tools of the Trade
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  What you actually need vs what's nice to have. Honest equipment reviews, what to look for, and where you can save money without sacrificing results.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Essential starter kit
                  </div>
                  <div className="text-parchment-300">
                    • Upgrade recommendations
                  </div>
                  <div className="text-parchment-300">
                    • Glassware guide
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                Start Anywhere
              </h2>
              <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
                Pick a cocktail that sounds good and work backwards. Need a specific ingredient? We'll tell you what it is. Missing a tool? We'll suggest alternatives. The Field Manual is built to help wherever you're starting from.
              </p>
              <Link href="/field-manual/cocktails" className="inline-block px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors">
                Browse Cocktails
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* FAQ Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "Is the Field Manual free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, completely free. All recipes, equipment guides, and ingredient information are available without signing up or paying anything. We built it to help people make better drinks - selling rum is our business, not selling content."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Do I need to buy Jerry Can rum to use the recipes?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "No. While we'd love you to try our rum, every recipe works with any quality spirit in that category. We include notes on what to look for in substitutes when relevant. The Field Manual is useful whether you buy from us or not."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What equipment do I need to start making cocktails?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "At minimum: a jigger (or measuring cup), something to stir with, and glasses. A shaker helps but isn't essential for many drinks. Our equipment section has a starter kit guide that covers what to buy first and what can wait."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How are cocktail difficulty ratings determined?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Based on technique required and ingredient accessibility. Novice means minimal technique and common ingredients - anyone can make these. Wayfinder involves shaking, straining, or a specialty ingredient or two. Trailblazer includes advanced techniques or multiple specialty ingredients."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I suggest a cocktail or ingredient to add?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes - we're always expanding the Field Manual. Get in touch through our contact page with suggestions. We prioritise recipes that work well at home with accessible ingredients."
                  }
                }
              ]
            })
          }}
        />

        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h2 className="text-3xl font-serif font-bold text-white mb-2">
            Questions About the Field Manual
          </h2>
          <p className="text-parchment-400 mb-8">
            What people usually want to know
          </p>

          <div className="space-y-6">
            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">Is the Field Manual free?</h3>
              <p className="text-parchment-200 leading-relaxed">
                Yes, completely free. All recipes, equipment guides, and ingredient information are available without signing up or paying anything. We built it to help people make better drinks - selling rum is our business, not selling content.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">Do I need to buy Jerry Can rum to use the recipes?</h3>
              <p className="text-parchment-200 leading-relaxed">
                No. While we'd love you to try <Link href="/shop/drinks" className="text-gold-400 hover:text-gold-300 underline">our rum</Link>, every recipe works with any quality spirit in that category. We include notes on what to look for in substitutes when relevant. The Field Manual is useful whether you buy from us or not.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">What equipment do I need to start making cocktails?</h3>
              <p className="text-parchment-200 leading-relaxed">
                At minimum: a jigger (or measuring cup), something to stir with, and glasses. A shaker helps but isn't essential for many drinks. Our <Link href="/field-manual/equipment" className="text-gold-400 hover:text-gold-300 underline">equipment section</Link> has a starter kit guide that covers what to buy first and what can wait.
              </p>
            </div>

            <div className="border-b border-gold-500/10 pb-6">
              <h3 className="text-lg font-semibold text-gold-300 mb-3">How are cocktail difficulty ratings determined?</h3>
              <p className="text-parchment-200 leading-relaxed">
                Based on technique required and ingredient accessibility. <strong className="text-gold-400">Novice</strong> means minimal technique and common ingredients - anyone can make these. <strong className="text-gold-400">Wayfinder</strong> involves shaking, straining, or a specialty ingredient or two. <strong className="text-gold-400">Trailblazer</strong> includes advanced techniques or multiple specialty ingredients.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gold-300 mb-3">Can I suggest a cocktail or ingredient to add?</h3>
              <p className="text-parchment-200 leading-relaxed">
                Yes - we're always expanding the Field Manual. <Link href="/contact" className="text-gold-400 hover:text-gold-300 underline">Get in touch</Link> with suggestions. We prioritise recipes that work well at home with accessible ingredients.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}