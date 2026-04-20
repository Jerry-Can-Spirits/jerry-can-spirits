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
  if (!url || !url.includes('cdn.sanity.io')) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}auto=format&w=${width}&q=80`
}
