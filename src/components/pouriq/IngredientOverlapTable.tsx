import type { IngredientOverlap } from '@/lib/pouriq/types'

export function IngredientOverlapTable({ overlap }: { overlap: IngredientOverlap[] }) {
  if (overlap.length === 0) return null
  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-jerry-green-900/40">
          <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
            <th className="px-4 py-3">Ingredient</th>
            <th className="px-4 py-3">Used in</th>
          </tr>
        </thead>
        <tbody>
          {overlap.map((o) => (
            <tr key={o.ingredient_name} className="border-t border-gold-500/10">
              <td className="px-4 py-3 text-parchment-100">{o.ingredient_name}</td>
              <td className={`px-4 py-3 ${o.cocktail_count === 1 ? 'text-red-300' : 'text-parchment-200'}`}>
                {o.cocktail_count} drink{o.cocktail_count === 1 ? '' : 's'}
                {o.cocktail_count === 1 && ' (single-use)'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
