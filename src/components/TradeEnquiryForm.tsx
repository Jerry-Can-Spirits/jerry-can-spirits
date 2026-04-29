'use client'

import { useState } from 'react'

interface TradeFormData {
  name: string
  email: string
  venueName: string
  venueType: string
  covers: string
  message: string
}

export default function TradeEnquiryForm() {
  const [formData, setFormData] = useState<TradeFormData>({
    name: '',
    email: '',
    venueName: '',
    venueType: '',
    covers: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [honeypot, setHoneypot] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          venueName: formData.venueName,
          venueType: formData.venueType,
          covers: formData.covers,
          message: formData.message,
          subject: 'Trade Enquiry',
          formType: 'trade',
          website: honeypot,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', venueName: '', venueType: '', covers: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400 transition-colors'
  const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      {/* Honeypot — off-screen, not display:none, to prevent autofill triggering it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="trade-name" className={labelClass}>Your name *</label>
          <input
            type="text"
            id="trade-name"
            name="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="trade-email" className={labelClass}>Email address *</label>
          <input
            type="email"
            id="trade-email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="trade-venue-name" className={labelClass}>Venue name *</label>
        <input
          type="text"
          id="trade-venue-name"
          name="venueName"
          required
          autoComplete="organization"
          value={formData.venueName}
          onChange={handleChange}
          className={inputClass}
          placeholder="The name of your venue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="trade-venue-type" className={labelClass}>Venue type *</label>
          <select
            id="trade-venue-type"
            name="venueType"
            required
            autoComplete="off"
            value={formData.venueType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select venue type</option>
            <option value="Bar">Bar</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Hotel">Hotel</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="trade-covers" className={labelClass}>Approximate covers *</label>
          <select
            id="trade-covers"
            name="covers"
            required
            autoComplete="off"
            value={formData.covers}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select capacity</option>
            <option value="Under 50">Under 50</option>
            <option value="50–150">50–150</option>
            <option value="150–300">150–300</option>
            <option value="300+">300+</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="trade-message" className={labelClass}>Anything else you want to tell us</label>
        <textarea
          id="trade-message"
          name="message"
          rows={4}
          autoComplete="off"
          value={formData.message}
          onChange={handleChange}
          className={inputClass}
          placeholder="Tell us about your venue, what you're looking for, or any questions you have."
        />
      </div>

      {submitStatus === 'success' && (
        <div className="bg-jerry-green-800/60 border border-gold-500/30 rounded-lg p-4 animate-slide-up">
          <p className="text-parchment-200 text-sm mb-2">
            Good to hear from you. We will be in touch within two working days.
          </p>
          <p className="text-parchment-400 text-sm">
            In the meantime, the{' '}
            <a href="/field-manual/" className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors">
              Field Manual
            </a>
            {' '}has everything your bar team needs to know.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div role="alert" className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 animate-slide-up">
          <p className="text-red-300 text-sm">
            Something went wrong. Email us directly at{' '}
            <a href="mailto:trade@jerrycanspirits.co.uk" className="underline hover:text-red-200">
              trade@jerrycanspirits.co.uk
            </a>
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
        >
          {isSubmitting ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Sending
        </span>
      ) : 'Send Enquiry'}
        </button>
      </div>
    </form>
  )
}
