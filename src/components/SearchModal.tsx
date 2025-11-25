'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Image from 'next/image'

interface SearchResult {
  type: 'product' | 'page' | 'recipe'
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
  // Pages
  { type: 'page', title: 'Our Story', description: 'Learn about Jerry Can Spirits journey', url: '/about/story', category: 'About' },
  { type: 'page', title: 'Ethos', description: 'Our values and craftsmanship', url: '/ethos', category: 'About' },
  { type: 'page', title: 'Field Manual', description: 'Cocktail recipes and guides', url: '/field-manual', category: 'Resources' },
  { type: 'page', title: 'Cocktails', description: 'Master classic rum cocktails', url: '/field-manual/cocktails', category: 'Field Manual' },
  { type: 'page', title: 'Equipment', description: 'Essential bar tools and glassware', url: '/field-manual/equipment', category: 'Field Manual' },
  { type: 'page', title: 'Ingredients', description: 'Premium spirits and components', url: '/field-manual/ingredients', category: 'Field Manual' },
  { type: 'page', title: 'Contact', description: 'Get in touch with us', url: '/contact', category: 'Support' },
  { type: 'page', title: 'FAQ', description: 'Frequently asked questions', url: '/faq', category: 'Support' },
  { type: 'page', title: 'Drinks', description: 'Premium rum collection', url: '/shop/drinks', category: 'Shop' },
  { type: 'page', title: 'Barware', description: 'Bar tools and equipment', url: '/shop/barware', category: 'Shop' },
  { type: 'page', title: 'Clothing', description: 'Adventure apparel', url: '/shop/clothing', category: 'Shop' },
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

  // Search function
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)

    // Simulate async search with debounce
    const timeoutId = setTimeout(() => {
      const searchQuery = query.toLowerCase()
      const filtered = searchableContent.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchQuery)
        const descMatch = item.description?.toLowerCase().includes(searchQuery)
        const categoryMatch = item.category?.toLowerCase().includes(searchQuery)
        return titleMatch || descMatch || categoryMatch
      })

      setResults(filtered.slice(0, 8)) // Limit to 8 results
      setIsLoading(false)
    }, 200)

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
                    placeholder="Search products, pages, recipes..."
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
                        Try searching for products, recipes, or pages
                      </p>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <MagnifyingGlassIcon className="w-12 h-12 text-gold-300/30 mx-auto mb-4" />
                      <p className="text-parchment-300 mb-2">Start typing to search</p>
                      <p className="text-sm text-parchment-400">
                        Search for products, cocktail recipes, or pages
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-gold-500/20 p-3 flex items-center justify-between text-xs text-parchment-400">
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
