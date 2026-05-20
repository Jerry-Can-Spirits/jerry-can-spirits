# Live Google Ratings on /reviews/ — Design Spec

**Date:** 2026-05-20
**Status:** Design approved; ready for implementation plan.

**Revision (2026-05-20, post-approval):** Trustpilot dropped from scope. Their lowest API tier is Business Plus at ~£869/month, which isn't justified at current revenue. Trustpilot section on /reviews/ keeps its existing Review Collector widget and "View all on Trustpilot" link unchanged. The spec and plan still mention Trustpilot in some places for context; treat any "Trustpilot fetch" or "TRUSTPILOT_API_KEY" reference as deferred. The infrastructure (KV cache, scheduled handler, ratings-cache module) is kept platform-generic so adding Trustpilot later, if it ever makes sense, is a small follow-up rather than a rewrite.

## Goal

The `/reviews/` page displays live, regularly-refreshed rating numbers for Google and Trustpilot — average star rating and review count for each — alongside a JSON-LD `aggregateRating` field that gives the page a real social-proof signal. The numbers are fetched in the background on the existing hourly cron schedule and cached in KV. The page reads from KV at request time, never calls external APIs inline, and falls back gracefully to the existing static logo + "View on X" layout when KV is empty.

Yell and Trust A Veteran remain as static link sections — they have no usable public API and don't justify scraping.

## Why now

The page audit on 2026-05-20 surfaced the gap: real numbers exist on both platforms (we link out to them), but visitors who land on `/reviews/` see only logos and "View on X" links. The first hour of the page experience is unnecessarily abstract. Real ratings are concrete social proof and a search-engine signal. The fetch infrastructure (cron triggers, KV) already exists in the project, so the marginal cost is small.

## Scope

**In:**
- New scheduled handler at `src/lib/scheduled-ratings.ts` that runs hourly. Fetches Google Places Details + Trustpilot Business Unit info. Writes two separate KV keys (`rating:google`, `rating:trustpilot`) under the existing `SITE_OPS` KV namespace.
- New typed accessor at `src/lib/ratings-cache.ts` for reading and writing those KV entries.
- `/reviews/` page reads both keys at server-render time and displays a one-line rating + count row inside the Google and Trustpilot sections.
- WebPage JSON-LD on `/reviews/` gains an `about.aggregateRating` field sourced from Google (higher review count gives more reliable signal); a Trustpilot-sourced fallback is used when Google is empty.
- Wire the scheduled handler into the existing cron entry point so the `0 * * * *` trigger calls it.
- Two new secrets: `GOOGLE_MAPS_API_KEY`, `TRUSTPILOT_API_KEY`.
- Two new constants in code (not secrets): `GOOGLE_PLACE_ID`, `TRUSTPILOT_BUSINESS_UNIT_ID`.

