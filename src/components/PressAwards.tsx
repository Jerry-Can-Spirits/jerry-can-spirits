import Link from 'next/link'
import Image from 'next/image'

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
  image?: string
  // Logos drawn for print (dark marks) sit on a white plate; medal
  // artwork renders directly on the dark card.
  plate?: boolean
  url?: string
}

const pressItems: PressItem[] = [
  {
    // Croxsons news release, July 2026 ("Enabling Jerry Can Spirits to
    // deliver an exciting new rum") — two verbatim sentences from Josh
    // Webster joined editorially. Swap the URL for a published article
    // once print/online coverage lands.
    publication: 'Josh Webster, Head of Brand, Croxsons',
    quote:
      'We were delighted to collaborate with Dan and Rhys to help bring Expedition Spiced to market… We enjoy working with brands that are making a difference, and it’s great to be working with one that has a cause it is passionate about.',
    url: 'https://www.croxsons.com/',
    date: '2026',
  },
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
    image: '/images/AFC_POSITIVE_RGB.png',
    plate: true,
    // Our signatory listing on GOV.UK — the public record of the pledge.
    url: 'https://www.gov.uk/armed-forces-covenant-businesses/jerry-can-spirits-ltd',
  },
  {
    title: 'Employer Recognition Scheme',
    body: 'Bronze Award — Armed Forces Covenant Employer Recognition Scheme.',
    year: '2025',
    image: '/images/ERS_Bronze_Banner.webp',
    plate: true,
    // GOV.UK publishes the ERS award-holder lists here; bronze holders
    // have no individual pages.
    url: 'https://www.gov.uk/government/publications/defence-employer-recognition-scheme',
  },
  {
    title: 'IWSC 2026 Bronze Medal',
    body: 'Expedition Spiced. International Wine and Spirit Competition.',
    year: '2026',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/66191572-4bf8-4de0-ba4d-01aab5c20700/public',
    url: 'https://www.iwsc.net/results/detail/172185/expedition-spiced-spiced-rum',
  },
  {
    title: 'IWSC 2026 Silver Medal',
    body: 'Expedition Spiced and cola, judged with Franklin and Sons.',
    year: '2026',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2558fe93-bdf0-458c-85d6-5de6097ed300/public',
    url: 'https://www.iwsc.net/results/detail/172185/expedition-spiced-spiced-rum',
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
              {awardItems.map((award) => {
                const cardContent = (
                  <>
                    {award.image ? (
                      award.plate ? (
                        <span className="shrink-0 flex items-center bg-white rounded-lg p-2">
                          <Image
                            src={award.image}
                            alt=""
                            width={120}
                            height={60}
                            className="h-10 w-auto"
                          />
                        </span>
                      ) : (
                        <Image
                          src={award.image}
                          alt=""
                          width={48}
                          height={48}
                          className="shrink-0"
                        />
                      )
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gold-400 mt-2 shrink-0" />
                    )}
                    <div>
                      <p className="text-white font-semibold">{award.title}</p>
                      {award.body && (
                        <p className="text-parchment-400 text-sm mt-1">{award.body}</p>
                      )}
                    </div>
                  </>
                )
                const cardClasses =
                  'flex items-start gap-4 p-5 bg-jerry-green-800/20 rounded-xl border border-gold-500/20'
                return award.url ? (
                  <Link
                    key={award.title}
                    href={award.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${cardClasses} hover:border-gold-400/40 transition-colors`}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  <div key={award.title} className={cardClasses}>
                    {cardContent}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
