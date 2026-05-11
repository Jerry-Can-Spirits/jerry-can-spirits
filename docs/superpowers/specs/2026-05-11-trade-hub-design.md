# Trade Hub — Unified Authenticated Trade Portal — Design Spec

**Date:** 2026-05-11
**Status:** Design (pending implementation)
**Branch:** `feat/trade-hub`

## Context & Goal

Jerry Can Spirits trade customers currently have two disconnected authenticated surfaces:

- `/trade/order/` — the order portal, which renders a PIN form inline; on success the order interface appears in the same page
- `/trade/pouriq/login` — the Pour IQ login page, which takes the same PIN and creates a session cookie before redirecting to `/trade/pouriq`

A trade customer who is licensed for Pour IQ has no way to discover or reach it from the public site; they need a direct URL. A customer who isn't licensed has no organic path to find out what Pour IQ is. Adding more trade-only tools later (the existing backlog flags barcode scanning, menu import, supplier benchmarking, AWRS reporting, multi-user accounts, and others) will make the fragmentation worse.

The Trade Hub unifies the trade portal experience: one PIN login, one session, one landing page with tiles for each available product, and a marketing surface for products the customer doesn't yet have access to. The current per-page PIN entry inside the Order Portal goes away — both products sit behind a shared session.

Magic-link auth is deliberately out of scope; the existing 8-digit PIN remains the credential. The schema work to support email-verified login (adding email columns, verification flow, transactional sender wiring) is a Phase 3 spec on its own.

## Audience & Auth Model

### Visitor states

| State | Behaviour |
|---|---|
| Public visitor on `/trade/` | Existing marketing page; CTA to apply for a trade account; "Already a trade customer?" button → `/trade/login` |
| Public visitor on `/trade/pour-iq` | New public marketing page for Pour IQ; two-path CTA (apply for trade account / email enquiry for existing customers) |
| Authenticated session, no Pour IQ licence | Lands on `/trade/landing`; Pour IQ tile rendered greyed-out with "Learn more" button → `/trade/pour-iq` |
| Authenticated session, with Pour IQ licence | Lands on `/trade/landing`; Pour IQ tile active, click → `/trade/pouriq` |
| No session, hits any `/trade/landing`, `/trade/order/*`, `/trade/pouriq/*` | Redirected to `/trade/login` |

### Session model

Unchanged from Pour IQ's MVP, with naming generalised away from Pour IQ:

- Cookie: `jcs_trade_sid` (unchanged — already neutral)
- KV key: `trade:session:{sid}` (renamed from `pouriq:session:{sid}`)
- Value: `{ tradeAccountId: string, createdAt: string }`
- TTL: 30 days

One session covers Order Portal AND Pour IQ. Both products read `tradeAccountId` from the same session.

### Migration of in-flight sessions

The only existing user with an authenticated session is Dan (during pilot testing). Kicking that single session out is acceptable — no dual-namespace read needed.

## URL & Route Structure

| Path | Role | Auth | Status |
|---|---|---|---|
| `/trade/` | Public marketing page | None | Unchanged |
| `/trade/pour-iq` | Public Pour IQ marketing page | None | **New** |
| `/trade/login` | PIN entry — single entry point | None | **New** |
| `/trade/landing` | Authenticated hub — tile launcher | Session required | **New** |
| `/trade/order/*` | Existing order portal | Session required | **Refactored** — in-form PIN removed |
| `/trade/pouriq/*` | Existing Pour IQ | Session required | **Refactored** — own login route deleted |
| `/trade/pouriq/login` | Pour IQ login page | n/a | **Deleted** — replaced by `/trade/login` |
| `/trade/apply/` | Trade account application form | None | Unchanged |

### Navigation flows

