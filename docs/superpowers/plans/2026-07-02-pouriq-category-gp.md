# Pour IQ Per-Category GP Rollup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "GP by category" block on the menu analysis, each category's blended GP flagged against the venue target.

**Architecture:** A pure `categoryGp` helper (groups drink metrics by category label, blends GP the same way the menu headline does) + a `CategoryGpTable` component wired into the menu detail page. No migration, no new dependencies, no new data.

**Tech Stack:** Next.js 15 App Router (RSC), Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-pouriq-category-gp-design.md`
**Branch:** `feat/pouriq-category-gp` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes.

**Verified facts:**
- `itemTypeToSectionName(t: ItemType)` in `menu-sections-plan.ts` maps cocktail→"Cocktails", beer→"Beer & Cider", cider→"Beer & Cider", wine→"Wine", spirit→"Spirits", soft-drink→"Soft Drinks", food→"Food", other→"Other".
- `CocktailMetrics` (`types.ts`): `cocktail_id, name, net_sale_p, margin_p, gp_pct, cost_complete, sale_price_p, volume?`. `item_type` is on the **cocktail** (not the metric) — the page joins them.
- Menu detail page (`src/app/trade/pouriq/[menuId]/page.tsx`) already has `cocktails`, `metrics = calculateMenuMetrics(...)`, `menu.target_gp_pct`, and a `volumeUnits` Map (cocktail_id → units_sold) at ~line 80. Renders `MenuBalance` etc.
- The house blend (`calculations.ts:238-256`): costed = `cost_complete && sale_price_p > 0`; blended = `Σ(margin_p×units) / Σ(net_sale_p×units)`; headline = `blended ?? average(gp_pct)`.

---

## Task 1: `categoryGp` pure helper

**Files:** Create `src/lib/pouriq/category-gp.ts`, `tests/unit/lib/pouriq-category-gp.test.ts`.

- [ ] **Step 1: Failing tests**
```ts
import { categoryGp } from '@/lib/pouriq/category-gp'
const row = (item_type: string, gp_pct: number, margin_p: number, net_sale_p: number, units_sold: number, over: object = {}) =>
  ({ item_type: item_type as never, gp_pct, margin_p, net_sale_p, units_sold, cost_complete: true, sale_price_p: 1000, ...over })

it('groups by label (beer+cider merge), blends with volumes', () => {
  const [bc] = categoryGp([row('beer', 50, 300, 600, 10), row('cider', 60, 400, 700, 5)], 68)
  // (300*10 + 400*5) / (600*10 + 700*5) * 100 = 5000/9500 = 52.6
  expect(bc.label).toBe('Beer & Cider'); expect(bc.drink_count).toBe(2)
  expect(bc.basis).toBe('blended'); expect(bc.gp_pct).toBe(52.6); expect(bc.under_target).toBe(true)
})
it('average basis when no volumes; not under a lower target', () => {
  const [c] = categoryGp([row('cocktail', 70, 500, 700, 0), row('cocktail', 74, 520, 700, 0)], 68)
  expect(c.basis).toBe('average'); expect(c.gp_pct).toBe(72); expect(c.under_target).toBe(false)
})
it('excludes incomplete-cost drinks; a category left empty is omitted', () => {
  expect(categoryGp([row('wine', 60, 0, 0, 0, { cost_complete: false })], 68)).toEqual([])
})
it('returns categories in canonical order', () => {
  const rows = categoryGp([row('food', 60, 0, 0, 0), row('cocktail', 70, 0, 0, 0), row('beer', 50, 0, 0, 0)], 68)
  expect(rows.map((r) => r.label)).toEqual(['Cocktails', 'Beer & Cider', 'Food'])
})
```

- [ ] **Step 2: Run red**, then implement `category-gp.ts`:
```ts
import type { ItemType } from './types'
import { itemTypeToSectionName } from './menu-sections-plan'

export interface CategoryGpInput {
  item_type: ItemType
  gp_pct: number
  margin_p: number
  net_sale_p: number
  units_sold: number
  cost_complete: boolean
  sale_price_p: number
}
export interface CategoryGpRow {
  label: string
  drink_count: number
  gp_pct: number
  basis: 'blended' | 'average'
  under_target: boolean
}

