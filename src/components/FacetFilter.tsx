'use client'

import { useState } from 'react'
import Link from 'next/link'

/**
 * In-page filter over a facet's cocktails.
 *
 * Takes a name-and-slug index rather than the card data. A filter needs
 * something to match against and somewhere to go; descriptions and image URLs
 * would multiply the payload for no benefit, and the cards for the current page
 * are already rendered server-side above.
 *
 * Renders nothing until a query is typed, so it never duplicates the grid.
 */
export default function FacetFilter({
  index,
  label,
}: {
  index: Array<{ n: string; s: string }>
  label: string
}) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const matches = q ? index.filter((i) => i.n.toLowerCase().includes(q)).slice(0, 40) : []

  return (
    <div className="mb-10">
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

      {q && (
        <div className="mt-4">
          {matches.length === 0 ? (
            <p className="text-parchment-400 text-sm">No cocktail in this list matches that.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {matches.map((m) => (
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
        </div>
      )}
    </div>
  )
}
