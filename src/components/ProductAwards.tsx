import Image from 'next/image'

const CF_IMAGES = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

interface ProductAward {
  title: string
  citation: string
  image: string
  schemaText: string
  judgesNote?: string
}

export const PRODUCT_AWARDS: ProductAward[] = [
  {
    title: 'IWSC 2026 Bronze',
    citation: 'Expedition Spiced.',
    image: `${CF_IMAGES}/863f3ff8-7252-477f-9627-a805f6c6a100/public`,
    schemaText: 'IWSC 2026 Bronze Medal - Expedition Spiced',
    judgesNote: 'A hint of coconut leads to vibrant ginger and citrus, with gingerbread and winter spices.',
  },
  {
    title: 'IWSC 2026 Silver',
    citation: 'Expedition Spiced and cola, judged with Franklin and Sons.',
    image: `${CF_IMAGES}/2f7661db-3571-44d1-ee15-8bbd3c3cfd00/public`,
    schemaText: 'IWSC 2026 Silver Medal - Expedition Spiced and Cola',
  },
]

export const AWARDED_HANDLES = [
  'jerry-can-spirits-expedition-spiced-rum',
  'jerry-can-spirits-premium-gift-pack',
  'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
]

export default function ProductAwards() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        {PRODUCT_AWARDS.map((award) => (
          <div key={award.title} className="flex items-center gap-3">
            <Image
              src={award.image}
              alt={`${award.title} medal. ${award.citation}`}
              width={80}
              height={80}
              className="shrink-0"
            />
            <div>
              <p className="text-white font-semibold text-sm">{award.title}</p>
              <p className="text-parchment-400 text-xs mt-0.5">{award.citation}</p>
            </div>
          </div>
        ))}
      </div>
      {PRODUCT_AWARDS.filter((award) => award.judgesNote).map((award) => (
        <p key={award.title} className="text-parchment-300 text-sm italic leading-relaxed">
          &ldquo;{award.judgesNote}&rdquo;{' '}
          <span className="not-italic text-parchment-500 text-xs">IWSC judging notes</span>
        </p>
      ))}
    </div>
  )
}
