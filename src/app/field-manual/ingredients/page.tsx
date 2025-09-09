import Link from 'next/link'
import { client } from '@/sanity/client'
import { ingredientsQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'

// Types for ingredient data
interface Ingredient {
  _id: string
  name: string
  slug: { current: string }
  category: 'spirits' | 'liqueurs' | 'bitters' | 'fresh' | 'garnishes'
  description: string
  usage: string
  topTips: string[]
  recommendedBrands?: {
    budget?: string
    premium?: string
  }
  storage?: string
  image?: { asset: { url: string } }
  featured: boolean
}

interface CategoryInfo {
  title: string
  description: string
  ingredients: Ingredient[]
}

const categoryConfig = {
  spirits: {
    title: 'Spirits',
    description: 'The foundation of great cocktails'
  },
  liqueurs: {
    title: 'Liqueurs', 
    description: 'Essential modifiers and flavor enhancers'
  },
  bitters: {
    title: 'Bitters',
    description: 'The bartender\'s spice rack'
  },
  fresh: {
    title: 'Fresh Ingredients',
    description: 'Quality starts with fresh components'
  },
  garnishes: {
    title: 'Garnishes',
    description: 'The finishing touch that matters'
  }
}

async function getIngredients(): Promise<Ingredient[]> {
  return await client.fetch(ingredientsQuery)
}

function groupIngredientsByCategory(ingredients: Ingredient[]): Record<string, CategoryInfo> {
  const grouped: Record<string, CategoryInfo> = {}
  
  // Initialize all categories
  Object.entries(categoryConfig).forEach(([key, config]) => {
    grouped[key] = {
      ...config,
      ingredients: []
    }
  })
  
  // Group ingredients by category
  ingredients.forEach(ingredient => {
    if (grouped[ingredient.category]) {
      grouped[ingredient.category].ingredients.push(ingredient)
    }
  })
  
  return grouped
}

export default async function IngredientsPage() {
  const ingredients = await getIngredients()
  const ingredientCategories = groupIngredientsByCategory(ingredients)

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">Ingredients</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Premium Ingredients
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Quality Components
            <br />
            <span className="text-gold-300">Exceptional Results</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Every great cocktail starts with quality ingredients. Discover our carefully curated selection 
            of spirits, mixers, and fresh components that elevate your home bar.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {Object.entries(ingredientCategories).map(([categoryKey, category]) => (
            <section key={categoryKey}>
              <div className="mb-8">
                <h2 className="text-3xl font-serif font-bold text-white mb-4">{category.title}</h2>
                <p className="text-parchment-300 text-lg">{category.description}</p>
              </div>

              {category.ingredients.length > 0 ? (
                <div className="grid gap-8">
                  {category.ingredients.map((ingredient) => (
                    <div key={ingredient._id} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
                      <div className="relative z-10">
                        <div className="grid lg:grid-cols-3 gap-8">
                          
                          {/* Image */}
                          <div className="lg:col-span-1">
                            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20 h-64 flex items-center justify-center group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                              {ingredient.image ? (
                                <img
                                  src={urlFor(ingredient.image).url()}
                                  alt={ingredient.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-parchment-300 text-sm">
                                    [Blueprint illustration: {ingredient.name}]
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="lg:col-span-2 space-y-6">
                            <div>
                              <h3 className="text-2xl font-serif font-bold text-white mb-3">{ingredient.name}</h3>
                              <p className="text-parchment-300 leading-relaxed">{ingredient.description}</p>
                            </div>

                            <div>
                              <h4 className="text-lg font-serif font-bold text-gold-300 mb-2">Usage</h4>
                              <p className="text-parchment-300">{ingredient.usage}</p>
                            </div>

                            <div>
                              <h4 className="text-lg font-serif font-bold text-gold-300 mb-3">Top Tips</h4>
                              <ul className="space-y-2">
                                {ingredient.topTips.map((tip, index) => (
                                  <li key={index} className="flex items-start space-x-3">
                                    <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                                    <span className="text-parchment-300">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {'recommendedBrands' in ingredient && ingredient.recommendedBrands && (
                              <div>
                                <h4 className="text-lg font-serif font-bold text-gold-300 mb-3">Recommended Brands</h4>
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                                    <p className="text-green-400 font-semibold mb-1">Budget Choice</p>
                                    <p className="text-parchment-300">{ingredient.recommendedBrands.budget}</p>
                                  </div>
                                  <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                                    <p className="text-gold-400 font-semibold mb-1">Premium Choice</p>
                                    <p className="text-parchment-300">{ingredient.recommendedBrands.premium}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {'storage' in ingredient && ingredient.storage && (
                              <div className="p-4 bg-jerry-green-800/40 rounded-lg border border-gold-500/20">
                                <div className="flex items-start space-x-3">
                                  <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <div>
                                    <h5 className="text-gold-300 font-semibold mb-1">Storage & Handling</h5>
                                    <p className="text-parchment-300 text-sm">{ingredient.storage}</p>
                                  </div>
                                </div>
                              </div>
                            )}
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
                    <p className="text-parchment-300">We're carefully curating ingredients for this category.</p>
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