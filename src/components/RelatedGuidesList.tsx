import Link from 'next/link'

export interface GuideLink {
  guide: { _id: string; title: string; slug: { current: string } }
  sectionAnchor?: string
  linkText?: string
}

// Matches the slugify used for guide section ids (GuideSections.tsx), so
// sectionAnchor values written as the heading text land on the right anchor.
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// The cocktail page's "Master the Techniques" pattern, shared for equipment
// and ingredient pages: guide links with optional section anchors and
// override text.
export default function RelatedGuidesList({ guides }: { guides: GuideLink[] }) {
  const valid = guides.filter((g) => g?.guide?.slug?.current)
  if (valid.length === 0) return null

  return (
    <div className="space-y-3">
      {valid.map((item, index) => {
        const href = item.sectionAnchor
          ? `/guides/${item.guide.slug.current}/#${slugify(item.sectionAnchor)}`
          : `/guides/${item.guide.slug.current}/`
        const displayText = item.linkText || (item.sectionAnchor ? `${item.guide.title}: ${item.sectionAnchor}` : item.guide.title)
        return (
          <Link
            key={index}
            href={href}
            className="flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
          >
            <svg className="w-5 h-5 text-gold-400 shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{displayText}</span>
          </Link>
        )
      })}
    </div>
  )
}
