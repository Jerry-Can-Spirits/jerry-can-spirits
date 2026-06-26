# Pour IQ — Movers report + variance reason breakdown (redesign item 4)

**Date:** 2026-06-26
**Status:** Scope approved (Dan, AskUserQuestion): movers report = section on the menu page, 30-day window. Two independent PRs.
**Origin:** [[pouriq-ui-redesign-vision]] / [[project_pour_iq_backlog]] mypouriq.com on-wedge pickups. Both ride on data we already hold (POS volumes, variance reasons). No migrations.

Two small reporting features that make existing data actionable. Shipped as **two independent PRs** (different pages, different pure modules):

---

## 4a — Variance reason breakdown (PR 1)

**What:** The six reason codes already exist (`over-pour, spillage, comps, breakage, theft, unknown`) and are set per ingredient. Add an aggregate panel that answers "where did this period's variance go?" — a £ breakdown by cause, sorted, with an **Unattributed** bucket for losses that have no reason set.

**Data:** `VarianceEditor` already fetches `/api/pouriq/variance` and holds `RollingVarianceRow[]` in state, each with `variance_cost_p` + `latest_reason` + `unmatched_in_window`. No new fetch.

**Pure logic — `src/lib/pouriq/variance.ts`** (already pure, not `server-only`):
```ts
export interface ReasonSummaryRow { reason: string; loss_p: number; share_pct: number }
export interface VarianceReasonSummary {
  rows: ReasonSummaryRow[]      // one per reason that has a loss, sorted by loss_p desc; 'unattributed' last
  total_loss_p: number          // sum of all losses (positive magnitude, in pence)
}
export function summariseVarianceByReason(
  rows: Array<{ variance_cost_p: number | null; latest_reason: string | null }>,
): VarianceReasonSummary
```
- A "loss" is `variance_cost_p < 0` (negative = money lost, per the existing red colour convention). Surpluses (≥0) are excluded.
- Magnitude: `loss_p` is the positive magnitude `-variance_cost_p` summed per `latest_reason`; a loss with no reason goes to the synthetic `'unattributed'` row.
- `share_pct = round(loss_p / total_loss_p * 100)`; if `total_loss_p === 0`, return `{ rows: [], total_loss_p: 0 }`.
- Rows sorted by `loss_p` desc; the `'unattributed'` row always sorts last regardless of size (so a real cause never hides behind it).

**Component:** in `VarianceEditor`, before the per-ingredient list, compute the summary from the rows that currently show a reliable variance (`unmatched_in_window === 0`) and, when `total_loss_p > 0`, render a compact panel: heading "Where the variance went", then each row as `reason · £X.XX · Y%` (Unattributed labelled plainly). Muted styling, matches the existing card aesthetic. Hidden when there are no losses.

**Test:** `summariseVarianceByReason` — empty, all-surplus (no losses), mixed reasons + unattributed, share rounding, unattributed-sorts-last.

---

## 4b — Movers report (PR 2)

**What:** A "Movers (last 30 days)" section on the menu page (`/trade/pouriq/[menuId]`), below the Menu performance matrix. Three lists: **Top sellers**, **Selling slowly**, **Not selling** (no sales in 30+ days — cut candidates). Answers menu rationalisation directly; the recency / dead-stock angle is the new value the matrix (all-time popularity) does not show.

**Scope (Dan):** per-menu (cocktails belong to one menu, same unit as the matrix); trailing **30-day** window; dead = no sales in 30+ days.

**Pure logic — `src/lib/pouriq/movers.ts`** (new, pure):
```ts
export interface MoverEntry { cocktail_id: string; name: string; units: number; last_sold: string | null }
export interface MoversReport {
  window_days: number
  has_sales: boolean        // any sales ever recorded (else the section shows an "add sales" hint)
  top_sellers: MoverEntry[] // units >= threshold, sorted by units desc then name
  slow_sellers: MoverEntry[]// 0 < units < threshold, sorted by units desc then name
  not_selling: MoverEntry[] // units === 0 in window; sorted by last_sold asc, never-sold last
}
export function buildMoversReport(
  cocktails: Array<{ id: string; name: string }>,
  volumes: Array<{ cocktail_id: string; period_end: string; units_sold: number }>,
  now?: Date,            // default new Date()
  windowDays?: number,   // default 30
): MoversReport
```
- `cutoff` = `now − windowDays` as `YYYY-MM-DD`; a volume row is "in window" when `period_end >= cutoff` (period_end is stored date-only, lexical compare is correct).
- Per cocktail: `units` = Σ `units_sold` of in-window rows; `last_sold` = max `period_end` over rows with `units_sold > 0` (any time), else `null`.
- `has_sales` = any volume row ever with `units_sold > 0`. When false → all buckets empty, `has_sales:false` (component renders the hint).
- `threshold` = `0.7 * (Σ in-window units / cocktails.length)` — mirrors the matrix popularity threshold (`menu-performance.ts`) so the two tools agree on "popular".
- Bucket: `units === 0` → not_selling; `units >= threshold` → top_sellers; else slow_sellers.

**Loader:** the menu page currently loads only the current period's volumes (for the matrix). Add `listVolumesForMenu(db, menuId)` (all periods, already exists) and pass to `buildMoversReport`.

**Component — `src/components/pouriq/MoversReport.tsx`:** three lists (responsive: 3 columns on `md`, stacked on mobile). Each entry: drink name + `units` (e.g. "42 sold"); not_selling shows the last-sold date or "No sales recorded". When `!has_sales`, render a single muted line "Add this period's sales to see your movers." Section is printable (no `no-print`), matching the matrix.

**Test:** `buildMoversReport` — window cut-off (in vs just-outside 30 days), top/slow split at threshold, dead-stock (zero in window but old sales = not_selling with a last_sold), never-sold sorts last, has_sales:false when nothing ever sold.

---

## Out of scope (both)
- Acting on the reports (reprice / remove / cut actions) — reporting only.
- Account-wide movers across menus (per-menu only for now).
- Configurable window in the UI (fixed 30 days; the pure fn takes a param for tests/future).
- Any migration (all data already stored).

## Success criteria
A manager opening the variance page sees this period's loss split by cause with an honest Unattributed bucket; opening a menu sees, below the matrix, which drinks are selling, selling slowly, and not selling in the last 30 days. Both are pure re-renders of existing data, unit-tested, no schema change.
