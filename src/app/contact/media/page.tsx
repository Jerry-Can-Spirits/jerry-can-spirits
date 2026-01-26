'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ColorSwatch, DownloadCard, BoilerplateText, ImageGallery } from '@/components/media'

export default function MediaContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organisation: '',
    subject: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: `Organisation: ${formData.organisation}\n\n${formData.message}`,
          formType: 'media'
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          organisation: '',
          subject: '',
          message: ''
        })
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Brand color palettes
  const jerryGreenColors = [
    { name: 'Jerry Green 900', hex: '#1a442e' },
    { name: 'Jerry Green 800', hex: '#1f5438' },
    { name: 'Jerry Green 700', hex: '#246642' },
  ]

  const goldColors = [
    { name: 'Gold 500', hex: '#f59e0b' },
    { name: 'Gold 400', hex: '#fbbf24' },
    { name: 'Gold 300', hex: '#fcd34d' },
  ]

  const parchmentColors = [
    { name: 'Parchment 50', hex: '#fefbf5' },
    { name: 'Parchment 100', hex: '#f9f4e8' },
    { name: 'Parchment 200', hex: '#f0e5ce' },
  ]

  // Press contacts
  const pressContacts = [
    {
      title: 'Press & Media Enquiries',
      email: 'press@jerrycanspirits.co.uk',
      description: 'For journalists, bloggers, and media professionals'
    },
    {
      title: 'Partnership Opportunities',
      email: 'partnerships@jerrycanspirits.co.uk',
      description: 'For collaboration and partnership discussions'
    }
  ]

  // Key facts
  const keyFacts = [
    { label: 'Founded', value: '2025' },
    { label: 'Location', value: 'United Kingdom' },
    { label: 'Trademark', value: 'UK00004263767' },
    { label: 'Company Number', value: '1661877' },
    { label: 'Product', value: 'Expedition Spiced Rum' },
    { label: 'Heritage', value: 'Royal Corps of Signals' },
  ]

  // Boilerplate text options
  const boilerplateShort = `Jerry Can Spirits® is a British veteran-owned spirits company specialising in premium craft rum built for adventure. Founded by Royal Corps of Signals veterans, we bring a bit of military precision to what we do – and our spirits are all the better for it.`

  const boilerplateMedium = `Jerry Can Spirits® is a British veteran-owned spirits company specialising in premium craft rum built for adventure. Founded by lads from the Royal Corps of Signals who spent years in some of the harshest environments imaginable, we bring military precision to everything we do. Our name comes from the classic jerry can – a rather brilliant bit of kit first designed in 1937 and still NATO standard today. Like the jerry can, our spirits are built for the job in hand, not just looking fancy. We focus on the important stuff: getting it right every time.`

  const boilerplateFull = `Jerry Can Spirits® is a British veteran-owned spirits company specialising in what we think is the best damn premium craft rum around – spirits that really can keep up with the demands of adventure. Founded by lads from the Royal Corps of Signals who spent years in some of the harshest environments imaginable, we bring a bit of that military precision to what we do – and our spirits are all the better for it.

Our name comes from the classic jerry can – a rather brilliant bit of kit first designed in 1937 and still NATO standard today – and that's exactly what we aim to build our spirits to be: built for the job in hand and not just looking fancy. When it comes to making rum, we don't mess around. We focus on the important stuff – like getting it right every time, rather than chasing what's currently in vogue.

Based in the UK, Jerry Can Spirits® is on a mission to make premium spirits for everyone, in whatever context. Whether you're trekking across continents or just trying to get through Monday, our rum packs a punch, delivers solid quality, and has the kind of character you can actually rely on. So whether you're a seasoned explorer or not, you can depend on our rum to deliver.`

  return (
    <main className="min-h-screen">
      {/* Page Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Media & Press
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6">
              Media Centre
            </h1>
            <p className="text-xl text-parchment-200 max-w-3xl mx-auto leading-relaxed">
              Brand assets, company information, and resources for journalists, content creators, and media professionals covering Jerry Can Spirits®.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <a href="#brand-assets" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Brand Assets</a>
            <a href="#company-info" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Company Info</a>
            <a href="#press-contacts" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Press Contacts</a>
            <a href="#inquiry-form" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Media Inquiry</a>
          </div>

          {/* ==================== BRAND ASSETS SECTION ==================== */}
          <section id="brand-assets" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Brand Assets
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Download official logos, view our brand colors, and explore our typography. Please follow our brand guidelines when using these assets.
            </p>

            {/* Logo Downloads */}
            <div className="mb-16">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Logo Downloads
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DownloadCard
                  title="Primary Logo"
                  description="Main brand logo for light/neutral backgrounds"
                  previewImage="/images/Logo.webp"
                  previewAlt="Jerry Can Spirits® Primary Logo"
                  darkBackground={true}
                  formats={[
                    { label: 'PNG', url: '/media-kit/logos/Jerry%20Can%20Spirits%20Logo.png' },
                    { label: 'WebP', url: '/images/Logo.webp' },
                  ]}
                />
                <DownloadCard
                  title="Footer/Etched Logo"
                  description="Etched variant for dark backgrounds"
                  previewImage="/images/logo-etch.webp"
                  previewAlt="Jerry Can Spirits® Etched Logo"
                  darkBackground={true}
                  formats={[
                    { label: 'WebP', url: '/images/logo-etch.webp' },
                  ]}
                />
                <DownloadCard
                  title="British Veteran Owned (Standard)"
                  description="Certification badge - standard colors"
                  previewImage="/images/British-Veteran-Owned-Logo-Standard.png"
                  previewAlt="British Veteran Owned Logo"
                  darkBackground={false}
                  formats={[
                    { label: 'PNG', url: '/images/British-Veteran-Owned-Logo-Standard.png' },
                  ]}
                />
                <DownloadCard
                  title="British Veteran Owned (White)"
                  description="Certification badge - white variant"
                  previewImage="/images/British-Veteran-Owned-Logo-White.png"
                  previewAlt="British Veteran Owned Logo White"
                  darkBackground={true}
                  formats={[
                    { label: 'PNG', url: '/images/British-Veteran-Owned-Logo-White.png' },
                  ]}
                />
                <DownloadCard
                  title="British Veteran Owned (Black)"
                  description="Certification badge - black variant"
                  previewImage="/images/British-Veteran-Owned-Logo-Black.png"
                  previewAlt="British Veteran Owned Logo Black"
                  darkBackground={false}
                  formats={[
                    { label: 'PNG', url: '/images/British-Veteran-Owned-Logo-Black.png' },
                  ]}
                />
              </div>
              <p className="text-parchment-400 text-sm mt-4 text-center">
                Need additional formats (SVG, PNG, EPS)? Contact <a href="mailto:press@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">press@jerrycanspirits.co.uk</a>
              </p>
            </div>

            {/* Color Palette */}
            <div className="mb-16">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Colour Palette
              </h3>
              <p className="text-parchment-300 text-sm mb-6">Click any colour to copy its hex code to clipboard.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Jerry Green */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-parchment-50 font-semibold mb-4">Jerry Green (Primary)</h4>
                  <div className="flex justify-around">
                    {jerryGreenColors.map((color) => (
                      <ColorSwatch key={color.hex} name={color.name} hex={color.hex} />
                    ))}
                  </div>
                </div>

                {/* Gold */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-parchment-50 font-semibold mb-4">Gold (Accent)</h4>
                  <div className="flex justify-around">
                    {goldColors.map((color) => (
                      <ColorSwatch key={color.hex} name={color.name} hex={color.hex} />
                    ))}
                  </div>
                </div>

                {/* Parchment */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-parchment-50 font-semibold mb-4">Parchment (Text)</h4>
                  <div className="flex justify-around">
                    {parchmentColors.map((color) => (
                      <ColorSwatch key={color.hex} name={color.name} hex={color.hex} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="mb-16">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Typography
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-3">Headings</h4>
                  <p className="text-3xl font-serif text-parchment-50 mb-2">Playfair Display</p>
                  <p className="text-parchment-300 text-sm mb-4">Used for all headings and display text</p>
                  <div className="border-t border-gold-500/20 pt-4">
                    <p className="text-2xl font-serif text-parchment-100">Engineered for Adventure</p>
                    <p className="text-xl font-serif text-parchment-200 mt-1">Premium British Craft Rum</p>
                  </div>
                </div>

                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-3">Body Text</h4>
                  <p className="text-3xl text-parchment-50 mb-2">Inter</p>
                  <p className="text-parchment-300 text-sm mb-4">Used for body copy and UI elements</p>
                  <div className="border-t border-gold-500/20 pt-4">
                    <p className="text-parchment-100">The quick brown fox jumps over the lazy dog. Built for reliability and function over form.</p>
                    <p className="text-parchment-300 text-sm mt-2">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
                    <p className="text-parchment-300 text-sm">0123456789</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PRODUCT IMAGES SECTION ==================== */}
          <section id="product-images" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Product Images
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              High-resolution product photography for press use.
            </p>
            <ImageGallery images={[]} placeholder={true} />
          </section>

          {/* ==================== COMPANY INFORMATION SECTION ==================== */}
          <section id="company-info" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Company Information
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Ready-to-use company descriptions and key facts for your coverage.
            </p>

            {/* Boilerplate Text */}
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Company Boilerplate
              </h3>
              <div className="space-y-6">
                <BoilerplateText title="Short Bio" wordCount={35} text={boilerplateShort} />
                <BoilerplateText title="Medium Bio" wordCount={75} text={boilerplateMedium} />
                <BoilerplateText title="Full Description" wordCount={175} text={boilerplateFull} />
              </div>
            </div>

            {/* Founder Section */}
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Founder
              </h3>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <div className="relative w-40 h-40 mx-auto md:mx-0 rounded-xl overflow-hidden border-2 border-gold-500/30">
                      <Image
                        src="/images/team/Dan_Headshot.jpg"
                        alt="Dan Freeman - Founder, Jerry Can Spirits®"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <a
                      href="/images/team/Dan_Headshot.jpg"
                      download="Dan_Freeman_Headshot.jpg"
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-xs font-semibold rounded transition-all duration-200 w-full justify-center"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Headshot
                    </a>
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-2xl font-serif font-bold text-parchment-50 mb-1">Dan Freeman</h4>
                    <p className="text-gold-300 font-medium mb-4">Founder & Director</p>
                    <div className="space-y-3 text-parchment-200 text-sm leading-relaxed">
                      <p>
                        Dan Freeman is the founder of Jerry Can Spirits®, a premium British rum brand with a strong military heritage. Dan is a veteran of the Royal Corps of Signals, and after his time in service he moved on to civilian life with an idea brewing.
                      </p>
                      <p>
                        Drawing on those experiences, Dan set up Jerry Can Spirits® with a simple goal: make rum for the adventurous sort – no-nonsense spirits that deliver quality and taste without making any concessions. The company name is a nod to the famous jerry can – an absolute piece of kit design that shows just the kind of practical, don&apos;t-bother-with-the-frills ethos that Jerry Can Spirits® is all about.
                      </p>
                      <p>
                        Based here in the UK, Dan is at the helm using the same level of dedication and focus he had when he was serving – real proof that with a small, tight team who are really passionate about what they do and with a real commitment to quality, anything&apos;s possible.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Facts */}
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Key Facts
              </h3>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {keyFacts.map((fact) => (
                    <div key={fact.label}>
                      <p className="text-parchment-400 text-xs uppercase tracking-wider mb-1">{fact.label}</p>
                      <p className="text-parchment-50 font-semibold">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Brand Guidelines PDF */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-20 h-20 bg-gold-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="flex-grow text-center md:text-left">
                  <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">Brand Guidelines</h3>
                  <p className="text-parchment-300 text-sm mb-4">
                    Complete brand guidelines including logo usage, trademark requirements, colour specifications, and typography standards.
                  </p>
                  <a
                    href="mailto:press@jerrycanspirits.co.uk?subject=Brand Guidelines PDF Request"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Request PDF
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PRESS CONTACTS SECTION ==================== */}
          <section id="press-contacts" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-12">
              Press Contacts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pressContacts.map((contact) => (
                <div
                  key={contact.title}
                  className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center hover:border-gold-400/40 transition-all duration-300"
                >
                  <h3 className="text-2xl font-serif font-bold text-parchment-50 mb-4">
                    {contact.title}
                  </h3>
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-block text-gold-300 hover:text-gold-200 font-medium text-lg mb-3 transition-colors duration-200 underline decoration-2"
                  >
                    {contact.email}
                  </a>
                  <p className="text-parchment-300">
                    {contact.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ==================== LATEST NEWS SECTION ==================== */}
          <section className="mb-20">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
                Latest News & Press Releases
              </h2>
              <div className="text-center">
                <div className="bg-jerry-green-700/40 rounded-lg p-6 border border-gold-500/20">
                  <p className="text-parchment-200 mb-4">
                    Jerry Can Spirits® is currently in pre-launch phase. Stay tuned for upcoming announcements, product launches, and company news.
                  </p>
                  <p className="text-parchment-300 text-sm">
                    Media professionals can subscribe to our press updates by contacting{' '}
                    <a
                      href="mailto:press@jerrycanspirits.co.uk?subject=Press Updates Subscription"
                      className="text-gold-300 hover:text-gold-200 underline transition-colors duration-200"
                    >
                      press@jerrycanspirits.co.uk
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== MEDIA INQUIRY FORM ==================== */}
          <section id="inquiry-form" className="mb-16 scroll-mt-24">
            <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
              Media Inquiry Form
            </h2>
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-parchment-200 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-parchment-200 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="organisation" className="block text-sm font-medium text-parchment-200 mb-2">
                      Organisation
                    </label>
                    <input
                      type="text"
                      id="organisation"
                      name="organisation"
                      value={formData.organisation}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                      placeholder="Publication, blog, or company"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-parchment-200 mb-2">
                      Inquiry Type *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                    >
                      <option value="">Select inquiry type</option>
                      <option value="Press Release">Press Release Request</option>
                      <option value="Interview Request">Interview Request</option>
                      <option value="Product Information">Product Information</option>
                      <option value="Media Kit">Media Kit Request</option>
                      <option value="Partnership Opportunity">Partnership Opportunity</option>
                      <option value="Event Coverage">Event Coverage</option>
                      <option value="Other">Other Media Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-parchment-200 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200 resize-vertical"
                    placeholder="Please provide details about your media inquiry, including deadline requirements, publication details, and specific information needed..."
                  />
                </div>

                {/* Status Messages */}
                {submitStatus === 'success' && (
                  <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">Media Inquiry Sent!</span>
                    </div>
                    <p className="text-parchment-200 text-sm">
                      Thank you for your media inquiry. Our press team will respond within 24 hours.
                    </p>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <span className="font-semibold">Inquiry Failed to Send</span>
                    </div>
                    <p className="text-parchment-200 text-sm">
                      Please try again or contact us directly at press@jerrycanspirits.co.uk
                    </p>
                  </div>
                )}

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 disabled:cursor-not-allowed text-jerry-green-900 px-8 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2 mx-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        Submit Media Inquiry
                        <svg
                          className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* ==================== MEDIA GUIDELINES ==================== */}
          <section className="mt-16">
            <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
              Media Guidelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
                  Brand Usage
                </h3>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Please use official brand assets only
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Maintain brand colors and typography
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Do not alter or distort logos
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Respect minimum size requirements
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Use ® symbol on first mention
                  </li>
                </ul>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
                  Content Standards
                </h3>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Factual and accurate reporting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Responsible alcohol coverage
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Include appropriate age disclaimers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Credit Jerry Can Spirits® in features
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Contact us for approval on major pieces
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
