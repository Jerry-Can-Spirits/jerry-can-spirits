'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import BackToTop from '@/components/BackToTop'

// Ratings type
interface RatingsMap {
  [slug: string]: { count: number; average: number }
}

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
  family?: string
  baseSpirit?: string
  category?: string // Legacy field
  tags?: string[]
  featured?: boolean
  image?: string
}

// Tag display labels (convert values to readable format)
const tagLabels: Record<string, string> = {
  'high-abv': 'High-ABV',
  'low-abv': 'Low-ABV',
  'sessionable': 'Sessionable',
  'multi-spirit': 'Multi-Spirit',
  'spirit-forward': 'Spirit-Forward',
  'long-drink': 'Long Drink',
  'party': 'Party',
  'brunch': 'Brunch',
  'after-dinner': 'After-Dinner',
  'aperitif': 'Aperitif',
  'digestif': 'Digestif',
  'celebratory': 'Celebratory',
  'late-night': 'Late Night',
  'tiki': 'Tiki',
  'built': 'Built',
  'shaken': 'Shaken',
  'stirred': 'Stirred',
  'batchable': 'Batchable',
  'shot': 'Shot',
  'hot': 'Hot',
  'frozen': 'Frozen',
  'bitter': 'Bitter'
}

// Pagination settings
const ITEMS_PER_PAGE = 16

interface CocktailsClientProps {
  cocktails: SanityCocktail[]
}

