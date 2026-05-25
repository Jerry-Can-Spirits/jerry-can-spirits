# Tevalis + ResDiary Integrations for Pour IQ — Design

**Date:** 2026-05-24
**Branch:** `spec/tevalis-resdiary-integrations`
**Status:** Draft, pending user review

---

## Summary

Pour IQ adds two third-party integrations to support the Bank Bar and Grill pilot: **Tevalis** (EPOS sales feed, slots into the existing POS provider abstraction) and **ResDiary** (bookings feed, introduces a new parallel bookings abstraction). On top of both, Pour IQ ships a **bookings dashboard** and a **variance-per-cover** metric — the headline feature that uses both data streams together to normalise pour variance against expected covers.

Ships in two sprints. Sprint 1: Tevalis end-to-end. Sprint 2: ResDiary end-to-end plus the dashboard and variance-per-cover features that depend on both data streams.

## Background

The Bank Bar and Grill is the first pilot venue for Pour IQ. Their stack:
- **EPOS:** Tevalis
- **Bookings:** ResDiary

Square POS is the only integrated EPOS in Pour IQ today. Bank cannot benefit from Pour IQ until Tevalis is supported. ResDiary is unique to Pour IQ — no equivalent exists yet — and unlocks a "legacy brands can't do this" differentiator (variance-per-cover).

Discovery call with Tevalis is booked for the day after this spec is written (2026-05-25). The spec defines the default assumptions; the call may refine them.

Research pass (2026-05-24) confirmed:
- Tevalis has a public REST API (XML+JSON). Credentials obtained by emailing `support@tevalis.com`. No partner programme or fees. Endpoints include Sales Attendance, Stock, Reservations, Online Orders.
- ResDiary has a Developer Hub and Data Extraction API plus real-time webhooks. Credentials are per-venue, requested from the ResDiary team. Licence terms restrict credential sharing. No partner programme or fees.

## Goals

1. Bank Bar and Grill's Tevalis sales feed flows into Pour IQ's existing variance pipeline. Pour IQ "just works" for them on Tevalis the way it already works for Square venues.
2. Bank's ResDiary booking events flow into a new bookings store and surface in a new operational dashboard.
3. Variance metrics gain a per-cover normalisation, comparing tonight's pour ratio against the same day-of-week trailing 4 weeks. The bar manager can see "tonight 0.18 G&Ts per cover; last Friday 0.22" and act on it.
4. The architecture leaves clean extension points for future EPOS vendors (already typed: `eposnow`, `lightspeed`, `toast`) and future bookings vendors (`opentable`, `sevenrooms`).

### Success criteria

- A bar manager at a Tevalis venue can connect Pour IQ by pasting a single Site ID and clicking Save. Validation hits Tevalis once, on success the connection is live.
- A bar manager at a ResDiary venue can paste a restaurant ID and API key, see an auto-generated webhook URL, register that URL in ResDiary, and start receiving events.
- Both pipelines tolerate transient failures (Tevalis API down, ResDiary missed webhook) without operator intervention.
- The variance-per-cover view loads in under a second on a 30-day window for a venue with 200 covers/night.

## Non-goals

- Tevalis or ResDiary integrations for any venue other than Bank in v1 (gated naturally by which venues have credentials)
- Webhook support for Tevalis in v1 (use polling; revisit if Tevalis confirms webhooks on the discovery call)
- ResDiary cover-arrival confirmation (no-show exclusion) — needs an endpoint we haven't confirmed; v2
- Per-cover spend (£ per cover) — needs price normalisation, separate problem
- Peer benchmarking across venues — privacy + multi-tenant aggregation, big feature
- "Variance lite" feature originally next in the Pour IQ backlog — pulled later behind these integrations per the Bank pilot decision

## Architectural Decisions (from brainstorm)

1. **Bookings is a parallel abstraction**, not an extension of the POS abstraction. New `src/lib/pouriq/bookings/` namespace mirrors the structure of `src/lib/pouriq/pos/`. Future bookings vendors slot in there.
2. **Tevalis credentials are Pour-IQ-held shared dev keys.** Bar manager only provides their venue's Site ID. Stored as Cloudflare Workers secrets. Risk: if Tevalis revokes our dev creds, all Tevalis venues stop syncing.
3. **ResDiary credentials are per-venue.** Each venue provides their own API key. Stored per-connection in D1. Required by ResDiary's licence terms.
4. **Sprint sequencing: vertical slice, Tevalis first.** Ship Tevalis fully (Sprint 1), then ResDiary plus the combined features (Sprint 2). The variance-per-cover feature depends on both streams anyway, so building Tevalis first costs nothing in feature-delivery timing.

