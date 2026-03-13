import Link from 'next/link'

interface PressItem {
  publication: string
  quote: string
  url: string
  date?: string
}

interface AwardItem {
  title: string
  body?: string
  year?: string
}

const pressItems: PressItem[] = [
  {
    publication: 'She Rises Studios',
    quote: 'Customers are fed up with faceless corporate brands. They want to meet the people behind what they\'re drinking, and hear the story of the bottle.',
    url: 'https://www.sherisesstudios.com/post/from-military-service-to-rum-making-how-we-started-before-we-were-ready',
    date: '2025',
  },
]

const awardItems: AwardItem[] = [
  {
    title: 'Armed Forces Covenant Signatory',
    body: 'Committed to supporting the armed forces community.',
  },
  {
    title: 'Employer Recognition Scheme',
    body: 'Bronze Award — Armed Forces Covenant Employer Recognition Scheme.',
    year: '2025',
  },
]

export default function PressAwards() {
  return (
    <section className="py-16 bg-jerry-green-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Recognition
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">
            As Seen In
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Press */}
          {pressItems.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-gold-400 border-b border-gold-500/20 pb-3">
                Press
              </h3>
              <div className="space-y-6">
                {pressItems.map((item) => (
                  <Link
                    key={item.publication}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-6 bg-jerry-green-800/20 rounded-xl border border-gold-500/20 hover:border-gold-400/40 transition-colors"
                  >
                    <p className="text-parchment-200 text-lg leading-relaxed mb-4 italic">
                      &ldquo;{item.quote}&rdquo;
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gold-300 font-semibold text-sm group-hover:text-gold-200 transition-colors">
                        {item.publication}
                      </span>
                      {item.date && (
                        <span className="text-parchment-500 text-xs">{item.date}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Awards & Accreditations */}
          <div className="space-y-6">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-gold-400 border-b border-gold-500/20 pb-3">
              Accreditations
            </h3>
            <div className="space-y-4">
              {awardItems.map((award) => (
                <div
                  key={award.title}
                  className="flex items-start gap-4 p-5 bg-jerry-green-800/20 rounded-xl border border-gold-500/20"
                >
                  <div className="w-2 h-2 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-semibold">{award.title}</p>
                    {award.body && (
                      <p className="text-parchment-400 text-sm mt-1">{award.body}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
