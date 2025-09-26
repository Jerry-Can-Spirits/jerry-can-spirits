'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDownIcon, MagnifyingGlassIcon, ShoppingCartIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

interface DropdownItem {
  name: string
  href: string
  description?: string
}

interface NavigationItem {
  name: string
  href?: string
  dropdown?: DropdownItem[]
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showHeader, setShowHeader] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [cartCount] = useState(0) // Will connect to Shopify later

  // Navigation structure
  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/' },
    {
      name: 'Shop',
      href: '/shop',
      dropdown: [
        { name: 'Drinks', href: '/shop/drinks', description: 'Premium rum collection' },
        { name: 'Hardware', href: '/shop/hardware', description: 'Expedition gear' },
        { name: 'Clothing', href: '/shop/clothing', description: 'Adventure apparel' },
      ]
    },
    {
      name: 'Field Manual',
      href: '/field-manual',
      dropdown: [
        { name: 'Cocktails', href: '/field-manual/cocktails', description: 'Classic & signature recipes' },
        { name: 'Equipment', href: '/field-manual/equipment', description: 'Bar tools & glassware' },
        { name: 'Ingredients', href: '/field-manual/ingredients', description: 'Quality spirits guide' },
      ]
    },
    {
      name: 'About',
      dropdown: [
        { name: 'Our Story', href: '/about/story', description: 'Brand heritage & mission' },
        { name: 'Ethos', href: '/ethos', description: 'Values & craftsmanship' },
      ]
    },
    {
      name: 'Contact',
      href: '/contact',
      dropdown: [
        { name: 'General Enquiries', href: '/contact/enquiries', description: 'Get in touch' },
        { name: 'Media', href: '/contact/media', description: 'Press & partnerships' },
        { name: 'Complaints', href: '/contact/complaints', description: 'Customer service' },
      ]
    },
  ]

  // Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 20)
      
      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowHeader(false)
      } else {
        setShowHeader(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Analytics tracking functions
  const trackMenuClick = (itemName: string) => {
    // GA4 tracking - will implement later
    console.log('Menu clicked:', itemName)
  }

  const trackCTAClick = (action: string) => {
    // GA4 tracking for lead generation
    console.log('CTA clicked:', action)
  }

  return (
    <>
      {/* Animated Map Texture Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-5">
        <div 
          className="absolute inset-0 bg-repeat opacity-30"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23384724' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'map-scroll 60s linear infinite',
          }}
        />
      </div>

      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-500 ease-in-out ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Glass Effect Background */}
        <div 
          className={`absolute inset-0 transition-all duration-300 ${
            isScrolled 
              ? 'bg-jerry-green-900/80 backdrop-blur-lg shadow-lg' 
              : 'bg-jerry-green-900/60 backdrop-blur-sm'
          }`}
        />
        
        <nav className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20">
          <div className="flex items-center justify-between h-full">
            
            {/* Logo */}
            <div className="flex-shrink-0 z-10">
              <Link 
                href="/" 
                className="flex items-center group"
                onClick={() => trackMenuClick('Logo')}
              >
                <div className="relative">
                  <Image
                    src="/images/Logo.webp"
                    alt="Jerry Can Spirits"
                    width={160}
                    height={60}
                    className="h-12 w-auto transition-transform duration-200 group-hover:scale-105"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <div 
                  key={item.name} 
                  className="relative group"
                  onMouseEnter={() => item.dropdown && setActiveDropdown(item.name)}
                  onMouseLeave={() => item.dropdown && setActiveDropdown(null)}
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className={`flex items-center space-x-1 text-parchment-100 hover:text-parchment-50 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-105 relative ${
                        activeDropdown === item.name ? 'text-parchment-50' : ''
                      }`}
                      onClick={() => trackMenuClick(item.name)}
                    >
                      <span className="relative">
                        {item.name}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-jerry-green-400 transition-all duration-200 group-hover:w-full"></span>
                      </span>
                      {item.dropdown && (
                        <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </Link>
                  ) : (
                    <span
                      className={`flex items-center space-x-1 text-parchment-100 hover:text-parchment-50 px-3 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 cursor-default relative ${
                        activeDropdown === item.name ? 'text-parchment-50' : ''
                      }`}
                    >
                      <span className="relative">
                        {item.name}
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-jerry-green-400 transition-all duration-200 group-hover:w-full"></span>
                      </span>
                      {item.dropdown && (
                        <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
                      )}
                    </span>
                  )}

                  {/* Dropdown Menu */}
                  {item.dropdown && (
                    <div 
                      className={`absolute top-full left-0 pt-2 w-64 transition-all duration-200 ${
                        activeDropdown === item.name 
                          ? 'opacity-100 visible translate-y-0' 
                          : 'opacity-0 invisible -translate-y-2'
                      }`}
                    >
                      <div className="bg-jerry-green-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-jerry-green-600/20 p-2">
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-3 text-parchment-100 hover:text-parchment-50 hover:bg-jerry-green-700/50 rounded-md transition-all duration-200 hover:scale-105"
                            onClick={() => trackMenuClick(`${item.name} > ${subItem.name}`)}
                          >
                            <div className="font-medium">{subItem.name}</div>
                            {subItem.description && (
                              <div className="text-xs text-parchment-300 mt-1">{subItem.description}</div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              
              {/* Search */}
              <div className="relative">
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="text-parchment-100 hover:text-parchment-50 p-2 transition-all duration-200 hover:scale-110"
                  aria-label="Search"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                
                {isSearchOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-jerry-green-800/95 backdrop-blur-lg rounded-lg shadow-2xl border border-jerry-green-600/20 p-4">
                    <input
                      type="search"
                      placeholder="Search products, recipes..."
                      className="w-full px-4 py-2 bg-jerry-green-700 text-parchment-100 rounded-md border border-jerry-green-600 focus:border-jerry-green-400 focus:outline-none"
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative text-parchment-100 hover:text-parchment-50 p-2 transition-all duration-200 hover:scale-110"
                onClick={() => trackCTAClick('Cart')}
              >
                <ShoppingCartIcon className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-jerry-green-400 text-jerry-green-900 text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Social Links */}
              <div className="hidden lg:flex items-center space-x-3">
                <a
                  href="https://www.facebook.com/jerrycanspirits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parchment-100 hover:text-parchment-50 transition-all duration-200 hover:scale-110"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/jerrycanspirits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-parchment-100 hover:text-parchment-50 transition-all duration-200 hover:scale-110"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>

              {/* Primary CTA */}
              <Link
                href="/notify"
                className="hidden sm:block bg-jerry-green-500 hover:bg-jerry-green-400 text-parchment-50 px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                onClick={() => trackCTAClick('Notify Me')}
              >
                Notify Me
              </Link>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-parchment-100 hover:text-parchment-50 p-2 transition-all duration-200"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="w-6 h-6" />
                  ) : (
                    <Bars3Icon className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="bg-jerry-green-800/95 backdrop-blur-lg border-t border-jerry-green-600/20 px-4 py-6 space-y-4">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="block text-parchment-100 hover:text-parchment-50 py-2 text-lg font-medium transition-colors duration-200"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      trackMenuClick(`Mobile > ${item.name}`)
                    }}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="block text-parchment-100 py-2 text-lg font-medium cursor-default">
                    {item.name}
                  </span>
                )}
                {item.dropdown && (
                  <div className="ml-4 space-y-2 mt-2">
                    {item.dropdown.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className="block text-parchment-200 hover:text-parchment-50 py-1 text-sm transition-colors duration-200"
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          trackMenuClick(`Mobile > ${item.name} > ${subItem.name}`)
                        }}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {/* Mobile CTA */}
            <div className="pt-4 border-t border-jerry-green-600/20">
              <Link
                href="/notify"
                className="block w-full bg-jerry-green-500 hover:bg-jerry-green-400 text-parchment-50 text-center px-6 py-3 rounded-full font-semibold uppercase tracking-wide transition-all duration-200"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  trackCTAClick('Mobile Notify Me')
                }}
              >
                Notify Me
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Add CSS animation for map texture */}
      <style jsx>{`
        @keyframes map-scroll {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-60px, -60px); }
        }
      `}</style>
    </>
  )
}