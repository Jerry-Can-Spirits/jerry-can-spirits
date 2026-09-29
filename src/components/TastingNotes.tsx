interface TastingNotesProps {
  tastingNotes: {
    aroma: string
    palate: string
    finish: string
  }
  flavorProfile?: {
    primary: string[]
    strength: string
  }
  professionalTip?: string
}

export default function TastingNotes({
  tastingNotes,
  flavorProfile,
  professionalTip,
}: TastingNotesProps) {
  return (
    <section className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-6">
      <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gold-300 mb-6">
        Tasting Notes
      </h2>

      {/* Flavour Profile Badges */}
      {flavorProfile && flavorProfile.primary && flavorProfile.primary.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gold-400 uppercase tracking-wide mb-3">
            Flavour Profile
          </h3>
          <div className="flex flex-wrap gap-2">
            {flavorProfile.primary.map((flavour, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gold-500/20 border border-gold-500/30 rounded-full text-sm text-gold-300 font-medium"
              >
                {flavour}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tasting Notes Sections */}
      <div className="space-y-5">
        {/* Aroma */}
        <div>
          <h3 className="text-lg font-serif font-bold text-gold-400 mb-2">Aroma (Nose)</h3>
          <p className="text-parchment-200 leading-relaxed">{tastingNotes.aroma}</p>
        </div>

        {/* Palate */}
        <div>
          <h3 className="text-lg font-serif font-bold text-gold-400 mb-2">Palate (Taste)</h3>
          <p className="text-parchment-200 leading-relaxed">{tastingNotes.palate}</p>
        </div>

        {/* Finish */}
        <div>
          <h3 className="text-lg font-serif font-bold text-gold-400 mb-2">Finish</h3>
          <p className="text-parchment-200 leading-relaxed">{tastingNotes.finish}</p>
        </div>
      </div>

      {/* Professional Tip */}
      {professionalTip && (
        <div className="mt-6 p-4 bg-gold-500/10 border-l-4 border-gold-500 rounded-r-lg">
          <h4 className="text-sm font-bold text-gold-300 uppercase tracking-wide mb-1">
            Professional Tip
          </h4>
          <p className="text-parchment-200 leading-relaxed text-sm">{professionalTip}</p>
        </div>
      )}
    </section>
  )
}
