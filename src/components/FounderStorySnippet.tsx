import Link from 'next/link'
import Image from 'next/image'

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
                Between us, we served 17 years in the Royal Corps of Signals. We wanted a proper drink to share with mates. Something with character, made by people who give a damn. We couldn't find it. So we made it ourselves.
              </p>

              <p>
                The name? The jerry can wasn't designed to look good on a shelf. It was designed to work in the desert, in the Arctic, wherever it was needed. That's the standard we hold ourselves to.
              </p>

              <p>
                We support the Armed Forces Covenant and donate to forces charities because it matters to us personally. This isn't a marketing angle. It's just how we run the company.
              </p>
            </div>

            <div className="mt-8">
              <Link
                href="/about/story/"
                className="inline-flex items-center px-8 py-4 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-all duration-300 font-semibold"
              >
                How We Got Here
              </Link>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20 p-8">
              {/* Founders Photo - Dan & Rhys */}
              <div className="aspect-square relative rounded-xl overflow-hidden">
                <Image
                  src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/be2ac9ab-2168-45cc-1aee-c9b04567b300/public"
                  alt="Dan Freeman and Rhys Williams - Co-founders of Jerry Can Spirits, Royal Corps of Signals veterans"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
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
