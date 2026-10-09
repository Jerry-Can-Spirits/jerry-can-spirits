// Official Trustpilot brand assets, downloaded from the Trustpilot business
// dashboard's Marketing Assets library and hosted on Cloudflare Images.
// Trustpilot's brand guidelines expect the official marks when a TrustScore
// is displayed; the drawn-glyph stars in RatingRow remain the fallback for
// scores we hold no official art for.
//
// One module so every surface pulls the same files: the pull-quote strip,
// the reviews page, and RatingRow all read from here.

const CF_IMG = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

export const TRUSTPILOT_LOGO = {
  // Green star, white wordmark: the full-colour lockup for dark grounds.
  // This is the default on this site, whose surfaces are jerry green.
  onDark: `${CF_IMG}/3e57ab89-5e38-4c16-cfef-f345025ad700/public`,
  // Green star, black wordmark: for light grounds (print sheets, white plates).
  onLight: `${CF_IMG}/c1295004-0f31-433a-89df-dc69377ab400/public`,
  // Single-colour variants, for surfaces where the green star would clash.
  allWhite: `${CF_IMG}/76f19b10-b33a-4aad-ce3f-9060e48ed100/public`,
  allBlack: `${CF_IMG}/ea218dd1-de86-4cd1-d48e-a40f88056900/public`,
} as const

// Star art by half-star score. Deliberately sparse: only scores we hold the
// official asset for. The score is a live fact from the ratings cron, so the
// art is looked up against it rather than hardcoded anywhere - when the
// TrustScore moves to a score not in this map, RatingRow falls back to its
// drawn stars and the new asset gets added here.
const TRUSTPILOT_STARS: Record<string, string> = {
  '4.5': `${CF_IMG}/965706cd-27c4-43a6-4d7b-5ea5c4f25100/public`,
  '5.0': `${CF_IMG}/6c4e7196-983e-4042-41f9-ab4c700bcd00/public`,
}

// The public TrustScore and review count as Trustpilot shows them on the
// profile. They are Trustpilot's figures, stated as such beside the product
// page's "Customer reviews" link (Audit B, 3 Oct 2026). They are not an
// on-site aggregate and must never feed JSON-LD. Checked by hand on the date
// given. The product page reads the scheduled KV figure first and falls back
// to these only when KV is empty; update all three together, monthly.
export const TRUSTPILOT_PROFILE_URL = 'https://uk.trustpilot.com/review/jerrycanspirits.co.uk'
export const TRUSTPILOT_PUBLIC = { score: '4.6', reviews: 34, checked: '2026-10-03' } as const

/** The official star image for a rating, or undefined when we hold no art
 *  for its half-star rounding. */
export function trustpilotStarImage(rating: number): string | undefined {
  return TRUSTPILOT_STARS[(Math.round(rating * 2) / 2).toFixed(1)]
}
