# Pour IQ Variance v2 (rolling whole-bar counts) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace per-menu period (start+end) stock variance with a rolling, whole-bar (tenant) model: count each bottle-priced ingredient once on your normal rhythm, and variance auto-pairs the two most recent counts; theoretical usage = every cocktail AND serve that pours the ingredient, summed over the count window; coverage-flagged, reason-coded, trended, ordered by £-impact.

**Architecture:** New append-only table `pouriq_stock_count_events` (one row per count, tenant+ingredient+timestamp). Pure rolling-variance helpers added to `variance.ts` (reusing the shipped `classifyVariance` / `calcVarianceCostP` / `costPerMlP`). A new tenant-level loader assembles rows from: count events (latest 2 + trend), tenant-wide recipe lines (cocktails + serves), tenant-wide POS volumes bucketed in the window, and an unmatched-lines coverage count in the window. A new tenant-level API route (`/api/pouriq/variance`) + page (`/trade/pouriq/variance`) replace the per-menu variance section. `VarianceEditor` is reworked into a rolling-count list.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js App Router (route handlers + server pages + client components), TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-23-pouriq-variance-v2-design.md` (Phase 2).

**Branch:** `feat/pouriq-variance-v2` (already created off `origin/main`).

**Key existing code (from subsystem map):**
- `src/lib/pouriq/variance.ts` — pure calc: `VarianceRow`, `calcTheoreticalUsedMl`, `calcActualUsedMl`, `calcVariance`, `calcVarianceCostP`, `classifyVariance`, `VARIANCE_TOLERANCE_BOTTLES`, `VarianceSeverity`.
- `src/lib/pouriq/variance-loader.ts` — `'server-only'`, per-menu loader (`loadVarianceRows`, `loadVariancePayload`) — superseded by the new tenant loader; LEAVE this file in place (still imported by the per-menu route until Task 8 removes that route's use).
- `src/app/api/pouriq/menus/[menuId]/variance/route.ts` — per-menu GET/POST (v1). Removed/retired in Task 8.
- `src/components/pouriq/VarianceEditor.tsx` — `'use client'`, props `{ menuId, initialCadence }`, fetches the per-menu route. Reworked in Task 7.
- `src/app/trade/pouriq/[menuId]/page.tsx` — renders `<VarianceEditor menuId initialCadence />` at lines ~171-176 (the section removed in Task 8).
- `src/lib/pouriq/calculations.ts` — `costPerMlP(bottle_cost_p, bottle_size_ml, purchase_qty)`.
- `src/lib/pouriq/menus.ts` — `listServes(db, tradeAccountId)`, `getOrCreateServesMenu`, `listCocktailsForMenu` (returns `CocktailWithIngredients[]`).
- `src/lib/pouriq/pos/item-map.ts` — `countUnmatched`, `listUnmatched` (unmatched lines keyed by `normalised_name`, fields `quantity`, `sold_at`; NO ingredient link).
- `pouriq_drink_volumes` — `(cocktail_id, period_start, period_end, units_sold, source)`; cadence on `pouriq_menus.volume_cadence`.
- `checkPourIqAccess()` (auth), `isAllowedOrigin`, `isRateLimited` (KV), Sentry — used by existing routes; copy their usage exactly.

**Tenant-scoping rule:** every query reaches the tenant through `pouriq_cocktails.menu_id → pouriq_menus.trade_account_id`, or directly via `trade_account_id` on `pouriq_ingredients_library` / `pouriq_pos_unmatched_lines` / the new events table. Never trust a client-supplied tenant id; always use `access.tradeAccountId` from `checkPourIqAccess()`.

**Design refinements vs spec (confirmed):**
- Coverage flagging is **per-count-window, tenant-wide** (unmatched lines have no ingredient link): flag an ingredient when unmatched POS lines exist with `sold_at` inside that ingredient's count window.
- Variance is a **tenant-level page** `/trade/pouriq/variance`, not a per-menu section.

---

## File Structure

- Create `migrations/0041_stock_count_events.sql` — new table + index.
- Modify `src/lib/pouriq/types.ts` — `StockCountEventRow`, `VarianceReason` types.
- Modify `src/lib/pouriq/variance.ts` — add rolling-pair pure helpers + `RollingVarianceRow` + `persistentLossFlag` (pure, fully unit-tested).
- Create `src/lib/pouriq/variance-rolling-loader.ts` — `'server-only'` tenant loader (assembles rolling rows from D1).
- Create `src/app/api/pouriq/variance/route.ts` — tenant GET (load) + POST (save a count event).
- Create `src/app/trade/pouriq/variance/page.tsx` — tenant variance page (server) rendering the reworked editor.
- Rewrite `src/components/pouriq/VarianceEditor.tsx` — rolling-count list (tenant, no menuId).
- Modify `src/app/trade/pouriq/[menuId]/page.tsx` — replace the variance section with a link to the new page.
- Modify `src/app/trade/pouriq/page.tsx` — add a "Variance" link in the hub nav.
- Delete `src/app/api/pouriq/menus/[menuId]/variance/route.ts` (v1 route) in Task 8.
- Tests: `tests/unit/lib/pouriq-variance-rolling.test.ts`.

---

### Task 1: Migration — `pouriq_stock_count_events`

**Files:** Create `migrations/0041_stock_count_events.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Variance v2: rolling, whole-bar stock counts. One append-only row per count
-- of an ingredient. Variance pairs the two most recent counts per ingredient.
-- Supersedes pouriq_stock_counts (left in place, no longer written/read).
CREATE TABLE pouriq_stock_count_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  counted_at TEXT NOT NULL,           -- ISO timestamp (datetime('now') granularity)
  count_qty REAL NOT NULL,            -- bottles of that item (3.5 = three and a half)
  reason TEXT,                        -- nullable; over-pour/spillage/comps/breakage/theft/unknown
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stock_count_events_lookup
  ON pouriq_stock_count_events (trade_account_id, library_ingredient_id, counted_at);
