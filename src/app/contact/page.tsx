'use client'

import type { Metadata } from 'next'
import Link from 'next/link'

// Note: metadata export removed as client components cannot export metadata
// This metadata should be moved to a layout.tsx or handled differently

const contactMethods = [
  {
    icon: 'email',
    label: 'Email',
    value: 'hello@jerrycanspirits.co.uk',
    link: 'mailto:hello@jerrycanspirits.co.uk',
    description: 'For general inquiries and customer support',
  },
  {
    icon: 'partnership',
    label: 'Partnerships',
    value: 'partnerships@jerrycanspirits.co.uk',
    link: 'mailto:partnerships@jerrycanspirits.co.uk',
    description: 'For wholesale and business opportunities',
  },
  {
    icon: 'press',
    label: 'Press',
    value: 'press@jerrycanspirits.co.uk',
    link: 'mailto:press@jerrycanspirits.co.uk',
    description: 'For media inquiries and press releases',
  },
]

export default function Contact() {
  const scrollToSignup = () => {
    const signupElement = document.getElementById('newsletter-signup')
    if (signupElement) {
      signupElement.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="min-h-screen">
      {/* Page Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        {/* Header Content */}
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
              For inquiries, partnerships, or just to say hello, we'd love to hear from you.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {contactMethods.map((method) => (
              <div
                key={method.label}
                className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  {method.icon === 'email' && (
                    <svg
                      className="w-8 h-8 text-jerry-green-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="m22 7-10 5L2 7" />
                    </svg>
                  )}
                  {method.icon === 'partnership' && (
                    <svg
                      className="w-8 h-8 text-jerry-green-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  )}
                  {method.icon === 'press' && (
                    <svg
                      className="w-8 h-8 text-jerry-green-900"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8l-6 6v14a2 2 0 0 0 2 2z" />
                      <path d="M14 2v6h6M3 15h18M3 19h18" />
                    </svg>
                  )}
                </div>
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
                  {method.label}
                </h3>
                <a
                  href={method.link}
                  className="inline-block text-gold-300 hover:text-gold-200 font-medium mb-3 transition-colors duration-200 underline decoration-2"
                >
                  {method.value}
                </a>
                <p className="text-parchment-300 text-sm">
                  {method.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-4">Visit Us</h2>
              <div className="space-y-2 text-parchment-200">
                <p className="font-semibold">Jerry Can Spirits Ltd</p>
                <p>United Kingdom</p>
                <p className="text-sm text-parchment-400 italic">Specific address coming soon</p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-4">Follow Us</h2>
              <div className="flex space-x-4 mb-4">
                <a
                  href="https://www.instagram.com/jerrycanspirits"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-jerry-green-700/60 rounded-full flex items-center justify-center text-parchment-200 hover:text-gold-300 hover:bg-jerry-green-600/60 transition-all duration-200 hover:scale-110"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61579347508647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-jerry-green-700/60 rounded-full flex items-center justify-center text-parchment-200 hover:text-gold-300 hover:bg-jerry-green-600/60 transition-all duration-200 hover:scale-110"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
              <p className="text-parchment-400 text-sm">#JerryCanSpirits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Subtle background overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-jerry-green-800/20 to-jerry-green-700/20"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-parchment-50 mb-6">
            Stay Connected
          </h2>
          <p className="text-xl text-parchment-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join our expedition for exclusive updates and early access to new releases
          </p>
          <button
            onClick={scrollToSignup}
            className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2 mx-auto"
          >
            Become an Insider
            <svg 
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </section>
    </main>
  )
}