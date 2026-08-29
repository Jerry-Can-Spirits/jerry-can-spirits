import Image from 'next/image'
import type { RatingSource } from '@/lib/ratings-cache'
import { trustpilotStarImage } from '@/lib/trustpilot-assets'

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
  // Trustpilot ratings render the official star art when we hold the asset
  // for the live score, because their guidelines expect the official marks
  // with a TrustScore. Google ratings, and any score without art, use the
  // drawn stars, which adapt to whatever the cron reports.
  const officialStars = platform === 'trustpilot' ? trustpilotStarImage(rating) : undefined
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
      {officialStars ? (
        <Image
          src={officialStars}
          alt=""
          aria-hidden="true"
          width={130}
          height={24}
          className="inline-block h-6 w-auto mr-2 align-middle"
        />
      ) : (
        <span className="text-base mr-2">{stars}</span>
      )}
      <span className="font-semibold text-parchment-100">{rating.toFixed(1)} / 5</span>
      <span className="text-parchment-400"> · {count} {reviewWord} on {PLATFORM_LABEL[platform]}</span>
    </p>
  )
}
