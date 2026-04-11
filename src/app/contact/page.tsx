'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useNewsletterSignup } from '@/hooks/useNewsletterSignup'
import Breadcrumbs from '@/components/Breadcrumbs'

const contactMethods = [
  {
    icon: 'email',
    label: 'General Enquiries',
    value: 'hello@jerrycanspirits.co.uk',
    link: 'mailto:hello@jerrycanspirits.co.uk',
    description: 'Questions about our rum, orders, or anything else.',
    href: '/contact/enquiries/',
  },
  {
    icon: 'partnership',
    label: 'Partnerships',
    value: 'partnerships@jerrycanspirits.co.uk',
    link: 'mailto:partnerships@jerrycanspirits.co.uk',
    description: 'Wholesale, stockist, and business opportunities.',
    href: null,
  },
  {
    icon: 'press',
    label: 'Press & Media',
    value: 'press@jerrycanspirits.co.uk',
    link: 'mailto:press@jerrycanspirits.co.uk',
    description: 'Media enquiries, interviews, and press assets.',
    href: '/contact/media/',
  },
  {
    icon: 'complaints',
    label: 'Complaints',
    value: 'complaints@jerrycanspirits.co.uk',
    link: 'mailto:complaints@jerrycanspirits.co.uk',
    description: 'Something not right? Tell us and we will fix it.',
    href: '/contact/complaints/',
  },
]

export default function Contact() {
  const { hasSignedUp, isLoading } = useNewsletterSignup()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs items={[{ label: 'Contact' }]} />
      </div>

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Get in Touch
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6">
              Contact Us
            </h1>
            <p className="text-xl text-parchment-200 max-w-3xl mx-auto leading-relaxed">
              We are a small team. Use the right channel and we will come back to you.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {contactMethods.map((method) => {
              const CardContent = (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    {method.icon === 'email' && (
                      <svg className="w-8 h-8 text-jerry-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-10 5L2 7" />
                      </svg>
                    )}
                    {method.icon === 'partnership' && (
                      <svg className="w-8 h-8 text-jerry-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    )}
                    {method.icon === 'press' && (
                      <svg className="w-8 h-8 text-jerry-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8l-6 6v14a2 2 0 0 0 2 2z" />
                        <path d="M14 2v6h6M3 15h18M3 19h18" />
                      </svg>
                    )}
                    {method.icon === 'complaints' && (
                      <svg className="w-8 h-8 text-jerry-green-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
                    {method.label}
                  </h3>
                  <a
                    href={method.link}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-block text-gold-300 hover:text-gold-200 font-medium mb-3 transition-colors duration-200 underline decoration-2"
                  >
                    {method.value}
                  </a>
                  <p className="text-parchment-300 text-sm">
                    {method.description}
                  </p>
                  {method.href && (
                    <p className="mt-4 text-gold-300 text-xs font-semibold uppercase tracking-widest group-hover:text-gold-200 transition-colors">
                      Use form →
                    </p>
                  )}
                </>
              )

              return method.href ? (
                <Link
                  key={method.label}
                  href={method.href}
                  className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
                >
                  {CardContent}
                </Link>
              ) : (
                <div
                  key={method.label}
                  className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center"
                >
                  {CardContent}
                </div>
              )
            })}
          </div>

          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
              <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-4">Follow Us</h2>
              <div className="flex justify-center space-x-4">
                <a
                  href="https://www.instagram.com/jerrycanspirits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 sm:w-12 sm:h-12 bg-jerry-green-700/60 rounded-full flex items-center justify-center text-parchment-200 hover:text-gold-300 hover:bg-jerry-green-600/60 transition-all duration-200 hover:scale-110"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/jerrycanspirits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 sm:w-12 sm:h-12 bg-jerry-green-700/60 rounded-full flex items-center justify-center text-parchment-200 hover:text-gold-300 hover:bg-jerry-green-600/60 transition-all duration-200 hover:scale-110"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {mounted && !isLoading && !hasSignedUp && (
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-jerry-green-800/20 to-jerry-green-700/20" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-parchment-50 mb-6">
              Stay Connected
            </h2>
            <p className="text-xl text-parchment-200 mb-8 max-w-2xl mx-auto leading-relaxed">
              Sign up for batch release updates and early access to new releases
            </p>
            <Link
              href="/#newsletter-signup"
              className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 mx-auto w-fit"
            >
              Join the Expedition
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