---

## Sprint 1 — Tevalis Integration

### Provider extension

Update `src/lib/pouriq/pos/types.ts`:

```ts
export type PosProvider = 'square' | 'tevalis' | 'eposnow' | 'lightspeed' | 'toast'
```

The `PosAdapter` interface gets two methods marked optional, because credential-based providers don't use them:

```ts
export interface PosAdapter {
  provider: PosProvider
  exchangeCodeForToken?(code: string, redirectUri: string): Promise<...>  // OAuth providers only
  refreshAccessToken?(refreshToken: string): Promise<...>                  // OAuth providers only
  fetchOrdersSince(connection: PosConnection, since: Date): Promise<PosOrderLine[]>
  verifyWebhook?(request: Request, body: string): Promise<boolean>         // optional — Tevalis may not support webhooks
  parseWebhookPayload?(payload: unknown): PosOrderLine[]
}
```

Square keeps both auth methods. Tevalis implements neither — it uses static credentials.

### Auth model

- Pour IQ holds Tevalis API credentials as Cloudflare Workers secrets: `TEVALIS_GUID`, `TEVALIS_DEVELOPER_ID`
- Per-venue: bar manager enters their **Tevalis Site ID** in `/trade/pouriq/settings/integrations`
- Persisted to existing `pouriq_pos_connections` table:
  - `provider = 'tevalis'`
  - `external_account_id = <site_id>`
  - `access_token = ''` (unused — non-null column)
  - `refresh_token = null`
  - `token_expires_at = null`
- The adapter pulls the shared GUID and DeveloperID from the environment at request time and combines with the per-venue Site ID

### Adapter file

`src/lib/pouriq/pos/providers/tevalis.ts`. Mirrors the existing `square.ts`. Two implemented methods:

- `fetchOrdersSince(connection, since)`: calls Tevalis Sales Attendance endpoint with `siteId` from `external_account_id`, the `GUID` and `DeveloperID` from environment in headers, normalises the response into `PosOrderLine[]`.
- `verifyWebhook` and `parseWebhookPayload`: implement only if the discovery call confirms Tevalis supports webhooks. Otherwise omit, rely on polling.

### Sync model

- Polling via the existing `src/lib/pouriq/pos/scheduled.ts` cron job. Same job that polls Square now polls Tevalis venues too. Default 15 minute interval; tighten later if needed.
- Webhooks optional (deferred). If Tevalis confirms, add receiver at `/api/pouriq/integrations/tevalis/webhook/route.ts` per the existing pattern.

### Settings UI

`/trade/pouriq/settings/integrations/page.tsx` already lists connected integrations. Add a "Connect Tevalis" card:

- One input: `Tevalis Site ID`
- Save button
- No OAuth redirect, no external dance

POSTs to `/api/pouriq/integrations/tevalis/connect`. Server validates by making one read call against the Tevalis API with the supplied Site ID and the env-held dev creds. On success the connection is saved. On failure the error is surfaced inline. Calls `revalidatePath('/trade/pouriq/settings/integrations')` after a successful write (per the ISR + revalidatePath rule in memory).

### Database

No new tables. Reuses `pouriq_pos_connections`. No migration needed.

### Variance integration

`src/lib/pouriq/variance.ts` already consumes `PosOrderLine[]` agnostically. Once Tevalis orders flow into the existing pipeline, variance works for Bank with no variance-specific code changes.

---

## Sprint 2 — ResDiary Integration

### New namespace

`src/lib/pouriq/bookings/` mirrors `src/lib/pouriq/pos/`. Files:

- `types.ts` — `BookingsProvider`, `BookingsConnection`, `BookingEvent`, `BookingsAdapter`
- `connections.ts` — connection CRUD (mirror of `pos/connections.ts`)
- `events.ts` — booking event CRUD
- `providers/resdiary.ts` — adapter implementation
- `scheduled.ts` — fallback polling for missed webhooks

### Types

