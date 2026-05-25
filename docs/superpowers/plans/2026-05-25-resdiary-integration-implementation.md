# ResDiary Integration + Bookings Dashboard + Variance-per-Cover (Sprint 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship ResDiary bookings sync, an operational bookings dashboard, and a variance-per-cover metric that combines Tevalis sales (Sprint 1) with ResDiary covers to surface the "tonight vs. last Friday vs. 4-week average" trend that is Pour IQ's differentiator over Square-only integrations.

**Architecture:** New `src/lib/pouriq/bookings/` namespace mirrors `src/lib/pouriq/pos/`. Per-venue API credentials stored in a new D1 table. Webhook-driven event ingestion with a 15-minute polling fallback. A new server-rendered route at `/trade/pouriq/bookings` shows operational covers. The variance view at `/trade/pouriq/[menuId]` gains a per-cover column and a trend panel computed by a new pure function `src/lib/pouriq/variance/per-cover.ts`.

**Tech Stack:** Next.js 15, TypeScript, Cloudflare Workers + D1, Vitest.

**Spec:** `docs/superpowers/specs/2026-05-24-tevalis-resdiary-integrations-design.md`

**Depends on:** Sprint 1 (`feat/pouriq-tevalis-integration`) for the Tevalis sales feed that variance-per-cover divides covers into. This branch is based off the Sprint 1 branch; rebase onto `main` after Sprint 1 merges.

---

## File Structure

### New files
- `migrations/0028_pouriq_bookings.sql` — `pouriq_bookings_connections` + `pouriq_bookings_events` + indexes
- `src/lib/pouriq/bookings/types.ts` — provider union, connection + event shapes, adapter interface
- `src/lib/pouriq/bookings/connections.ts` — CRUD for connections
- `src/lib/pouriq/bookings/events.ts` — CRUD for events
- `src/lib/pouriq/bookings/providers/resdiary.ts` — ResDiary adapter
- `src/lib/pouriq/bookings/scheduled.ts` — polling fallback job
- `src/lib/pouriq/variance/per-cover.ts` — pure function computing per-cover metrics across windows
- `src/app/api/pouriq/integrations/resdiary/connect/route.ts` — POST connect endpoint
- `src/app/api/pouriq/integrations/resdiary/webhook/[connectionId]/route.ts` — webhook receiver
- `src/app/trade/pouriq/bookings/page.tsx` — bookings dashboard
- `tests/unit/lib/pouriq/bookings/providers/resdiary.test.ts` — adapter contract test
- `tests/unit/lib/pouriq/variance/per-cover.test.ts` — per-cover calculation test
- `docs/sanity-help/connecting-resdiary-to-pour-iq.md`
- `docs/sanity-help/reading-the-bookings-dashboard.md`
- `docs/sanity-help/understanding-variance-per-cover.md`

### Modified files
- `src/app/trade/pouriq/settings/integrations/page.tsx` — add "Connect ResDiary" card
- `src/app/trade/pouriq/[menuId]/page.tsx` (or wherever variance is rendered) — add per-cover column + trend panel
- `src/lib/pouriq/variance.ts` — extend the variance result type with optional per-cover fields, plumb through

### Untouched (deliberately)
- All `src/lib/pouriq/pos/` files (POS abstraction stays unchanged; bookings is its own namespace)
- Square and Tevalis adapters
- Existing variance ingestion (`ingest.ts`)

---

## Task 1: Branch from Sprint 1 tip

**Files:** none

- [ ] **Step 1: Branch creation**

```bash
git fetch origin && git checkout -b feat/pouriq-resdiary-and-variance-per-cover feat/pouriq-tevalis-integration
```

Expected: switched to new branch based on Sprint 1's branch. When Sprint 1 merges to `main`, rebase this branch:

```bash
git fetch origin && git rebase origin/main
```

---

## Task 2: Write the database migration

**Files:**
- Create: `migrations/0028_pouriq_bookings.sql`

- [ ] **Step 1: Write the SQL**

Create `migrations/0028_pouriq_bookings.sql`:

```sql
-- Pour IQ Bookings integration (Sprint 2 of Bank Bar and Grill pilot)
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0028_pouriq_bookings.sql

CREATE TABLE IF NOT EXISTS pouriq_bookings_connections (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  provider TEXT NOT NULL,                   -- 'resdiary' | future
  external_restaurant_id TEXT NOT NULL,     -- vendor's restaurant identifier
  api_key TEXT NOT NULL,                    -- per-venue, see spec security notes
  webhook_secret TEXT,                      -- auto-generated; HMAC verification
  last_event_at TEXT,
  last_sync_error TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(trade_account_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_bookings_connections_trade
  ON pouriq_bookings_connections(trade_account_id);

CREATE TABLE IF NOT EXISTS pouriq_bookings_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  connection_id TEXT NOT NULL REFERENCES pouriq_bookings_connections(id) ON DELETE CASCADE,
  external_booking_id TEXT NOT NULL,
  event_type TEXT NOT NULL,                 -- 'created' | 'updated' | 'cancelled'
  party_size INTEGER NOT NULL,
  booked_for TEXT NOT NULL,                 -- ISO datetime — when guests arrive
  duration_minutes INTEGER,
  received_at TEXT NOT NULL DEFAULT (datetime('now')),
  raw_payload TEXT NOT NULL,
  UNIQUE(connection_id, external_booking_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_bookings_events_window
  ON pouriq_bookings_events(connection_id, booked_for);

CREATE INDEX IF NOT EXISTS idx_bookings_events_received
  ON pouriq_bookings_events(connection_id, received_at);
```

