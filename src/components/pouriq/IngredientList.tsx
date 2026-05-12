import Link from 'next/link'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

interface Props {
  entries: IngredientLibraryRow[]
  usageCounts: Map<string, number>
}

function formatCost(entry: IngredientLibraryRow): string {
  if (entry.unit_cost_p !== null) {
    return `£${(entry.unit_cost_p / 100).toFixed(2)} / unit`
  }
  if (entry.bottle_size_ml !== null && entry.bottle_cost_p !== null) {
    return `£${(entry.bottle_cost_p / 100).toFixed(2)} / ${entry.bottle_size_ml}ml`
  }
  return '—'
}

export function IngredientList({ entries, usageCounts }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
        <p className="text-parchment-300 mb-2">No ingredients yet.</p>
        <p className="text-parchment-400 text-sm">
          Add your first ingredient to begin building your library, or import a menu to populate automatically.
        </p>
      </div>
    )
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => {
        const count = usageCounts.get(entry.id) ?? 0
        return (
          <Link
            key={entry.id}
            href={`/trade/pouriq/library/${entry.id}/edit`}
            className="block bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-5 border border-gold-500/20 hover:border-gold-400/40 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="text-base font-serif font-bold text-white truncate">{entry.name}</h3>
              <span className="text-xs uppercase tracking-widest text-parchment-400 shrink-0">{entry.ingredient_type}</span>
            </div>
            <p className="text-parchment-200 text-sm">{formatCost(entry)}</p>
            <p className="text-parchment-500 text-xs mt-2">
              {count === 0 ? 'Not used yet' : `Used in ${count} drink${count === 1 ? '' : 's'}`}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
