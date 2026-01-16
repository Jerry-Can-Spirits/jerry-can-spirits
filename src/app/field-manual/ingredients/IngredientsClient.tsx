'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import BackToTop from '@/components/BackToTop'

// Types for ingredient data
interface Ingredient {
  _id: string
  name: string
  slug: { current: string }
  category: 'spirits' | 'liqueurs' | 'creme-liqueurs' | 'anise-herbal' | 'aromatics' | 'wine' | 'fortified' | 'bitters' | 'mixers' | 'fresh' | 'garnishes'
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

interface IngredientsClientProps {
  ingredients: Ingredient[]
}

// Pagination settings
const ITEMS_PER_PAGE = 16

export default function IngredientsClient({ ingredients }: IngredientsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)

  // Filter ingredients
  const filteredIngredients = ingredients.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Get featured ingredients
  const featuredIngredients = filteredIngredients.filter(i => i.featured)

  // Paginated ingredients for display
  const visibleIngredients = filteredIngredients.slice(0, visibleCount)
  const hasMoreIngredients = visibleCount < filteredIngredients.length

  // Reset pagination when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleShowMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }

  // Categories for filter tabs
  const categories = [
    { value: 'all', label: 'All Ingredients' },
    { value: 'spirits', label: 'Spirits' },
    { value: 'liqueurs', label: 'Liqueurs' },
    { value: 'creme-liqueurs', label: 'Crème Liqueurs' },
    { value: 'anise-herbal', label: 'Anise & Herbal Liqueurs' },
    { value: 'aromatics', label: 'Aromatics & Essences' },
    { value: 'wine', label: 'Wine & Champagne' },
    { value: 'fortified', label: 'Fortified Wine' },
    { value: 'bitters', label: 'Bitters' },
    { value: 'mixers', label: 'Mixers' },
    { value: 'fresh', label: 'Fresh Ingredients' },
    { value: 'garnishes', label: 'Garnishes' }
  ]

  if (ingredients.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-parchment-300 mb-8">
              Our ingredients guide is being crafted. Check back soon for expert recommendations on quality cocktail components.
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
          <span className="text-gold-300">Ingredients</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
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

      {/* Filters Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:border-gold-400/40 transition-colors"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter Tabs */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Category</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
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

            {/* Results count */}
            <div className="text-parchment-300 text-sm">
              Showing <span className="text-gold-300 font-semibold">{Math.min(visibleCount, filteredIngredients.length)}</span> of <span className="text-gold-300 font-semibold">{filteredIngredients.length}</span> {filteredIngredients.length === 1 ? 'ingredient' : 'ingredients'}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Ingredients */}
      {featuredIngredients.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">★</span>
            Essential Ingredients
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredIngredients.map((item) => (
              <Link
                key={item._id}
                href={`/field-manual/ingredients/${item.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* Image */}
                {item.image && (
                  <div className="relative aspect-[4/3] bg-transparent">
                    <Image
                      src={urlFor(item.image).url()}
                      alt={item.name}
                      fill
                      className="object-contain mix-blend-multiply p-4"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">★ Featured</span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold pt-2">
                    <span>Learn More</span>
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

      {/* All Ingredients Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-6">
          {selectedCategory === 'all' ? 'All Ingredients' : categories.find(c => c.value === selectedCategory)?.label}
        </h2>

        {filteredIngredients.length === 0 ? (
          <div className="text-center py-16 bg-jerry-green-800/20 rounded-xl border border-gold-500/20">
            <p className="text-parchment-400 text-lg">No ingredients match your filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
                setVisibleCount(ITEMS_PER_PAGE)
              }}
              className="mt-4 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visibleIngredients.map((item) => (
              <Link
                key={item._id}
                href={`/field-manual/ingredients/${item.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                {/* Image */}
                {item.image && (
                  <div className="relative aspect-[4/3] bg-transparent">
                    <Image
                      src={urlFor(item.image).url()}
                      alt={item.name}
                      fill
                      className="object-contain mix-blend-multiply p-4"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                    {item.name}
                  </h3>

                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold pt-2">
                    <span>Learn More</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMoreIngredients && filteredIngredients.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 text-gold-300 rounded-xl hover:from-gold-500/30 hover:to-gold-600/30 hover:border-gold-400/60 transition-all duration-300 font-semibold"
            >
              <span>Show More Ingredients</span>
              <span className="text-parchment-400 text-sm">
                ({filteredIngredients.length - visibleCount} remaining)
              </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
