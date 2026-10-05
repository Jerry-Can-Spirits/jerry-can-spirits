import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Meet the Team Behind Jerry Can Spirits',
  description: 'Meet Dan and Rhys, the Royal Signals veterans behind Jerry Can Spirits. Two mates who decided to stop talking about it and actually have a go.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/about/team/',
  },
  openGraph: {
    title: 'Meet the Team | Jerry Can Spirits®',
    description: 'Meet Dan and Rhys, the Royal Signals veterans behind Jerry Can Spirits. Two mates who decided to stop talking about it and actually have a go.',
    url: 'https://jerrycanspirits.co.uk/about/team',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Meet the Team | Jerry Can Spirits®',
    description: 'Meet Dan and Rhys, the Royal Signals veterans behind Jerry Can Spirits. Two mates who decided to stop talking about it and actually have a go.',
    images: OG_IMAGE,
  },
  robots: {
    index: true,
    follow: true,
  },
}

interface TeamMember {
  name: string
  role: string
  /** Set once the person has a bio page under /about/team/. Without one the card does not link. */
  slug?: string
  service?: string
  rank?: string
  specialty?: string
  quote?: string
  /** Cloudflare Images delivery URL. Absent until a photo has been supplied; the card shows its own placeholder. */
  image?: string
}

// Placeholders exist so the cards and pages are filled in rather than built
// from scratch when the details and photos arrive. Danny Hughes (28 Sep 2026)
// has a page with nothing beyond the name
// confirmed. Joshua Sisson's role, bio and quote arrived 25 Sep; service,
// rank and photo are still to come.
const teamMembers: TeamMember[] = [
  {
    name: 'Dan Freeman',
    role: 'Founder & Director',
    slug: 'dan-freeman',
    service: 'Royal Signals, 2012-2024',
    rank: 'Corporal',
    specialty: 'Operations & Product Development',
    quote: 'Passion and craft over corporate conformity.',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/1a3a3fdd-fdd8-482c-2088-660df51c6c00/public',
  },
  {
    name: 'Rhys Williams',
    role: 'Co-Founder & Operations',
    slug: 'rhys-williams',
    service: 'Royal Signals, 2011-2016',
    rank: 'Installation Technician',
    specialty: 'Business Strategy',
    quote: 'That passion has now become a business.',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/bcacb452-4f56-4676-b4c8-ac6afa7c1e00/public',
  },
  {
    name: 'Joshua Sisson',
    role: 'Head of Sales',
    slug: 'joshua-sisson',
    // The opening line of his quote on the bio page; the card has room for one
    // sentence, the page carries all four.
    quote: 'I believe in Jerry Can Spirits because I believe in the product.',
  },
  {
    name: 'Danny Hughes',
    role: 'Details to follow.',
    slug: 'danny-hughes',
  },
]

function TeamCard({ member }: { member: TeamMember }) {
  const body = (
    <>
      {/* Photo */}
      <div className="mb-6 relative">
        {member.image ? (
          <div className="aspect-3/4 relative rounded-lg overflow-hidden border border-gold-500/20">
            <Image
              src={member.image}
              alt={`${member.name} - ${member.role}`}
              fill
              className="object-cover object-top"
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 50vw, 25vw"
              priority
            />
          </div>
        ) : (
          <>
            <div className="aspect-3/4 bg-linear-to-br from-jerry-green-700/50 to-jerry-green-900/50 rounded-lg flex items-center justify-center border border-gold-500/20">
              <svg className="w-24 h-24 text-gold-500/30" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="absolute top-2 right-2 px-3 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
              <span className="text-jerry-green-900 text-xs font-semibold">Photo Coming Soon</span>
            </div>
          </>
        )}
      </div>

      {/* Name & Role */}
      <div className="mb-4">
        <h3 className="text-2xl font-serif font-bold text-white mb-1 group-hover:text-gold-300 transition-colors">
          {member.name}
        </h3>
        <p className="text-gold-400 font-semibold">{member.role}</p>
      </div>

      {/* Military Service */}
      {member.service && (
        <div className="mb-4 pb-4 border-b border-gold-500/20">
          <div className="text-sm text-parchment-300 mb-1">{member.service}</div>
          {member.rank && (
            <div className="text-sm text-parchment-300">{member.rank}{member.specialty ? ` · ${member.specialty}` : ''}</div>
          )}
        </div>
      )}

      {/* Quote */}
      {member.quote && (
        <blockquote className="italic text-parchment-400 text-sm">
          &ldquo;{member.quote}&rdquo;
        </blockquote>
      )}

      {/* Read More Arrow */}
      {member.slug && (
        <div className="mt-6 flex items-center gap-2 text-gold-300 font-semibold group-hover:gap-3 transition-all">
          <span>Read Full Bio</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      )}
    </>
  )

  // The card ground is island-matched, so inside the light band it becomes
  // the solid green panel and its text flips back to the dark-ground tokens.
  const cardClass =
    'block h-full bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20'

  if (!member.slug) {
    return <div className={cardClass}>{body}</div>
  }
  return (
    <Link
      href={`/about/team/${member.slug}/`}
      className={`group ${cardClass} hover:border-gold-500/40 transition-all hover:transform hover:-translate-y-1`}
    >
      {body}
    </Link>
  )
}

export default function TeamPage() {
  return (
    <main>
      {/* Header */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'About', href: '/about/story' },
              { label: 'Team' },
            ]}
            className="mb-8"
          />
          <SectionHeading
            as="h1"
            eyebrow="The Squad"
            intro={
              <>
                We both served in the Royal Signals before deciding to have a crack at building a spirits company.
                Read more about <Link href="/about/story/" className="text-gold-300 hover:text-gold-400 underline">how we got here</Link>.
              </>
            }
          >
            Meet the Team
          </SectionHeading>
        </div>
      </section>

      {/* Team */}
      <section className="band-light py-16" aria-labelledby="team-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading id="team-heading" eyebrow="Who We Are">
            The Team
          </SectionHeading>
          <ScrollRow
            ariaLabel="The Jerry Can Spirits team"
            cols="md:grid-cols-2 lg:grid-cols-4"
            items={teamMembers.map((member) => (
              <TeamCard key={member.name} member={member} />
            ))}
          />
        </div>
      </section>

      {/* Mission Statement */}
      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-gold-300 mb-3">What We&apos;re About</h2>
            <p className="text-parchment-200 leading-relaxed">
              We reckon there&apos;s room for smaller brands that actually care about what they make. We&apos;re not trying
              to compete with the big corporations – we&apos;re just trying to make spirits we&apos;re proud of and build something
              real along the way. Check out our <Link href="/shop/spirits/" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Expedition Spiced Rum</Link> to see what we&apos;ve been working on.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
