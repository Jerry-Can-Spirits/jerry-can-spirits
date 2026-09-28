import Link from 'next/link'

// The closing row on every team bio: the story first, then everyone else on
// the team. One list so a new person is added here once and every page picks
// them up. Order matches the team page.
const TEAM = [
  { slug: 'dan-freeman', label: 'Meet Dan' },
  { slug: 'rhys-williams', label: 'Meet Rhys' },
  { slug: 'joshua-sisson', label: 'Meet Joshua Sisson' },
  { slug: 'josh-acklam', label: 'Meet Josh Acklam' },
  { slug: 'danny-hughes', label: 'Meet Danny' },
]

export default function TeamMeetRow({ current }: { current: string }) {
  return (
    <section className="band-dark py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/about/story/"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
          >
            <span>Read Our Story</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          {TEAM.filter((member) => member.slug !== current).map((member) => (
            <Link
              key={member.slug}
              href={`/about/team/${member.slug}/`}
              className="inline-flex items-center gap-2 bg-jerry-green-800 hover:bg-jerry-green-700 text-parchment-50 px-6 py-3 rounded-lg font-semibold border-2 border-gold-500/30 hover:border-gold-500/60 transition-all duration-300"
            >
              <span>{member.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
