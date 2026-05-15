# Pour IQ™ Variance Tracking (Lite) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bar manager enters start + end bottle counts per period; Pour IQ™ compares against theoretical use (volumes × recipes) and surfaces the discrepancy in units, %, and £ on the menu page below the existing volume editor.

**Architecture:** One new D1 table (`pouriq_stock_counts`), pure deterministic calc helpers in `variance.ts`, server-side loader joining volumes + recipes + library + counts, GET/POST API route at `/api/pouriq/menus/[menuId]/variance`, and a self-fetching client component `VarianceEditor` mounted in a new `no-print` section on the menu detail page.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Cloudflare Workers + D1. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-15-pouriq-variance-lite-design.md](../specs/2026-05-15-pouriq-variance-lite-design.md)

**Verification path:** `npm run lint`, `npm run build` (runs `tsc`), and manual integration checks against the deploy preview. No unit test framework installed; do not introduce one.

---

## Phase 1 — Single PR: `feat/pouriq-variance-lite`

**Branch:** already created. The spec is already committed at HEAD.

### Task 1: Schema migration

**Files:**
- Create: `migrations/0026_pouriq_stock_counts.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0026_pouriq_stock_counts.sql
-- Per-menu, per-ingredient, per-period stock count for variance tracking.
-- One row per (menu, library_ingredient, period). UPSERT on save.

CREATE TABLE pouriq_stock_counts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  menu_id TEXT NOT NULL REFERENCES pouriq_menus(id) ON DELETE CASCADE,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,        -- ISO YYYY-MM-DD; matches pouriq_drink_volumes shape
  period_end TEXT NOT NULL,          -- ISO YYYY-MM-DD
  start_count REAL NOT NULL,         -- bottles at start of period (3.5 = three-and-a-half bottles)
  end_count REAL NOT NULL,           -- bottles at end of period
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX uniq_pouriq_stock_counts
  ON pouriq_stock_counts(menu_id, library_ingredient_id, period_start, period_end);

CREATE INDEX idx_pouriq_stock_counts_menu_period
  ON pouriq_stock_counts(menu_id, period_start, period_end);
```

- [ ] **Step 2: Apply to local D1**

```bash
npx wrangler d1 migrations apply jerry-can-spirits-db --local
```

Expected: output mentions `0026_pouriq_stock_counts.sql` applied. If the local D1 is in a pre-existing broken state (see prior feature work), skip this step — the remote apply later is the real test.

- [ ] **Step 3: Commit**

```bash
git add migrations/0026_pouriq_stock_counts.sql
git commit -m "feat(pouriq): migration 0026 — pouriq_stock_counts for variance tracking"
```

---

### Task 2: Pure calculation helpers (`variance.ts`)

**Files:**
- Create: `src/lib/pouriq/variance.ts`

- [ ] **Step 1: Create the file**

```ts
// Pure deterministic helpers for variance tracking. No DB access, no
// side effects. Used by the server-side loader to build VarianceRow[]
// for the menu page's variance editor.

export interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number               // for display context (e.g. "Smirnoff (700ml)")
  bottle_cost_p: number                // net of VAT, from library

  // Stock count input (null when the manager hasn't entered yet)
  start_count: number | null
  end_count: number | null

  // Calculated (null when inputs missing or theoretical is zero)
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null          // null when theoretical is zero (undefined % against a zero base)
  variance_cost_p: number | null
}

/**
 * Theoretical millilitres used of one ingredient across all drinks on
 * a menu, given recipes and per-cocktail sales volumes. Unit-priced
 * contributions (unit_count, pour_ml null) are excluded — variance
 * lite tracks bottle-priced only.
 */
export function calcTheoreticalUsedMl(
  ingredient_id: string,
  drinks: Array<{
    cocktail_id: string
    ingredients: Array<{ library_id: string; pour_ml: number | null }>
  }>,
  volumesByCocktail: Map<string, number>,
): number {
  let total = 0
  for (const drink of drinks) {
    const units = volumesByCocktail.get(drink.cocktail_id) ?? 0
    if (units === 0) continue
    for (const ing of drink.ingredients) {
      if (ing.library_id !== ingredient_id) continue
      if (ing.pour_ml === null) continue
      total += units * ing.pour_ml
    }
  }
  return total
}

/**
 * Actual millilitres used from start/end bottle counts. Returns null
 * if either count is missing — caller decides how to render that.
 */
export function calcActualUsedMl(
  start: number | null,
  end: number | null,
  bottle_size_ml: number,
): number | null {
  if (start === null || end === null) return null
  return (start - end) * bottle_size_ml
}

/**
 * Variance derives from actual − theoretical. Percentage is null when
 * theoretical is zero (no sales to compare against).
 */
export function calcVariance(
  actual_ml: number | null,
  theoretical_ml: number,
): { variance_ml: number | null; variance_pct: number | null } {
  if (actual_ml === null) return { variance_ml: null, variance_pct: null }
  const variance_ml = actual_ml - theoretical_ml
  if (theoretical_ml === 0) return { variance_ml, variance_pct: null }
  const variance_pct = (variance_ml / theoretical_ml) * 100
  return { variance_ml, variance_pct }
}

/**
 * Cash cost of variance: variance_ml × (bottle_cost_p / bottle_size_ml).
 * Positive = money out (overpour); negative = money "back" (under-pour
 * or sales misreport). Rounded to whole pence to keep with the rest
 * of pouriq's integer-pence convention.
 */
export function calcVarianceCostP(
  variance_ml: number | null,
  bottle_size_ml: number,
  bottle_cost_p: number,
): number | null {
  if (variance_ml === null) return null
  return Math.round(variance_ml * (bottle_cost_p / bottle_size_ml))
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/variance.ts
git commit -m "feat(pouriq): pure variance calculation helpers"
```

