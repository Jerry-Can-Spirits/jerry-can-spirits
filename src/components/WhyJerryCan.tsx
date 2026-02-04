export default function WhyJerryCan() {
  const pillars = [
    {
      title: 'Premium Quality',
      description: 'We blend Caribbean rum with Welsh brewery molasses and run it through copper pot stills at Spirit of Wales Distillery. Vanilla and caramel upfront, warm spice through the middle, smooth enough to sip neat but bold enough for cocktails.'
    },
    {
      title: 'Veteran Heritage',
      description: 'We spent 12 years in the Royal Corps of Signals. We know what reliability means. Every bottle reflects that standard. No corners cut, no compromises made.'
    },
    {
      title: 'Expedition Ready',
      description: 'Whether you\'re mixing drinks at home or sharing a bottle with mates after a long week, this rum won\'t let you down. We built it that way on purpose.'
    }
  ]

  return (
    <section className="py-16 bg-jerry-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              What Sets Us Apart
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
