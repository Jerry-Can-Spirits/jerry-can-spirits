# Pour IQ Movers + Reason Breakdown Implementation Plan

> Two independent PRs. Gates each task: `npx tsc --noEmit`. Final per PR: `npm run test:unit` + `npx opennextjs-cloudflare build`.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-movers-and-reason-breakdown-design.md`

---

## PR 1 — Variance reason breakdown (branch `feat/pouriq-variance-reason-breakdown`)

### Task A1: `summariseVarianceByReason` + test

**Files:** `src/lib/pouriq/variance.ts`; `tests/unit/lib/` (new test file `pouriq-variance-reasons.test.ts`).

- [ ] **Step 1:** In `variance.ts`, add:
  ```ts
  export interface ReasonSummaryRow { reason: string; loss_p: number; share_pct: number }
  export interface VarianceReasonSummary { rows: ReasonSummaryRow[]; total_loss_p: number }

  export function summariseVarianceByReason(
    rows: Array<{ variance_cost_p: number | null; latest_reason: string | null }>,
  ): VarianceReasonSummary {
    const byReason = new Map<string, number>()
    let total = 0
    for (const r of rows) {
      const v = r.variance_cost_p
      if (v == null || v >= 0) continue // losses only (negative pence)
      const loss = -v
      total += loss
      const key = r.latest_reason && r.latest_reason.trim() !== '' ? r.latest_reason : 'unattributed'
      byReason.set(key, (byReason.get(key) ?? 0) + loss)
    }
    if (total === 0) return { rows: [], total_loss_p: 0 }
    const out: ReasonSummaryRow[] = Array.from(byReason.entries()).map(([reason, loss_p]) => ({
      reason, loss_p, share_pct: Math.round((loss_p / total) * 100),
    }))
    out.sort((a, b) => {
      if (a.reason === 'unattributed') return 1
      if (b.reason === 'unattributed') return -1
      return b.loss_p - a.loss_p || a.reason.localeCompare(b.reason)
    })
    return { rows: out, total_loss_p: total }
  }
  ```
- [ ] **Step 2:** New test `tests/unit/lib/pouriq-variance-reasons.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest'
  import { summariseVarianceByReason } from '@/lib/pouriq/variance'

  describe('summariseVarianceByReason', () => {
    it('returns empty when there are no losses', () => {
      expect(summariseVarianceByReason([
        { variance_cost_p: 500, latest_reason: 'spillage' },
        { variance_cost_p: null, latest_reason: null },
        { variance_cost_p: 0, latest_reason: null },
      ])).toEqual({ rows: [], total_loss_p: 0 })
    })
    it('sums losses by reason with shares and an unattributed bucket', () => {
      const s = summariseVarianceByReason([
        { variance_cost_p: -600, latest_reason: 'spillage' },
        { variance_cost_p: -300, latest_reason: 'spillage' },
        { variance_cost_p: -100, latest_reason: null },
      ])
      expect(s.total_loss_p).toBe(1000)
      expect(s.rows[0]).toEqual({ reason: 'spillage', loss_p: 900, share_pct: 90 })
      expect(s.rows[1]).toEqual({ reason: 'unattributed', loss_p: 100, share_pct: 10 })
    })
    it('always sorts unattributed last even when largest', () => {
      const s = summariseVarianceByReason([
        { variance_cost_p: -900, latest_reason: null },
        { variance_cost_p: -100, latest_reason: 'theft' },
      ])
      expect(s.rows.map((r) => r.reason)).toEqual(['theft', 'unattributed'])
    })
  })
  ```
- [ ] **Step 3:** `npx tsc --noEmit` + `npm run test:unit`. **Commit** `feat(pouriq): summariseVarianceByReason`.

### Task A2: breakdown panel in `VarianceEditor`

**Files:** `src/components/pouriq/VarianceEditor.tsx`.

- [ ] **Step 1:** Import `summariseVarianceByReason` from `@/lib/pouriq/variance`.
- [ ] **Step 2:** After the `if (rows.length === 0)` guard, compute:
  ```ts
  const reasonSummary = summariseVarianceByReason(
    rows.filter((r) => r.unmatched_in_window === 0),
  )
  ```
- [ ] **Step 3:** In the returned JSX, directly inside the outer `<div className="space-y-4">`, before `<div className="space-y-3">`, render (only when `reasonSummary.total_loss_p > 0`):
  ```tsx
  <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-4">
    <h2 className="text-sm font-semibold text-white mb-1">Where the variance went</h2>
    <p className="text-xs text-parchment-400 mb-3">Total loss this period {formatMoney(-reasonSummary.total_loss_p)}</p>
    <ul className="space-y-1">
      {reasonSummary.rows.map((r) => (
        <li key={r.reason} className="flex items-baseline justify-between gap-3 text-sm">
          <span className="text-parchment-200">{r.reason === 'unattributed' ? 'Unattributed' : r.reason}</span>
          <span className="text-parchment-300 font-mono">{formatMoney(-r.loss_p)} · {r.share_pct}%</span>
        </li>
      ))}
    </ul>
  </div>
  ```
- [ ] **Step 4:** `npx tsc --noEmit`. **Commit** `feat(pouriq): variance reason breakdown panel`.

### PR 1 final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` exit 0. Independent review. Rebase, push, PR (no migration).

---

## PR 2 — Movers report (branch `feat/pouriq-movers-report`, off main after PR 1 merges)

### Task B1: `buildMoversReport` + test

**Files:** `src/lib/pouriq/movers.ts` (new); `tests/unit/lib/pouriq-movers.test.ts` (new).

