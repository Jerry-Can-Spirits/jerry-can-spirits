# Expedition Log Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "The Expedition Log" — opt-in public listing of bottle buyers with name, location, date, and optional message, backed by a Cloudflare D1 table, a Turnstile-protected API route, a Leaflet+heat map, and a public `/expedition-log/` page.

**Architecture:** POST submissions hit `/api/expedition-log`, which validates a Turnstile token, geocodes location via Mapbox, and inserts into D1. The public page is a server component reading D1 directly. The form appears on the batch detail page, the expedition log page, and in the QR-Squared HTML widget. The heat map uses npm-installed Leaflet with the `leaflet.heat` plugin and Mapbox dark tiles.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1 (SQLite), Cloudflare Turnstile, Mapbox Geocoding API, Mapbox tiles, Leaflet.js + leaflet.heat (npm), TypeScript, Tailwind CSS, Playwright (tests)

**Spec:** `docs/superpowers/specs/2026-04-01-expedition-log-design.md`

**Note on CDN vs npm for Leaflet:** The spec specifies CDN loading for Leaflet and leaflet.heat. This plan deviates: Leaflet is already npm-installed (`leaflet ^1.9.4`). Loading a second copy via CDN on pages that also have StockistMap would create two Leaflet instances and likely break both maps. `leaflet.heat` is installed from npm instead. The SSR issue is handled identically to `StockistMap.tsx` — dynamic import inside `useEffect`.

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `migrations/0010_expedition_log.sql` | Create | D1 table + indexes |
| `src/lib/d1.ts` | Modify | `ExpeditionLogEntry` interface + `getExpeditionLogEntries` |
| `src/app/api/expedition-log/route.ts` | Create | POST handler: Turnstile → Mapbox geocode → D1 insert |
| `src/components/ExpeditionLogForm.tsx` | Create | Client form component with Turnstile widget |
| `src/components/ExpeditionLogMap.tsx` | Create | Client map with Leaflet heat layer + Mapbox tiles |
| `src/app/expedition-log/page.tsx` | Create | Public page: header, map, list, form |
| `src/components/BatchDetails.tsx` | Modify | Add Expedition Log section below existing cards |
| `src/components/Footer.tsx` | Modify | Add `The Expedition Log` to `The Brand` link group |
| `next.config.ts` | Modify | CSP: Turnstile + Mapbox origins |
| `tests/e2e/expedition-log.spec.ts` | Create | Playwright tests |

---

## Chunk 1: Database and Query Layer

### Task 1: D1 migration

**Files:**
- Create: `migrations/0010_expedition_log.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Expedition Log: opt-in public listing of bottle buyers
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0010_expedition_log.sql

CREATE TABLE IF NOT EXISTS expedition_log (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  location_lat REAL,
  location_lng REAL,
  message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  removed_at TEXT -- NULL = visible; set via migration to soft-delete
);

CREATE INDEX IF NOT EXISTS idx_expedition_log_created_at
  ON expedition_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expedition_log_batch_id
  ON expedition_log(batch_id);
```

- [ ] **Step 2: Apply the migration to remote D1**

```bash
wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0010_expedition_log.sql
```

Expected: `Successfully applied migration` (or similar confirmation with no errors).

- [ ] **Step 3: Commit**

```bash
git add migrations/0010_expedition_log.sql
git commit -m "feat: add expedition_log D1 table"
```

---

### Task 2: D1 query layer

**Files:**
- Modify: `src/lib/d1.ts`

- [ ] **Step 1: Write the failing e2e test**

Create `tests/e2e/expedition-log.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Expedition Log page', () => {
  test('page loads with correct heading', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('The Expedition Log')
  })

  test('form is present on expedition log page', async ({ page }) => {
    await page.goto('/expedition-log/')
    await expect(page.locator('form')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })

  test('expedition log form appears on batch detail page', async ({ page }) => {
    await page.goto('/batch/001/')
    await expect(page.locator('input[name="name"]')).toBeVisible()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
BASE_URL=https://jerrycanspirits.co.uk npx playwright test tests/e2e/expedition-log.spec.ts --reporter=line
```

