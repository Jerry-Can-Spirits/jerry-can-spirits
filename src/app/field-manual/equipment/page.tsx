import Link from 'next/link'
import Image from 'next/image'
import { client } from '@/sanity/client'
import { equipmentQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'

// Types for equipment data
interface Equipment {
  _id: string
  name: string
  slug: { current: string }
  category: 'shaking' | 'straining' | 'measuring' | 'glassware' | 'tools' | 'garnish'
  description: string
  usage: string
  essential: boolean
  specifications?: {
    material?: string
    capacity?: string
    dimensions?: string
  }
  tips: string[]
  image?: { asset: { url: string } }
  featured: boolean
}

interface CategoryInfo {
  title: string
  description: string
  equipment: Equipment[]
}

const categoryConfig = {
  shaking: {
    title: 'Shaking & Mixing',
    description: 'Essential tools for combining and chilling ingredients'
  },
  straining: {
    title: 'Straining',
    description: 'Achieving perfect clarity and consistency'
  },
  measuring: {
    title: 'Measuring',
    description: 'Precision for consistent results'
  },
  glassware: {
    title: 'Glassware',
    description: 'The perfect vessel for every cocktail'
  },
  tools: {
    title: 'Bar Tools',
    description: 'Essential implements for the modern bar'
  },
  garnish: {
    title: 'Garnish Tools',
    description: 'Finishing touches and presentation'
  }
}

async function getEquipment(): Promise<Equipment[]> {
  return await client.fetch(equipmentQuery)
}

function groupEquipmentByCategory(equipment: Equipment[]): Record<string, CategoryInfo> {
  const grouped: Record<string, CategoryInfo> = {}
  
  // Initialize all categories
  Object.entries(categoryConfig).forEach(([key, config]) => {
    grouped[key] = {
      ...config,
      equipment: []
    }
  })
  
  // Group equipment by category
  equipment.forEach(item => {
    if (grouped[item.category]) {
      grouped[item.category].equipment.push(item)
    }
  })
  
  return grouped
}

export default async function EquipmentPage() {
  const equipment = await getEquipment()
  const equipmentCategories = groupEquipmentByCategory(equipment)

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">Equipment</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Essential Barware
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Tools of the Trade
            <br />
            <span className="text-gold-300">Engineered for Excellence</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Professional-grade equipment doesn't require professional budgets. Discover the essential tools 
            that transform good ingredients into exceptional cocktails.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {Object.entries(equipmentCategories).map(([categoryKey, category]) => (
            <section key={categoryKey}>
              <div className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-white mb-4">{category.title}</h2>
                <p className="text-parchment-300 text-lg">{category.description}</p>
              </div>

              {category.equipment.length > 0 ? (
                <div className="grid gap-8">
                  {category.equipment.map((item) => (
                    <div key={item._id} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
                      <div className="relative z-10">
                        <div className="grid lg:grid-cols-3 gap-8">
                          
                          {/* Image */}
                          <div className="lg:col-span-1">
                            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 h-80 flex items-center justify-center group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                              {item.image ? (
                                <Image
                                  src={urlFor(item.image).url()}
                                  alt={item.name}
                                  width={300}
                                  height={200}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h4 className="text-lg font-serif font-bold text-white mb-2">Technical Schematic</h4>
                                  <p className="text-parchment-300 text-sm mb-4">
                                    [Blueprint illustration: {item.name}]
                                  </p>
                                  {item.essential && (
                                    <div className="inline-block px-3 py-1 bg-gold-500/20 rounded-full border border-gold-500/40">
                                      <span className="text-gold-300 text-xs font-semibold uppercase tracking-wider">Essential</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-2xl font-serif font-bold text-white">{item.name}</h3>
                                {item.essential && (
                                  <span className="text-gold-400 text-sm font-semibold">Essential</span>
                                )}
                              </div>
                              <p className="text-parchment-300 leading-relaxed">{item.description}</p>
                            </div>

                            <div>
                              <h4 className="text-lg font-serif font-bold text-gold-300 mb-2">Usage</h4>
                              <p className="text-parchment-300">{item.usage}</p>
                            </div>

                            {item.specifications && (
                              <div>
                                <h4 className="text-lg font-serif font-bold text-gold-300 mb-3">Specifications</h4>
                                <div className="grid md:grid-cols-3 gap-4">
                                  {item.specifications.material && (
                                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                                      <p className="text-gold-400 font-semibold mb-1">Material</p>
                                      <p className="text-parchment-300 text-sm">{item.specifications.material}</p>
                                    </div>
                                  )}
                                  {item.specifications.capacity && (
                                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                                      <p className="text-gold-400 font-semibold mb-1">Capacity</p>
                                      <p className="text-parchment-300 text-sm">{item.specifications.capacity}</p>
                                    </div>
                                  )}
                                  {item.specifications.dimensions && (
                                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                                      <p className="text-gold-400 font-semibold mb-1">Dimensions</p>
                                      <p className="text-parchment-300 text-sm">{item.specifications.dimensions}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div>
                              <h4 className="text-lg font-serif font-bold text-gold-300 mb-3">Professional Tips</h4>
                              <ul className="space-y-2">
                                {item.tips.map((tip, index) => (
                                  <li key={index} className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-parchment-300">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden text-center">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white mb-2">Coming Soon</h3>
                    <p className="text-parchment-300">We're curating essential equipment for this category.</p>
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}