```

- [ ] **Step 2: Verify the SQL is valid (apply against a scratch DB, not the drifted local dev DB)**

Run:
```bash
node -e "const s=require('fs').readFileSync('migrations/0041_stock_count_events.sql','utf8'); const db=require('node:sqlite'); const d=new db.DatabaseSync(':memory:'); d.exec('CREATE TABLE pouriq_ingredients_library(id TEXT PRIMARY KEY);'); d.exec(s); console.log('OK', d.prepare(\"SELECT name FROM pragma_table_info('pouriq_stock_count_events')\").all().map(r=>r.name).join(','));"
```
Expected: `OK id,trade_account_id,library_ingredient_id,counted_at,count_qty,reason,created_at`
(If `node:sqlite` is unavailable in this Node version, instead just eyeball the SQL and run `npx wrangler d1 execute jerry-can-spirits-db --local --command "$(cat migrations/0041_stock_count_events.sql)"` — the local DB may have unrelated drift; a successful CREATE of THIS table is the only thing that matters.)

- [ ] **Step 3: Commit**

```bash
git add migrations/0041_stock_count_events.sql
git commit -m "feat(pouriq): pouriq_stock_count_events table (variance v2)"
```

---

### Task 2: Types — count event row + reason codes

**Files:** Modify `src/lib/pouriq/types.ts`

- [ ] **Step 1: Add the row + reason types**

Append near the other Pour IQ row interfaces:
```ts
export const VARIANCE_REASONS = ['over-pour', 'spillage', 'comps', 'breakage', 'theft', 'unknown'] as const
export type VarianceReason = (typeof VARIANCE_REASONS)[number]

