# Reviews Live Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Revised 2026-05-20: Google-only scope.** Trustpilot API access starts at ~£869/month (Business Plus), so live Trustpilot ratings are out of scope. The Trustpilot section of `/reviews/` is unchanged from PR #704. All references below to "Trustpilot fetch", "TRUSTPILOT_API_KEY", "TRUSTPILOT_BUSINESS_UNIT_ID", or `rating:trustpilot` KV writes should be SKIPPED. The KV / cache / handler module is kept generic so adding Trustpilot later is a small follow-up.

**Goal:** Display live Google rating and review count on `/reviews/` and add `aggregateRating` to its JSON-LD, sourced from a Cloudflare KV cache that is refreshed hourly by the existing cron trigger.

**Architecture:** A new scheduled handler (`runRatingsFetch`) is wired into the existing `cloudflare-worker-entry.mjs` `scheduled()` dispatch alongside `runHourlyPosBackfill`. It calls Google Places Details and writes the result to `rating:google` in the existing `SITE_OPS` namespace. The `/reviews/` page (newly async, ISR `revalidate = 3600`) reads the key at server-render time, renders a presentational `RatingRow` inside the Google section, and adds an `about.aggregateRating` field to the page WebPage JSON-LD when the rating is present.

**Tech Stack:** Next.js 15 App Router (server components), TypeScript, Cloudflare Workers + KV via OpenNext, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-05-20-reviews-live-ratings-design.md`

**Working branch:** `feat/reviews-live-ratings` (spec already committed).

**Testing policy for this PR:** Manual smoke tests + `npx tsc --noEmit`. No automated tests. Matches the precedent set by `menu-copy`, `variance-lite`, and the recent expedition-log work per the approved spec.

**Pre-existing cron dispatch:** `cloudflare-worker-entry.mjs:51-58`. Hourly trigger (`0 * * * *`) currently calls `runHourlyPosBackfill(env)`. We add `runRatingsFetch(env)` alongside it.

**Operator-side prerequisites (run in parallel with implementation, not blocking):**
- Get Google Maps API key (Places API enabled), put via `npx wrangler secret put GOOGLE_MAPS_API_KEY`
- Get Trustpilot public API key, put via `npx wrangler secret put TRUSTPILOT_API_KEY`
- Look up Google Place ID via Place ID Finder
- Look up Trustpilot Business Unit ID via `GET https://api.trustpilot.com/v1/business-units/find?name=jerrycanspirits.co.uk&apikey=<KEY>`
- The Place ID and Business Unit ID land in `src/lib/ratings-config.ts` (Task 1). The code ships with empty constants and short-circuits gracefully until they're filled in.

---

## File Structure

| File | Purpose |
|---|---|
| `src/lib/ratings-config.ts` (new) | Place ID and Business Unit ID constants. Public identifiers, live in source. |
| `src/lib/ratings-cache.ts` (new) | `PlatformRating` type, `getRating` reader, `writeRating` writer. Pure KV access, env passed in. |
| `src/lib/scheduled-ratings.ts` (new) | `runRatingsFetch(env)` dispatcher; `fetchAndStoreGoogle`; `fetchAndStoreTrustpilot`. Logs errors via console.error. |
| `cloudflare-worker-entry.mjs` (modify) | Add `ctx.waitUntil(runRatingsFetch(env))` to the hourly cron branch. |
| `src/components/RatingRow.tsx` (new) | Presentational. Renders five `★` glyphs with full/faded gold, the rating, " / 5 · ", count, " reviews on Platform". |
| `src/app/reviews/page.tsx` (modify) | Make async; read both KV keys; render `RatingRow` inside Google and Trustpilot sections; add `aggregateRating` to JSON-LD. Set `export const revalidate = 3600`. |
| `worker-configuration.d.ts` (modify) | Add `GOOGLE_MAPS_API_KEY` and `TRUSTPILOT_API_KEY` to the Env interface so TypeScript knows about the new secrets. |

---

## Task 1: Config constants

**Files:**
- Create: `src/lib/ratings-config.ts`

- [ ] **Step 1: Create the config file**

Create `src/lib/ratings-config.ts`:

