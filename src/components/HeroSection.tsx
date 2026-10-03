'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const HERO_IMAGES = [
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/beed84d3-c77d-4ecf-c85f-29719bdea000/public',
    alt: 'Expedition Spiced Rum, front',
    label: 'Front',
  },
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/fffd5ce1-6411-4ab4-6c32-aacf2caa1700/public',
    alt: 'Expedition Spiced Rum, angled',
    label: 'Angled',
  },
  {
    src: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/8ad4c4c5-6c38-4342-c42a-652af5529f00/public',
    alt: 'Expedition Spiced Rum, in the field',
    label: 'In the field',
  },
]

interface HeroSectionProps {
  /** The live price, formatted by the page. Null when Shopify did not answer,
   *  in which case the line is simply not shown rather than shown wrong. */
  price: string | null
}

// On a phone the first screen used to be the carousel and the headline, with
// the price nowhere and the button at 1,189px (Audit B, 3 Oct 2026). The
// content now comes first on phones: pill, headline, price, one button, then
// the bottle. Desktop keeps the two-column layout with the bottle on the
// right. The carousel is desktop-only; a phone gets the one image.
export default function HeroSection({ price }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <section className="relative overflow-hidden sm:min-h-[70vh]">

      {/* Subtle animated gradients */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(107, 112, 92, 0.3) 0%, transparent 50%)
          `
        }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center sm:min-h-[70vh]">

          {/* Content */}
          <div className="text-center lg:text-left">
            {/* Overline Badge */}
            <div className="inline-block px-4 py-2 bg-jerry-green-800 rounded-full border border-gold-500/30 mb-6 sm:mb-8 shadow-lg">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                British Spiced Rum
              </span>
            </div>

            {/* Headline — the proposition, award first. The medal detail and
                judges' note live in the MedalBar directly under the hero; the
                proof is stated once in full there, per VOICE ("an award
                mentioned once is a fact"). */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-5 sm:mb-6 leading-tight">
              <span className="relative" style={{ color: '#fefbf5' }}>
                Two IWSC medals. First year. First bottle.
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-linear-to-r from-gold-500 to-gold-300 rounded-full"></span>
              </span>
              <br />
              <span className="text-gold-300 text-3xl sm:text-4xl lg:text-5xl block mt-4">Expedition Spiced Rum.</span>
            </h1>

            {/* The price, read live, beside what it buys. */}
            {price && (
              <p className="text-parchment-200 text-lg mb-5 sm:mb-6">
                <span className="text-gold-400 font-serif font-bold text-2xl">{price}</span>
                <span className="text-parchment-400"> · 700ml · 40% ABV</span>
              </p>
            )}

            {/* The one button, on the first screen on a phone. One CTA per
                piece of content (VOICE hard rule): Order is the sole button;
                Our story is a text link below the description. */}
            <div className="mb-6 sm:mb-8">
              <Link
                href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                className="w-full sm:w-auto bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl sm:hover:scale-105 inline-flex items-center justify-center"
              >
                Order now
              </Link>
            </div>

            {/* Description */}
            <p className="text-lg sm:text-xl text-parchment-200 mb-4 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Between us, we served 17 years in the Royal Signals. We wanted a proper drink to share with mates. Something with character, made by people who give a damn. We couldn&apos;t find it. So we made it ourselves.
            </p>
            <Link
              href="/about/story/"
              className="inline-block text-gold-300 hover:text-gold-400 text-sm underline underline-offset-4 transition-colors mb-6 sm:mb-8"
            >
              Our story
            </Link>

            {/* Trust Indicators. Numbered bottles moved here from the pill
                badge that used to float over the bottle image — the pill
                wrapped badly at that text length and was removed. */}
            <div className="pt-6 sm:pt-8 border-t border-jerry-green-700">
              <p className="text-gold-300 text-sm font-medium text-center lg:text-left">
                Real Ingredients. No Artificial Flavouring. Veteran Owned. Numbered Small Batches.
              </p>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative">
            <div className="relative bg-linear-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">

              {/* Render only the active image — Next.js fetches all images
                  whose <Image> component is mounted, regardless of opacity,
                  so stacking three was paying for two unused decodes on
                  every initial paint. Browser caches subsequent swaps. */}
              <div
                role="group"
                aria-roledescription="carousel"
                aria-label="Expedition Spiced Rum product views"
                className="aspect-square sm:aspect-4/5 relative"
              >
                <Link
                  href="/shop/product/jerry-can-spirits-expedition-spiced-rum/"
                  aria-label="View Expedition Spiced Rum product page"
                  className="absolute inset-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-gold-400 rounded-2xl"
                >
                  <Image
                    key={HERO_IMAGES[activeIndex].src}
                    src={HERO_IMAGES[activeIndex].src}
                    alt={HERO_IMAGES[activeIndex].alt}
                    fill
                    className="object-contain p-6 sm:p-8 transition-transform duration-300 hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </Link>
                <div aria-live="polite" aria-atomic="true" className="sr-only">
                  {`Image ${activeIndex + 1} of ${HERO_IMAGES.length}: ${HERO_IMAGES[activeIndex].label}`}
                </div>
              </div>

              {/* Dot navigation. Desktop only: a phone gets the one image. */}
              <div className="hidden sm:flex absolute bottom-5 left-0 right-0 justify-center gap-3">
                {HERO_IMAGES.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`View ${image.label}`}
                    className="p-1 flex items-center justify-center"
                  >
                    <span className={`block w-2 h-2 rounded-full transition-all duration-300 ${
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
