# Pour IQ Today Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** Make `/trade/pouriq` the Today dashboard (Attention with severity, Sales this period, Menu profitability, Quick actions), move the menus list to `/trade/pouriq/menus`, and add the Dashboard nav item.

**Architecture:** A `dashboard.ts` server loader assembles existing signals (`getAttentionRows` + active-menu `calculateMenuMetrics`); the dashboard page renders the approved tiles; the menus list relocates; `nav.ts` gains Dashboard. No engines, no migration.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-today-dashboard-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`.

---

### Task 1: Dashboard data layer

**Files:** `src/lib/pouriq/attention.ts` (add severity); `src/lib/pouriq/dashboard.ts` (new); `tests/unit/lib/pouriq-dashboard.test.ts` (new).

- [ ] **Step 1:** In `attention.ts`, add `severity: 'high' | 'medium'` to the `AttentionRow` interface, and set it on each pushed row: `paused` → `'high'`, `sync-${provider}` → `'high'`, `unmatched` → `'medium'`, `prices` → `'medium'`, `gp` → `'medium'`.
- [ ] **Step 2:** Create `src/lib/pouriq/dashboard.ts`:
```ts
import 'server-only'
import type { MenuMetrics } from './types'
import { getAttentionRows, deriveMenuAttention, type AttentionRow } from './attention'
import { getActiveMenu, listCocktailsForMenu } from './menus'
import { listVolumesForPeriod, currentPeriod } from './volumes'
import { calculateMenuMetrics } from './calculations'

export interface SalesSummary { revenue_p: number; serves: number; top: Array<{ name: string; units: number }> }
export interface ProfitabilitySummary { headline_gp_pct: number; headline_basis: 'blended' | 'average'; below_target: number; incomplete: number }
export interface DashboardData { attention: AttentionRow[]; sales: SalesSummary | null; profitability: ProfitabilitySummary | null; activeMenuId: string | null }

// Pure: period revenue/serves/top-sellers from computed menu metrics.
export function deriveSalesSummary(metrics: MenuMetrics): SalesSummary {
  let revenue_p = 0
  let serves = 0
  const sellers: Array<{ name: string; units: number }> = []
  for (const c of metrics.cocktail_metrics) {
    const u = c.volume?.units_sold ?? 0
    if (u <= 0) continue
    revenue_p += u * c.sale_price_p
    serves += u
    sellers.push({ name: c.name, units: u })
  }
  sellers.sort((a, b) => b.units - a.units)
  return { revenue_p, serves, top: sellers.slice(0, 3) }
}