**Out (deferred to follow-on PRs):**
- `/shop/product/<rum>/` Product JSON-LD `aggregateRating` for SERP star snippets. Higher SEO value than the /reviews/ JSON-LD change, but requires a review-sourcing sanity check (Google's rich results docs disallow combining reviews from disjoint sources into one Product aggregateRating).
- Yell or Trust A Veteran live ratings (no usable public APIs).
- Per-review display (we only surface aggregates).
- Admin UI to override or manually refresh values.
- Staleness indicator UI ("as of X hours ago"). Not requested.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Cron Trigger: 0 * * * * (already configured in wrangler.jsonc)    │
│         ↓                                                          │
│  Worker scheduled() handler dispatches to scheduled-ratings.ts     │
│         ↓                                                          │
│  fetchGoogleRating()         fetchTrustpilotRating()               │
│         ↓                              ↓                            │
│  KV: rating:google           KV: rating:trustpilot                 │
│  (independent writes; one failure does not block the other)         │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│  /reviews/ page (server component, currently force-static via       │
│  default; will use ISR with revalidate = 3600 so cache aligns       │
│  with the cron cadence)                                             │
│         ↓                                                          │
│  await getRating('google')  await getRating('trustpilot')          │
│         ↓                              ↓                            │
│  Render <RatingRow rating={...} count={...} /> inside the matching  │
│  platform section. If KV value is null, the row is omitted and the  │
│  rest of the section renders as it does today.                      │
└────────────────────────────────────────────────────────────────────┘
```

No external API call in the page render path. Sub-millisecond KV reads.

## KV data shape

Stored under existing `SITE_OPS` KV namespace.

```ts
interface PlatformRating {
  rating: number       // average star rating, 0-5, one decimal place (e.g. 4.8)
  count: number        // total number of reviews
  fetchedAt: string    // ISO 8601, UTC
  source: 'google' | 'trustpilot'
}
```

Keys:
- `rating:google`
- `rating:trustpilot`

Cron writes both. Page reads both. Old values are overwritten in place, no history.

No TTL is set on the KV entries. They are intentionally durable so that a cron outage does not erase the last-known-good rating. The cron handler logs when an API call fails so a prolonged failure is visible in Cloudflare logs.

## Scheduled handler

New file `src/lib/scheduled-ratings.ts`. Exports `runRatingsFetch(env: Env): Promise<void>`.

```ts
export async function runRatingsFetch(env: Env): Promise<void> {
  await Promise.allSettled([
    fetchAndStoreGoogle(env),
    fetchAndStoreTrustpilot(env),
  ])
}
```

`Promise.allSettled` so a single API failure does not abort the other call. Each fetch function logs its own errors via `console.error` so Sentry / Workers logs surface them.

### Google Places fetch

```ts
async function fetchAndStoreGoogle(env: Env): Promise<void> {
  if (!env.GOOGLE_MAPS_API_KEY || !env.GOOGLE_PLACE_ID) return

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${env.GOOGLE_PLACE_ID}&fields=rating,user_ratings_total&key=${env.GOOGLE_MAPS_API_KEY}`
  const res = await fetch(url)
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
  await writeRating(env, 'google', {
    rating: Math.round(data.result.rating * 10) / 10,
    count: data.result.user_ratings_total ?? 0,
  })
}
```

Cost: Place Details (Basic data) calls including `rating` and `user_ratings_total` fields fall under "Atmosphere data" SKU at $0.005 per call after the $200/month free credit on Google Maps Platform. 24 calls/day × 30 days = 720 calls/month — well inside the free tier.

### Trustpilot fetch

```ts
async function fetchAndStoreTrustpilot(env: Env): Promise<void> {
  if (!env.TRUSTPILOT_API_KEY || !env.TRUSTPILOT_BUSINESS_UNIT_ID) return

  const url = `https://api.trustpilot.com/v1/business-units/${env.TRUSTPILOT_BUSINESS_UNIT_ID}?apikey=${env.TRUSTPILOT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) {
    console.error('Trustpilot fetch failed', res.status)
    return
  }
  const data = await res.json() as {
    stars?: number
    trustScore?: number
    numberOfReviews?: { total?: number }
  }
  // Trustpilot stars are 1-5 integer; trustScore is 1-5 with decimals.
  // Use trustScore for display fidelity, fall back to stars.
  const rating = data.trustScore ?? data.stars
  if (rating == null) {
    console.error('Trustpilot response missing rating')
    return
  }
  await writeRating(env, 'trustpilot', {
    rating: Math.round(rating * 10) / 10,
    count: data.numberOfReviews?.total ?? 0,
  })
}
```

Trustpilot's public Business Unit endpoint requires application for an API key but is free with generous rate limits at our volume.

### Wiring into the cron

Cloudflare Workers fire cron triggers via the Worker's `scheduled()` handler. OpenNext on Cloudflare exposes this via the worker generated under `.open-next/worker.js`. The existing scheduled work for Pour IQ POS (`src/lib/pouriq/pos/scheduled.ts`) and trade review (`src/lib/scheduled-trade-review.ts`) is already wired in. Implementation plan must:

1. Identify the file that calls those existing scheduled functions (search for `runScheduledPosFetch` or equivalent).
2. Add `runRatingsFetch(env)` to the same dispatch.
3. Ensure it runs alongside the existing handlers, not in place of them, on the `0 * * * *` trigger.

## ratings-cache.ts (read API)

```ts
// src/lib/ratings-cache.ts
export type RatingSource = 'google' | 'trustpilot'

