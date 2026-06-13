# Pour IQ Integration Expansion: Auth Modes + Zettle — Design

**Date:** 2026-06-12
**Status:** Approved

## Background

Pour IQ has one live POS integration (Square, OAuth). The Bank Bar and Grill pilot needs Tevalis (partner application submitted) and ResDiary (application submitted); a Collins by DesignMyNight partner application is recommended alongside them. While partner approvals are pending, the free UK POS segment is open to build against today:

- **Zettle (PayPal POS)** — open developer registration, OAuth2, Purchase API with itemised `products[]` per purchase. The other big free POS in UK small venues alongside Square. Build now.
- **SumUp** — open access (API keys/OAuth2) but the docs do not confirm itemised basket data in the Transactions/Receipts APIs. Spike before building (see Gate below).
- Loyverse excluded (API is a paid add-on on top of a free POS — the free-tier venues Pour IQ targets cannot use it). OpenTable/SevenRooms/TheFork/Carbonara excluded on the diary side (gated or no API).

Depends on PR #744 (order dedup + token refresh) being merged; both are load-bearing here.

## Scope

Two PRs plus one spike. No diary code in this round (interface designed below, implemented when ResDiary or Collins access arrives).

---

## PR 1: API-key auth mode groundwork

### Migration `0030_pos_connection_auth_mode.sql`

```sql
ALTER TABLE pouriq_pos_connections ADD COLUMN auth_mode TEXT NOT NULL DEFAULT 'oauth';
```

For `auth_mode = 'api-key'` connections: `access_token` stores the API key (or serialised credential JSON for multi-field providers), `refresh_token` / `token_expires_at` stay null, and the cron skips token refresh.

### Type changes (`src/lib/pouriq/pos/types.ts`)

- `PosProvider` union gains `'zettle' | 'sumup' | 'tevalis'`.
- `PosConnection` gains `auth_mode: 'oauth' | 'api-key'`.
- `PosAdapter` becomes auth-mode aware:
  - new required field `authMode: 'oauth' | 'api-key'`
  - `exchangeCodeForToken` and `refreshAccessToken` become optional (OAuth adapters only)
  - new optional `validateCredentials(fields: Record<string, string>): Promise<{ externalAccountId: string; externalLocationId: string | null }>` (api-key adapters only; throws on invalid credentials)
- New exported descriptor for UI rendering:

```ts
export interface ProviderCredentialField {
  key: string        // e.g. 'api_key', 'site_id'
  label: string      // e.g. 'API key', 'Site ID'
  secret: boolean    // render as password input
}
```

Each api-key provider declares its fields in a `PROVIDER_CREDENTIAL_FIELDS: Partial<Record<PosProvider, ProviderCredentialField[]>>` map. Tevalis is declared when its adapter lands; the map ships empty in PR 1 (the UI handles the empty case by not rendering any api-key forms yet).

### New route `POST /api/pouriq/integrations/[provider]/connect-key`

- `checkPourIqAccess()` gate, same as every Pour IQ route.
- Body: `{ fields: Record<string, string> }`, validated against the provider's declared credential fields (reject unknown providers, missing fields, or providers without an api-key adapter).
- Calls `adapter.validateCredentials(fields)`; on success upserts the connection with `auth_mode = 'api-key'`, `access_token` = serialised credentials.
- Per-tenant rate limit (reuse the existing rate-limit helper) to stop credential brute-forcing through us.

### Integrations page UI

`IntegrationCard` gains a credential-form variant driven by `PROVIDER_CREDENTIAL_FIELDS`: text/password inputs, a Connect button posting to connect-key, inline error on validation failure. OAuth providers keep the current redirect button. Disconnect is unchanged (works for both modes; revocation only applies to OAuth providers with `revokeToken`).

### Cron (`scheduled.ts`)

Refactor the Square-only branch into a per-provider dispatch:

```ts
const adapter = getAdapterForProvider(conn.provider, env)  // null for providers without adapters
if (!adapter) continue
if (adapter.authMode === 'oauth') { /* existing refresh-window logic */ }
const lines = await adapter.fetchOrdersSince(conn, since)
...
```

`getAdapterForProvider` lives in a new `src/lib/pouriq/pos/providers/index.ts` so the webhook route, disconnect route, and cron all share one registry.

---

## PR 2: Zettle adapter

### OAuth flow