export async function loadDashboard(db: D1Database, tradeAccountId: string): Promise<DashboardData> {
  // getAttentionRows is the single source for attention; it computes the active
  // menu's metrics internally. We recompute once more here for the sales /
  // profitability tiles — a few extra reads on a force-dynamic page, acceptable.
  const attention = await getAttentionRows(db, tradeAccountId)
  const activeMenu = await getActiveMenu(db, tradeAccountId)
  if (!activeMenu) return { attention, sales: null, profitability: null, activeMenuId: null }

  const period = currentPeriod(activeMenu.volume_cadence)
  const [cocktails, volumes] = await Promise.all([
    listCocktailsForMenu(db, activeMenu.id),
    listVolumesForPeriod(db, activeMenu.id, period.start, period.end),
  ])
  const metrics = calculateMenuMetrics(cocktails, activeMenu.prices_include_vat === 1, volumes)
  const { underTargetCount } = deriveMenuAttention(metrics, activeMenu.target_gp_pct)
  return {
    attention,
    sales: deriveSalesSummary(metrics),
    profitability: {
      headline_gp_pct: metrics.headline_gp_pct,
      headline_basis: metrics.headline_basis,
      below_target: underTargetCount,
      incomplete: metrics.incomplete_cost_count,
    },
    activeMenuId: activeMenu.id,
  }
}
```
- [ ] **Step 3: Test** `deriveSalesSummary` (`tests/unit/lib/pouriq-dashboard.test.ts`): build a minimal `MenuMetrics` with three `cocktail_metrics` (two with `volume.units_sold`, one without) and assert `revenue_p = Σ units × sale_price_p`, `serves = Σ units`, `top` sorted by units desc; an all-zero/empty case → `{ revenue_p: 0, serves: 0, top: [] }`. (Construct cocktail_metrics objects inline with the fields the function reads: `name`, `sale_price_p`, `volume`.)
- [ ] **Step 4:** Run `npm run test:unit -- pouriq-dashboard` + `npx tsc --noEmit` (the severity addition must compile against `AttentionPanel`/any consumer — those change in Task 3). **Commit** `feat(pouriq): dashboard data loader + attention severity`.

---

### Task 2: Nav update + relocate the menus list

**Files:** `src/lib/pouriq/nav.ts`; create `src/app/trade/pouriq/menus/page.tsx`.

- [ ] **Step 1:** `nav.ts` — add Dashboard as the first **Operate** item `{ label: 'Dashboard', href: '/trade/pouriq' }` (this is the `HOME` constant) and repoint **Menus** to `{ label: 'Menus', href: '/trade/pouriq/menus' }`.
- [ ] **Step 2:** Update `tests/unit/lib/pouriq-nav.test.ts` if it asserts specific items; add: `isNavActive('/trade/pouriq', '/trade/pouriq')` true (Dashboard); `isNavActive('/trade/pouriq/menus', '/trade/pouriq/menus')` true; `isNavActive('/trade/pouriq', '/trade/pouriq/menus')` false (dashboard doesn't light Menus).
- [ ] **Step 3:** Create `src/app/trade/pouriq/menus/page.tsx` = the current hub's **menus list** content: access/licence guard (copy from the current `page.tsx`), `listMenusForTradeAccount`, the "Your menus" heading + Compare-menus link + the `MenuListCard` grid + the empty state. (No `AttentionPanel` here — attention moves to the dashboard.) `force-dynamic`.
- [ ] **Step 4:** Run `npm run test:unit` + `npx tsc --noEmit`. **Commit** `feat(pouriq): add Dashboard nav item + move the menus list to /menus`.

---

### Task 3: The Today dashboard page

**Files:** rewrite `src/app/trade/pouriq/page.tsx`; remove `src/components/pouriq/AttentionPanel.tsx` (verify no other importer first: `git grep AttentionPanel`).

- [ ] **Step 1:** Rewrite `page.tsx` as the dashboard (server component): same access/licence guard; `const data = await loadDashboard(db, access.tradeAccountId)`. Render, in order:
  - **Attention required** — when `data.attention.length`, a list of alert rows; each row is a `Link href={row.href}` with: a severity dot (`row.severity === 'high'` → red, else amber), the `row.label`, a small severity chip, and a right chevron; whole row clickable. Empty state: "Nothing needs attention right now."
  - **Sales this period** + **Menu profitability** — a two-card row. Sales: `£{(revenue_p/100).toFixed(2)}`, `{serves} serves`, top sellers (names). Profitability: `{headline_gp_pct}% GP` (note `headline_basis`), `{below_target} below target`, `{incomplete} missing cost`. When `data.sales`/`data.profitability` are null (no active menu): one hint card — "Set an active menu and connect your till to see sales and profitability." (link to `/trade/pouriq/menus` or `/trade/pouriq/settings/integrations`).
  - **Quick actions** — `Start stock count` + `Scan invoice` as `SECONDARY_BUTTON_SM` links (`/trade/pouriq/stock`, `/trade/pouriq/invoices/new`); `Import menu` / `Check variance` / `Search ingredients` as text links (`/trade/pouriq/new`, `/trade/pouriq/variance`, `/trade/pouriq/library`).
  - Keep the page's outer container; the shell provides the nav/top bar.
- [ ] **Step 2:** Remove `AttentionPanel.tsx` and its import (now unused). Remove any now-unused imports in `page.tsx` (`listMenusForTradeAccount`, `MenuListCard` moved to the menus page; `getAttentionRows` replaced by `loadDashboard`).
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually reason: `/trade/pouriq` shows the dashboard; `/trade/pouriq/menus` shows the list; nav Dashboard + Menus both resolve.
- [ ] **Step 4: Commit** `feat(pouriq): Today dashboard at /trade/pouriq`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 2 — Today dashboard assembling existing signals; menus list moved to /menus; Tasks/chart/activity/sync-status deferred; no migration.
