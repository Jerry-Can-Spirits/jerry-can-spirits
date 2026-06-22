import type { ProductReview } from '@/lib/product-reviews'

const TRUSTPILOT_PROFILE = 'https://uk.trustpilot.com/review/jerrycanspirits.co.uk'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < rating ? 'text-gold-400' : 'text-gold-500/20'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.07 9.771c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

export default function ProductReviews({ reviews }: { reviews: ProductReview[] }) {
  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        {reviews.map((r, i) => (
          <figure
            key={`${r.author}-${i}`}
            className="bg-jerry-green-800/30 border border-gold-500/20 rounded-xl p-5 flex flex-col"
          >
            <Stars rating={r.rating} />
            <blockquote className="text-parchment-200 leading-relaxed mt-3 mb-4 flex-1">
              &ldquo;{r.quote}&rdquo;
            </blockquote>
            <figcaption className="text-sm text-parchment-400">
              <span className="text-parchment-200 font-medium">{r.author}</span>
              {r.date && <span> · {r.date}</span>}
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="text-xs text-parchment-500 mt-6">
        Reviews from{' '}
        <a
          href={TRUSTPILOT_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-300 hover:text-gold-200 underline"
        >
          Trustpilot
        </a>
        . A selection of verified customer reviews.
      </p>
    </div>
  )
}
