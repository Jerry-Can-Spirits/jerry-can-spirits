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
 * A facet's cocktails, filtered in place by name, base spirit and difficulty.
 *
 * It owns the cards as well as the controls. They used to be rendered by the
 * server below this component and ignored the filter entirely: selecting
 * "Plymouth gin (2)" gave a count of two above a grid of twenty-four unrelated
 * drinks, with the matches listed separately as small name chips. Two
 * representations of one answer, and the wrong one was the prominent one.
 *
 * It takes the WHOLE facet, not one page. Gin holds 74 across four pages of 24
 * and Plymouth gin's two sort onto pages two and three, so filtering the cards
 * in front of the reader would have found neither. The index always worked this
 * way, which is why the count was right while the grid was not.
 *
 * Idle renders exactly the page slice the server used to, so the first paint
 * and the markup a crawler sees are unchanged, and the pagination passed as
 * children is left alone.
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
  children,
}: {
  index: FacetIndexItem[]
  label: string
  /** Every cocktail in the facet, name-ordered. Not one page of them. */
  cocktails: FacetCocktail[]
  page: number
  pageSize: number
  /**
   * The pagination, rendered by the server and passed through.
   *
   * It is hidden while a filter is active, because the filter already searches
   * every page: page links beside "2 of 74 matches across every page" offer to
   * navigate away from a complete answer and lose it on arrival.
   *
   * Passed as children rather than rebuilt here so the links stay server-
   * rendered. The first paint is unfiltered, so a crawler sees the full set of
   * page links exactly as before — they are the crawlable route to recipes deep
   * in a facet and must not become client-only.
   */
  children?: React.ReactNode
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

  /**
   * Counts that answer "how many if I click this", not "how many exist".
   *
   * Each control is counted against the index filtered by the *other* controls,
   * so with Plymouth gin selected the difficulty chips describe those two
   * drinks rather than all 74. Counting both against the unfiltered index was
   * the original behaviour and it lied in a specific way: "Novice 29" beside a
   * grid of two, where clicking it could only ever yield one or zero.
   *
   * A control is never counted against itself. Doing so would collapse it to
   * the single option already chosen and remove any way to change your mind.
   */
  const spirits = facetFilterOptions(
    filterFacetIndex(index, { q: query, spirit: null, difficulty }),
    'b'
  )
  const difficulties = facetFilterOptions(
    filterFacetIndex(index, { q: query, spirit, difficulty: null }),
    'd'
  )

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

      {/* Shown while a selection is active even if only one option survives the
        * other filters: the control is the only way to clear it, and hiding it
        * would strand the reader on a filter they cannot undo. */}
      {(spirits.length > 1 || spirit) && (
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

      {(difficulties.length > 1 || difficulty) && (
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

      {!filtering && children}
    </div>
  )
}
