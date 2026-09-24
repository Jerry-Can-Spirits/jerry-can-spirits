// Product page reviews.
//
// Reviews are collected on Trustpilot and Google, not on the site. What the
// product page shows is a curated quotation of reviews that exist elsewhere,
// now edited in Sanity as `review` documents rather than in this file, so a
// new quote is a Studio edit, not a pull request. Quotes are verbatim,
// trimmed with an ellipsis where shortened, never reworded.
//
// No aggregateRating / review JSON-LD is emitted from this data: a hand-picked
// subset must not be presented to search as the total. See
// docs/superpowers/specs/2026-06-22-product-review-excerpts-design.md.
//
// The hardcoded list below is the fallback until the Sanity documents exist
// (migration: JCS-ops/sanity-scripts/migrate-product-reviews.ts). It is read
// only when Sanity returns nothing for a handle, and goes in the next PR.

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

const PRODUCT_REVIEWS: Record<string, ProductReview[]> = {
  'jerry-can-spirits-expedition-spiced-rum': [
    {
      quote: 'Really impressed with this. I normally drink kraken and this is a lot better.',
      author: 'Tom Greenwood',
      rating: 5,
      date: 'June 2026',
    },
    {
      quote: 'Probably the best rum I’ve had for years!',
      author: 'Michael Young',
      rating: 5,
      date: 'June 2026',
    },
    {
      quote: 'Fantastic spiced rum. As a newly established brand, the rum is absolutely brilliant. I have experimented with it in a few cocktails and have thoroughly enjoyed it. The combination of flavours is wonderful, especially the ginger in it. Highly recommend.',
      author: 'Mbunya',
      rating: 5,
      date: 'May 2026',
    },
    {
      quote: 'Great guys to deal with, awesome product, the smell, the taste are stunning, so smooth, great over ice… plus the bottle is unique, I’ll be ordering another one to go in my collection.',
      author: 'Mark',
      rating: 5,
      date: 'June 2026',
    },
    {
      quote: 'One word ‘Great’. Product is great and great people. I will definitely buy from them again once I’ve finished the 3 bottles I have.',
      author: 'Adam',
      rating: 5,
      date: 'May 2026',
    },
  ],
  'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles': [
    {
      quote: 'Great tasty spiced rum. It’s great in a mule but my favourite is a couple of shots on ice... yum!!',
      author: 'Andy Mc',
      rating: 5,
      date: 'May 2026',
    },
  ],
  'jerry-can-spirits-expedition-spiced-rum-presentation-box': [
    {
      quote: 'It’s a box..... not much more to say really.... does what it says on the tin... or cardboard in this case.',
      author: 'Chris',
      rating: 5,
      date: 'June 2026',
    },
  ],
  'crystal-ice-hiball-42cl': [
    {
      quote: 'Ideal for your rum n ice.',
      author: 'Andy Mc',
      rating: 5,
      date: 'May 2026',
    },
  ],
}

/** Fallback only; see the file comment. */
export function getProductReviews(handle: string): ProductReview[] {
  return PRODUCT_REVIEWS[handle] ?? []
}

/** Every hardcoded review with its handle, for the one-off migration into Sanity. */
export function allHardcodedReviews(): Array<ProductReview & { handle: string }> {
  return Object.entries(PRODUCT_REVIEWS).flatMap(([handle, list]) => list.map((r) => ({ ...r, handle })))
}