```ts
// src/lib/pouriq/bookings/types.ts

export type BookingsProvider = 'resdiary' | 'opentable' | 'sevenrooms'

export interface BookingsConnection {
  id: string
  trade_account_id: string
  provider: BookingsProvider
  external_restaurant_id: string  // ResDiary's restaurant ID
  api_key: string                 // see encryption note in Cross-Cutting
  webhook_secret: string | null   // for verifying inbound webhooks
  last_event_at: string | null
  last_sync_error: string | null
  enabled: number
  created_at: string
  updated_at: string
}

export interface BookingEvent {
  id: string
  connection_id: string
  external_booking_id: string
  event_type: 'created' | 'updated' | 'cancelled'
  party_size: number
  booked_for: string         // ISO datetime — when guests arrive
  duration_minutes: number | null
  received_at: string        // ISO datetime — when webhook fired
  raw_payload: string        // full JSON, forensic
}

export interface BookingsAdapter {
  provider: BookingsProvider
  validateCredentials(restaurantId: string, apiKey: string): Promise<boolean>
  verifyWebhook(request: Request, body: string, secret: string): Promise<boolean>
  parseWebhookPayload(payload: unknown): BookingEvent | null
  fetchBookingsSince(connection: BookingsConnection, since: Date): Promise<BookingEvent[]>
}
```

### Auth model

Per-venue. The bar manager (or their IT contact) requests credentials from ResDiary directly. They paste the restaurant ID and API key into Pour IQ settings. Pour IQ auto-generates a `webhook_secret` (via `crypto.randomUUID()`) and shows them the webhook URL to register in their ResDiary dashboard.

### Webhook receiver

`/api/pouriq/integrations/resdiary/webhook/[connectionId]/route.ts`

- POST, public (signed)
- Looks up `BookingsConnection` by `connectionId` URL param
- HMAC-verifies signature header against the connection's `webhook_secret` using constant-time comparison
- Parses payload via `ResDiaryAdapter.parseWebhookPayload`
- Inserts a `BookingEvent` row with `ON CONFLICT(connection_id, external_booking_id, event_type) DO NOTHING` for idempotency
- Updates `last_event_at` on the connection
- Returns 200 only after commit; if write fails, returns 5xx so ResDiary's built-in retry kicks in

### Polling fallback

`scheduled.ts` runs every 15 minutes. For each connection where `last_event_at` is older than 1 hour OR `last_sync_error` is set, polls ResDiary's Data Extraction API for the last 24 hours of bookings and upserts. Belt-and-braces: if a webhook is missed, the poller catches it within 15 minutes.

### Settings UI

Add a "Connect ResDiary" card to `/trade/pouriq/settings/integrations/page.tsx`. Three inputs:

- ResDiary restaurant ID
- API key (password-style)
- *(Webhook URL auto-generated and displayed after save, with a Copy button)*

Single Save button. Server validates by making one read call against ResDiary. On success: connection saved, webhook URL displayed, `revalidatePath` called.

### Database

New migration `migrations/0028_pouriq_bookings.sql`:

- `pouriq_bookings_connections` (mirrors the shape of `pouriq_pos_connections`)
- `pouriq_bookings_events`
- Index on `(connection_id, booked_for)` for dashboard queries
- Index on `(connection_id, received_at)` for forensic queries
- Unique constraint on `(connection_id, external_booking_id, event_type)` for webhook idempotency

---

## Bookings Dashboard + Variance-per-Cover

Both ship at the end of Sprint 2, once both data streams are confirmed live.

### Bookings dashboard

New route `/trade/pouriq/bookings`. Server component, reuses the Pour IQ shell. Visible only when at least one `BookingsConnection` exists for the trade account.

Sections:

- **Tonight at a glance:** `SUM(party_size)` from `pouriq_bookings_events` where `event_type IN ('created','updated')` AND `booked_for` falls in the current service window. Total expected covers, next peak time, current pace.
- **Hour-by-hour breakdown:** small bar chart, party-size summed per hour. Pre-positioning stock.
- **Upcoming days:** next 7 days, daily cover totals. Par stock decisions.
- **Recent activity feed:** last 20 booking events, lightweight forensic.

All computed on demand from `pouriq_bookings_events`. Sub-100ms query latency expected with the `(connection_id, booked_for)` index.

### Variance-per-cover

Extends the existing variance view rather than adding a new page. A new column ("per cover") on the variance table plus a new "trend" panel.

`src/lib/pouriq/variance/per-cover.ts`:

```ts
export interface PerCoverMetric {
  drink_name: string
  period_label: string       // "Tonight", "Last Friday", "Last 7 days"
  period_start: string
  period_end: string
  pours: number              // SUM(quantity) from PosOrderLine in window
  covers: number             // SUM(party_size) from BookingEvent in window
  pours_per_cover: number    // pours / covers, 3 dp
}

export async function computePerCover(
  db: D1Database,
  tradeAccountId: string,
  drinkNames: string[],
  windows: PeriodWindow[],
): Promise<PerCoverMetric[]>
```

### Trend logic

