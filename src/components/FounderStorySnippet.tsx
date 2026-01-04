import Link from 'next/link'

export default function FounderStorySnippet() {
  return (
    <section className="py-16 bg-jerry-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div>
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Our Story
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              From Signals to Spirits
            </h2>

            <div className="space-y-4 text-parchment-200 text-lg leading-relaxed">
              <p>
                Jerry Can Spirits was born from a shared vision between two Royal Corps of Signals veterans who refused to settle for ordinary. After years of military service, where precision, reliability, and brotherhood were our watchwords, we sought to bring those same values to the world of spirits.
              </p>

              <p>
                The name itself pays homage to the iconic jerry can—a symbol of preparedness, durability, and expedition readiness. Just as the jerry can was engineered to survive the harshest conditions, our rum is crafted for those who venture beyond the ordinary.
              </p>

              <p>
                We're not just making rum; we're building a legacy. A legacy that honors our service, supports the veteran community through the Armed Forces Covenant, and creates premium spirits that stand the test of any adventure.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/about/story"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-all duration-300 font-semibold"
              >
                Read the Full Story
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20 p-8">
              {/* Placeholder for founder photo - replace with actual image */}
              <div className="aspect-square bg-jerry-green-700/40 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-16 h-16 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-parchment-300">Founder photo coming soon</p>
                  <p className="text-parchment-400 text-sm mt-2">Royal Corps of Signals Veterans</p>
                </div>
              </div>

              {/* Armed Forces Covenant Badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                Armed Forces Covenant
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gold-600 rounded-full opacity-20 blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
