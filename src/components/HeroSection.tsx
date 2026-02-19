import Link from 'next/link'
import Image from 'next/image'
import CountdownTimer from './CountdownTimer'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-screen">

      {/* Subtle animated gradients */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(107, 112, 92, 0.3) 0%, transparent 50%)
          `
        }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh] sm:min-h-[80vh]">
          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Overline Badge */}
            <div className="inline-block px-4 py-2 bg-jerry-green-800 rounded-full border border-gold-500/30 mb-8 shadow-lg">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Premium British Rum
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6 leading-tight">
              <span className="relative" style={{ color: '#fefbf5' }}>
                Veteran-Owned Premium British Rum
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-gold-300 rounded-full"></span>
              </span>
              <br />
              <span className="text-gold-300 text-3xl sm:text-4xl lg:text-5xl block mt-4">Expedition Ready</span>
            </h1>

            {/* Description */}
            <p className="text-xl text-parchment-200 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Between us, we served 17 years in the Royal Signals. We wanted a proper drink to share with mates. Something with character, made by people who give a damn. We couldn't find it. So we made it ourselves.
            </p>

            {/* Launch Countdown */}
            <div className="mb-8 p-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20">
              <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-4 text-center">
                April 2026. Pre-order Now
              </div>
              <CountdownTimer />
            </div>

            {/* CTA Buttons - Desktop */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <Link
                href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                className="bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center"
              >
                Pre-order Now
              </Link>

              <Link
                href="/about/story/"
                className="border-2 border-gold-500 text-gold-300 hover:text-jerry-green-900 hover:bg-gold-500 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center"
              >
                Our Story
              </Link>
            </div>

            {/* CTA Buttons - Mobile (Single Button) */}
            <div className="sm:hidden mb-8">
              <Link
                href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Pre-order Now
              </Link>
            </div>

            {/* Trust Indicators - Text Only */}
            <div className="pt-8 border-t border-jerry-green-700">
              <p className="text-gold-300 text-sm font-medium text-center lg:text-left">
                Premium Quality • Secure Shipping • Made in the UK • Veteran Owned
              </p>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">
              {/* Product Image */}
              <div className="aspect-[4/5] flex items-center justify-center p-8">
                <Image
                  src="/images/hero/hero-spiced.webp"
                  alt="Jerry Can Spirits® Premium British Dark Rum Reserve - Expedition Ready Bottle"
                  width={400}
                  height={500}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Floating Badges */}
              <div className="absolute top-6 left-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                Pre-order Now
              </div>

              <div className="absolute bottom-6 right-6 bg-jerry-green-700/80 backdrop-blur-sm text-gold-300 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-gold-500/30 shadow-lg">
                Limited First Batch
              </div>
            </div>

            {/* Decorative elements with gold accents */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gold-600 rounded-full opacity-20 blur-2xl"></div>

          </div>
          </div>
        </div>
      </div>


    </section>
  )
}