---

### Task 3: Server-side loader (`variance-loader.ts`)

**Files:**
- Create: `src/lib/pouriq/variance-loader.ts`

- [ ] **Step 1: Create the file**

```ts
// Server-side loader for variance data. Joins volumes + recipes +
// library + stock counts to build a VarianceRow[] for one menu and
// period, plus a small recent-periods summary.

import 'server-only'
import {
  calcActualUsedMl,
  calcTheoreticalUsedMl,
  calcVariance,
  calcVarianceCostP,
  type VarianceRow,
} from './variance'

export interface RecentVariancePeriod {
  period_start: string
  period_end: string
  total_abs_cost_p: number
}

export interface VariancePayload {
  current_period: { start: string; end: string }
  rows: VarianceRow[]
  recent_periods: RecentVariancePeriod[]
}

interface VolumeRow {
  cocktail_id: string
  units_sold: number
}

interface RecipeRow {
  cocktail_id: string
  library_ingredient_id: string
  pour_ml: number | null
  library_name: string
  bottle_size_ml: number
  bottle_cost_p: number
}

interface CountRow {
  library_ingredient_id: string
  start_count: number
  end_count: number
}

interface PeriodKey {
  period_start: string
  period_end: string
}

async function readVolumes(
  db: D1Database,
  menuId: string,
  periodStart: string,
  periodEnd: string,
): Promise<VolumeRow[]> {
  const result = await db
    .prepare(`
      SELECT v.cocktail_id AS cocktail_id, v.units_sold AS units_sold
      FROM pouriq_drink_volumes v
      JOIN pouriq_cocktails c ON c.id = v.cocktail_id
      WHERE c.menu_id = ?1
        AND v.period_start = ?2
        AND v.period_end = ?3
    `)
    .bind(menuId, periodStart, periodEnd)
    .all<VolumeRow>()
  return result.results ?? []
}

async function readRecipes(
  db: D1Database,
  menuId: string,
): Promise<RecipeRow[]> {
  const result = await db
    .prepare(`
      SELECT
        c.id AS cocktail_id,
        i.library_ingredient_id AS library_ingredient_id,
        i.pour_ml AS pour_ml,
        lib.name AS library_name,
        lib.bottle_size_ml AS bottle_size_ml,
        lib.bottle_cost_p AS bottle_cost_p
      FROM pouriq_cocktails c
      JOIN pouriq_ingredients i ON i.cocktail_id = c.id
      JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
      WHERE c.menu_id = ?1
        AND lib.bottle_size_ml IS NOT NULL
        AND lib.bottle_cost_p IS NOT NULL
        AND i.pour_ml IS NOT NULL
    `)
    .bind(menuId)
    .all<RecipeRow>()
  return result.results ?? []
}

async function readCounts(
  db: D1Database,
  menuId: string,
  periodStart: string,
  periodEnd: string,
): Promise<CountRow[]> {
  const result = await db
    .prepare(`
      SELECT library_ingredient_id, start_count, end_count
      FROM pouriq_stock_counts
      WHERE menu_id = ?1
        AND period_start = ?2
        AND period_end = ?3
    `)
    .bind(menuId, periodStart, periodEnd)
    .all<CountRow>()
  return result.results ?? []
}

async function readRecentPeriodKeys(
  db: D1Database,
  menuId: string,
  excludeStart: string,
  excludeEnd: string,
  limit: number,
): Promise<PeriodKey[]> {
  const result = await db
    .prepare(`
      SELECT DISTINCT period_start, period_end
      FROM pouriq_stock_counts
      WHERE menu_id = ?1
        AND NOT (period_start = ?2 AND period_end = ?3)
      ORDER BY period_end DESC
      LIMIT ?4
    `)
    .bind(menuId, excludeStart, excludeEnd, limit)
    .all<PeriodKey>()
  return result.results ?? []
}

/**
 * Build VarianceRow[] for one menu + period.
 *
 * Steps:
 * 1. Read volumes for the period → Map<cocktail_id, units_sold>.
 * 2. Read recipes (bottle-priced ingredients only) → group by library_ingredient_id.
 * 3. Read existing stock counts for the period → Map<library_ingredient_id, counts>.
 * 4. For each unique library ingredient appearing on the menu's bottle-priced
 *    recipes OR with an existing count row, build a VarianceRow.
 *
 * Sorted by |variance_cost_p| descending, with all-null rows last.
 */
export async function loadVarianceRows(
  db: D1Database,
  menuId: string,
  periodStart: string,
  periodEnd: string,
): Promise<VarianceRow[]> {
  const [volumes, recipes, counts] = await Promise.all([
    readVolumes(db, menuId, periodStart, periodEnd),
    readRecipes(db, menuId),
    readCounts(db, menuId, periodStart, periodEnd),
  ])

  const volumesByCocktail = new Map<string, number>()
  for (const v of volumes) volumesByCocktail.set(v.cocktail_id, v.units_sold)

  const countsByIngredient = new Map<string, { start: number; end: number }>()
  for (const c of counts) {
    countsByIngredient.set(c.library_ingredient_id, { start: c.start_count, end: c.end_count })
  }

  // Group recipes by ingredient and also remember per-cocktail pour_ml for the calc.
  interface IngredientMeta {
    library_name: string
    bottle_size_ml: number
    bottle_cost_p: number
  }
  const metaByIngredient = new Map<string, IngredientMeta>()
  const drinkIngredients = new Map<string, Array<{ library_id: string; pour_ml: number | null }>>()
  for (const r of recipes) {
    if (!metaByIngredient.has(r.library_ingredient_id)) {
      metaByIngredient.set(r.library_ingredient_id, {
        library_name: r.library_name,
        bottle_size_ml: r.bottle_size_ml,
        bottle_cost_p: r.bottle_cost_p,
      })
    }
    if (!drinkIngredients.has(r.cocktail_id)) drinkIngredients.set(r.cocktail_id, [])
    drinkIngredients.get(r.cocktail_id)!.push({
      library_id: r.library_ingredient_id,
      pour_ml: r.pour_ml,
    })
  }

  const drinks = Array.from(drinkIngredients.entries()).map(([cocktail_id, ingredients]) => ({
    cocktail_id,
    ingredients,
  }))

  // Include every ingredient that appears in the recipes OR has a count entered.
  const ingredientIds = new Set<string>(metaByIngredient.keys())
  for (const id of countsByIngredient.keys()) ingredientIds.add(id)

  const rows: VarianceRow[] = []
  for (const ingredient_id of ingredientIds) {
    const meta = metaByIngredient.get(ingredient_id)
    if (!meta) continue // count exists but ingredient no longer on any recipe; skip
    const theoretical_used_ml = calcTheoreticalUsedMl(ingredient_id, drinks, volumesByCocktail)
    const count = countsByIngredient.get(ingredient_id) ?? null
    const start_count = count?.start ?? null
    const end_count = count?.end ?? null
    const actual_used_ml = calcActualUsedMl(start_count, end_count, meta.bottle_size_ml)
    const { variance_ml, variance_pct } = calcVariance(actual_used_ml, theoretical_used_ml)
    const variance_cost_p = calcVarianceCostP(variance_ml, meta.bottle_size_ml, meta.bottle_cost_p)
    rows.push({
      library_ingredient_id: ingredient_id,
      library_name: meta.library_name,
      bottle_size_ml: meta.bottle_size_ml,
      bottle_cost_p: meta.bottle_cost_p,
      start_count,
      end_count,
      theoretical_used_ml,
      actual_used_ml,
      variance_ml,
      variance_pct,
      variance_cost_p,
    })
  }

  // Sort: rows with a cost variance first (highest |£| descending), then
  // null-cost rows (no counts entered) at the bottom alphabetically.
  rows.sort((a, b) => {
    const aHas = a.variance_cost_p !== null
    const bHas = b.variance_cost_p !== null
    if (aHas && !bHas) return -1
    if (!aHas && bHas) return 1
    if (aHas && bHas) return Math.abs(b.variance_cost_p!) - Math.abs(a.variance_cost_p!)
    return a.library_name.localeCompare(b.library_name)
  })

  return rows
}

/**
 * Build the full variance payload: current period rows + recent periods
 * summary. The recent periods list returns up to N most recent periods
 * (other than the current one) where stock counts exist for this menu,
 * each with its total absolute cost variance.
 */
export async function loadVariancePayload(
  db: D1Database,
  menuId: string,
  periodStart: string,
  periodEnd: string,
  recentLimit: number = 5,
): Promise<VariancePayload> {
  const rows = await loadVarianceRows(db, menuId, periodStart, periodEnd)
  const recentKeys = await readRecentPeriodKeys(db, menuId, periodStart, periodEnd, recentLimit)

  const recent_periods: RecentVariancePeriod[] = []
  for (const k of recentKeys) {
    const pastRows = await loadVarianceRows(db, menuId, k.period_start, k.period_end)
    const total = pastRows.reduce(
      (sum, r) => sum + (r.variance_cost_p === null ? 0 : Math.abs(r.variance_cost_p)),
      0,
    )
    recent_periods.push({
      period_start: k.period_start,
      period_end: k.period_end,
      total_abs_cost_p: total,
    })
  }

  return {
    current_period: { start: periodStart, end: periodEnd },
    rows,
    recent_periods,
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/variance-loader.ts
git commit -m "feat(pouriq): variance D1 loader (joins volumes + recipes + counts)"
```

