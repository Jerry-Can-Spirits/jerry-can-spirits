import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import StructuredData from '@/components/StructuredData'
import Breadcrumbs from '@/components/Breadcrumbs'

export const metadata: Metadata = {
  title: "Friends & Partners",
  description: "Meet the distilleries, suppliers, and partners who help make Jerry Can Spirits possible. Quality spirits need quality partnerships.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/friends/",
  },
  openGraph: {
    title: "Friends & Partners | Jerry Can Spirits®",
    description: "Our trusted partners, from distilleries to suppliers, who help us make rum we're proud of",
  },
}

// Partner data - Add your partners here
const partners = [
  {
    name: "Spirit of Wales Distillery",
    location: "Newport, Wales",
    description: "Our trusted distilling partner, creating handcrafted spirits inspired by Welsh landscapes and heritage. From their award-winning Steeltown Welsh gins and vodkas that honour the steel, coal, and mining industries that built the nation, to the curious Dragon's Breath spirits, Spirit of Wales invites you on a flavour journey that pays tribute to Welsh passion and craftsmanship.",
    website: "https://www.spiritofwales.com",
    speciality: "Gin, Vodka and Rum",
    logo: "/images/partners/spirit-of-wales.webp",
    featured: true,
  },
  {
    name: "Harlequin Print Group",
    location: "Pontyclun, South Wales",
    description: "Established in 1997, Harlequin Print Group has grown to become a leading producer of high quality retail cartons. Our packaging partner provides market-leading material across retail packaging, digital print, signage and graphic design, ensuring our products are presented with the quality they deserve.",
    website: "https://harlequinprintgroup.co.uk/",
    speciality: "Retail Packaging & Print",
    logo: "/images/partners/Harlequin_Logo.webp",
    featured: true,
  },
  {
    name: "The Engraved Gift Workshop",
    location: "Chatburn, Lancashire",
    description: "Our barware partner, crafting the premium glasses and accessories that complement our spirits. Established in 2005 with a passion for natural products and personalisation, they create unique, elegant products that recipients truly want to use. Based in Lancashire, they source only the highest standard glassware and materials, bringing expertise in engraving and customisation. 'Etching Memories Into Exceptional Products'.",
    website: "https://the-engraved-gift-workshop.co.uk/",
    speciality: "Barware, Glassware & Engraving",
    logo: "/images/partners/The_Engraved_Gift_Workshop-logo.webp",
    featured: true,
  },
  {
    name: "Fever-Tree",
    location: "London, United Kingdom",
    description: "The world's leading premium mixer brand, partnering with Jerry Can Spirits to create the perfect serve. Founded in 2004 with a mission to provide the best-tasting, naturally-sourced mixers, Fever-Tree sources the finest ingredients from around the world. From their iconic Indian Tonic Water to their expanding range of premium mixers, Fever-Tree shares our commitment to quality and craftsmanship, ensuring every cocktail reaches its full potential.",
    website: "https://fever-tree.com/en-gb",
    speciality: "Premium Mixers & Tonics",
    logo: "/images/partners/fever-tree.webp",
    featured: true,
  },
]

