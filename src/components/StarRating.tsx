'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'

interface StarRatingProps {
  slug: string
  className?: string
}

interface RatingResponse {
  count: number
  average: number
  hasVoted: boolean
  success?: boolean
  error?: string
}

export default function StarRating({ slug, className = '' }: StarRatingProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [averageRating, setAverageRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showThankYou, setShowThankYou] = useState(false)

  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const pendingRatingRef = useRef<number>(0)

  useEffect(() => {
    async function fetchRating() {
      try {
        const response = await fetch(`/api/ratings/?slug=${encodeURIComponent(slug)}`)
        if (response.ok) {
          const data: RatingResponse = await response.json()
          setAverageRating(data.average)
          setRatingCount(data.count)
          setHasVoted(data.hasVoted)
        }
      } catch (error) {
        console.error('Failed to fetch rating:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchRating()
  }, [slug])

  useEffect(() => {
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [])

  const initTurnstile = () => {
    if (!turnstileContainerRef.current || widgetIdRef.current || !window.turnstile) return
    widgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
      size: 'invisible',
      theme: 'dark',
      callback: (token: string) => {
        void submitRatingWithToken(pendingRatingRef.current, token)
      },
      'error-callback': () => {
        setIsSubmitting(false)
        setRating(0)
      },
      'expired-callback': () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
    })
  }

  const submitRatingWithToken = async (selectedRating: number, turnstileToken: string) => {
    try {
      const response = await fetch('/api/ratings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, rating: selectedRating, turnstileToken })
      })

      const data: RatingResponse = await response.json()

      if (response.ok && data.success) {
        setAverageRating(data.average ?? averageRating)
        setRatingCount(data.count ?? ratingCount + 1)
        setHasVoted(true)
        setShowThankYou(true)
        setTimeout(() => setShowThankYou(false), 3000)
      } else if (response.status === 409) {
        setHasVoted(true)
      } else {
        setRating(0)
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
      setRating(0)
    } finally {
      setIsSubmitting(false)
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current)
      }
    }
  }

  const handleSubmitRating = (selectedRating: number) => {
    if (hasVoted || isSubmitting) return
    setIsSubmitting(true)
    setRating(selectedRating)
    pendingRatingRef.current = selectedRating
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.execute(widgetIdRef.current)
    } else {
      setIsSubmitting(false)
      setRating(0)
    }
  }

  const renderStar = (starIndex: number, filled: boolean, partial?: number) => {
    const isActive = hoverRating >= starIndex || rating >= starIndex
    const showPartial = partial !== undefined && partial > 0 && partial < 1

    return (
      <span key={starIndex} className="relative inline-block">
        <svg
          className="w-6 h-6 text-jerry-green-700"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        <svg
          className={`absolute inset-0 w-6 h-6 transition-colors duration-150 ${
            isActive || filled ? 'text-gold-400' : 'text-transparent'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
          style={showPartial ? { clipPath: `inset(0 ${(1 - partial) * 100}% 0 0)` } : undefined}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </span>
    )
  }

  const renderAverageStars = () => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      const filled = averageRating >= i
      const partial = filled ? 1 : averageRating > i - 1 ? averageRating - (i - 1) : 0
      stars.push(renderStar(i, filled, partial))
    }
    return stars
  }

  const renderInteractiveStars = () => {
    return [1, 2, 3, 4, 5].map((starIndex) => (
      <button
        key={starIndex}
        type="button"
        onClick={() => handleSubmitRating(starIndex)}
        onMouseEnter={() => setHoverRating(starIndex)}
        onMouseLeave={() => setHoverRating(0)}
        disabled={hasVoted || isSubmitting}
        className={`relative inline-block transition-transform ${
          !hasVoted && !isSubmitting
            ? 'cursor-pointer hover:scale-110'
            : 'cursor-default'
        }`}
        aria-label={`Rate ${starIndex} star${starIndex !== 1 ? 's' : ''}`}
      >
        <svg
          className="w-7 h-7 text-jerry-green-700"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        <svg
          className={`absolute inset-0 w-7 h-7 transition-colors duration-150 ${
            (hoverRating >= starIndex || rating >= starIndex)
              ? 'text-gold-400'
              : 'text-transparent'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    ))
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-6 h-6 bg-jerry-green-700/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={initTurnstile}
      />
      {/* Invisible Turnstile widget container */}
      <div ref={turnstileContainerRef} />
      <div className={`${className}`}>
        {ratingCount > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-0.5">
              {renderAverageStars()}
            </div>
            <span className="text-gold-300 font-semibold">{averageRating.toFixed(1)}</span>
            <span className="text-parchment-400 text-sm">
              ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {hasVoted ? (
            <div className="flex items-center gap-2">
              <span className="text-gold-300 text-sm font-medium">
                {showThankYou ? 'Thanks for rating!' : 'You rated this cocktail'}
              </span>
              {rating > 0 && (
                <span className="text-gold-400 text-sm">
                  {rating} star{rating !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ) : (
            <>
              <span className="text-parchment-300 text-sm">Rate this recipe:</span>
              <div className="flex gap-0.5">
                {renderInteractiveStars()}
              </div>
              {isSubmitting && (
                <span className="text-parchment-400 text-sm animate-pulse">Saving...</span>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
