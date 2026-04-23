'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Footer() {
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const trackFooterClick = (action: string, item: string) => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'navigation_click', {
        menu_item: item,
        navigation_type: 'footer',
        link_category: action,
      })
    }
  }

  // Footer link sections — grouped for scannability (Miller's Law)
  const quickLinkGroups = [
    {
      label: 'The Brand',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Our Story', href: '/about/story' },
        { name: 'Sustainability', href: '/sustainability' },
        { name: 'Friends & Partners', href: '/friends' },
        { name: 'Where the 5% Goes', href: '/giving/' },
        { name: 'The Expedition Log', href: '/expedition-log/' },
      ]
    },
    {
      label: 'Shop',
      links: [
        { name: 'Shop', href: '/shop' },
        { name: 'Rum Gifts', href: '/shop/rum-gifts' },
        { name: 'Rum Gifts for Him', href: '/shop/gifts-for-him' },
        { name: 'Rum Gifts for Her', href: '/shop/gifts-for-her' },
        { name: 'British Spiced Rum', href: '/shop/spiced-rum' },
        { name: 'Cocktail Making Kits', href: '/shop/cocktail-making-kits' },
        { name: 'Bar Accessories', href: '/shop/bar-accessories' },
        { name: 'Reviews', href: '/reviews' },
        { name: 'Stockists', href: '/stockists' },
        { name: 'Trade', href: '/trade' },
      ]
    },
    {
      label: 'Explore',
      links: [
        { name: 'Field Manual', href: '/field-manual' },
        { name: 'Guides', href: '/guides' },
        { name: 'Ingredients', href: '/ingredients' },
        { name: 'FAQ', href: '/faq' },
      ]
    },
    {
      label: 'Company',
      links: [
        { name: 'Contact', href: '/contact' },
        { name: 'Careers', href: '/careers' },
        { name: 'Site Map', href: '/sitemap' },
      ]
    },
  ]

  const footerSections = {
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Cookie Policy', href: '/cookie-policy' },
      { name: 'Cookie Preferences', href: '/cookie-preferences' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'Shipping & Returns', href: '/shipping-returns' },
      { name: 'Accessibility', href: '/accessibility' },
      { name: 'Security Policy', href: '/security-policy' },
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
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0 bg-repeat"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f5e6b3' fill-opacity='0.08'%3E%3Cpath d='M40 40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm0-40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm-40 40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20zm0-40c0-11 9-20 20-20s20 9 20 20-9 20-20 20-20-9-20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative">
        {/* Main Footer Content */}
        <div className="max-w-none mx-auto px-8 sm:px-12 lg:px-16 xl:px-20 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-8 lg:gap-16 xl:gap-20 items-start max-w-screen-2xl mx-auto">
            
            {/* Column 1 - Quick Links (each group independently collapsible on mobile) */}
            <div className="space-y-4">
              {quickLinkGroups.map((group) => (
                <div key={group.label}>
                  <div className="lg:hidden">
                    <button
                      onClick={() => toggleSection(group.label)}
                      className="flex items-center justify-between w-full text-left font-serif text-base font-bold mb-2 text-parchment-100 border-b border-jerry-green-700 pb-2"
                      style={{ color: '#fefbf5' }}
                      aria-expanded={openSections.includes(group.label)}
                    >
                      {group.label}
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openSections.includes(group.label) ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold uppercase tracking-widest text-parchment-500 mb-2 border-b border-jerry-green-700 pb-2">
                      {group.label}
                    </p>
                  </div>

                  <div className={`space-y-2 ${openSections.includes(group.label) ? 'block' : 'hidden lg:block'}`}>
                    {group.links.map((link) => (
                      <Link
                        key={link.name}
                        href={link.href}
                        className="block text-base text-parchment-200 hover:text-parchment-50 transition-all duration-200 hover:translate-x-1"
                        onClick={() => trackFooterClick(group.label, link.name)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2 - Responsible Drinking */}
            <div className="space-y-6">
              <div>
                <p className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Drink Responsibly
                </p>
                <div className="space-y-4 text-base text-parchment-300">
                  <p>Must be 18+ to purchase alcohol</p>
                  <p>Please drink responsibly</p>
                  <p>Avoid alcohol if pregnant</p>

                  {/* Drinkaware Logo */}
                  <div className="mt-2">
                    <a
                      href="https://www.drinkaware.co.uk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block hover:opacity-80 transition-opacity duration-200"
                      onClick={() => trackFooterClick('Drinkaware Logo', 'Drinkaware Website')}
                      aria-label="Visit Drinkaware for responsible drinking information"
                    >
                      <Image
                          src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/5b2f3381-b097-44fc-0277-d0088f1c3d00/public"
                          alt="Be Drinkaware"
                          width={180}
                          height={72}
                          className="h-16 w-auto object-contain max-w-full"
                          sizes="180px"
                          quality={80}
                          loading="lazy"
                        />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3 - Service Community Support */}
            <div className="space-y-6">
              <div>
                <p className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Service Community
                </p>
                <div className="space-y-3 text-base text-parchment-300">
                  <p>Proud signatories of the Armed Forces Covenant - we stand alongside serving personnel, veterans, their families, and our blue light services.</p>
                  <p>Our commitment is to ensure fairness, respect, and equal opportunity for all who serve, recognising their dedication and the vital role they play in our communities.</p>

                  {/* Badges Grid */}
                  <div className="pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      {/* AFC Logo Badge */}
                      <Link
                        href="/armed-forces-covenant/"
                        className="block bg-white rounded-lg p-3 hover:shadow-lg transition-all duration-200 hover:scale-105"
                        onClick={() => trackFooterClick('AFC Logo', 'Armed Forces Covenant Page')}
                        aria-label="View our Armed Forces Covenant commitment"
                      >
                        <Image
                            src="/images/AFC_POSITIVE_RGB.png"
                            alt="Armed Forces Covenant Supporter"
                            width={150}
                            height={100}
                            className="w-full h-auto"
                            sizes="(max-width: 768px) 150px, 150px"
                            loading="lazy"
                          />
                      </Link>

                      {/* British Veteran Owned Badge - Links to verification page */}
                      <a
                        href="https://www.britishveteranowned.co.uk/business/jerry-can-spirits-ltd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white rounded-lg p-3 hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center"
                        onClick={() => trackFooterClick('British Veteran Owned Badge', 'Verification Page')}
                        aria-label="Verify our British Veteran Owned certification"
                      >
                        <Image
                            src="/images/British-Veteran-Owned-Logo-Standard.png"
                            alt="British Veteran Owned - Verified Business"
                            width={150}
                            height={100}
                            className="w-full h-auto"
                            sizes="(max-width: 768px) 150px, 150px"
                            loading="lazy"
                          />
                      </a>
                    </div>

                    {/* ERS Bronze Award Badge - Full Width */}
                    <Link
                      href="/armed-forces-covenant/"
                      className="block bg-white rounded-lg p-3 hover:shadow-lg transition-all duration-200 hover:scale-105"
                      onClick={() => trackFooterClick('ERS Bronze Badge', 'Armed Forces Covenant Page')}
                      aria-label="Armed Forces Covenant Employer Recognition Scheme Bronze Award"
                    >
                      <Image
                          src="/images/ERS_Bronze_Banner.webp"
                          alt="Defence Employer Recognition Scheme Bronze Award"
                          width={300}
                          height={100}
                          className="w-full h-auto"
                          sizes="(max-width: 768px) 300px, 300px"
                          loading="lazy"
                        />
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
                    alt="Jerry Can Spirits®"
                    width={128}
                    height={192}
                    className="h-48 w-auto opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                    sizes="128px"
                    loading="lazy"
                  />
                </Link>
              </div>

              {/* Mission Statement */}
              <div className="max-w-sm mx-auto">
                <p className="text-parchment-200 text-sm leading-relaxed font-serif text-center">
                  <span className="font-bold text-parchment-100">Jerry Can Spirits®:</span> Engineered for reliability. Crafted for adventure.
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
                <div className="flex justify-center flex-wrap gap-4">
                  <a
                    href="https://www.facebook.com/jerrycanspirits"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
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
                    rel="nofollow noopener noreferrer"
                    className="text-parchment-200 hover:text-jerry-green-400 transition-all duration-200 hover:scale-110"
                    aria-label="Follow us on Instagram"
                    onClick={() => trackFooterClick('Social', 'Instagram')}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  {/* YouTube */}
                  <a
                    href="https://www.youtube.com/@JerryCanSpirits"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-parchment-200 hover:text-jerry-green-400 transition-all duration-200 hover:scale-110"
                    aria-label="Subscribe on YouTube"
                    onClick={() => trackFooterClick('Social', 'YouTube')}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                  {/* LinkedIn */}
                  <a
                    href="https://www.linkedin.com/company/jerry-can-spirits-ltd/"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="text-parchment-200 hover:text-jerry-green-400 transition-all duration-200 hover:scale-110"
                    aria-label="Follow us on LinkedIn"
                    onClick={() => trackFooterClick('Social', 'LinkedIn')}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
                <p className="text-sm text-parchment-400 text-center">
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
                  <p className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                    Legal & Policies
                  </p>
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
                <p className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Secure Payment
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.name}
                      className="bg-parchment-50 rounded-md p-3 flex items-center justify-center hover:bg-parchment-100 transition-colors duration-200 shadow-sm h-14"
                      title={method.name}
                    >
                      <Image
                          src={method.src}
                          alt={method.alt}
                          width={80}
                          height={48}
                          className="object-contain max-h-10 w-auto"
                          sizes="80px"
                          loading="lazy"
                        />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 7 - Contact Us */}
            <div className="space-y-6">
              <div>
                <p className="font-serif text-xl font-bold mb-4 text-parchment-100 border-b border-jerry-green-700 pb-2" style={{ color: '#fefbf5' }}>
                  Contact Us
                </p>
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
                      href="/contact/"
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
              
              {/* Copyright & Company Info */}
              <div className="text-sm text-parchment-400">
                <p>© {new Date().getFullYear()} Jerry Can Spirits® Ltd. All rights reserved.</p>
                <p className="mt-1">Jerry Can Spirits® is a registered trademark (UK00004263767)</p>
                <p className="mt-1">Company No. 16618770 | VAT: GB 499 6389 03 | AWRS: XFAW 000 0012 3072</p>
              </div>

              {/* Additional Info */}
              <div className="text-sm text-parchment-400 text-center md:text-right">
                <p>Proudly British • Shipping Nationwide</p>
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
    </footer>
  )
}