'use client'

import { useEffect } from 'react'

interface InstagramFeedProps {
  postUrls?: string[]
  showCaptions?: boolean
  limit?: number
}

declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void
      }
    }
  }
}

/**
 * Instagram Feed using native Instagram embeds
 *
 * SETUP:
 * 1. Create a post on your Instagram account (@jerrycanspirits)
 * 2. Click the three dots (...) on the post and select "Copy link"
 * 3. Add the URL to the postUrls array in page.tsx
 * 4. Instagram's embed script handles the rest!
 *
 * How to get Instagram post URLs:
 * - Mobile: Post → ... menu → "Copy link"
 * - Desktop: Click post → Copy URL from browser
 * - Format: https://www.instagram.com/p/POST_ID/
 *
 * Example:
 * <InstagramFeed
 *   postUrls={[
 *     'https://www.instagram.com/p/DS940WfjDZV/',
 *   ]}
 *   showCaptions={true}
 * />
 */
export default function InstagramFeed({
  postUrls = [],
  showCaptions = true,
  limit = 6
}: InstagramFeedProps) {
  // Load Instagram embed script and process embeds
  useEffect(() => {
    if (postUrls.length === 0) return

    // Load Instagram embed script if not already loaded
    if (!window.instgrm) {
      const script = document.createElement('script')
      script.async = true
      script.src = '//www.instagram.com/embed.js'
      document.body.appendChild(script)

      script.onload = () => {
        if (window.instgrm?.Embeds) {
          window.instgrm.Embeds.process()
        }
      }
    } else {
      // Script already loaded, just process embeds
      window.instgrm.Embeds.process()
    }
  }, [postUrls])

  // No posts configured - show CTA
  if (postUrls.length === 0) {
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

  // Extract post ID from Instagram URL
  const getPostId = (url: string) => {
    const match = url.match(/\/p\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  }

  // Display Instagram posts using native embed format
  const postsToShow = postUrls.slice(0, limit)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {postsToShow.map((url, index) => {
        const postId = getPostId(url)
        if (!postId) return null

        const embedUrl = `https://www.instagram.com/p/${postId}/embed${showCaptions ? '/captioned' : ''}`

        return (
          <div
            key={index}
            className="bg-jerry-green-800/10 rounded-lg overflow-hidden border border-gold-500/20 hover:border-gold-500/40 transition-all"
          >
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={url}
              data-instgrm-version="14"
              style={{
                background: '#FFF',
                border: 0,
                borderRadius: '3px',
                boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
                margin: '1px',
                maxWidth: '540px',
                minWidth: '326px',
                padding: 0,
                width: 'calc(100% - 2px)'
              }}
            >
              <div style={{ padding: '16px' }}>
                <a
                  href={url}
                  style={{
                    background: '#FFFFFF',
                    lineHeight: 0,
                    padding: 0,
                    textAlign: 'center',
                    textDecoration: 'none',
                    width: '100%'
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View this post on Instagram
                </a>
              </div>
            </blockquote>
          </div>
        )
      })}
    </div>
  )
}
