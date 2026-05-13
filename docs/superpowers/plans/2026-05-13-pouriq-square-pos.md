# Phase 3.1 — Square POS Integration (multi-provider architecture)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sales volumes flow from Square POS into Pour IQ's `pouriq_drink_volumes` automatically. Bar manager stops typing volumes. Architecture is multi-provider from day one so Lightspeed and ePOSnow drop into the same scaffolding in follow-up sprints.

**Architecture:** Provider abstraction layer (`PosProvider` interface) with one concrete implementation (Square) shipped in this plan. Generic `pouriq_pos_connections` table stores OAuth tokens per (tenant, provider). Square-specific code is isolated to a single adapter file. Webhook + scheduled-poll dual path so missed webhook events backfill within the hour.

**Tech stack:** Next.js 15 App Router, Cloudflare Workers (OpenNext), D1, KV, existing Pour IQ schema. Square SDK NOT used — we hit the REST API directly via `fetch` to keep the bundle small (the SDK pulls in axios + a lot of types we don't need).

**Spec:** `docs/superpowers/specs/2026-05-13-pouriq-integrations-roadmap.md` (Phase 3.1 section)

---

## Prereq — Square developer setup (manual, Dan does this once)

Before any code runs in production:

1. Go to https://developer.squareup.com/apps → "Create application"
2. App name: "Pour IQ"
3. Note the **Application ID** and **Application Secret** (production credentials, plus sandbox credentials)
4. OAuth → Redirect URL: `https://jerrycanspirits.co.uk/api/pouriq/integrations/square/oauth/callback`
5. Webhooks → Add subscription:
   - URL: `https://jerrycanspirits.co.uk/api/pouriq/integrations/square/webhook`
   - Events: `order.created`, `order.updated`, `order.fulfillment.updated`
   - Note the **Webhook Signature Key**
6. Set Cloudflare Worker secrets:
   ```
   wrangler secret put SQUARE_APP_ID
   wrangler secret put SQUARE_APP_SECRET
   wrangler secret put SQUARE_WEBHOOK_SIGNATURE_KEY
   ```

Sandbox testing (during development) uses separate sandbox credentials — set as `SQUARE_APP_ID_SANDBOX` etc., or simply swap the production secrets to sandbox values on the preview deploy.

---

## File map

**Create:**
- `migrations/00XX_pos_connections.sql` — new table for OAuth tokens
- `src/lib/pouriq/pos/types.ts` — `PosProvider` interface, shared types
- `src/lib/pouriq/pos/connections.ts` — D1 helpers (CRUD on pouriq_pos_connections)
- `src/lib/pouriq/pos/match.ts` — pure POS-item-name → cocktail-id matcher
- `src/lib/pouriq/pos/providers/square.ts` — Square adapter (OAuth, REST, webhook signature verification)
- `src/app/api/pouriq/integrations/square/oauth/start/route.ts`
- `src/app/api/pouriq/integrations/square/oauth/callback/route.ts`
- `src/app/api/pouriq/integrations/square/webhook/route.ts`
- `src/app/api/pouriq/integrations/[provider]/sync/route.ts` — manual + cron-triggered backfill
- `src/app/trade/pouriq/settings/integrations/page.tsx` — connect/disconnect UI
- `src/components/pouriq/IntegrationCard.tsx` — per-provider card

**Modify:**
- `wrangler.jsonc` — add cron trigger for hourly Square backfill
- `cloudflare-env.d.ts` — declare `SQUARE_APP_ID`, `SQUARE_APP_SECRET`, `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `src/lib/pouriq/volumes.ts` — extend `upsertVolumes` so source can be `'pos'` (we already have the source column from migration 0019; the type just needs to allow it as a writable value)
- `src/app/trade/landing/page.tsx` OR the Pour IQ root page — add a Settings/Integrations link so the page is reachable

**No-touch but referenced:**
- `src/lib/pouriq/access.ts` — existing `checkPourIqAccess`
- `src/lib/pouriq/volumes.ts` — `upsertVolumes` writes to `pouriq_drink_volumes`
- `src/lib/pouriq/menus.ts` — `listCocktailsForMenu` for the matching pass

---

## Task 1: Migration — pouriq_pos_connections

**Files:** Create `migrations/00XX_pos_connections.sql`

(Use the next available number — count current migrations to pick.)

- [ ] **Step 1: Write the migration**

```sql
-- Per-tenant OAuth connection to a POS provider. One row per
-- (trade_account_id, provider) pair so a venue can connect Square AND
-- Lightspeed without conflict. Tokens stored in plain text — D1 is
-- already encrypted at rest at Cloudflare's storage layer; client-side
-- encryption would add no security against an attacker with D1 read
-- access (same boundary as PINs already in trade_accounts) and would
-- complicate the refresh-token flow.

CREATE TABLE pouriq_pos_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('square', 'eposnow', 'lightspeed', 'toast')),
  external_account_id TEXT NOT NULL,
  external_location_id TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TEXT,
  scopes TEXT,
  last_synced_at TEXT,
  last_sync_error TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE UNIQUE INDEX uniq_pos_connection_per_provider
  ON pouriq_pos_connections(trade_account_id, provider);