---

### Task 4: API route (GET + POST)

**Files:**
- Create: `src/app/api/pouriq/menus/[menuId]/variance/route.ts`

The route reuses the same period-derivation logic that `/api/pouriq/menus/[menuId]/volumes` uses. To avoid duplication, this task extracts the period computation into a shared helper first.

- [ ] **Step 1: Read the existing volumes route to confirm period-derivation shape**

```bash
cat src/app/api/pouriq/menus/[menuId]/volumes/route.ts | head -80
```

Note how it computes the current period from the menu's `volume_cadence`. The variance route uses the same logic but doesn't need to share code — duplicate the derivation for now to keep the change tight. (If a third caller needs it later, extract then.)

- [ ] **Step 2: Create the variance route**

```ts
// GET  /api/pouriq/menus/[menuId]/variance?cadence=weekly|monthly[&period_start=&period_end=]
// POST /api/pouriq/menus/[menuId]/variance
//   body: { period_start, period_end, entries: [{ library_ingredient_id, start_count, end_count }] }

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { loadVariancePayload } from '@/lib/pouriq/variance-loader'
import type { VolumeCadence } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

const SAVE_RATE_LIMIT = 60 // POST per hour per tenant

interface PostBody {
  period_start: string
  period_end: string
  entries: Array<{ library_ingredient_id: string; start_count: number; end_count: number }>
}

interface Params {
  params: Promise<{ menuId: string }>
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function isNonNegativeReal(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n >= 0
}

function parseCadence(raw: string | null): VolumeCadence {
  return raw === 'weekly' ? 'weekly' : 'monthly'
}

/**
 * Returns ISO YYYY-MM-DD start and end (inclusive) for the period
 * containing `today` given the cadence. Weekly = Mon-Sun.
 * Monthly = 1st-to-last-of-month.
 */
function derivePeriod(cadence: VolumeCadence, today: Date): { start: string; end: string } {
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (cadence === 'weekly') {
    const day = today.getUTCDay() // 0 = Sun
    const mondayOffset = day === 0 ? -6 : 1 - day
    const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + mondayOffset))
    const sunday = new Date(Date.UTC(monday.getUTCFullYear(), monday.getUTCMonth(), monday.getUTCDate() + 6))
    return { start: iso(monday), end: iso(sunday) }
  }
  const year = today.getUTCFullYear()
  const month = today.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  return { start: iso(first), end: iso(last) }
}

export async function GET(request: Request, { params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const url = new URL(request.url)
  const cadence = parseCadence(url.searchParams.get('cadence') ?? menu.volume_cadence)
  let periodStart = url.searchParams.get('period_start') ?? null
  let periodEnd = url.searchParams.get('period_end') ?? null

  if (periodStart === null || periodEnd === null) {
    const p = derivePeriod(cadence, new Date())
    periodStart = p.start
    periodEnd = p.end
  } else if (!ISO_DATE.test(periodStart) || !ISO_DATE.test(periodEnd)) {
    return NextResponse.json({ error: 'Invalid period_start / period_end' }, { status: 400 })
  }

  try {
    const payload = await loadVariancePayload(db, menuId, periodStart, periodEnd)
    return NextResponse.json({ cadence, ...payload })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'load' } })
    return NextResponse.json({ error: 'Could not load variance data' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  if (await isRateLimited(kv, 'pouriq-variance-save', access.tradeAccountId, SAVE_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many saves. Please try again later.' }, { status: 429 })
  }

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  let body: PostBody
  try {
    body = (await request.json()) as PostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!ISO_DATE.test(body.period_start ?? '') || !ISO_DATE.test(body.period_end ?? '')) {
    return NextResponse.json({ error: 'period_start and period_end must be ISO YYYY-MM-DD' }, { status: 400 })
  }
  if (!Array.isArray(body.entries)) {
    return NextResponse.json({ error: 'entries must be an array' }, { status: 400 })
  }
  for (let i = 0; i < body.entries.length; i++) {
    const e = body.entries[i]
    if (typeof e.library_ingredient_id !== 'string' || !e.library_ingredient_id) {
      return NextResponse.json({ error: `Entry ${i + 1}: missing library_ingredient_id` }, { status: 400 })
    }
    if (!isNonNegativeReal(e.start_count)) {
      return NextResponse.json({ error: `Entry ${i + 1}: start_count must be a non-negative number` }, { status: 400 })
    }
    if (!isNonNegativeReal(e.end_count)) {
      return NextResponse.json({ error: `Entry ${i + 1}: end_count must be a non-negative number` }, { status: 400 })
    }
  }

  // UPSERT each entry. We validate ingredient belongs to the tenant via the
  // tenant scope on getMenu plus an existence check on each library entry
  // tied to this trade account.
  try {
    const stmts: D1PreparedStatement[] = []
    for (const e of body.entries) {
      stmts.push(
        db
          .prepare(`
            INSERT INTO pouriq_stock_counts (menu_id, library_ingredient_id, period_start, period_end, start_count, end_count)
            SELECT ?1, lib.id, ?3, ?4, ?5, ?6
            FROM pouriq_ingredients_library lib
            WHERE lib.id = ?2 AND lib.trade_account_id = ?7
            ON CONFLICT(menu_id, library_ingredient_id, period_start, period_end)
            DO UPDATE SET
              start_count = excluded.start_count,
              end_count = excluded.end_count,
              updated_at = datetime('now')
          `)
          .bind(menuId, e.library_ingredient_id, body.period_start, body.period_end, e.start_count, e.end_count, access.tradeAccountId),
      )
    }
    if (stmts.length > 0) await db.batch(stmts)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'save' } })
    return NextResponse.json({ error: 'Could not save stock counts' }, { status: 500 })
  }

  // Refresh payload so the client gets updated values without a second round trip.
  try {
    const payload = await loadVariancePayload(db, menuId, body.period_start, body.period_end)
    return NextResponse.json({ cadence: menu.volume_cadence as VolumeCadence, ...payload })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-variance', phase: 'reload' } })
    return NextResponse.json({ error: 'Saved, but could not reload data' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS. New routes registered for the menu path.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pouriq/menus/[menuId]/variance/route.ts
git commit -m "feat(pouriq): GET/POST /api/pouriq/menus/[menuId]/variance"
```

