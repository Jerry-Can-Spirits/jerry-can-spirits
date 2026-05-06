# Meta Conversions API for Next.js Storefront. Design

**Date:** 2026-05-06
**Branch:** feat/meta-capi
**Status:** Ready for plan

## Context

The storefront fires Meta Pixel events from four sites (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`) but has no Conversions API path. Meta is reporting that the server is sending 230 fewer events than the Pixel over the last 7 days (those 230 likely come from Shopify's checkout-side integration). Pixel events also lack `eventID`, so even the events that do reach Meta server-side can't be deduplicated against Pixel events.

Meta's own data shows advertisers with a 75% CAPI coverage rate see 24.7% lower cost per result vs Pixel alone. The fix is two-part: add an `eventID` to every Pixel call, and mirror those events server-side with the same `eventID`.

## Goals

1. Mirror all four currently-fired Pixel events to Meta CAPI from a Next.js edge route.
2. Achieve high deduplication coverage by sharing `eventID` between Pixel and CAPI for every fire.
3. Lift match quality by persisting a hashed email in a first-party cookie when a user submits any form that captures email.
4. Respect existing consent gating (Cookiebot marketing) and Spirits-suppression rules.
5. Keep failure modes invisible to the customer. CAPI failure must never surface as a UX error.

## Non-goals

- Mirroring `Purchase`. Shopify's checkout-side integration already sends Purchase from the `shop.app` domain; a second source from Next.js would risk double-counting.
- Backfilling historical events.
- Server-side capture of email from Klaviyo's existing list (privacy decision out of scope).
- Phone-number hashing (no phone collection on storefront).
- Meta product catalogue work (alcohol restrictions still apply there; separate concern).
- Replacing the existing `trackEvent` helper for non-deduped surfaces. New helper coexists.

## Architecture

### Data flow

```
Client                                    Edge route                Meta
─────────────────────────────────────    ──────────────────────    ─────────
trackEventDual(name, params)
  ├─ generate eventID = crypto.randomUUID()
  ├─ fbq('track', name, params, { eventID })  ─────────────────────────►  Pixel
  └─ fetch('/api/meta/events/', POST)  ──►  /api/meta/events/
                                              ├─ read _fbp, _fbc cookies
                                              ├─ read jcs_em (hashed email) cookie
                                              ├─ read CF-Connecting-IP, User-Agent
                                              ├─ build CAPI payload
                                              └─ POST to graph.facebook.com  ───►  CAPI
                                                                                   (dedupes via
                                                                                   eventID)
```

### File structure

**Create:**

- `src/lib/meta-capi.ts`. Client-side helpers: `trackEventDual(name, params)`, `setHashedEmailCookieFromForm(email)`. Server-safe pure helper: `hashEmail(email)`.
- `src/app/api/meta/events/route.ts`. Edge route. Accepts the dual-fire POST and forwards to Meta.
- `src/app/api/meta/clear-identity/route.ts`. Edge route. Clears `jcs_em` on consent revocation.

**Modify:**

- `src/components/FacebookPixel.tsx`. `PixelPageView` and the initial PageView fire through `trackEventDual`. Existing `trackEvent` and `FacebookPixelEvents` helpers stay (used by surfaces we are not deduping).
- `src/components/ProductPageTracking.tsx`. `ViewContent` via `trackEventDual` (Spirits suppression preserved on both legs).
- `src/components/ProductVariantSelector.tsx`. `AddToCart` via `trackEventDual`.
- `src/components/CartDrawer.tsx`. `InitiateCheckout` via `trackEventDual`.
- `src/app/api/klaviyo-signup/route.ts`. On success, set `jcs_em` cookie with hashed email.
- `src/app/api/contact/route.ts`. Same cookie-set on success.

## The `trackEventDual` client helper

```ts
// src/lib/meta-capi.ts (sketch)
export function trackEventDual(
  eventName: string,
  customData: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return
  if (!window.Cookiebot?.consent?.marketing) return

  const eventID = crypto.randomUUID()
  const eventTime = Math.floor(Date.now() / 1000)
  const eventSourceUrl = window.location.href

  // Pixel leg
  if (window.fbq) {
    window.fbq('track', eventName, customData, { eventID })
  }

  // CAPI leg. Fire-and-forget. Never blocks UI.
  fetch('/api/meta/events/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventName, eventID, eventTime, eventSourceUrl, customData }),
    keepalive: true, // survive page navigations (important for InitiateCheckout)
  }).catch(() => {
    // CAPI failure is invisible. Pixel leg already succeeded.
  })
}
```

Notes:
- The function returns synchronously. The fetch is dispatched and unawaited. CAPI failures never surface as UX errors.
- `keepalive: true` matters for `InitiateCheckout`. The user clicks Proceed, the page navigates to Shopify, and the in-flight fetch needs to survive.
- Consent check is on **marketing** category, matching the existing Pixel gate.

## The `/api/meta/events/` edge route

- Runtime: `export const runtime = 'edge'` (matches the codebase's other edge routes).
- Method: `POST` only. `405` for anything else.
- Origin check: enforce `isAllowedOrigin` (already exists in `@/lib/kv`) before accepting the request, to stop random external posts.
- Rate limit: `isRateLimited` keyed on IP, 60 req/min. Real users issue ~5-15 events per session; abusers stand out cleanly.
- Body validation: typeof checks. Reject if `eventName`, `eventID`, or `eventTime` missing or wrong type. No Zod (over-engineering for a 5-field internal payload).

### Payload constructed for Meta

```ts
{
  data: [{
    event_name: eventName,
    event_time: eventTime,                // Unix seconds (client-supplied; route clamps to within 7 days of now)
    event_id: eventID,                    // dedup key with Pixel
    event_source_url: eventSourceUrl,
    action_source: 'website',
    user_data: {
      em: jcsEmCookie ? [jcsEmCookie] : undefined,  // already SHA-256 hex
      client_ip_address: ipFromCfHeader,
      client_user_agent: uaFromHeader,
      fbp: fbpFromCookie,
      fbc: fbcFromCookie,
    },
    custom_data: customData,              // value, currency, content_ids, etc.
  }],
  test_event_code: env.META_CAPI_TEST_CODE || undefined,
}
```

POST target: `https://graph.facebook.com/v19.0/{META_PIXEL_ID}/events?access_token={env.META_CAPI_ACCESS_TOKEN}`.

