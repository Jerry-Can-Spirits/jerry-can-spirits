import type { Metadata } from 'next'
import Image from 'next/image'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import StockistFinder from '@/components/StockistFinder'
import StructuredData from '@/components/StructuredData'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Find a Stockist',
  description: 'Find Jerry Can Spirits Expedition Spiced Rum near you. Enter your postcode to locate your nearest stockist.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/stockists/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Find a Stockist | Jerry Can Spirits®',
    description: 'Find Jerry Can Spirits Expedition Spiced Rum near you. Enter your postcode to locate your nearest stockist.',
    url: 'https://jerrycanspirits.co.uk/stockists/',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: 'Find a Stockist | Jerry Can Spirits®',
    description: 'Find Jerry Can Spirits Expedition Spiced Rum near you. Enter your postcode to locate your nearest stockist.',
    images: OG_IMAGE,
  },
}

const featuredStockists = [
  {
    name: 'The Bank Bar & Grill',
    address: '28 Corporation St, Blackpool FY1 1EJ',
    streetAddress: '28 Corporation St',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1EJ',
    description: 'Family run Bar & Grill restaurant in the centre of Blackpool. Serving Brunch and evening A La Carte Menu.',
    website: 'https://www.thebankblackpool.com/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/9084080c-6c1f-45e5-e29f-9b939ad44100/public',
    type: 'Bar & Grill',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub' as const,
  },
  {
    name: 'Spin the Black Circle',
    address: '19-21 Pump Street, Worcester WR1 2QX',
    streetAddress: '19-21 Pump Street',
    addressLocality: 'Worcester',
    postalCode: 'WR1 2QX',
    description: 'Independent record shop and cultural hub in the heart of Worcester. Vinyl, music, and a passion for things done properly.',
    website: 'https://www.spintheblack.com/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2a07131a-94d4-4817-90c3-15ccb9c54700/public',
    type: 'Independent',
    location: 'Worcester, Worcestershire',
    schemaType: 'Store' as const,
  },
  {
    name: 'The Bull Inn',
    address: '32 High St, Newington, Sittingbourne ME9 7JP',
    streetAddress: '32 High St',
    addressLocality: 'Newington',
    postalCode: 'ME9 7JP',
    description: 'A friendly pub in the heart of Newington village. Grade II listed, with origins dating to the 17th century — the sort of place that has been part of the community for a very long time.',
    website: 'https://www.facebook.com/thebullpubnewington/',
    websiteLabel: 'Visit Facebook page',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/302d8530-c831-4540-e297-b32c09ae2c00/public',
    type: 'Pub',
    location: 'Newington, Kent',
    schemaType: 'BarOrPub' as const,
  },
  {
    name: 'The Retro Lounge',
    address: '3-5 Clifton Street, Blackpool FY1 1JD',
    streetAddress: '3-5 Clifton Street',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1JD',
    description: 'A vintage cocktail bar on Clifton Street, opposite North Pier. Classic cocktails and classic music, from 70s pop to 90s club anthems, with DJs and karaoke nights.',
    website: 'https://www.retrolounges.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/06c3deb3-4753-4879-8c0b-e518432e9000/public',
    type: 'Cocktail Bar',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub' as const,
  },
  {
    name: 'The Victory',
    address: '88 Saint Owen St, Hereford HR1 2QD',
    streetAddress: '88 Saint Owen St',
    addressLocality: 'Hereford',
    postalCode: 'HR1 2QD',
    description: 'A well-loved pub and restaurant on St Owen Street, known for its breakfasts, its live events, and a proper welcome. Popular with Hereford locals and visitors alike.',
    website: 'https://www.facebook.com/TheVictoryHfd/',
    websiteLabel: 'Visit Facebook page',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/50904380-16e8-4014-a055-322e30a4d500/public',
    type: 'Pub & Restaurant',
    location: 'Hereford, Herefordshire',
    schemaType: 'BarOrPub' as const,
  },
  {
    name: 'The Lichfield Vaults',
    address: '11 Church St, Hereford HR1 2LR',
    streetAddress: '11 Church St',
    addressLocality: 'Hereford',
    postalCode: 'HR1 2LR',
    description: 'A traditional pub tucked away on Church Street in Hereford city centre, a minute from the Cathedral and High Town. Wood panelling, coal fires in winter, a large decked seating area outside, and a welcome that makes everyone part of the family. Dogs on leads welcome.',
    website: 'https://www.lichfieldvaultshereford.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/11f2d5c4-842c-42d2-436f-9f8f6738de00/public',
    type: 'Pub',
    location: 'Hereford, Herefordshire',
    schemaType: 'BarOrPub' as const,
  },
]

