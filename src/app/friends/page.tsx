import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import StructuredData from '@/components/StructuredData'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'

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

// Community partners - Grassroots sponsorships and community support
const communityPartners = [
  {
    name: "Worcester RFC Mixed Ability",
    location: "Worcester, United Kingdom",
    description: "We sponsor Man of the Match for Worcester RFC's Mixed Ability Men's team for the 2025/26 season. Mixed Ability rugby breaks down barriers, welcoming players of all abilities to train and play together. It's grassroots sport at its best: inclusive, community-driven, and built on the idea that everyone deserves a place on the pitch. We've also supported Danny Hughes, one of our investors and a fellow veteran, on the team's tour of Belgium.",
    website: "https://worcesterrfc.rfu.club/teams/worcester-rfc-mixed-ability-men/470363/profile",
    instagram: "https://www.instagram.com/worcesterrfcma",
    facebook: "https://www.facebook.com/WorcesterRFCMA",
    speciality: "Mixed Ability Rugby",
    logo: "https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/040727be-1e59-4528-ebc5-c0472f589300/public",
  },
]

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
  // Structured data for SEO
  const structuredData = [
    // CollectionPage schema
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Friends & Partners | Jerry Can Spirits",
      "description": "Meet the distilleries, suppliers, and community organisations who help make Jerry Can Spirits possible. Quality spirits need quality partnerships.",
      "url": "https://jerrycanspirits.co.uk/friends/",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Jerry Can Spirits Partners",
        "numberOfItems": partners.length + communityPartners.length,
        "itemListElement": [
          ...partners.map((partner, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Organization",
              "name": partner.name,
              "url": partner.website,
              "description": partner.description,
            }
          })),
          ...communityPartners.map((partner, index) => ({
            "@type": "ListItem",
            "position": partners.length + index + 1,
            "item": {
              "@type": "SportsOrganization",
              "name": partner.name,
              "url": partner.website,
              "description": partner.description,
            }
          })),
        ]
      }
    },
    // BreadcrumbList schema
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://jerrycanspirits.co.uk/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Friends & Partners"
        }
      ]
    },
    // SportsOrganization schema for Worcester RFC MA with sponsorship
    {
      "@context": "https://schema.org",
      "@type": "SportsOrganization",
      "name": "Worcester RFC Mixed Ability",
      "description": "Worcester RFC's Mixed Ability Men's rugby team. Mixed Ability rugby breaks down barriers, welcoming players of all abilities to train and play together.",
      "sport": "Rugby Union",
      "url": "https://worcesterrfc.rfu.club/teams/worcester-rfc-mixed-ability-men/470363/profile",
      "sameAs": [
        "https://www.instagram.com/worcesterrfcma",
        "https://www.facebook.com/WorcesterRFCMA"
      ],
      "location": {
        "@type": "Place",
        "name": "Worcester Rugby Football Club",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Worcester",
          "addressCountry": "GB",
          "postalCode": "WR3 8ZF"
        }
      },
      "sponsor": {
        "@type": "Organization",
        "name": "Jerry Can Spirits",
        "url": "https://jerrycanspirits.co.uk",
        "description": "Veteran-owned British rum company. Man of the Match sponsor for the 2025/26 season."
      }
    }
  ]

  return (
    <>
      <StructuredData data={structuredData} />
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
                    <ScrollReveal key={index}>
                    <div
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
                    </ScrollReveal>
                  ))}
              </div>
            </div>
          )}

          {/* Community & Grassroots */}
          {communityPartners.length > 0 && (
            <div className="mb-16">
              <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-4 text-center">
                Community & Grassroots
              </h2>
              <p className="text-parchment-300 text-center max-w-2xl mx-auto mb-8">
                Beyond our trade partners, we support grassroots organisations and community initiatives.
                As a veteran-owned business, backing local clubs and charitable causes is part of who we are.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityPartners.map((partner, index) => (
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

                    <h3 className="text-xl font-playfair font-bold text-gold-400 mb-1">
                      {partner.name}
                    </h3>
                    <p className="text-gold-500/80 text-sm mb-1">
                      {partner.location}
                    </p>
                    <p className="text-gold-500/80 text-sm mb-3">
                      {partner.speciality}
                    </p>
                    <p className="text-parchment-200 text-sm mb-4 leading-relaxed">
                      {partner.description}
                    </p>

                    {/* Links */}
                    <div className="flex flex-wrap gap-2">
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-500/20 text-gold-400 text-sm font-medium rounded-lg hover:bg-gold-500/30 border border-gold-500/30 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Website
                        </a>
                      )}
                      {partner.facebook && (
                        <a
                          href={partner.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-jerry-green-800/40 text-parchment-300 text-sm font-medium rounded-lg hover:bg-jerry-green-800/60 border border-gold-500/20 transition-colors"
                          aria-label={`${partner.name} on Facebook`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </a>
                      )}
                      {partner.instagram && (
                        <a
                          href={partner.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-jerry-green-800/40 text-parchment-300 text-sm font-medium rounded-lg hover:bg-jerry-green-800/60 border border-gold-500/20 transition-colors"
                          aria-label={`${partner.name} on Instagram`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                          </svg>
                          Instagram
                        </a>
                      )}
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
            <ScrollReveal delay={0}>
              <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg h-full">
                <h4 className="text-lg font-semibold text-gold-400 mb-2">
                  Community Growth
                </h4>
                <p className="text-parchment-300 text-sm">
                  Expand reach through collaboration and mutual support
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={1}>
              <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg h-full">
                <h4 className="text-lg font-semibold text-gold-400 mb-2">
                  Shared Success
                </h4>
                <p className="text-parchment-300 text-sm">
                  A small community. Better when we support each other.
                </p>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={2}>
              <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg h-full">
                <h4 className="text-lg font-semibold text-gold-400 mb-2">
                  Quality Recognition
                </h4>
                <p className="text-parchment-300 text-sm">
                  Showcasing excellence across the industry
                </p>
              </div>
            </ScrollReveal>
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