Default comparison set (always three rows):

- **Tonight** (service start to now; service start defaults to 17:00 venue local time, per-venue override deferred to v2)
- **Same day-of-week, last week** (full evening)
- **Trailing 4 same-day-of-week average**

Surfaced as: *"0.18 G&Ts per cover tonight. Last Friday: 0.22. 4-week Friday average: 0.21. You're 14% behind."* The comparison is the feature. The raw number on its own is not actionable.

### Threshold alerts (v1 lite)

If `pours_per_cover` for the current service is more than ±25% off the trailing 4-week average for that day-of-week, surface a soft warning at the top of the variance page. Not a notification, not an email. Visible flag only. Tunable later.

---

## Cross-Cutting Concerns

### Error handling

**Tevalis polling failures:**
- Catch in `scheduled.ts`, write a short message to `last_sync_error`, log to Sentry with `provider:tevalis` tag
- Settings UI shows "Last sync failed: …" with a manual "Retry now" button
- One venue's failure does not break the polling job for others

**ResDiary webhook failures:**
- Receiver returns 200 only after event row commits
- DB write fails → return 5xx so ResDiary retries
- Idempotency via the `(connection_id, external_booking_id, event_type)` unique constraint — webhook replays don't double-count
- Polling fallback catches any events ResDiary didn't successfully push

**Credential issues:**
- Either provider returns 401/403 → mark connection `enabled = 0`, set `last_sync_error = 'credentials_invalid'`, surface in UI
- Auto-recovery: user re-saves credentials, validation call resets `enabled = 1`

### Security

**Multi-tenant isolation:**
- Every query scoped by `trade_account_id` (existing Pour IQ access middleware enforces this at `src/lib/pouriq/access.ts`)
- API routes verify user owns the connection before any read/write
- ResDiary webhook receiver identifies connection from URL path and HMAC-verifies before any DB operation

**Credential storage:**
- Tevalis: shared dev creds in Cloudflare Workers secrets (`TEVALIS_GUID`, `TEVALIS_DEVELOPER_ID`). Never in code, D1, or logs. Per-venue Site ID is non-sensitive.
- ResDiary: per-venue `api_key` and `webhook_secret` in `pouriq_bookings_connections`. For v1, match the existing Square pattern (likely plaintext in D1 with strict access controls). Flagged as tech debt: investigate Workers-encrypted storage when there are multiple pilot venues.
- Webhook secrets are server-generated via `crypto.randomUUID()`, never user-chosen.

**HMAC verification:**
- ResDiary webhook receiver verifies signature header before parsing payload
- Constant-time comparison to avoid timing attacks

### Rate limiting

**Outbound:**
- Tevalis: confirm limits on the discovery call. Default assumption: 60 req/min per dev key. Adapter implements exponential backoff on 429 (start 5s, double, cap 5min, 6 retries).
- ResDiary: published call limits in their API portal. Same backoff pattern.

**Inbound:**
- Cloudflare edge rate limiting handles abuse
- No app-level limit in v1
- A single venue firing thousands of events/min is a signal worth investigating, not silently absorbing

### Testing

**Unit tests:**
- `providers/tevalis.ts`: mock fetch, verify request structure, response parsing, error mapping. Fixture payloads in `tests/fixtures/tevalis/` once credentials are live.
- `providers/resdiary.ts`: same shape. Plus HMAC verification: valid signature, invalid, missing header, replay.
- `variance/per-cover.ts`: pure function. Comprehensive tests with synthetic data covering all three trend comparisons.

**Integration tests:**
- Playwright: Settings UI connect flow for both vendors. Paste credentials, save, see success state.
- Webhook receipt → event stored → dashboard reflects it within one request cycle.
- Multi-tenant isolation: connection from trade account A is invisible to account B's queries.

**Manual / staging:**
- Connect to Tevalis sandbox if available (confirm on discovery call) before pointing at Bank's live site.
- ResDiary may not have a sandbox. Coordinate with Bank to test on their live (read-only, low risk).

### Observability

- Sentry tags on all integration errors: `provider:tevalis|resdiary`, `connection_id:<id>`, `phase:sync|webhook|adapter`
- Periodic structured log from cron: `{ job: 'pouriq_pos_sync', venues: N, ok: N, fail: N }`
- Settings UI surfaces `last_synced_at` and `last_event_at` so the bar manager sees freshness without us needing a separate dashboard

### Help guides (per memory rule)

Per `feedback_pouriq_help_guide_style.md`: every new Pour IQ feature ships with a help-guide section drafted in the same session. Sprint 2 includes drafting Sanity help-guide entries for:

