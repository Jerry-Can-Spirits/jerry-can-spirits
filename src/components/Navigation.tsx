'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Field Manual', href: '/field-manual' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <nav className="bg-jerry-green-900 shadow-lg border-b border-jerry-green-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-jerry-green-400 rounded-sm flex items-center justify-center">
                <span className="text-jerry-green-900 font-bold text-lg">JC</span>
              </div>
              <div className="ml-3 text-parchment-100">
                <div className="font-serif text-xl font-bold tracking-tight">Jerry Can</div>
                <div className="text-xs uppercase tracking-widest text-jerry-green-300 -mt-1">Spirits</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-jerry-green-100 hover:text-jerry-green-300 px-3 py-2 text-sm font-medium uppercase tracking-wide transition-colors duration-200 hover:bg-jerry-green-800 rounded-md"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* CTA Button - Desktop */}
          <div className="hidden md:block">
            <Link
              href="/shop"
              className="bg-jerry-green-500 hover:bg-jerry-green-400 text-parchment-50 px-6 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              Shop Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-jerry-green-100 hover:text-jerry-green-300 p-2 rounded-md transition-colors duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-jerry-green-800 border-t border-jerry-green-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-jerry-green-100 hover:text-jerry-green-300 block px-3 py-2 text-base font-medium uppercase tracking-wide transition-colors duration-200 hover:bg-jerry-green-700 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="px-3 py-2">
              <Link
                href="/shop"
                className="bg-jerry-green-500 hover:bg-jerry-green-400 text-parchment-50 block w-full text-center px-6 py-2 rounded-md text-sm font-semibold uppercase tracking-wide transition-all duration-200"
                onClick={() => setIsOpen(false)}
              >
                Shop Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}