```ts
// Public identifiers (not secrets) for the live ratings cron job. Filled in
// once after the operator has looked up each value from the respective
// platform. Until both values are non-empty strings, the corresponding
// fetcher short-circuits and writes nothing — the /reviews/ page renders
// as it does today.
//
// Google Place ID: derived from https://g.page/r/CdkZacM6VKi-EAE via the
// Place ID Finder at developers.google.com/maps/documentation/places/web-service/place-id
//
// Trustpilot Business Unit ID: from
// GET https://api.trustpilot.com/v1/business-units/find?name=jerrycanspirits.co.uk&apikey=<KEY>

export const GOOGLE_PLACE_ID = ''
export const TRUSTPILOT_BUSINESS_UNIT_ID = ''
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ratings-config.ts
git commit -m "feat(ratings): config constants for Place ID and Business Unit ID"
```

---

## Task 2: ratings-cache module

**Files:**
- Create: `src/lib/ratings-cache.ts`

- [ ] **Step 1: Create the file with type + read/write helpers**

Create `src/lib/ratings-cache.ts`:

```ts
export type RatingSource = 'google' | 'trustpilot'

export interface PlatformRating {
  rating: number
  count: number
  fetchedAt: string
  source: RatingSource
}

const KEY_PREFIX = 'rating:'

function keyFor(source: RatingSource): string {
  return `${KEY_PREFIX}${source}`
}

export async function getRating(
  kv: KVNamespace,
  source: RatingSource,
): Promise<PlatformRating | null> {
  return kv.get<PlatformRating>(keyFor(source), 'json')
}

export async function writeRating(
  kv: KVNamespace,
  source: RatingSource,
  data: Omit<PlatformRating, 'fetchedAt' | 'source'>,
): Promise<void> {
  const value: PlatformRating = {
    ...data,
    source,
    fetchedAt: new Date().toISOString(),
  }
  await kv.put(keyFor(source), JSON.stringify(value))
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/ratings-cache.ts
git commit -m "feat(ratings): KV reader and writer for platform ratings"
```

---

## Task 3: Extend Env type for new secrets

**Files:**
- Modify: `worker-configuration.d.ts`

- [ ] **Step 1: Inspect the current Env interface**

Open `worker-configuration.d.ts` and find the `interface Env { ... }` block. The file is auto-generated by `wrangler types` but is checked into the repo and manually extended (search for existing manually-added bindings like `MAPBOX_SECRET_TOKEN` to find the right pattern).

- [ ] **Step 2: Add the two new secrets to Env**

Locate the section listing the existing secrets (e.g. `MAPBOX_SECRET_TOKEN: string;`, `TURNSTILE_SECRET_KEY: string;`) and add two new lines in the same block:

```ts
GOOGLE_MAPS_API_KEY: string;
TRUSTPILOT_API_KEY: string;
```

If the file is fully auto-generated and overwritten on `wrangler types`, find where the existing manual additions live (likely in `cloudflare-env.d.ts`, `env.d.ts`, or a similarly named ambient file). Add the new secrets there instead, matching whatever pattern the existing manual additions use.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add worker-configuration.d.ts
git commit -m "feat(ratings): add GOOGLE_MAPS_API_KEY and TRUSTPILOT_API_KEY to Env"
```

---

## Task 4: scheduled-ratings handler

**Files:**
- Create: `src/lib/scheduled-ratings.ts`

- [ ] **Step 1: Create the handler with both fetchers and the dispatcher**

Create `src/lib/scheduled-ratings.ts`:

```ts
// Hourly cron job: fetch Google Places and Trustpilot Business Unit ratings
// and cache each in KV under the rating: prefix. Wired into the scheduled()
// handler in cloudflare-worker-entry.mjs.
//
// Each fetcher short-circuits silently when its required secret or config
// constant is missing, so the code can ship dark and start working as soon
// as the operator fills in the keys via wrangler secret put + a code commit
// for the public IDs.

import { writeRating } from './ratings-cache'
import { GOOGLE_PLACE_ID, TRUSTPILOT_BUSINESS_UNIT_ID } from './ratings-config'

interface RatingsEnv {
  SITE_OPS: KVNamespace
  GOOGLE_MAPS_API_KEY?: string
  TRUSTPILOT_API_KEY?: string
}

