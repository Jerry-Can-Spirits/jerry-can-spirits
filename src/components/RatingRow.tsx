import type { RatingSource } from '@/lib/ratings-cache'

interface Props {
  rating: number
  count: number
  platform: RatingSource
}

const PLATFORM_LABEL: Record<RatingSource, string> = {
  google: 'Google',
  trustpilot: 'Trustpilot',
}

export function RatingRow({ rating, count, platform }: Props) {
  const filled = Math.round(rating)
  const stars = Array.from({ length: 5 }, (_, i) => (
    <span
      key={i}
      className={i < filled ? 'text-gold-400' : 'text-gold-500/30'}
      aria-hidden="true"
    >
      ★
    </span>
  ))
  const reviewWord = count === 1 ? 'review' : 'reviews'
  return (
    <p className="text-center text-sm text-parchment-200 mb-4">
      <span className="text-base mr-2">{stars}</span>
      <span className="font-semibold text-parchment-100">{rating.toFixed(1)} / 5</span>
      <span className="text-parchment-400"> · {count} {reviewWord} on {PLATFORM_LABEL[platform]}</span>
    </p>
  )
}
