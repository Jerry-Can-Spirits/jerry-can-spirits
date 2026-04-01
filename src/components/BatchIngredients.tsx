import type { BatchIngredient } from '@/lib/d1'

interface BatchIngredientsProps {
  ingredients: BatchIngredient[]
}

export default function BatchIngredients({ ingredients }: BatchIngredientsProps) {
  if (ingredients.length === 0) return null

  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
      <h2 className="text-2xl font-serif font-bold text-white mb-6">What Goes In</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className="bg-jerry-green-700/40 border border-gold-500/10 rounded-lg p-4"
          >
            <p className="text-white font-semibold">{ingredient.name}</p>
            {ingredient.origin && (
              <p className="text-gold-400 text-sm mt-1">{ingredient.origin}</p>
            )}
            {ingredient.supplier && (
              <p className="text-parchment-400 text-sm mt-1">{ingredient.supplier}</p>
            )}
            {ingredient.notes && (
              <p className="text-parchment-300 text-sm leading-relaxed mt-2">{ingredient.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
