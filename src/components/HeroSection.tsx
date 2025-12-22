'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function HeroSection() {
  const [timeToLaunch, setTimeToLaunch] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  // Countdown to April 2026 launch
  useEffect(() => {
    const launchDate = new Date('2026-04-01T00:00:00').getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = launchDate - now

      if (distance > 0) {
        setTimeToLaunch({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const scrollToSignup = () => {
    // This will scroll to the Klaviyo signup component when built
    const signupElement = document.getElementById('newsletter-signup')
    if (signupElement) {
      signupElement.scrollIntoView({ behavior: 'smooth' })
    }
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
                Premium British Rum
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6 leading-tight">
              <span className="relative" style={{ color: '#fefbf5' }}>
                Expedition Ready
                <span className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-gold-500 to-gold-300 rounded-full"></span>
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-parchment-200 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Premium spirits engineered for adventure. Crafted with British precision and Caribbean soul for those who venture beyond the ordinary.
            </p>

            {/* Launch Countdown */}
            <div className="mb-8 p-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20">
              <div className="text-gold-300 text-sm font-semibold uppercase tracking-widest mb-4 text-center">
                Launching April 2026
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
                <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
                  <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.days}</div>
                  <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Days</div>
                </div>
                <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
                  <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.hours}</div>
                  <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Hours</div>
                </div>
                <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
                  <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.minutes}</div>
                  <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Mins</div>
                </div>
                <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
                  <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.seconds}</div>
                  <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Secs</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons - Desktop */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
              <button
                onClick={scrollToSignup}
                className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                Notify Me
                <svg 
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5h5v5z" />
                </svg>
              </button>
              
              <Link
                href="/about/story"
                className="group border-2 border-gold-500 text-gold-300 hover:text-jerry-green-900 hover:bg-gold-500 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 flex items-center justify-center gap-2"
              >
                Our Story
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

            {/* CTA Buttons - Mobile (Single Button) */}
            <div className="sm:hidden mb-8">
              <button
                onClick={scrollToSignup}
                className="w-full group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Notify Me
                <svg 
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5h5v5z" />
                </svg>
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-8 border-t border-jerry-green-700">
              <div className="flex items-center gap-2 text-gold-300">
                <Image
                  src="/images/hero/premium-quality.png"
                  alt="Premium Quality British Rum Badge"
                  width={24}
                  height={24}
                  className="w-6 h-6 sm:w-5 sm:h-5"
                />
                <span className="text-sm font-medium">Premium Quality</span>
              </div>

              <div className="flex items-center gap-2 text-gold-300">
                <Image
                  src="/images/hero/padlock.svg"
                  alt="Secure and Tracked Delivery"
                  width={24}
                  height={24}
                  className="w-6 h-6 sm:w-5 sm:h-5"
                />
                <span className="text-sm font-medium">Secure Shipping</span>
              </div>

              <div className="flex items-center gap-2 text-gold-300">
                <Image
                  src="/images/hero/union-flag.png"
                  alt="Proudly Made in the United Kingdom"
                  width={24}
                  height={24}
                  className="w-6 h-6 sm:w-5 sm:h-5"
                />
                <span className="text-sm font-medium">Made in the UK</span>
              </div>
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
                  priority
                />
              </div>
              
              {/* Floating Badges */}
              <div className="absolute top-6 left-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                Coming Soon
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

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>

    </section>
  )
}