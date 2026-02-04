'use client'

interface InstagramFeedProps {
  postUrls?: string[]
  showCaptions?: boolean
  limit?: number
}

/**
 * Instagram Feed using Cloudflare Zaraz server-side embeds
 *
 * IMPORTANT: This uses Zaraz's Instagram Managed Component for:
 * - Server-side rendering (no client-side JavaScript)
 * - Better privacy (no direct browser-to-Instagram communication)
 * - Better performance (content cached and served from your domain)
 * - No login-wall issues (Zaraz fetches server-side)
 *
 * SETUP:
 * 1. Enable "Instagram" tool in Cloudflare Zaraz dashboard
 * 2. Post content on Instagram (@jerrycanspirits)
 * 3. Copy the post URL (format: https://www.instagram.com/p/POST_ID/)
 * 4. Add URL to postUrls array in page.tsx
 * 5. Zaraz automatically renders the embed server-side!
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

  // No posts configured - show CTA
  if (postUrls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-parchment-200 mb-6 text-lg">
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

  // Display Instagram posts using Zaraz custom elements
  const postsToShow = postUrls.slice(0, limit)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {postsToShow.map((url, index) => (
        <div
          key={index}
          className="bg-jerry-green-800/10 rounded-lg overflow-hidden border border-gold-500/20 hover:border-gold-500/40 transition-all"
        >
          {/* Zaraz Instagram Managed Component - renders server-side */}
          <instagram-post
            post-url={url}
            captions={showCaptions ? 'true' : 'false'}
          />
        </div>
      ))}
    </div>
  )
}
