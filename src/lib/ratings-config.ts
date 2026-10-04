// Public identifier (not a secret) for the live ratings cron job. The
// Business Profile is a pure service-area listing with no public address, so
// the Place ID Finder cannot see it. Found on 4 October 2026 with a Places
// API (New) Text Search for "Jerry Can Spirits" with
// includePureServiceAreaBusinesses set to true. If the constant is ever
// emptied, the Google fetcher short-circuits and writes nothing, and the
// /reviews/ page renders without a Google rating.

export const GOOGLE_PLACE_ID = 'ChIJwUvSTHgfii8R2RlpwzpUqL4'

// Public Trustpilot business unit id for jerrycanspirits.co.uk — the same
// identifier the TrustBox embeds ship to every browser (see the default in
// the retired TrustBox embed), not a secret. Used by the hourly cron to read the
// live review count from the public trustbox-data endpoint.
export const TRUSTPILOT_BUSINESS_UNIT_ID = '68fb4a6f43f3e1eb09b5e0ea'