---

### Task 5: VarianceEditor client component

**Files:**
- Create: `src/components/pouriq/VarianceEditor.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import type { VolumeCadence } from '@/lib/pouriq/types'

interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number
  bottle_cost_p: number
  start_count: number | null
  end_count: number | null
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null
  variance_cost_p: number | null
}

interface RecentPeriod {
  period_start: string
  period_end: string
  total_abs_cost_p: number
}

interface VarianceResponse {
  cadence: VolumeCadence
  current_period: { start: string; end: string }
  rows: VarianceRow[]
  recent_periods: RecentPeriod[]
}

interface Props {
  menuId: string
  initialCadence: VolumeCadence
}

const inputClass = 'w-20 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm focus:border-gold-400 focus:outline-none'

function formatMoney(p: number | null): string {
  if (p === null) return '—'
  const sign = p > 0 ? '+' : p < 0 ? '−' : ''
  return `${sign}£${(Math.abs(p) / 100).toFixed(2)}`
}

function formatMl(ml: number | null): string {
  if (ml === null) return '—'
  const rounded = Math.round(ml)
  const sign = rounded > 0 ? '+' : ''
  return `${sign}${rounded.toLocaleString('en-GB')} ml`
}

function formatPct(pct: number | null): string {
  if (pct === null) return '—'
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function colourForVariance(pct: number | null): string {
  if (pct === null) return 'text-parchment-300'
  const abs = Math.abs(pct)
  if (abs < 10) return 'text-parchment-100'
  if (abs <= 20) return 'text-amber-300'
  return 'text-red-300'
}

function formatDateRange(start: string, end: string): string {
  const fmt = (s: string) =>
    new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

export function VarianceEditor({ menuId, initialCadence }: Props) {
  const router = useRouter()
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null)
  const [data, setData] = useState<VarianceResponse | null>(null)
  const [edits, setEdits] = useState<Record<string, { start: string; end: string }>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setInfo(null)
    const params = new URLSearchParams({ cadence: initialCadence })
    if (period) {
      params.set('period_start', period.start)
      params.set('period_end', period.end)
    }
    fetch(`/api/pouriq/menus/${encodeURIComponent(menuId)}/variance?${params.toString()}`)
      .then((r) =>
        r.ok ? (r.json() as Promise<VarianceResponse>) : Promise.reject(new Error('Could not load variance')),
      )
      .then((d) => {
        if (cancelled) return
        setData(d)
        const seed: Record<string, { start: string; end: string }> = {}
        for (const r of d.rows) {
          seed[r.library_ingredient_id] = {
            start: r.start_count !== null ? String(r.start_count) : '',
            end: r.end_count !== null ? String(r.end_count) : '',
          }
        }
        setEdits(seed)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [menuId, initialCadence, period])

  function updateEdit(id: string, patch: Partial<{ start: string; end: string }>) {
    setEdits((s) => ({ ...s, [id]: { ...(s[id] ?? { start: '', end: '' }), ...patch } }))
  }

  function save() {
    if (!data) return
    setError(null)
    setInfo(null)
    const entries: Array<{ library_ingredient_id: string; start_count: number; end_count: number }> = []
    for (const r of data.rows) {
      const e = edits[r.library_ingredient_id]
      if (!e || e.start === '' || e.end === '') continue
      const startN = parseFloat(e.start)
      const endN = parseFloat(e.end)
      if (!Number.isFinite(startN) || startN < 0) {
        setError(`${r.library_name}: start count must be a non-negative number`)
        return
      }
      if (!Number.isFinite(endN) || endN < 0) {
        setError(`${r.library_name}: end count must be a non-negative number`)
        return
      }
      entries.push({
        library_ingredient_id: r.library_ingredient_id,
        start_count: startN,
        end_count: endN,
      })
    }
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/menus/${encodeURIComponent(menuId)}/variance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: data.current_period.start,
          period_end: data.current_period.end,
          entries,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Save failed' }))) as { error?: string }
        setError(err.error ?? 'Save failed')
        return
      }
      const updated = (await res.json()) as VarianceResponse
      setData(updated)
      setInfo(`Saved ${entries.length} ingredient count${entries.length === 1 ? '' : 's'}.`)
      router.refresh()
    })
  }

  if (loading) return <p className="text-sm text-parchment-300">Loading variance…</p>
  if (error && !data) return <p role="alert" className="text-sm text-red-300">{error}</p>
  if (!data) return null

  const anyTheoretical = data.rows.some((r) => r.theoretical_used_ml > 0)
  const visibleRows = data.rows.filter((r) => r.theoretical_used_ml > 0 || r.start_count !== null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif font-bold text-white">Stock variance</h2>
          <p className="text-xs text-parchment-400 mt-1">
            Current period: {formatDateRange(data.current_period.start, data.current_period.end)}
          </p>
        </div>
        <p className="text-xs text-parchment-400 max-w-md">
          Enter the bottle count at the start of the period and what is left at the end. Pour IQ compares that against what sales should have used.
        </p>
      </div>

      {!anyTheoretical && (
        <div className="bg-jerry-green-800/40 border border-amber-500/30 rounded-xl p-4 text-sm text-amber-200">
          Enter sales volumes above first. Variance compares stock used against what sales should have used.
        </div>
      )}

      {visibleRows.length === 0 ? (
        <p className="text-sm text-parchment-300">No bottle-priced ingredients on this menu yet.</p>
      ) : (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-jerry-green-900/40">
              <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                <th className="px-4 py-3">Ingredient</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Theoretical</th>
                <th className="px-4 py-3">Variance</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const e = edits[r.library_ingredient_id] ?? { start: '', end: '' }
                const startN = e.start === '' ? null : parseFloat(e.start)
                const endN = e.end === '' ? null : parseFloat(e.end)
                const liveUsedMl =
                  startN !== null && endN !== null && Number.isFinite(startN) && Number.isFinite(endN)
                    ? (startN - endN) * r.bottle_size_ml
                    : null
                const liveVarianceMl =
                  liveUsedMl !== null ? liveUsedMl - r.theoretical_used_ml : null
                const liveVariancePct =
                  liveVarianceMl !== null && r.theoretical_used_ml > 0
                    ? (liveVarianceMl / r.theoretical_used_ml) * 100
                    : null
                const liveCostP =
                  liveVarianceMl !== null
                    ? Math.round(liveVarianceMl * (r.bottle_cost_p / r.bottle_size_ml))
                    : null
                const endExceedsStart = startN !== null && endN !== null && endN > startN
                return (
                  <tr key={r.library_ingredient_id} className="border-t border-gold-500/10 align-top">
                    <td className="px-4 py-3 text-parchment-100">
                      {r.library_name}
                      <span className="block text-xs text-parchment-400">({r.bottle_size_ml} ml)</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={e.start}
                        onChange={(ev) => updateEdit(r.library_ingredient_id, { start: ev.target.value })}
                        className={inputClass}
                        placeholder="0"
                        aria-label={`${r.library_name} start count`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={e.end}
                        onChange={(ev) => updateEdit(r.library_ingredient_id, { end: ev.target.value })}
                        className={inputClass}
                        placeholder="0"
                        aria-label={`${r.library_name} end count`}
                      />
                      {endExceedsStart && (
                        <p className="text-xs text-amber-300 mt-1">
                          Stock went up. Add deliveries to the start count, or check your figures.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-parchment-200">{formatMl(liveUsedMl)}</td>
                    <td className="px-4 py-3 text-parchment-200">{formatMl(r.theoretical_used_ml)}</td>
                    <td className={`px-4 py-3 ${colourForVariance(liveVariancePct)}`}>
                      {formatMl(liveVarianceMl)}
                      {liveVariancePct !== null && (
                        <span className="block text-xs">{formatPct(liveVariancePct)}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 ${colourForVariance(liveVariancePct)}`}>{formatMoney(liveCostP)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {info && <p className="text-sm text-emerald-300">{info}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={pending || loading || visibleRows.length === 0} className={PRIMARY_BUTTON}>
          {pending ? 'Saving…' : 'Save counts'}
        </button>
      </div>

      {data.recent_periods.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-medium text-parchment-100 mb-3">Recent periods</h3>
          <ul className="space-y-1.5">
            {data.recent_periods.map((p) => (
              <li key={`${p.period_start}-${p.period_end}`}>
                <button
                  type="button"
                  onClick={() => setPeriod({ start: p.period_start, end: p.period_end })}
                  className="text-sm text-gold-300 hover:text-gold-200 underline text-left"
                >
                  {formatDateRange(p.period_start, p.period_end)}
                </button>
                <span className="text-parchment-400 text-sm">
                  {' · '}Total cost variance: £{(p.total_abs_cost_p / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          {period && (
            <button
              type="button"
              onClick={() => setPeriod(null)}
              className="mt-3 text-xs text-parchment-400 hover:text-parchment-200 underline"
            >
              Back to current period
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/VarianceEditor.tsx
git commit -m "feat(pouriq): VarianceEditor component with live variance preview"
```

---

### Task 6: Mount VarianceEditor on the menu page

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`

The variance editor sits in a new `no-print` section immediately after the existing `VolumeEditor` block.

- [ ] **Step 1: Add the import**

Open `src/app/trade/pouriq/[menuId]/page.tsx`. Find the existing import block and add `VarianceEditor` alongside `VolumeEditor`. Use this Edit:

old_string (just the VolumeEditor import — verify it matches your file before applying; the actual import group may differ slightly):

```tsx
import { VolumeEditor } from '@/components/pouriq/VolumeEditor'
```

new_string:

```tsx
import { VolumeEditor } from '@/components/pouriq/VolumeEditor'
import { VarianceEditor } from '@/components/pouriq/VarianceEditor'
```

If your file's import for `VolumeEditor` is grouped or aliased differently, place the `VarianceEditor` import on the next line consistent with the existing style. Do not reorganise unrelated imports.

- [ ] **Step 2: Mount the component after VolumeEditor**

Find the existing `<VolumeEditor>` section. Use this Edit:

old_string:

```tsx
            <section className="no-print">
              <VolumeEditor
                menuId={menuId}
                cocktails={cocktails}
                metrics={metrics.cocktail_metrics}
                initialCadence={menu.volume_cadence}
              />
            </section>
```

new_string:

```tsx
            <section className="no-print">
              <VolumeEditor
                menuId={menuId}
                cocktails={cocktails}
                metrics={metrics.cocktail_metrics}
                initialCadence={menu.volume_cadence}
              />
            </section>
            <section className="no-print">
              <VarianceEditor
                menuId={menuId}
                initialCadence={menu.volume_cadence}
              />
            </section>
```

If the existing `<VolumeEditor>` block in your file doesn't match the old_string byte-for-byte (whitespace, prop order, or a recent commit changed something), stop and surface — don't guess.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS. The menu page route shows a slightly larger bundle (new child component).

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/page.tsx
git commit -m "feat(pouriq): mount VarianceEditor below VolumeEditor on menu page"
```

---

### Task 7: Apply migration to production D1

- [ ] **Step 1: Apply the migration remotely**

```bash
npx wrangler d1 migrations apply jerry-can-spirits-db --remote
```

Expected: `0026_pouriq_stock_counts.sql` shown as applied.

- [ ] **Step 2: Verify the table exists**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name = 'pouriq_stock_counts'"
```

Expected: one row returned.

---

### Task 8: Final build + scoped lint

- [ ] **Step 1: Build**

```bash
npm run build
```

Expected: PASS. Build manifest now includes:
- `/api/pouriq/menus/[menuId]/variance` route
- The menu detail page bundle includes the new component

- [ ] **Step 2: Scoped lint on touched files**

```bash
npx eslint migrations/0026_pouriq_stock_counts.sql src/lib/pouriq/variance.ts src/lib/pouriq/variance-loader.ts src/app/api/pouriq/menus/[menuId]/variance/route.ts src/components/pouriq/VarianceEditor.tsx src/app/trade/pouriq/[menuId]/page.tsx 2>&1 || true
```

The `.sql` file will be skipped by ESLint; the other six should pass clean.

If repo-wide `npm run lint` OOMs as usual, the scoped run is sufficient.

No commit for this task — verification only.

---

### Task 9: Push branch and open PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-variance-lite
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(pouriq): variance tracking (lite)" --body "$(cat <<'EOF'
## Summary

Bar manager enters start + end bottle counts per period; Pour IQ™ compares against theoretical use (volumes × recipes) and surfaces the discrepancy in units, %, and £ on the menu page below the existing volume editor.

Period-level, statistical variance with no hardware — closes the parity gap with WISK / Bar-i / BinWise / Bar Patrol without going down the Bluetooth-scale path.

## What ships

- **Schema** \`pouriq_stock_counts\` (migration 0026). Already applied to production D1.
- **Pure helpers** \`src/lib/pouriq/variance.ts\` — \`calcTheoreticalUsedMl\`, \`calcActualUsedMl\`, \`calcVariance\`, \`calcVarianceCostP\`.
- **Loader** \`src/lib/pouriq/variance-loader.ts\` — joins volumes + recipes + library + counts, returns \`VarianceRow[]\` plus a recent-periods summary.
- **API route** GET/POST at \`/api/pouriq/menus/[menuId]/variance\`. UPSERT on save.
- **Client component** \`VarianceEditor\` — self-fetching, live variance preview as the manager types, recent-periods list with click-to-load.
- **Menu page wire-up** — new \`no-print\` section between the volume editor and the print-only sales summary.

## Bottle-priced only

Variance lite tracks bottle-priced ingredients. Unit-priced items (limes, mint bunches, jarred cherries) have a separate waste model (rot / expiry) and are excluded.

## Display thresholds

Fixed in v1: under 10% neutral, 10–20% amber, over 20% red. Per-tenant configuration is future work.

## Known limitations (documented in the spec)

- Theoretical uses the **current recipe**, not recipe-as-of-period. Recipe versioning is a future feature.
- Counts are **per-menu**. A multi-menu venue sharing stock would have to enter counts on each menu. Pilot venues run one active menu at a time, so this is acceptable for now.
- No auto-derive from previous-period-end + invoice deliveries — fully manual entry in v1.

## Spec

[\`docs/superpowers/specs/2026-05-15-pouriq-variance-lite-design.md\`](../blob/main/docs/superpowers/specs/2026-05-15-pouriq-variance-lite-design.md)

## Help guide

A new section \"Tracking stock variance\" will be drafted in the same session that ships this PR and pasted into Sanity Studio by the brand-voice owner post-merge. Slots between section 6 (Tracking sales volumes) and section 7 (Running a cost what-if) in the help guide accordion.

## Test plan

- [x] \`npm run build\` clean
- [x] Scoped lint on the six touched code files clean
- [x] Migration applied to production D1; \`pouriq_stock_counts\` confirmed present
- [ ] **Deploy-preview walkthrough** (trade login gated locally):
  - Open a menu with drinks and at least one bottle-priced ingredient. Variance editor renders below the volume editor.
  - Before entering volumes: info banner shown; Theoretical column blank.
  - Enter volumes for a drink → Theoretical populates for affected ingredients.
  - Enter start + end counts → Used / Variance / Cost compute live.
  - Save → counts persist; reload page; values shown.
  - Edit and re-save → upserted (no duplicate row).
  - Trigger end > start → warning renders; Cost shown as negative.
  - Switch menu cadence weekly → monthly → editor reloads with new period.
  - Click a row in Recent periods → editor loads that historical period; \"Back to current period\" button restores.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR opened**

The command prints the PR URL. CI build + lint should pass within a few minutes.

---

### Task 10: Draft the help-guide section

Per the help-guide style memory rule ("every new Pour IQ™ feature ships with a help-guide section drafted in the SAME session"), draft a new section titled **"Tracking stock variance"** for the help guide. The text below is the deliverable; user pastes into Sanity Studio post-merge.

This task does NOT produce code or commits. It produces a markdown blob to hand to the user.

- [ ] **Step 1: Read the just-built UI labels to ensure the section reflects shipped copy**

Open `src/components/pouriq/VarianceEditor.tsx` and confirm:
- Title text: "Stock variance"
- Info banner text: "Enter sales volumes above first. Variance compares stock used against what sales should have used."
- Column headers: "Ingredient", "Start", "End", "Used", "Theoretical", "Variance", "Cost"
- Save button text: "Save counts"
- Warning text on `end > start`: "Stock went up. Add deliveries to the start count, or check your figures."
- Recent periods text: "Total cost variance: £X.XX"

- [ ] **Step 2: Produce the section body**

The section title in Sanity is exactly: `Tracking stock variance`

Section body (paste into Sanity Studio's body field; format with H3 styles as described in the style memory):

```
Variance is the gap between what sales × recipes say should have come out of your bottles and what actually did. Pour IQ™ surfaces variance per ingredient, per period, on every menu's report page.

### Where it lives

Below the sales volume editor on the menu page. Same period boundary as your volumes (weekly or monthly per the menu's cadence). Counts are kept per menu — if you run multiple parallel menus, you enter counts on each.

### What to enter

For each bottle-priced ingredient that appears on the menu:

- **Start**: how many bottles you had at the start of the period. Decimals allowed (3.5 means three and a half bottles).
- **End**: how many bottles you have at the end of the period. Decimals allowed.

Pour IQ computes the rest: how much was used, how much sales × recipes say should have been used, the gap in millilitres and percent, and the cash cost of the gap.

Unit-priced ingredients (limes, mint, jarred cherries) are excluded — their waste model is rot, not overpour.

### Reading the columns

- **Used**: (Start − End) × bottle size. The millilitres physically out of bottles.
- **Theoretical**: what sales × recipes say should have been used.
- **Variance**: Used − Theoretical, in ml and as a percentage. Positive means more came out than sales explain. Negative means less.
- **Cost**: the £ figure of the variance. Positive = money walked out; negative = sales overstated or deliveries missed from the start count.

Colour coding on Variance and Cost:

- Under 10% — neutral.
- 10% to 20% — amber. Worth checking.
- Over 20% — red. Investigate.

### Common causes of variance

- **Overpour or spillage** (positive variance): heavy hands, training pours, ice-melt double-counting.
- **Sales over-recorded** (negative variance): drinks rung in but not poured, missing voids, ringer error.
- **Missed deliveries**: a delivery arrived but was not added to the start count. End looks higher than expected → negative variance.

### Save and revisit

Click **Save counts** when you have entered every bottle you wanted to track. Blank rows save nothing (you can come back later). Re-saving a period replaces the previous counts.

Past periods are listed under **Recent periods** below the editor — click any one to review historical variance.

### Stock went up?

If you entered an End count higher than your Start count, Pour IQ shows a warning on that row. Almost always means a delivery arrived during the period that wasn't added to the Start count. Add it to the start figure and re-save.
```

- [ ] **Step 3: Hand to the user**

When the implementer finishes this task, surface the section body verbatim in the final report so the controller can present it to the user for pasting into Sanity Studio. The user controls when content goes live; the implementer does not write to Sanity.

---

## Self-review checklist (engineer)

Before requesting review on the PR:

- [ ] Branch was cut from up-to-date `origin/main`
- [ ] No `console.log` left behind
- [ ] No `any` types introduced (use `unknown` with a cast if forced)
- [ ] No em-dashes, emojis, or exclamation marks in user-visible copy (warning text, info banner, headings)
- [ ] The existing menu page still renders correctly with no menus, with menus but no drinks, and with drinks but no volumes — the variance editor's empty / info-banner / loading states cover each case
- [ ] The variance loader's recursive call for recent periods is bounded by `recentLimit` (default 5) — no N+1 explosion
- [ ] Pour IQ™ on first mention per visible string; ™ matches PR #678 convention
