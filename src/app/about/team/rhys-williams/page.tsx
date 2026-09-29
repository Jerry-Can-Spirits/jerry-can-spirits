import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import TeamMeetRow from '@/components/TeamMeetRow'
import { OG_IMAGE } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

// Person schema for co-founder profile
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Rhys Williams',
  jobTitle: 'Co-Founder & Director',
  url: 'https://jerrycanspirits.co.uk/about/team/rhys-williams/',
  description: 'Royal Signals veteran, Formula One telecommunications specialist, and co-founder of Jerry Can Spirits.',
  worksFor: ORG_REF,
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
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Rhys Williams - Co-Founder & Director | Jerry Can Spirits®',
    description: 'Royal Signals veteran, Formula One telecommunications specialist, and co-founder of Jerry Can Spirits.',
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RhysWilliamsPage() {
  return (
    <main>
      <StructuredData data={personSchema} id="rhys-williams-person-schema" />

      {/* Who he is: header, photo, quick facts and where the story starts. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

          <SectionHeading as="h1" eyebrow="Co-Founder & Director" intro={<span className="text-gold-400 font-semibold">Royal Signals Veteran · Formula One · Live Events</span>}>
            Rhys Williams
          </SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left Column - Photo & Quick Info */}
            <div className="lg:col-span-1 space-y-6">
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
                    <p className="text-parchment-300 text-xs">2011 - 2016 (5 years)</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Trade</p>
                    <p className="text-parchment-200">Installation Technician</p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Favourite Spirit</p>
                    <p className="text-parchment-200">
                      <Link href="/field-manual/ingredients/spiced-rum/" className="hover:text-gold-300 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Spiced Rum</Link>
                    </p>
                  </div>
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Signature Cocktail</p>
                    <p className="text-parchment-200">
                      <Link href="/field-manual/cocktails/mojito/" className="hover:text-gold-300 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Mojito</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - where the story starts. Two panels here so the
                column is as tall as the photo and the facts beside it. */}
            <div className="lg:col-span-2">
              <div className="prose prose-invert max-w-none space-y-6">
                {/* Military Background */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h2 className="text-2xl font-serif font-bold text-white mb-4">
                    Military Service
                  </h2>
                  <p className="text-parchment-200 leading-relaxed">
                    I began my career in the British Army, serving with the Royal Signals as an Installation Technician from 2011 to 2016. During that time, I developed a deep understanding of critical communications, infrastructure deployment, and working under pressure in demanding environments.
                  </p>
                </div>

                {/* In his words: the line from his story, pulled out so the
                    column beside the facts is not one panel and empty green.
                    The story band keeps all three of its panels. */}
                <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                  <blockquote>
                    <p className="text-xl text-parchment-100 italic leading-relaxed mb-4">
                      "That passion has now become a business."
                    </p>
                    <cite className="text-gold-400 font-semibold not-italic">Rhys Williams</cite>
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The rest of the story */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The story">Behind Rhys</SectionHeading>

          <div className="prose prose-invert max-w-none space-y-6">
            {/* Post-Military Career */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
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
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
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
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                Jerry Can Spirits
              </h2>
              <p className="text-parchment-200 leading-relaxed">
                I&apos;m the co-founder of Jerry Can Spirits, combining engineering discipline, creativity, and a rebellious streak to build bold, distinctive rum with real character.
              </p>
            </div>
          </div>
        </div>
      </section>

      <TeamMeetRow current="rhys-williams" />
    </main>
  )
}
