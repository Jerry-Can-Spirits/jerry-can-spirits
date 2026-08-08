'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MEMBER_LABELS,
  facetFilterOptions,
  filterFacetIndex,
  isFiltering,
  labelFor,
  type FacetIndexItem,
} from '@/lib/cocktail-facets'

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

export default function FacetFilter({ index, label }: { index: FacetIndexItem[]; label: string }) {
  const [query, setQuery] = useState('')
  const [spirit, setSpirit] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<string | null>(null)

  const state = { q: query, spirit, difficulty }
  const filtering = isFiltering(state)
  const matches = filtering ? filterFacetIndex(index, state) : []

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
        <div>
          <p className="text-parchment-400 text-sm mb-3">
            {matches.length} of {index.length} {matches.length === 1 ? 'match' : 'matches'}
          </p>
          {matches.length === 0 ? (
            <p className="text-parchment-300">No cocktail in this list matches that.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {matches.slice(0, 60).map((m) => (
                <li key={m.s}>
                  <Link
                    href={`/field-manual/cocktails/${m.s}/`}
                    className="inline-block px-3 py-2 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-parchment-300 hover:text-gold-300 hover:border-gold-400/40 transition-colors text-sm"
                  >
                    {m.n}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {matches.length > 60 && (
            <p className="text-parchment-400 text-sm mt-3">
              Showing the first 60. Narrow the filter to see the rest.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
