'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ColorSwatch, DownloadCard, BoilerplateText, ImageGallery, SocialPresence } from '@/components/media'
import Breadcrumbs from '@/components/Breadcrumbs'

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

  // Brand values
  const brandValues = [
    {
      name: 'Reliability',
      description: 'Like our namesake, we deliver consistently. We do what we say we\'ll do. Our colleagues, customers, and partners can count on us.'
    },
    {
      name: 'Authenticity',
      description: 'We\'re genuine. No pretence, no marketing fluff. Two mates who care about making good rum.'
    },
    {
      name: 'Quality',
      description: 'Function over form. We focus on making something genuinely good, not just fancy-looking.'
    },
    {
      name: 'Community',
      description: 'We support the armed forces community that shaped us. 5% of profits go to military charities.'
    },
  ]

  // Logo specifications
  const logoSpecs = [
    { application: 'Print', minWidth: '20mm' },
    { application: 'Digital', minWidth: '100px' },
    { application: 'Favicon / Icon', minWidth: '16px' },
  ]

  // Tone of voice characteristics
  const voiceCharacteristics = [
    { name: 'Genuine', description: 'We speak honestly and directly. No marketing fluff or corporate speak. We say what we mean.' },
    { name: 'Warm', description: 'We\'re friendly and approachable, not cold or exclusive. We talk to customers like mates, not prospects.' },
    { name: 'Confident', description: 'We\'re proud of what we make, without being arrogant. We let quality speak for itself.' },
    { name: 'Down-to-Earth', description: 'We don\'t take ourselves too seriously. We can have a laugh while still caring deeply about what we do.' },
  ]

  // Boilerplate text options
  const boilerplateShort = `Jerry Can Spirits® is a British veteran-owned spirits company making premium craft rum. Founded by Royal Corps of Signals veterans, we focus on quality over flash – making rum we're genuinely proud of.`

  const boilerplateMedium = `Jerry Can Spirits® is a British veteran-owned spirits company making premium craft rum. Founded by veterans of the Royal Corps of Signals who decided to stop talking about making rum and actually have a go, we take a no-nonsense approach to what we do. Our name comes from the classic jerry can – designed in 1937 and still used today because it just works. Like the jerry can, we're focused on function over form: making rum that's genuinely good, not just fancy-looking.`

  const boilerplateFull = `Jerry Can Spirits® is a British veteran-owned spirits company making premium craft rum. Founded by Dan and Rhys, veterans of the Royal Corps of Signals who spent years talking about making their own rum before finally having a go, we take a straightforward approach to what we do.

Our name comes from the classic jerry can – designed in 1937 and still NATO standard today because it just works. That's the approach we take: function over form, quality without shortcuts. We're not trying to reinvent rum or chase trends. We just want to make something we're proud of and that people actually enjoy drinking.

Based in the UK, Jerry Can Spirits® is a small operation run by two mates who care about getting it right. Whether you're an outdoors type or just fancy a decent drink, our Expedition Spiced Rum delivers honest quality and proper flavour. We're still learning and growing, but we're committed to making rum that's worth your time.`

  const socialResponsibilityStatement = `Jerry Can Spirits commits 5% of annual net profits to armed forces charities supporting veteran welfare, mental health services, and military families. This isn't marketing. It's who we are.`

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Contact', href: '/contact' },
            { label: 'Media' },
          ]}
        />
      </div>

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
            <a href="#our-brand" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Our Brand</a>
            <a href="#product-spec" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Product Spec</a>
            <a href="#brand-assets" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Brand Assets</a>
            <a href="#founders" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Co-Founders</a>
            <a href="#awards" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Awards</a>
            <a href="#milestones" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Milestones</a>
            <a href="#social-media" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Social Media</a>
            <a href="#company-info" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Company Info</a>
            <a href="#press-contacts" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Press Contacts</a>
            <a href="#inquiry-form" className="px-4 py-2 bg-jerry-green-800/60 hover:bg-jerry-green-700/60 text-parchment-200 rounded-lg text-sm font-medium transition-colors">Media Inquiry</a>
            <a href="/contact/media/kit/" className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 rounded-lg text-sm font-semibold transition-colors">Download Media Kit</a>
          </div>

          {/* ==================== OUR BRAND SECTION ==================== */}
          <section id="our-brand" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Our Brand
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              The essence of Jerry Can Spirits®: our story, values, and what drives us.
            </p>

            {/* Tagline */}
            <div className="text-center mb-12">
              <p className="text-2xl md:text-3xl font-serif text-gold-300 italic">
                &ldquo;Engineered for Reliability • Designed for Adventure&rdquo;
              </p>
              <p className="text-parchment-400 text-sm mt-2">Our Tagline</p>
            </div>

            {/* Brand Essence */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-12 text-center">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-4">Brand Essence</h3>
              <p className="text-xl text-parchment-200 leading-relaxed max-w-3xl mx-auto">
                The jerry can wasn&apos;t designed for beauty. It was engineered for absolute reliability. We believe rum deserves the same respect.
              </p>
            </div>

            {/* Brand Story */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 mb-12">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Brand Story
              </h3>
              <div className="text-parchment-200 leading-relaxed space-y-4">
                <p>
                  Jerry Can Spirits® is a British veteran-owned spirits company making premium craft rum. Founded by Dan and Rhys, veterans of the Royal Corps of Signals who spent years talking about making their own rum before finally having a go, we take a straightforward approach to what we do.
                </p>
                <p>
                  Our name comes from the classic jerry can, designed in 1937 and still NATO standard today because it just works. That&apos;s the approach we take: function over form, quality without shortcuts.
                </p>
              </div>
              <a href="/about/story/" className="inline-block mt-4 text-gold-300 hover:text-gold-200 text-sm font-medium underline transition-colors">Read our full story</a>
            </div>

            {/* Brand Values */}
            <div className="mb-12">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Brand Values
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {brandValues.map((value) => (
                  <div key={value.name} className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <h4 className="text-gold-300 font-semibold text-lg mb-2">{value.name}</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-4">
                <a href="/ethos/" className="text-gold-300 hover:text-gold-200 text-sm font-medium underline transition-colors">Our ethos</a>
                <a href="/sustainability/" className="text-gold-300 hover:text-gold-200 text-sm font-medium underline transition-colors">Sustainability</a>
              </div>
            </div>
          </section>

          {/* ==================== PRODUCT FACT SHEET ==================== */}
          <section id="product-spec" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Product Fact Sheet
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Key product details for Expedition Spiced Rum.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Specs */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6">Product Specifications</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Product', value: 'Expedition Spiced Rum' },
                    { label: 'ABV', value: '40%' },
                    { label: 'Volume', value: '700ml' },
                    { label: 'RRP', value: '£45.00' },
                    { label: 'Base Spirit', value: 'Caribbean rum' },
                    { label: 'Produced At', value: 'Spirit of Wales Distillery, Newport, South Wales', href: '/friends/' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-baseline border-b border-gold-500/10 pb-2">
                      <span className="text-parchment-400 text-sm">{item.label}</span>
                      {'href' in item && item.href ? (
                        <a href={item.href} className="text-gold-300 hover:text-gold-200 font-medium text-sm underline transition-colors">{item.value}</a>
                      ) : (
                        <span className="text-parchment-50 font-medium text-sm">{item.value}</span>
                      )}
                    </div>
                  ))}
                </div>

                <h4 className="text-gold-300 font-semibold mt-6 mb-3">Key Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Madagascan Vanilla Pods', 'Ceylon Cinnamon', 'Ginger', 'Orange Peel',
                    'Cloves', 'Allspice', 'Cassia Bark', 'Agave Syrup', 'Glucose Syrup', 'Bourbon Barrel Chips'
                  ].map((ingredient) => (
                    <span key={ingredient} className="px-2.5 py-1 bg-jerry-green-700/60 text-parchment-200 text-xs rounded-full border border-gold-500/20">
                      {ingredient}
                    </span>
                  ))}
                </div>

                <h4 className="text-gold-300 font-semibold mt-6 mb-3">Dietary Information</h4>
                <div className="flex flex-wrap gap-3">
                  {['Gluten-free', 'Vegan', 'Dairy-free', 'Nut-free'].map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasting Notes */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6">Tasting Notes</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Nose</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Warm Madagascan vanilla leads with a rich, creamy softness, followed by Ceylon cinnamon and toasted bourbon oak, lifted by bright orange peel with clove and allspice in the background.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Palate</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Silky and naturally sweet on entry thanks to agave, with ginger heat and cassia bark developing into layered baking spices.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Finish</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Long, warming, and elegantly dry with oak tannins, vanilla, and a flicker of ginger.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="/ingredients/expedition-spiced-rum/" className="inline-flex items-center gap-2 px-4 py-2 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-sm font-semibold rounded-lg transition-all duration-200">
                    Full Ingredients
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <a href="/shop/" className="inline-flex items-center gap-2 px-4 py-2 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-sm font-semibold rounded-lg transition-all duration-200">
                    Shop
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PRODUCT FACT SHEET ==================== */}
          <section id="product-spec" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Product Fact Sheet
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Key product details for Expedition Spiced Rum.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Specs */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6">Product Specifications</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Product', value: 'Expedition Spiced Rum' },
                    { label: 'ABV', value: '40%' },
                    { label: 'Volume', value: '700ml' },
                    { label: 'RRP', value: '£45.00' },
                    { label: 'Base Spirit', value: 'Caribbean rum' },
                    { label: 'Produced At', value: 'Spirit of Wales Distillery, Newport, South Wales' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-baseline border-b border-gold-500/10 pb-2">
                      <span className="text-parchment-400 text-sm">{item.label}</span>
                      <span className="text-parchment-50 font-medium text-sm">{item.value}</span>
                    </div>
                  ))}
                </div>

                <h4 className="text-gold-300 font-semibold mt-6 mb-3">Key Ingredients</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Madagascan Vanilla Pods', 'Ceylon Cinnamon', 'Ginger', 'Orange Peel',
                    'Cloves', 'Allspice', 'Cassia Bark', 'Agave Syrup', 'Glucose Syrup', 'Bourbon Barrel Chips'
                  ].map((ingredient) => (
                    <span key={ingredient} className="px-2.5 py-1 bg-jerry-green-700/60 text-parchment-200 text-xs rounded-full border border-gold-500/20">
                      {ingredient}
                    </span>
                  ))}
                </div>

                <h4 className="text-gold-300 font-semibold mt-6 mb-3">Dietary Information</h4>
                <div className="flex flex-wrap gap-3">
                  {['Gluten-free', 'Vegan', 'Dairy-free', 'Nut-free'].map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600/20 text-green-300 text-xs font-medium rounded-full border border-green-500/30">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasting Notes */}
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6">Tasting Notes</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Nose</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Warm Madagascan vanilla leads with a rich, creamy softness, followed by Ceylon cinnamon and toasted bourbon oak, lifted by bright orange peel with clove and allspice in the background.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Palate</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Silky and naturally sweet on entry thanks to agave, with ginger heat and cassia bark developing into layered baking spices.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-gold-300 font-semibold mb-2">Finish</h4>
                    <p className="text-parchment-200 text-sm leading-relaxed">
                      Long, warming, and elegantly dry with oak tannins, vanilla, and a flicker of ginger.
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="/ingredients/expedition-spiced-rum/" className="inline-flex items-center gap-2 px-4 py-2 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-sm font-semibold rounded-lg transition-all duration-200">
                    Full Ingredients
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <a href="/shop/" className="inline-flex items-center gap-2 px-4 py-2 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-sm font-semibold rounded-lg transition-all duration-200">
                    Shop
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </section>

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

              {/* Logo Specifications */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-parchment-50 font-semibold mb-4">Minimum Sizes</h4>
                  <div className="space-y-3">
                    {logoSpecs.map((spec) => (
                      <div key={spec.application} className="flex justify-between items-center text-sm">
                        <span className="text-parchment-300">{spec.application}</span>
                        <span className="text-gold-300 font-mono">{spec.minWidth}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-parchment-50 font-semibold mb-4">Clear Space</h4>
                  <p className="text-parchment-300 text-sm leading-relaxed">
                    Maintain clear space around the logo equal to the height of the &apos;J&apos; in &apos;Jerry&apos; on all sides. This ensures the logo remains prominent and uncluttered.
                  </p>
                </div>
              </div>

              {/* Logo Misuse */}
              <div className="mt-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-parchment-50 font-semibold mb-4">Logo Misuse. Never:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm text-parchment-300">
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Stretch, distort, or rotate</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Change the logo colours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Add effects or shadows</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Place on busy backgrounds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Recreate or modify</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-400">✕</span>
                    <span>Use outdated versions</span>
                  </div>
                </div>
              </div>
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

          {/* ==================== TONE OF VOICE SECTION ==================== */}
          <section id="tone-of-voice" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Tone of Voice
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              How we speak is as important as how we look. Our tone reflects our brand personality in every piece of communication.
            </p>

            {/* Voice Characteristics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {voiceCharacteristics.map((char) => (
                <div key={char.name} className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h4 className="text-gold-300 font-semibold text-lg mb-2">{char.name}</h4>
                  <p className="text-parchment-200 text-sm leading-relaxed">{char.description}</p>
                </div>
              ))}
            </div>

            {/* Writing Guidelines */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-parchment-50 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Do
                </h4>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Use plain English, avoid jargon</li>
                  <li>• Be conversational but professional</li>
                  <li>• Get to the point, respect people&apos;s time</li>
                  <li>• Use active voice where possible</li>
                  <li>• Include personality, we&apos;re humans, not robots</li>
                </ul>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-parchment-50 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-red-400">✕</span> Don&apos;t
                </h4>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Use corporate buzzwords or clichés</li>
                  <li>• Be preachy or self-important</li>
                  <li>• Over-promise or exaggerate</li>
                  <li>• Use overly formal or stiff language</li>
                  <li>• Make claims we can&apos;t back up</li>
                </ul>
              </div>
            </div>

            {/* Example */}
            <div className="mt-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h4 className="text-parchment-50 font-semibold mb-4">Example</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-parchment-400 text-xs uppercase tracking-wider mb-2">Instead of:</p>
                  <p className="text-parchment-300 text-sm italic">&ldquo;Our premium craft spirits are meticulously crafted using only the finest ingredients, delivering an unparalleled drinking experience.&rdquo;</p>
                </div>
                <div>
                  <p className="text-gold-300 text-xs uppercase tracking-wider mb-2">Write:</p>
                  <p className="text-parchment-100 text-sm">&ldquo;We make rum we&apos;re genuinely proud of. No shortcuts, no gimmicks. Just proper flavour.&rdquo;</p>
                </div>
              </div>
            </div>
          </section>

          {/* ==================== PHOTOGRAPHY GUIDELINES SECTION ==================== */}
          <section id="photography" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Photography Guidelines
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Photography is a powerful tool for conveying our brand personality. All imagery should feel authentic, warm, and true to our values.
            </p>

            {/* Photography Style */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-gold-300 font-semibold text-lg mb-2">Authentic & Natural</h4>
                <p className="text-parchment-200 text-sm leading-relaxed">Photography should feel genuine and unforced. We prefer natural light and documentary-style imagery over heavily staged or artificial shots.</p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-gold-300 font-semibold text-lg mb-2">Warm & Inviting</h4>
                <p className="text-parchment-200 text-sm leading-relaxed">Images should have warmth, both in colour temperature and mood. Cold, clinical imagery doesn&apos;t represent our brand.</p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-gold-300 font-semibold text-lg mb-2">Quality Without Pretension</h4>
                <p className="text-parchment-200 text-sm leading-relaxed">Our imagery should convey quality and craftsmanship without feeling pretentious or exclusive. We&apos;re premium but approachable.</p>
              </div>
            </div>

            {/* Photography Do's and Don'ts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-parchment-50 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-green-400">✓</span> Do
                </h4>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Use natural lighting where possible</li>
                  <li>• Show products in authentic contexts</li>
                  <li>• Use consistent colour grading across image sets</li>
                  <li>• Feature real people in genuine moments</li>
                  <li>• Include outdoor and adventure-themed imagery</li>
                </ul>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h4 className="text-parchment-50 font-semibold mb-4 flex items-center gap-2">
                  <span className="text-red-400">✕</span> Don&apos;t
                </h4>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Use generic stock photography</li>
                  <li>• Over-edit or apply heavy filters</li>
                  <li>• Use artificial or clinical lighting</li>
                  <li>• Feature overly posed or fake-looking scenarios</li>
                  <li>• Use imagery that contradicts responsible drinking</li>
                </ul>
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
                <BoilerplateText title="Social Responsibility Statement" wordCount={30} text={socialResponsibilityStatement} />
              </div>
            </div>

            {/* Co-Founders Section */}
            <div id="founders" className="mb-12 scroll-mt-24">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Co-Founders
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dan */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-gold-500/30">
                      <Image
                        src="/images/team/Dan_Headshot.jpg"
                        alt="Dan Freeman - Co-Founder & Director, Jerry Can Spirits®"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif font-bold text-parchment-50 mb-1">Dan Freeman</h4>
                      <p className="text-gold-300 font-medium mb-4">Co-Founder & Director</p>
                    </div>
                    <div className="space-y-3 text-parchment-200 text-sm leading-relaxed text-left">
                      <p>
                        Dan is a veteran of the Royal Corps of Signals. After his time in service he moved into civilian life with an idea brewing — make rum for the adventurous sort. No-nonsense spirits that deliver quality and taste without making any concessions.
                      </p>
                      <p>
                        Based in the UK, Dan is at the helm using the same level of dedication and focus he had when serving — real proof that with a small, passionate team and a commitment to quality, anything&apos;s possible.
                      </p>
                    </div>
                    <a
                      href="/images/team/Dan_Headshot.jpg"
                      download="Dan_Freeman_Headshot.jpg"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-xs font-semibold rounded transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Headshot
                    </a>
                  </div>
                </div>

                {/* Rhys */}
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-gold-500/30">
                      <Image
                        src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/bcacb452-4f56-4676-b4c8-ac6afa7c1e00/public"
                        alt="Rhys - Co-Founder & Director, Jerry Can Spirits®"
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif font-bold text-parchment-50 mb-1">Rhys</h4>
                      <p className="text-gold-300 font-medium mb-4">Co-Founder & Director</p>
                    </div>
                    <div className="space-y-3 text-parchment-200 text-sm leading-relaxed text-left">
                      <p>
                        Rhys is a veteran of the Royal Corps of Signals (2011–2016). After leaving the military, he moved into Formula 1 onboard communications and live events telecoms — high-pressure environments where reliability and precision matter.
                      </p>
                      <p>
                        With a lifelong passion for making alcohol and an engineer&apos;s mindset, Rhys brings hands-on expertise to Jerry Can Spirits&apos; recipe development and production process.
                      </p>
                    </div>
                    <a
                      href="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/bcacb452-4f56-4676-b4c8-ac6afa7c1e00/public"
                      download="Rhys_Headshot.jpg"
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-xs font-semibold rounded transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Headshot
                    </a>
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

          {/* ==================== AWARDS & ACCREDITATIONS ==================== */}
          <section id="awards" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Awards & Accreditations
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Recognition and commitments that reflect our values.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Armed Forces Covenant</h3>
                <p className="text-parchment-200 text-sm leading-relaxed mb-3">
                  Signatory to the Armed Forces Covenant, pledging support for the armed forces community, veterans, and their families.
                </p>
                <a href="/armed-forces-covenant/" className="text-gold-300 hover:text-gold-200 text-xs font-medium underline transition-colors">Read our commitment</a>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">ERS Bronze Award</h3>
                <p className="text-parchment-200 text-sm leading-relaxed">
                  Employer Recognition Scheme Bronze Award from the Ministry of Defence for our commitment to supporting the armed forces community.
                </p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">British Veteran Owned</h3>
                <p className="text-parchment-200 text-sm leading-relaxed">
                  Certified British Veteran Owned business, verified and recognised for our military heritage and veteran leadership.
                </p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-gold-300 mb-2">Worcester RFC MA Sponsor</h3>
                <p className="text-parchment-200 text-sm leading-relaxed">
                  Official Match Afternoon sponsor for Worcester RFC during the 2025/26 season, supporting grassroots community rugby.
                </p>
              </div>
            </div>
          </section>

          {/* ==================== BRAND MILESTONES ==================== */}
          <section id="milestones" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Brand Milestones
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Key moments in the Jerry Can Spirits journey.
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="relative border-l-2 border-gold-500/30 ml-4">
                {[
                  { date: '31 July 2025', event: 'Jerry Can Spirits founded on Black Tot Day — the anniversary of the Royal Navy\'s last daily rum ration.' },
                  { date: 'Q3 2025', event: 'Recipe development begins with Spirit of Wales Distillery in Newport, South Wales.' },
                  { date: '2025/26 Season', event: 'Worcester RFC Match Afternoon sponsorship begins.' },
                  { date: '6 April 2026', event: 'Expedition Spiced Rum official launch.' },
                ].map((milestone, index) => (
                  <div key={index} className="relative pl-8 pb-10 last:pb-0">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-gold-500 rounded-full border-2 border-jerry-green-900" />
                    <p className="text-gold-300 text-sm font-semibold mb-1">{milestone.date}</p>
                    <p className="text-parchment-200 text-sm leading-relaxed">{milestone.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ==================== TARGET AUDIENCE ==================== */}
          <section id="audience" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Target Audience & Pre-Launch Stats
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Who we&apos;re building for and early traction.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">Target Audience</h3>
                <p className="text-parchment-200 text-sm leading-relaxed">
                  Adventurous adults (25–45) who appreciate quality spirits without pretension — outdoor enthusiasts, military community, cocktail explorers, and those who value authentic British craft.
                </p>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-gold-500/20 flex flex-col items-center justify-center text-center">
                <p className="text-4xl font-serif font-bold text-gold-300 mb-2">60+</p>
                <p className="text-parchment-200 text-sm">Pre-orders before launch</p>
                <p className="text-parchment-400 text-xs mt-2">A growing community of rum enthusiasts</p>
              </div>
            </div>
          </section>

          {/* ==================== SOCIAL MEDIA PRESENCE ==================== */}
          <section id="social-media" className="mb-20 scroll-mt-24">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-4">
              Social Media Presence
            </h2>
            <p className="text-parchment-300 text-center mb-12 max-w-2xl mx-auto">
              Find us across social media. We&apos;re @jerrycanspirits everywhere.
            </p>
            <SocialPresence />
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

          {/* Media Kit CTA */}
          <div className="mb-20 text-center">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 inline-block">
              <h3 className="text-xl font-serif font-bold text-parchment-50 mb-3">Need a quick overview?</h3>
              <p className="text-parchment-300 text-sm mb-4 max-w-md">
                Download our media kit one-pager with brand overview, product specs, and co-founder bios — ready to print or save as PDF.
              </p>
              <a
                href="/contact/media/kit/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Media Kit
              </a>
            </div>
          </div>

          {/* ==================== LATEST NEWS SECTION ==================== */}
          <section className="mb-20">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
                Latest News & Press Releases
              </h2>
              <div className="text-center">
                <div className="bg-jerry-green-700/40 rounded-lg p-6 border border-gold-500/20">
                  <p className="text-parchment-200 mb-4">
                    We&apos;re a new brand, so press releases and news will be added here as we grow. Follow us on social media for the latest updates.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                    Maintain brand colours and typography
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
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
                  Legal Requirements
                </h3>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Include responsible drinking messaging
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Use correct trademark notation (®)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Comply with ASA &amp; Portman Group guidelines
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Never depict individuals under 25 in advertising
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gold-400 mt-0.5">•</span>
                    Never promote excessive consumption
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