- "Connecting Tevalis to Pour IQ"
- "Connecting ResDiary to Pour IQ"
- "Reading the bookings dashboard"
- "Understanding variance per cover"

Voice and structure per the existing help-guide style memory.

### Deployment / rollout

- Bank is the sole pilot for v1. No feature flag needed — gated naturally by which venues have credentials.
- ISR consideration: per memory `feedback_isr_revalidatepath.md`, the settings page is ISR-cached. Every connect / disconnect / save calls `revalidatePath('/trade/pouriq/settings/integrations')` so the bar manager doesn't see stale state.
- Roll-forward only. Credentials in D1 can be removed without code rollback, providing a fast disable path.

---

## Implementation Plan (High-Level)

### Sprint 1 — Tevalis end-to-end

Tasks (each becomes a checkbox in the writing-plans output):
1. Add `'tevalis'` to `PosProvider` type
2. Make `exchangeCodeForToken` and `refreshAccessToken` optional on `PosAdapter`
3. Implement `src/lib/pouriq/pos/providers/tevalis.ts`
4. Add `TEVALIS_GUID` and `TEVALIS_DEVELOPER_ID` to Cloudflare Workers secrets
5. Wire Tevalis into `src/lib/pouriq/pos/scheduled.ts`
6. Add `POST /api/pouriq/integrations/tevalis/connect` route
7. Add "Connect Tevalis" card to `/trade/pouriq/settings/integrations/page.tsx`
8. Draft Sanity help-guide entry "Connecting Tevalis to Pour IQ"
9. Unit tests for the adapter
10. Manual test against Tevalis sandbox or Bank's live Site ID

### Sprint 2 — ResDiary end-to-end + features

Tasks:
1. Create `src/lib/pouriq/bookings/` namespace with types, connections, events
2. Write migration `0028_pouriq_bookings.sql`
3. Implement `src/lib/pouriq/bookings/providers/resdiary.ts`
4. Add `POST /api/pouriq/integrations/resdiary/connect`
5. Add `POST /api/pouriq/integrations/resdiary/webhook/[connectionId]`
6. Add `scheduled.ts` polling fallback
7. Add "Connect ResDiary" card to settings UI
8. Build `/trade/pouriq/bookings` dashboard
9. Implement `src/lib/pouriq/variance/per-cover.ts`
10. Extend variance view UI with per-cover column and trend panel
11. Threshold-alert flag on variance page
12. Draft Sanity help-guide entries for ResDiary, dashboard, variance per cover
13. Unit + integration tests
14. Manual test on Bank's live ResDiary

Each sprint produces its own PR. Sprint 2 branches off Sprint 1 because of shared changes to the settings UI.

---

## Discovery Call Items (Tevalis, 2026-05-25)

Spec assumptions to confirm or revise on the call:

1. Authentication model — is GUID + DeveloperID the only mechanism, or is OAuth available?
2. Lead time from credential request to live keys
3. Sandbox availability and how to provision one
4. Rate limits (req/min, daily)
5. Webhook support for sales events (yes/no)
6. Multi-tenant pattern — is one set of dev credentials with many venue Site IDs the supported model?
7. Listed integration partner directory — would Pour IQ be listed once live?
8. Commercial restrictions on use

---

## Out of Scope (v1)

- Other EPOS vendors (eposnow, lightspeed, toast) — typed for the future, not implemented now
- Other bookings vendors (opentable, sevenrooms) — typed for the future
- Cover-arrival confirmation (no-show exclusion)
- Per-cover spend (£ per cover)
- Peer benchmarking across venues
- Webhook support for Tevalis (deferred unless confirmed on discovery call)
- Migrating ResDiary credential storage to Workers-encrypted format (tech debt; revisit when there are multiple pilot venues)
- The "variance lite" feature originally next in the Pour IQ backlog (pulled later)

---

## Future Considerations

- **Tevalis Stock endpoint:** the adapter could fetch live stock from Tevalis and compare to Pour IQ's calculated stock. Two numbers, variance becomes more provable. Worth a follow-up spec.
- **Cover-arrival confirmation:** if ResDiary exposes a "guest arrived" event, the per-cover metric becomes more accurate by excluding no-shows.
- **Demand forecasting:** with enough bookings history, Pour IQ could forecast stock needs ahead of services rather than just measuring them after the fact.
- **Tevalis-internal bookings:** Tevalis's Reservations endpoint exists. If a venue uses Tevalis bookings instead of ResDiary, we could pull bookings from the same provider.
