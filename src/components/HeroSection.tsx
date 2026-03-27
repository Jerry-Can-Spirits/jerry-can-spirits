'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import CountdownTimer from './CountdownTimer'

const HERO_IMAGES = [
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/beed84d3-c77d-4ecf-c85f-29719bdea000/public',
    alt: 'Expedition Spiced Rum — front',
    label: 'Front',
  },
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/fffd5ce1-6411-4ab4-6c32-aacf2caa1700/public',
    alt: 'Expedition Spiced Rum — angled',
    label: 'Angled',
  },
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/8ad4c4c5-6c38-4342-c42a-652af5529f00/public',
    alt: 'Expedition Spiced Rum — in the field',
    label: 'In the field',
  },
]

export default function HeroSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const delta = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(delta) < 50) return
    setActiveIndex(prev =>
      delta > 0
        ? (prev + 1) % HERO_IMAGES.length
        : (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length
    )
    setTouchStartX(null)
  }

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
                British Spiced Rum
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6 leading-tight">
              <span className="relative" style={{ color: '#fefbf5' }}>
                Veteran-Owned British Rum
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-gold-300 rounded-full"></span>
              </span>
              <br />
              <span className="text-gold-300 text-3xl sm:text-4xl lg:text-5xl block mt-4">Built Without Compromise</span>
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
                Reserve Your Bottle
              </Link>

              <Link
                href="/about/story/"
                className="border-2 border-gold-500 text-gold-300 hover:text-jerry-green-900 hover:bg-gold-500 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center"
              >
                Our Story
              </Link>
            </div>

            {/* CTA Buttons - Mobile */}
            <div className="sm:hidden mb-8">
              <Link
                href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                className="w-full bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                Reserve Your Bottle
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-jerry-green-700">
              <p className="text-gold-300 text-sm font-medium text-center lg:text-left">
                Real Ingredients. No Artificial Flavouring. Veteran Owned. Distilled in Wales.
              </p>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative order-1 lg:order-2">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">

              {/* Images — stacked, fade between active */}
              <div
                className="aspect-[4/5] relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {HERO_IMAGES.map((image, index) => (
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    className={`object-contain p-8 transition-opacity duration-500 ${
                      index === activeIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={index === 0}
                  />
                ))}
              </div>

              {/* Floating Badges */}
              <div className="absolute top-6 left-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                Numbered. Limited to 700.
              </div>

              {/* Prev/Next arrows — mobile only; signifier for swipe gesture */}
              <button
                onClick={() => setActiveIndex(prev => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length)}
                aria-label="Previous image"
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-jerry-green-900/60 backdrop-blur-sm rounded-full border border-gold-500/20 text-parchment-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setActiveIndex(prev => (prev + 1) % HERO_IMAGES.length)}
                aria-label="Next image"
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-jerry-green-900/60 backdrop-blur-sm rounded-full border border-gold-500/20 text-parchment-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Dot navigation */}
              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-3">
                {HERO_IMAGES.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View ${image.label}`}
                    className="p-1 flex items-center justify-center"
                  >
                    <span className={`block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? 'bg-gold-400 scale-125'
                        : 'bg-parchment-600 hover:bg-parchment-400'
                    }`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gold-600 rounded-full opacity-20 blur-2xl"></div>
          </div>

          </div>
        </div>
      </div>

      {/* Scroll indicator — desktop only, mobile users scroll by default */}
      <div className="hidden sm:flex absolute bottom-8 left-0 right-0 justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-1 text-parchment-400 animate-bounce">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

    </section>
  )
}