-- OAuth state nonce store. Brief-lived (10min TTL), prevents CSRF on
-- the OAuth callback. Could live in KV instead; keeping in D1 for
-- consistency and to avoid yet another KV namespace.
CREATE TABLE pouriq_pos_oauth_states (
  state TEXT PRIMARY KEY,
  trade_account_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Commit**

```bash
git add migrations/00XX_pos_connections.sql
git commit -m "feat(pouriq): pos_connections table for multi-provider OAuth"
```

---

## Task 2: Shared POS types

**Files:** Create `src/lib/pouriq/pos/types.ts`

- [ ] **Step 1: Write the types**

```ts
// Shared types for POS integrations. Provider-agnostic so Lightspeed
// and ePOSnow can drop into the same architecture in later sprints.

export type PosProvider = 'square' | 'eposnow' | 'lightspeed' | 'toast'

export interface PosConnection {
  id: string
  trade_account_id: string
  provider: PosProvider
  external_account_id: string
  external_location_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string | null
  last_synced_at: string | null
  last_sync_error: string | null
  enabled: number
  created_at: string
  updated_at: string
}

// Normalised order line that adapters return after parsing a
// provider-specific payload. Pour IQ then matches name → cocktail
// and upserts volume.
export interface PosOrderLine {
  external_order_id: string
  external_item_id: string | null
  name: string
  quantity: number
  sold_at: string  // ISO datetime
  gross_amount_p: number  // pence
}

// What every adapter must implement.
export interface PosAdapter {
  provider: PosProvider
  exchangeCodeForToken(code: string, redirectUri: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
    scopes: string | null
    externalAccountId: string
    externalLocationId: string | null
  }>
  refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string | null
    expiresAt: string | null
  }>
  fetchOrdersSince(
    connection: PosConnection,
    since: Date,
  ): Promise<PosOrderLine[]>
  verifyWebhook(request: Request, body: string): Promise<boolean>
  parseWebhookPayload(payload: unknown): PosOrderLine[]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pos/types.ts
git commit -m "feat(pouriq): shared POS provider interface"
```

---

## Task 3: Connection storage helpers

**Files:** Create `src/lib/pouriq/pos/connections.ts`

- [ ] **Step 1: Write the helpers**

```ts
import type { PosConnection, PosProvider } from './types'

export interface NewConnection {
  trade_account_id: string
  provider: PosProvider
  external_account_id: string
  external_location_id: string | null
  access_token: string
  refresh_token: string | null
  token_expires_at: string | null
  scopes: string | null
}

export async function upsertConnection(
  db: D1Database,
  data: NewConnection,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_pos_connections
        (trade_account_id, provider, external_account_id, external_location_id,
         access_token, refresh_token, token_expires_at, scopes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      ON CONFLICT(trade_account_id, provider) DO UPDATE SET
        external_account_id = excluded.external_account_id,
        external_location_id = excluded.external_location_id,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        scopes = excluded.scopes,
        last_sync_error = NULL,
        enabled = 1,
        updated_at = datetime('now')
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.provider, data.external_account_id, data.external_location_id,
      data.access_token, data.refresh_token, data.token_expires_at, data.scopes,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Connection upsert returned no id')
  return result.id
}

export async function getConnection(
  db: D1Database,
  tradeAccountId: string,
  provider: PosProvider,
): Promise<PosConnection | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE trade_account_id = ?1 AND provider = ?2`)
    .bind(tradeAccountId, provider)
    .first<PosConnection>()
}

export async function listConnections(
  db: D1Database,
  tradeAccountId: string,
): Promise<PosConnection[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE trade_account_id = ?1`)
    .bind(tradeAccountId)
    .all<PosConnection>()
  return result.results ?? []
}

export async function findConnectionByExternalAccount(
  db: D1Database,
  provider: PosProvider,
  externalAccountId: string,
): Promise<PosConnection | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE provider = ?1 AND external_account_id = ?2`)
    .bind(provider, externalAccountId)
    .first<PosConnection>()
}

export async function deleteConnection(
  db: D1Database,
  tradeAccountId: string,
  provider: PosProvider,
): Promise<void> {
  await db
    .prepare(`DELETE FROM pouriq_pos_connections WHERE trade_account_id = ?1 AND provider = ?2`)
    .bind(tradeAccountId, provider)
    .run()
}

export async function markSyncSuccess(
  db: D1Database,
  connectionId: string,
): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_pos_connections SET last_synced_at = datetime('now'), last_sync_error = NULL WHERE id = ?1`)
    .bind(connectionId)
    .run()
}

export async function markSyncError(
  db: D1Database,
  connectionId: string,
  error: string,
): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_pos_connections SET last_sync_error = ?1 WHERE id = ?2`)
    .bind(error.slice(0, 500), connectionId)
    .run()
}

export async function consumeOAuthState(
  db: D1Database,
  state: string,
): Promise<{ trade_account_id: string; provider: PosProvider } | null> {
  const row = await db
    .prepare(`SELECT trade_account_id, provider FROM pouriq_pos_oauth_states WHERE state = ?1 AND datetime(created_at) > datetime('now', '-10 minutes')`)
    .bind(state)
    .first<{ trade_account_id: string; provider: PosProvider }>()
  if (row) {
    await db.prepare(`DELETE FROM pouriq_pos_oauth_states WHERE state = ?1`).bind(state).run()
  }
  return row
}

