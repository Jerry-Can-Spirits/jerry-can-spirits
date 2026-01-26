'use client'

import { useState } from 'react'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function GeneralEnquiries() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
          message: formData.message,
          formType: 'general'
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
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

  return (
    <main className="min-h-screen">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Breadcrumbs
          items={[
            { label: 'Contact', href: '/contact' },
            { label: 'General Enquiries' },
          ]}
        />
      </div>

      {/* Page Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                General Enquiries
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6">
              Get in Touch
            </h1>
            <p className="text-xl text-parchment-200 max-w-3xl mx-auto leading-relaxed">
              Have a question about our spirits, need product information, or want to know more about Jerry Can Spirits? We're here to help.
            </p>
          </div>

          {/* Contact Form */}
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
                    autoComplete="name"
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
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-parchment-200 mb-2">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                >
                  <option value="">Select a subject</option>
                  <option value="Product Information">Product Information</option>
                  <option value="Availability & Stockists">Availability & Stockists</option>
                  <option value="Shipping & Delivery">Shipping & Delivery</option>
                  <option value="Returns & Exchanges">Returns & Exchanges</option>
                  <option value="Corporate Enquiries">Corporate Enquiries</option>
                  <option value="Events & Tastings">Events & Tastings</option>
                  <option value="Other">Other</option>
                </select>
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
                  placeholder="Tell us how we can help you..."
                />
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Message Sent Successfully!</span>
                  </div>
                  <p className="text-parchment-200 text-sm">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold">Message Failed to Send</span>
                  </div>
                  <p className="text-parchment-200 text-sm">
                    Please try again or contact us directly at hello@jerrycanspirits.co.uk
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
                      Send Message
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

          {/* Alternative Contact Methods */}
          <div className="mt-12 text-center">
            <p className="text-parchment-300 mb-4">
              Prefer to contact us directly?
            </p>
            <div className="space-y-2">
              <p className="text-parchment-200">
                <span className="text-gold-300 font-medium">Email:</span>{' '}
                <a
                  href="mailto:hello@jerrycanspirits.co.uk"
                  className="text-gold-300 hover:text-gold-200 underline transition-colors duration-200"
                >
                  hello@jerrycanspirits.co.uk
                </a>
              </p>
              <p className="text-parchment-300 text-sm">
                We typically respond within 24 hours during business days
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}