export interface StockCountEventRow {
  id: string
  trade_account_id: string
  library_ingredient_id: string
  counted_at: string
  count_qty: number
  reason: string | null
  created_at: string
}
```

- [ ] **Step 2: Build check + commit**

Run: `npx tsc --noEmit`
Expected: clean.
```bash
git add src/lib/pouriq/types.ts
git commit -m "feat(pouriq): types for stock count events + variance reasons"
```

---

### Task 3: Pure rolling-variance helpers (TDD)

**Files:** Modify `src/lib/pouriq/variance.ts`; Test `tests/unit/lib/pouriq-variance-rolling.test.ts`

Reuse existing `calcVariance`, `calcVarianceCostP`, `classifyVariance` (do NOT duplicate). Add: a window/pairing helper, theoretical-from-buckets summation, a rolling row type, and the persistent-loss flag.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/lib/pouriq-variance-rolling.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { pairLatestCounts, sumBucketsInWindow, persistentLossFlag } from '@/lib/pouriq/variance'

describe('pairLatestCounts', () => {
  it('returns the two most recent counts (latest + previous) by counted_at', () => {
    const events = [
      { counted_at: '2026-01-01T00:00:00Z', count_qty: 5, reason: null },
      { counted_at: '2026-03-01T00:00:00Z', count_qty: 2, reason: 'theft' },
      { counted_at: '2026-02-01T00:00:00Z', count_qty: 4, reason: null },
    ]
    const p = pairLatestCounts(events)
    expect(p).not.toBeNull()
    expect(p!.latest.counted_at).toBe('2026-03-01T00:00:00Z')
    expect(p!.previous.counted_at).toBe('2026-02-01T00:00:00Z')
  })
  it('returns null with fewer than two counts', () => {
    expect(pairLatestCounts([{ counted_at: '2026-01-01T00:00:00Z', count_qty: 5, reason: null }])).toBeNull()
    expect(pairLatestCounts([])).toBeNull()
  })
})

describe('sumBucketsInWindow', () => {
  const buckets = [
    { period_start: '2026-01-01', period_end: '2026-01-31', units_sold: 10 },
    { period_start: '2026-02-01', period_end: '2026-02-28', units_sold: 20 },
    { period_start: '2026-03-01', period_end: '2026-03-31', units_sold: 5 },
  ]
  it('sums buckets whose period falls within (windowStart, windowEnd]', () => {
    // window covering Feb only: period_start > 2026-01-31 AND period_end <= 2026-02-28
    expect(sumBucketsInWindow(buckets, '2026-01-31', '2026-02-28')).toBe(20)
  })
  it('includes multiple buckets in a wider window', () => {
    expect(sumBucketsInWindow(buckets, '2025-12-31', '2026-02-28')).toBe(30)
  })
  it('returns 0 when no bucket falls in the window', () => {
    expect(sumBucketsInWindow(buckets, '2026-03-31', '2026-04-30')).toBe(0)
  })
})

describe('persistentLossFlag', () => {
  it('flags when the last 3+ variances are all negative', () => {
    expect(persistentLossFlag([-100, -50, -200])).toBe(true)
    expect(persistentLossFlag([-100, -50, -200, -10])).toBe(true)
  })
  it('does not flag with fewer than 3, or a non-negative in the last 3', () => {
    expect(persistentLossFlag([-100, -50])).toBe(false)
    expect(persistentLossFlag([-100, 20, -200])).toBe(false)
    expect(persistentLossFlag([])).toBe(false)
  })
  it('uses only the most recent 3 (older positives do not save it)', () => {
    expect(persistentLossFlag([50, -100, -50, -200])).toBe(true)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run tests/unit/lib/pouriq-variance-rolling.test.ts`
Expected: FAIL (functions not exported).

- [ ] **Step 3: Implement the helpers in `variance.ts`**

Append to `src/lib/pouriq/variance.ts`:
```ts
export interface CountEvent {
  counted_at: string
  count_qty: number
  reason: string | null
}

export interface CountPair {
  latest: CountEvent
  previous: CountEvent
}

// The two most recent counts (by counted_at), or null if fewer than two.
export function pairLatestCounts(events: CountEvent[]): CountPair | null {
  if (events.length < 2) return null
  const sorted = [...events].sort((a, b) => a.counted_at.localeCompare(b.counted_at))
  return { latest: sorted[sorted.length - 1], previous: sorted[sorted.length - 2] }
}

// Sum POS units for buckets whose period falls within (windowStart, windowEnd].
// windowStart/windowEnd are ISO date strings (YYYY-MM-DD). Bucket boundaries
// are the cadence period_start/period_end. Exact when counts land on the
// cadence boundary, approximate mid-bucket (accepted caveat).
export function sumBucketsInWindow(
  buckets: Array<{ period_start: string; period_end: string; units_sold: number }>,
  windowStart: string,
  windowEnd: string,
): number {
  return buckets.reduce(
    (sum, b) => (b.period_start > windowStart && b.period_end <= windowEnd ? sum + b.units_sold : sum),
    0,
  )
}

// Persistent shrinkage: the most recent 3 variance figures are all negative.
export function persistentLossFlag(recentVariancesNewestLast: Array<number | null>): boolean {
  const defined = recentVariancesNewestLast.filter((v): v is number => v !== null)
  if (defined.length < 3) return false
  const lastThree = defined.slice(-3)
  return lastThree.every((v) => v < 0)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run tests/unit/lib/pouriq-variance-rolling.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/variance.ts tests/unit/lib/pouriq-variance-rolling.test.ts
git commit -m "feat(pouriq): rolling-variance pure helpers (pair, window sum, persistent loss)"
```

---

### Task 4: Tenant rolling-variance loader

**Files:** Create `src/lib/pouriq/variance-rolling-loader.ts`

This is the core data assembly. It is `'server-only'`. It reads (all tenant-scoped):
1. **Count events** for the tenant (all, ordered): grouped per ingredient → trend + the latest pair.
2. **Recipe lines** for the tenant across ALL menus INCLUDING the serves menu (cocktails + serves), bottle-priced ingredients only.
3. **POS volume buckets** for the tenant (join volumes → cocktails → menus for the tenant).
4. **Unmatched-line coverage** counts per window.

