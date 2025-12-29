'use client'

import { useState } from 'react'

export default function Complaints() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orderNumber: '',
    issueType: '',
    message: '',
    priority: 'normal'
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
          subject: `${formData.issueType}${formData.orderNumber ? ` (Order #${formData.orderNumber})` : ''}`,
          message: formData.message,
          formType: 'complaints',
          orderNumber: formData.orderNumber,
          issueType: formData.issueType,
          priority: formData.priority
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: '',
          email: '',
          orderNumber: '',
          issueType: '',
          message: '',
          priority: 'normal'
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
      {/* Page Hero */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Customer Service
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-parchment-50 mb-6">
              Complaints & Issues
            </h1>
            <p className="text-xl text-parchment-200 max-w-3xl mx-auto leading-relaxed">
              We're committed to making things right. If you've experienced an issue with our products or service, please let us know so we can resolve it quickly.
            </p>
          </div>

          {/* Quick Resolution Section */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
            <h2 className="text-xl font-serif font-bold text-parchment-50 mb-4">
              Common Issues & Quick Solutions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-parchment-200 mb-2">Shipping & Delivery</h3>
                <ul className="space-y-1 text-parchment-300">
                  <li>• Check tracking information first</li>
                  <li>• Allow 3-5 business days for delivery</li>
                  <li>• Contact us if package appears lost</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-parchment-200 mb-2">Product Quality</h3>
                <ul className="space-y-1 text-parchment-300">
                  <li>• Check for damaged packaging</li>
                  <li>• Take photos for our records</li>
                  <li>• We'll arrange replacement or refund</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Complaint Form */}
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <h2 className="text-2xl font-serif font-bold text-parchment-50 mb-6">
              Submit a Complaint
            </h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="orderNumber" className="block text-sm font-medium text-parchment-200 mb-2">
                    Order Number
                  </label>
                  <input
                    type="text"
                    id="orderNumber"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                    placeholder="e.g., JCS-2024-001"
                  />
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-parchment-200 mb-2">
                    Priority Level
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                  >
                    <option value="low">Low - General feedback</option>
                    <option value="normal">Normal - Standard issue</option>
                    <option value="high">High - Urgent matter</option>
                    <option value="critical">Critical - Immediate attention needed</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-parchment-200 mb-2">
                  Issue Type *
                </label>
                <select
                  id="issueType"
                  name="issueType"
                  required
                  value={formData.issueType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200"
                >
                  <option value="">Select issue type</option>
                  <option value="Product Quality">Product Quality Issue</option>
                  <option value="Shipping/Delivery">Shipping or Delivery Problem</option>
                  <option value="Damaged Package">Damaged Package</option>
                  <option value="Wrong Item">Wrong Item Received</option>
                  <option value="Website Issue">Website or Ordering Issue</option>
                  <option value="Customer Service">Customer Service Experience</option>
                  <option value="Billing/Payment">Billing or Payment Issue</option>
                  <option value="Return/Refund">Return or Refund Request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-parchment-200 mb-2">
                  Detailed Description *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200 resize-vertical"
                  placeholder="Please provide as much detail as possible about the issue, including what happened, when it occurred, and what resolution you're seeking..."
                />
              </div>

              <div className="bg-jerry-green-700/30 rounded-lg p-4 border border-gold-500/20">
                <h3 className="text-sm font-semibold text-parchment-200 mb-2">What happens next?</h3>
                <ul className="space-y-1 text-xs text-parchment-300">
                  <li>• We'll acknowledge your complaint within 24 hours</li>
                  <li>• Investigation and resolution typically takes 3-5 business days</li>
                  <li>• You'll receive updates on progress and final resolution</li>
                  <li>• For urgent matters, we may contact you by phone</li>
                </ul>
              </div>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-300 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold">Complaint Submitted Successfully!</span>
                  </div>
                  <p className="text-parchment-200 text-sm">
                    Your complaint has been received and logged. Our customer service team will investigate and respond within 3-5 business days.
                  </p>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-red-300 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="font-semibold">Complaint Failed to Submit</span>
                  </div>
                  <p className="text-parchment-200 text-sm">
                    Please try again or contact us directly at hello@jerrycanspirits.co.uk for urgent matters.
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Complaint
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

          {/* Contact Information */}
          <div className="mt-12 text-center">
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h3 className="text-lg font-serif font-bold text-parchment-50 mb-4">
                Need Immediate Assistance?
              </h3>
              <p className="text-parchment-200 mb-4">
                For urgent matters or if you prefer to speak directly with our customer service team:
              </p>
              <div className="space-y-2">
                <p className="text-parchment-200">
                  <span className="text-gold-300 font-medium">Email:</span>{' '}
                  <a
                    href="mailto:hello@jerrycanspirits.co.uk?subject=Urgent: Customer Service"
                    className="text-gold-300 hover:text-gold-200 underline transition-colors duration-200"
                  >
                    hello@jerrycanspirits.co.uk
                  </a>
                </p>
                <p className="text-parchment-300 text-sm">
                  Mark urgent emails with "URGENT" in the subject line
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}