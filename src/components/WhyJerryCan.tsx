import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'

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
    <section className="py-16 band-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Standard We Work To"
          intro="Named after a piece of kit that was designed to work, not to look good on a shelf. That's our standard."
        >
          Why Jerry Can?
        </SectionHeading>

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