- [ ] **Step 1: Create the loader**

Create `src/lib/pouriq/variance-rolling-loader.ts`:
```ts
import 'server-only'
import type { D1Database } from '@cloudflare/workers-types'
import { costPerMlP } from './calculations'
import {
  pairLatestCounts, sumBucketsInWindow, persistentLossFlag,
  calcVariance, calcVarianceCostP, classifyVariance,
  type VarianceSeverity, type CountEvent,
} from './variance'

export interface RollingTrendPoint {
  counted_at: string
  variance_cost_p: number | null
  reason: string | null
}

export interface RollingVarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number
  bottle_cost_p: number
  purchase_qty: number
  latest_count_at: string | null
  latest_count_qty: number | null
  previous_count_at: string | null
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null
  variance_cost_p: number | null
  severity: VarianceSeverity
  impact_p: number          // ordering weight: per-ml cost x theoretical usage (always >= 0)
  unmatched_in_window: number   // coverage: unmatched POS lines (summed quantity) in the window
  latest_reason: string | null
  persistent_loss: boolean
  trend: RollingTrendPoint[]
}

interface RecipeLineRow {
  cocktail_id: string
  library_ingredient_id: string
  pour_ml: number
  name: string
  bottle_size_ml: number
  bottle_cost_p: number
  purchase_qty: number
}
interface VolumeRow { cocktail_id: string; period_start: string; period_end: string; units_sold: number }
interface EventRow { library_ingredient_id: string; counted_at: string; count_qty: number; reason: string | null }

// Tenant-wide bottle-priced recipe lines across cocktails AND serves (all menus).
async function readTenantRecipes(db: D1Database, tradeAccountId: string): Promise<RecipeLineRow[]> {
  const res = await db.prepare(`
    SELECT c.id AS cocktail_id, i.library_ingredient_id AS library_ingredient_id, i.pour_ml AS pour_ml,
           lib.name AS name, lib.bottle_size_ml AS bottle_size_ml, lib.bottle_cost_p AS bottle_cost_p,
           lib.purchase_qty AS purchase_qty
    FROM pouriq_cocktails c
    JOIN pouriq_menus m ON m.id = c.menu_id
    JOIN pouriq_ingredients i ON i.cocktail_id = c.id
    JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
    WHERE m.trade_account_id = ?1
      AND lib.bottle_size_ml IS NOT NULL AND lib.bottle_cost_p IS NOT NULL AND i.pour_ml IS NOT NULL
  `).bind(tradeAccountId).all<RecipeLineRow>()
  return res.results ?? []
}

async function readTenantVolumes(db: D1Database, tradeAccountId: string): Promise<VolumeRow[]> {
  const res = await db.prepare(`
    SELECT v.cocktail_id AS cocktail_id, v.period_start AS period_start, v.period_end AS period_end, v.units_sold AS units_sold
    FROM pouriq_drink_volumes v
    JOIN pouriq_cocktails c ON c.id = v.cocktail_id
    JOIN pouriq_menus m ON m.id = c.menu_id
    WHERE m.trade_account_id = ?1
  `).bind(tradeAccountId).all<VolumeRow>()
  return res.results ?? []
}

async function readTenantEvents(db: D1Database, tradeAccountId: string): Promise<EventRow[]> {
  const res = await db.prepare(`
    SELECT library_ingredient_id, counted_at, count_qty, reason
    FROM pouriq_stock_count_events
    WHERE trade_account_id = ?1
    ORDER BY counted_at ASC
  `).bind(tradeAccountId).all<EventRow>()
  return res.results ?? []
}

// Summed unmatched quantity with sold_at strictly within (windowStart, windowEnd].
// windowStart/windowEnd are ISO timestamps from counted_at.
async function readUnmatchedInWindow(db: D1Database, tradeAccountId: string, windowStart: string, windowEnd: string): Promise<number> {
  const row = await db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) AS q
    FROM pouriq_pos_unmatched_lines
    WHERE trade_account_id = ?1 AND sold_at > ?2 AND sold_at <= ?3
  `).bind(tradeAccountId, windowStart, windowEnd).first<{ q: number }>()
  return row?.q ?? 0
}

const TREND_LIMIT = 6