- Authorize: `https://oauth.zettle.com/authorize` with `response_type=code`, scope `READ:PURCHASE`.
- Token: `https://oauth.zettle.com/token` (authorization_code + refresh_token grants).
- Env vars: `ZETTLE_CLIENT_ID`, `ZETTLE_CLIENT_SECRET` (wrangler secrets + `.dev.vars`).
- Routes: generalise the Square OAuth start/callback pattern. Preferred shape: move to `/api/pouriq/integrations/[provider]/oauth/start` and `/oauth/callback` with a provider registry lookup, keeping the existing `/square/oauth/*` paths as thin delegates so the Square app's registered redirect URI keeps working. (If Square's dashboard redirect URI can be updated easily, delete the old paths instead — implementer's call, document which.)
- The existing `pouriq_pos_oauth_states` table works unchanged (it already stores provider).

### Fetching purchases

`createZettleAdapter(env)` implementing `PosAdapter` with `authMode: 'oauth'`:

- `fetchOrdersSince`: `GET https://purchase.izettle.com/purchases/v2?startDate=<ISO>&descending=false`, paginate via `lastPurchaseHash` cursor until exhausted.
- Mapping per purchase: `external_order_id` = `purchaseUUID`; for each element of `products[]`: `name` = product `name` (+ ` ` + `variantName` when present and not "Regular"/empty), `quantity` = parsed `quantity` (string in Zettle's payload), `sold_at` = purchase `timestamp`, `gross_amount_p` = product `unitPrice * quantity` (Zettle amounts are already in minor units for GBP).
- Refunds (`refund: true` purchases) are skipped in v1 — same stance as Square v1, which only ingests COMPLETED orders. Documented limitation.
- `refreshAccessToken`: standard refresh grant. Zettle access tokens last ~2 hours, so the cron's refresh-within-7-days window simply refreshes every run — correct behaviour, no special-casing.
- No webhook in v1: `verifyWebhook` returns false, `parseWebhookPayload` returns `[]`. Hourly cron polling is sufficient for variance/contribution analysis. Zettle push subscriptions are a documented fast-follow.
- External account identity: `GET https://oauth.zettle.com/users/me` after token exchange supplies the organisation UUID for `external_account_id`.

### UI

Zettle tile on the integrations page with the same connect/disconnect/target-menu/sync controls as Square. Sandbox verification: connect a Zettle developer test account, record test purchases, run sync twice, confirm volumes appear once (dedup) and match the test data.

---

## Gate: SumUp spike (no PR unless it passes)

Half a day, before any SumUp code: create a SumUp sandbox/test account, record a sale with catalogue products via the free POS app, then inspect `GET /v2.1/merchants/{id}/transactions/{id}` and the Receipts API for an itemised `products[]` (names + quantities). **Pass** → SumUp adapter is a near-copy of the Zettle PR (OAuth2, open registration) and gets its own spec addendum. **Fail** (payment totals only) → record the no-go in the venue-tech-intel memory and the help guide does not mention SumUp. Do not build on an unverified assumption.

---

## Designed but not built: DiaryAdapter

Recorded so ResDiary/Collins can be implemented without re-architecture the week partner access arrives:

```ts
export type DiaryProvider = 'resdiary' | 'collins'

export interface DiaryBooking {
  external_booking_id: string
  service_date: string      // YYYY-MM-DD the booking is for
  covers: number
  status: 'confirmed' | 'cancelled' | 'no-show' | 'seated' | 'finished'
  booked_at: string         // ISO datetime the booking was made
}

export interface DiaryAdapter {
  provider: DiaryProvider
  authMode: 'oauth' | 'api-key'
  fetchBookingsSince(connection: DiaryConnection, since: Date): Promise<DiaryBooking[]>
}
```

Storage: `pouriq_diary_connections` (mirror of the POS connections shape) and `pouriq_bookings` with `PRIMARY KEY (connection_id, external_booking_id)` — upsert on conflict (bookings mutate: cancellations, cover changes), unlike the append-only POS dedup. Consumed later by forecasting ("Saturday has 80 covers booked — here's predicted cocktail demand"). No code in this round.

## Out of scope

- Zettle push subscriptions (fast-follow), refund ingestion, ePOSnow (next paid-segment candidate, own spec), Loyverse, any diary implementation, multi-location support beyond what Square v1 already does.

## Verification

- Per PR: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm run test:unit`.
- PR 1: connect-key route rejects unknown providers, missing fields, and unauthenticated calls (manual curl checks); existing Square connect/disconnect/sync unaffected.
- PR 2: end-to-end against a Zettle developer test account as described above. Migration 0030 applied to prod D1 at PR 1 deploy.
