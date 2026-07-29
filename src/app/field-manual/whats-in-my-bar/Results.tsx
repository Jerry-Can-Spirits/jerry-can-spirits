'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { MatchResult, OneAwayGroup } from '@/lib/bar/match-engine'
import type { CocktailIndexItem } from '@/lib/bar/types'

const href = (slug: string) => `/field-manual/cocktails/${slug}/`
const PAGE = 8

function Tier({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="border-t border-white/5 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded py-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <span className="text-xs uppercase tracking-wider text-parchment-300/70">
          {title} <span className="font-bold text-gold-300">· {count}</span>
        </span>
        <span aria-hidden="true" className="text-sm text-parchment-400/60">
          {open ? '–' : '+'}
        </span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </section>
  )
}

function CocktailLink({ cocktail }: { cocktail: CocktailIndexItem }) {
  return (
    <Link href={href(cocktail.slug)} className="text-parchment-200 hover:text-gold-300">
      {cocktail.name}
    </Link>
  )
}

// One row per bottle you'd add; expands to the drinks it unlocks.
function OneAwayRow({ group, bottleName }: { group: OneAwayGroup; bottleName: string }) {
  const [open, setOpen] = useState(false)
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-baseline justify-between gap-2 rounded py-2 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      >
        <span className="text-parchment-200">
          Add <span className="font-semibold text-gold-200">{bottleName}</span>
        </span>
        <span className="shrink-0 text-[11px] text-parchment-400/70">
          {group.cocktails.length} {group.cocktails.length === 1 ? 'drink' : 'drinks'}
        </span>
      </button>
      {open && (
        <ul className="mb-1 ml-3 border-l border-white/10 pl-3">
          {group.cocktails.map((c) => (
            <li key={c.slug} className="py-1 text-sm">
              <CocktailLink cocktail={c} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export default function Results({ result, nameById }: { result: MatchResult; nameById: Map<string, string> }) {
  const { makeable, oneAway, twoAway } = result
  const [makeableLimit, setMakeableLimit] = useState(PAGE)
  const [twoAwayLimit, setTwoAwayLimit] = useState(PAGE)

  const oneAwayCount = oneAway.reduce((n, g) => n + g.cocktails.length, 0)
  const bottle = (id: string) => nameById.get(id) ?? 'one bottle'

  return (
    <div className="rounded-xl border border-gold-500/20 p-4 sm:p-6">
      <Tier title="You can make" count={makeable.length} defaultOpen>
        {makeable.length === 0 ? (
          <p className="text-sm text-parchment-400/70">Add a couple of spirits and a mixer to get started.</p>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              {makeable.slice(0, makeableLimit).map((c) => (
                <li key={c.slug} className="border-b border-white/5 py-2 text-sm">
                  <CocktailLink cocktail={c} />
                </li>
              ))}
            </ul>
            {makeableLimit < makeable.length && (
              <button
                type="button"
                onClick={() => setMakeableLimit((n) => n + PAGE)}
                className="mt-3 text-xs text-gold-300 underline decoration-dotted hover:text-gold-200"
              >
                Show more
              </button>
            )}
          </>
        )}
      </Tier>

      <Tier title="One bottle away" count={oneAwayCount} defaultOpen>
        {oneAway.length === 0 ? (
          <p className="text-sm text-parchment-400/70">Nothing within one bottle just yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {oneAway.map((g) => (
              <OneAwayRow key={g.missingId} group={g} bottleName={bottle(g.missingId)} />
            ))}
          </ul>
        )}
      </Tier>

      <Tier title="Two bottles away" count={twoAway.length}>
        {twoAway.length === 0 ? (
          <p className="text-sm text-parchment-400/70">Nothing within two bottles just yet.</p>
        ) : (
          <>
            <ul className="divide-y divide-white/5">
              {twoAway.slice(0, twoAwayLimit).map(({ cocktail, missingIds }) => (
                <li key={cocktail.slug} className="flex items-baseline justify-between gap-2 py-2 text-sm">
                  <CocktailLink cocktail={cocktail} />
                  <span className="shrink-0 text-[11px] text-parchment-400/70">
                    add {bottle(missingIds[0])} + {bottle(missingIds[1])}
                  </span>
                </li>
              ))}
            </ul>
            {twoAwayLimit < twoAway.length && (
              <button
                type="button"
                onClick={() => setTwoAwayLimit((n) => n + PAGE)}
                className="mt-3 text-xs text-gold-300 underline decoration-dotted hover:text-gold-200"
              >
                Show more
              </button>
            )}
          </>
        )}
      </Tier>
    </div>
  )
}
