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
            className="block p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
          >
            <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{displayText}</span>
          </Link>
        )
      })}
    </div>
  )
}
