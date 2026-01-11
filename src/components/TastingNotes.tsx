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
    <section className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 sm:p-8 border border-gold-500/20 space-y-6">
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
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-gold-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-serif font-bold text-gold-400">Aroma (Nose)</h3>
          </div>
          <p className="text-parchment-200 leading-relaxed pl-7">{tastingNotes.aroma}</p>
        </div>

        {/* Palate */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-gold-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
              />
            </svg>
            <h3 className="text-lg font-serif font-bold text-gold-400">Palate (Taste)</h3>
          </div>
          <p className="text-parchment-200 leading-relaxed pl-7">{tastingNotes.palate}</p>
        </div>

        {/* Finish */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-gold-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-lg font-serif font-bold text-gold-400">Finish</h3>
          </div>
          <p className="text-parchment-200 leading-relaxed pl-7">{tastingNotes.finish}</p>
        </div>
      </div>

      {/* Professional Tip */}
      {professionalTip && (
        <div className="mt-6 p-4 bg-gold-500/10 border-l-4 border-gold-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-gold-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <div>
              <h4 className="text-sm font-bold text-gold-300 uppercase tracking-wide mb-1">
                Professional Tip
              </h4>
              <p className="text-parchment-200 leading-relaxed text-sm">{professionalTip}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