export interface PlatformRating {
  rating: number
  count: number
  fetchedAt: string
  source: RatingSource
}

export async function getRating(
  kv: KVNamespace,
  source: RatingSource,
): Promise<PlatformRating | null> {
  return kv.get<PlatformRating>(`rating:${source}`, 'json')
}

export async function writeRating(
  env: Env,
  source: RatingSource,
  data: Omit<PlatformRating, 'fetchedAt' | 'source'>,
): Promise<void> {
  const kv = env.SITE_OPS as KVNamespace
  const value: PlatformRating = {
    ...data,
    source,
    fetchedAt: new Date().toISOString(),
  }
  await kv.put(`rating:${source}`, JSON.stringify(value))
}
```

Pure functions. Both used by tests independently. No `getCloudflareContext` inside — caller passes the KV / env. Easier to test and the scheduled handler already has env in scope.

## /reviews/ page changes

The page becomes async to read KV.

```tsx
import { getSiteOpsKV } from '@/lib/kv'
import { getRating } from '@/lib/ratings-cache'

export const revalidate = 3600 // align with cron cadence

export default async function ReviewsPage() {
  const kv = await getSiteOpsKV()
  const [google, trustpilot] = await Promise.all([
    getRating(kv, 'google'),
    getRating(kv, 'trustpilot'),
  ])
  // ... pass into the existing JSX ...
}
```

A new presentational component `<RatingRow rating={...} count={...} platform="google" />` renders inside each platform's section, immediately under the logo and "View on X" link. Renders nothing when its rating prop is null.

Render output:

```
★★★★★  4.8 / 5  ·  12 reviews on Google
```

Stars rendered as five inline Unicode `★` characters wrapped in spans: filled stars get `text-gold-400`, empty stars get `text-gold-500/30`. Number-of-filled-stars is `Math.round(rating)`, so 4.8 renders as five filled (rounded up). The precise decimal sits next to the stars so the rounding loses no information.

## JSON-LD addition

Extend the existing WebPage schema with `about.aggregateRating`. Use Google when available; fall back to Trustpilot. Reference the Product, not the Organization, so the rating is correctly attached to Expedition Spiced Rum.

```ts
const primary = google ?? trustpilot
const aggregateRating = primary
  ? {
      '@type': 'AggregateRating',
      'ratingValue': primary.rating.toFixed(1),
      'reviewCount': primary.count.toString(),
      'bestRating': '5',
      'worstRating': '1',
      'itemReviewed': {
        '@type': 'Product',
        'name': 'Expedition Spiced Rum',
        'url': 'https://jerrycanspirits.co.uk/shop/product/jerry-can-spirits-expedition-spiced-rum/',
      },
    }
  : undefined
```

Add as `about.aggregateRating` (the page is "about" the product whose rating is being aggregated).

**SEO honesty note:** SERP star snippets for products in Google's rich results require the `aggregateRating` on the Product page itself, not on a WebPage that references the product. So this is a consistency upgrade for the /reviews/ schema only. The bigger SEO win comes from porting an equivalent block to `/shop/product/jerry-can-spirits-expedition-spiced-rum/` in a follow-up PR. That follow-up must use a single review source (Google reviews are not for the product; Trustpilot reviews are) to satisfy Google's structured-data guidelines.

## Failure handling

| Situation | Behaviour |
|---|---|
| KV has a fresh rating for a platform | Live rating row renders in that section |
| KV is empty for a platform (first run or cleared) | Rating row is omitted; that platform's section renders exactly as it does today |
| Cron handler fails to call one API | Other platform updates; failed platform retains last value in KV |
| Cron handler fails both calls | Both KV entries retain last values; page continues serving them |
| Both KV entries empty | Page renders as it does today (no regression) |
| API returns 200 OK with malformed payload | Handler logs error, KV not updated |

No timeout retries inside the handler (cron will run again in an hour). No alert routing — Cloudflare logs are the visibility surface.

## Configuration

### Secrets (set via wrangler)

```
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put TRUSTPILOT_API_KEY
```

### Constants (in code, environment-agnostic)

In `src/lib/ratings-config.ts` (new file):

```ts
// Filled in once during implementation by looking up the values via the
// methods documented in "Operator prerequisites" below. Both are public,
// non-secret identifiers and live in source.
export const GOOGLE_PLACE_ID = '' // empty until operator looks it up
export const TRUSTPILOT_BUSINESS_UNIT_ID = '' // empty until operator looks it up
```

The Place ID is derived from the existing `https://g.page/r/CdkZacM6VKi-EAE` link via the Place ID Finder. The Trustpilot Business Unit ID can be looked up once via the `find` endpoint and pasted in. Until both values are non-empty, the corresponding fetch function short-circuits and writes nothing — the page renders as it does today.

