# Pour IQ — Fresh-Produce Stock + Variance (Piece B)

Date: 2026-07-02
Status: Design agreed; ready for implementation plan.

## Goal

Extend stock + variance to fresh produce (`each`/`g` ingredients used via the Piece-A "uses"), so a venue sees "you used ~40 lemons, counted 34, that's a variance" alongside its spirits — in the SAME variance and stock views, labeled in the produce's own unit. **Additive: the existing ml variance maths is not touched, and there is NO migration** (the stock tables are already unit-agnostic).

Depends on Piece A (uses model, PR #860, migration 0064).

## Why it's additive (from the engine map)

- `pouriq_stock_count_events.count_qty` and `pouriq_stock_receipts.qty` are REAL in the ingredient's OWN unit already — a produce count is just "34 lemons". **No schema change.**
- The actual-used calc `(opening − closing) × pack_size + receipts × pack_size` is unit-agnostic — it yields a base-unit quantity (ml for bottles, `each` for lemons) with no change.
- `calcVariance(actual, theoretical)` and `classifyVariance` take plain numbers — they work for any unit.
- **Only four things are ml-specific:** the theoretical calc, the recipe-join filter, the variance-cost (per-ml), and the display unit. Piece B adds a produce branch for each; the ml path is byte-for-byte unchanged.

## Pure helper

`src/lib/pouriq/variance.ts` (new, additive — do NOT modify `calcTheoreticalUsedMl`):
```ts
// Purchase units (e.g. lemons) consumed by one use-line for a given sales count:
// units_sold × (recipe_qty ÷ use.yield_qty). Guards a zero/negative yield.
export function produceLineUnits(unitsSold: number, recipeQty: number, yieldQty: number): number {
  if (yieldQty <= 0) return 0
  return unitsSold * (recipeQty / yieldQty)
}
```
The loaders sum this per ingredient across its use-lines and sales buckets (mirroring how the ml path sums `units × pour_ml`) → theoretical purchase units. Juice AND wheels both draw down the same lemon stock, each converted by its own yield. Unit-tested.

## Row types

Add `base_unit: 'ml' | 'each' | 'g'` to `RollingVarianceRow` (`variance-rolling-loader.ts`), the stock row (`stock-loader.ts`), and `VarianceDetail` (`variance-detail-loader.ts`). Existing ml rows set `'ml'`. The numeric fields (`theoretical_used_ml`, `variance_ml`, `actual_used_ml`, etc.) keep their names but hold the **base-unit quantity** — ml for ml rows, `each`/`g` for produce rows; the UI labels by `base_unit`. (Renaming the fields would ripple through many consumers for no functional gain; document the "quantity is in `base_unit`" semantic instead.)

## Loader extensions (rolling, stock, detail)

For each of the three live loaders, ADD a produce gather beside the existing ml gather — DO NOT change the ml path:
- **A produce recipe read** — like `readTenantRecipes` but `WHERE lib.base_unit IN ('each','g') AND lib.price_p > 0 AND i.use_id IS NOT NULL`, joining `pouriq_ingredient_uses u ON u.id = i.use_id` to get `u.yield_qty` (and `i.recipe_qty`).
- **Theoretical** per produce ingredient = `Σ buckets_in_window × produceLineUnits(units, recipe_qty, yield_qty)` (mirror the ml summation loop; no yield_pct applied — produce `yield_pct` is 100 and the per-use yield is the only conversion).
- **Actual / counts / receipts** — reuse the existing per-ingredient count+receipt logic UNCHANGED (already unit-agnostic; produce ingredients just enter the same ingredient set).
- **Variance** — reuse `calcVariance`/`classifyVariance`. **Variance cost** for produce = `round(variance_each × usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct))` (cost per purchase unit) instead of the per-ml `calcVarianceCostP`.
- Tag each produce row `base_unit`.
- Produce rows are merged into the same returned array as ml rows (same sort by cost impact).

## UI (unit-aware, same views)

- **`VarianceEditor`**: each row already shows quantities + a count input; make the unit label read from `row.base_unit` (`ml` / `each` / `g`), e.g. "Expected used: 40 each" and "Last count: 34". Count input accepts whole units for `each`. No layout change — just the label + unit.
- **`StockManager`** (stock on-hand page): same — unit-aware labels; produce rows appear alongside.
- **Variance detail page** (`variance/[ingredientId]`): unit-aware labels in the ledger + per-drink breakdown (the per-drink line for a use shows the use name + its per-serve amount).

## Scope

- **IN:** the `produceLineUnits` helper; the produce branch in the three loaders (rolling variance, stock on-hand, detail); `base_unit` on the row types; produce variance cost; unit-aware UI in `VarianceEditor`, `StockManager`, and the detail page.
- **OUT (noted):** produce spoilage/waste yield (a separate concept from the per-use yield); merging the ml + produce engines into one unit-agnostic core (kept separate for safety); the deprecated `variance-loader.ts` (old menu/period path) — leave as-is; produce receipts auto-created from invoices (produce isn't PDF-invoice-scanned yet).

## Testing

- **Unit (pure):** `produceLineUnits` — a drink selling 100× using 25ml juice from a 30ml-yield lemon → 100×25/30 ≈ 83.3 lemons; a wheel (yield 8) → 100/8 = 12.5; yield 0 → 0; and that juice+wheel on the same lemon SUM (drawn from one stock).
- **Loader logic:** reasoned + a node:sqlite or fixture-level check that a produce ingredient with counts + sales produces a variance row with `base_unit='each'` and the right theoretical, while an ml ingredient's row is unchanged.
- **Regression (critical):** an ml-only tenant's rolling variance / stock / detail output is byte-for-byte identical (the ml path untouched). Add/keep tests asserting ml rows are unchanged.
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; **no new npm dependencies; no migration**.

## Risks / notes

- **Touches the LIVE variance loaders** — the single biggest risk. Every change is additive (a separate produce gather + branch); the ml recipe read, ml theoretical, and ml cost are not edited. Reviews must confirm ml output is identical. Because the user is away, err conservative: if a change can't be made without altering ml behaviour, stop and flag rather than guess.
- Field names `*_ml` now hold base-unit quantities for produce rows — a naming wart accepted to avoid a wide rename; the `base_unit` field is the source of truth for the unit.
- Produce with no counts yet behaves like any un-counted ingredient (shows theoretical, awaits a count) — same as spirits.
- No migration; ships purely additive on top of 0064.
