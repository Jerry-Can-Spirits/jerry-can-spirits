// Curated Trustpilot review excerpts, keyed by Shopify product handle.
//
// Trustpilot Starter has no API, so these are hand-picked from genuine
// reviews. Quotes are verbatim (trimmed with an ellipsis where shortened,
// never reworded). Only handles with reviews appear here; everything else
// keeps the "reviews coming soon" placeholder on its product page.
//
// No aggregateRating / review JSON-LD is emitted from this data — see
// docs/superpowers/specs/2026-06-22-product-review-excerpts-design.md.

export interface ProductReview {
  quote: string
  author: string
  rating: number // 1–5, as left on Trustpilot
  date?: string
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

export function getProductReviews(handle: string): ProductReview[] {
  return PRODUCT_REVIEWS[handle] ?? []
}