### Cloudflare Worker bindings

The existing `SITE_OPS` KV binding is reused. No new wrangler.jsonc bindings.

The existing cron `0 * * * *` trigger is reused. No new cron schedule.

## Operator prerequisites (parallel to implementation)

1. **Google Cloud Console**: pick or create a project, enable "Places API", create an API key. Restrict the key by HTTP referrer (jerrycanspirits.co.uk) and/or IP allowlist (Cloudflare egress IPs). Provide the key via `wrangler secret put GOOGLE_MAPS_API_KEY`.
2. **Google Place ID**: use Google's Place ID Finder (https://developers.google.com/maps/documentation/places/web-service/place-id) to find "Jerry Can Spirits Ltd". Paste into the `GOOGLE_PLACE_ID` constant.
3. **Trustpilot API key**: register at https://businessapp.b2b.trustpilot.com and request a public API key. Provide via `wrangler secret put TRUSTPILOT_API_KEY`.
4. **Trustpilot Business Unit ID**: derive once via `GET https://api.trustpilot.com/v1/business-units/find?name=jerrycanspirits.co.uk&apikey=...`. Paste the returned id into `TRUSTPILOT_BUSINESS_UNIT_ID`.

Items 1 and 3 are external account setup the operator must do. Items 2 and 4 are one-off lookups that take seconds once the keys are in hand.

## Testing

Manual smoke tests on a local dev build with KV bindings:

1. **Empty state**: KV cleared → `/reviews/` renders exactly like today's production. Verify the JSON-LD does not include an `aggregateRating` field.
2. **Google only**: write `rating:google` manually via `wrangler kv key put` → `/reviews/` shows the rating row in the Google section, JSON-LD `aggregateRating` references the Google rating.
3. **Both platforms**: write both keys → both sections show rating rows. JSON-LD references Google's rating (the configured priority).
4. **Trustpilot only**: write only `rating:trustpilot` → Trustpilot rating row renders, Google section falls back to static layout, JSON-LD references the Trustpilot rating.
5. **Cron handler smoke test**: trigger the scheduled handler manually via `wrangler dev --test-scheduled` then `curl http://localhost:8787/__scheduled?cron=*+*+*+*+*` — verify KV is written and the page reflects the change.
6. **Type check**: `npx tsc --noEmit` clean.

No automated tests in this PR. Matches the precedent set by `menu-copy`, `variance-lite`, and the recent expedition-log work.

## Risks

- **Operator delay on API key acquisition.** Implementation can complete without the keys (handler short-circuits when env vars are missing), but the feature is dark until keys land. Mitigation: spec is explicit about the operator-side steps so they can run in parallel.
- **Google API quota anomaly.** 720 calls/month is well inside the free tier, but if someone duplicates the cron handler or misconfigures the schedule we could blow through it. Mitigation: handler short-circuits when env vars are missing rather than retrying tightly; cron schedule is reused, not added.
- **Trustpilot rate-limiting.** Trustpilot's public API has rate limits we have not negotiated. 24 calls/day per business unit should be well inside any reasonable cap. Mitigation: same as above — short-circuit and log.
- **JSON-LD claim mismatch.** If the rating we show via JSON-LD diverges from the rating actually visible on the linked platform (because we cache and the platform has since updated), Google's structured-data guidance is forgiving for short windows. With hourly refreshes, the largest divergence is ~1 hour, which is acceptable.

## Open questions

None at spec-approval time.
