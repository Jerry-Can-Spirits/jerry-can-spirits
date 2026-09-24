/**
 * Reviews from Sanity, shaped for the product page.
 *
 * Sanity is edited by hand, so the mapper is the line of defence: a review
 * with a rating outside 1 to 5, an empty quote or an unknown source is
 * dropped rather than rendered wrong, and ordering follows the editor's
 * `order` field first, then newest first.
 */
import { describe, expect, it } from 'vitest'
import { normaliseReviews, type SanityReviewDoc } from '@/lib/product-reviews'

function doc(over: Partial<SanityReviewDoc> = {}): SanityReviewDoc {
  return {
    _id: 'r1',
    _createdAt: '2026-06-01T00:00:00Z',
    quote: 'Really impressed with this.',
    author: 'Tom',
    rating: 5,
    date: 'June 2026',
    source: 'trustpilot',
    ...over,
  }
}

describe('normaliseReviews', () => {
  it('keeps a well-formed review with its fields', () => {
    const [r] = normaliseReviews([doc({ sourceUrl: 'https://uk.trustpilot.com/reviews/abc' })])
    expect(r).toEqual({ quote: 'Really impressed with this.', author: 'Tom', rating: 5, date: 'June 2026', source: 'trustpilot', sourceUrl: 'https://uk.trustpilot.com/reviews/abc' })
  })

  it('keeps a review with no rating, without inventing one', () => {
    const [r] = normaliseReviews([doc({ rating: undefined })])
    expect(r).not.toHaveProperty('rating')
  })

  it('drops reviews with an invalid rating, an empty quote or an unknown source', () => {
    expect(normaliseReviews([doc({ rating: 0 }), doc({ rating: 6 }), doc({ rating: 4.5 })])).toEqual([])
    expect(normaliseReviews([doc({ quote: '   ' })])).toEqual([])
    expect(normaliseReviews([doc({ source: 'yelp' as never })])).toEqual([])
  })

  it('orders by the editor order first, then newest first', () => {
    expect(normaliseReviews([
      doc({ _id: 'a', _createdAt: '2026-05-01T00:00:00Z', author: 'a' }),
      doc({ _id: 'b', _createdAt: '2026-07-01T00:00:00Z', author: 'b' }),
      doc({ _id: 'c', _createdAt: '2026-06-01T00:00:00Z', order: 1, author: 'c' }),
      doc({ _id: 'd', _createdAt: '2026-01-01T00:00:00Z', order: 0, author: 'd' }),
    ]).map((r) => r.author)).toEqual(['d', 'c', 'b', 'a'])
  })

  it('trims the quote and author', () => {
    const [r] = normaliseReviews([doc({ quote: '  Great.  ', author: ' Mark ' })])
    expect(r.quote).toBe('Great.')
    expect(r.author).toBe('Mark')
  })
})
