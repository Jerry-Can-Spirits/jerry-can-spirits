# Pour IQ — Menu performance: matrix + status (redesign slice 6)

**Date:** 2026-06-26
**Status:** Design approved (visual companion, v2). Builds on the menu analysis page (`calculateMenuMetrics`, #800) and the redesign.
**Origin:** [[pouriq-ui-redesign-vision]] point 6 + the menu-engineering matrix backlog item (the two are the same surface). Turn the menu page from "what does it cost" into "what should I change" by classifying each drink on popularity × profitability.

**Depends on:** existing per-drink metrics. Build branch `feat/pouriq-menu-performance` off `main`. **No migration, no new data, no new engine** — a re-render of `cocktail_metrics` plus a small popularity calc.

## Locked design (Dan)
- **Two axes:** profitability (GP% vs the menu's **Target GP**) and popularity (units sold vs a threshold).
- **Plain wording, no jargon.** The screen says **Popular seller / Slow seller** and **Good margin / Thin margin**. Never "fair share" or "Stars/Plough-horses". The rule shown to managers: *"a popular seller sells at least 70% of what an average drink on this menu sells; good margin is at or above your Target GP."*
- **Popularity threshold (under the hood):** `0.7 × (total units sold ÷ number of drinks)` — i.e. 70% of an equal share. A drink is a popular seller when its units ≥ that.
- **Matrix grid, drinks listed per quadrant**, in reading order best→worst:
  - top-left **Winners** (popular + good margin), top-right **Promote** (slow + good margin),
  - bottom-left **Fix the margin** (popular + thin), bottom-right **Review or cut** (slow + thin).
- **Status column** on the drinks table = the same word per drink, or a data flag.
- **No sales yet:** when no volumes are entered, popularity is undefined — show the table with a **profitability-only** status (Good margin / Thin margin) + data flags, and a quiet "Add this week's sales to unlock the matrix" hint instead of a misleading matrix.

## Pure logic (`src/lib/pouriq/menu-performance.ts`, new + unit-tested)
```ts
import type { CocktailMetrics } from './types'

export type PerfStatus =
  | 'winner' | 'promote' | 'fix-margin' | 'review'   // full quadrant (sales present)
  | 'good-margin' | 'thin-margin'                     // profitability-only (no sales)
  | 'missing-cost' | 'needs-price'                    // data flags (take precedence)

export const STATUS_LABEL: Record<PerfStatus, string> = {
  winner: 'Winner', promote: 'Promote', 'fix-margin': 'Fix the margin', review: 'Review or cut',
  'good-margin': 'Good margin', 'thin-margin': 'Thin margin',
  'missing-cost': 'Missing cost data', 'needs-price': 'Needs a price',
}

export function classifyDrinkPerformance(
  m: CocktailMetrics,
  ctx: { targetGpPct: number; popularityThreshold: number; hasSales: boolean },
): PerfStatus {
  if (m.sale_price_p <= 0) return 'needs-price'
  if (!m.cost_complete) return 'missing-cost'
  const goodMargin = m.gp_pct >= ctx.targetGpPct
  if (!ctx.hasSales) return goodMargin ? 'good-margin' : 'thin-margin'
  const popular = (m.volume?.units_sold ?? 0) >= ctx.popularityThreshold
  if (goodMargin) return popular ? 'winner' : 'promote'
  return popular ? 'fix-margin' : 'review'
}

export interface MenuPerformance {
  hasSales: boolean
  statusById: Record<string, PerfStatus>
  quadrants: { winner: CocktailMetrics[]; promote: CocktailMetrics[]; fixMargin: CocktailMetrics[]; review: CocktailMetrics[] }
}

export function buildMenuPerformance(metrics: CocktailMetrics[], targetGpPct: number): MenuPerformance {
  const totalUnits = metrics.reduce((s, m) => s + (m.volume?.units_sold ?? 0), 0)
  const hasSales = totalUnits > 0
  const popularityThreshold = metrics.length > 0 ? 0.7 * (totalUnits / metrics.length) : 0
  const statusById: Record<string, PerfStatus> = {}
  const quadrants: MenuPerformance['quadrants'] = { winner: [], promote: [], fixMargin: [], review: [] }
  for (const m of metrics) {
    const status = classifyDrinkPerformance(m, { targetGpPct, popularityThreshold, hasSales })
    statusById[m.cocktail_id] = status
    if (status === 'winner') quadrants.winner.push(m)
    else if (status === 'promote') quadrants.promote.push(m)
    else if (status === 'fix-margin') quadrants.fixMargin.push(m)
    else if (status === 'review') quadrants.review.push(m)
  }
  return { hasSales, statusById, quadrants }
}
```

## UI
- **`MenuMatrix` component** (new, presentational, server-renderable): props `{ quadrants }`. Renders the 2×2 grid in the agreed order with column headers (Popular sellers / Slow sellers), row labels (Good margin / Thin margin), drink-name chips per quadrant, and the plain-English rule line. Only rendered when `hasSales`.
- **`CocktailTable`** gains a **Status** column: a new prop `statusById: Record<string, PerfStatus>`; render `STATUS_LABEL[status]` with a colour (winner=green, promote=blue, fix-margin=amber, review=red, good/thin-margin=muted, missing-cost/needs-price=red). Keep the existing columns unchanged.
- **`[menuId]` page:** compute `const perf = buildMenuPerformance(metrics.cocktail_metrics, menu.target_gp_pct)`. Above the "Drinks" section: when `perf.hasSales`, a **"Menu performance"** section with `<MenuMatrix quadrants={perf.quadrants} />`; else a one-line hint ("Add this week's sales below to see your menu performance matrix."). Pass `statusById={perf.statusById}` to `CocktailTable`.

## Tests
- `classifyDrinkPerformance`: needs-price (price 0) and missing-cost (!cost_complete) take precedence; no-sales → good/thin-margin by GP vs target; with sales → the four quadrants by good-margin × popular.
- `buildMenuPerformance`: `hasSales` false when all units 0; the popularity threshold = `0.7 × avg`; a mixed set partitions into the right quadrants + `statusById`.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope (follow-ups)
- A scatter-plot matrix (we chose the grid).
- Adding a Revenue column / exact column parity with the mockup (the existing table already shows Price/Cost/Margin/GP%/Units/Contribution; Status is the key add).
- A separate "Missing ingredient mapping" status (no clean per-drink signal distinct from cost-incompleteness here).
- Acting on the matrix (reprice/remove actions) — surfaced as recommendations elsewhere.

## Success criteria
- A menu with sales shows the 2×2 matrix (Winners → Review-or-cut, reading order) and a Status per drink that tells the manager what to change, in plain words; a menu with no sales shows the table + profitability status + an unlock hint. No data/engine changes.