export default function FriendsPage() {
  // Organization schema for SEO
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Friends of Jerry Can Spirits",
    "description": "Partner distilleries and craft spirit producers",
    "url": "https://jerrycanspirits.co.uk/friends",
  }

  return (
    <>
      <StructuredData data={organizationSchema} />
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumbs
              items={[
                { label: 'Friends & Partners' },
              ]}
            />
          </div>

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Community & Partnerships
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-playfair font-bold text-gold-500 mb-6">
              Friends of Jerry Can Spirits
            </h1>
            <p className="text-xl text-parchment-200 max-w-3xl mx-auto leading-relaxed">
              Good rum doesn&apos;t happen in isolation. These are the partners – distilleries,
              suppliers, and collaborators – who help make Jerry Can Spirits what it is.
              We&apos;re grateful to work with people who share our commitment to quality.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="mb-20 max-w-4xl mx-auto">
            <div className="bg-jerry-green-800/20 border border-gold-500/30 rounded-lg p-8">
              <h2 className="text-2xl font-playfair font-bold text-gold-400 mb-4">
                Why Partnerships Matter
              </h2>
              <p className="text-parchment-200 leading-relaxed mb-4">
                We&apos;re a small team, so we rely on good partners to make this work. From
                Spirit of Wales who help with our distilling to Harlequin who sort our
                packaging – every partner contributes something we couldn&apos;t do alone.
              </p>
              <p className="text-parchment-200 leading-relaxed">
                If you&apos;re a supplier, distillery, or business that might want to work with
                us, we&apos;d love to hear from you. <Link href="/contact/" className="text-gold-500 hover:text-gold-400 underline">Get in touch</Link>.
              </p>
            </div>
          </div>

          {/* Featured Partners */}
          {partners.filter(p => p.featured).length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-8 text-center">
                Featured Partners
              </h2>
              <div className="grid grid-cols-1 gap-8">
                {partners
                  .filter(partner => partner.featured)
                  .map((partner, index) => (
                    <div
                      key={index}
                      className="bg-jerry-green-800/20 border border-gold-500/30 rounded-lg p-8 hover:border-gold-500/50 transition-all"
                    >
                      <div className="grid md:grid-cols-[200px_1fr] gap-6">
                        {/* Logo */}
                        <div className="flex items-center justify-center bg-white rounded-lg p-4 border border-gold-500/20">
                          <div className="relative w-full h-32">
                            <Image
                              src={partner.logo}
                              alt={`${partner.name} logo`}
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>

                        {/* Partner Info */}
                        <div>
                          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                            <div>
                              <h3 className="text-2xl font-playfair font-bold text-gold-400 mb-2">
                                {partner.name}
                              </h3>
                              <p className="text-gold-500/80 text-sm mb-1">
                                {partner.location}
                              </p>
                              <p className="text-gold-500/80 text-sm">
                                {partner.speciality}
                              </p>
                            </div>
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block px-6 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
                            >
                              Visit Website
                            </a>
                          </div>
                          <p className="text-parchment-200 leading-relaxed">
                            {partner.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Partners */}
          {partners.filter(p => !p.featured).length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-8 text-center">
                Our Partners
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {partners
                  .filter(partner => !partner.featured)
                  .map((partner, index) => (
                    <div
                      key={index}
                      className="bg-jerry-green-800/20 border border-gold-500/20 rounded-lg p-6 hover:border-gold-500/40 transition-all"
                    >
                      {/* Logo */}
                      <div className="flex items-center justify-center bg-white rounded-lg p-4 mb-4 border border-gold-500/20 h-32">
                        <div className="relative w-full h-full">
                          <Image
                            src={partner.logo}
                            alt={`${partner.name} logo`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <h3 className="text-xl font-playfair font-bold text-gold-400 mb-2">
                        {partner.name}
                      </h3>
                      <p className="text-gold-500/80 text-sm mb-3">
                        {partner.location}
                      </p>
                      <p className="text-parchment-200 text-sm mb-4 leading-relaxed line-clamp-3">
                        {partner.description}
                      </p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block w-full text-center px-4 py-2 bg-gold-500/20 text-gold-400 font-semibold rounded-lg hover:bg-gold-500/30 border border-gold-500/30 transition-colors"
                      >
                        Visit Website
                      </a>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Become a Friend CTA */}
          <div className="mt-20 text-center p-12 bg-gradient-to-br from-jerry-green-800/30 to-jerry-green-900/30 border border-gold-500/30 rounded-lg">
            <h3 className="text-3xl font-playfair font-bold text-gold-500 mb-4">
              Become a Friend of Jerry Can Spirits
            </h3>
            <p className="text-parchment-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Are you a small batch distillery or craft spirit producer who shares our
              passion for quality and community? We&apos;re currently working with content creators
              and always looking for partners who share our values. Get in touch to explore
              how we could work together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact/"
                className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                Get In Touch
              </Link>
              <a
                href="mailto:hello@jerrycanspirits.co.uk"
                className="inline-block px-8 py-3 bg-jerry-green-800/40 text-gold-400 font-semibold rounded-lg hover:bg-jerry-green-800/60 border border-gold-500/30 transition-colors"
              >
                Email Us Directly
              </a>
            </div>
          </div>

          {/* Partnership Benefits Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 mb-16">
            <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg">
              <h4 className="text-lg font-semibold text-gold-400 mb-2">
                Community Growth
              </h4>
              <p className="text-parchment-300 text-sm">
                Expand reach through collaboration and mutual support
              </p>
            </div>
            <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg">
              <h4 className="text-lg font-semibold text-gold-400 mb-2">
                Shared Success
              </h4>
              <p className="text-parchment-300 text-sm">
                Rising tide lifts all boats in craft spirits
              </p>
            </div>
            <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg">
              <h4 className="text-lg font-semibold text-gold-400 mb-2">
                Quality Recognition
              </h4>
              <p className="text-parchment-300 text-sm">
                Showcasing excellence across the industry
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            {/* FAQ Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "How can I become a Jerry Can Spirits partner?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Get in touch via our contact page or email partnerships@jerrycanspirits.co.uk. Our approach to partnerships is shaped by the founders' military service and values, ensuring we work with those who share our dedication and integrity. We're interested in working with distilleries, suppliers, and businesses that share our commitment to quality. We'll have a chat about what we're both looking for and see if there's a fit."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "What kind of partners is Jerry Can Spirits looking for?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We work with a range of partners - from distilleries who help with production to packaging suppliers, barware manufacturers, and premium mixer brands. We're always interested in hearing from businesses that share our values: quality over shortcuts, and honest straight-talking over corporate waffle."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Does Jerry Can Spirits support veteran-owned businesses?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Being veteran-owned ourselves, we're naturally keen to support other veteran businesses where we can. We also value and support reservists as part of our commitment to the armed forces community. If you're a veteran running a business that might complement what we do, we'd particularly like to hear from you."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I stock Jerry Can Spirits products in my shop or bar?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We're always interested in talking to retailers, bars, and restaurants about stocking our products. Contact us at partnerships@jerrycanspirits.co.uk with details about your venue and what you're looking for. We're happy to discuss wholesale arrangements and support for your venue."
                      }
                    }
                  ]
                })
              }}
            />

            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-2 text-center">
                Partnership Questions
              </h2>
              <p className="text-parchment-300 mb-8 text-center">
                Common questions about working with us
              </p>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-gold-500/10 pb-6">
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">How can I become a Jerry Can Spirits partner?</h3>
                  <p className="text-parchment-200 leading-relaxed">
                    Get in touch via our <Link href="/contact/" className="text-gold-400 hover:text-gold-300 underline">contact page</Link> or email <a href="mailto:partnerships@jerrycanspirits.co.uk" className="text-gold-400 hover:text-gold-300 underline">partnerships@jerrycanspirits.co.uk</a>. Our approach to partnerships is shaped by the founders&apos; military service and values, ensuring we work with those who share our dedication and integrity. We&apos;re interested in working with distilleries, suppliers, and businesses that share our commitment to quality. We&apos;ll have a chat about what we&apos;re both looking for and see if there&apos;s a fit.
                  </p>
                </div>

                <div className="border-b border-gold-500/10 pb-6">
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">What kind of partners is Jerry Can Spirits looking for?</h3>
                  <p className="text-parchment-200 leading-relaxed">
                    We work with a range of partners – from distilleries who help with production to packaging suppliers, barware manufacturers, and premium mixer brands. We&apos;re always interested in hearing from businesses that share our values: quality over shortcuts, and honest straight-talking over corporate waffle.
                  </p>
                </div>

                <div className="border-b border-gold-500/10 pb-6">
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">Does Jerry Can Spirits support veteran-owned businesses?</h3>
                  <p className="text-parchment-200 leading-relaxed">
                    Being veteran-owned ourselves, we&apos;re naturally keen to support other veteran businesses where we can. We also value and support reservists as part of our commitment to the armed forces community. If you&apos;re a veteran running a business that might complement what we do, we&apos;d particularly like to hear from you.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gold-300 mb-3">Can I stock Jerry Can Spirits products in my shop or bar?</h3>
                  <p className="text-parchment-200 leading-relaxed">
                    We&apos;re always interested in talking to retailers, bars, and restaurants about stocking our products. Contact us at <a href="mailto:partnerships@jerrycanspirits.co.uk" className="text-gold-400 hover:text-gold-300 underline">partnerships@jerrycanspirits.co.uk</a> with details about your venue and what you&apos;re looking for. We&apos;re happy to discuss wholesale arrangements and support for your venue.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Step CTA */}
          <div className="text-center p-12 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
            <h3 className="text-2xl font-playfair font-bold text-gold-500 mb-4">
              More Questions?
            </h3>
            <p className="text-parchment-200 mb-6 max-w-2xl mx-auto">
              Learn more about Jerry Can Spirits, our products, and how we work in our general FAQ section
            </p>
            <Link
              href="/faq/"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <span>View All FAQs</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
