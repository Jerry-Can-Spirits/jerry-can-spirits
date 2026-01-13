export default function WhyJerryCan() {
  const pillars = [
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Premium Quality',
      description: 'Handcrafted small-batch rum using premium Caribbean molasses and British copper-pot distillation. Experience rich, complex flavours with velvety vanilla, warm spice notes, and a smooth finish that rivals the finest spirits.'
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Adventure Heritage',
      description: 'Founded by Royal Corps of Signals veterans who served across Arctic to desert deployments. We channel expedition-tested reliability and precision craftsmanship into every bottle - spirits built for the bold.'
    },
    {
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Expedition Ready',
      description: 'Versatile craft spirits perfect for bold cocktails or sipping neat. Whether you\'re mixing a Storm and Spice at your home bar or sharing stories around the campfire, our rum delivers exceptional flavour anywhere adventure calls.'
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
            Why Choose Jerry Can Spirits?
          </h2>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            More than premium rum—it's a commitment to excellence, heritage, and adventure.
          </p>
        </div>

        {/* Three Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 group hover:scale-105"
            >
              {/* Icon */}
              <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mb-6 text-gold-400 group-hover:bg-gold-400/30 transition-colors duration-300">
                {pillar.icon}
              </div>

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
