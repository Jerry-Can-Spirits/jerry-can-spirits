import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "Our Ethos - Values & Craftsmanship",
  description: "The values behind Jerry Can Spirits premium spiced rum. Small batch craft rum made with Madagascan vanilla, Ceylon cinnamon, and real botanicals. Veteran-owned, Welsh-distilled.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/ethos/',
  },
  openGraph: {
    title: 'Our Ethos - Values & Craftsmanship | Jerry Can Spirits®',
    description: 'The values behind Jerry Can Spirits premium spiced rum. Small batch craft rum made with real botanicals, Welsh-distilled, veteran-owned.',
    url: 'https://jerrycanspirits.co.uk/ethos/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

// FAQ Schema for rich snippets
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What values does Jerry Can Spirits stand for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our core values are reliability (always there when you need it), function over form (beauty that serves purpose), adventure spirit (for modern explorers), precision (getting it right the first time), authenticity (honest about our craft), and "earned, not given" (quality that proves itself).',
      },
    },
    {
      '@type': 'Question',
      name: 'Where is Jerry Can Spirits rum made?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our rum is distilled at Spirit of Wales Distillery in Newport, Gwent. We use their advanced copper-lined stills combined with Caribbean rum base and pure Welsh water to create our signature spirits.',
      },
    },
    {
      '@type': 'Question',
      name: 'Why do you use Caribbean rum in a British brand?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'While we prioritise UK sourcing wherever possible (Welsh water, local botanicals, British oak), quality rum base traditionally comes from the Caribbean where rum-making expertise originates. We use Caribbean rum as our foundation because some things simply cannot be replicated.',
      },
    },
    {
      '@type': 'Question',
      name: 'What makes your distillation process different?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We partner with Spirit of Wales Distillery who use innovative copper-lined stills with multiple vapour chambers. This extended copper contact keeps the spirit in vapour form longer, building complex esters and flavours while creating an exceptionally smooth, soft finish.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is Jerry Can Spirits a small batch rum?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. We deliberately keep production small so we can actually pay attention to what we\'re making. We\'d rather make less rum that\'s actually good than more that\'s mediocre. No shortcuts, no compromises.',
      },
    },
  ],
}

