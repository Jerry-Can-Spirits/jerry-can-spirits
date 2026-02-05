'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BackToTop from '@/components/BackToTop'

interface Guide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  featured: boolean
  isPillar: boolean
  publishedAt: string
  heroImage?: string
}

interface GuidesClientProps {
  guides: Guide[]
}

const categoryLabels: Record<string, string> = {
  'spirits-education': 'Spirits Education',
  'rum-guides': 'Rum Guides',
  'cocktail-techniques': 'Cocktail Techniques',
  'buying-guides': 'Buying Guides',
  'uk-craft-spirits': 'UK Craft Spirits',
  'industry-insights': 'Industry Insights',
  'seasonal-occasions': 'Seasonal & Occasions'
}

const ITEMS_PER_PAGE = 12

export default function GuidesClient({ guides }: GuidesClientProps) {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam || 'all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)

  // Update category when URL param changes
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])

  // Filter guides
  const filteredGuides = guides.filter(guide => {
    const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory
    const matchesSearch = !searchQuery ||
      guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide.excerpt.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // Separate by type
  const pillarGuides = filteredGuides.filter(g => g.isPillar)
  const featuredGuides = filteredGuides.filter(g => g.featured && !g.isPillar)
  const regularGuides = filteredGuides.filter(g => !g.featured && !g.isPillar)

  // Paginated regular guides
  const visibleRegularGuides = regularGuides.slice(0, visibleCount)
  const hasMoreGuides = visibleCount < regularGuides.length

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

  // Get unique categories from guides
  const categories = [
    { value: 'all', label: 'All Guides' },
    ...Object.entries(categoryLabels).map(([value, label]) => ({ value, label }))
  ]

  if (guides.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-parchment-300 mb-8">
              Our spirits guides and educational content are being crafted. Check back soon for expert knowledge on cocktails, rum, and more.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Knowledge Base
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Spirits Guides
            <br />
            <span className="text-gold-300">& Education</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Deepen your understanding of cocktails, spirits, and bartending techniques with our comprehensive guides written by industry experts.
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
                id="guide-search"
                name="guide-search"
                placeholder="Search guides..."
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
              Showing <span className="text-gold-300 font-semibold">{pillarGuides.length + featuredGuides.length + Math.min(visibleCount, regularGuides.length)}</span> of <span className="text-gold-300 font-semibold">{filteredGuides.length}</span> {filteredGuides.length === 1 ? 'guide' : 'guides'}
            </div>
          </div>
        </div>
      </section>

      {/* Pillar Guides */}
      {pillarGuides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Comprehensive Guides
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pillarGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[21/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/80 to-transparent" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">Complete Guide</span>
                    </div>
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded-full text-xs font-semibold">
                      {categoryLabels[guide.category] || guide.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mb-3">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 leading-relaxed mb-4">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 font-semibold">
                    <span>Read Full Guide</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Guides */}
      {featuredGuides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">&#9733;</span>
            Featured Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-105"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[16/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">Featured</span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <span className="px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold">
                    {categoryLabels[guide.category] || guide.category}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mt-3 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold mt-4">
                    <span>Read More</span>
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

      {/* All Guides */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-6">
          {selectedCategory === 'all' ? 'All Guides' : categoryLabels[selectedCategory] || 'Guides'}
        </h2>

        {filteredGuides.length === 0 ? (
          <div className="text-center py-16 bg-jerry-green-800/20 rounded-xl border border-gold-500/20">
            <p className="text-parchment-400 text-lg">No guides match your filters</p>
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
        ) : regularGuides.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRegularGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[16/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <span className="px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold">
                    {categoryLabels[guide.category] || guide.category}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mt-3 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold mt-4">
                    <span>Read More</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {/* Show More Button */}
        {hasMoreGuides && regularGuides.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 text-gold-300 rounded-xl hover:from-gold-500/30 hover:to-gold-600/30 hover:border-gold-400/60 transition-all duration-300 font-semibold"
            >
              <span>Show More Guides</span>
              <span className="text-parchment-400 text-sm">
                ({regularGuides.length - visibleCount} remaining)
              </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </section>

      <BackToTop />
    </main>
  )
}
