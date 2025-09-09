'use client'

import { useState, useEffect } from 'react'

interface FormData {
  firstName: string
  email: string
  interests: string[]
}

interface KlaviyoSignupProps {
  listId?: string
  apiKey?: string
}

export default function KlaviyoSignup({ 
  listId = 'YOUR_LIST_ID', 
  apiKey = 'T8pKVn' 
}: KlaviyoSignupProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    email: '',
    interests: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [isVisible, setIsVisible] = useState(false)

  // Animation on scroll into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById('newsletter-signup')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])


  const interestOptions = [
    { id: 'product-launches', label: 'Product Launches', description: 'Be first to know about new spirits' },
    { id: 'cocktail-recipes', label: 'Cocktail Recipes', description: 'Exclusive expedition cocktails' },
    { id: 'company-updates', label: 'Company Updates', description: 'Behind the scenes content' }
  ]

  const handleInterestChange = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Klaviyo API integration
      const response = await fetch('/api/klaviyo-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          listId,
          apiKey
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        // Reset form after success
        setTimeout(() => {
          setFormData({ firstName: '', email: '', interests: [] })
          setSubmitStatus('idle')
        }, 5000)
      } else {
        setSubmitStatus('error')
        setTimeout(() => setSubmitStatus('idle'), 5000)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section 
      id="newsletter-signup" 
      className="relative overflow-hidden py-20 lg:py-28"
    >

      {/* Gradient overlays */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 30% 40%, rgba(245, 158, 11, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(107, 112, 92, 0.3) 0%, transparent 50%)
          `
        }} />
      </div>

      <div className="relative w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        <div className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          
          {/* Header Content */}
          <div className="text-center mb-12">
            {/* Expedition Badge */}
            <div className="inline-block px-6 py-3 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6 shadow-lg">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Join the Expedition
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mb-6 leading-tight">
              <span style={{ color: '#fefbf5' }}>
                Be Part of the Journey
              </span>
            </h2>

            {/* Value Proposition */}
            <p className="text-xl text-parchment-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Get exclusive early access, limited-edition tastings, and expedition cocktail recipes crafted by our master distillers.
            </p>

          </div>

          {/* Success State */}
          {submitStatus === 'success' && (
            <div className="mb-8 p-6 bg-green-800/60 backdrop-blur-sm border border-green-600/30 rounded-xl text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-serif font-bold text-green-300">You're In!</h3>
              </div>
              <p className="text-green-200">Welcome to the expedition. Check your email for exclusive content coming your way.</p>
            </div>
          )}

          {/* Error State */}
          {submitStatus === 'error' && (
            <div className="mb-8 p-6 bg-red-800/60 backdrop-blur-sm border border-red-600/30 rounded-xl text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-2xl font-serif font-bold text-red-300">Something Went Wrong</h3>
              </div>
              <p className="text-red-200">Please try again or contact us directly.</p>
            </div>
          )}

          {/* Signup Form */}
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name and Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gold-300 font-semibold mb-2 text-sm uppercase tracking-wide">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-jerry-green-800/60 backdrop-blur-sm text-parchment-100 rounded-lg border border-gold-500/30 focus:border-gold-400 focus:outline-none transition-colors duration-200 placeholder-parchment-400"
                    placeholder="Your first name"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gold-300 font-semibold mb-2 text-sm uppercase tracking-wide">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-jerry-green-800/60 backdrop-blur-sm text-parchment-100 rounded-lg border border-gold-500/30 focus:border-gold-400 focus:outline-none transition-colors duration-200 placeholder-parchment-400"
                    placeholder="your@email.com"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Interest Checkboxes */}
              <div>
                <label className="block text-gold-300 font-semibold mb-4 text-sm uppercase tracking-wide">
                  What Interests You Most?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {interestOptions.map(option => (
                    <label key={option.id} className="flex items-start gap-3 p-4 bg-jerry-green-800/40 backdrop-blur-sm rounded-lg border border-gold-500/20 hover:border-gold-400/40 transition-colors duration-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.interests.includes(option.id)}
                        onChange={() => handleInterestChange(option.id)}
                        className="mt-1 w-4 h-4 text-gold-500 bg-jerry-green-700 border-gold-500/50 rounded focus:ring-gold-400 focus:ring-2"
                        disabled={isSubmitting}
                      />
                      <div className="flex-1">
                        <div className="text-parchment-100 font-medium text-sm">{option.label}</div>
                        <div className="text-parchment-300 text-xs mt-1">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || submitStatus === 'success'}
                  className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gold-700 disabled:to-gold-600 text-jerry-green-900 px-12 py-4 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a7.646 7.646 0 100 15.292V12" />
                      </svg>
                      Joining...
                    </>
                  ) : submitStatus === 'success' ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Joined!
                    </>
                  ) : (
                    <>
                      Join the Expedition
                      <svg 
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* GDPR Compliance */}
              <div className="text-center text-xs text-parchment-400 pt-4 max-w-lg mx-auto">
                By signing up, you agree to receive marketing emails from Jerry Can Spirits. You can unsubscribe at any time. 
                View our{' '}
                <a href="/privacy-policy" className="text-gold-400 hover:text-gold-300 underline">
                  Privacy Policy
                </a>
                .
              </div>
            </form>
          </div>

          {/* Benefits List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 pt-16 border-t border-jerry-green-700">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/lightning.svg" alt="Lightning" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold mb-2" style={{color: '#fefbf5'}}>Early Access</h3>
              <p className="text-sm text-parchment-300">Be first to purchase limited batches before public release</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/cocktail.svg" alt="Cocktail" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold mb-2" style={{color: '#fefbf5'}}>Exclusive Recipes</h3>
              <p className="text-sm text-parchment-300">Expedition cocktails and mixing guides from our master distillers</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <img src="/images/gbp.svg" alt="GBP" className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-serif font-bold mb-2" style={{color: '#fefbf5'}}>Member Discounts</h3>
              <p className="text-sm text-parchment-300">Special pricing on products and expedition merchandise</p>
            </div>
          </div>
        </div>
        </div>
      </div>

    </section>
  )
}