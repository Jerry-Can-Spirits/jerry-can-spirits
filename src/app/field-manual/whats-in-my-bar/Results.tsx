import Link from 'next/link'
import type { MatchResult } from '@/lib/bar/match-engine'

export default function Results({
  result,
  nameById,
}: {
  result: MatchResult
  nameById: Map<string, string>
}) {
  const { makeable, oneAway } = result
  return (
    <div className="rounded-xl border border-gold-500/20 p-4 sm:p-6">
      <h2 className="text-xs uppercase tracking-wider text-parchment-300/70 mb-3">
        You can make <span className="text-gold-300 font-bold">· {makeable.length}</span>
      </h2>
      {makeable.length === 0 ? (
        <p className="text-sm text-parchment-400/70 mb-4">Add a couple of spirits and a mixer to get started.</p>
      ) : (
        <ul className="mb-6 divide-y divide-white/5">
          {makeable.map((c) => (
            <li key={c.slug} className="py-2 text-sm">
              <Link href={`/field-manual/cocktails/${c.slug}/`} className="text-parchment-200 hover:text-gold-300">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-xs uppercase tracking-wider text-parchment-300/70 mb-3">
        One bottle away <span className="text-gold-300 font-bold">· {oneAway.length}</span>
      </h2>
      <ul className="divide-y divide-white/5">
        {oneAway.map(({ cocktail, missingId }) => (
          <li key={cocktail.slug} className="flex items-baseline justify-between py-2 text-sm">
            <Link href={`/field-manual/cocktails/${cocktail.slug}/`} className="text-parchment-200 hover:text-gold-300">
              {cocktail.name}
            </Link>
            <span className="text-[10px] text-parchment-400/60">add {nameById.get(missingId) ?? 'one bottle'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
