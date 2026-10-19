import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import TeamMeetRow from '@/components/TeamMeetRow'
import { OG_IMAGE } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'

const PHOTO = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2d4ac61a-0e68-460d-895f-839bc7c69b00/public'
// A square head-and-shoulders crop of the same full-length photo, cut by
// Cloudflare Images (trim=top;right;bottom;left in source pixels, 318x767).
const HEADSHOT = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2d4ac61a-0e68-460d-895f-839bc7c69b00/trim=25;98;542;20'

// Person schema. Only what has been confirmed: name, role, photo and the
// company. Service history and the rest are added as they arrive.
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Joshua Sisson',
  jobTitle: 'Head of Sales',
  url: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson/',
  image: PHOTO,
  description: 'Head of Sales at Jerry Can Spirits.',
  worksFor: ORG_REF,
}

const DESCRIPTION =
  'Joshua Sisson, Head of Sales at Jerry Can Spirits, on why the rum has to stand on its own and on getting it into people’s hands.'

export const metadata: Metadata = {
  title: 'Joshua Sisson - Head of Sales',
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson/',
  },
  openGraph: {
    title: 'Joshua Sisson - Head of Sales | Jerry Can Spirits®',
    description: DESCRIPTION,
    url: 'https://jerrycanspirits.co.uk/about/team/joshua-sisson',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'profile',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Joshua Sisson - Head of Sales | Jerry Can Spirits®',
    description: DESCRIPTION,
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function JoshuaSissonPage() {
  return (
    <main>
      <StructuredData data={personSchema} id="joshua-sisson-person-schema" />

      {/* Who he is: header, photo slot, quick facts and the bio. */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about/story' },
              { label: 'Team', href: '/about/team' },
              { label: 'Joshua Sisson' },
            ]}
            className="mb-8"
          />

          <Link
            href="/about/team/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-400 transition-colors mb-8 group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Team</span>
          </Link>

          <SectionHeading as="h1" eyebrow="Head of Sales">
            Joshua Sisson
          </SectionHeading>

          <div className="grid lg:grid-cols-3 gap-12">
            {/* Left column: photo and quick facts */}
            <div className="lg:col-span-1 space-y-6">
              {/* The headshot crop: the full-length photo would show only his
                  chest in a square. */}
              <div className="relative aspect-square rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src={HEADSHOT}
                  alt="Joshua Sisson - Head of Sales at Jerry Can Spirits"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
              </div>

              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-4 pb-2 border-b border-gold-500/20">
                  Quick Facts
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gold-400 font-semibold mb-1">Role</p>
                    <p className="text-parchment-200">Head of Sales</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column: the bio, in his words */}
            <div className="lg:col-span-2">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-5">
                <h2 className="text-2xl font-serif font-bold text-white">Why Jerry Can Spirits Matters to Me</h2>
                <p className="text-parchment-200 leading-relaxed">
                  For me, Jerry Can Spirits is about much more than selling a bottle of rum. I believe in what we’re building, the people behind it, and what the brand stands for.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  I came into Jerry Can Spirits because I saw the potential to build something genuinely different. We’re not trying to imitate the biggest names on the shelf. We’re building our own identity, backed by hard work, personality and a product that I’m genuinely proud to put in front of people.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  What really convinced me was the rum itself. Expedition Spiced Rum has to stand on its own. You can have great branding, a good story and strong marketing, but if what’s inside the bottle doesn’t deliver, none of that matters. I believe ours does.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  My role is about getting that bottle into people’s hands: building relationships with pubs, bars, retailers and customers, getting people to actually taste it, and turning Jerry Can Spirits from a small independent name into a brand people recognise and ask for.
                </p>
                <p className="text-parchment-200 leading-relaxed">
                  I’m proud to represent a company that has been built from the ground up. There’s something exciting about being there at the beginning, knowing that every new stockist, every tasting and every person who recommends our rum is another step forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* His line, on its own */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <figure className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 sm:p-10 border border-gold-500/20 text-center">
            <blockquote className="text-xl sm:text-2xl font-serif text-white leading-relaxed">
              “I believe in Jerry Can Spirits because I believe in the product. You can build the best brand in the world, but the liquid still has to deliver. Ours does. My job now is to get it into people’s hands and give them the chance to discover that for themselves.”
            </blockquote>
            <figcaption className="mt-6 text-sm uppercase tracking-widest text-gold-300 font-semibold">
              Joshua Sisson, Head of Sales
            </figcaption>
          </figure>
        </div>
      </section>

      <TeamMeetRow current="joshua-sisson" />
    </main>
  )
}
