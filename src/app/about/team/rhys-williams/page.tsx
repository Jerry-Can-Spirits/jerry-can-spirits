import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import CartographicBackground from '@/components/CartographicBackground'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'

// Person schema for co-founder profile
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Rhys Williams',
  jobTitle: 'Co-Founder & Director',
  url: 'https://jerrycanspirits.co.uk/about/team/rhys-williams/',
  description: 'Royal Signals veteran, Formula One telecommunications specialist, and co-founder of Jerry Can Spirits.',
  worksFor: {
    '@type': 'Organization',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
  },
  alumniOf: {
    '@type': 'Organization',
    name: 'Royal Corps of Signals, British Army',
  },
  knowsAbout: ['Rum', 'Telecommunications', 'Formula One', 'Live Events', 'Military Service'],
}

export const metadata: Metadata = {
  title: 'Rhys Williams - Co-Founder & Director',
  description: 'Meet Rhys Williams, co-founder of Jerry Can Spirits. Royal Signals veteran, Formula One telecommunications specialist, and passionate rum maker.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/rhys-williams/',
  },
  openGraph: {
    title: 'Rhys Williams - Co-Founder & Director | Jerry Can Spirits®',
    description: 'Royal Signals veteran, Formula One telecommunications specialist, and co-founder of Jerry Can Spirits.',
    url: 'https://jerrycanspirits.co.uk/about/team/rhys-williams',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RhysWilliamsPage() {
  return (
    <main className="relative min-h-screen py-20">
      <StructuredData data={personSchema} id="rhys-williams-person-schema" />
      {/* Cartographic Background */}
      <div className="fixed inset-0 z-0">
        <CartographicBackground opacity={0.15} showCoordinates={true} showCompass={true} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'About', href: '/about/story' },
            { label: 'Team', href: '/about/team' },
            { label: 'Rhys Williams' },
          ]}
          className="mb-8"
        />

        {/* Back Button */}
        <Link
          href="/about/team/"
          className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors mb-8 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Team</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Photo & Quick Info */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Profile Photo */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/bcacb452-4f56-4676-b4c8-ac6afa7c1e00/public"
                  alt="Rhys Williams - Co-Founder & Director of Jerry Can Spirits"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>

              {/* Quick Facts */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-4 pb-2 border-b border-gold-500/20">
                  Quick Facts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Role</p>
                    <p className="text-parchment-200">Co-Founder & Director</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Service</p>
                    <p className="text-parchment-200">Royal Signals</p>
                    <p className="text-parchment-300 text-xs">2011 – 2016 (5 years)</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Trade</p>
                    <p className="text-parchment-200">Installation Technician</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">Spiced Rum</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Signature Cocktail</p>
                    <p className="text-parchment-200">Mojito</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Full Bio */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
                <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                  Co-Founder & Director
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
                Rhys Williams
              </h1>
              <p className="text-xl text-gold-400 font-semibold">
                Royal Signals Veteran · Formula One · Live Events
              </p>
            </div>

            {/* Bio Content */}
            <div className="prose prose-invert max-w-none space-y-6">
              {/* Military Background */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  Military Service
                </h2>
                <p className="text-parchment-200 leading-relaxed">
                  I began my career in the British Army, serving with the Royal Signals as an Installation Technician from 2011 to 2016. During that time, I developed a deep understanding of critical communications, infrastructure deployment, and working under pressure in demanding environments.
                </p>
              </div>

              {/* Post-Military Career */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Life After the Army
                </h2>
                <p className="text-parchment-200 leading-relaxed mb-4">
                  After leaving, I transitioned into motorsport, working in onboard communications for Formula One. This role took me around the world, operating at the sharp end of high-performance, time-critical telecommunications where failure simply isn&apos;t an option.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  Today, I manage telecommunications at large-scale live events, including festivals and major sporting occasions, overseeing complex temporary networks that keep events connected, safe, and operational.
                </p>
              </div>

              {/* Passion for Spirits */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  A Passion for Making Alcohol
                </h2>
                <p className="text-parchment-200 leading-relaxed mb-4">
                  Alongside my technical career, I&apos;ve always had a passion for making alcohol. What started as home-brewed beer and cider as a teenager evolved into a long-standing love for spiced rum, its history, flavour, and character.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  That passion has now become a business.
                </p>
              </div>

              {/* Jerry Can Spirits */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  Jerry Can Spirits
                </h2>
                <p className="text-parchment-200 leading-relaxed">
                  I&apos;m the co-founder of Jerry Can Spirits, combining engineering discipline, creativity, and a rebellious streak to build bold, distinctive rum with real character.
                </p>
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/about/story/"
                  className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <span>Read Our Story</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/about/team/dan-freeman/"
                  className="inline-flex items-center gap-2 bg-jerry-green-800 hover:bg-jerry-green-700 text-parchment-50 px-6 py-3 rounded-lg font-semibold border-2 border-gold-500/30 hover:border-gold-500/60 transition-all duration-300"
                >
                  <span>Meet Dan</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
