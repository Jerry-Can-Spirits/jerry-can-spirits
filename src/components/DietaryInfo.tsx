interface DietaryInfoProps {
  dietary: {
    vegan?: boolean
    vegetarian?: boolean
    glutenFree?: boolean
    allergens?: string
    additionalInfo?: string
  }
}

export default function DietaryInfo({ dietary }: DietaryInfoProps) {
  if (!dietary) return null

  const badges = [
    { key: 'vegan', label: 'Vegan', icon: '🌱', active: dietary.vegan },
    { key: 'vegetarian', label: 'Vegetarian', icon: '🥬', active: dietary.vegetarian },
    { key: 'glutenFree', label: 'Gluten-Free', icon: '🌾', active: dietary.glutenFree },
  ].filter(badge => badge.active)

  // Don't render if no badges and no allergen info
  if (badges.length === 0 && !dietary.allergens && !dietary.additionalInfo) {
    return null
  }

  return (
    <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
      <h3 className="text-lg font-semibold text-gold-300 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Dietary Information
      </h3>

      {/* Dietary badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {badges.map(badge => (
            <div
              key={badge.key}
              className="inline-flex items-center gap-2 px-3 py-2 bg-jerry-green-800/40 rounded-lg border border-gold-500/20"
            >
              <span className="text-lg">{badge.icon}</span>
              <span className="text-parchment-200 text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Allergen warning */}
      {dietary.allergens && (
        <div className="flex items-start gap-3 p-3 bg-amber-900/20 rounded-lg border border-amber-500/30 mb-4">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-amber-300 font-medium text-sm">Allergen Information</p>
            <p className="text-amber-200/80 text-sm">{dietary.allergens}</p>
          </div>
        </div>
      )}

      {/* Additional info */}
      {dietary.additionalInfo && (
        <p className="text-parchment-300 text-sm leading-relaxed">
          {dietary.additionalInfo}
        </p>
      )}
    </div>
  )
}
