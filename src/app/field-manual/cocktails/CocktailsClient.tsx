'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BackToTop from '@/components/BackToTop'

// Types for cocktail data from Sanity
interface CocktailIngredient {
  name: string
  amount: string
  description?: string
  ingredientRef?: {
    _id: string
    name: string
    slug: { current: string }
  }
}

interface CocktailVariant {
  name: string
  description: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
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
  glassware: {
    _id: string
    name: string
    slug: { current: string }
  }
  garnish: string
  note?: string
  variants?: CocktailVariant[]
  category?: string
  featured?: boolean
  image?: string
}

interface CocktailsClientProps {
  cocktails: SanityCocktail[]
}

export default function CocktailsClient({ cocktails }: CocktailsClientProps) {
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'text-green-400 border-green-400/40 bg-green-400/10'
      case 'wayfinder': return 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10'
      case 'trailblazer': return 'text-red-400 border-red-400/40 bg-red-400/10'
      default: return 'text-gold-400 border-gold-400/40 bg-gold-400/10'
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

  // Filter cocktails
  const filteredCocktails = cocktails.filter(cocktail => {
    const matchesCategory = selectedCategory === 'all' || cocktail.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || cocktail.difficulty === selectedDifficulty
    const matchesSearch = !searchQuery ||
      cocktail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cocktail.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesDifficulty && matchesSearch
  })

  // Get featured cocktails
  const featuredCocktails = filteredCocktails.filter(c => c.featured)

  // Categories for filter tabs (Base Spirits & Cocktail Families)
  const categories = [
    { value: 'all', label: 'All Cocktails' },
    { value: 'spiced-rum', label: 'Spiced Rum' },
    { value: 'white-rum', label: 'White Rum' },
    { value: 'aged-rum', label: 'Aged Rum' },
    { value: 'dark-rum', label: 'Dark Rum' },
    { value: 'overproof-rum', label: 'Overproof Rum' },
    { value: 'vodka', label: 'Vodka' },
    { value: 'gin', label: 'Gin' },
    { value: 'tequila', label: 'Tequila' },
    { value: 'mezcal', label: 'Mezcal' },
    { value: 'whiskey', label: 'Whiskey' },
    { value: 'brandy', label: 'Brandy' },
    { value: 'cachaca', label: 'Cachaça' },
    { value: 'aromatised-wine', label: 'Aromatised Wine' },
    { value: 'champagne', label: 'Champagne' },
    { value: 'liqueur-based', label: 'Liqueur-Based' },
    { value: 'non-alcoholic', label: 'Non-Alcoholic' }
  ]

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'novice', label: 'Novice' },
    { value: 'wayfinder', label: 'Wayfinder' },
    { value: 'trailblazer', label: 'Trailblazer' }
  ]

  if (cocktails.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-parchment-300 mb-8">
              Our signature cocktail recipes are being crafted. Check back soon for expertly designed drinks featuring our premium rum.
            </p>
            <Link
              href="/field-manual"
              className="inline-flex items-center px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
            >
              Back to Field Manual
            </Link>
          </div>
        </div>
      </main>
    )
  }

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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Cocktail Collection
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Master the Classics
            <br />
            <span className="text-gold-300">Engineer New Adventures</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Each cocktail is carefully crafted to showcase <Link href="/shop/drinks" className="text-gold-300 hover:text-gold-400 underline decoration-gold-500/40 hover:decoration-gold-400 transition-colors">our premium rum's</Link> unique character.
            Start with the classics, then explore our signature variations designed for the modern explorer.
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search cocktails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:border-gold-400/40 transition-colors"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter Tabs */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Spirit Type</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      selectedCategory === category.value
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Difficulty Level</h3>
              <div className="flex flex-wrap gap-2">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => setSelectedDifficulty(difficulty.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      selectedDifficulty === difficulty.value
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    {difficulty.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div className="text-parchment-300 text-sm">
              Showing <span className="text-gold-300 font-semibold">{filteredCocktails.length}</span> {filteredCocktails.length === 1 ? 'cocktail' : 'cocktails'}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cocktails */}
      {featuredCocktails.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">★</span>
            Signature Cocktails
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredCocktails.map((cocktail) => (
              <Link
                key={cocktail._id}
                href={`/cocktails/${cocktail.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* Image */}
                {cocktail.image && (
                  <div className="relative aspect-[4/3] bg-jerry-green-800/20">
                    <Image
                      src={cocktail.image}
                      alt={cocktail.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">★ Signature</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                      {cocktail.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${getDifficultyColor(cocktail.difficulty)}`}>
                      {getDifficultyLabel(cocktail.difficulty)}
                    </span>
                  </div>

                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {cocktail.description}
                  </p>

                  {cocktail.variants && cocktail.variants.length > 0 && (
                    <p className="text-gold-400 text-xs">
                      {cocktail.variants.length + 1} variations
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold pt-2">
                    <span>View Full Recipe</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Cocktails Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-6">
          {selectedCategory === 'all' ? 'All Cocktails' : categories.find(c => c.value === selectedCategory)?.label}
        </h2>

        {filteredCocktails.length === 0 ? (
          <div className="text-center py-16 bg-jerry-green-800/20 rounded-xl border border-gold-500/20">
            <p className="text-parchment-400 text-lg">No cocktails match your filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSelectedDifficulty('all')
                setSearchQuery('')
              }}
              className="mt-4 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCocktails.map((cocktail) => (
              <Link
                key={cocktail._id}
                href={`/cocktails/${cocktail.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                {/* Image */}
                {cocktail.image && (
                  <div className="relative aspect-[4/3] bg-jerry-green-800/20">
                    <Image
                      src={cocktail.image}
                      alt={cocktail.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                      {cocktail.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${getDifficultyColor(cocktail.difficulty)}`}>
                      {getDifficultyLabel(cocktail.difficulty)}
                    </span>
                  </div>

                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {cocktail.description}
                  </p>

                  {cocktail.variants && cocktail.variants.length > 0 && (
                    <p className="text-gold-400 text-xs">
                      {cocktail.variants.length + 1} variations
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold pt-2">
                    <span>View Full Recipe</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
