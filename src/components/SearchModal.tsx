'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  type: 'product' | 'page' | 'recipe' | 'equipment' | 'ingredient' | 'guide'
  title: string
  description?: string
  url: string
  image?: string
  category?: string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

// Static searchable content
const searchableContent: SearchResult[] = [
  // About section
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey from Royal Signals veterans to rum makers', url: '/about/story/', category: 'About' },
  { type: 'page', title: 'Team', description: 'Meet the Jerry Can Spirits team of British Armed Forces veterans', url: '/about/team/', category: 'About' },
  { type: 'page', title: 'Dan Freeman', description: 'Director & Founder - Royal Corps of Signals veteran with 12 years service', url: '/about/team/dan-freeman/', category: 'Team' },
  { type: 'page', title: 'Rhys Williams', description: 'Co-Founder - Royal Corps of Signals veteran with 5 years service', url: '/about/team/rhys-williams/', category: 'Team' },
  { type: 'page', title: 'Ethos', description: 'Our values, craftsmanship and commitment to quality spirits', url: '/ethos/', category: 'About' },
  { type: 'page', title: 'Sustainability', description: 'Our commitment to sustainable practices and local sourcing', url: '/sustainability/', category: 'About' },
  { type: 'page', title: 'Friends', description: 'Our partners and friends in the spirits industry', url: '/friends/', category: 'About' },
  // Resources
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes, bar equipment guides and ingredient information', url: '/field-manual/', category: 'Resources' },
  { type: 'page', title: 'Guides', description: 'Expert spirits guides and cocktail tutorials', url: '/guides/', category: 'Resources' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails with our recipes', url: '/field-manual/cocktails/', category: 'Field Manual' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware for home bartending', url: '/field-manual/equipment/', category: 'Field Manual' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and cocktail components explained', url: '/field-manual/ingredients/', category: 'Field Manual' },
  // Shop
  { type: 'page', title: 'Shop', description: 'Browse our full range of rum, barware and clothing', url: '/shop/', category: 'Shop' },
  { type: 'page', title: 'Drinks', description: 'Premium veteran-owned British rum collection', url: '/shop/drinks/', category: 'Shop' },
  { type: 'page', title: 'Barware', description: 'Professional bar tools and glassware', url: '/shop/barware/', category: 'Shop' },
  { type: 'page', title: 'Clothing', description: 'Jerry Can Spirits adventure apparel', url: '/shop/clothing/', category: 'Shop' },
  // Support & Contact
  { type: 'page', title: 'Contact', description: 'Get in touch with Jerry Can Spirits', url: '/contact/', category: 'Support' },
  { type: 'page', title: 'Media', description: 'Press enquiries, brand assets and media kit', url: '/contact/media/', category: 'Support' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions about orders, shipping and our rum', url: '/faq/', category: 'Support' },
  // Policies
  { type: 'page', title: 'Privacy Policy', description: 'How we protect and handle your personal data', url: '/privacy-policy/', category: 'Legal' },
  { type: 'page', title: 'Terms of Service', description: 'Terms and conditions for using our website and services', url: '/terms-of-service/', category: 'Legal' },
  { type: 'page', title: 'Cookie Policy', description: 'How we use cookies on our website', url: '/cookie-policy/', category: 'Legal' },
  { type: 'page', title: 'Shipping & Returns', description: 'Delivery information and returns policy', url: '/shipping-returns/', category: 'Legal' },
  { type: 'page', title: 'Security Policy', description: 'How we keep your information secure', url: '/security-policy/', category: 'Legal' },
  { type: 'page', title: 'Accessibility', description: 'Our commitment to website accessibility', url: '/accessibility/', category: 'Legal' },
]

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!isOpen) {
          // Can't call onOpen directly, so we'll need to trigger it from parent
        }
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Search function - searches both static content and API (Shopify + Sanity)
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)

    // Debounce the search
    const timeoutId = setTimeout(async () => {
      const searchQuery = query.toLowerCase()

      // Search static pages
      const staticResults = searchableContent.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchQuery)
        const descMatch = item.description?.toLowerCase().includes(searchQuery)
        const categoryMatch = item.category?.toLowerCase().includes(searchQuery)
        return titleMatch || descMatch || categoryMatch
      })

      // Search API for products and cocktails
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()
        const apiResults = data.results || []

        // Combine results, prioritizing static pages, then products, then guides, then content types
        const combined = [
          ...staticResults,
          ...apiResults.filter((r: SearchResult) => r.type === 'product'),
          ...apiResults.filter((r: SearchResult) => r.type === 'guide'),
          ...apiResults.filter((r: SearchResult) => r.type === 'recipe'),
          ...apiResults.filter((r: SearchResult) => r.type === 'equipment'),
          ...apiResults.filter((r: SearchResult) => r.type === 'ingredient'),
        ]

        setResults(combined.slice(0, 15))
      } catch (error) {
        console.error('Search error:', error)
        // Fallback to just static results if API fails
        setResults(staticResults.slice(0, 12))
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-[10vh]">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-jerry-green-800/95 backdrop-blur-lg border border-gold-500/20 shadow-2xl transition-all">
                {/* Search Input */}
                <div className="relative border-b border-gold-500/20">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-300" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search products, guides, cocktails, equipment..."
                    className="w-full pl-12 pr-12 py-4 bg-transparent text-parchment-50 text-lg placeholder:text-parchment-400 focus:outline-none"
                  />
                  <button
                    onClick={handleClose}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-parchment-300 hover:text-parchment-50 transition-colors"
                    aria-label="Close search"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="p-8 text-center text-parchment-300">
                      Searching...
                    </div>
                  ) : results.length > 0 ? (
                    <div className="p-2">
                      {results.map((result, index) => (
                        <Link
                          key={index}
                          href={result.url}
                          onClick={handleClose}
                          className="flex items-start gap-4 p-4 rounded-lg hover:bg-jerry-green-700/50 transition-colors group"
                        >
                          {result.image && (
                            <div className="flex-shrink-0 w-16 h-16 bg-jerry-green-700 rounded-lg overflow-hidden">
                              <Image
                                src={result.image}
                                alt={result.title}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                                sizes="64px"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {result.category && (
                                <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                                  {result.category}
                                </span>
                              )}
                              <span className="px-2 py-0.5 text-xs rounded-full bg-jerry-green-700/60 text-parchment-300">
                                {result.type}
                              </span>
                            </div>
                            <h3 className="font-semibold text-parchment-50 group-hover:text-gold-300 transition-colors">
                              {result.title}
                            </h3>
                            {result.description && (
                              <p className="text-sm text-parchment-300 line-clamp-1 mt-1">
                                {result.description}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-gold-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : query ? (
                    <div className="p-8 text-center">
                      <MagnifyingGlassIcon className="w-12 h-12 text-gold-300/30 mx-auto mb-4" />
                      <p className="text-parchment-300 mb-2">No results found for "{query}"</p>
                      <p className="text-sm text-parchment-400">
                        Try searching for products, guides, cocktails, or equipment
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MagnifyingGlassIcon className="w-12 h-12 text-gold-300/30 mx-auto mb-4" />
                      <p className="text-parchment-300 mb-2">Start typing to search</p>
                      <p className="text-sm text-parchment-400">
                        Search for products, guides, cocktails, equipment, or pages
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer - Keyboard shortcuts (hidden on mobile) */}
                <div className="hidden md:flex border-t border-gold-500/20 p-3 items-center justify-between text-xs text-parchment-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-jerry-green-700/60 rounded border border-gold-500/20">↵</kbd>
                      to select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-2 py-1 bg-jerry-green-700/60 rounded border border-gold-500/20">ESC</kbd>
                      to close
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <kbd className="px-2 py-1 bg-jerry-green-700/60 rounded border border-gold-500/20">⌘K</kbd>
                    to search
                  </span>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
