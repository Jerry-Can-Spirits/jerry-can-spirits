import ScrollRow from '@/components/ScrollRow'

// The three pillars, swipeable on a phone. The four stat tiles that sat
// under them ("700 General Release", "2026 April Launch") went on 24 Sep
// 2026: two were stale after launch and the other two are stated elsewhere
// on the page, so the section ends on the pillars.
export default function WhyJerryCan() {
  const pillars = [
    {
      title: 'Real Ingredients',
      description: 'Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, cloves, cassia, agave. No artificial flavouring. That is what goes in. Nothing else.'
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
        <div className="text-center mb-12">
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
        <ScrollRow
          ariaLabel="Why Jerry Can"
          cols="md:grid-cols-3"
          items={pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="h-full bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-colors duration-300"
            >
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                {pillar.title}
              </h3>
              <p className="text-parchment-300 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        />
      </div>
    </section>
  )
}
