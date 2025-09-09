import Link from 'next/link'

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
            
            {/* Manual Cover Visual */}
            <div className="relative w-full max-w-2xl mx-auto h-80 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-lg border border-gold-500/20 mb-8 flex items-center justify-center overflow-hidden">
              {/* Parchment texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="text-center relative z-10">
                <div className="text-gold-300 mb-4">
                  <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-white mb-2">Cocktail Masterclass</h2>
                <p className="text-parchment-300 text-sm">
                  An adventurer's guide to exceptional drinks
                </p>
              </div>
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            The Adventurer's Guide
            <br />
            <span className="text-gold-300">to Exceptional Cocktails</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Master the craft with our field manual. Discover spiced rum cocktails, premium ingredients, 
            and essential barware. Like a vintage expedition guide, but for creating world-class drinks.
          </p>
        </div>
      </section>

      {/* Navigation Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Cocktails Section */}
          <Link href="/field-manual/cocktails" className="group">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
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
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Classic recipes with Jerry Can twists</span>
                    <span className="text-gold-400">Novice → Trailblazer</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Step-by-step techniques</span>
                    <span className="text-gold-400">8-12 Cocktails</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Variations & riffs</span>
                    <span className="text-gold-400">20+ Total</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Ingredients Section */}
          <Link href="/field-manual/ingredients" className="group">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
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
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Spirits & liqueurs</span>
                    <span className="text-gold-400">Premium Focus</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Fresh ingredients & bitters</span>
                    <span className="text-gold-400">Storage Tips</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Brand partnerships</span>
                    <span className="text-gold-400">Quality Tiers</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Equipment Section */}
          <Link href="/field-manual/equipment" className="group">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden">
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
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Shaking & mixing tools</span>
                    <span className="text-gold-400">Blueprint Style</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Measuring & straining</span>
                    <span className="text-gold-400">Technical Specs</span>
                  </div>
                  <div className="flex items-center justify-between text-parchment-300">
                    <span>• Glassware collection</span>
                    <span className="text-gold-400">Complete Setup</span>
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