export async function loadRollingVariance(db: D1Database, tradeAccountId: string): Promise<RollingVarianceRow[]> {
  const [recipes, volumes, events] = await Promise.all([
    readTenantRecipes(db, tradeAccountId),
    readTenantVolumes(db, tradeAccountId),
    readTenantEvents(db, tradeAccountId),
  ])

  // Volumes indexed by cocktail.
  const volumesByCocktail = new Map<string, VolumeRow[]>()
  for (const v of volumes) {
    const arr = volumesByCocktail.get(v.cocktail_id) ?? []
    arr.push(v); volumesByCocktail.set(v.cocktail_id, arr)
  }

  // Recipe lines grouped by ingredient (for theoretical) + ingredient metadata.
  interface Meta { name: string; bottle_size_ml: number; bottle_cost_p: number; purchase_qty: number }
  const metaByIngredient = new Map<string, Meta>()
  const linesByIngredient = new Map<string, Array<{ cocktail_id: string; pour_ml: number }>>()
  for (const r of recipes) {
    if (!metaByIngredient.has(r.library_ingredient_id)) {
      metaByIngredient.set(r.library_ingredient_id, {
        name: r.name, bottle_size_ml: r.bottle_size_ml, bottle_cost_p: r.bottle_cost_p, purchase_qty: r.purchase_qty,
      })
    }
    const arr = linesByIngredient.get(r.library_ingredient_id) ?? []
    arr.push({ cocktail_id: r.cocktail_id, pour_ml: r.pour_ml })
    linesByIngredient.set(r.library_ingredient_id, arr)
  }

  // Events grouped by ingredient.
  const eventsByIngredient = new Map<string, EventRow[]>()
  for (const e of events) {
    const arr = eventsByIngredient.get(e.library_ingredient_id) ?? []
    arr.push(e); eventsByIngredient.set(e.library_ingredient_id, arr)
  }

  // Union of ingredients that have a recipe line OR a count event.
  const ingredientIds = new Set<string>([...linesByIngredient.keys(), ...eventsByIngredient.keys()])

  const rows: RollingVarianceRow[] = []
  for (const ingId of ingredientIds) {
    const meta = metaByIngredient.get(ingId)
    const ingEvents = eventsByIngredient.get(ingId) ?? []
    // Skip ingredients with a count but no usable (bottle-priced) recipe meta — nothing to compute.
    if (!meta) continue

    const lines = linesByIngredient.get(ingId) ?? []
    const pair = pairLatestCounts(ingEvents.map((e): CountEvent => ({ counted_at: e.counted_at, count_qty: e.count_qty, reason: e.reason })))

    // Theoretical usage over the window (or 0 when no pair yet).
    let theoretical = 0
    let actual: number | null = null
    let unmatched = 0
    if (pair) {
      const ws = pair.previous.counted_at
      const we = pair.latest.counted_at
      for (const line of lines) {
        const buckets = volumesByCocktail.get(line.cocktail_id) ?? []
        theoretical += sumBucketsInWindow(buckets, ws.slice(0, 10), we.slice(0, 10)) * line.pour_ml
      }
      actual = (pair.previous.count_qty - pair.latest.count_qty) * meta.bottle_size_ml
      unmatched = await readUnmatchedInWindow(db, tradeAccountId, ws, we)
    }

    const { variance_ml, variance_pct } = calcVariance(actual, theoretical)
    const variance_cost_p = calcVarianceCostP(variance_ml, meta.bottle_size_ml, meta.bottle_cost_p, meta.purchase_qty)
    const severity = classifyVariance(variance_ml, variance_pct, meta.bottle_size_ml)
    const impact_p = Math.round(theoretical * costPerMlP(meta.bottle_cost_p, meta.bottle_size_ml, meta.purchase_qty))

    // Trend: variance £ per count-to-count, newest last, up to TREND_LIMIT.
    // Recompute each consecutive pair's variance from events (actual only; theoretical for trend reuses the same window sum).
    const sortedEvents = [...ingEvents].sort((a, b) => a.counted_at.localeCompare(b.counted_at))
    const trend: RollingTrendPoint[] = []
    for (let k = 1; k < sortedEvents.length; k++) {
      const prev = sortedEvents[k - 1], cur = sortedEvents[k]
      let theo = 0
      for (const line of lines) {
        const buckets = volumesByCocktail.get(line.cocktail_id) ?? []
        theo += sumBucketsInWindow(buckets, prev.counted_at.slice(0, 10), cur.counted_at.slice(0, 10)) * line.pour_ml
      }
      const act = (prev.count_qty - cur.count_qty) * meta.bottle_size_ml
      const v = calcVariance(act, theo)
      trend.push({ counted_at: cur.counted_at, variance_cost_p: calcVarianceCostP(v.variance_ml, meta.bottle_size_ml, meta.bottle_cost_p, meta.purchase_qty), reason: cur.reason })
    }
    const recentTrend = trend.slice(-TREND_LIMIT)
    const persistent = persistentLossFlag(recentTrend.map((t) => t.variance_cost_p))

    rows.push({
      library_ingredient_id: ingId,
      library_name: meta.name,
      bottle_size_ml: meta.bottle_size_ml,
      bottle_cost_p: meta.bottle_cost_p,
      purchase_qty: meta.purchase_qty,
      latest_count_at: pair?.latest.counted_at ?? (ingEvents.length ? sortedEvents[sortedEvents.length - 1].counted_at : null),
      latest_count_qty: ingEvents.length ? sortedEvents[sortedEvents.length - 1].count_qty : null,
      previous_count_at: pair?.previous.counted_at ?? null,
      theoretical_used_ml: theoretical,
      actual_used_ml: actual,
      variance_ml, variance_pct, variance_cost_p, severity,
      impact_p,
      unmatched_in_window: unmatched,
      latest_reason: pair?.latest.reason ?? null,
      persistent_loss: persistent,
      trend: recentTrend,
    })
  }

  // Count-what-matters: order by £-impact desc, then name.
  rows.sort((a, b) => (b.impact_p - a.impact_p) || a.library_name.localeCompare(b.library_name))
  return rows
}
```

- [ ] **Step 2: Type-check + commit**

Run: `npx tsc --noEmit`
Expected: clean. (If `calcVariance` is not exported from `variance.ts`, export it — it currently is exported per the subsystem map.)
```bash
git add src/lib/pouriq/variance-rolling-loader.ts
git commit -m "feat(pouriq): tenant rolling-variance loader (cocktails + serves, coverage, trend)"
```

---

### Task 5: Tenant variance API route

**Files:** Create `src/app/api/pouriq/variance/route.ts`

Mirror the auth/rate-limit/Sentry style of the existing per-menu route (`src/app/api/pouriq/menus/[menuId]/variance/route.ts`) — READ IT FIRST and copy its imports and helper usage (`checkPourIqAccess`, `isAllowedOrigin`, KV `isRateLimited`, Sentry `captureException` with a tag). GET returns the rolling rows; POST appends a count event.

- [ ] **Step 1: Read the v1 route** to copy exact import paths and the `checkPourIqAccess()` result shape (`access.status === 'ok'`, `access.tradeAccountId`, how the KV binding is obtained for `isRateLimited`).

- [ ] **Step 2: Create the route**

Create `src/app/api/pouriq/variance/route.ts`:
```ts
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { isAllowedOrigin } from '@/lib/security/origin'
import { isRateLimited } from '@/lib/security/rate-limit'
import { getDb, getKv } from '@/lib/pouriq/runtime'   // match the v1 route's actual DB/KV accessors
import { loadRollingVariance } from '@/lib/pouriq/variance-rolling-loader'
import { VARIANCE_REASONS } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