export default function CocktailsClient({ cocktails }: CocktailsClientProps) {
  // Filter states
  const [selectedFamily, setSelectedFamily] = useState<string>('all')
  const [selectedSpirit, setSelectedSpirit] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)
  const [sortBy, setSortBy] = useState<string>('default')
  const [ratings, setRatings] = useState<RatingsMap>({})
  const [ratingsLoaded, setRatingsLoaded] = useState<boolean>(false)

  // Fetch all ratings on mount
  useEffect(() => {
    async function fetchRatings() {
      try {
        const response = await fetch('/api/ratings?all=true')
        if (response.ok) {
          const data = await response.json()
          setRatings(data.ratings || {})
        }
      } catch (error) {
        console.error('Failed to fetch ratings:', error)
      } finally {
        setRatingsLoaded(true)
      }
    }
    fetchRatings()
  }, [])

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

  // Rum subtypes for "All Rum" filter
  const rumSpirits = ['spiced-rum', 'white-rum', 'aged-rum', 'dark-rum', 'overproof-rum']

  // Helper to check spirit match
  const matchesSpiritFilter = (spirit: string | undefined, filter: string) => {
    if (filter === 'all') return true
    if (filter === 'all-rum') return rumSpirits.includes(spirit || '')
    return spirit === filter
  }

  // Bi-directional faceted filtering - each filter affects all others
  // Step 1: Filter by search only (base pool)
  const searchFilteredCocktails = cocktails.filter(cocktail => {
    return !searchQuery ||
      cocktail.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cocktail.description.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Step 2: Apply all filters for final results
  const filteredCocktails = searchFilteredCocktails.filter(cocktail => {
    const matchesFamily = selectedFamily === 'all' || cocktail.family === selectedFamily
    const matchesSpirit = matchesSpiritFilter(cocktail.baseSpirit, selectedSpirit)
    const matchesDifficulty = selectedDifficulty === 'all' || cocktail.difficulty === selectedDifficulty
    return matchesFamily && matchesSpirit && matchesDifficulty
  })

  // Bi-directional available options - each considers OTHER filters but not itself
  // Available families = families in cocktails matching spirit + difficulty + search
  const cocktailsForFamilyOptions = searchFilteredCocktails.filter(cocktail => {
    const matchesSpirit = matchesSpiritFilter(cocktail.baseSpirit, selectedSpirit)
    const matchesDifficulty = selectedDifficulty === 'all' || cocktail.difficulty === selectedDifficulty
    return matchesSpirit && matchesDifficulty
  })
  const availableFamilies = new Set(cocktailsForFamilyOptions.map(c => c.family).filter(Boolean))

  // Available spirits = spirits in cocktails matching family + difficulty + search
  const cocktailsForSpiritOptions = searchFilteredCocktails.filter(cocktail => {
    const matchesFamily = selectedFamily === 'all' || cocktail.family === selectedFamily
    const matchesDifficulty = selectedDifficulty === 'all' || cocktail.difficulty === selectedDifficulty
    return matchesFamily && matchesDifficulty
  })
  const availableSpirits = new Set(cocktailsForSpiritOptions.map(c => c.baseSpirit).filter(Boolean))
  // Check if any rum types are available for "All Rum" option
  const hasAnyRum = rumSpirits.some(rum => availableSpirits.has(rum))

  // Available difficulties = difficulties in cocktails matching family + spirit + search
  const cocktailsForDifficultyOptions = searchFilteredCocktails.filter(cocktail => {
    const matchesFamily = selectedFamily === 'all' || cocktail.family === selectedFamily
    const matchesSpirit = matchesSpiritFilter(cocktail.baseSpirit, selectedSpirit)
    return matchesFamily && matchesSpirit
  })
  const availableDifficulties = new Set(cocktailsForDifficultyOptions.map(c => c.difficulty).filter(Boolean))

  // Get featured cocktails
  const featuredCocktails = filteredCocktails.filter(c => c.featured)

  // Sort cocktails based on selected sort option
  const sortedCocktails = [...filteredCocktails].sort((a, b) => {
    if (sortBy === 'top-rated') {
      const ratingA = ratings[a.slug.current]?.average || 0
      const ratingB = ratings[b.slug.current]?.average || 0
      const countA = ratings[a.slug.current]?.count || 0
      const countB = ratings[b.slug.current]?.count || 0
      // Sort by average rating first, then by count as tiebreaker
      if (ratingB !== ratingA) return ratingB - ratingA
      return countB - countA
    }
    // Default: alphabetical
    return a.name.localeCompare(b.name)
  })

  // Paginated cocktails for display
  const visibleCocktails = sortedCocktails.slice(0, visibleCount)
  const hasMoreCocktails = visibleCount < sortedCocktails.length

  // Helper to render star rating display
  const renderStars = (average: number, count: number) => {
    if (count === 0) return null
    const fullStars = Math.floor(average)
    const hasHalfStar = average - fullStars >= 0.5
    return (
      <div className="flex items-center gap-1">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`w-3.5 h-3.5 ${
                star <= fullStars
                  ? 'text-gold-400'
                  : star === fullStars + 1 && hasHalfStar
                    ? 'text-gold-400/50'
                    : 'text-jerry-green-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
        <span className="text-xs text-parchment-400">({count})</span>
      </div>
    )
  }

  // Reset pagination when filters change (bi-directional - no auto-reset of other filters)
  const handleFamilyChange = (family: string) => {
    setSelectedFamily(family)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleSpiritChange = (spirit: string) => {
    setSelectedSpirit(spirit)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    setVisibleCount(ITEMS_PER_PAGE)
  }

  const handleShowMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }

  // Cocktail families for filter tabs
  const families = [
    { value: 'all', label: 'All Families' },
    { value: 'signature', label: 'Signature' },
    { value: 'sours', label: 'Sours' },
    { value: 'old-fashioneds', label: 'Old Fashioneds' },
    { value: 'highballs', label: 'Highballs' },
    { value: 'mules', label: 'Mules' },
    { value: 'fizzes', label: 'Fizzes' },
    { value: 'collins', label: 'Collins' },
    { value: 'tiki', label: 'Tiki' },
    { value: 'slings', label: 'Slings' },
    { value: 'punches', label: 'Punches' },
    { value: 'cobblers', label: 'Cobblers' },
    { value: 'juleps', label: 'Juleps' },
    { value: 'smashes', label: 'Smashes' },
    { value: 'flips', label: 'Flips' },
    { value: 'toddies', label: 'Toddies' },
    { value: 'swizzles', label: 'Swizzles' },
    { value: 'spritz', label: 'Spritz' },
    { value: 'negronis', label: 'Negronis' },
    { value: 'martinis', label: 'Martinis' },
    { value: 'manhattans', label: 'Manhattans' },
    { value: 'shots-shooters', label: 'Shots & Shooters' },
    { value: 'mocktails', label: 'Mocktails' },
    { value: 'other', label: 'Other' }
  ]

  // Base spirits for filter tabs
  const spirits = [
    { value: 'all', label: 'All Spirits' },
    { value: 'all-rum', label: 'All Rum' },
    { value: 'spiced-rum', label: 'Spiced Rum' },
    { value: 'white-rum', label: 'White Rum' },
    { value: 'aged-rum', label: 'Aged Rum' },
    { value: 'dark-rum', label: 'Dark Rum' },
    { value: 'gin', label: 'Gin' },
    { value: 'vodka', label: 'Vodka' },
    { value: 'bourbon', label: 'Bourbon' },
    { value: 'rye-whiskey', label: 'Rye Whiskey' },
    { value: 'scotch', label: 'Scotch' },
    { value: 'tequila', label: 'Tequila' },
    { value: 'brandy', label: 'Brandy' },
    { value: 'cognac', label: 'Cognac' },
    { value: 'cachaca', label: 'Cachaça' },
    { value: 'sherry', label: 'Sherry' },
    { value: 'vermouth', label: 'Vermouth' },
    { value: 'champagne', label: 'Champagne' },
    { value: 'liqueur', label: 'Liqueur' },
    { value: 'multiple', label: 'Multiple Spirits' },
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
              Our signature cocktail recipes are being crafted. Check back soon for expertly designed drinks and classic recipes.
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
            Each cocktail is carefully crafted to highlight quality spirits and balanced flavours.
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
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-none focus:border-gold-400/40 transition-colors"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Cocktail Family Filter Tabs */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Cocktail Family</h3>
              <div className="flex flex-wrap gap-2">
                {families
                  .filter(family => family.value === 'all' || availableFamilies.has(family.value))
                  .map((family) => (
                  <button
                    key={family.value}
                    onClick={() => handleFamilyChange(family.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      selectedFamily === family.value
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    {family.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Spirit Filter Tabs */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Base Spirit</h3>
              <div className="flex flex-wrap gap-2">
                {spirits
                  .filter(spirit => {
                    if (spirit.value === 'all') return true
                    if (spirit.value === 'all-rum') return hasAnyRum
                    return availableSpirits.has(spirit.value)
                  })
                  .map((spirit) => (
                  <button
                    key={spirit.value}
                    onClick={() => handleSpiritChange(spirit.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      selectedSpirit === spirit.value
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    {spirit.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gold-300 mb-3 uppercase tracking-wider">Difficulty Level</h3>
              <div className="flex flex-wrap gap-2">
                {difficulties
                  .filter(difficulty => difficulty.value === 'all' || availableDifficulties.has(difficulty.value as 'novice' | 'wayfinder' | 'trailblazer'))
                  .map((difficulty) => (
                  <button
                    key={difficulty.value}
                    onClick={() => handleDifficultyChange(difficulty.value)}
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

            {/* Results count and Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-parchment-300 text-sm">
                Showing <span className="text-gold-300 font-semibold">{Math.min(visibleCount, sortedCocktails.length)}</span> of <span className="text-gold-300 font-semibold">{sortedCocktails.length}</span> {sortedCocktails.length === 1 ? 'cocktail' : 'cocktails'}
              </div>

              {/* Sort Options */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-parchment-400">Sort:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSortChange('default')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      sortBy === 'default'
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    A-Z
                  </button>
                  <button
                    onClick={() => handleSortChange('top-rated')}
                    disabled={!ratingsLoaded}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      sortBy === 'top-rated'
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    } ${!ratingsLoaded ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Top Rated
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cocktails */}
      {featuredCocktails.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">★</span>
            Featured Cocktails
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
                      quality={90}
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">★ Featured</span>
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

                  {/* Tags */}
                  {cocktail.tags && cocktail.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cocktail.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-jerry-green-800/60 border border-gold-500/20 text-parchment-300 rounded text-xs"
                        >
                          {tagLabels[tag] || tag}
                        </span>
                      ))}
                      {cocktail.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-parchment-400 text-xs">
                          +{cocktail.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating and variations row */}
                  <div className="flex items-center justify-between">
                    {ratings[cocktail.slug.current] && renderStars(
                      ratings[cocktail.slug.current].average,
                      ratings[cocktail.slug.current].count
                    )}
                    {cocktail.variants && cocktail.variants.length > 0 && (
                      <p className="text-gold-400 text-xs">
                        {cocktail.variants.length + 1} variations
                      </p>
                    )}
                  </div>

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
          {selectedFamily === 'all' && selectedSpirit === 'all'
            ? 'All Cocktails'
            : selectedFamily !== 'all'
              ? families.find(f => f.value === selectedFamily)?.label
              : spirits.find(s => s.value === selectedSpirit)?.label}
        </h2>

        {filteredCocktails.length === 0 ? (
          <div className="text-center py-16 bg-jerry-green-800/20 rounded-xl border border-gold-500/20">
            <p className="text-parchment-400 text-lg">No cocktails match your filters</p>
            <button
              onClick={() => {
                setSelectedFamily('all')
                setSelectedSpirit('all')
                setSelectedDifficulty('all')
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
            {visibleCocktails.map((cocktail) => (
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
                      quality={90}
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

                  {/* Tags */}
                  {cocktail.tags && cocktail.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cocktail.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-jerry-green-800/60 border border-gold-500/20 text-parchment-300 rounded text-xs"
                        >
                          {tagLabels[tag] || tag}
                        </span>
                      ))}
                      {cocktail.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-parchment-400 text-xs">
                          +{cocktail.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Rating and variations row */}
                  <div className="flex items-center justify-between">
                    {ratings[cocktail.slug.current] && renderStars(
                      ratings[cocktail.slug.current].average,
                      ratings[cocktail.slug.current].count
                    )}
                    {cocktail.variants && cocktail.variants.length > 0 && (
                      <p className="text-gold-400 text-xs">
                        {cocktail.variants.length + 1} variations
                      </p>
                    )}
                  </div>

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

        {/* Show More Button */}
        {hasMoreCocktails && sortedCocktails.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 text-gold-300 rounded-xl hover:from-gold-500/30 hover:to-gold-600/30 hover:border-gold-400/60 transition-all duration-300 font-semibold"
            >
              <span>Show More Cocktails</span>
              <span className="text-parchment-400 text-sm">
                ({sortedCocktails.length - visibleCount} remaining)
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