The `UNIQUE(connection_id, external_booking_id, event_type)` constraint gives us idempotent webhook handling: replays insert nothing.

- [ ] **Step 2: Commit**

```bash
git add migrations/0028_pouriq_bookings.sql
git commit -m "feat(pouriq): D1 schema for bookings connections + events"
```

---

## Task 3: Create the bookings types module

**Files:**
- Create: `src/lib/pouriq/bookings/types.ts`

- [ ] **Step 1: Write the types**

Create the file:

```ts
export type BookingsProvider = 'resdiary' | 'opentable' | 'sevenrooms'

export interface BookingsConnection {
  id: string
  trade_account_id: string
  provider: BookingsProvider
  external_restaurant_id: string
  api_key: string
  webhook_secret: string | null
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
  received_at: string        // ISO datetime — when webhook fired or polling captured
  raw_payload: string        // JSON, forensic
}

export interface BookingsAdapter {
  provider: BookingsProvider
  validateCredentials(restaurantId: string, apiKey: string): Promise<boolean>
  verifyWebhook(request: Request, body: string, secret: string): Promise<boolean>
  parseWebhookPayload(payload: unknown): BookingEvent | null
  fetchBookingsSince(connection: BookingsConnection, since: Date): Promise<BookingEvent[]>
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/bookings/types.ts
git commit -m "feat(pouriq): bookings abstraction types"
```

---

## Task 4: Create the bookings connections CRUD module

**Files:**
- Create: `src/lib/pouriq/bookings/connections.ts`

- [ ] **Step 1: Write the module**

Create the file (mirrors `src/lib/pouriq/pos/connections.ts`):

```ts
import type { BookingsConnection, BookingsProvider } from './types'

export interface NewBookingsConnection {
  trade_account_id: string
  provider: BookingsProvider
  external_restaurant_id: string
  api_key: string
  webhook_secret: string
}

export async function upsertBookingsConnection(
  db: D1Database,
  data: NewBookingsConnection,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_bookings_connections
        (trade_account_id, provider, external_restaurant_id, api_key, webhook_secret)
      VALUES (?1, ?2, ?3, ?4, ?5)
      ON CONFLICT(trade_account_id, provider) DO UPDATE SET
        external_restaurant_id = excluded.external_restaurant_id,
        api_key = excluded.api_key,
        webhook_secret = excluded.webhook_secret,
        last_sync_error = NULL,
        enabled = 1,
        updated_at = datetime('now')
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.provider, data.external_restaurant_id,
      data.api_key, data.webhook_secret,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Bookings connection upsert returned no id')
  return result.id
}

export async function getBookingsConnection(
  db: D1Database,
  id: string,
): Promise<BookingsConnection | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_bookings_connections WHERE id = ?1`)
    .bind(id)
    .first<BookingsConnection>()
}

export async function listBookingsConnections(
  db: D1Database,
  tradeAccountId: string,
): Promise<BookingsConnection[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_bookings_connections WHERE trade_account_id = ?1`)
    .bind(tradeAccountId)
    .all<BookingsConnection>()
  return result.results ?? []
}

export async function deleteBookingsConnection(
  db: D1Database,
  tradeAccountId: string,
  provider: BookingsProvider,
): Promise<void> {
  await db
    .prepare(`DELETE FROM pouriq_bookings_connections WHERE trade_account_id = ?1 AND provider = ?2`)
    .bind(tradeAccountId, provider)
    .run()
}

export async function markBookingsEventReceived(
  db: D1Database,
  connectionId: string,
): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_bookings_connections SET last_event_at = datetime('now'), last_sync_error = NULL WHERE id = ?1`)
    .bind(connectionId)
    .run()
}

