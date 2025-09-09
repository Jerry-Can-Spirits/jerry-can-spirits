'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { cocktailsQuery } from '@/sanity/queries'

// Types for cocktail data from Sanity
interface CocktailIngredient {
  name: string
  amount: string
  description?: string
}

interface CocktailVariant {
  name: string
  description: string
  ingredients: CocktailIngredient[]
  instructions: string[]
  note?: string
}

interface SanityCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
  ingredients: CocktailIngredient[]
  instructions: string[]
  glassware: string
  garnish: string
  note?: string
  variants?: CocktailVariant[]
  category?: string
  featured?: boolean
  image?: { asset: { url: string } }
}

export default function CocktailsPage() {
  const [cocktails, setCocktails] = useState<SanityCocktail[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCocktail, setSelectedCocktail] = useState<SanityCocktail | null>(null)
  const [activeVariant, setActiveVariant] = useState<number>(-1) // -1 for original, 0+ for variants

  // Fetch cocktails from Sanity
  useEffect(() => {
    const fetchCocktails = async () => {
      try {
        const data = await client.fetch(cocktailsQuery)
        setCocktails(data)
        if (data.length > 0) {
          setSelectedCocktail(data[0])
        }
      } catch (error) {
        console.error('Error fetching cocktails:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCocktails()
  }, [])

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'text-green-400'
      case 'wayfinder': return 'text-yellow-400'
      case 'trailblazer': return 'text-red-400'
      default: return 'text-gold-400'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'Novice'
      case 'wayfinder': return 'Wayfinder'
      case 'trailblazer': return 'Trailblazer'
      default: return difficulty
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gold-300 text-lg">Loading cocktails from Field Manual...</div>
          </div>
        </div>
      </main>
    )
  }

  if (cocktails.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">No Cocktails Yet</h1>
            <p className="text-parchment-300 mb-8">
              Add your first cocktail in the Sanity Studio to get started.
            </p>
            <Link 
              href="/studio"
              className="inline-flex items-center px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
            >
              Open Sanity Studio
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const currentRecipe = activeVariant >= 0 && selectedCocktail?.variants 
    ? selectedCocktail.variants[activeVariant] 
    : selectedCocktail

  if (!currentRecipe) return null

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">Cocktails</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Spiced Rum Cocktails
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Master the Classics
            <br />
            <span className="text-gold-300">Engineer New Adventures</span>
          </h1>
          
          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Each cocktail is carefully crafted to showcase our spiced rum's unique character. 
            Start with the classics, then explore our signature variations designed for the modern explorer.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Cocktail List */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 sticky top-24">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50 rounded-xl"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-serif font-bold text-white mb-6">Cocktail Collection</h2>
                
                <div className="space-y-4">
                  {cocktails.map((cocktail) => (
                    <div
                      key={cocktail._id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                        selectedCocktail?._id === cocktail._id 
                          ? 'bg-jerry-green-800/40 border-gold-500/40' 
                          : 'bg-jerry-green-800/20 border-gold-500/20 hover:bg-jerry-green-800/30 hover:border-gold-400/30'
                      }`}
                      onClick={() => {
                        setSelectedCocktail(cocktail)
                        setActiveVariant(-1)
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-serif font-bold text-white">{cocktail.name}</h3>
                        <span className={`text-xs font-semibold ${getDifficultyColor(cocktail.difficulty)}`}>
                          {getDifficultyLabel(cocktail.difficulty)}
                        </span>
                      </div>
                      <p className="text-parchment-300 text-sm">{cocktail.description}</p>
                      <div className="mt-2 text-xs text-gold-400">
                        {(cocktail.variants?.length || 0) + 1} variations
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                  <h3 className="font-serif font-bold text-gold-300 mb-2">Add More Cocktails</h3>
                  <p className="text-parchment-300 text-sm mb-3">
                    Create new cocktails in your Sanity Studio
                  </p>
                  <Link 
                    href="/studio"
                    className="text-xs text-gold-400 hover:text-gold-300 underline transition-colors"
                  >
                    Open Studio →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Display */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Cocktail Header */}
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2">
                      {activeVariant >= 0 ? currentRecipe.name : selectedCocktail?.name}
                    </h2>
                    {activeVariant >= 0 && (
                      <p className="text-gold-300 text-sm font-semibold mb-2">
                        Based on {selectedCocktail?.name}
                      </p>
                    )}
                    <p className="text-parchment-300 leading-relaxed">
                      {currentRecipe.description}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full border text-sm font-semibold ${getDifficultyColor(selectedCocktail?.difficulty || '')}`}>
                    {getDifficultyLabel(selectedCocktail?.difficulty || '')}
                  </span>
                </div>

                {/* Variant Selector */}
                {selectedCocktail?.variants && selectedCocktail.variants.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-serif font-bold text-gold-300 mb-3">Variations</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveVariant(-1)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                          activeVariant === -1 
                            ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40' 
                            : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                        }`}
                      >
                        Classic
                      </button>
                      {selectedCocktail.variants.map((variant, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveVariant(index)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                            activeVariant === index 
                              ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40' 
                              : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                          }`}
                        >
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipe Details */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-parchment-300"><strong className="text-gold-300">Glassware:</strong> {selectedCocktail?.glassware}</p>
                    <p className="text-parchment-300"><strong className="text-gold-300">Garnish:</strong> {selectedCocktail?.garnish}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold text-white mb-6">Ingredients</h3>
                
                <div className="space-y-4">
                  {currentRecipe.ingredients?.map((ingredient, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                      <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-grow">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-white">{ingredient.name}</span>
                          <span className="text-gold-300 font-semibold">{ingredient.amount}</span>
                        </div>
                        {ingredient.description && (
                          <p className="text-parchment-300 text-sm">{ingredient.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-serif font-bold text-white mb-6">Instructions</h3>
                
                <div className="space-y-4">
                  {currentRecipe.instructions?.map((instruction, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-gold-400 font-bold text-sm">{index + 1}</span>
                      </div>
                      <p className="text-parchment-300 leading-relaxed pt-1">{instruction}</p>
                    </div>
                  ))}
                </div>

                {(currentRecipe.note || (activeVariant >= 0 && selectedCocktail?.variants?.[activeVariant]?.note)) && (
                  <div className="mt-8 p-6 bg-jerry-green-800/40 rounded-lg border border-gold-500/20">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-gold-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h4 className="text-gold-300 font-semibold mb-2">Expert Tip</h4>
                        <p className="text-parchment-300 leading-relaxed">
                          {activeVariant >= 0 && selectedCocktail?.variants?.[activeVariant]?.note 
                            ? selectedCocktail.variants[activeVariant].note 
                            : currentRecipe.note}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}