### Error handling

- Network or non-2xx response from Meta: `Sentry.captureException` with breadcrumb `{ eventName, eventID }`. No PII logged.
- Always return `200` to the client regardless of Meta's response. The client side has already fired Pixel; we do not want to surface server-side issues.
- The 400/405 path (validation, wrong method) returns appropriate status to the **caller** but never to the user (Pixel leg has already succeeded by the time the fetch lands).

### Time clamp

Meta rejects events with `event_time` more than 7 days old. Route clamps any `eventTime` outside `[now - 7d, now + 1m]` to `now`. Defensive against client clock skew.

## The `jcs_em` cookie (hashed email)

### Set conditions

Cookie is written from server responses on:

- `POST /api/klaviyo-signup/` returning success
- `POST /api/contact/` returning success

Setting code (Edge runtime):

```ts
import { hashEmail } from '@/lib/meta-capi'

const hashed = await hashEmail(email)
response.headers.append(
  'Set-Cookie',
  `jcs_em=${hashed}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7776000`
)
```

### Hash function

```ts
export async function hashEmail(email: string): Promise<string> {
  const normalised = email.trim().toLowerCase()
  const data = new TextEncoder().encode(normalised)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### Attributes

- `HttpOnly`. Server-only consumption is the entire point. Client never needs to read it.
- `Secure`. Production only. Local dev permits non-secure via existing patterns (or skip the cookie locally).
- `SameSite=Lax`.
- `Path=/`.
- `Max-Age=7776000` (90 days). Refreshed on each successful form submission.

### Clearing on consent revocation

The Cookiebot decline handler in `FacebookPixel.tsx` already exists. Extend it to call `fetch('/api/meta/clear-identity/', { method: 'POST' })`. That route returns a `Set-Cookie` with `jcs_em=; Max-Age=0; Path=/`. Best-effort. If the call fails the cookie naturally expires within 90 days.

## Consent gating

- **Client side** (`trackEventDual`): early return if `Cookiebot.consent.marketing !== true`. No Pixel, no CAPI.
- **Cookie set** (form handlers): only set `jcs_em` if marketing consent is true. The handler reads the request's existing `_fbp` cookie as a proxy (Pixel only sets `_fbp` after consent is granted, so its presence implies consent). If `_fbp` absent, suppress the `jcs_em` set.
- **Server route** (`/api/meta/events/`): does NOT check consent directly (it has no reliable signal at the edge). Trusts the client gate. If no consent, the client never POSTs.
- **Spirits suppression**: preserved at the call site (in `ProductPageTracking.tsx`). The `trackEventDual` invocation is wrapped in the same `category !== 'Spirits'` guard. Server route is content-agnostic. What arrives is sent.

## Env vars & secrets

| Name | Where | Purpose |
|---|---|---|
| `META_CAPI_ACCESS_TOKEN` | Cloudflare secret (`wrangler secret put`) | Bearer token for Graph API |
| `META_PIXEL_ID` | Hardcoded constant `825009767240821` (existing) | Dataset ID |
| `META_CAPI_TEST_CODE` | Cloudflare env var, optional | If set, route adds `test_event_code` to payload (sandbox mode for Test Events tab) |

The token is added to Cloudflare via:

```
npx wrangler secret put META_CAPI_ACCESS_TOKEN
```

Never in `.env.example`, `.env`, or any tracked file.

## Failure handling summary

| Layer | Failure mode | Behaviour |
|---|---|---|
| Pixel `fbq('track', ...)` | Pixel script blocked / network error | Existing behaviour. No change. |
| Client `fetch('/api/meta/events/')` | Network error | Caught and swallowed. No user-facing error. |
| Edge route validation | Bad payload | 400 to caller. Not surfaced to user. |
| Edge route rate limit | Abuse | 429 to caller. Real users will not hit this. |
| Meta Graph API call | Non-2xx or network | Sentry-logged with `{ eventName, eventID }`. Route returns 200. |
| Cookie set in form handler | Hash failure | Cookie not set. Form submit still succeeds. Sentry-logged. |
| Consent revocation cookie clear | Network error | Best-effort. Cookie expires naturally. |

## Testing & verification

### Pre-deploy

- Local dev server + Meta's **Test Events** tab. Set `META_CAPI_TEST_CODE` to the test code shown in Events Manager. Watch events arrive in real time.
- Each of the four event types fires both Pixel (visible in Meta Pixel Helper browser extension) and CAPI (visible in Test Events tab) with matching `event_id`.
- Submit a form → verify `jcs_em` cookie set in browser dev tools, and the next CAPI event includes the `em` field server-side.

### Post-deploy

- 24-48 hours after merge, check Events Manager → Diagnostics → "events received via Conversions API". Should rise to roughly match the Pixel event count.
- Enable Dataset Quality API (the recommended option in Events Manager). Aim for >70% `em` match rate on events fired after a form submission.

### Manual edge cases

- `curl` the route with malformed body → 400.
- `curl` 100 times in a minute → 429 after limit.
- Browser with marketing consent declined → no events fire (verify in network tab).
- Visit the storefront from a Meta ad URL with `?fbclid=...` → `_fbc` cookie set by Pixel, then included in CAPI payload on next event.

### Type/lint

- `npx tsc --noEmit` clean.
- `npm run build` clean.

## Out-of-scope follow-ups

- **Purchase event mirroring from Shopify webhook.** Shopify already sends Purchase via its own integration. If we ever want full control, we'd subscribe to the `orders/paid` webhook in `src/app/api/webhooks/shopify/route.ts` and fire CAPI from there. Not now.
- **Migration of all `trackEvent` helper call sites to `trackEventDual`.** Helpers in `FacebookPixelEvents` (e.g. `viewRecipe`, `newsletterSignup`) still use the old pattern. Not deduped. We could later swap them too, but this spec keeps focus on the four high-value ecommerce events.
- **`external_id` matching.** Would require a stable per-user identifier (login, persistent UUID). No login system exists. Skip.
- **Phone hashing.** No phone collection on storefront.
- **Catalogue setup.** Meta forbids alcohol products in catalogues; not relevant here.

## Files touched

- Create: `src/lib/meta-capi.ts`
- Create: `src/app/api/meta/events/route.ts`
- Create: `src/app/api/meta/clear-identity/route.ts`
- Modify: `src/components/FacebookPixel.tsx`
- Modify: `src/components/ProductPageTracking.tsx`
- Modify: `src/components/ProductVariantSelector.tsx`
- Modify: `src/components/CartDrawer.tsx`
- Modify: `src/app/api/klaviyo-signup/route.ts`
- Modify: `src/app/api/contact/route.ts`

Approximate scope: 3 new files, 6 modified, ~300-400 lines net.