Expected: All 3 tests FAIL (pages don't exist yet).

- [ ] **Step 3: Add `ExpeditionLogEntry` interface and `getExpeditionLogEntries` to `src/lib/d1.ts`**

Append after the existing charity queries (after line 227):

```typescript
// ── Expedition Log Queries ────────────────────────────────────────────

export interface ExpeditionLogEntry {
  id: string;
  batch_id: string;
  name: string;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  message: string | null;
  created_at: string;
}

export async function getExpeditionLogEntries(db: D1Database): Promise<ExpeditionLogEntry[]> {
  const result = await db
    .prepare(
      `SELECT id, batch_id, name, location, location_lat, location_lng, message, created_at
       FROM expedition_log
       WHERE removed_at IS NULL
       ORDER BY created_at DESC`,
    )
    .all<ExpeditionLogEntry>();
  return result.results;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/d1.ts tests/e2e/expedition-log.spec.ts
git commit -m "feat: add ExpeditionLogEntry interface and query to d1.ts"
```

---

### Task 3: API route

**Files:**
- Create: `src/app/api/expedition-log/route.ts`

The route validates a Cloudflare Turnstile token, optionally geocodes via Mapbox, then inserts into D1. Secrets come from `getCloudflareContext().env` — never `process.env` (Cloudflare Workers runtime).

- [ ] **Step 1: Install leaflet.heat (needed for Task 5 — do it now to avoid a second install later)**

```bash
npm install leaflet.heat
```

- [ ] **Step 2: Create the API route**

```typescript
// src/app/api/expedition-log/route.ts
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getD1 } from '@/lib/d1'

interface RequestBody {
  name: string
  batch_id: string
  location?: string
  message?: string
  turnstileToken: string
  website?: string
}

// Simple in-memory rate limit — best-effort secondary deterrent (Turnstile is primary)
const submissionTimestamps = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60 * 1000
const MAX_REQUESTS = 3

export async function POST(request: Request) {
  try {
    let body: RequestBody
    try {
      body = (await request.json()) as RequestBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { name: rawName, batch_id, location: rawLocation, message: rawMessage, turnstileToken, website } = body

    // Honeypot
    if (website && website.trim() !== '') {
      return NextResponse.json({ success: true })
    }

    // Validate inputs
    const name = rawName?.trim() ?? ''
    const location = rawLocation?.trim() ?? ''
    const message = rawMessage?.trim() ?? ''

    if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!batch_id?.trim()) return NextResponse.json({ error: 'Batch ID is required.' }, { status: 400 })
    if (!turnstileToken?.trim()) return NextResponse.json({ error: 'Bot check token is required.' }, { status: 400 })
    if (name.length > 100) return NextResponse.json({ error: 'Name must be 100 characters or fewer.' }, { status: 400 })
    if (location.length > 100) return NextResponse.json({ error: 'Location must be 100 characters or fewer.' }, { status: 400 })
    if (message.length > 500) return NextResponse.json({ error: 'Message must be 500 characters or fewer.' }, { status: 400 })

    // Rate limiting (best-effort)
    const fwd = request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip') || 'unknown'
    const ip = fwd.split(',')[0].trim()
    const now = Date.now()
    const timestamps = submissionTimestamps.get(ip) || []
    const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)
    if (recent.length >= MAX_REQUESTS) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
    recent.push(now)
    submissionTimestamps.set(ip, recent)

    // Access Cloudflare secrets
    const { env } = await getCloudflareContext()
    const TURNSTILE_SECRET_KEY = env.TURNSTILE_SECRET_KEY as string | undefined
    const MAPBOX_SECRET_TOKEN = env.MAPBOX_SECRET_TOKEN as string | undefined

    if (!TURNSTILE_SECRET_KEY) {
      console.error('TURNSTILE_SECRET_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
    }

    // Verify Turnstile token
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: TURNSTILE_SECRET_KEY, response: turnstileToken }),
    })
    const turnstileData = await turnstileRes.json() as { success: boolean }
    if (!turnstileData.success) {
      return NextResponse.json({ error: 'Bot check failed.' }, { status: 400 })
    }

    // Geocode location (non-blocking — failure does not reject the submission)
    let location_lat: number | null = null
    let location_lng: number | null = null
    if (location && MAPBOX_SECRET_TOKEN) {
      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?country=gb&limit=1&access_token=${MAPBOX_SECRET_TOKEN}`
        )
        const geoData = await geoRes.json() as { features?: Array<{ geometry: { coordinates: [number, number] } }> }
        if (geoData.features?.[0]) {
          // Mapbox returns [longitude, latitude]
          location_lng = geoData.features[0].geometry.coordinates[0]
          location_lat = geoData.features[0].geometry.coordinates[1]
        }
      } catch (err) {
        console.error('Mapbox geocoding failed (non-blocking):', err)
      }
    }

    // Insert
    const db = await getD1()
    const id = crypto.randomUUID()
    await db
      .prepare(
        `INSERT INTO expedition_log (id, batch_id, name, location, location_lat, location_lng, message)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        batch_id.trim(),
        name,
        location || null,
        location_lat,
        location_lng,
        message || null,
      )
      .run()

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Expedition log submission error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/expedition-log/route.ts
git commit -m "feat: add expedition log API route with Turnstile validation and Mapbox geocoding"
```

---

## Chunk 2: Client Components and CSP

### Task 4: ExpeditionLogForm component

**Files:**
- Create: `src/components/ExpeditionLogForm.tsx`

This is a client component. It loads the Turnstile script and renders the challenge widget inside the form. On submit it reads `cf-turnstile-response` from FormData and posts to the API route.

- [ ] **Step 1: Create the component**

```typescript
// src/components/ExpeditionLogForm.tsx
'use client'

import { useRef, useState } from 'react'
import Script from 'next/script'

interface Props {
  batchId: string
}

export default function ExpeditionLogForm({ batchId }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)

    const name = (fd.get('name') as string)?.trim() ?? ''
    const location = (fd.get('location') as string)?.trim() ?? ''
    const message = (fd.get('message') as string)?.trim() ?? ''
    const turnstileToken = (fd.get('cf-turnstile-response') as string) ?? ''
    const website = (fd.get('website') as string) ?? ''

    if (!name) {
      setErrorMessage('Name is required.')
      setStatus('error')
      return
    }

    setStatus('submitting')
    setErrorMessage('')

    try {
      const res = await fetch('/api/expedition-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          batch_id: batchId,
          location: location || undefined,
          message: message || undefined,
          turnstileToken,
          website,
        }),
      })

      if (res.status === 201) {
        setStatus('success')
      } else {
        const data = await res.json() as { error?: string }
        setErrorMessage(data.error ?? 'Something went wrong. Please try again.')
        setStatus('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-parchment-300 text-sm">
        {"You're on the log. Welcome to the expedition."}
      </p>
    )
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="log-name" className="block text-parchment-400 text-sm mb-1">
            Your name
          </label>
          <input
            id="log-name"
            type="text"
            name="name"
            required
            maxLength={100}
            placeholder="Your name"
            autoComplete="name"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label htmlFor="log-location" className="block text-parchment-400 text-sm mb-1">
            Location <span className="text-parchment-600">(optional)</span>
          </label>
          <input
            id="log-location"
            type="text"
            name="location"
            maxLength={100}
            placeholder="City, country"
            autoComplete="off"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400"
          />
        </div>
        <div>
          <label htmlFor="log-message" className="block text-parchment-400 text-sm mb-1">
            Notes from the field <span className="text-parchment-600">(optional)</span>
          </label>
          <textarea
            id="log-message"
            name="message"
            maxLength={500}
            rows={3}
            placeholder="Notes from the field"
            className="w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400 resize-none"
          />
        </div>
        {/* Turnstile widget — auto-populates cf-turnstile-response hidden input */}
        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          data-theme="dark"
        />
        {/* Honeypot — type="text" so bots fill it, sr-only so humans don't see it */}
        <input
          type="text"
          name="website"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        {status === 'error' && (
          <p className="text-red-400 text-sm">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full sm:w-auto px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {status === 'submitting' ? 'Sending...' : 'Join the Expedition Log'}
        </button>
      </form>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExpeditionLogForm.tsx
git commit -m "feat: add ExpeditionLogForm client component with Turnstile"
```

---

### Task 5: ExpeditionLogMap component

**Files:**
- Create: `src/components/ExpeditionLogMap.tsx`
- Create: `src/types/leaflet-heat.d.ts` (type declaration for leaflet.heat)

Uses npm `leaflet` (already installed) + `leaflet.heat` (installed in Task 3). Dynamic import inside `useEffect` to avoid SSR. Mapbox dark tiles.

- [ ] **Step 1: Create the type declaration for leaflet.heat**

```typescript
// src/types/leaflet-heat.d.ts
// export {} makes this a module, enabling the declare module augmentation below
export {}

declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number] | [number, number, number]>,
    options?: {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: Record<number, string>
    }
  ): Layer
}
```

- [ ] **Step 2: Create the map component**

```typescript
// src/components/ExpeditionLogMap.tsx
'use client'

import { useEffect, useRef } from 'react'
import type { ExpeditionLogEntry } from '@/lib/d1'

interface Props {
  entries: ExpeditionLogEntry[]
}

export default function ExpeditionLogMap({ entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)

  // Filter inside the effect (stable dependency on `entries` reference)
  const hasCoords = entries.some((e) => e.location_lat !== null)

  useEffect(() => {
    if (!containerRef.current) return

    // Re-filter inside the effect to avoid unstable array reference in deps
    const entriesWithCoords = entries.filter(
      (e): e is ExpeditionLogEntry & { location_lat: number; location_lng: number } =>
        e.location_lat !== null && e.location_lng !== null
    )
    if (entriesWithCoords.length === 0) return

    const container = containerRef.current

    import('leaflet').then(async (L) => {
      // leaflet.heat extends L in-place, no export needed
      await import('leaflet.heat')

      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: true,
      })

      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      L.tileLayer(
        `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}@2x?access_token=${token}`,
        {
          tileSize: 512,
          zoomOffset: -1,
          attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
      ).addTo(map)

      const heatData: [number, number, number][] = entriesWithCoords.map((e) => [
        e.location_lat,
        e.location_lng,
        1,
      ])

      L.heatLayer(heatData, { radius: 30, blur: 20, maxZoom: 10 }).addTo(map)

      const bounds = L.latLngBounds(entriesWithCoords.map((e) => [e.location_lat, e.location_lng]))
      map.fitBounds(bounds, { padding: [40, 40] })

      mapRef.current = map
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [entries])

  if (!hasCoords) return null

  return <div ref={containerRef} className="w-full h-64 rounded-xl" />
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors. If there are errors about `leaflet.heat`, check that `src/types/leaflet-heat.d.ts` is being picked up — confirm `tsconfig.json` includes `src/types` (or has `"include": ["src/**/*"]`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ExpeditionLogMap.tsx src/types/leaflet-heat.d.ts
git commit -m "feat: add ExpeditionLogMap component with Leaflet heat layer and Mapbox tiles"
```

