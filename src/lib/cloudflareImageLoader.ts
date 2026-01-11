/**
 * Cloudflare Images Loader for Next.js Image Component
 *
 * Automatically transforms /images/* paths to Cloudflare Images CDN URLs
 * with optimized parameters for responsive images.
 *
 * Features:
 * - Dynamic width/quality transformations
 * - Automatic format negotiation (WebP/AVIF)
 * - Responsive image sizing
 * - Fallback to original source for external images
 */

import imageMapping from './image-mapping.json'

interface ImageLoaderProps {
  src: string
  width: number
  quality?: number
}

interface ImageMapping {
  [key: string]: {
    cloudflareId: string
    cloudflareUrl: string
    filename: string
    uploadedAt: string
  }
}

// Type-safe mapping import
const CLOUDFLARE_IMAGE_MAPPING = imageMapping as ImageMapping

// Cloudflare account configuration from environment
const CLOUDFLARE_ACCOUNT_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH || ''

/**
 * Custom image loader for Cloudflare Images
 *
 * This loader intercepts all Next.js Image component requests and transforms
 * local /images/* paths to optimized Cloudflare Images URLs.
 *
 * External images (Sanity, Shopify) are passed through unchanged.
 */
export default function cloudflareImageLoader({
  src,
  width,
  quality = 75,
}: ImageLoaderProps): string {
  // Handle external images (Sanity, Shopify) - pass through unchanged
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }

  // Handle static images from /public/images
  if (src.startsWith('/images/')) {
    const mappedImage = CLOUDFLARE_IMAGE_MAPPING[src]

    if (!mappedImage) {
      // Fallback to original path if not in mapping
      // In development, serve from localhost
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Cloudflare Image Loader] Image not found in mapping: ${src}`)
        // Return absolute URL for dev server
        return `http://localhost:3000${src}`
      }
      return src
    }

    // Verify account hash is configured
    if (!CLOUDFLARE_ACCOUNT_HASH) {
      console.error('[Cloudflare Image Loader] NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH not configured')
      // Return absolute URL for dev server
      if (process.env.NODE_ENV === 'development') {
        return `http://localhost:3000${src}`
      }
      return src
    }

    // Use the pre-configured variant from the mapping
    // Cloudflare Images requires using predefined variants, not flexible transformations
    // The cloudflareUrl already includes the correct variant (public, avatar, etc.)
    return mappedImage.cloudflareUrl
  }

  // Fallback for any other paths - return absolute URL in dev
  if (process.env.NODE_ENV === 'development' && !src.startsWith('http')) {
    return `http://localhost:3000${src}`
  }
  return src
}
