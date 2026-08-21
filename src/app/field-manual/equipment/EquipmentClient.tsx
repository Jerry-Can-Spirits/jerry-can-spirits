'use client'

import { useState, useEffect } from 'react'
import { EQUIPMENT_CATEGORY_ORDER, EQUIPMENT_CATEGORY_TITLES, categoryTitle } from '@/lib/category-order'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import BackToTop from '@/components/BackToTop'

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
    details?: string
  }
  tips: string[]
  image?: string
  imageAlt?: string
  featured: boolean
  careInstructions?: string[] | string
  lifespan?: string[] | string
}

interface EquipmentClientProps {
  equipment: Equipment[]
}

// Pagination settings
const ITEMS_PER_PAGE = 16

export default function EquipmentClient({ equipment }: EquipmentClientProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Defaults here, URL-seeded after mount: useSearchParams() bailed this
  // subtree out of server rendering, hiding the grid from raw HTML.
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [visibleCount, setVisibleCount] = useState<number>(ITEMS_PER_PAGE)

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const category = sp.get('category')
    const q = sp.get('q')
    if (category) setSelectedCategory(category)
    if (q) setSearchQuery(q)
  }, [])

  const updateURL = (category: string, q: string) => {
    const sp = new URLSearchParams()
    if (category !== 'all') sp.set('category', category)
    if (q) sp.set('q', q)
    const qs = sp.toString()
    router.replace(pathname + (qs ? `?${qs}` : ''), { scroll: false })
  }

  // Filter equipment
  const filteredEquipment = equipment.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesCategory && matchesSearch
  })

  // The Essential Equipment section shows the first-home-bar set; the grid
  // below shows everything else so nothing appears twice on the page.
  const essentialEquipment = filteredEquipment.filter(e => e.essential)
  const remainingEquipment = filteredEquipment.filter(e => !e.essential)

  // Paginated equipment for display
  const visibleEquipment = remainingEquipment.slice(0, visibleCount)
  const hasMoreEquipment = visibleCount < remainingEquipment.length

  // Totals per category across the whole filtered set, so a heading reports
  // the size of its group rather than of the slice currently rendered.
  const categoryTotals = remainingEquipment.reduce<Map<string, number>>((m, i) => m.set(i.category, (m.get(i.category) ?? 0) + 1), new Map())

  // Already sorted by category rank then name in GROQ, so grouping is a scan.
  // A reader and a crawler see the same order because the server decided it.
  const groups = visibleEquipment.reduce<Array<{ category: string; items: typeof visibleEquipment }>>(
    (acc, item) => {
      const last = acc[acc.length - 1]
      if (last && last.category === item.category) last.items.push(item)
      else acc.push({ category: item.category, items: [item] })
      return acc
    },
    []
  )

  // Reset pagination when filters change
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setVisibleCount(ITEMS_PER_PAGE)
    updateURL(category, searchQuery)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setVisibleCount(ITEMS_PER_PAGE)
    updateURL(selectedCategory, query)
  }

  const handleShowMore = () => {
    setVisibleCount(prev => prev + ITEMS_PER_PAGE)
  }

  // From the same list as the headings and the sort, in the same order, so a
  // tab cannot outlive the category it filters to.
  const categories = [
    { value: 'all', label: 'All Equipment' },
    ...EQUIPMENT_CATEGORY_ORDER.map((value) => ({ value, label: categoryTitle(EQUIPMENT_CATEGORY_TITLES, value) })),
  ]

  if (equipment.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-parchment-300 mb-8">
              Our equipment guides are on the way. Check back soon for bar tools, glassware and how to use them.
            </p>
            <Link
              href="/field-manual/"
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
    <main className="min-h-screen pb-20">
      {/* Filters Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <label htmlFor="equipment-search" className="sr-only">Search equipment</label>
              <input
                type="text"
                id="equipment-search"
                name="equipment-search"
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-jerry-green-800/40 border border-gold-500/20 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400/40 transition-colors"
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
              Showing <span className="text-gold-300 font-semibold">{Math.min(essentialEquipment.length + visibleCount, filteredEquipment.length)}</span> of <span className="text-gold-300 font-semibold">{filteredEquipment.length}</span> {filteredEquipment.length === 1 ? 'item' : 'items'}
            </div>
          </div>
        </div>
      </section>

      {/* Essential Equipment — the first-home-bar set */}
      {essentialEquipment.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">★</span>
            Essential Equipment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {essentialEquipment.map((item) => (
              <Link
                key={item._id}
                href={`/field-manual/equipment/${item.slug.current}/`}
                className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                {/* Image */}
                {item.image && (
                  <div className="relative aspect-4/3 bg-jerry-green-800/20">
                    <Image
                      src={item.image}
                      alt={item.imageAlt || item.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {item.essential && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                        <span className="text-jerry-green-900 text-xs font-bold">★ Essential</span>
                      </div>
                    )}
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

      {/* All Equipment Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-6">
          {selectedCategory === 'all'
            ? (essentialEquipment.length > 0 ? 'The Rest of the Kit' : 'All Equipment')
            : categories.find(c => c.value === selectedCategory)?.label}
        </h2>

        {remainingEquipment.length === 0 ? (
          <div className="text-center py-16 bg-jerry-green-800/20 rounded-xl border border-gold-500/20">
            <p className="text-parchment-400 text-lg">No equipment matches your filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
                setVisibleCount(ITEMS_PER_PAGE)
                updateURL('all', '')
              }}
              className="mt-4 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {groups.map((group) => (
              <section key={group.category} aria-labelledby={`category-${group.category}`}>
                {/* The heading is what makes the grouping legible. Without it
                    the page was ordered by category and looked unordered. */}
                <h2
                  id={`category-${group.category}`}
                  className="text-2xl font-serif font-bold text-gold-300 mb-6 pb-3 border-b border-gold-500/20"
                >
                  {categoryTitle(EQUIPMENT_CATEGORY_TITLES, group.category)}
                  <span className="ml-3 text-sm font-sans font-normal text-parchment-400">{categoryTotals.get(group.category) ?? group.items.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {group.items.map((item) => (
              <Link
                key={item._id}
                href={`/field-manual/equipment/${item.slug.current}/`}
                className="group bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                {/* Image */}
                {item.image && (
                  <div className="relative aspect-4/3 bg-jerry-green-800/20">
                    <Image
                      src={item.image}
                      alt={item.imageAlt || item.name}
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
                      {item.name}
                    </h3>
                    {item.essential && (
                      <span className="px-2 py-1 rounded-full border border-gold-400/40 bg-gold-400/10 text-gold-400 text-xs font-semibold whitespace-nowrap">
                        Essential
                      </span>
                    )}
                  </div>

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
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMoreEquipment && remainingEquipment.length > 0 && (
          <div className="mt-10 text-center">
            <button
              onClick={handleShowMore}
              className="inline-flex items-center gap-2 px-8 py-4 bg-linear-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/40 text-gold-300 rounded-xl hover:from-gold-500/30 hover:to-gold-600/30 hover:border-gold-400/60 transition-all duration-300 font-semibold"
            >
              <span>Show More Equipment</span>
              <span className="text-parchment-400 text-sm">
                ({remainingEquipment.length - visibleCount} remaining)
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