---

### Task 6: CSP and environment variables

**Files:**
- Modify: `next.config.ts`

**Note:** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN` must also be added to `.env.local` for local development and to Cloudflare Pages environment variables for production. The secret keys (`TURNSTILE_SECRET_KEY`, `MAPBOX_SECRET_TOKEN`) go only in Cloudflare Pages environment variables — never in `.env.local` committed to git.

- [ ] **Step 1: Add the new CSP origins to `next.config.ts`**

Locate the `script-src` line (line ~70) and add `https://challenges.cloudflare.com` to both `script-src` and `script-src-elem`.

Locate `frame-src` and add `https://challenges.cloudflare.com`.

Locate `connect-src` and add `https://api.mapbox.com`.

The `img-src` directive already contains `https:` wildcard which covers Mapbox tile requests — no change needed.

**`script-src`** — add at the end before the closing quote:
```
... https://tracker.metricool.com blob: https://challenges.cloudflare.com"
```

**`script-src-elem`** — add at the end:
```
... https://tracker.metricool.com https://challenges.cloudflare.com"
```

**`frame-src`** — add at the end:
```
... https://www.googletagmanager.com about: data: https://challenges.cloudflare.com"
```

**`connect-src`** — add at the end before `wss: ws:`:
```
... https://tracker.metricool.com https://api.mapbox.com wss: ws:"
```

