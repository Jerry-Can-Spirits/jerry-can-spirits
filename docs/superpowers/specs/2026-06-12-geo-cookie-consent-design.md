# Geo Cookie Removal (Cookiebot Compliance) — Design

**Date:** 2026-06-12
**Status:** Approved (option 2 from the 2026-06-12 cookie audit)

## Background

Cookiebot's 09/06/2026 scan reported "prior consent fully enabled: no". The audit traced the webserver-set cookie to `/api/geo`, which sets `detectedCountry` (24h) on every first visit: `ShippingBanner` and `AgeGate` both call it before any consent interaction. All third-party trackers were verified properly consent-gated; this cookie is the code-side finding.

## Change

Replace the cookie with a sessionStorage cache so no cookie exists at all:

1. **`src/app/api/geo/route.ts`** — remove the `response.cookies.set(...)` block. Route returns JSON only; keep the private Cache-Control.
2. **`src/lib/geo.ts` (new)** — `getCachedCountry()` (reads sessionStorage, validates `[A-Z]{2}`) and `detectCountry()` (cache-first, else fetch `/api/geo` and cache). Replaces the cookie-regex logic currently duplicated in three places.
3. **`src/components/AgeGate.tsx`** — use the helper; delete the local cookie-reading function.
4. **`src/components/ShippingBanner.tsx`** — use the helper; delete the cookie match.
5. **`src/components/ClientWrapper.tsx`** — remove the dead `isBot=true` cookie check (refers to middleware that does not exist; UA-pattern fallback remains).

Not changed: `useNewsletterSignup` (still used on `/contact`), all consent-gated trackers, gtag advanced Consent Mode setup.

## Behaviour notes

- sessionStorage scope means one geo fetch per tab session instead of one per 24h. The route response itself is browser-cached for 24h (`Cache-Control: private, max-age=86400`), so repeat fetches are free anyway.
- All storage access wrapped in try/catch (privacy modes can block storage); failure falls back to fetching, then to defaults, matching current behaviour.

## Verification

- Grep: no remaining references to the `detectedCountry` cookie.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- Manual: age gate region auto-select and shipping banner still work locally; `/api/geo` response carries no Set-Cookie header.
- Post-deploy: rescan in the Cookiebot dashboard; remaining dashboard task is classifying `ageVerified`, `__cf_bm`, `_cfuvid` (and `jcs_newsletter_signup` if reported) as Necessary.