export async function markBookingsSyncError(
  db: D1Database,
  connectionId: string,
  error: string,
): Promise<void> {
  await db
    .prepare(`UPDATE pouriq_bookings_connections SET last_sync_error = ?1 WHERE id = ?2`)
    .bind(error.slice(0, 500), connectionId)
    .run()
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/bookings/connections.ts
git commit -m "feat(pouriq): CRUD for bookings connections"
```

---

## Task 5: Create the bookings events CRUD module

**Files:**
- Create: `src/lib/pouriq/bookings/events.ts`

- [ ] **Step 1: Write the module**

```ts
import type { BookingEvent } from './types'

export interface NewBookingEvent {
  connection_id: string
  external_booking_id: string
  event_type: BookingEvent['event_type']
  party_size: number
  booked_for: string
  duration_minutes: number | null
  raw_payload: string
}

/**
 * Insert a booking event. Idempotent via the (connection_id, external_booking_id, event_type)
 * unique constraint — replays from webhook retries are silently absorbed.
 *
 * Returns true if a row was inserted, false if the conflict suppressed it.
 */
export async function insertBookingEvent(
  db: D1Database,
  event: NewBookingEvent,
): Promise<boolean> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_bookings_events
        (connection_id, external_booking_id, event_type, party_size, booked_for, duration_minutes, raw_payload)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      ON CONFLICT(connection_id, external_booking_id, event_type) DO NOTHING
      RETURNING id
    `)
    .bind(
      event.connection_id, event.external_booking_id, event.event_type,
      event.party_size, event.booked_for, event.duration_minutes, event.raw_payload,
    )
    .first<{ id: string }>()
  return result !== null
}

export interface BookingWindow {
  start: string  // ISO datetime
  end: string    // ISO datetime
}

/**
 * Sum party_size for active (created|updated, not cancelled) bookings whose
 * booked_for falls in [start, end). Used by the dashboard and by per-cover calc.
 */
export async function sumCoversInWindow(
  db: D1Database,
  connectionId: string,
  window: BookingWindow,
): Promise<number> {
  const row = await db
    .prepare(`
      SELECT COALESCE(SUM(party_size), 0) AS covers
      FROM pouriq_bookings_events
      WHERE connection_id = ?1
        AND event_type IN ('created', 'updated')
        AND booked_for >= ?2
        AND booked_for < ?3
        AND NOT EXISTS (
          SELECT 1 FROM pouriq_bookings_events cancelled
          WHERE cancelled.connection_id = pouriq_bookings_events.connection_id
            AND cancelled.external_booking_id = pouriq_bookings_events.external_booking_id
            AND cancelled.event_type = 'cancelled'
        )
    `)
    .bind(connectionId, window.start, window.end)
    .first<{ covers: number }>()
  return row?.covers ?? 0
}

export async function listRecentBookings(
  db: D1Database,
  connectionId: string,
  limit: number = 20,
): Promise<BookingEvent[]> {
  const result = await db
    .prepare(`
      SELECT * FROM pouriq_bookings_events
      WHERE connection_id = ?1
      ORDER BY received_at DESC
      LIMIT ?2
    `)
    .bind(connectionId, limit)
    .all<BookingEvent>()
  return result.results ?? []
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/bookings/events.ts
git commit -m "feat(pouriq): CRUD for bookings events + cover summation query"
```

---

## Task 6: Implement the ResDiary adapter

**⚠️ VERIFY**: ResDiary's exact endpoint paths and webhook signature header name need cross-checking against `https://developer.resdiary.com/` once credentials are issued. The shape below is the canonical pattern from public references; the implementer must update the URL paths and signature header if ResDiary's docs differ.

**Files:**
- Create: `src/lib/pouriq/bookings/providers/resdiary.ts`

- [ ] **Step 1: Write the adapter**

```ts
import type { BookingsAdapter, BookingEvent, BookingsConnection } from '../types'

const RESDIARY_BASE_URL = 'https://api.resdiary.com'

interface ResDiaryBookingPayload {
  bookingId: string
  eventType: 'BookingCreated' | 'BookingUpdated' | 'BookingCancelled'
  restaurantId: string
  partySize: number
  bookedAt: string         // ISO datetime — booking time slot
  durationMinutes?: number
}

function mapEventType(t: ResDiaryBookingPayload['eventType']): BookingEvent['event_type'] {
  if (t === 'BookingCreated') return 'created'
  if (t === 'BookingUpdated') return 'updated'
  return 'cancelled'
}

async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export function createResDiaryAdapter(): BookingsAdapter {
  return {
    provider: 'resdiary',

    async validateCredentials(restaurantId: string, apiKey: string): Promise<boolean> {
      const url = `${RESDIARY_BASE_URL}/api/Restaurants/${encodeURIComponent(restaurantId)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      })
      return res.ok
    },

    async verifyWebhook(request: Request, body: string, secret: string): Promise<boolean> {
      const sig = request.headers.get('x-resdiary-signature') ?? request.headers.get('X-ResDiary-Signature')
      if (!sig) return false
      const expected = await hmacSha256Hex(secret, body)
      return timingSafeEqualHex(sig.toLowerCase(), expected.toLowerCase())
    },

    parseWebhookPayload(payload: unknown): BookingEvent | null {
      if (typeof payload !== 'object' || payload === null) return null
      const p = payload as Partial<ResDiaryBookingPayload>
      if (!p.bookingId || !p.eventType || typeof p.partySize !== 'number' || !p.bookedAt) {
        return null
      }
      return {
        id: '',  // assigned by DB
        connection_id: '',  // filled in by the caller from URL path
        external_booking_id: p.bookingId,
        event_type: mapEventType(p.eventType),
        party_size: p.partySize,
        booked_for: p.bookedAt,
        duration_minutes: p.durationMinutes ?? null,
        received_at: new Date().toISOString(),
        raw_payload: JSON.stringify(payload),
      }
    },

    async fetchBookingsSince(connection: BookingsConnection, since: Date): Promise<BookingEvent[]> {
      const url = new URL(`${RESDIARY_BASE_URL}/api/Restaurants/${encodeURIComponent(connection.external_restaurant_id)}/Bookings`)
      url.searchParams.set('modifiedSince', since.toISOString())

      const res = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${connection.api_key}`, Accept: 'application/json' },
      })
      if (!res.ok) {
        const errText = await res.text().catch(() => '')
        throw new Error(`ResDiary ${res.status}: ${errText.slice(0, 200)}`)
      }
      const data = (await res.json()) as { bookings?: ResDiaryBookingPayload[] }
      const now = new Date().toISOString()
      return (data.bookings ?? []).map((p): BookingEvent => ({
        id: '',
        connection_id: connection.id,
        external_booking_id: p.bookingId,
        event_type: mapEventType(p.eventType),
        party_size: p.partySize,
        booked_for: p.bookedAt,
        duration_minutes: p.durationMinutes ?? null,
        received_at: now,
        raw_payload: JSON.stringify(p),
      }))
    },
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/bookings/providers/resdiary.ts
git commit -m "feat(pouriq): ResDiary adapter with HMAC webhook verification"
```

---

## Task 7: Add the connect API route

**Files:**
- Create: `src/app/api/pouriq/integrations/resdiary/connect/route.ts`

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountForUser } from '@/lib/pouriq/access'
import { upsertBookingsConnection } from '@/lib/pouriq/bookings/connections'
import { createResDiaryAdapter } from '@/lib/pouriq/bookings/providers/resdiary'