- [ ] **Step 2: Verify TypeScript compiles and build runs**

```bash
npx tsc --noEmit && npx next build 2>&1 | tail -20
```

Expected: Build succeeds or fails only on missing env vars (not CSP/TS errors).

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: add Turnstile and Mapbox CSP origins"
```

---

## Chunk 3: Pages and Integration

### Task 7: /expedition-log/ page

**Files:**
- Create: `src/app/expedition-log/page.tsx`

Server component. Reads D1 directly. `dynamic = 'force-dynamic'`. Static metadata.

- [ ] **Step 1: Create the page**

```typescript
// src/app/expedition-log/page.tsx
import type { Metadata } from 'next'
import nextDynamic from 'next/dynamic'
import { getD1, getExpeditionLogEntries } from '@/lib/d1'
import ExpeditionLogForm from '@/components/ExpeditionLogForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log | Jerry Can Spirits®',
  description: 'A public record of the people who bought the first bottles. Names, places, and notes from the field.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/expedition-log/',
  },
}

const ExpeditionLogMap = nextDynamic(() => import('@/components/ExpeditionLogMap'), { ssr: false })

export default async function ExpeditionLogPage() {
  const db = await getD1()
  const entries = await getExpeditionLogEntries(db)
  const hasCoords = entries.some((e) => e.location_lat !== null)

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The Expedition Log
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            The Expedition Log
          </h1>
          <p className="text-parchment-300 leading-relaxed max-w-xl mx-auto">
            A record of the people who carried the first bottles. Opt-in — each entry is a choice.
          </p>
        </div>

        {/* Map */}
        {hasCoords && (
          <div className="mb-12">
            <ExpeditionLogMap entries={entries} />
          </div>
        )}

        {/* Entry list */}
        <div className="mb-16">
          {entries.length > 0 ? (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-white font-semibold">{entry.name}</p>
                      {entry.location && (
                        <p className="text-parchment-400 text-sm mt-0.5">{entry.location}</p>
                      )}
                    </div>
                    <p className="text-parchment-500 text-xs flex-shrink-0">
                      {new Date(entry.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {entry.message && (
                    <p className="text-parchment-300 text-sm leading-relaxed italic mt-3 border-t border-gold-500/10 pt-3">
                      {entry.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-parchment-500 text-sm">No entries yet. Be the first.</p>
          )}
        </div>

        {/* Form section */}
        <div className="bg-jerry-green-800/40 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-serif font-bold text-white mb-2">Join the Log</h2>
          <p className="text-parchment-300 text-sm mb-6">
            If you bought a bottle and want to be on the record, add your name.
          </p>
          <ExpeditionLogForm batchId="batch-001" />
        </div>

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/expedition-log/page.tsx
git commit -m "feat: add /expedition-log/ page"
```

---

### Task 8: BatchDetails integration

**Files:**
- Modify: `src/components/BatchDetails.tsx`

Add the Expedition Log section below the Founder's Notes card.

- [ ] **Step 1: Add the import and new section to `BatchDetails.tsx`**

Add at the top of the file (after existing imports):
```typescript
import ExpeditionLogForm from './ExpeditionLogForm'
```

Add after the closing `{batch.founder_notes && ...}` block (before the closing `</div>` of the outer `space-y-8` div), around line 97:

```tsx
{/* Expedition Log */}
<div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
  <h2 className="text-2xl font-serif font-bold text-white mb-2">The Expedition Log</h2>
  <p className="text-parchment-300 text-sm mb-6">
    If this is your bottle, add your name to the log. A public record of the people who were here first.
  </p>
  <ExpeditionLogForm batchId={batch.id} />
</div>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchDetails.tsx
git commit -m "feat: add Expedition Log form to batch detail page"
```

---

### Task 9: Footer link

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Add `The Expedition Log` to the `The Brand` link group**

In `src/components/Footer.tsx`, find the `The Brand` link group in `quickLinkGroups` (currently around line 38). Add the new link after `Where the 5% Goes`:

```typescript
{ name: 'The Expedition Log', href: '/expedition-log/' },
```

The array should read:
```typescript
links: [
  { name: 'Home', href: '/' },
  { name: 'Our Story', href: '/about/story' },
  { name: 'Sustainability', href: '/sustainability' },
  { name: 'Friends & Partners', href: '/friends' },
  { name: 'Where the 5% Goes', href: '/giving/' },
  { name: 'The Expedition Log', href: '/expedition-log/' },
]
```

- [ ] **Step 2: Run the expedition log e2e tests (post-deploy verification)**

After deploying to Cloudflare Pages:

```bash
BASE_URL=https://jerrycanspirits.co.uk npx playwright test tests/e2e/expedition-log.spec.ts --reporter=line
```

Expected: All 3 tests PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add Expedition Log footer link"
```

---

### Task 10: QR-Squared HTML edits

**Files:**
- No codebase files — these are edits to the external QR-Squared HTML widget managed outside the repo.

Three edits to apply in the QR-Squared dashboard:

**Edit 1: Bottle image** — Replace:
```html
<span class="acc-bottle-ph">Bottle<br>image<br>here</span>
```
With:
```html
<img src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/c8ba631a-3382-4bb5-d935-57ac653ca500/public" alt="Expedition Spiced Rum" style="width:100%;height:100%;object-fit:cover;border-radius:6px">
```

**Edit 2: Batch page link** — Add directly below the `acc-prod-batch` badge div:
```html
<a href="https://jerrycanspirits.co.uk/batch/001/" style="display:inline-block;font-size:9px;color:#b8960c;text-decoration:underline;margin-top:6px" target="_blank">View batch details →</a>
```

**Edit 3: Expedition Log section** — See spec at `docs/superpowers/specs/2026-04-01-expedition-log-design.md` section "QR-Squared HTML Widget" for:
- CSS classes to append to `<style>` block
- New `<details>` accordion section with Turnstile
- Inline `jcsLogSubmit` script before closing `</div>` of `#jcs-acc`

Replace `YOUR_TURNSTILE_SITE_KEY` with the actual site key from the Cloudflare Turnstile dashboard.

- [ ] **Step 1: Apply all three edits in QR-Squared dashboard**
- [ ] **Step 2: Scan the QR code on a bottle and verify the accordion opens, the form is present, and the bottle image shows correctly**

---

## Environment Variables Checklist

Before deploying, ensure these are set in **Cloudflare Pages** environment variables (Settings → Environment variables):

| Variable | Value source | Exposure |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile dashboard → Secret key | Server only |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile dashboard → Site key | Public (NEXT_PUBLIC_) |
| `MAPBOX_SECRET_TOKEN` | Mapbox account → Access tokens → Create restricted token (geocoding only) | Server only |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox account → Access tokens → Create public token (restricted to jerrycanspirits.co.uk) | Public (NEXT_PUBLIC_) |

For local dev, add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`. Do not add the secret keys to `.env.local`.