```
Public visitor → /trade
  → "Already a trade customer?" → /trade/login → enter PIN → /trade/landing
  → "Apply for a trade account" → /trade/apply/

On /trade/landing:
  → Order Portal tile → /trade/order  (no second PIN)
  → Pour IQ tile (licensed) → /trade/pouriq
  → Pour IQ tile (greyed, "Learn more") → /trade/pour-iq

On /trade/pour-iq:
  → "Apply for a trade account" → /trade/apply/  (if not yet a customer)
  → mailto: trade@... (if already a customer, no Pour IQ licence)
```

## Hub Layout (`/trade/landing`)

Order top-to-bottom:

1. **Thin header**: "Trade Portal" left-aligned, "Sign out" link right-aligned
2. **Personalised greeting**: `Welcome back, {venue_name}.` Server-renders venue name from `trade_accounts` row matching the session.
3. **Announcement banner** (optional, file-config driven — see below)
4. **Tile grid**: 2-column on desktop, 1-column on mobile

### Tile rendering rules

| Tile | Visibility | Active state | Inactive state |
|---|---|---|---|
| Order Portal | Always | Click → `/trade/order` | Never inactive |
| Pour IQ | Always | Click → `/trade/pouriq` | Greyed; "Learn more" button → `/trade/pour-iq` |
| (future) | Per access rule | Click → product route | Greyed with CTA |

The greyed-out state is the marketing surface inside the portal. It is not a 403 or error state; it is a quiet indication that something exists and the user can click to find out more. This removes the need to explain Pour IQ manually to every trade customer.

### Tile data

Each tile is server-rendered from a config:

```ts
interface TradeTile {
  id: string
  title: string
  description: string
  href: string                          // active destination
  learnMoreHref?: string                // greyed-state destination (Pour IQ → /trade/pour-iq)
  isActive: (ctx: TileContext) => boolean
}

interface TileContext {
  tradeAccountId: string
  hasPourIqLicence: boolean
  // future: hasTier(...), hasFeature(...)
}
```

For v1, two tiles are defined in code (no runtime configuration). The structure supports adding tiles for future products by appending to the array.

## Announcement Banner

### Decision: hardcoded config, not Sanity

Trade announcements change infrequently (monthly at most). Schema work in Sanity Studio is over-engineering for this cadence. File-based config keeps complexity proportional to use.

### File: `src/config/trade-announcement.ts`

```ts
export const TRADE_ANNOUNCEMENT: {
  title: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
} | null = {
  title: '...',
  body: '...',
  ctaLabel: '...',
  ctaUrl: '...',
}

// Set to null to hide the banner:
// export const TRADE_ANNOUNCEMENT = null
```

The hub imports this constant and renders the banner only when truthy. Changing the banner is a one-line PR.

### Graduation path

If the announcement cadence ever exceeds ~once per month or non-engineers need to edit, migrate to a Sanity singleton. Not blocking; explicitly deferred.

## Auth Refactor

The largest concrete code change in this spec.

### Centralised login page (`/trade/login`)

- Single PIN input form, identical visual style to the existing `/trade/pouriq/login` page
- POSTs to `/api/trade/login` (renamed from `/api/pouriq/login`)
- On success: cookie set, redirect to `/trade/landing`
- Validation: length-only sanity check (4–32 chars), matching the relaxed validation shipped in PR #638

### Generalise session helpers

| Old path | New path |
|---|---|
| `src/lib/pouriq/session.ts` | `src/lib/trade-portal/session.ts` |
| `src/lib/pouriq/access.ts` | Stays — Pour IQ-specific access check |
| `src/app/api/pouriq/login/route.ts` | `src/app/api/trade/login/route.ts` |

| Old export | New export |
|---|---|
| `createPourIqSession` | `createTradeSession` (rename) |
| `readSession` | `readTradeSession` |
| `revokePourIqSession` | `revokeTradeSession` |
| Constant `TRADE_SESSION_COOKIE` | Unchanged (already neutral) |
| KV key prefix `pouriq:session:` | `trade:session:` |

