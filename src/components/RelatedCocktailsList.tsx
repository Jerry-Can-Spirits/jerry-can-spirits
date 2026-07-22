import Link from 'next/link'

interface CocktailLink {
  _id: string
  name: string
  slug: { current: string }
}

const VISIBLE_COUNT = 6

// Renders the merged (manual + derived) cocktail list for equipment and
// ingredient pages. The first six render as cards; the remainder sit behind
// a native <details> expander — no client JS, and every link stays in the
// server-rendered DOM for crawlers.
export default function RelatedCocktailsList({ cocktails }: { cocktails: CocktailLink[] }) {
  const valid = cocktails.filter((c) => c?.slug?.current)
  if (valid.length === 0) return null

  const visible = valid.slice(0, VISIBLE_COUNT)
  const hidden = valid.slice(VISIBLE_COUNT)

  const card = (cocktail: CocktailLink) => (
    <Link
      key={cocktail._id}
      href={`/field-manual/cocktails/${cocktail.slug.current}`}
      className="flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
    >
      <svg className="w-5 h-5 text-gold-400 shrink-0 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
      <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{cocktail.name}</span>
    </Link>
  )

  if (hidden.length === 0) {
    return <div className="grid sm:grid-cols-2 gap-3">{valid.map(card)}</div>
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">{visible.map(card)}</div>
      <details className="group/details mt-3">
        <summary className="cursor-pointer list-none inline-flex items-center gap-2 px-4 py-2 bg-jerry-green-800/40 border border-gold-500/30 rounded-lg text-gold-300 text-sm font-semibold hover:bg-jerry-green-800/60 hover:border-gold-400/40 transition-all select-none">
          <svg className="w-4 h-4 transition-transform group-open/details:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="group-open/details:hidden">Show all {valid.length} cocktails</span>
          <span className="hidden group-open/details:inline">Show fewer</span>
        </summary>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">{hidden.map(card)}</div>
      </details>
    </>
  )
}