// Sorted by location, then name: regional clustering with zero UI. Both
// Blackpool venues sit together, both Hereford venues sit together, and any
// future addition files itself. A filter control is deliberately absent at
// this count — the postcode finder below the cards is already the
// find-it-near-me tool; revisit a filter somewhere past a dozen stockists.
featuredStockists.sort(
  (a, b) => a.location.localeCompare(b.location) || a.name.localeCompare(b.name),
)

const stockistSchema = featuredStockists.map((stockist) => ({
  '@context': 'https://schema.org',
  '@type': stockist.schemaType,
  name: stockist.name,
  address: {
    '@type': 'PostalAddress',
    streetAddress: stockist.streetAddress,
    addressLocality: stockist.addressLocality,
    postalCode: stockist.postalCode,
    addressCountry: 'GB',
  },
  url: stockist.website,
  description: stockist.description,
}))

export default function StockistsPage() {
  return (
    <main>
      <StructuredData data={stockistSchema} />

      {/* Header */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Stockists"
            intro="Enter your postcode to find the nearest stockist. More stockists being added regularly."
          >
            Find Expedition Spiced Rum
          </SectionHeading>
        </div>
      </section>

      {/* Featured Stockists */}
      <section className="band-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Stocking Expedition Spiced Rum</SectionHeading>
          <ScrollRow
            ariaLabel="Venues stocking Expedition Spiced Rum"
            cols="md:grid-cols-2 lg:grid-cols-3"
            items={featuredStockists.map((stockist, index) => (
              <div
                key={stockist.name}
                className="h-full bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-6 hover:border-gold-500/40 transition-all"
              >
                <div className="flex items-center justify-center bg-white rounded-lg p-2 mb-5 h-24 border border-gold-500/10">
                  <div className="relative w-full h-full">
                    <Image
                      src={stockist.logo}
                      alt={`${stockist.name} logo`}
                      fill
                      className="object-contain"
                      sizes="200px"
                      priority={index === 0}
                    />
                  </div>
                </div>

                <h3 className="text-lg font-serif font-bold text-white mb-1">
                  {stockist.name}
                </h3>
                <p className="text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
                  {stockist.type}
                </p>
                <p className="text-parchment-400 text-sm mb-3">
                  {stockist.location}
                </p>
                <p className="text-parchment-300 text-sm leading-relaxed mb-5">
                  {stockist.description}
                </p>

                <div className="flex flex-col gap-2">
                  <p className="text-parchment-500 text-xs">
                    {stockist.address}
                  </p>
                  <a
                    href={stockist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-medium transition-colors"
                  >
                    {stockist.websiteLabel ?? 'Visit website'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          />
        </div>
      </section>

      {/* Finder */}
      <section className="band-dark py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Search by postcode</SectionHeading>
          <StockistFinder />
        </div>
      </section>

      {/* Trade enquiries */}
      <section className="band-light py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 bg-jerry-green-800/20 rounded-xl border border-gold-500/20 max-w-2xl mx-auto">
            <h2 className="text-xl font-serif font-bold text-white mb-3">
              Interested in stocking us?
            </h2>
            <p className="text-parchment-300 text-sm leading-relaxed mb-6">
              We work with independent retailers, bars, and restaurants who hold themselves to the same standard we do. If that is you, we would like to hear from you.
            </p>
            <a
              href="/trade/"
              className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
            >
              Trade Enquiries
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
