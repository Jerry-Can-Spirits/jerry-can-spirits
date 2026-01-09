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
      // This allows development to continue even if migration isn't complete
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Cloudflare Image Loader] Image not found in mapping: ${src}`)
      }
      return src
    }

    // Verify account hash is configured
    if (!CLOUDFLARE_ACCOUNT_HASH) {
      console.error('[Cloudflare Image Loader] NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH not configured')
      return src
    }

    // Build Cloudflare Images URL with transformations
    // Format: https://imagedelivery.net/<ACCOUNT_HASH>/<IMAGE_ID>/w=<width>,q=<quality>,f=auto
    return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${mappedImage.cloudflareId}/w=${width},q=${quality},f=auto`
  }

  // Fallback for any other paths
  return src
}