- [ ] **Step 1:** Create `src/lib/pouriq/movers.ts`:
  ```ts
  // Top / slow / dead-stock by POS sales over a trailing window. Pure: ranks
  // cocktails by units sold in the last N days, with a not-selling bucket for
  // menu rationalisation. Popularity threshold mirrors menu-performance.ts.

  export interface MoverEntry { cocktail_id: string; name: string; units: number; last_sold: string | null }
  export interface MoversReport {
    window_days: number
    has_sales: boolean
    top_sellers: MoverEntry[]
    slow_sellers: MoverEntry[]
    not_selling: MoverEntry[]
  }

  function cutoffDate(now: Date, windowDays: number): string {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - windowDays)
    return d.toISOString().slice(0, 10)
  }

  export function buildMoversReport(
    cocktails: Array<{ id: string; name: string }>,
    volumes: Array<{ cocktail_id: string; period_end: string; units_sold: number }>,
    now: Date = new Date(),
    windowDays = 30,
  ): MoversReport {
    const cutoff = cutoffDate(now, windowDays)
    const windowUnits = new Map<string, number>()
    const lastSold = new Map<string, string>()
    let everSold = false
    for (const v of volumes) {
      if (v.units_sold > 0) {
        everSold = true
        const prev = lastSold.get(v.cocktail_id)
        if (!prev || v.period_end > prev) lastSold.set(v.cocktail_id, v.period_end)
      }
      if (v.period_end >= cutoff) {
        windowUnits.set(v.cocktail_id, (windowUnits.get(v.cocktail_id) ?? 0) + v.units_sold)
      }
    }

    const entries: MoverEntry[] = cocktails.map((c) => ({
      cocktail_id: c.id,
      name: c.name,
      units: windowUnits.get(c.id) ?? 0,
      last_sold: lastSold.get(c.id) ?? null,
    }))

    const empty: MoversReport = {
      window_days: windowDays, has_sales: everSold,
      top_sellers: [], slow_sellers: [], not_selling: [],
    }
    if (!everSold) return empty

    const totalWindow = entries.reduce((s, e) => s + e.units, 0)
    const threshold = cocktails.length > 0 ? 0.7 * (totalWindow / cocktails.length) : 0

    const top_sellers: MoverEntry[] = []
    const slow_sellers: MoverEntry[] = []
    const not_selling: MoverEntry[] = []
    for (const e of entries) {
      if (e.units === 0) not_selling.push(e)
      else if (e.units >= threshold) top_sellers.push(e)
      else slow_sellers.push(e)
    }
    const byUnitsDesc = (a: MoverEntry, b: MoverEntry) => b.units - a.units || a.name.localeCompare(b.name)
    top_sellers.sort(byUnitsDesc)
    slow_sellers.sort(byUnitsDesc)
    not_selling.sort((a, b) => {
      if (a.last_sold == null && b.last_sold == null) return a.name.localeCompare(b.name)
      if (a.last_sold == null) return 1
      if (b.last_sold == null) return -1
      return a.last_sold.localeCompare(b.last_sold) || a.name.localeCompare(b.name)
    })
    return { window_days: windowDays, has_sales: true, top_sellers, slow_sellers, not_selling }
  }
  ```
- [ ] **Step 2:** New test `tests/unit/lib/pouriq-movers.test.ts` covering: window cut-off (a row with `period_end` just before cutoff is excluded, just after is included); top/slow split at threshold; a cocktail with old sales but none in-window → `not_selling` with a non-null `last_sold`; never-sold cocktail sorts last in `not_selling`; `has_sales:false` when no volume row ever has units. Use a fixed `now = new Date('2026-06-26T00:00:00Z')`.
- [ ] **Step 3:** `npx tsc --noEmit` + `npm run test:unit`. **Commit** `feat(pouriq): buildMoversReport`.

### Task B2: `MoversReport` component + menu page wiring

**Files:** `src/components/pouriq/MoversReport.tsx` (new); `src/app/trade/pouriq/[menuId]/page.tsx`.

- [ ] **Step 1: `MoversReport.tsx`** (server component, no `'use client'`). Props `{ report: MoversReport }`. Render three lists in a `grid grid-cols-1 md:grid-cols-3 gap-4` (headings "Top sellers", "Selling slowly", "Not selling"). Each entry: `name` + `units` (`{units} sold`); in the not-selling list show `last_sold` formatted (`new Date(last_sold).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })` prefixed "last sold ") or "No sales recorded" when null. Empty list → a muted "None". When `!report.has_sales`, render a single muted line "Add this period's sales to see your movers." instead of the grid.
- [ ] **Step 2: `[menuId]/page.tsx`:** import `listVolumesForMenu` (add to the existing `from '@/lib/pouriq/volumes'` import), `buildMoversReport` from `@/lib/pouriq/movers`, and `MoversReport`. After `perf`, add `const allVolumes = await listVolumesForMenu(db, menuId)` and `const movers = buildMoversReport(cocktails.map((c) => ({ id: c.id, name: c.name })), allVolumes)`. After the "Menu performance" `</section>` (the matrix), add a new `<section>` with an `<h2 className="text-xl font-serif font-bold text-white mb-4">Movers (last 30 days)</h2>` then `<MoversReport report={movers} />`.
- [ ] **Step 3:** `npx tsc --noEmit` + `npm run test:unit`. **Commit** `feat(pouriq): movers section on the menu page`.

### PR 2 final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` exit 0. Independent review. Rebase, push, PR (no migration).
