# Pour IQ — Per-Category GP Rollup

Date: 2026-07-02
Status: Design agreed; ready for implementation plan.

## Goal

Show each drink category's blended GP on the menu analysis, flagging categories below the venue target — the at-a-glance "which category is leaking margin" view you can't get from scanning individual drinks. Complements the existing per-drink matrix/balance. **No new data, no migration** — it's a grouping + display over data the page already computes.

## Category = `item_type`

Group the menu's drinks by their `item_type` (the coarse drink category: cocktail / beer / cider / wine / spirit / soft-drink / food / other). Labels reuse `itemTypeToSectionName` (`menu-sections-plan.ts`) — Cocktails, Beer & Cider, Wine, Spirits, Soft Drinks, Food, Other. (Not menu sections — those can be sub-divided like "Signatures / Classics", which aren't categories.)

## GP maths — mirror the existing menu-level blend

`calculateMenuMetrics` (`calculations.ts:238-256`) already defines the house method:
- **costed** = drinks with `cost_complete && sale_price_p > 0` (incomplete-cost drinks are excluded — understated cost inflates GP).
- **blended** = `Σ(margin_p × units_sold) / Σ(net_sale_p × units_sold)` over drinks that have a volume; null when no volumes.
- headline = `blended ?? average(gp_pct)`.

Apply this **per category**: a category's GP is the blend of its costed drinks (revenue × volume weighted) when any of them have sales, else the simple average of its drinks' `gp_pct`.

## Pure helper

`src/lib/pouriq/category-gp.ts`:
```ts
export interface CategoryGpInput {
  item_type: ItemType
  gp_pct: number
  margin_p: number
  net_sale_p: number
  units_sold: number      // 0 when no volume for the period
  cost_complete: boolean
  sale_price_p: number
}
export interface CategoryGpRow {
  item_type: ItemType
  label: string
  drink_count: number      // costed drinks in the category
  gp_pct: number           // headline (blended or average), 1 dp
  basis: 'blended' | 'average'
  under_target: boolean
}
export function categoryGp(rows: CategoryGpInput[], targetGpPct: number): CategoryGpRow[]
```
- Keep only costed rows (`cost_complete && sale_price_p > 0`).
- Group by `item_type`. Per group: `drink_count = group.length`; `totalMargin/totalNet` summed over rows with `units_sold > 0`; `blended = totalNet > 0 ? round1(totalMargin/totalNet*100) : null`; `average = round1(mean gp_pct)`; `gp_pct = blended ?? average`; `basis = blended !== null ? 'blended' : 'average'`; `under_target = gp_pct < targetGpPct`.
- Return rows in the canonical category order (the `ORDER` list in `menu-sections-plan.ts`, extended to cover all `ItemType`), empty categories omitted.
- Pure, unit-tested.

## Display

`src/components/pouriq/CategoryGpTable.tsx` — a "GP by category" block on the menu detail page (`[menuId]/page.tsx`), placed near `MenuBalance` in the on-screen analysis (`no-print` — it's an operator view, not the customer menu). Rows: **Category · Drinks · GP%**, with under-target rows flagged amber and a small "avg" hint where `basis === 'average'` (so the operator knows it's not sales-weighted yet). A one-line caption noting N drinks excluded for incomplete cost (reuse the page's `incomplete_cost_count`). The page builds `CategoryGpInput[]` by joining `metrics.cocktail_metrics` with each cocktail's `item_type` and the period `volumeUnits` map, then calls `categoryGp(rows, menu.target_gp_pct)`.

## Scope

- **IN:** the `categoryGp` pure helper + `CategoryGpTable` + wiring on the menu detail page.
- **OUT (noted):** per-category *targets* (venues keep one venue-wide target — Dan's later call); a per-category matrix; editable category order; category GP in the printed customer menu.

## Testing

- **Unit (pure):** `categoryGp` — groups by item_type; a category with volumes → blended (revenue×units weighted), verify the number; a category with no volumes → average basis; `under_target` true/false vs target; incomplete-cost drinks excluded from a category (and a category that becomes empty is omitted); canonical ordering; 1 dp rounding.
- Reasoned: the page join (metrics + item_type + volumes) and the display.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; no new npm dependencies; no migration.

## Risks / notes

- Blended vs average basis differs by whether the category has sales data — surface the basis ("avg") so a low-volume category's average isn't mistaken for a sales-weighted figure.
- A category's GP can look fine while individual drinks in it are poor (and vice versa) — this block complements, does not replace, the per-drink table/matrix.
- No migration; ships purely additive.
