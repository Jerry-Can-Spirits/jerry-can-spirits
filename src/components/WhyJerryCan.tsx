export default function WhyJerryCan() {
  const pillars = [
    {
      title: 'Real Ingredients',
      description: 'Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia, agave. Pot stilled with Welsh brewery molasses. No artificial flavouring. That is what goes in. Nothing else.'
    },
    {
      title: 'Veteran Heritage',
      description: 'Between us, we served 17 years in the Royal Corps of Signals. We know what reliability means. Every bottle reflects that standard. No corners cut, no compromises made.'
    },
    {
      title: 'Built to Deliver',
      description: 'Whether you drink it neat or mix it, this rum holds up. We built it that way on purpose.'
    }
  ]

  return (
    <section className="py-16 bg-jerry-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The Standard We Work To
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Why Jerry Can?
          </h2>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Named after a piece of kit that was designed to work, not to look good on a shelf. That's our standard.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 group hover:scale-105"
            >
              {/* Title */}
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                {pillar.title}
              </h3>

              {/* Description */}
              <p className="text-parchment-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>

        {/* Supporting Badges */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
            <div className="text-3xl font-bold text-gold-300 mb-2">700</div>
            <div className="text-parchment-400 text-sm uppercase tracking-wide">Limited First Batch</div>
          </div>

          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
            <div className="text-3xl font-bold text-gold-300 mb-2">100%</div>
            <div className="text-parchment-400 text-sm uppercase tracking-wide">Veteran Owned</div>
          </div>

          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
            <div className="text-3xl font-bold text-gold-300 mb-2">UK</div>
            <div className="text-parchment-400 text-sm uppercase tracking-wide">Made in Britain</div>
          </div>

          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 text-center">
            <div className="text-3xl font-bold text-gold-300 mb-2">2026</div>
            <div className="text-parchment-400 text-sm uppercase tracking-wide">April Launch</div>
          </div>
        </div>
      </div>
    </section>
  )
}
