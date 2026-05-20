// Hourly cron job: fetch Google Places rating for Jerry Can Spirits and
// cache in KV under the rating:google key. Wired into the scheduled()
// handler in cloudflare-worker-entry.mjs.
//
// The fetcher short-circuits silently when its API key or place ID is
// missing, so the code can ship dark and start working as soon as the
// operator fills in the key via wrangler secret put and the constant
// via a code commit.

import { writeRating } from './ratings-cache'
import { GOOGLE_PLACE_ID } from './ratings-config'

interface RatingsEnv {
  SITE_OPS: KVNamespace
  GOOGLE_MAPS_API_KEY?: string
}

export async function runRatingsFetch(env: RatingsEnv): Promise<void> {
  await fetchAndStoreGoogle(env)
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
