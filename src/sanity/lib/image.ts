import createImageUrlBuilder from '@sanity/image-url'
import { SanityImageSource } from "@sanity/image-url/lib/types/types";

import { dataset, projectId } from '../env'

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset })

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source).auto('format')
}

// Appends Sanity CDN format + width params to raw asset->url strings from GROQ projections.
// OG tags use these raw URLs, so without this they serve full-size PNGs to crawlers.
export function sanityOgUrl(url: string | undefined, width = 1200): string | undefined {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'cdn.sanity.io') return url
    parsed.searchParams.set('auto', 'format')
    parsed.searchParams.set('w', String(width))
    parsed.searchParams.set('q', '80')
    return parsed.toString()
  } catch {
    return url
  }
}
