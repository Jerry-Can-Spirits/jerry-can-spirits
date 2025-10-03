import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: "Our Ethos | Jerry Can Spirits - Values, Craftsmanship & Commitment",
  description: "Discover the values and craftsmanship philosophy behind Jerry Can Spirits. From military precision to traditional distilling methods, explore our commitment to adventure, quality, and innovation.",
  robots: {
    index: true,
    follow: true,
  },
}

export default function Ethos() {
  return (
    <main className="min-h-screen py-20">
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
                alt="Vintage compass and copper pot still - tradition meets adventure"
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
            From the discipline of military service to the artistry of traditional distilling, 
            every bottle carries our commitment to excellence, adventure, and authentic craftsmanship.
          </p>

          <div className="inline-flex items-center space-x-2 text-gold-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="text-sm font-semibold uppercase tracking-wider">Discover Our Journey</span>
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
              These principles guide everything we create - learned through experience, proven through adventure.
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
              "Service taught me what reliable means. Adventure is where I prove it. The same standards
              I learned to demand from equipment that matters - I now demand from every bottle we craft. Function over flash.
              Quality that performs. That's not negotiable."
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
              From source to spirit, every step of our process honors tradition 
              while embracing innovation. This is how we craft extraordinary rum.
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
                    We prioritize British ingredients wherever possible - from English grains to Scottish botanicals. 
                    When tradition demands Caribbean elements, we source ethically from trusted partners who share our values.
                  </p>
                  
                  {/* Hover Detail */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4">
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-jerry-green-800/60 rounded-lg p-4">
                        <h4 className="text-gold-300 font-semibold mb-2">UK Sourced</h4>
                        <ul className="text-sm text-parchment-300 space-y-1">
                          <li>• Premium English wheat</li>
                          <li>• Scottish highland water</li>
                          <li>• Local botanicals & spices</li>
                          <li>• British oak for aging</li>
                        </ul>
                      </div>
                      <div className="bg-jerry-green-800/60 rounded-lg p-4">
                        <h4 className="text-gold-300 font-semibold mb-2">Ethical Partners</h4>
                        <ul className="text-sm text-parchment-300 space-y-1">
                          <li>• Caribbean molasses</li>
                          <li>• Exotic spices & fruits</li>
                          <li>• Traditional yeast strains</li>
                          <li>• Sustainable practices</li>
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
                    We partnered with Spirit of Wales Distillery - craftspeople who share our passion for innovation rooted in tradition.
                    Their cutting-edge approach to copper distillation creates the foundation for our exceptional rums, combining modern
                    engineering with time-tested principles.
                  </p>

                  {/* Hover Detail */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6 mt-4">
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
                          <p>Their advanced copper-lined stills feature multiple vapour chambers - keeping the spirit in vapour form among the copper for maximum contact time. This extended interaction builds complex esters and flavours while creating an exceptionally smooth, soft finish. It's the perfect marriage of engineering innovation and traditional copper distillation principles.</p>
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
                    Like the finest blacksmiths and glassblowers, we believe handcraft produces superior results. 
                    Traditional copper pot distillation, precise temperature control, and careful cut selection create our signature profiles.
                  </p>
                  
                  {/* Hover Detail */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6 mt-4">
                      <h4 className="text-gold-300 font-semibold mb-3">Traditional Meets Modern</h4>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="text-gold-300 font-semibold mb-2">Traditional Methods</h5>
                          <ul className="text-sm text-parchment-300 space-y-1">
                            <li>• Copper pot distillation</li>
                            <li>• Manual temperature control</li>
                            <li>• Artisan cut selection</li>
                            <li>• Time-honored recipes</li>
                          </ul>
                        </div>
                        <div>
                          <h5 className="text-gold-300 font-semibold mb-2">Modern Precision</h5>
                          <ul className="text-sm text-parchment-300 space-y-1">
                            <li>• Scientific monitoring</li>
                            <li>• Consistent quality control</li>
                            <li>• Innovation in flavour</li>
                            <li>• Sustainable practices</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aging */}
              <div className="relative flex items-start space-x-8 group">
                <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-800 rounded-full border-4 border-gold-400 flex items-center justify-center z-10">
                  <span className="text-gold-300 font-bold text-xl">4</span>
                </div>
                <div className="flex-1 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 group-hover:border-gold-400/40 transition-all duration-300">
                  <h3 className="text-2xl font-serif font-bold text-white mb-4">
                    Aging: Time, Patience & Selection
                  </h3>
                  <p className="text-parchment-300 mb-6">
                    Great spirits cannot be rushed. We carefully select our casks - from charred American oak to sherry-seasoned European barrels -
                    and allow time to work its magic. Each barrel is monitored, tasted, and nurtured to perfection.
                  </p>
                  
                  {/* Hover Detail */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-4">
                    <div className="bg-jerry-green-800/60 rounded-lg p-6 mt-4">
                      <h4 className="text-gold-300 font-semibold mb-3">Barrel Selection</h4>
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
              The Commitment
            </h2>
            <p className="text-xl text-parchment-300 max-w-3xl mx-auto">
              Our promises extend beyond great rum. We're committed to sustainability, 
              supporting local communities, and preserving traditional craftsmanship for future generations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Sustainability */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                  </svg>
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-4">
                  Sustainability First
                </h3>
              </div>
              
              <div className="space-y-4 text-parchment-300">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Local Sourcing Priority</p>
                    <p className="text-sm">Reducing carbon footprint through UK-first ingredient strategy</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Ethical Partnerships</p>
                    <p className="text-sm">Supporting sustainable practices across our supply chain</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Waste Reduction</p>
                    <p className="text-sm">Minimizing environmental impact through efficient processes</p>
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
                    <p className="font-semibold text-gold-300">No Compromises</p>
                    <p className="text-sm">Every ingredient, process, and decision prioritizes excellence</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Traditional Craft</p>
                    <p className="text-sm">Preserving time-honored techniques in modern applications</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gold-300">Continuous Improvement</p>
                    <p className="text-sm">Learning, evolving, and perfecting with every batch</p>
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
              Join the Expedition
            </h2>
            <p className="text-xl text-parchment-300 mb-8 max-w-2xl mx-auto">
              Be part of our journey as we craft the future of premium British rum. 
              From source to spirit, discover what makes Jerry Can Spirits extraordinary.
            </p>
            
            <a 
              href="/#signup"
              className="inline-flex items-center space-x-2 bg-jerry-green-800 hover:bg-jerry-green-900 text-parchment-50 px-8 py-4 rounded-lg font-semibold border-2 border-jerry-green-800 hover:border-jerry-green-700 transition-all duration-300 transform hover:scale-105"
            >
              <span>Join Our Newsletter</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </section>

      </div>
    </main>
  )
}