const SAVE_RATE_LIMIT = 60

export async function GET() {
  const access = await checkPourIqAccess()
  if (access.status !== 'ok') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  try {
    const db = getDb()
    const rows = await loadRollingVariance(db, access.tradeAccountId)
    return NextResponse.json({ rows })
  } catch (e) {
    Sentry.captureException(e, { tags: { feature: 'pouriq-variance-v2/load' } })
    return NextResponse.json({ error: 'load failed' }, { status: 500 })
  }
}

interface PostBody {
  library_ingredient_id?: unknown
  count_qty?: unknown
  reason?: unknown
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const access = await checkPourIqAccess()
  if (access.status !== 'ok') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const kv = getKv()
  if (await isRateLimited(kv, 'pouriq-variance-save', access.tradeAccountId, SAVE_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 })
  }

  let body: PostBody
  try { body = (await request.json()) as PostBody } catch { return NextResponse.json({ error: 'bad json' }, { status: 400 }) }

  const ingredientId = typeof body.library_ingredient_id === 'string' ? body.library_ingredient_id : ''
  const qty = typeof body.count_qty === 'number' ? body.count_qty : NaN
  const reason = typeof body.reason === 'string' && (VARIANCE_REASONS as readonly string[]).includes(body.reason) ? body.reason : null
  if (!ingredientId || !Number.isFinite(qty) || qty < 0) {
    return NextResponse.json({ error: 'library_ingredient_id and a non-negative count_qty are required' }, { status: 400 })
  }

  try {
    const db = getDb()
    // Tenant guard: only insert if the ingredient belongs to this tenant.
    const owns = await db.prepare(
      `SELECT 1 FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`,
    ).bind(ingredientId, access.tradeAccountId).first()
    if (!owns) return NextResponse.json({ error: 'ingredient not found' }, { status: 404 })

    await db.prepare(`
      INSERT INTO pouriq_stock_count_events (trade_account_id, library_ingredient_id, counted_at, count_qty, reason)
      VALUES (?1, ?2, datetime('now'), ?3, ?4)
    `).bind(access.tradeAccountId, ingredientId, qty, reason).run()

    const rows = await loadRollingVariance(db, access.tradeAccountId)
    return NextResponse.json({ rows })
  } catch (e) {
    Sentry.captureException(e, { tags: { feature: 'pouriq-variance-v2/save' } })
    return NextResponse.json({ error: 'save failed' }, { status: 500 })
  }
}
```
**Implementer note:** the import paths above (`@/lib/pouriq/access`, `@/lib/security/origin`, `@/lib/security/rate-limit`, the DB/KV accessors) are PLACEHOLDER GUESSES — replace each with the EXACT module the v1 route uses (read it first). The logic/shape is what matters.

- [ ] **Step 3: Build + commit**

Run: `npm run build`
Expected: passes; route `ƒ /api/pouriq/variance` emitted.
```bash
git add src/app/api/pouriq/variance/route.ts
git commit -m "feat(pouriq): tenant variance API (rolling counts)"
```

---

### Task 6: Tenant variance page + nav link

**Files:** Create `src/app/trade/pouriq/variance/page.tsx`; Modify `src/app/trade/pouriq/page.tsx`

- [ ] **Step 1: Read a sibling tenant page** (`src/app/trade/pouriq/unmatched/page.tsx`) for the exact access-gate pattern (`checkPourIqAccess` → `no-session` redirect, `no-licence` `<LicenceGate/>`, `export const dynamic = 'force-dynamic'`) and layout/heading classes.

- [ ] **Step 2: Create the page**

Create `src/app/trade/pouriq/variance/page.tsx` (match the sibling's gate exactly; the editor fetches its own data client-side, so the page just gates + renders):
```tsx
import { VarianceEditor } from '@/components/pouriq/VarianceEditor'
// ...import the same access gate + LicenceGate the sibling page uses

