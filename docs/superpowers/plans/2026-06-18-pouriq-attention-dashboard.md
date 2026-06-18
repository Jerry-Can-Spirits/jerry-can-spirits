# Needs-Attention Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** A "needs attention" panel atop the Pour IQ hub aggregating four signals (unmatched items, drinks needing prices, drinks under target GP, POS sync health), scoped to the active menu, hidden when clear.

**Spec:** `docs/superpowers/specs/2026-06-18-pouriq-attention-dashboard-design.md`
**Branch:** `feat/pouriq-attention-dashboard` (off origin/main). No migration.

---

### Task 1: Aggregator

**Files:** Create `src/lib/pouriq/attention.ts`

- [ ] **Step 1: `deriveMenuAttention` (pure) + `getAttentionRows`.**

```ts
import type { MenuMetrics } from './types'
import { countUnmatched } from './pos/item-map'
import { listConnections } from './pos/connections'
import { getActiveMenu, listCocktailsForMenu } from './menus'
import { listVolumesForPeriod, currentPeriod } from './volumes'
import { calculateMenuMetrics } from './calculations'

export interface AttentionRow { key: string; label: string; href: string }

export function deriveMenuAttention(metrics: MenuMetrics, targetGpPct: number): { incompleteCostCount: number; underTargetCount: number } {
  const underTargetCount = metrics.cocktail_metrics.filter(
    (m) => m.cost_complete && m.sale_price_p > 0 && m.gp_pct < targetGpPct,
  ).length
  return { incompleteCostCount: metrics.incomplete_cost_count, underTargetCount }
}

const PROVIDER_LABELS: Record<string, string> = { square: 'Square', zettle: 'Zettle', sumup: 'SumUp' }

export async function getAttentionRows(db: D1Database, tradeAccountId: string): Promise<AttentionRow[]> {
  const [unmatched, connections, activeMenu] = await Promise.all([
    countUnmatched(db, tradeAccountId),
    listConnections(db, tradeAccountId),
    getActiveMenu(db, tradeAccountId),
  ])
  const rows: AttentionRow[] = []
  const enabled = connections.filter((c) => c.enabled === 1)

  // 1. Sales paused — connected but no active menu.
  if (enabled.length > 0 && !activeMenu) {
    rows.push({ key: 'paused', label: 'Sales are paused — set an active menu', href: '/trade/pouriq' })
  }
  // 2. Sync errors.
  for (const c of connections) {
    if (c.last_sync_error) {
      rows.push({ key: `sync-${c.provider}`, label: `${PROVIDER_LABELS[c.provider] ?? c.provider} sync error — reconnect`, href: '/trade/pouriq/settings/integrations' })
    }
  }
  // 3. Unmatched items.
  if (unmatched > 0) {
    rows.push({ key: 'unmatched', label: `${unmatched} unmatched till ${unmatched === 1 ? 'item' : 'items'} — sales not counting`, href: '/trade/pouriq/unmatched' })
  }
  // 4 & 5. Active-menu cost/GP signals.
  if (activeMenu) {
    const period = currentPeriod(activeMenu.volume_cadence)
    const [cocktails, volumes] = await Promise.all([
      listCocktailsForMenu(db, activeMenu.id),
      listVolumesForPeriod(db, activeMenu.id, period.start, period.end),
    ])
    const metrics = calculateMenuMetrics(cocktails, activeMenu.prices_include_vat === 1, volumes)
    const { incompleteCostCount, underTargetCount } = deriveMenuAttention(metrics, activeMenu.target_gp_pct)
    if (incompleteCostCount > 0) {
      rows.push({ key: 'prices', label: `${incompleteCostCount} drink${incompleteCostCount === 1 ? '' : 's'} need prices on ${activeMenu.name}`, href: `/trade/pouriq/${activeMenu.id}` })
    }
    if (underTargetCount > 0) {
      rows.push({ key: 'gp', label: `${underTargetCount} drink${underTargetCount === 1 ? '' : 's'} under target GP on ${activeMenu.name}`, href: `/trade/pouriq/${activeMenu.id}` })
    }
  }
  return rows
}
```

- [ ] **Step 2:** `npx tsc --noEmit` → clean. **Commit:** `feat(pouriq): needs-attention aggregator`

---

### Task 2: Panel component + hub wiring

**Files:** Create `src/components/pouriq/AttentionPanel.tsx`; modify `src/app/trade/pouriq/page.tsx`

- [ ] **Step 1: AttentionPanel** (server component):

```tsx
import Link from 'next/link'
import type { AttentionRow } from '@/lib/pouriq/attention'

export function AttentionPanel({ rows }: { rows: AttentionRow[] }) {
  if (rows.length === 0) return null
  return (
    <div className="mb-8 rounded-xl border border-amber-400/40 bg-amber-500/10 p-5">
      <h2 className="text-xs uppercase tracking-widest text-amber-200/80 mb-3">Needs attention</h2>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.key}>
            <Link href={r.href} className="flex items-center justify-between gap-3 text-sm text-amber-100 hover:text-white transition-colors">
              <span>{r.label}</span>
              <span aria-hidden className="font-semibold">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Hub.** In `src/app/trade/pouriq/page.tsx`: import `getAttentionRows` and `AttentionPanel`; replace the `countUnmatched` fetch + the standalone unmatched `<Link>` banner with `getAttentionRows` and `<AttentionPanel rows={attentionRows} />` rendered above the menus grid (and above the empty-state). Remove the now-unused `countUnmatched` import.

- [ ] **Step 3:** `npx tsc --noEmit && npx next lint && npm run build` → clean. **Commit:** `feat(pouriq): needs-attention panel on the hub`

---

### Task 3: Tests + PR

**Files:** Create `tests/unit/lib/pouriq-attention.test.ts`

- [ ] **Step 1:** Unit-test `deriveMenuAttention` with a small `MenuMetrics` fixture: under-target counts only costed drinks below target; an incomplete-cost drink (even with a low gp_pct) is NOT counted as under-target; a costed drink at/above target is not counted; `incompleteCostCount` passes through. Build the fixture from `calculateMenuMetrics` on cocktail fixtures (reuse the pattern from `pouriq-trustworthy-numbers.test.ts`) or hand-craft a `MenuMetrics`.
- [ ] **Step 2:** `npm run test:unit` → pass. `npm run build` → succeeds.
- [ ] **Step 3:** Push, open PR (no migration; consolidates the hub unmatched banner). Watch CI.