The existing `kv.ts` module already exports `createTradeSession`, `isTradeSessionValid`, `revokeTradeSession` from older work — these store just `'1'` against `trade:session:{sid}` with no `tradeAccountId`. They are unused since Pour IQ shipped its own session machinery; remove them in this refactor to avoid name collision and confusion.

### New helper: `requireTradeSession`

In `src/lib/trade-portal/session-check.ts`:

```ts
async function requireTradeSession(): Promise<{ tradeAccountId: string }> {
  // Read session cookie, look up KV, return tradeAccountId, or redirect to /trade/login
}
```

Used by `/trade/landing`, `/trade/order/*`, and any future tile destination that needs a session but not a Pour IQ licence.

Pour IQ keeps `checkPourIqAccess()` for its routes — that function now calls `readTradeSession` under the hood but still performs the licence check on top.

### Order Portal session refactor

`/trade/order/page.tsx` currently:
- Renders public; PIN form is part of `TradeOrderForm`
- PIN validation happens inside the form on first interaction

After the refactor:
- The page server-side calls `requireTradeSession()` at the top; no session → redirect to `/trade/login`
- `TradeOrderForm` is refactored to assume a valid session and skip directly to product selection
- The in-form PIN inputs and their handlers are removed
- The existing `/api/trade/verify` endpoint that the in-form PIN flow currently hits is **retired** if it has no other consumers (verified during implementation)

The order placement flow itself (Shopify cart construction, redirect to checkout) is unchanged.

### Sign-out

`POST /api/trade/logout`:
- Reads session cookie, calls `revokeTradeSession`
- Clears the `jcs_trade_sid` cookie
- Returns 200 OK; client redirects to `/trade/`

Header on `/trade/landing` has a small "Sign out" link that POSTs to this endpoint.

## Public Pour IQ Marketing Page (`/trade/pour-iq`)

Target of "Learn more" from the greyed-out Pour IQ tile. Also linkable from email signatures and trade-facing docs.

Structure top-to-bottom:

- **Hero**: "Pour IQ — Margin analysis for cocktail menus" + one-sentence pitch + image/screenshot
- **What it does** (3 cards):
  - Deterministic profitability KPIs (avg GP, best/worst margin, waste flags)
  - AI recommendations on pricing, balance, complexity
  - Field Manual cross-linking — your menu connects to our recipe library
- **How it works** (3 steps):
  - Enter your menu (manual for now; AI-assisted import coming)
  - See the numbers
  - Apply the recommendations
- **What it costs**: single line — "Annual licence per venue. Get in touch for current pricing." (No number until pilot feedback supports one.)
- **Two-path CTA**:
  - Not yet a trade customer → `/trade/apply/`
  - Existing trade customer, want a licence → `mailto:trade@jerrycanspirits.co.uk?subject=Pour%20IQ%20licence%20enquiry`

Visual: matches the rest of the site's Tailwind palette (`jerry-green-*`, `gold-*`, `parchment-*`). Server component, no JS.

## SEO Surfaces

### Sitemap additions

`src/app/sitemap.ts` gets one new public route:

- `/trade/pour-iq/` — priority 0.7, monthly

`/trade/login`, `/trade/landing`, `/trade/order/*`, and `/trade/pouriq/*` are explicitly excluded — they are authenticated surfaces with no SEO value.

### Robots meta

The following pages set `robots: { index: false, follow: false }`:
- `/trade/login`
- `/trade/landing`
- `/trade/order/*` (already set)
- `/trade/pouriq/*` (verify; add if missing)

### Page metadata

`/trade/pour-iq` has full metadata block: title, description, canonical, OpenGraph — matching the pattern used on other product pages.

## File Map

