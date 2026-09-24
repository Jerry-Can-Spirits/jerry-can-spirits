// Product page reviews.
//
// Reviews are collected on Trustpilot and Google, not on the site. What the
// product page shows is a curated quotation of reviews that exist elsewhere,
// edited in Sanity as `review` documents, so a new quote is a Studio edit,
// not a pull request. Quotes are verbatim, trimmed with an ellipsis where
// shortened, never reworded.
//
// No aggregateRating / review JSON-LD is emitted from this data: a hand-picked
// subset must not be presented to search as the total. See
// docs/superpowers/specs/2026-06-22-product-review-excerpts-design.md.

export type ReviewSource = 'trustpilot' | 'google'

export interface ProductReview {
  quote: string
  author: string
  rating?: number // 1–5, as left on the platform; absent when not recorded
  date?: string
  source?: ReviewSource
  sourceUrl?: string
}

/** The GROQ projection in `productReviewsQuery`. */
export interface SanityReviewDoc {
  _id: string
  _createdAt: string
  quote?: string
  author?: string
  rating?: number
  date?: string
  source?: ReviewSource
  sourceUrl?: string
  order?: number
}

const SOURCES: ReadonlySet<string> = new Set(['trustpilot', 'google'])

/**
 * Sanity is edited by hand, so this is the line of defence: anything with a
 * rating outside 1 to 5 (when one is set), an empty quote or author, or an
 * unknown source is dropped rather than rendered wrong. Editor `order`
 * first, then newest.
 */
export function normaliseReviews(docs: SanityReviewDoc[]): ProductReview[] {
  return docs
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => {
      const rating = d.rating
      return (
        (rating === undefined || rating === null || (Number.isInteger(rating) && rating >= 1 && rating <= 5)) &&
        typeof d.quote === 'string' && d.quote.trim().length > 0 &&
        typeof d.author === 'string' && d.author.trim().length > 0 &&
        (d.source === undefined || SOURCES.has(d.source))
      )
    })
    .sort((a, b) => {
      const ao = a.d.order ?? Number.POSITIVE_INFINITY
      const bo = b.d.order ?? Number.POSITIVE_INFINITY
      if (ao !== bo) return ao - bo
      const at = Date.parse(a.d._createdAt) || 0
      const bt = Date.parse(b.d._createdAt) || 0
      return bt - at || a.i - b.i
    })
    .map(({ d }) => ({
      quote: d.quote!.trim(),
      author: d.author!.trim(),
      ...(d.rating ? { rating: d.rating } : {}),
      ...(d.date ? { date: d.date } : {}),
      source: d.source ?? 'trustpilot',
      ...(d.sourceUrl ? { sourceUrl: d.sourceUrl } : {}),
    }))
}
