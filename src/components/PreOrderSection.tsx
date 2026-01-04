'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function PreOrderSection() {
  const [bottlesSold] = useState(127) // Update this dynamically from Shopify
  const totalBottles = 500
  const percentageSold = (bottlesSold / totalBottles) * 100

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Product Image */}
          <div className="order-2 lg:order-1">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">
              <div className="aspect-[4/5] flex items-center justify-center p-8">
                <Image
                  src="/images/hero/hero-spiced.webp"
                  alt="Jerry Can Spirits Premium British Rum - First Batch Edition"
                  width={400}
                  height={500}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              {/* Numbered Badge */}
              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                First Batch Edition
              </div>

              {/* Limited Badge */}
              <div className="absolute bottom-6 left-6 bg-jerry-green-700/80 backdrop-blur-sm text-gold-300 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-gold-500/30 shadow-lg">
                Limited to 500
              </div>
            </div>
          </div>

          {/* Right Column - Pre-Order Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Reserve Your Bottle
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              Secure Your Place in History
            </h2>

            <p className="text-xl text-parchment-300 mb-6 leading-relaxed">
              Be among the first 500 adventurers to receive a numbered First Batch Edition bottle.
              Pre-order now and lock in exclusive early supporter pricing.
            </p>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-parchment-200 font-semibold">
                  {bottlesSold} of {totalBottles} bottles reserved
                </span>
                <span className="text-gold-300 font-semibold">
                  {Math.round(percentageSold)}% claimed
                </span>
              </div>
              <div className="w-full h-3 bg-jerry-green-800/60 rounded-full overflow-hidden border border-gold-500/20">
                <div
                  className="h-full bg-gradient-to-r from-gold-600 to-gold-400 transition-all duration-500"
                  style={{ width: `${percentageSold}%` }}
                />
              </div>
              <p className="text-parchment-400 text-sm mt-2">
                Only {totalBottles - bottlesSold} bottles remaining
              </p>
            </div>

            {/* Benefits List */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
              <h3 className="text-gold-300 font-semibold mb-4">Pre-Order Benefits:</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Individually numbered First Batch Edition bottle</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Save £5 as an early supporter (£35 vs £40)</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Priority shipping - first to receive in April 2026</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Exclusive access to limited releases & events</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-parchment-200">Certificate of authenticity signed by founders</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Pre-Order Now - £35
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <Link
                href="/about/story"
                className="group border-2 border-gold-500 text-gold-300 hover:text-jerry-green-900 hover:bg-gold-500 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
              >
                Learn Our Story
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

            {/* Trust Badge */}
            <div className="mt-6 pt-6 border-t border-gold-500/20">
              <p className="text-parchment-300 text-sm text-center sm:text-left">
                <span className="text-gold-300 font-semibold">100% Secure</span> • Free UK Delivery • Money-Back Guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
