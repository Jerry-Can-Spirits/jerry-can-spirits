'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  MEMBER_LABELS,
  facetFilterOptions,
  filterFacetIndex,
  isFiltering,
  labelFor,
  type FacetIndexItem,
} from '@/lib/cocktail-facets'
import type { FacetCocktail } from '@/lib/facet-data'

/**
 * In-page filter over a facet's cocktails: name, base spirit and difficulty.
 *
 * Takes a name/slug/spirit/difficulty index rather than the card data. A filter
 * needs something to match against and somewhere to go; descriptions and image
 * URLs would multiply the payload for no benefit, and the cards for the current
 * page are already rendered server-side above.
 *
 * The spirit and difficulty controls exist because the hub had them and this
 * page did not, which is what made sending a reader here a downgrade. It also
 * filters across the WHOLE facet rather than the 24 cards on this page, so on
 * an 85-recipe family it reaches recipes the grid has paginated away.
 *
 * Renders results only while something is filtering, so it never duplicates the
 * grid underneath.
 */

const DIFFICULTY_LABELS: Record<string, string> = {
  novice: 'Novice',
  wayfinder: 'Wayfinder',
  trailblazer: 'Trailblazer',
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
        active
          ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
          : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
      }`}
    >
      {children}
    </button>
  )
}

export default function FacetFilter({
  index,
  label,
  cocktails,
  page,
  pageSize,
}: {
  index: FacetIndexItem[]
  label: string
  /** Every cocktail in the facet, name-ordered. Not one page of them. */
  cocktails: FacetCocktail[]
  page: number
  pageSize: number
}) {
  const [query, setQuery] = useState('')
  const [spirit, setSpirit] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string | null>(null)

  /**
   * Apply a base spirit named in the URL fragment, as #spirit=plymouth-gin.
   *
   * The orienting section above a rollup page lists the spirits it covers, and
   * used to link each one to /field-manual/cocktails/?spirit=<value> — the full
   * 376-cocktail index, 94kB, filtered in the browser after loading. Six of
   * those URLs turned up in the August crawl as slow pages, roughly 560kB
   * fetched to reach a view that already existed on the page the reader had
   * just left: the chips below offer exactly the same values, because both are
   * derived from this facet's own contents.
   *
   * A fragment does the same job with no navigation. Crawlers ignore fragments
   * entirely, so no URL is created and nothing is fetched.
   *
   * hashchange as well as mount, because clicking one of those links while
   * already on the page changes the fragment without remounting anything.
   */
  useEffect(() => {
    const applyFromHash = () => {
      const match = /^#spirit=(.+)$/.exec(window.location.hash)
      if (!match) return
      const value = decodeURIComponent(match[1])
      // Only values this facet actually holds. A stale or hand-typed fragment
      // should leave the page as it is rather than filtering to nothing.
      if (!index.some((item) => item.b === value)) return
      setSpirit(value)
      document.getElementById('facet-filter')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    applyFromHash()
    window.addEventListener('hashchange', applyFromHash)
    return () => window.removeEventListener('hashchange', applyFromHash)
  }, [index])

  const state = { q: query, spirit, difficulty }
  const filtering = isFiltering(state)
  const matches = filtering ? filterFacetIndex(index, state) : []

  /**
   * What the grid shows.
   *
   * Idle renders the same slice the server used to, so the first paint and the
   * markup a crawler sees are unchanged and pagination keeps working. Filtering
   * renders matches from the whole facet, ordered by the index rather than by
   * the card list, so the order the filter reports is the order shown.
   */
  const shown = filtering
    ? (() => {
        const bySlug = new Map(cocktails.map((c) => [c.slug.current, c]))
        return matches.map((m) => bySlug.get(m.s)).filter((c): c is FacetCocktail => Boolean(c))
      })()
    : cocktails.slice((page - 1) * pageSize, page * pageSize)

  // Options come from the facet's own contents, so a family holding no
  // trailblazers never offers the control.
  const spirits = facetFilterOptions(index, 'b')
  const difficulties = facetFilterOptions(index, 'd')

  const toggle = (current: string | null, value: string) => (current === value ? null : value)

  return (
    <div className="mb-10 space-y-4">
      <div>
        <label htmlFor="facet-filter" className="sr-only">
          Filter {label} cocktails by name
        </label>
        <input
          id="facet-filter"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${index.length} ${label.toLowerCase()} cocktails by name...`}
          className="w-full px-4 py-3 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400/40 transition-colors"
        />
      </div>

      {spirits.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Base Spirit</h3>
          <div className="flex flex-wrap gap-2">
            {spirits.map((o) => (
              <Chip key={o.value} active={spirit === o.value} onClick={() => setSpirit(toggle(spirit, o.value))}>
                {MEMBER_LABELS[o.value] ?? labelFor(o.value)}{' '}
                <span className="text-parchment-400 font-normal">{o.count}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      {difficulties.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Difficulty Level</h3>
          <div className="flex flex-wrap gap-2">
            {difficulties.map((o) => (
              <Chip
                key={o.value}
                active={difficulty === o.value}
                onClick={() => setDifficulty(toggle(difficulty, o.value))}
              >
                {DIFFICULTY_LABELS[o.value] ?? labelFor(o.value)}{' '}
                <span className="text-parchment-400 font-normal">{o.count}</span>
              </Chip>
            ))}
          </div>
        </div>
      )}

      {filtering && (
        <p className="text-parchment-400 text-sm">
          {matches.length} of {index.length} {matches.length === 1 ? 'match' : 'matches'}
          {matches.length > 0 && ' across every page'}
        </p>
      )}

      {/* The cards, filtered.
        *
        * They used to be rendered by the server below this component and did
        * not react to the filter at all: selecting "Plymouth gin (2)" gave a
        * count of two above a grid still showing twenty-four unrelated drinks.
        * The filter listed matching names as small chips instead, which was a
        * second, worse representation of the same answer.
        *
        * Idle shows the current page, exactly the slice the server used to
        * render, so the markup a crawler sees is unchanged. Filtering searches
        * the whole facet rather than the visible page — gin runs to 74 across
        * four pages and Plymouth gin's two sort onto pages two and three, so
        * filtering the page in front of the reader would have found neither. */}
      {shown.length === 0 ? (
        <p className="text-parchment-300">No cocktail in this list matches that.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {shown.map((c) => (
            <Link
              key={c._id}
              href={`/field-manual/cocktails/${c.slug.current}/`}
              className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300"
            >
              {c.image && (
                <div className="relative aspect-4/3 bg-jerry-green-800/20">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
              )}
              <div className="p-6 space-y-3">
                <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                  {c.name}
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
