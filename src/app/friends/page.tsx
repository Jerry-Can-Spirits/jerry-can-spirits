import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "Friends & Partners",
  description: "Meet the distilleries, suppliers, and partners who help make Jerry Can Spirits possible. We're building a community of excellence to help rum become the UK's number one spirit.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/friends/",
  },
  openGraph: {
    title: "Friends & Partners | Jerry Can Spirits®",
    description: "Our trusted partners, from distilleries to suppliers, who help craft exceptional spirits",
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
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We believe in the power of community. These are the exceptional partners -
              from distilleries and craft producers to suppliers and collaborators - who
              help make Jerry Can Spirits possible. Together, we're on a mission to make
              rum the UK's number one spirit.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="mb-20 max-w-4xl mx-auto">
            <div className="bg-jerry-green-800/20 border border-gold-500/30 rounded-lg p-8">
              <h2 className="text-2xl font-playfair font-bold text-gold-400 mb-4">
                Our Mission
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Quality spirits are only possible through quality partnerships. From the
                distilleries who craft our rum to the suppliers who provide our packaging,
                every partner plays a vital role. By supporting each other through genuine
                collaboration, we're not just building our own brands – we're elevating
                the entire craft spirits industry.
              </p>
              <p className="text-gray-300 leading-relaxed">
                Every partnership strengthens our collective voice and helps quality products
                gain the recognition they deserve. Whether you're a distillery, supplier, or
                collaborator who shares our values, <Link href="/contact" className="text-gold-500 hover:text-gold-400 underline">get in touch</Link>.
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
                          <p className="text-gray-300 leading-relaxed">
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
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">
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
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Are you a small batch distillery or craft spirit producer who shares our
              passion for quality and community? Let's support each other and elevate
              the craft spirits movement together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
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
              <p className="text-gray-400 text-sm">
                Expand reach through collaboration and mutual support
              </p>
            </div>
            <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg">
              <h4 className="text-lg font-semibold text-gold-400 mb-2">
                Shared Success
              </h4>
              <p className="text-gray-400 text-sm">
                Rising tide lifts all boats in craft spirits
              </p>
            </div>
            <div className="text-center p-6 bg-jerry-green-800/10 border border-gold-500/20 rounded-lg">
              <h4 className="text-lg font-semibold text-gold-400 mb-2">
                Quality Recognition
              </h4>
              <p className="text-gray-400 text-sm">
                Showcasing excellence across the industry
              </p>
            </div>
          </div>

          {/* Next Step CTA */}
          <div className="text-center p-12 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
            <h3 className="text-2xl font-playfair font-bold text-gold-500 mb-4">
              Got Questions?
            </h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Learn more about Jerry Can Spirits, our products, and how we work in our FAQ section
            </p>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
            >
              <span>View FAQs</span>
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