export const dynamic = 'force-dynamic'

export default async function VariancePage() {
  // EXACT same gate as src/app/trade/pouriq/unmatched/page.tsx
  // (checkPourIqAccess(); no-session -> redirect('/trade/login'); no-licence -> <LicenceGate/>)
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <a href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">All menus</a>
      <h1 className="text-2xl font-bold text-white mt-2 mb-1">Variance</h1>
      <p className="text-sm text-parchment-400 mb-6">
        Count each bottle on your normal weekly or monthly rhythm. We compare what the till says you poured with what you actually have left, across every cocktail and serve.
      </p>
      <VarianceEditor />
    </main>
  )
}
```

- [ ] **Step 3: Add a "Variance" link to the Pour IQ hub** in `src/app/trade/pouriq/page.tsx` where the Library/Serves/Integrations links live (match `SECONDARY_BUTTON` styling), pointing to `/trade/pouriq/variance`.

- [ ] **Step 4: Build + commit**

Run: `npm run build`
```bash
git add src/app/trade/pouriq/variance/page.tsx src/app/trade/pouriq/page.tsx
git commit -m "feat(pouriq): tenant variance page + hub link"
```

---

### Task 7: VarianceEditor rework (rolling-count list)

**Files:** Rewrite `src/components/pouriq/VarianceEditor.tsx`

Replace the per-menu/period editor with a tenant rolling-count list. No `menuId`/`initialCadence` props. Fetches `/api/pouriq/variance`.

- [ ] **Step 1: Rewrite the component**

`src/components/pouriq/VarianceEditor.tsx` (`'use client'`):
- State: `rows: RollingVarianceRow[] | null`, `counts: Record<string,string>` (the "count now" input per ingredient), `reasons: Record<string,string>`, `loading`, `error`, `info`, `pending` (`useTransition`), and `expandedTrend: string | null`.
- On mount: `fetch('/api/pouriq/variance')` → `setRows(data.rows)`.
- Render rows IN THE ORDER RETURNED (already £-impact sorted). Per row show: name + `(bottle_size_ml)`; last count (date + qty) or "never counted"; expected usage since (`theoretical_used_ml` ml, only when there is a previous count); a "count now" number input (`step=0.1 min=0`); and — once a count exists and a variance is computed — the variance (£/ml/%) coloured by `severity` (reuse `classifyVariance` colours: within-tolerance = parchment, amber = amber, red = red), OR when `unmatched_in_window > 0` show the coverage warning `usage understated — {unmatched_in_window} unmapped sales this period` linking to `/trade/pouriq/unmatched` INSTEAD of the loss figure.
- When `severity === 'amber' || severity === 'red'`, show the reason `<select>` (`VARIANCE_REASONS` from `@/lib/pouriq/types`) bound to `reasons[id]`.
- `persistent_loss` rows: a small "persistent loss" badge.
- A "Trend" toggle per row showing `row.trend` (date + £ + reason), newest last.
- Save: a per-row "Save count" button (or a single "Save counts" that posts each changed row). For simplicity and to match the additive event model, POST one event at a time: `fetch('/api/pouriq/variance', { method:'POST', body: JSON.stringify({ library_ingredient_id: id, count_qty: Number(counts[id]), reason: reasons[id] || undefined }) })` inside `startTransition`; on success replace `rows` with the returned `data.rows`, clear that row's input, `router.refresh()` not needed (client state replaced).
- **Cost display:** use `row.variance_cost_p` from the server (do NOT recompute in the browser — the v1 editor's bug was recomputing without `purchase_qty`).
- Import the `RollingVarianceRow` type from the loader via a type-only import: `import type { RollingVarianceRow } from '@/lib/pouriq/variance-rolling-loader'` (type-only is safe across the server-only boundary; if the bundler objects, re-declare the interface locally in the component as the v1 file did).

- [ ] **Step 2: Build + commit**

Run: `npm run build`
Expected: passes.
```bash
git add src/components/pouriq/VarianceEditor.tsx
git commit -m "feat(pouriq): rework VarianceEditor into a rolling whole-bar count list"
```

---

### Task 8: Retire the per-menu variance route + section

**Files:** Modify `src/app/trade/pouriq/[menuId]/page.tsx`; Delete `src/app/api/pouriq/menus/[menuId]/variance/route.ts`

- [ ] **Step 1: Replace the per-menu variance section** in `src/app/trade/pouriq/[menuId]/page.tsx` (lines ~171-176, the `<VarianceEditor menuId={menuId} initialCadence={menu.volume_cadence} />` block) with a calm link:
```tsx
<section className="no-print">
  <h2 className="text-lg font-semibold text-white mb-2">Variance</h2>
  <p className="text-sm text-parchment-400 mb-3">Stock variance is now counted across your whole bar, not per menu.</p>
  <a href="/trade/pouriq/variance" className="text-sm text-gold-300 hover:text-gold-200">Go to Variance</a>
