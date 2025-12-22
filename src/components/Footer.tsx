'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Footer() {
  const [openSections, setOpenSections] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const trackFooterClick = (action: string, item: string) => {
    // GA4 tracking for footer engagement
    console.log('Footer clicked:', action, item)
  }

  // Footer link sections
  const footerSections = {
    quickLinks: [
      { name: 'Home', href: '/' },
      { name: 'Shop', href: '/shop' },
      { name: 'Field Manual', href: '/field-manual' },
      { name: 'Our Story', href: '/about/story' },
      { name: 'Friends & Partners', href: '/friends' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contact', href: '/contact' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
      { name: 'Cookie Preferences', href: '/cookie-preferences' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Shipping & Returns', href: '/shipping-returns' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'Armed Forces Covenant', href: '/armed-forces-covenant' },
    ]
  }

  // Payment methods supported by Shopify
  const paymentMethods = [
    { 
      name: 'Visa', 
      src: '/images/payment-methods/visa.svg',
      alt: 'Visa',
      className: 'h-15 w-auto' // Perfect size for Visa
    },
    {
      name: 'Mastercard',
      src: '/images/payment-methods/mastercard.svg',
      alt: 'Mastercard',
      className: 'h-15 w-auto' // Perfect size for Mastercard
    },
    {
      name: 'PayPal', 
      src: '/images/payment-methods/paypal.svg',
      alt: 'PayPal',
      className: 'h-15 w-auto' // Perfect size for PayPal
    },
    { 
      name: 'Apple Pay', 
      src: '/images/payment-methods/apple-pay.svg',
      alt: 'Apple Pay',
      className: 'h-15 w-auto' // Perfect size for Apple Pay
    },
    { 
      name: 'Google Pay', 
      src: '/images/payment-methods/googlepay.svg',
      alt: 'Google Pay',
      className: 'h-12 w-auto' // Keep current size for Google Pay - looks good
    },
    { 
      name: 'Shop Pay', 
      src: '/images/payment-methods/shopify.svg',
      alt: 'Shop Pay',
      className: 'h-8 w-auto' // Keep current size for Shopify
    },
  ]

  return (
    <footer className="relative bg-jerry-green-900 text-parchment-100 overflow-hidden">
      {/* Background Pattern - Adventure/Expedition Theme */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5e6b3' fill-opacity='0.08'%3E%3Cpath d='M40 40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm0-40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm-40 40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm0-40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            animation: 'compass-drift 120s linear infinite',
          }}
        />
      </div>

      {/* Glass Effect Background */}
      <div className="absolute inset-0 bg-jerry-green-900/90 backdrop-blur-sm" />

      <div className="relative">
        {/* Main Footer Content */}
        <div className="max-w-none mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-8 lg:gap-16 xl:gap-20 items-start max-w-screen-2xl mx-auto">
            
            {/* Column 1 - Quick Links */}
            <div className="space-y-6">
              <div>
                <div className="lg:hidden">
                  <button
                    onClick={() => toggleSection('quickLinks')}
                    className="flex items-center justify-between w-full text-left font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2"
                    style={{ color: '#fefbf5' }}
                  >
                    Quick Links
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        openSections.includes('quickLinks') ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="hidden lg:block">
                  <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                    Quick Links
                  </h3>
                </div>

                <div className={`space-y-3 ${
                  openSections.includes('quickLinks') || 'hidden lg:block'
                }`}>
                  {footerSections.quickLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block text-base text-parchment-200 hover:text-parchment-50 transition-all duration-200 hover:scale-105 hover:translate-x-1"
                      onClick={() => trackFooterClick('Quick Link', link.name)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 2 - Responsible Drinking */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Drink Responsibly
                </h3>
                <div className="space-y-4 text-base text-parchment-300">
                  <p>Must be 18+ to purchase alcohol</p>
                  <p>Please drink responsibly</p>
                  <p>Avoid alcohol if pregnant</p>

                  {/* Drinkaware Logo */}
                  <div className="-ml-2 -mr-10">
                    <a
                      href="https://www.drinkaware.co.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block hover:opacity-80 transition-opacity duration-200"
                      onClick={() => trackFooterClick('Drinkaware Logo', 'Drinkaware Website')}
                      aria-label="Visit Drinkaware for responsible drinking information"
                    >
                      {isClient ? (
                        <Image
                          src="/images/Drinkaware_BDA_logo_Reversed_RGB.png"
                          alt="Be Drinkaware"
                          width={216}
                          height={86}
                          className="w-auto h-[4.5rem]"
                          quality={100}
                        />
                      ) : (
                        <div className="w-44 h-[4.5rem] bg-parchment-200/20 rounded animate-pulse" />
                      )}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 - Service Community Support */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Service Community
                </h3>
                <div className="space-y-3 text-base text-parchment-300">
                  <p>Proud signatories of the Armed Forces Covenant - we stand alongside serving personnel, veterans, their families, and our blue light services.</p>
                  <p>Our commitment is to ensure fairness, respect, and equal opportunity for all who serve, recognising their dedication and the vital role they play in our communities.</p>

                  {/* AFC Logo Badge */}
                  <div className="pt-4">
                    <Link
                      href="/armed-forces-covenant"
                      className="block bg-white rounded-lg p-3 hover:shadow-lg transition-all duration-200 hover:scale-105"
                      onClick={() => trackFooterClick('AFC Logo', 'Armed Forces Covenant Page')}
                      aria-label="View our Armed Forces Covenant commitment"
                    >
                      {isClient ? (
                        <Image
                          src="/images/AFC_POSITIVE_RGB.png"
                          alt="Armed Forces Covenant Supporter"
                          width={150}
                          height={100}
                          className="w-full h-auto"
                        />
                      ) : (
                        <div className="w-full h-20 bg-parchment-200 rounded animate-pulse" />
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 4 - Logo & Social */}
            <div className="text-center space-y-1">
              {/* Logo */}
              <div className="flex justify-center">
                <Link
                  href="/"
                  className="block group transition-transform duration-300 hover:scale-105"
                  onClick={() => trackFooterClick('Logo', 'Home')}
                >
                  <Image
                    src="/images/logo-etch.webp"
                    alt="Jerry Can Spirits® - Premium British Rum"
                    width={300}
                    height={420}
                    className="h-48 w-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    priority
                  />
                </Link>
              </div>

              {/* Mission Statement */}
              <div className="max-w-sm mx-auto">
                <p className="text-parchment-200 text-sm leading-relaxed font-serif text-center">
                  <span className="font-bold text-parchment-100">Jerry Can Spirits®:</span> Premium British rum. Engineered for reliability. Crafted for adventure.
                </p>
                <p className="text-parchment-200 text-sm leading-relaxed italic font-serif text-center mt-2">
                  Your essential provision for the journey ahead.
                </p>
                <p className="text-parchment-300 text-sm leading-relaxed font-serif text-center mt-3">
                  Follow our journey and check out more at
                </p>
              </div>

              {/* Social Media */}
              <div className="space-y-3">
                <div className="flex justify-center space-x-6">
                  <a
                    href="https://www.facebook.com/jerrycanspirits"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-parchment-200 hover:text-jerry-green-400 transition-all duration-200 hover:scale-110"
                    aria-label="Follow us on Facebook"
                    onClick={() => trackFooterClick('Social', 'Facebook')}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/jerrycanspirits"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-parchment-200 hover:text-jerry-green-400 transition-all duration-200 hover:scale-110"
                    aria-label="Follow us on Instagram"
                    onClick={() => trackFooterClick('Social', 'Instagram')}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-sm text-parchment-400">
                  #JerryCanSpirits
                </p>
              </div>
            </div>

            {/* Column 5 - Legal & Policies */}
            <div className="space-y-6">
              <div>
                <div className="lg:hidden">
                  <button
                    onClick={() => toggleSection('legal')}
                    className="flex items-center justify-between w-full text-left font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2"
                    style={{ color: '#fefbf5' }}
                  >
                    Legal & Policies
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform duration-200 ${
                        openSections.includes('legal') ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                <div className="hidden lg:block">
                  <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                    Legal & Policies
                  </h3>
                </div>

                <div className={`space-y-3 ${
                  openSections.includes('legal') || 'hidden lg:block'
                }`}>
                  {footerSections.legal.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="block text-base text-parchment-200 hover:text-parchment-50 transition-all duration-200 hover:scale-105 hover:translate-x-1"
                      onClick={() => trackFooterClick('Legal Link', link.name)}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 6 - Secure Payment */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Secure Payment
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.name}
                      className="bg-parchment-50 rounded-md p-3 flex items-center justify-center hover:bg-parchment-100 transition-colors duration-200 shadow-sm h-14"
                      title={method.name}
                    >
                      {isClient ? (
                        <Image
                          src={method.src}
                          alt={method.alt}
                          width={80}
                          height={48}
                          className="object-contain max-h-10 w-auto"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-parchment-200 rounded animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Security Badges */}
                <div className="space-y-2 text-sm text-parchment-400">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">🔒</span>
                    <span>SSL Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400">🛡️</span>
                    <span>GDPR Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-400">⭐</span>
                    <span>Shopify Secure</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 7 - Contact Us */}
            <div className="space-y-6">
              <div>
                <h3 className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Contact Us
                </h3>
                <div className="space-y-3 text-base text-parchment-300">
                  <div>
                    <p className="text-gold-300 font-semibold mb-1">General Enquiries</p>
                    <a
                      href="mailto:hello@jerrycanspirits.co.uk"
                      className="text-jerry-green-400 hover:text-jerry-green-300 underline transition-colors duration-200"
                      onClick={() => trackFooterClick('Contact', 'Email')}
                    >
                      hello@jerrycanspirits.co.uk
                    </a>
                  </div>
                  <div>
                    <p className="text-gold-300 font-semibold mb-1">More Contact Options</p>
                    <Link
                      href="/contact"
                      className="text-jerry-green-400 hover:text-jerry-green-300 underline transition-colors duration-200"
                      onClick={() => trackFooterClick('Contact', 'Contact Page')}
                    >
                      Press, Partnerships & More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-jerry-green-700 bg-jerry-green-950/50">
          <div className="max-w-none mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-6">
            <div className="max-w-screen-2xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              
              {/* Copyright */}
              <div className="text-sm text-parchment-400">
                <p>© {isClient ? new Date().getFullYear() : '2024'} Jerry Can Spirits® Ltd. All rights reserved.</p>
                <p className="mt-1">Jerry Can Spirits® is a registered trademark (UK00004263767)</p>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-parchment-400 text-center md:text-right">
                <p>🇬🇧 Proudly British • 🌍 Shipping Nationwide</p>
                <p className="mt-1">
                  <a
                    href="mailto:hello@jerrycanspirits.co.uk"
                    className="text-jerry-green-400 hover:text-jerry-green-300 transition-colors duration-200"
                    onClick={() => trackFooterClick('Contact', 'Email')}
                  >
                    hello@jerrycanspirits.co.uk
                  </a>
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation for Background Pattern */}
      <style jsx>{`
        @keyframes compass-drift {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-80px, -80px) rotate(360deg); }
        }
      `}</style>
    </footer>
  )
}