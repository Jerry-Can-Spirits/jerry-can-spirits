import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from './ratings-cache'
import { TRUSTPILOT_PUBLIC } from './trustpilot-assets'

export interface TrustpilotScore {
  rating: number
  count: number
}

// The one place a Trustpilot score comes from. Every surface that states the
// TrustScore (the product page, the pull-quote strip, the reviews page, the
// offer page, llms.txt) calls this, so they cannot disagree: the hourly cron's
// KV figure first, and the hand-checked constant only when KV holds nothing or
// there is no runtime context (local build, tests). Until 17 Oct 2026 the
// product page fell back to the constant while the other surfaces hid the row,
// so one page read 4.6 and the rest nothing; tests/unit/trustpilot-score.test.ts
// pins every rendering to this helper.
export async function getTrustpilotScore(): Promise<TrustpilotScore> {
  try {
    const { env } = await getCloudflareContext({ async: true })
    const live = await getRating(env.SITE_OPS as KVNamespace, 'trustpilot')
    if (live) return { rating: live.rating, count: live.count }
  } catch {
    // No Cloudflare context: fall through to the checked figure.
  }
  return { rating: TRUSTPILOT_PUBLIC.rating, count: TRUSTPILOT_PUBLIC.reviews }
}