**Create:**
- `src/app/trade/login/page.tsx`
- `src/app/trade/landing/page.tsx`
- `src/app/trade/pour-iq/page.tsx`
- `src/app/api/trade/login/route.ts`
- `src/app/api/trade/logout/route.ts`
- `src/lib/trade-portal/session.ts`
- `src/lib/trade-portal/session-check.ts`
- `src/components/trade-portal/TradeTile.tsx`
- `src/components/trade-portal/AnnouncementBanner.tsx`
- `src/components/trade-portal/SignOutLink.tsx`
- `src/config/trade-announcement.ts`

**Modify:**
- `src/app/trade/order/page.tsx` — add `requireTradeSession()`, remove in-form PIN handling
- `src/components/TradeOrderForm.tsx` — assume valid session; remove PIN inputs and verification calls
- `src/app/trade/pouriq/page.tsx` — call `requireTradeSession()` + `checkPourIqLicence()` separately (refactor of the merged `checkPourIqAccess` flow)
- `src/lib/pouriq/access.ts` — use generalised session helper internally; keep `checkPourIqAccess` signature
- `src/app/sitemap.ts` — add `/trade/pour-iq/`
- `src/lib/kv.ts` — remove unused legacy `createTradeSession`/`isTradeSessionValid`/`revokeTradeSession` exports (the ones storing just `'1'`)

**Delete:**
- `src/app/trade/pouriq/login/page.tsx`
- `src/app/api/pouriq/login/route.ts`
- `src/lib/pouriq/session.ts` (contents moved to `src/lib/trade-portal/session.ts`)

## Acceptance Criteria

- [ ] Public `/trade/` works unchanged
- [ ] `/trade/login` accepts a valid PIN, sets cookie, redirects to `/trade/landing`
- [ ] `/trade/login` with invalid PIN returns 401 and surfaces the message in-page
- [ ] `/trade/landing` shows venue name, Order Portal tile (active), Pour IQ tile (active or greyed based on licence)
- [ ] Hardcoded announcement banner renders when config is non-null; hidden when null
- [ ] Clicking Order tile reaches `/trade/order` with the order interface immediately visible — no second PIN entry
- [ ] Clicking active Pour IQ tile reaches `/trade/pouriq` dashboard immediately
- [ ] Clicking greyed Pour IQ tile's "Learn more" reaches `/trade/pour-iq`
- [ ] `/trade/pour-iq` renders publicly with full SEO metadata and routes to either `/trade/apply` or `mailto:` based on which CTA is clicked
- [ ] Sign out clears the session and returns to `/trade/`
- [ ] Direct navigation to `/trade/landing`, `/trade/order`, `/trade/pouriq` without a session redirects to `/trade/login`
- [ ] `/trade/pouriq/login` no longer exists (404 or redirect — implementation choice)
- [ ] Sitemap includes `/trade/pour-iq/` and excludes all session-gated routes
- [ ] `npm run build` and `npx opennextjs-cloudflare build` both pass

## Out of Scope (Phase 3+)

- Magic-link authentication (requires adding email column on `trade_accounts`, verification flow, transactional sender wiring)
- Sanity-backed announcement banner (graduate when cadence justifies it)
- Multi-user accounts under a single trade account (its own spec)
- Trade-tier-aware tile visibility (current logic is licence-based; tier-gating per product is a Phase 2 expansion)
- Activity log of trade portal actions (audit trail) — useful eventually, not for v1
- Public Pour IQ pricing (deferred until pilot validates a number)

## Open Questions

None blocking. The two open questions for Pour IQ v2 (whether to auto-detect ingredient pricing mode from type, whether to provide common bottle-size presets) remain in the Pour IQ backlog and are not affected by this spec.

## Pilot Implications

- The Bank Bar & Grill's pilot URL changes from `/trade/pouriq/login` to `/trade/login` — communicate via the next pilot check-in email
- Their existing Pour IQ session cookie continues to work (cookie name unchanged), but a 30-day expiry means they'll re-login via the new flow at some point regardless
- No data migration on the pilot's menus or analyses — all rows reference `trade_account_id` which is unchanged