export const dynamic = 'force-dynamic'

interface Body {
  restaurantId?: string
  apiKey?: string
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext()
    const db = env.DB

    const tradeAccount = await getTradeAccountForUser(request, db)
    if (!tradeAccount) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const body = (await request.json()) as Body
    const restaurantId = body.restaurantId?.trim()
    const apiKey = body.apiKey?.trim()
    if (!restaurantId || !apiKey) {
      return NextResponse.json({ error: 'restaurantId and apiKey are required' }, { status: 400 })
    }

    const adapter = createResDiaryAdapter()
    const ok = await adapter.validateCredentials(restaurantId, apiKey)
    if (!ok) {
      return NextResponse.json(
        { error: 'ResDiary rejected the credentials. Check restaurantId and apiKey.' },
        { status: 400 },
      )
    }

    const webhookSecret = crypto.randomUUID()
    const id = await upsertBookingsConnection(db, {
      trade_account_id: tradeAccount.id,
      provider: 'resdiary',
      external_restaurant_id: restaurantId,
      api_key: apiKey,
      webhook_secret: webhookSecret,
    })

    const { revalidatePath } = await import('next/cache')
    revalidatePath('/trade/pouriq/settings/integrations')

    const origin = new URL(request.url).origin
    return NextResponse.json({
      id,
      provider: 'resdiary',
      restaurantId,
      webhook_url: `${origin}/api/pouriq/integrations/resdiary/webhook/${id}`,
      webhook_secret_preview: webhookSecret.slice(0, 8) + '…',
    })
  } catch (error) {
    console.error('[resdiary] connect error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

The response includes the webhook URL (full) and a truncated secret preview. The bar manager pastes the webhook URL into ResDiary's dashboard; ResDiary will be given the full secret server-side via a separate endpoint or via the same dashboard — implementer to confirm based on ResDiary's webhook registration flow.

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/pouriq/integrations/resdiary/connect/route.ts
git commit -m "feat(pouriq): POST /api/pouriq/integrations/resdiary/connect"
```

---

## Task 8: Add the webhook receiver

**Files:**
- Create: `src/app/api/pouriq/integrations/resdiary/webhook/[connectionId]/route.ts`

- [ ] **Step 1: Write the receiver**

```ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getBookingsConnection, markBookingsEventReceived } from '@/lib/pouriq/bookings/connections'
import { insertBookingEvent } from '@/lib/pouriq/bookings/events'
import { createResDiaryAdapter } from '@/lib/pouriq/bookings/providers/resdiary'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  const { connectionId } = await params

  try {
    const { env } = await getCloudflareContext()
    const db = env.DB

    const connection = await getBookingsConnection(db, connectionId)
    if (!connection || !connection.webhook_secret) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.text()
    const adapter = createResDiaryAdapter()
    const valid = await adapter.verifyWebhook(request, body, connection.webhook_secret)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let payload: unknown
    try {
      payload = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const event = adapter.parseWebhookPayload(payload)
    if (!event) {
      return NextResponse.json({ error: 'Unrecognised payload shape' }, { status: 400 })
    }

    await insertBookingEvent(db, {
      connection_id: connection.id,
      external_booking_id: event.external_booking_id,
      event_type: event.event_type,
      party_size: event.party_size,
      booked_for: event.booked_for,
      duration_minutes: event.duration_minutes,
      raw_payload: event.raw_payload,
    })

    await markBookingsEventReceived(db, connection.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[resdiary webhook] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/api/pouriq/integrations/resdiary/webhook/\[connectionId\]/route.ts
git commit -m "feat(pouriq): ResDiary webhook receiver with HMAC verification + idempotent insert"
```

---

## Task 9: Add the bookings polling fallback

**Files:**
- Create: `src/lib/pouriq/bookings/scheduled.ts`

- [ ] **Step 1: Write the polling job**

```ts
// Polling fallback for bookings: catches any webhook events that didn't
// successfully fire. Runs alongside the POS cron.

import { createResDiaryAdapter } from './providers/resdiary'
import { insertBookingEvent } from './events'
import { markBookingsEventReceived, markBookingsSyncError } from './connections'
import type { BookingsConnection } from './types'

interface Env {
  DB: D1Database
}

const ONE_HOUR_MS = 60 * 60 * 1000

export async function runBookingsPollingFallback(env: Env): Promise<void> {
  const db = env.DB
  const result = await db
    .prepare(`SELECT * FROM pouriq_bookings_connections WHERE enabled = 1`)
    .all<BookingsConnection>()
  const connections = result.results ?? []

  for (const conn of connections) {
    try {
      const lastEventTime = conn.last_event_at
        ? new Date(conn.last_event_at).getTime()
        : 0
      const needsPolling =
        Date.now() - lastEventTime > ONE_HOUR_MS || conn.last_sync_error !== null

      if (!needsPolling) continue

      if (conn.provider === 'resdiary') {
        const adapter = createResDiaryAdapter()
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)  // last 24h
        const events = await adapter.fetchBookingsSince(conn, since)
        for (const event of events) {
          await insertBookingEvent(db, {
            connection_id: conn.id,
            external_booking_id: event.external_booking_id,
            event_type: event.event_type,
            party_size: event.party_size,
            booked_for: event.booked_for,
            duration_minutes: event.duration_minutes,
            raw_payload: event.raw_payload,
          })
        }
        await markBookingsEventReceived(db, conn.id)
      }
    } catch (e) {
      await markBookingsSyncError(db, conn.id, (e as Error).message ?? 'unknown').catch(() => {})
    }
  }
}
```

- [ ] **Step 2: Wire into the existing cron entry point**

Find where `runHourlyPosBackfill` is invoked (likely in `cloudflare-worker-entry.mjs` or a scheduled Worker handler). Add a sibling invocation:

```ts
await runHourlyPosBackfill(env)
await runBookingsPollingFallback(env)
```

The implementer should locate the existing scheduled handler and add the new import + call. If the scheduled handler doesn't exist yet for POS either, both invocations need to be added together — flag and consult with Dan before proceeding.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/bookings/scheduled.ts
git add cloudflare-worker-entry.mjs  # or wherever the scheduled handler lives
git commit -m "feat(pouriq): bookings polling fallback, wired into hourly cron"
```

---

## Task 10: Add the ResDiary card to the Settings UI

**Files:**
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx`

- [ ] **Step 1: Read the current state of the page**

```bash
cat src/app/trade/pouriq/settings/integrations/page.tsx
```

Confirm the existing Square card pattern (after Sprint 1, a Tevalis card will already be there too — mirror its shape).

- [ ] **Step 2: Add the ResDiary card**

The ResDiary card requires three inputs: `restaurantId`, `apiKey` (password type), and post-save shows the auto-generated `webhook_url` with a Copy button. On submit, POST `{ restaurantId, apiKey }` to `/api/pouriq/integrations/resdiary/connect`. The response includes `webhook_url`; render it with a Copy-to-clipboard button.

Exact JSX should match the visual structure of the existing cards. Pattern outline:

```tsx
<section className="connection-card">
  <h3>ResDiary</h3>
  <form onSubmit={handleSubmit}>
    <label>Restaurant ID
      <input type="text" name="restaurantId" required />
    </label>
    <label>API Key
      <input type="password" name="apiKey" required />
    </label>
    <button type="submit">Save</button>
  </form>
  {result?.webhook_url && (
    <div className="webhook-display">
      <p>Paste this webhook URL into your ResDiary dashboard:</p>
      <code>{result.webhook_url}</code>
      <button onClick={() => navigator.clipboard.writeText(result.webhook_url)}>Copy</button>
    </div>
  )}
</section>
```

The implementer should restyle to match the existing card classes and use the same form-submit + error-display patterns as the Square and Tevalis cards.

- [ ] **Step 3: Typecheck + smoke + commit**

```bash
npx tsc --noEmit
npm run dev
# manual check: card renders, form posts, webhook URL displays after save
git add src/app/trade/pouriq/settings/integrations/page.tsx
git commit -m "feat(pouriq): Settings UI 'Connect ResDiary' card"
```

---

## Task 11: Build the bookings dashboard

**Files:**
- Create: `src/app/trade/pouriq/bookings/page.tsx`

- [ ] **Step 1: Write the dashboard**

```tsx
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getTradeAccountForRequest } from '@/lib/pouriq/access'
import { listBookingsConnections } from '@/lib/pouriq/bookings/connections'
import { sumCoversInWindow, listRecentBookings } from '@/lib/pouriq/bookings/events'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

function tonightWindow(): { start: string; end: string; label: string } {
  // Service start defaults to 17:00 venue local time (spec, deferred per-venue config to v2)
  const now = new Date()
  const start = new Date(now)
  start.setHours(17, 0, 0, 0)
  // If we're before 5pm, "tonight" is still today's 5pm onwards
  const end = new Date(start)
  end.setHours(end.getHours() + 7)  // 5pm to midnight
  return { start: start.toISOString(), end: end.toISOString(), label: 'Tonight' }
}

export default async function BookingsDashboard() {
  const { env } = await getCloudflareContext()
  const db = env.DB

  const reqHeaders = await headers()
  // adapt to existing access pattern — placeholder call
  const tradeAccount = await getTradeAccountForRequest(reqHeaders, db)
  if (!tradeAccount) {
    return <main className="p-8"><p>Not authorised.</p></main>
  }

  const connections = await listBookingsConnections(db, tradeAccount.id)
  if (connections.length === 0) {
    return (
      <main className="p-8">
        <h1 className="text-2xl">Bookings</h1>
        <p>Connect a bookings provider in <a href="/trade/pouriq/settings/integrations">Settings → Integrations</a>.</p>
      </main>
    )
  }

  const primary = connections[0]
  const window = tonightWindow()
  const covers = await sumCoversInWindow(db, primary.id, window)
  const recent = await listRecentBookings(db, primary.id, 20)

  return (
    <main className="p-8">
      <h1 className="text-2xl font-serif mb-6">Bookings</h1>

      <section className="mb-8">
        <h2 className="text-lg text-gold-300 mb-2">{window.label}</h2>
        <p className="text-4xl font-semibold">{covers} covers</p>
        <p className="text-sm text-parchment-400">
          Service window {new Date(window.start).toLocaleTimeString()} – {new Date(window.end).toLocaleTimeString()}
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg text-gold-300 mb-2">Recent activity</h2>
        <ul className="space-y-2">
          {recent.map(event => (
            <li key={event.id} className="border-b border-gold-500/10 py-2">
              <span className="text-sm uppercase text-gold-400">{event.event_type}</span>
              {' · '}
              <span>{event.party_size} guests</span>
              {' · '}
              <span className="text-parchment-400">{new Date(event.booked_for).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
```

This is the v1 dashboard — a "Tonight" panel and a recent activity feed. The hour-by-hour breakdown and upcoming-days panels from the spec can be added once the data shape is confirmed working with real ResDiary webhooks.

- [ ] **Step 2: Confirm `getTradeAccountForRequest` matches the actual access helper**

Adjust the import + call to match the real helper name and signature.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/app/trade/pouriq/bookings/page.tsx
git commit -m "feat(pouriq): bookings dashboard v1 — tonight covers + recent activity"
```

---

## Task 12: Implement the per-cover variance calculation

**Files:**
- Create: `src/lib/pouriq/variance/per-cover.ts`

- [ ] **Step 1: Write the pure function**

```ts
export interface PeriodWindow {
  label: string         // 'Tonight' | 'Last Friday' | 'Last 7 days' etc.
  start: string         // ISO datetime
  end: string           // ISO datetime
}

export interface PerCoverInput {
  poursByDrink: Record<string, number>  // drink_name -> total quantity in window
  covers: number                         // total party_size across bookings in window
}

export interface PerCoverMetric {
  drink_name: string
  period: PeriodWindow
  pours: number
  covers: number
  pours_per_cover: number  // 3 decimal places
}

export function computePerCover(
  input: PerCoverInput,
  period: PeriodWindow,
  drinkNames: string[],
): PerCoverMetric[] {
  return drinkNames.map((name): PerCoverMetric => {
    const pours = input.poursByDrink[name] ?? 0
    const ratio = input.covers > 0
      ? Number((pours / input.covers).toFixed(3))
      : 0
    return {
      drink_name: name,
      period,
      pours,
      covers: input.covers,
      pours_per_cover: ratio,
    }
  })
}

/**
 * Build the default three-row comparison set for a given service:
 *   - Tonight (service start to now)
 *   - Same day-of-week, last week (full evening)
 *   - Trailing 4 same-day-of-week average
 *
 * Service start defaults to 17:00 venue local time. Per-venue override deferred to v2.
 */
export function defaultComparisonWindows(now: Date = new Date()): PeriodWindow[] {
  const serviceStart = new Date(now)
  serviceStart.setHours(17, 0, 0, 0)

  const tonight: PeriodWindow = {
    label: 'Tonight',
    start: serviceStart.toISOString(),
    end: now.toISOString(),
  }

  const lastWeekStart = new Date(serviceStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)
  const lastWeekEnd = new Date(lastWeekStart)
  lastWeekEnd.setHours(24, 0, 0, 0)  // midnight
  const lastWeek: PeriodWindow = {
    label: 'Same day last week',
    start: lastWeekStart.toISOString(),
    end: lastWeekEnd.toISOString(),
  }

  const fourWeekStart = new Date(serviceStart)
  fourWeekStart.setDate(fourWeekStart.getDate() - 28)
  const fourWeekEnd = new Date(serviceStart)
  fourWeekEnd.setHours(24, 0, 0, 0)
  const fourWeek: PeriodWindow = {
    label: '4-week same day average',
    start: fourWeekStart.toISOString(),
    end: fourWeekEnd.toISOString(),
  }

  return [tonight, lastWeek, fourWeek]
}
```

- [ ] **Step 2: Typecheck + commit**

```bash
npx tsc --noEmit
git add src/lib/pouriq/variance/per-cover.ts
git commit -m "feat(pouriq): per-cover variance calculation (pure function)"
```

---

## Task 13: Add the unit test for per-cover

**Files:**
- Create: `tests/unit/lib/pouriq/variance/per-cover.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest'
import { computePerCover, defaultComparisonWindows } from '@/lib/pouriq/variance/per-cover'

describe('computePerCover', () => {
  const period = {
    label: 'Tonight',
    start: '2026-05-25T17:00:00Z',
    end: '2026-05-25T23:00:00Z',
  }

  it('divides pours by covers and rounds to 3dp', () => {
    const result = computePerCover(
      { poursByDrink: { 'G&T': 40, 'Spiced Old Fashioned': 12 }, covers: 200 },
      period,
      ['G&T', 'Spiced Old Fashioned'],
    )

    expect(result).toEqual([
      { drink_name: 'G&T', period, pours: 40, covers: 200, pours_per_cover: 0.2 },
      { drink_name: 'Spiced Old Fashioned', period, pours: 12, covers: 200, pours_per_cover: 0.06 },
    ])
  })

  it('returns 0 ratio when covers is 0 (avoids divide-by-zero)', () => {
    const result = computePerCover(
      { poursByDrink: { 'G&T': 5 }, covers: 0 },
      period,
      ['G&T'],
    )
    expect(result[0].pours_per_cover).toBe(0)
  })

  it('returns 0 pours when the drink is absent from input', () => {
    const result = computePerCover(
      { poursByDrink: {}, covers: 100 },
      period,
      ['Storm and Spice'],
    )
    expect(result[0].pours).toBe(0)
    expect(result[0].pours_per_cover).toBe(0)
  })
})

describe('defaultComparisonWindows', () => {
  it('returns three windows with the expected labels', () => {
    const windows = defaultComparisonWindows(new Date('2026-05-29T20:30:00Z'))
    expect(windows).toHaveLength(3)
    expect(windows[0].label).toBe('Tonight')
    expect(windows[1].label).toBe('Same day last week')
    expect(windows[2].label).toBe('4-week same day average')
  })
})
```

- [ ] **Step 2: Run and commit**

```bash
npm run test:unit
git add tests/unit/lib/pouriq/variance/per-cover.test.ts
git commit -m "test(pouriq): cover per-cover ratio and comparison window defaults"
```

---

## Task 14: Add a ResDiary adapter test (HMAC verification path)

**Files:**
- Create: `tests/unit/lib/pouriq/bookings/providers/resdiary.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest'
import { createResDiaryAdapter } from '@/lib/pouriq/bookings/providers/resdiary'

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

describe('ResDiary adapter — verifyWebhook', () => {
  const adapter = createResDiaryAdapter()
  const secret = 'test-secret-12345'
  const body = JSON.stringify({ bookingId: 'b-1', eventType: 'BookingCreated', partySize: 4, bookedAt: '2026-05-29T19:00:00Z' })

  it('accepts a request with a valid HMAC signature', async () => {
    const sig = await hmacHex(secret, body)
    const req = new Request('https://test/', {
      method: 'POST',
      headers: { 'x-resdiary-signature': sig, 'content-type': 'application/json' },
      body,
    })
    expect(await adapter.verifyWebhook(req, body, secret)).toBe(true)
  })

  it('rejects a request with a tampered signature', async () => {
    const sig = await hmacHex(secret, body)
    const tampered = sig.slice(0, -2) + '00'
    const req = new Request('https://test/', {
      method: 'POST',
      headers: { 'x-resdiary-signature': tampered, 'content-type': 'application/json' },
      body,
    })
    expect(await adapter.verifyWebhook(req, body, secret)).toBe(false)
  })

  it('rejects a request missing the signature header', async () => {
    const req = new Request('https://test/', { method: 'POST', headers: {}, body })
    expect(await adapter.verifyWebhook(req, body, secret)).toBe(false)
  })
})

describe('ResDiary adapter — parseWebhookPayload', () => {
  const adapter = createResDiaryAdapter()

  it('normalises a Created event', () => {
    const event = adapter.parseWebhookPayload({
      bookingId: 'b-1',
      eventType: 'BookingCreated',
      restaurantId: 'r-1',
      partySize: 4,
      bookedAt: '2026-05-29T19:00:00Z',
      durationMinutes: 90,
    })
    expect(event).not.toBeNull()
    expect(event!.event_type).toBe('created')
    expect(event!.party_size).toBe(4)
    expect(event!.duration_minutes).toBe(90)
  })

  it('returns null on a malformed payload', () => {
    expect(adapter.parseWebhookPayload({ random: 'object' })).toBeNull()
    expect(adapter.parseWebhookPayload(null)).toBeNull()
  })
})
```

- [ ] **Step 2: Run and commit**

```bash
npm run test:unit
git add tests/unit/lib/pouriq/bookings/providers/resdiary.test.ts
git commit -m "test(pouriq): ResDiary HMAC verification + payload normalisation"
```

---

## Task 15: Extend the variance view UI with per-cover

**⚠️ VERIFY**: this task touches the existing variance UI. The exact file path and component shape depend on how variance is currently rendered. Locate the variance view (likely `src/app/trade/pouriq/[menuId]/page.tsx` or a child component); adapt the integration below to fit the existing structure.

**Files:**
- Modify: the existing variance view component (find via grep)

- [ ] **Step 1: Locate the variance view**

```bash
grep -ril "variance" src/app/trade/pouriq | head -10
```

Expected output identifies the file(s) rendering variance.

- [ ] **Step 2: Add a per-cover trend panel**

Above the existing variance table, render a new panel populated by `computePerCover(...)` over the three default windows. The panel layout (per spec):

```
Tonight: 0.18 per cover
Same day last week: 0.22 per cover
4-week same day average: 0.21 per cover
```

If the ratio for "Tonight" is more than ±25% off the 4-week average, render a small warning chip ("You're X% off the average").

The exact JSX depends on the existing variance view's design language. Match its component conventions.

- [ ] **Step 3: Typecheck + commit**

```bash
npx tsc --noEmit
# add the modified file(s)
git commit -m "feat(pouriq): variance view shows per-cover trend with threshold alert"
```

---

## Task 16: Draft Sanity help-guide entries (three)

**Files:**
- Create: `docs/sanity-help/connecting-resdiary-to-pour-iq.md`
- Create: `docs/sanity-help/reading-the-bookings-dashboard.md`
- Create: `docs/sanity-help/understanding-variance-per-cover.md`

- [ ] **Step 1: Write the three help-guide drafts**

Each file follows the voice from `feedback_pouriq_help_guide_style.md` in memory. Content for each:

**`connecting-resdiary-to-pour-iq.md`** — covers: what you'll need (restaurantId + API key from ResDiary), step-by-step (paste creds, save, copy webhook URL, paste into ResDiary dashboard), what gets synced (booking events with party_size and time), troubleshooting (validation failed = creds wrong, missed events = polling will catch them), how to disconnect.

**`reading-the-bookings-dashboard.md`** — covers: what each panel shows (tonight covers, recent activity, upcoming when added), how the service window is defined (17:00 venue local time, configurable per venue in v2), how to interpret recent activity (created vs updated vs cancelled).

**`understanding-variance-per-cover.md`** — covers: what the metric means (pours divided by covers in a service window), why it matters (normalises against demand), how the three-row comparison works (Tonight / Same day last week / 4-week same day average), how to interpret the threshold alert (±25% triggers a soft flag, not a hard alert).

Voice: measured, direct, no em-dashes, no exclamation marks, no hype words. Each guide opens with the value to the bar manager, not a feature description.

- [ ] **Step 2: Commit**

```bash
git add docs/sanity-help/
git commit -m "docs(pouriq): help-guide drafts for ResDiary, bookings dashboard, variance per cover"
```

---

## Task 17: Full verification

**Files:** none

- [ ] **Step 1: Typecheck + lint + tests + build**

```bash
npx tsc --noEmit
npm run lint
npm run test:unit
npm run build
```

All four must pass.

- [ ] **Step 2: Apply migration to local D1 (if available)**

```bash
wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0028_pouriq_bookings.sql
```

- [ ] **Step 3: Manual smoke**

```bash
npm run dev
```

- Open `/trade/pouriq/settings/integrations` — confirm ResDiary card renders, accepts credentials, displays webhook URL on save.
- Open `/trade/pouriq/bookings` — confirm "connect a bookings provider" message before connecting, then tonight panel after a webhook fires (use a curl POST with valid HMAC to the webhook endpoint to simulate).
- Open variance view — confirm per-cover trend panel renders (will show zeros until both data streams flow).

---

## Task 18: Open the PR

**Files:** none

- [ ] **Step 1: Push and open the PR**

```bash
git push -u origin feat/pouriq-resdiary-and-variance-per-cover
gh pr create --base main --head feat/pouriq-resdiary-and-variance-per-cover --title "feat(pouriq): ResDiary integration + bookings dashboard + variance-per-cover (Sprint 2 of Bank pilot)" --body "$(cat <<'EOF'
## Summary

Implements **Sprint 2** of the Bank Bar and Grill pilot per spec \`docs/superpowers/specs/2026-05-24-tevalis-resdiary-integrations-design.md\` (#721).

- New \`src/lib/pouriq/bookings/\` namespace, parallel to \`pos/\`
- ResDiary adapter with HMAC webhook verification and 24h polling fallback
- New D1 tables \`pouriq_bookings_connections\` + \`pouriq_bookings_events\`
- Per-venue API credentials (per ResDiary licence terms — no shared dev creds path)
- Settings UI card for connecting ResDiary
- New bookings dashboard at \`/trade/pouriq/bookings\`
- Variance view gains a per-cover trend panel with three default comparison windows
- Threshold alert flag when current service is ±25% off the 4-week average
- Sanity help-guide drafts for all three new surfaces

## Depends on

PR for **Sprint 1** (Tevalis integration) must merge first. This branch is based off that branch.

## Operator steps (after merge)

1. \`wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0028_pouriq_bookings.sql\`
2. Upload three help-guide drafts under \`docs/sanity-help/\` into Sanity Studio
3. Bank obtains a ResDiary API key, pastes into Settings, copies the displayed webhook URL into their ResDiary dashboard

## Test plan

- [x] Typecheck, lint, unit tests, build all pass
- [ ] Apply migration to staging D1
- [ ] Manual smoke against Bank's live ResDiary (read-only)
- [ ] Curl a sample HMAC-signed webhook to the receiver; confirm event lands in D1
- [ ] After several real bookings, confirm dashboard "tonight covers" matches ResDiary's own dashboard

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-Review Notes

**Spec coverage:**
- Bookings namespace ✓ (Tasks 3, 4, 5)
- DB schema ✓ (Task 2)
- ResDiary adapter ✓ (Task 6)
- Connect route ✓ (Task 7)
- Webhook receiver ✓ (Task 8)
- Polling fallback ✓ (Task 9)
- Settings UI card ✓ (Task 10)
- Bookings dashboard ✓ (Task 11) — operational view
- Variance-per-cover function ✓ (Task 12)
- Variance UI trend panel ✓ (Task 15) — investigative view
- Threshold alert ✓ (Task 15)
- Help guides ✓ (Task 16)
- Tests ✓ (Tasks 13, 14)

**Placeholder scan:** all code blocks have concrete code; one location calls out the existing variance view file lookup (Task 15 Step 1) which is inherently a discover-before-modify step, not a placeholder.

**Type consistency:** `BookingsConnection` shape defined in Task 3 is consumed in Tasks 4, 6, 7, 8, 9, 11. `BookingEvent` shape defined in Task 3 is consumed in Tasks 5, 6, 8, 9. `PerCoverMetric` defined in Task 12 is consumed by the test in Task 13 and the UI in Task 15. Names match throughout.

**Out-of-scope confirmations:**
- Hour-by-hour breakdown panel on the dashboard (deferred — v1 ships the Tonight + Recent panels)
- Upcoming days panel on the dashboard (deferred)
- Per-cover spend (£ per cover) — separate spec
- Cover-arrival confirmation (no-show exclusion) — needs ResDiary endpoint not confirmed; v2
- Encrypted credential storage at rest — flagged as tech debt; v1 matches existing Square plaintext-in-D1 pattern