export default function Ethos() {
  return (
    <main className="min-h-screen py-20">
      <StructuredData data={faqSchema} id="ethos-faq-schema" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Our Ethos' },
          ]}
        />
      </div>

      {/* Hero Section - Compass & Copper */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero Imagery Placeholder */}
          <div className="mb-12 relative">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Our Ethos
              </span>
            </div>
            
            {/* Compass & Copper Visual */}
            <div className="relative w-full max-w-3xl mx-auto mb-8">
              <Image
                src="/images/hero/Compass_Still.webp"
                alt="Vintage compass and pot still - tradition meets adventure"
                width={1200}
                height={600}
                className="rounded-lg"
              />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Built by Experience,
            <br />
            <span className="text-gold-300">Crafted for Adventure</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            We&apos;re not trying to reinvent spiced rum – we just want to make it properly. Real botanicals, honest processes, and no cutting corners. Each bottle of our small batch rum is the result of genuine care about what goes in it.
          </p>

          <div className="inline-flex items-center space-x-2 text-gold-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wider">Our Journey</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section 1: Our Values */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Our Values
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The things that matter to us when we&apos;re making rum.
            </p>
          </div>

          {/* Unified Values Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                value: "Reliability",
                description: "Always there when you need it. From expedition gear to evening drinks, you can count on it."
              },
              {
                value: "Function Over Form",
                description: "Beauty that serves purpose. Every detail engineered to perform."
              },
              {
                value: "Adventure Spirit",
                description: "For modern explorers pushing boundaries - whether across continents or just past comfort zones."
              },
              {
                value: "Precision",
                description: "Getting it right the first time. No shortcuts, no compromises."
              },
              {
                value: "Authenticity",
                description: "Honest about our craft, transparent about our process, genuine in our commitments."
              },
              {
                value: "Earned, Not Given",
                description: "Quality that proves itself. The drink at the end of the journey you've actually taken."
              }
            ].map((item, index) => (
              <div key={index} className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 group">
                <div className="mb-4">
                  <h3 className="text-xl font-serif font-bold text-gold-300 mb-3">{item.value}</h3>
                  <p className="text-parchment-300 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Philosophy Quote */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 text-center">
            <p className="text-xl text-white leading-relaxed">
              &quot;In the military you learn to appreciate kit that just works – nothing fancy, just reliable.
              That&apos;s what we&apos;re going for with our rum. Function over flash. Quality that actually delivers.&quot;
            </p>
            <div className="mt-6 text-gold-300 text-sm font-semibold uppercase tracking-wider">
              - The Jerry Can Philosophy
            </div>
          </div>
        </section>

        {/* Section 2: The Journey (Process Timeline) */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              The Journey
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              From source to spirit, every step of our process honours tradition
              while embracing innovation. This is how we craft extraordinary spirits.
            </p>
          </div>

          {/* Process Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-gold-400 via-gold-500 to-gold-600"></div>
            
            <div className="space-y-12">
              {/* Sourcing */}
              <div className="relative flex items-start space-x-8 group">
                <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-800 rounded-full border-4 border-gold-400 flex items-center justify-center z-10">
                  <span className="text-gold-300 font-bold text-xl">1</span>
                </div>
                <div className="flex-1 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                  <h3 className="text-2xl font-serif font-bold text-white mb-4">
                    Sourcing: UK First Philosophy
                  </h3>
                  <p className="text-parchment-300 mb-6">
                    We prioritise British ingredients wherever possible, from botanicals to water sources.
                    When tradition demands specific elements, we source ethically from trusted partners who share our values.
                  </p>

                  {/* Details - Always Visible */}
                  <div className="mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-jerry-green-800/60 rounded-lg p-4">
                        <h4 className="text-gold-300 font-semibold mb-2">UK Sourced</h4>
                        <ul className="text-sm text-parchment-300 space-y-1">
                          <li>• Pure Welsh water</li>
                          <li>• Welsh brewery molasses</li>
                          <li>• Bourbon barrel chips</li>
                          <li>• Agave syrup</li>
                        </ul>
                      </div>
                      <div className="bg-jerry-green-800/60 rounded-lg p-4">
                        <h4 className="text-gold-300 font-semibold mb-2">Premium Botanicals</h4>
                        <ul className="text-sm text-parchment-300 space-y-1">
                          <li>• Madagascan vanilla pods</li>
                          <li>• Ceylon cinnamon</li>
                          <li>• Orange peel, ginger, cloves</li>
                          <li>• Caribbean rum base</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection */}
              <div className="relative flex items-start space-x-8 group">
                <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-800 rounded-full border-4 border-gold-400 flex items-center justify-center z-10">
                  <span className="text-gold-300 font-bold text-xl">2</span>
                </div>
                <div className="flex-1 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                  <h3 className="text-2xl font-serif font-bold text-white mb-4">
                    Selection: Expert Partners in Welsh Craft
                  </h3>
                  <p className="text-parchment-300 mb-6">
                    We partnered with <strong className="text-gold-300">Spirit of Wales Distillery in Newport, South Wales</strong>, craftspeople who share our passion for innovation rooted in tradition.
                    Their cutting-edge approach to copper distillation creates the foundation for our exceptional spirits, combining modern
                    techniques with time-tested principles.
                  </p>

                  {/* Details - Always Visible */}
                  <div className="mt-6">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6">
                      <h4 className="text-gold-300 font-semibold mb-3">The Spirit of Wales Approach</h4>
                      <div className="text-sm text-parchment-300 space-y-4">
                        <div>
                          <strong className="text-gold-300">Copper-Lined Innovation</strong>
                          <p>Extended vapour contact with copper creates multiple ester chambers, building complex flavours and a remarkably smooth finish</p>
                        </div>
                        <div>
                          <strong className="text-gold-300">Master Craftsmanship</strong>
                          <p>Expert distillers with proven knowledge in spirit development and flavour profiling</p>
                        </div>
                        <div>
                          <strong className="text-gold-300">Engineering Excellence</strong>
                          <p>Their advanced copper-lined stills feature multiple vapour chambers, keeping the spirit in vapour form among the copper for maximum contact time. This extended interaction builds complex esters and flavours while creating an exceptionally smooth, soft finish. It's the perfect marriage of engineering innovation and traditional copper distillation principles.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Crafting */}
              <div className="relative flex items-start space-x-8 group">
                <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-800 rounded-full border-4 border-gold-400 flex items-center justify-center z-10">
                  <span className="text-gold-300 font-bold text-xl">3</span>
                </div>
                <div className="flex-1 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                  <h3 className="text-2xl font-serif font-bold text-white mb-4">
                    Crafting: Tradition Meets Innovation
                  </h3>
                  <p className="text-parchment-300 mb-6">
                    We steep real botanicals (Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, and warming spices) slowly in Caribbean rum, allowing each ingredient time to impart its true character.
                    Agave syrup adds natural sweetness, and bourbon barrel chips layer in soft oak and warmth. See our{' '}
                    <Link href="/ingredients/expedition-spiced-rum/" className="text-gold-300 hover:text-gold-400 underline">full ingredients list</Link>.
                  </p>
                  
                  {/* Details - Always Visible */}
                  <div className="mt-6">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6">
                      <h4 className="text-gold-300 font-semibold mb-3">The Craft</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-gold-300 font-semibold mb-2">Traditional Foundation</h5>
                          <ul className="text-sm text-parchment-300 space-y-1">
                            <li>• Pot distilled</li>
                            <li>• Careful cut selection</li>
                            <li>• Time-tested methods</li>
                            <li>• Artisan attention to detail</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-gold-300 font-semibold mb-2">Modern Standards</h5>
                          <ul className="text-sm text-parchment-300 space-y-1">
                            <li>• Rigorous quality control</li>
                            <li>• Precise monitoring</li>
                            <li>• Consistent results</li>
                            <li>• Innovation in balance</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aging - Future Products */}
              <div className="relative flex items-start space-x-8 group">
                <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-800 rounded-full border-4 border-gold-400 flex items-center justify-center z-10">
                  <span className="text-gold-300 font-bold text-xl">4</span>
                </div>
                <div className="flex-1 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                  <h3 className="text-2xl font-serif font-bold text-white mb-4">
                    The Future: Barrel-Aged Expressions
                  </h3>
                  <p className="text-parchment-300 mb-6">
                    Great spirits cannot be rushed. For future releases, we're exploring barrel aging with carefully selected casks - from charred American oak to sherry-seasoned European barrels.
                    These aged expressions will allow time to work its magic, with each barrel monitored, tasted, and nurtured to perfection.
                  </p>

                  {/* Details - Always Visible */}
                  <div className="mt-6">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6">
                      <h4 className="text-gold-300 font-semibold mb-3">Planned Barrel Selection</h4>
                      <div className="grid md:grid-cols-3 gap-4 text-sm text-parchment-300">
                        <div>
                          <strong className="text-gold-300">American Oak</strong>
                          <p>Vanilla, caramel, and spice development</p>
                        </div>
                        <div>
                          <strong className="text-gold-300">European Oak</strong>
                          <p>Rich tannins and complex fruit notes</p>
                        </div>
                        <div>
                          <strong className="text-gold-300">Special Finishes</strong>
                          <p>Port, sherry, and wine cask innovations</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: The Commitment */}
        <section className="py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Our Commitments
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              The principles that guide how we make our spiced rum. No compromises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* UK Focus */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  UK-First Where Possible
                </h3>
              </div>

              <div className="space-y-4 text-parchment-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Local Sourcing</p>
                    <p className="text-sm">We try to source from the UK when we can – it makes sense for a British brand</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Welsh Partnership</p>
                    <p className="text-sm">Working with Spirit of Wales Distillery for our blending and production</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Caribbean Rum</p>
                    <p className="text-sm">Some things have to come from elsewhere – we use quality Caribbean rum as our base</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quality */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Quality Over Quantity
                </h3>
              </div>

              <div className="space-y-4 text-parchment-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">No Shortcuts</p>
                    <p className="text-sm">We&apos;d rather make less rum that&apos;s actually good than more that&apos;s mediocre</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Continuous Improvement</p>
                    <p className="text-sm">Every batch is an opportunity to refine our craft and push for better</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Small Batch</p>
                    <p className="text-sm">Keeping things small means we can actually pay attention to what we&apos;re making</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-6">
              Try the Rum
            </h2>
            <p className="text-xl text-parchment-300 mb-8 max-w-2xl mx-auto">
              Enough about us – the proof is in the bottle. Check out our <Link href="/shop/product/expedition-spiced-rum/" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">Expedition Spiced Rum</Link> and see what you think.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop/drinks/"
                className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
              >
                <span>Shop Our Rum</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <Link
                href="/about/story/"
                className="inline-flex items-center justify-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-700 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-gold-500/30 hover:border-gold-500/60 transition-all duration-300 transform hover:scale-105"
              >
                <span>Read Our Story</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

      </div>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}