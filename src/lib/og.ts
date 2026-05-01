/**
 * Open Graph image helpers — every page gets a 1200×630 image backed by an
 * existing Cloudflare Images asset (or a Sanity/Shopify CDN URL on dynamic
 * pages). Sizing is delegated to the source CDN so we ship no static OG file.
 */

const CF_DELIVERY_BASE = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'
const CF_OG_TRANSFORM = 'w=1200,h=630,fit=cover,q=85'

type OgImage = {
  url: string
  width: 1200
  height: 630
  alt: string
}

/**
 * Build an OG image array from a Cloudflare Images asset.
 * Accepts a CF image ID, a full imagedelivery.net URL, or any other absolute URL.
 */
export function cfOgImage(idOrUrl: string, alt: string): OgImage[] {
  let url: string
  if (idOrUrl.startsWith('http')) {
    url = idOrUrl
  } else {
    url = `${CF_DELIVERY_BASE}/${idOrUrl}/${CF_OG_TRANSFORM}`
  }
  return [{ url, width: 1200, height: 630, alt }]
}

/** Brand-default OG: homepage hero. Used when no page-specific image exists. */
export const OG_IMAGE: OgImage[] = cfOgImage(
  'beed84d3-c77d-4ecf-c85f-29719bdea000',
  'Jerry Can Spirits® — Veteran-Owned British Spiced Rum, distilled in Wales',
)

/** OG image for cocktail/Field Manual section pages. */
export const OG_IMAGE_COCKTAIL: OgImage[] = cfOgImage(
  'images-hero-cocktail_hero-webp',
  'Jerry Can Spirits® Field Manual — cocktail recipes',
)

/** OG image for shop/spirits pages without a product hero. */
export const OG_IMAGE_SPIRITS: OgImage[] = cfOgImage(
  'images-hero-compass_still-webp',
  'Jerry Can Spirits® — small-batch British spirits',
)

export const baseOpenGraph = {
  type: 'website' as const,
  locale: 'en_GB',
  siteName: 'Jerry Can Spirits®',
  images: OG_IMAGE,
}
