'use client'

import { useState, useEffect } from 'react'

interface InstagramFeedProps {
  postUrls?: string[]
  limit?: number
}

/**
 * Instagram Feed using Instagram's oEmbed API
 *
 * SETUP (super simple!):
 * 1. Create a post on your Instagram account (@jerrycanspirits)
 * 2. Click the three dots (...) on the post and select "Copy link"
 * 3. Add the URL to the postUrls array
 * 4. That's it! No API tokens or Meta app setup needed.
 *
 * How to get Instagram post URLs:
 * - Mobile: Post → ... menu → "Copy link"
 * - Desktop: Click post → Copy URL from browser
 * - Format: https://www.instagram.com/p/POST_ID/
 *
 * Example:
 * <InstagramFeed postUrls={[
 *   'https://www.instagram.com/p/C1A2B3C4D5/',
 *   'https://www.instagram.com/p/D5E6F7G8H9/',
 * ]} />
 */
export default function InstagramFeed({
  postUrls = [],
  limit = 6
}: InstagramFeedProps) {
  const [embedHtml, setEmbedHtml] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (postUrls.length === 0) {
      setLoading(false)
      return
    }

    const fetchEmbeds = async () => {
      try {
        const postsToFetch = postUrls.slice(0, limit)
        const embedPromises = postsToFetch.map(url =>
          fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}&hidecaption=true&maxwidth=500`)
            .then(res => res.json())
            .then(data => data.html)
            .catch(() => null)
        )

        const embeds = await Promise.all(embedPromises)
        setEmbedHtml(embeds.filter(Boolean))
      } catch (err) {
        console.error('Error fetching Instagram embeds:', err)
        setError('Unable to load Instagram posts')
      } finally {
        setLoading(false)
      }
    }

    fetchEmbeds()
  }, [postUrls, limit])

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(Math.min(limit, postUrls.length || 3))].map((_, i) => (
          <div
            key={i}
            className="aspect-square bg-jerry-green-800/20 animate-pulse rounded-lg"
          />
        ))}
      </div>
    )
  }

  // No posts configured - show CTA
  if (postUrls.length === 0 || embedHtml.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 mb-6 text-lg">
          Follow us on Instagram for the latest updates and adventures
        </p>
        <a
          href="https://instagram.com/jerrycanspirits"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Follow @jerrycanspirits
        </a>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">{error}</p>
        <a
          href="https://instagram.com/jerrycanspirits"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-500 hover:text-gold-400 underline"
        >
          View on Instagram
        </a>
      </div>
    )
  }

  // Display embeds
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {embedHtml.map((html, index) => (
        <div
          key={index}
          className="bg-jerry-green-800/10 rounded-lg overflow-hidden border border-gold-500/20 hover:border-gold-500/40 transition-all"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ))}
    </div>
  )
}