export async function runRatingsFetch(env: RatingsEnv): Promise<void> {
  await Promise.allSettled([
    fetchAndStoreGoogle(env),
    fetchAndStoreTrustpilot(env),
  ])
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

async function fetchAndStoreTrustpilot(env: RatingsEnv): Promise<void> {
  if (!env.TRUSTPILOT_API_KEY || !TRUSTPILOT_BUSINESS_UNIT_ID) return

  const url = `https://api.trustpilot.com/v1/business-units/${TRUSTPILOT_BUSINESS_UNIT_ID}?apikey=${env.TRUSTPILOT_API_KEY}`
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    console.error('Trustpilot fetch threw', err)
    return
  }
  if (!res.ok) {
    console.error('Trustpilot fetch failed', res.status)
    return
  }
  const data = await res.json() as {
    stars?: number
    trustScore?: number
    numberOfReviews?: { total?: number }
  }
  const rating = data.trustScore ?? data.stars
  if (rating == null) {
    console.error('Trustpilot response missing rating')
    return
  }
  await writeRating(env.SITE_OPS, 'trustpilot', {
    rating: Math.round(rating * 10) / 10,
    count: data.numberOfReviews?.total ?? 0,
  })
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/lib/scheduled-ratings.ts
git commit -m "feat(ratings): scheduled handler for Google + Trustpilot fetch"
```

---

## Task 5: Wire scheduled handler into cron dispatch

**Files:**
- Modify: `cloudflare-worker-entry.mjs`

- [ ] **Step 1: Add the import**

In `cloudflare-worker-entry.mjs`, near the existing imports at the top, add:

```js
import { runRatingsFetch } from './src/lib/scheduled-ratings.ts';
```

The line should sit immediately after the `runHourlyPosBackfill` import so all hourly handlers are grouped:

```js
import { runHourlyPosBackfill } from './src/lib/pouriq/pos/scheduled.ts';
import { runRatingsFetch } from './src/lib/scheduled-ratings.ts';
```

- [ ] **Step 2: Add the waitUntil call in the hourly branch**

Find the `scheduled` handler:

```js
async scheduled(event, env, ctx) {
  if (event.cron === '0 * * * *') {
    ctx.waitUntil(runHourlyPosBackfill(env));
    return;
  }
  ctx.waitUntil(runTradeReviewDigest(env));
},
```

Add a second `ctx.waitUntil` call in the hourly branch, before the `return`:

```js
async scheduled(event, env, ctx) {
  if (event.cron === '0 * * * *') {
    ctx.waitUntil(runHourlyPosBackfill(env));
    ctx.waitUntil(runRatingsFetch(env));
    return;
  }
  ctx.waitUntil(runTradeReviewDigest(env));
},
```

Both handlers run independently. A failure in one does not abort the other.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add cloudflare-worker-entry.mjs
git commit -m "feat(ratings): wire scheduled handler into hourly cron dispatch"
```

---

## Task 6: RatingRow presentational component

**Files:**
- Create: `src/components/RatingRow.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/RatingRow.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/RatingRow.tsx
git commit -m "feat(ratings): RatingRow presentational component"
```

---

## Task 7: Integrate into /reviews/ page (KV reads + RatingRow + JSON-LD)

**Files:**
- Modify: `src/app/reviews/page.tsx`

- [ ] **Step 1: Add the new imports**

At the top of `src/app/reviews/page.tsx`, add to the existing import block:

```ts
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from '@/lib/ratings-cache'
import { RatingRow } from '@/components/RatingRow'
```

Note: we use `getCloudflareContext({ async: true })` directly rather than the existing `getSiteOpsKV()` helper because this page is now ISR (`revalidate = 3600`). The sitemap route uses the same async pattern and the comment in `src/lib/d1.ts:getD1` explains why: during `next build`'s static-prerender pass for ISR routes, the Cloudflare runtime context is only available asynchronously.

- [ ] **Step 2: Add the revalidate export**

Below the `dynamic` import for `TrustpilotWidget` and before `export const metadata`, add:

```ts
export const revalidate = 3600
```

This aligns the page cache with the hourly cron cadence.

- [ ] **Step 3: Convert the page component to async and fetch ratings**

Change the signature of `ReviewsPage` to async and load both ratings before the return. The new top of the function body:

```tsx
export default async function ReviewsPage() {
  const { env } = await getCloudflareContext({ async: true })
  const kv = env.SITE_OPS as KVNamespace
  const [google, trustpilot] = await Promise.all([
    getRating(kv, 'google'),
    getRating(kv, 'trustpilot'),
  ])

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

  return (
    // ...existing JSX continues below...
```

- [ ] **Step 4: Add aggregateRating to the JSON-LD**

Find the existing `safeJsonLd({ ... })` call. Inside the inline object, find the `about: { '@type': 'Organization', ... }` block. Modify it to conditionally include `aggregateRating`:

```tsx
about: {
  '@type': 'Organization',
  name: 'Jerry Can Spirits',
  url: 'https://jerrycanspirits.co.uk',
  sameAs: [
    'https://www.trustpilot.com/review/jerrycanspirits.co.uk',
    'https://www.yell.com/biz/jerry-can-spirits-ltd-london-11012967/',
    'https://www.trustaveteran.com/',
  ],
  ...(aggregateRating ? { aggregateRating } : {}),
},
```

The spread keeps `aggregateRating` out of the schema entirely when both KV entries are empty (avoids emitting an undefined-ratings field that would fail Google's structured-data validation).

- [ ] **Step 5: Render RatingRow in the Trustpilot section**

Find the Trustpilot `<section>` (the one containing the `TrustpilotWidget`). Inside its inner `<div className="bg-jerry-green-800/40 ...">`, immediately AFTER the `<div className="text-center mb-6">` block that holds the logo + "View all on Trustpilot" link, and BEFORE the `<TrustpilotWidget ...>` line, add:

```tsx
{trustpilot && (
  <RatingRow rating={trustpilot.rating} count={trustpilot.count} platform="trustpilot" />
)}
```

- [ ] **Step 6: Render RatingRow in the Google section**

Find the Google `<section>`. Inside its inner card div, immediately AFTER the `<div className="text-center mb-6">` block (the one with the Google logo + "View on Google" link) and BEFORE the next `</div>` (the inner card), add:

```tsx
{google && (
  <RatingRow rating={google.rating} count={google.count} platform="google" />
)}
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 8: Commit**

```bash
git add src/app/reviews/page.tsx
git commit -m "feat(ratings): live RatingRow + aggregateRating JSON-LD on /reviews/"
```

---

## Task 8: Manual smoke test

**Files:**
- No code changes. Verifies the wiring end-to-end before opening the PR.

- [ ] **Step 1: Final type-check on the full branch**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 2: Lint**

Run: `npx next lint`
Expected: no warnings on new files. Pre-existing warnings on unrelated files are out of scope.

- [ ] **Step 3: Verify empty-state behaviour (no KV writes yet)**

Start the dev server: `npm run dev`

Visit `http://localhost:3000/reviews/`. Confirm:
- Page renders exactly like production today (no RatingRow visible).
- View source: the JSON-LD does NOT include an `aggregateRating` field.
- Console / terminal: no errors related to ratings.

Stop the dev server.

- [ ] **Step 4: Seed a Google KV entry locally and verify single-platform render**

Run:

```bash
npx wrangler kv key put --binding=SITE_OPS --local "rating:google" '{"rating":4.8,"count":12,"fetchedAt":"2026-05-20T13:00:00Z","source":"google"}'
```

Restart `npm run dev`. Visit `http://localhost:3000/reviews/`. Confirm:
- Google section now shows: ★★★★★ 4.8 / 5 · 12 reviews on Google.
- Trustpilot section still renders without a RatingRow (KV entry not set).
- View source: JSON-LD now contains `aggregateRating` with `ratingValue: "4.8"` and `reviewCount: "12"`.

- [ ] **Step 5: Seed a Trustpilot KV entry locally and verify both-platform render**

```bash
npx wrangler kv key put --binding=SITE_OPS --local "rating:trustpilot" '{"rating":4.9,"count":8,"fetchedAt":"2026-05-20T13:00:00Z","source":"trustpilot"}'
```

Refresh `/reviews/`. Confirm:
- Both Google and Trustpilot sections now show RatingRow.
- JSON-LD still references Google's numbers (Google takes priority per `primary = google ?? trustpilot`).

- [ ] **Step 6: Test Trustpilot-only fallback**

Delete the Google KV entry:

```bash
npx wrangler kv key delete --binding=SITE_OPS --local "rating:google"
```

Refresh. Confirm:
- Google section is back to static layout (no RatingRow).
- Trustpilot section still shows its RatingRow.
- JSON-LD `aggregateRating` now references Trustpilot's numbers (`4.9` / `8`).

- [ ] **Step 7: Test the scheduled handler in local dev**

This requires real API keys. Skip if keys not yet provisioned and rely on Step 8 (production verification post-merge) instead.

If keys are available locally via `.dev.vars`, trigger the scheduled handler:

```bash
npx wrangler dev --test-scheduled
```

Then in a separate terminal:

```bash
curl "http://localhost:8787/__scheduled?cron=0+*+*+*+*"
```

Verify in the Wrangler dev console:
- No errors logged.
- KV entries `rating:google` and `rating:trustpilot` updated (run a `wrangler kv key get` to confirm).

- [ ] **Step 8: Clean up local KV before commit**

```bash
npx wrangler kv key delete --binding=SITE_OPS --local "rating:google" || true
npx wrangler kv key delete --binding=SITE_OPS --local "rating:trustpilot" || true
```

Local KV state is per-developer and not shipped; cleanup is hygiene only.

---

## Task 9: Open the pull request

**Files:**
- No code changes.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin feat/reviews-live-ratings`

- [ ] **Step 2: Open the PR**

Run:

```bash
gh pr create --title "feat(reviews): live Google + Trustpilot ratings + aggregateRating JSON-LD" --body "$(cat <<'EOF'
## Summary
Implements the design from `docs/superpowers/specs/2026-05-20-reviews-live-ratings-design.md`.

Live ratings on `/reviews/` from Google Places and Trustpilot Business Unit APIs, fetched hourly by the existing cron, cached in KV, rendered in the existing Google and Trustpilot sections, plus an `aggregateRating` field added to the page WebPage JSON-LD.

## What's in
- New scheduled handler `src/lib/scheduled-ratings.ts` wired into `cloudflare-worker-entry.mjs` alongside `runHourlyPosBackfill`.
- New `src/lib/ratings-cache.ts` for typed KV read/write.
- New `src/lib/ratings-config.ts` for public Place ID and Business Unit ID constants (empty until operator fills in).
- New `src/components/RatingRow.tsx` presentational component.
- `/reviews/` page is now async, sets `revalidate = 3600`, reads both KV entries, renders RatingRow per platform, and includes an `aggregateRating` field in JSON-LD when at least one rating is available.
- `Env` interface extended with `GOOGLE_MAPS_API_KEY` and `TRUSTPILOT_API_KEY`.

## What's out (follow-up PRs)
- Product page `/shop/product/jerry-can-spirits-expedition-spiced-rum/` `aggregateRating` for SERP star snippets. Higher SEO value but requires a single review source per Google's structured-data rules.
- Live ratings for Yell or Trust A Veteran (no usable public APIs).
- Admin UI to force-refresh or override KV values.

## Operator steps to make this go live
1. \`npx wrangler secret put GOOGLE_MAPS_API_KEY\`
2. \`npx wrangler secret put TRUSTPILOT_API_KEY\`
3. Fill in \`GOOGLE_PLACE_ID\` and \`TRUSTPILOT_BUSINESS_UNIT_ID\` in \`src/lib/ratings-config.ts\` and ship that as a small follow-up commit.

Until those three steps complete, the fetchers short-circuit and the page renders as it does today. The implementation is correct from merge time; activation is operator-side.

## Test plan
- [ ] CI build + type checks pass
- [ ] After merge: confirm page renders with no regression (KV empty, no RatingRow visible)
- [ ] After operator fills in keys + IDs: confirm next hourly cron runs without errors (check Cloudflare logs)
- [ ] After cron runs: confirm `/reviews/` shows live ratings on both platforms
- [ ] After cron runs: confirm page source contains `aggregateRating` JSON-LD field

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Verify CI starts**

Expected output: a PR URL. Open it, confirm Lint+Type Check, Build, CodeQL, and Workers Builds checks are queued.
