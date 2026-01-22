import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import CartographicBackground from '@/components/CartographicBackground'

export const metadata: Metadata = {
  title: 'Dan Freeman - Founder & Director',
  description: 'Meet Dan Freeman, founder of Jerry Can Spirits. Former Royal Signals Corporal with 12 years of service, now crafting premium spirits with military precision.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/dan-freeman/',
  },
  openGraph: {
    title: 'Dan Freeman - Founder & Director | Jerry Can Spirits®',
    description: 'Former Royal Signals Corporal with 12 years of service, now crafting premium spirits with military precision.',
    url: 'https://jerrycanspirits.co.uk/about/team/dan-freeman',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function DanFreemanPage() {
  return (
    <main className="relative min-h-screen py-20">
      {/* Cartographic Background */}
      <div className="fixed inset-0 z-0">
        <CartographicBackground opacity={0.15} showCoordinates={true} showCompass={true} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/about/team"
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
              {/* Photo */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src="/images/team/Dan_Headshot.jpg"
                  alt="Dan Freeman - Founder & Director of Jerry Can Spirits"
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
                    <p className="text-parchment-200">Founder & Director</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Service</p>
                    <p className="text-parchment-200">Royal Signals</p>
                    <p className="text-parchment-300 text-xs">2012 - 2024 (12 years)</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Rank</p>
                    <p className="text-parchment-200">Corporal</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Deployments</p>
                    <p className="text-parchment-200">Falkland Islands, Afghanistan, Estonia</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Qualifications</p>
                    <p className="text-parchment-200">Essentials in Distilling (CIBD)</p>
                    <p className="text-parchment-300 text-xs">Associate Member</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">Spiced Rum</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Signature Cocktail</p>
                    <p className="text-parchment-200">Zombie</p>
                  </div>
                </div>
              </div>

              {/* Fun Fact */}
              <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold text-sm mb-1">Did You Know?</p>
                    <p className="text-parchment-300 text-sm">
                      Since leaving the forces, Dan hasn't shaved his beard once—and has no intention of starting now.
                    </p>
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
                  Founder & Director
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
                Dan Freeman
              </h1>
              <p className="text-xl text-gold-400 font-semibold">
                Former Royal Signals Corporal · Veteran Entrepreneur
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
                  Former Royal Signals Corporal with 12 years of service from 2012 to 2024, Dan's military career took him from communications operations to information systems engineering, with deployments spanning the Falklands, Afghanistan, and Estonia, alongside exercises across Europe and the United States.
                </p>
              </div>

              {/* The Journey */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  The Journey to Jerry Can Spirits
                </h2>
                <p className="text-parchment-200 leading-relaxed mb-4">
                  The idea of creating a premium rum had been a recurring conversation during late nights with fellow servicemen, but it was Dan who pulled the trigger in July 2025, transforming years of talk into reality. With over 100 different rums sampled and a deep passion for spirits and cocktail craft, Dan brings both expertise and obsession to every bottle.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  Now holding an Essentials in Distilling qualification from the Chartered Institute of Brewers and Distillers (where he serves as an associate member), a personal alcohol licence, and having secured AWRS approval through HMRC, Dan has built Jerry Can Spirits from the ground up.
                </p>
              </div>

              {/* Role & Expertise */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  Role at Jerry Can Spirits
                </h2>
                <p className="text-parchment-200 leading-relaxed mb-4">
                  Following military service, Dan dedicated himself full-time to every facet of the business—operations, finance, legal compliance, web design, SEO, and product development.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  His military-honed skills in attention to detail, operational planning, and logistics management translate directly into the precision and quality that define Jerry Can Spirits. Whether he's perfecting a spiced rum or crafting a flawlessly balanced Zombie cocktail, Dan's approach is unwavering: passion and craft over corporate conformity.
                </p>
              </div>

              {/* Personal Quote */}
              <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <blockquote className="flex-1">
                    <p className="text-xl text-parchment-100 italic leading-relaxed mb-4">
                      "Jerry Can Spirits matters to me because we're in a time when passion, craft, and individuality are taking over ahead of massive faceless corporations. I believe in supporting and elevating those around me, and I'll work tirelessly to see small-batch and craft spirits flourish."
                    </p>
                    <cite className="text-gold-400 font-semibold not-italic">— Dan Freeman</cite>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
