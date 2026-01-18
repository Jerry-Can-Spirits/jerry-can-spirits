import type { Metadata } from 'next'
import Link from 'next/link'
// import Image from 'next/image' // Uncomment when photo is available
import CartographicBackground from '@/components/CartographicBackground'

export const metadata: Metadata = {
  title: 'Rhys Williams - Co-Founder & Director | Jerry Can Spirits',
  description: 'Meet Rhys Williams, co-founder of Jerry Can Spirits. Royal Signals veteran bringing military precision to premium British rum.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/rhys-williams/',
  },
  openGraph: {
    title: 'Rhys Williams - Co-Founder & Director | Jerry Can Spirits',
    description: 'Royal Signals veteran bringing military precision to premium British rum.',
    url: 'https://jerrycanspirits.co.uk/about/team/rhys-williams',
    siteName: 'Jerry Can Spirits',
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
              {/* Photo Placeholder */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20 bg-jerry-green-800/60">
                {/* TODO: Replace with actual photo when available */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <svg className="w-24 h-24 text-gold-500/30 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <p className="text-gold-500/50 text-sm">Photo Coming Soon</p>
                  </div>
                </div>
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
                    {/* TODO: Update service years when bio received */}
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Rank</p>
                    <p className="text-parchment-200">Details coming soon</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">Details coming soon</p>
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
                Royal Signals Veteran · Co-Founder
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
                  Rhys served in the Royal Corps of Signals alongside Dan, where they developed the shared vision that would eventually become Jerry Can Spirits. His military background brings invaluable experience to the team.
                </p>
                <p className="text-parchment-300 italic mt-4 text-sm">
                  Full biography coming soon.
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
                <p className="text-parchment-200 leading-relaxed">
                  As co-founder, Rhys plays a vital role in bringing Jerry Can Spirits to life. The idea of creating premium rum emerged from countless conversations during their time serving together, and Rhys brings his unique skills and perspective to every aspect of the business.
                </p>
                <p className="text-parchment-300 italic mt-4 text-sm">
                  More details coming soon.
                </p>
              </div>

              {/* Role */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  Role at Jerry Can Spirits
                </h2>
                <p className="text-parchment-200 leading-relaxed">
                  As Co-Founder and Director, Rhys works alongside Dan to ensure Jerry Can Spirits delivers on its promise of premium quality and military precision in every bottle.
                </p>
                <p className="text-parchment-300 italic mt-4 text-sm">
                  Full role details coming soon.
                </p>
              </div>

              {/* Coming Soon Notice */}
              <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-xl text-parchment-100 leading-relaxed mb-2">
                      Full Biography Coming Soon
                    </p>
                    <p className="text-parchment-300">
                      We're currently putting together Rhys's complete story. Check back soon to learn more about his journey from the Royal Signals to co-founding Jerry Can Spirits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
