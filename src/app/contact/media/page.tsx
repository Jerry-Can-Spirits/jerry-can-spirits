'use client'

import { useState } from 'react'

export default function MediaContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
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
          message: `Organization: ${formData.organization}\n\n${formData.message}`,
          formType: 'media'
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          organization: '',
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
  const mediaKit = [
    {
      title: 'Brand Assets',
      description: 'Logos, brand guidelines, and visual identity assets',
      items: ['High-res logos', 'Brand colors & fonts', 'Usage guidelines']
    },
    {
      title: 'Product Images',
      description: 'Professional product photography and lifestyle shots',
      items: ['Bottle photography', 'Lifestyle images', 'Behind-the-scenes']
    },
    {
      title: 'Brand Story',
      description: 'Company background, mission, and founder information',
      items: ['Company bio', 'Founder story', 'Mission & values']
    }
  ]

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
              Resources for journalists, content creators, and media professionals covering Jerry Can Spirits.
            </p>
          </div>

          {/* Press Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {pressContacts.map((contact) => (
              <div
                key={contact.title}
                className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center hover:border-gold-400/40 transition-all duration-300"
              >
                <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-4">
                  {contact.title}
                </h2>
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

          {/* Media Kit */}
          <div className="mb-16">
            <h2 className="text-3xl font-serif font-bold text-parchment-50 text-center mb-12">
              Media Kit & Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {mediaKit.map((kit) => (
                <div
                  key={kit.title}
                  className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300"
                >
                  <h3 className="text-xl font-serif font-bold text-parchment-50 mb-3">
                    {kit.title}
                  </h3>
                  <p className="text-parchment-300 mb-4 text-sm">
                    {kit.description}
                  </p>
                  <ul className="space-y-2">
                    {kit.items.map((item) => (
                      <li key={item} className="flex items-center text-parchment-200 text-sm">
                        <svg
                          className="w-4 h-4 text-gold-400 mr-2 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <p className="text-parchment-300 mb-4">
                Need specific assets or have questions?
              </p>
              <a
                href="mailto:press@jerrycanspirits.co.uk?subject=Media Kit Request"
                className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-6 py-3 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 inline-flex items-center gap-2"
              >
                Request Media Kit
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </a>
            </div>
          </div>

          {/* Press Releases & News */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
              Latest News & Press Releases
            </h2>
            <div className="text-center">
              <div className="bg-jerry-green-700/40 rounded-lg p-6 border border-gold-500/20">
                <p className="text-parchment-200 mb-4">
                  Jerry Can Spirits is currently in pre-launch phase. Stay tuned for upcoming announcements, product launches, and company news.
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

          {/* Media Contact Form */}
          <div className="mb-16">
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
                    <label htmlFor="organization" className="block text-sm font-medium text-parchment-200 mb-2">
                      Organization
                    </label>
                    <input
                      type="text"
                      id="organization"
                      name="organization"
                      value={formData.organization}
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
          </div>

          {/* Guidelines */}
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6 text-center">
              Media Guidelines
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
                  Brand Usage
                </h3>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Please use official brand assets only</li>
                  <li>• Maintain brand colors and typography</li>
                  <li>• Do not alter or distort logos</li>
                  <li>• Respect minimum size requirements</li>
                </ul>
              </div>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
                  Content Standards
                </h3>
                <ul className="space-y-2 text-parchment-200 text-sm">
                  <li>• Factual and accurate reporting</li>
                  <li>• Responsible alcohol coverage</li>
                  <li>• Include appropriate age disclaimers</li>
                  <li>• Credit Jerry Can Spirits in features</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}