// Hourly cron job: fetch Google Places rating for Jerry Can Spirits and
// cache in KV under the rating:google key. Wired into the scheduled()
// handler in cloudflare-worker-entry.mjs.
//
// The fetcher short-circuits silently when its API key or place ID is
// missing, so the code can ship dark and start working as soon as the
// operator fills in the key via wrangler secret put and the constant
// via a code commit.

import { writeRating } from './ratings-cache'
import { GOOGLE_PLACE_ID, TRUSTPILOT_BUSINESS_UNIT_ID } from './ratings-config'

interface RatingsEnv {
  SITE_OPS: KVNamespace
  GOOGLE_MAPS_API_KEY?: string
}

export async function runRatingsFetch(env: RatingsEnv): Promise<void> {
  await Promise.all([fetchAndStoreGoogle(env), fetchAndStoreTrustpilot(env)])
}

async function fetchAndStoreGoogle(env: RatingsEnv): Promise<void> {
  if (!env.GOOGLE_MAPS_API_KEY || !GOOGLE_PLACE_ID) return

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=rating,user_ratings_total&key=${env.GOOGLE_MAPS_API_KEY}`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    console.error('Google Places fetch threw', err)
    return
  }
  if (!res.ok) {
    console.error('Google Places fetch failed', res.status)
    return
  }
  const data = await res.json() as {
    status: string
    result?: { rating?: number; user_ratings_total?: number }
  }
  if (data.status !== 'OK' || data.result?.rating == null) {
    console.error('Google Places response unusable', data.status)
    return
  }
  await writeRating(env.SITE_OPS, 'google', {
    rating: Math.round(data.result.rating * 10) / 10,
    count: data.result.user_ratings_total ?? 0,
  })
}

// Reads the public trustbox-data endpoint — the same unauthenticated JSON
// the TrustBox widget script fetches in the browser — so no API key is
// needed. The template id is any valid TrustBox template; it only shapes
// widget presentation fields we ignore.
async function fetchAndStoreTrustpilot(env: RatingsEnv): Promise<void> {
  if (!TRUSTPILOT_BUSINESS_UNIT_ID) return

  const url = `https://widget.trustpilot.com/trustbox-data/5419b6a8b0d04a076446a9ad?businessUnitId=${TRUSTPILOT_BUSINESS_UNIT_ID}&locale=en-GB`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    console.error('Trustpilot trustbox-data fetch threw', err)
    return
  }
  if (!res.ok) {
    console.error('Trustpilot trustbox-data fetch failed', res.status)
    return
  }
  const data = await res.json() as {
    businessUnit?: {
      trustScore?: number
      numberOfReviews?: { total?: number }
    }
  }
  const trustScore = data.businessUnit?.trustScore
  const total = data.businessUnit?.numberOfReviews?.total
  if (trustScore == null || total == null) {
    console.error('Trustpilot trustbox-data response unusable')
    return
  }
  await writeRating(env.SITE_OPS, 'trustpilot', {
    rating: Math.round(trustScore * 10) / 10,
    count: total,
  })
}