const CATEGORY_ORDER = ['Cocktails', 'Beer & Cider', 'Wine', 'Spirits', 'Soft Drinks', 'Food', 'Other']
const round1 = (n: number): number => Math.round(n * 10) / 10

export function categoryGp(rows: CategoryGpInput[], targetGpPct: number): CategoryGpRow[] {
  const groups = new Map<string, CategoryGpInput[]>()
  for (const r of rows) {
    if (!r.cost_complete || r.sale_price_p <= 0) continue
    const label = itemTypeToSectionName(r.item_type)
    const list = groups.get(label) ?? []
    list.push(r)
    groups.set(label, list)
  }
  const out: CategoryGpRow[] = []
  for (const [label, group] of groups) {
    let totalMargin = 0
    let totalNet = 0
    for (const r of group) {
      if (r.units_sold > 0) {
        totalMargin += r.margin_p * r.units_sold
        totalNet += r.net_sale_p * r.units_sold
      }
    }
    const blended = totalNet > 0 ? round1((totalMargin / totalNet) * 100) : null
    const average = round1(group.reduce((s, r) => s + r.gp_pct, 0) / group.length)
    const gp_pct = blended ?? average
    out.push({ label, drink_count: group.length, gp_pct, basis: blended !== null ? 'blended' : 'average', under_target: gp_pct < targetGpPct })
  }
  const rank = (l: string) => { const i = CATEGORY_ORDER.indexOf(l); return i === -1 ? CATEGORY_ORDER.length : i }
  return out.sort((a, b) => rank(a.label) - rank(b.label))
}
```

- [ ] **Step 3: Green + commit**
```bash
git add src/lib/pouriq/category-gp.ts tests/unit
git commit -m "feat(pouriq): categoryGp helper (blended GP per category)"
```

---

## Task 2: `CategoryGpTable` + menu detail page

**Files:** Create `src/components/pouriq/CategoryGpTable.tsx`; modify `src/app/trade/pouriq/[menuId]/page.tsx`.

- [ ] **Step 1: Component**

`CategoryGpTable.tsx` (server component, presentational): props `{ rows: CategoryGpRow[]; targetGpPct: number; excludedCount: number }`. Render a "GP by category" heading + a table: Category · Drinks · GP%. Under-target rows (`row.under_target`) get an amber GP cell; append a small muted "avg" tag when `row.basis === 'average'`. Below the table, when `excludedCount > 0`, a muted line "N drinks excluded (incomplete cost)". A short caption noting the venue target (`{targetGpPct}% target`). Light theme; no em-dashes. If `rows` is empty, render nothing.

- [ ] **Step 2: Wire the page**

In `[menuId]/page.tsx`, after `metrics`/`volumeUnits` are built, compute:
```ts
import { categoryGp } from '@/lib/pouriq/category-gp'
import { CategoryGpTable } from '@/components/pouriq/CategoryGpTable'
// ...
const cocktailById = new Map(cocktails.map((c) => [c.id, c]))
const categoryRows = categoryGp(
  metrics.cocktail_metrics.map((m) => ({
    item_type: cocktailById.get(m.cocktail_id)!.item_type,
    gp_pct: m.gp_pct,
    margin_p: m.margin_p,
    net_sale_p: m.net_sale_p,
    units_sold: volumeUnits.get(m.cocktail_id) ?? 0,
    cost_complete: m.cost_complete,
    sale_price_p: m.sale_price_p,
  })),
  menu.target_gp_pct,
)
```
Render `<section className="no-print">...<CategoryGpTable rows={categoryRows} targetGpPct={menu.target_gp_pct} excludedCount={metrics.incomplete_cost_count} /></section>` near the `MenuBalance` section. (Confirm the exact `MenuMetrics` field name for the incomplete count — `metrics.incomplete_cost_count`.)

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/components/pouriq/CategoryGpTable.tsx "src/app/trade/pouriq/[menuId]/page.tsx"
git commit -m "feat(pouriq): GP-by-category block on the menu analysis"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged; no migration.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: the feature, no migration, no deps, per-category targets deferred.
