import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import CartographicBackground from '@/components/CartographicBackground'

export const metadata: Metadata = {
  title: 'Meet the Team | Jerry Can Spirits® - Veteran-Owned Craft Distillery',
  description: 'Meet the veteran founders behind Jerry Can Spirits. Former Royal Signals soldiers bringing military precision and passion to premium craft spirits.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/',
  },
  openGraph: {
    title: 'Meet the Team | Jerry Can Spirits®',
    description: 'Meet the veteran founders behind Jerry Can Spirits. Former Royal Signals soldiers bringing military precision to craft spirits.',
    url: 'https://jerrycanspirits.co.uk/about/team',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

const teamMembers = [
  {
    name: 'Dan Freeman',
    role: 'Founder & Director',
    slug: 'dan-freeman',
    service: 'Royal Signals, 2012-2024',
    rank: 'Corporal',
    specialty: 'Operations & Product Development',
    quote: 'Passion and craft over corporate conformity.',
    image: '/images/team/Dan_Headshot.jpg',
  },
  {
    name: 'Rhys Williams',
    role: 'Co-Founder & Operations',
    slug: 'rhys-williams',
    service: 'Royal Signals',
    rank: 'TBC',
    specialty: 'Business Strategy',
    quote: 'Coming soon...',
    image: null,
  },
]

export default function TeamPage() {
  return (
    <main className="relative min-h-screen py-20">
      {/* Cartographic Background */}
      <div className="fixed inset-0 z-0">
        <CartographicBackground opacity={0.15} showCoordinates={true} showCompass={true} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The Squad
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Meet the Team
          </h1>
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            From military service to craft spirits. The veteran founders bringing precision,
            passion, and adventure to every bottle of Jerry Can Spirits.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member) => (
            <Link
              key={member.slug}
              href={`/about/team/${member.slug}`}
              className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-500/40 transition-all hover:transform hover:-translate-y-1"
            >
              {/* Photo */}
              <div className="mb-6 relative">
                {member.image ? (
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-gold-500/20">
                    <Image
                      src={member.image}
                      alt={`${member.name} - ${member.role}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                ) : (
                  <>
                    <div className="aspect-square bg-gradient-to-br from-jerry-green-700/50 to-jerry-green-900/50 rounded-lg flex items-center justify-center border border-gold-500/20">
                      <svg className="w-24 h-24 text-gold-500/30" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    {/* Photo Coming Soon Badge */}
                    <div className="absolute top-2 right-2 px-3 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-semibold">Photo Coming Soon</span>
                    </div>
                  </>
                )}
              </div>

              {/* Name & Role */}
              <div className="mb-4">
                <h2 className="text-2xl font-serif font-bold text-white mb-1 group-hover:text-gold-300 transition-colors">
                  {member.name}
                </h2>
                <p className="text-gold-400 font-semibold">{member.role}</p>
              </div>

              {/* Military Service */}
              <div className="mb-4 pb-4 border-b border-gold-500/20">
                <div className="flex items-center gap-2 text-sm text-parchment-300 mb-1">
                  <svg className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                  <span>{member.service}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-parchment-300">
                  <svg className="w-4 h-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  <span>{member.rank} · {member.specialty}</span>
                </div>
              </div>

              {/* Quote */}
              <blockquote className="italic text-parchment-400 text-sm">
                "{member.quote}"
              </blockquote>

              {/* Read More Arrow */}
              <div className="mt-6 flex items-center gap-2 text-gold-300 font-semibold group-hover:gap-3 transition-all">
                <span>Read Full Bio</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="mt-16 max-w-4xl mx-auto bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gold-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-gold-300 mb-3">Our Mission</h3>
              <p className="text-parchment-200 leading-relaxed">
                We believe we're in a time when passion, craft, and individuality are taking over ahead of massive
                faceless corporations. <Link href="/" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Jerry Can Spirits</Link> is built on the foundation of supporting and elevating those
                around us, working tirelessly to see small-batch and craft spirits flourish. Every bottle is a testament
                to precision, adventure, and the uncompromising standards learned through military service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
