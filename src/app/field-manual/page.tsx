import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Field Manual | Jerry Can Spirits - Cocktail Recipes, Equipment & Ingredients",
  description: "Your essential guide to rum cocktails, bar equipment, and premium ingredients. Learn mixology techniques, explore classic recipes, and master the art of adventure-ready drinks.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual',
  },
  openGraph: {
    title: "Field Manual | Jerry Can Spirits",
    description: "Your essential guide to rum cocktails and mixology",
  },
}

export default function FieldManualHome() {
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
            Master the craft with our field manual. Discover spiced rum cocktails featuring <a href="/shop/drinks" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Jerry Can Spirits premium rum</a>, explore premium ingredients,
            and learn about essential barware. Like a vintage expedition guide, but for creating world-class drinks. Visit our <a href="/" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">homepage</a> to learn more about our veteran-owned British spirits.
          </p>
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
                    Spiced Rum Masterpieces
                  </div>
                </div>
                
                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Master classic cocktails and adventurous variations using our engineered spiced rum. 
                  From timeless Dark & Stormy to innovative expedition-inspired creations.
                </p>
                
                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Classic recipes with Jerry Can twists
                  </div>
                  <div className="text-parchment-300">
                    • Step-by-step techniques
                  </div>
                  <div className="text-parchment-300">
                    • Variations & riffs
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
                    Quality Components
                  </div>
                </div>
                
                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Discover premium ingredients that elevate every cocktail. From recommended spirits and bitters
                  to fresh garnishes and preparation techniques.
                </p>

                <br />
                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Spirits & liqueurs
                  </div>
                  <div className="text-parchment-300">
                    • Fresh ingredients & bitters
                  </div>
                  <div className="text-parchment-300">
                    • Brand partnerships
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
                    Essential Barware
                  </div>
                </div>
                
                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Complete barware guide from essential tools to professional-grade equipment.
                  Technical specifications and usage guides for the modern home bar.
                </p>

                <br />
                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Shaking & mixing tools
                  </div>
                  <div className="text-parchment-300">
                    • Measuring & straining
                  </div>
                  <div className="text-parchment-300">
                    • Glassware collection
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
                Master the Craft
              </h2>
              <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
                Each section builds upon the last, creating a comprehensive cocktail education. 
                Start with our signature spiced rum cocktails, then explore the ingredients and tools 
                that make them exceptional.
              </p>
              <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider">
                Adventure Begins with Knowledge
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}