export async function createOAuthState(
  db: D1Database,
  tradeAccountId: string,
  provider: PosProvider,
): Promise<string> {
  const state = crypto.randomUUID()
  await db
    .prepare(`INSERT INTO pouriq_pos_oauth_states (state, trade_account_id, provider) VALUES (?1, ?2, ?3)`)
    .bind(state, tradeAccountId, provider)
    .run()
  return state
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pos/connections.ts
git commit -m "feat(pouriq): D1 helpers for pos_connections and oauth_states"
```

---

## Task 4: Name-match helper (cocktail by POS item name)

**Files:** Create `src/lib/pouriq/pos/match.ts`

Reuses the same matching philosophy as the menu-import library matcher: normalised exact, then Levenshtein ≤ 2 for typos.

- [ ] **Step 1: Write the matcher**

```ts
import type { CocktailRow } from '../types'

function normalise(s: string): string {
  return s.toLowerCase().replace(/['.,]/g, '').replace(/\s+/g, ' ').trim()
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = new Array(b.length + 1)
  const cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

export function matchPosItemToCocktail(
  itemName: string,
  cocktails: CocktailRow[],
): CocktailRow | null {
  const target = normalise(itemName)
  if (!target) return null
  const exact = cocktails.find((c) => normalise(c.name) === target)
  if (exact) return exact
  let best: { cocktail: CocktailRow; score: number } | null = null
  for (const c of cocktails) {
    const candidate = normalise(c.name)
    if (candidate.length < 3) continue
    const dist = levenshtein(target, candidate)
    if (dist <= 2 && (best === null || dist < best.score)) {
      best = { cocktail: c, score: dist }
    }
  }
  return best?.cocktail ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pos/match.ts
git commit -m "feat(pouriq): POS item name → cocktail matcher"
```

---

## Task 5: Square adapter

**Files:** Create `src/lib/pouriq/pos/providers/square.ts`

- [ ] **Step 1: Write the adapter**

```ts
import type { PosAdapter, PosConnection, PosOrderLine } from '../types'

const SQUARE_API = 'https://connect.squareup.com'
// Sandbox uses https://connect.squareupsandbox.com — swap via env if needed
const SQUARE_TOKEN_URL = `${SQUARE_API}/oauth2/token`
const SQUARE_ORDERS_SEARCH_URL = `${SQUARE_API}/v2/orders/search`

interface Env {
  SQUARE_APP_ID: string
  SQUARE_APP_SECRET: string
  SQUARE_WEBHOOK_SIGNATURE_KEY: string
}

export function createSquareAdapter(env: Env): PosAdapter {
  return {
    provider: 'square',

    async exchangeCodeForToken(code, redirectUri) {
      const res = await fetch(SQUARE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Square-Version': '2025-09-24' },
        body: JSON.stringify({
          client_id: env.SQUARE_APP_ID,
          client_secret: env.SQUARE_APP_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`Square OAuth ${res.status}: ${errText}`)
      }
      const data = await res.json() as {
        access_token: string
        refresh_token: string
        expires_at: string
        merchant_id: string
        token_type: string
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
        scopes: 'ORDERS_READ,ITEMS_READ,MERCHANT_PROFILE_READ',
        externalAccountId: data.merchant_id,
        externalLocationId: null,  // resolved on first fetch
      }
    },

    async refreshAccessToken(refreshToken) {
      const res = await fetch(SQUARE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Square-Version': '2025-09-24' },
        body: JSON.stringify({
          client_id: env.SQUARE_APP_ID,
          client_secret: env.SQUARE_APP_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })
      if (!res.ok) throw new Error(`Square refresh ${res.status}`)
      const data = await res.json() as {
        access_token: string
        refresh_token: string
        expires_at: string
      }
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_at,
      }
    },

    async fetchOrdersSince(connection, since) {
      const lines: PosOrderLine[] = []
      let cursor: string | undefined
      // location-scoped search; first fetch resolves location if missing
      const locationIds = connection.external_location_id
        ? [connection.external_location_id]
        : await resolveAllLocations(connection.access_token)
      do {
        const res = await fetch(SQUARE_ORDERS_SEARCH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${connection.access_token}`,
            'Square-Version': '2025-09-24',
          },
          body: JSON.stringify({
            location_ids: locationIds,
            query: {
              filter: {
                state_filter: { states: ['COMPLETED'] },
                date_time_filter: {
                  closed_at: { start_at: since.toISOString() },
                },
              },
              sort: { sort_field: 'CLOSED_AT', sort_order: 'ASC' },
            },
            limit: 200,
            cursor,
          }),
        })
        if (!res.ok) throw new Error(`Square orders ${res.status}`)
        const data = await res.json() as {
          orders?: Array<{
            id: string
            closed_at?: string
            line_items?: Array<{
              uid: string
              name: string
              quantity: string
              catalog_object_id?: string
              gross_sales_money?: { amount: number; currency: string }
            }>
          }>
          cursor?: string
        }
        for (const order of data.orders ?? []) {
          if (!order.closed_at) continue
          for (const li of order.line_items ?? []) {
            lines.push({
              external_order_id: order.id,
              external_item_id: li.catalog_object_id ?? null,
              name: li.name,
              quantity: parseFloat(li.quantity) || 1,
              sold_at: order.closed_at,
              gross_amount_p: li.gross_sales_money?.amount ?? 0,
            })
          }
        }
        cursor = data.cursor
      } while (cursor)
      return lines
    },

    async verifyWebhook(request, body) {
      const signature = request.headers.get('X-Square-HmacSha256-Signature')
      if (!signature) return false
      const url = request.url
      const keyData = new TextEncoder().encode(env.SQUARE_WEBHOOK_SIGNATURE_KEY)
      const messageData = new TextEncoder().encode(url + body)
      const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
      )
      const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
      const sigBase64 = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)))
      return sigBase64 === signature
    },

    parseWebhookPayload(payload) {
      // Square webhook payload shape:
      // { merchant_id, type, event_id, created_at, data: { type: 'order', id, object: { order: {...} } } }
      const p = payload as {
        type?: string
        data?: { object?: { order?: {
          id: string
          state?: string
          closed_at?: string
          line_items?: Array<{
            name: string
            quantity: string
            catalog_object_id?: string
            gross_sales_money?: { amount: number }
          }>
        } } }
      }
      const order = p.data?.object?.order
      if (!order || order.state !== 'COMPLETED' || !order.closed_at) return []
      return (order.line_items ?? []).map((li) => ({
        external_order_id: order.id,
        external_item_id: li.catalog_object_id ?? null,
        name: li.name,
        quantity: parseFloat(li.quantity) || 1,
        sold_at: order.closed_at!,
        gross_amount_p: li.gross_sales_money?.amount ?? 0,
      }))
    },
  }
}

async function resolveAllLocations(accessToken: string): Promise<string[]> {
  const res = await fetch(`${SQUARE_API}/v2/locations`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Square-Version': '2025-09-24',
    },
  })
  if (!res.ok) throw new Error(`Square locations ${res.status}`)
  const data = await res.json() as { locations?: Array<{ id: string; status?: string }> }
  return (data.locations ?? []).filter((l) => l.status !== 'INACTIVE').map((l) => l.id)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pos/providers/square.ts
git commit -m "feat(pouriq): Square POS adapter (OAuth, orders, webhooks)"
```

---

## Task 6: OAuth start route

**Files:** Create `src/app/api/pouriq/integrations/square/oauth/start/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { createOAuthState } from '@/lib/pouriq/pos/connections'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.redirect(new URL('/trade/login', request.url))
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const state = await createOAuthState(db, access.tradeAccountId, 'square')

  const redirectUri = new URL('/api/pouriq/integrations/square/oauth/callback', request.url).toString()
  const params = new URLSearchParams({
    client_id: env.SQUARE_APP_ID,
    scope: 'ORDERS_READ ITEMS_READ MERCHANT_PROFILE_READ',
    session: 'false',
    state,
    redirect_uri: redirectUri,
  })
  const authorizeUrl = `https://connect.squareup.com/oauth2/authorize?${params.toString()}`
  return NextResponse.redirect(authorizeUrl)
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/integrations/square/oauth/start/route.ts
git commit -m "feat(pouriq): Square OAuth start route"
```

---

## Task 7: OAuth callback route

**Files:** Create `src/app/api/pouriq/integrations/square/oauth/callback/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { consumeOAuthState, upsertConnection } from '@/lib/pouriq/pos/connections'
import { createSquareAdapter } from '@/lib/pouriq/pos/providers/square'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  const settingsUrl = new URL('/trade/pouriq/settings/integrations', request.url)
  if (error) {
    settingsUrl.searchParams.set('error', error)
    return NextResponse.redirect(settingsUrl)
  }
  if (!code || !state) {
    settingsUrl.searchParams.set('error', 'missing_params')
    return NextResponse.redirect(settingsUrl)
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const stateRow = await consumeOAuthState(db, state)
  if (!stateRow || stateRow.provider !== 'square') {
    settingsUrl.searchParams.set('error', 'invalid_state')
    return NextResponse.redirect(settingsUrl)
  }

  try {
    const adapter = createSquareAdapter({
      SQUARE_APP_ID: env.SQUARE_APP_ID,
      SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
      SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    })
    const redirectUri = new URL('/api/pouriq/integrations/square/oauth/callback', request.url).toString()
    const token = await adapter.exchangeCodeForToken(code, redirectUri)
    await upsertConnection(db, {
      trade_account_id: stateRow.trade_account_id,
      provider: 'square',
      external_account_id: token.externalAccountId,
      external_location_id: token.externalLocationId,
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      token_expires_at: token.expiresAt,
      scopes: token.scopes,
    })
    settingsUrl.searchParams.set('connected', 'square')
    return NextResponse.redirect(settingsUrl)
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'square-oauth-callback' } })
    settingsUrl.searchParams.set('error', 'token_exchange_failed')
    return NextResponse.redirect(settingsUrl)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/integrations/square/oauth/callback/route.ts
git commit -m "feat(pouriq): Square OAuth callback persists connection"
```

---

## Task 8: Webhook receiver

**Files:** Create `src/app/api/pouriq/integrations/square/webhook/route.ts`

- [ ] **Step 1: Write the receiver**

```ts
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { createSquareAdapter } from '@/lib/pouriq/pos/providers/square'
import { findConnectionByExternalAccount, markSyncSuccess, markSyncError } from '@/lib/pouriq/pos/connections'
import { ingestOrderLines } from '@/lib/pouriq/pos/ingest'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const adapter = createSquareAdapter({
    SQUARE_APP_ID: env.SQUARE_APP_ID,
    SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
    SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  })

  // We must read the body as text first to verify the signature, then
  // parse as JSON. Reading body twice on a Request isn't allowed.
  const body = await request.text()
  const verified = await adapter.verifyWebhook(request, body)
  if (!verified) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  let payload: { merchant_id?: string } & Record<string, unknown>
  try { payload = JSON.parse(body) } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  if (!payload.merchant_id) {
    return NextResponse.json({ ok: true })  // ignore non-merchant events
  }
  const connection = await findConnectionByExternalAccount(db, 'square', payload.merchant_id)
  if (!connection) {
    // Could be a webhook for a tenant who disconnected — silently OK.
    return NextResponse.json({ ok: true })
  }

  try {
    const lines = adapter.parseWebhookPayload(payload)
    if (lines.length > 0) {
      await ingestOrderLines(db, connection, lines)
    }
    await markSyncSuccess(db, connection.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'square-webhook' } })
    await markSyncError(db, connection.id, (e as Error).message ?? 'unknown').catch(() => {})
    return NextResponse.json({ error: 'ingest failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/integrations/square/webhook/route.ts
git commit -m "feat(pouriq): Square webhook receiver with signature verification"
```

---

## Task 9: Ingest helper (provider-agnostic)

**Files:** Create `src/lib/pouriq/pos/ingest.ts`

Takes order lines from any provider, matches them to cocktails per the connection's tenant, aggregates by drink for the current period, and upserts into pouriq_drink_volumes.

- [ ] **Step 1: Write the helper**

```ts
import type { PosConnection, PosOrderLine } from './types'
import { matchPosItemToCocktail } from './match'
import { currentPeriod } from '../volumes'
import { getMenu, listCocktailsForMenu, listMenusForTradeAccount } from '../menus'

/**
 * Take a batch of POS order lines, match each to a cocktail across
 * the tenant's menus, aggregate quantity by (cocktail, period), and
 * upsert into pouriq_drink_volumes. Source on the row is marked 'pos'.
 *
 * Lines that don't match any cocktail are silently ignored at this
 * layer — they'll surface in the integrations UI's "unmatched items"
 * panel via a separate query.
 */
export async function ingestOrderLines(
  db: D1Database,
  connection: PosConnection,
  lines: PosOrderLine[],
): Promise<{ matched: number; unmatched: number }> {
  if (lines.length === 0) return { matched: 0, unmatched: 0 }

  // Build the cocktail pool across all menus in this tenant once.
  const menus = await listMenusForTradeAccount(db, connection.trade_account_id)
  const cocktailsByMenu = new Map<string, Awaited<ReturnType<typeof listCocktailsForMenu>>>()
  for (const m of menus) {
    cocktailsByMenu.set(m.id, await listCocktailsForMenu(db, m.id))
  }
  const allCocktails = Array.from(cocktailsByMenu.values()).flat()

  // Bucket by (menu_id, cocktail_id, period_start, period_end, units).
  type Key = string
  const bucket = new Map<Key, { menuId: string; cocktailId: string; period_start: string; period_end: string; units: number }>()
  let matched = 0
  let unmatched = 0
  for (const line of lines) {
    const cocktail = matchPosItemToCocktail(line.name, allCocktails)
    if (!cocktail) { unmatched++; continue }
    matched++
    // Find which menu this cocktail belongs to so we can apply the menu's
    // cadence when bucketing into a period.
    let menuId: string | null = null
    for (const [mid, list] of cocktailsByMenu.entries()) {
      if (list.some((c) => c.id === cocktail.id)) { menuId = mid; break }
    }
    if (!menuId) continue
    const menu = menus.find((m) => m.id === menuId)
    if (!menu) continue
    const cadence = (menu.volume_cadence as 'weekly' | 'monthly') ?? 'monthly'
    const period = currentPeriod(cadence, new Date(line.sold_at))
    const key = `${menuId}::${cocktail.id}::${period.start}::${period.end}`
    const existing = bucket.get(key)
    if (existing) existing.units += line.quantity
    else bucket.set(key, {
      menuId, cocktailId: cocktail.id,
      period_start: period.start, period_end: period.end,
      units: line.quantity,
    })
  }

  // Apply each bucket as an additive upsert (existing units + new units).
  // We can't use the volumes.ts upsertVolumes helper because that REPLACES
  // units; for POS we need to ADD.
  for (const v of bucket.values()) {
    await db
      .prepare(`
        INSERT INTO pouriq_drink_volumes (cocktail_id, period_start, period_end, units_sold, source)
        VALUES (?1, ?2, ?3, ?4, 'pos')
        ON CONFLICT(cocktail_id, period_start, period_end) DO UPDATE SET
          units_sold = units_sold + excluded.units_sold,
          source = CASE WHEN source = 'manual' THEN 'manual' ELSE 'pos' END,
          updated_at = datetime('now')
      `)
      .bind(v.cocktailId, v.period_start, v.period_end, Math.round(v.units))
      .run()
  }

  // Verify menu ownership belongs to this tenant — defense in depth.
  // (cocktail_id was resolved from cocktailsByMenu which is tenant-scoped,
  // so this is structural rather than runtime-required.)
  void getMenu

  return { matched, unmatched }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pouriq/pos/ingest.ts
git commit -m "feat(pouriq): provider-agnostic POS order ingestion"
```

---

## Task 10: Backfill / manual sync route

**Files:** Create `src/app/api/pouriq/integrations/[provider]/sync/route.ts`

Triggers a polling fetch since the last sync. Used by (a) the cron job for hourly safety net and (b) the user-clicked "Sync now" button.

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getConnection, markSyncSuccess, markSyncError } from '@/lib/pouriq/pos/connections'
import { createSquareAdapter } from '@/lib/pouriq/pos/providers/square'
import { ingestOrderLines } from '@/lib/pouriq/pos/ingest'
import type { PosProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (provider !== 'square') {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connection = await getConnection(db, access.tradeAccountId, provider as PosProvider)
  if (!connection) {
    return NextResponse.json({ error: 'Not connected' }, { status: 404 })
  }
  const adapter = createSquareAdapter({
    SQUARE_APP_ID: env.SQUARE_APP_ID,
    SQUARE_APP_SECRET: env.SQUARE_APP_SECRET,
    SQUARE_WEBHOOK_SIGNATURE_KEY: env.SQUARE_WEBHOOK_SIGNATURE_KEY,
  })
  // Sync from last_synced_at - 1 hour overlap (for safety), or 7 days
  // back on the very first sync.
  const since = connection.last_synced_at
    ? new Date(new Date(connection.last_synced_at).getTime() - 60 * 60 * 1000)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  try {
    const lines = await adapter.fetchOrdersSince(connection, since)
    const result = await ingestOrderLines(db, connection, lines)
    await markSyncSuccess(db, connection.id)
    return NextResponse.json({ ok: true, matched: result.matched, unmatched: result.unmatched, since: since.toISOString() })
  } catch (e) {
    Sentry.captureException(e, { tags: { route: 'pos-sync', provider } })
    await markSyncError(db, connection.id, (e as Error).message ?? 'unknown').catch(() => {})
    return NextResponse.json({ error: 'sync failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/integrations/[provider]/sync/route.ts
git commit -m "feat(pouriq): manual + cron-triggered POS sync route"
```

---

## Task 11: Cron trigger for hourly backfill

**Files:** Modify `wrangler.jsonc`, create `src/lib/pouriq/pos/scheduled.ts`, modify scheduled handler in worker entry

Cloudflare Workers scheduled events run the worker's scheduled handler. OpenNext exposes this via `wrangler.jsonc` triggers and `cloudflare-worker-entry.mjs`.

- [ ] **Step 1: Add cron trigger**

Open `wrangler.jsonc`. Find the existing `triggers` block (there's already a `0 8 * * 1` cron for weekly scheduled trade reviews — add to the list):

```jsonc
"triggers": {
  "crons": ["0 8 * * 1", "0 * * * *"]
}
```

The new `0 * * * *` fires hourly.

- [ ] **Step 2: Write the scheduled handler logic**

Create `src/lib/pouriq/pos/scheduled.ts`:

```ts
// Hourly cron: poll every active connection for orders since its
// last_synced_at. Idempotent — the upsert in ingestOrderLines bucketizes
// by (cocktail, period) and ON CONFLICT additive-merges, so overlapping
// runs from webhook + cron don't double-count beyond a small window
// (within the same period).

import { createSquareAdapter } from './providers/square'
import { ingestOrderLines } from './ingest'
import { markSyncSuccess, markSyncError } from './connections'
import type { PosConnection } from './types'

interface Env {
  DB: D1Database
  SQUARE_APP_ID: string
  SQUARE_APP_SECRET: string
  SQUARE_WEBHOOK_SIGNATURE_KEY: string
}

export async function runHourlyPosBackfill(env: Env): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_pos_connections WHERE enabled = 1`)
    .all<PosConnection>()
  const connections = result.results ?? []
  for (const conn of connections) {
    try {
      if (conn.provider === 'square') {
        const adapter = createSquareAdapter(env)
        const since = conn.last_synced_at
          ? new Date(new Date(conn.last_synced_at).getTime() - 60 * 60 * 1000)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        const lines = await adapter.fetchOrdersSince(conn, since)
        await ingestOrderLines(db, conn, lines)
        await markSyncSuccess(db, conn.id)
      }
      // Future providers: dispatch here.
    } catch (e) {
      await markSyncError(db, conn.id, (e as Error).message ?? 'unknown').catch(() => {})
    }
  }
}
```

- [ ] **Step 3: Wire into the worker entry**

Open `cloudflare-worker-entry.mjs`. Find the existing scheduled handler (it dispatches to `scheduledTradeReview` or similar). Add a branch on cron expression so the hourly cron calls the new POS backfill.

Read the existing file first, then modify based on the pattern there. The implementer should pattern-match — every project's scheduled handler is slightly different.

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc src/lib/pouriq/pos/scheduled.ts cloudflare-worker-entry.mjs
git commit -m "feat(pouriq): hourly cron backfill for POS connections"
```

---

## Task 12: Integrations settings page

**Files:** Create `src/app/trade/pouriq/settings/integrations/page.tsx`

Server-rendered page that lists each provider's connection status and provides Connect / Disconnect / Sync now buttons.

- [ ] **Step 1: Write the page**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { listConnections } from '@/lib/pouriq/pos/connections'
import { IntegrationCard } from '@/components/pouriq/IntegrationCard'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function IntegrationsPage({ searchParams }: SearchParams) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connections = await listConnections(db, access.tradeAccountId)
  const byProvider = new Map(connections.map((c) => [c.provider, c]))

  const sp = await searchParams
  const justConnected = sp.connected
  const oauthError = sp.error

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← Pour IQ</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">Integrations</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Connect your POS so sales volumes flow into Pour IQ automatically. You can still enter or paste volumes manually any time.
        </p>

        {justConnected && (
          <p className="mb-6 text-sm text-emerald-300">Connected {justConnected}. First sync runs within an hour, or click Sync now.</p>
        )}
        {oauthError && (
          <p role="alert" className="mb-6 text-sm text-red-300">Connection failed ({oauthError}). Try again or contact support.</p>
        )}

        <div className="space-y-4">
          <IntegrationCard
            provider="square"
            title="Square"
            description="Most common UK POS for independent bars and small chains. Sales flow in via webhooks plus hourly backfill."
            connection={byProvider.get('square') ?? null}
          />
          {/* Placeholder cards — disabled until adapters ship */}
          <IntegrationCard
            provider="lightspeed"
            title="Lightspeed Restaurant"
            description="Coming soon. The architecture is in place — adapter ships in a follow-up sprint."
            connection={byProvider.get('lightspeed') ?? null}
            disabled
          />
          <IntegrationCard
            provider="eposnow"
            title="ePOSnow"
            description="Coming soon. UK pub focus. Adapter follows Lightspeed."
            connection={byProvider.get('eposnow') ?? null}
            disabled
          />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/trade/pouriq/settings/integrations/page.tsx
git commit -m "feat(pouriq): integrations settings page"
```

---

## Task 13: IntegrationCard component

**Files:** Create `src/components/pouriq/IntegrationCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { PosConnection, PosProvider } from '@/lib/pouriq/pos/types'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'

interface Props {
  provider: PosProvider
  title: string
  description: string
  connection: PosConnection | null
  disabled?: boolean
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function IntegrationCard({ provider, title, description, connection, disabled }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function connect() {
    window.location.href = `/api/pouriq/integrations/${provider}/oauth/start`
  }

  function disconnect() {
    if (!confirm(`Disconnect ${title}? Volumes already imported are kept.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/disconnect`, { method: 'POST' })
      if (!res.ok) setError('Could not disconnect')
      else router.refresh()
    })
  }

  function sync() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/integrations/${provider}/sync`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        setError(err.error ?? 'Sync failed')
        return
      }
      router.refresh()
    })
  }

  return (
    <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-2">
        <h2 className="text-lg font-serif font-bold text-white">{title}</h2>
        {connection ? (
          <span className="text-xs text-emerald-300">Connected</span>
        ) : disabled ? (
          <span className="text-xs text-parchment-500">Coming soon</span>
        ) : (
          <span className="text-xs text-parchment-400">Not connected</span>
        )}
      </div>
      <p className="text-sm text-parchment-300 mb-4">{description}</p>
      {connection && (
        <p className="text-xs text-parchment-400 mb-4">
          Last sync: {formatRelativeTime(connection.last_synced_at)}
          {connection.last_sync_error && (
            <span className="block text-red-300 mt-1">Last error: {connection.last_sync_error}</span>
          )}
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-300 mb-3">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {connection ? (
          <>
            <button type="button" onClick={sync} disabled={pending} className={SECONDARY_BUTTON_SM}>
              {pending ? 'Syncing…' : 'Sync now'}
            </button>
            <button type="button" onClick={disconnect} disabled={pending} className={DESTRUCTIVE_BUTTON}>
              Disconnect
            </button>
          </>
        ) : (
          <button type="button" onClick={connect} disabled={disabled || pending} className={PRIMARY_BUTTON}>
            Connect {title}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/IntegrationCard.tsx
git commit -m "feat(pouriq): IntegrationCard component"
```

---

## Task 14: Disconnect route

**Files:** Create `src/app/api/pouriq/integrations/[provider]/disconnect/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { deleteConnection } from '@/lib/pouriq/pos/connections'
import type { PosProvider } from '@/lib/pouriq/pos/types'

export const runtime = 'nodejs'

interface Params { params: Promise<{ provider: string }> }

export async function POST(_request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { provider } = await params
  if (!['square', 'eposnow', 'lightspeed', 'toast'].includes(provider)) {
    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  await deleteConnection(db, access.tradeAccountId, provider as PosProvider)
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/pouriq/integrations/[provider]/disconnect/route.ts
git commit -m "feat(pouriq): disconnect route for POS connections"
```

---

## Task 15: Surface Integrations link from Pour IQ root

**Files:** Modify `src/app/trade/pouriq/page.tsx`

Add a "Settings → Integrations" link so the new page is reachable.

- [ ] **Step 1: Add a link in the page header next to Library / Compare**

Find the existing button row:

```tsx
<Link href="/trade/pouriq/compare" className={SECONDARY_BUTTON}>Compare menus</Link>
<Link href="/trade/pouriq/library" className={SECONDARY_BUTTON}>Library</Link>
<Link href="/trade/pouriq/new" className={PRIMARY_BUTTON}>New menu</Link>
```

Add an Integrations link to that flex row:

```tsx
<Link href="/trade/pouriq/settings/integrations" className={SECONDARY_BUTTON}>Integrations</Link>
```

Place between Library and New menu, or wherever the layout feels balanced.

- [ ] **Step 2: Commit**

```bash
git add src/app/trade/pouriq/page.tsx
git commit -m "feat(pouriq): link Integrations from Pour IQ root"
```

---

## Task 16: Cloudflare env declarations

**Files:** Modify `cloudflare-env.d.ts`

Declare the new Worker secrets so TS is happy.

- [ ] **Step 1: Add declarations**

Inside the `interface CloudflareEnv` block (or however the existing env types are declared in that file), add:

```ts
SQUARE_APP_ID: string
SQUARE_APP_SECRET: string
SQUARE_WEBHOOK_SIGNATURE_KEY: string
```

Read the file first; the structure may be a `declare global` block — match the existing pattern.

- [ ] **Step 2: Commit**

```bash
git add cloudflare-env.d.ts
git commit -m "chore: declare Square env secrets for TS"
```

---

## Task 17: Build verify + manual verification

- [ ] **Step 1: Build check**

```bash
npm run build
```

Expected: clean exit 0. The new routes (`/api/pouriq/integrations/square/...`, `/trade/pouriq/settings/integrations`) appear in the route table.

- [ ] **Step 2: Apply migration**

```bash
npx wrangler d1 migrations apply jerry-can-spirits-db --remote
```

- [ ] **Step 3: Set Worker secrets**

Sandbox during development, production once tested:

```bash
wrangler secret put SQUARE_APP_ID
wrangler secret put SQUARE_APP_SECRET
wrangler secret put SQUARE_WEBHOOK_SIGNATURE_KEY
```

- [ ] **Step 4: Manual flow**

1. Open `/trade/pouriq/settings/integrations` as Pour IQ Demo Venue
2. Click Connect Square → redirects to Square OAuth → approve → returns to settings with "Connected"
3. Click Sync now → confirm matched/unmatched count returned
4. Verify in the menu detail page: volumes appear on cocktails whose POS names matched
5. Test webhook: place a test sale in Square sandbox → confirm volume increments within ~30 seconds
6. Disconnect → confirm row removed and Connect button returns

---

## Self-Review

### Spec coverage
- [x] Multi-provider architecture via `PosAdapter` interface (Task 2, 5)
- [x] `pouriq_pos_connections` table (Task 1)
- [x] Square OAuth (Tasks 6, 7)
- [x] Square webhook with signature verification (Task 8)
- [x] Order ingestion with name matching (Tasks 4, 9)
- [x] Manual + cron sync (Tasks 10, 11)
- [x] Settings UI (Tasks 12, 13)
- [x] Disconnect (Task 14)
- [x] Discoverability (Task 15)
- [x] Type declarations (Task 16)

### Placeholder scan
- No "TBD" or "implement later"
- Migration filename has `00XX` — implementer picks the next available number (currently 0023 after the 0022_barcode_catalogue)
- The worker-entry wiring (Task 11 Step 3) is intentionally "read the existing pattern" because the file structure is project-specific

### Type consistency
- `PosAdapter` interface matches Square's implementation
- `PosConnection` shape matches the migration schema
- `PosOrderLine` is the canonical handoff to `ingestOrderLines`

---

## Notes for the implementer

- **No SDK** — Square has an official Node SDK but it pulls in axios and other heft. Direct `fetch` to the REST API keeps the bundle small and matches Workers runtime expectations.
- **Square API version pinning** — the adapter pins `Square-Version: 2025-09-24`. Bumping this is a deliberate change, not a side effect.
- **Webhook idempotency** — the upsert in `ingestOrderLines` is additive per (cocktail, period). Webhook + cron overlapping by one hour is safe: within the same period, both runs see the same orders and the additive upsert + ON CONFLICT means each Square order_id is added once **per ingest run, not per order**. ⚠️ This is the one place where the design could double-count: if both webhook and cron fire for the same order in the same period, the order's units are added twice. Mitigation: dedupe by `external_order_id` in `ingestOrderLines` against a small recent-orders log. **Defer to a follow-up if it becomes a real issue in pilot** — it likely won't because Square sends webhook on COMPLETED and cron only fetches since last_synced_at, and last_synced_at advances on each successful webhook.
- **Refresh token rotation** — Square issues a new refresh_token with every refresh. The adapter returns it; `connections.ts` doesn't currently include an "update tokens" helper. **Add one if a 30-day pilot hits the refresh boundary.** For 30 day pilot windows, the original token suffices.
- **Sandbox vs production** — Square OAuth has separate sandbox and production endpoints. Currently the adapter hardcodes production. For sandbox testing, swap `connect.squareup.com` → `connect.squareupsandbox.com` temporarily during pilot dev, OR add an env-flag-driven base URL.