</section>
```
Remove the now-unused `VarianceEditor` import from this page.

- [ ] **Step 2: Delete the v1 route**

```bash
git rm src/app/api/pouriq/menus/[menuId]/variance/route.ts
```
(The v1 loader `variance-loader.ts` and the `pouriq_stock_counts` table are left in place per the spec — superseded, not deleted. Confirm nothing else imports the deleted route; grep `menus/.*?/variance` and the loader's `loadVariancePayload`/`loadVarianceRows` — if `variance-loader.ts` is now unused, leave it; do not delete in this task.)

- [ ] **Step 3: Build + commit**

Run: `npm run build`
Expected: passes; no broken imports.
```bash
git add -A
git commit -m "feat(pouriq): retire per-menu variance in favour of whole-bar page"
```

---

### Task 9: Verification + finish

- [ ] **Step 1:** `npm run test:unit` (existing 63 + new rolling tests all pass) and `npm run build`.
- [ ] **Step 2:** `npx tsc --noEmit` clean.
- [ ] **Step 3:** `npx opennextjs-cloudflare build` completes (catches server-only/edge issues the plain build misses).
- [ ] **Step 4:** Use `superpowers:finishing-a-development-branch` → PR. PR body MUST note: **apply migration `0041` to prod after merge** (`npx wrangler d1 migrations apply jerry-can-spirits-db --remote`), and that variance moved from the per-menu section to `/trade/pouriq/variance`.

---

## Notes / caveats baked in
- **Cadence/window approximation** is accepted (spec): theoretical sums whole buckets whose period falls in `(prev, latest]`; exact on-cadence, approximate mid-bucket. The page copy nudges counting on the normal rhythm.
- **Coverage is per-window, tenant-wide** (unmatched lines have no ingredient link): an ingredient whose window contains unmatched sales shows the "usage understated" prompt instead of a loss number.
- **Serves are included** via the tenant-wide recipe query joining through `pouriq_menus.trade_account_id` (the serves menu belongs to the tenant), so serve sales deplete stock in theoretical usage. Serves remain excluded from customer/GP/spec/matrix surfaces (Phase 1).
- **Unit-priced ingredients excluded** (bottle-priced only), matching v1 and the spec ("variance lite").
- **`pouriq_stock_counts` (v1) untouched** — superseded, no data migration.
