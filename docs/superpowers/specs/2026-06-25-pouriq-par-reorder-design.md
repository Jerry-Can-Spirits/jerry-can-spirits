# Pour IQ — Par levels + reorder (3b)

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** Phase-3 par/reorder, on the 3a perpetual-stock engine. On-hand is already computed per ml ingredient (and accurate since #809). This adds a par level, a low-stock flag, a suggested reorder quantity, and a printable order report.

**Depends on:** 3a stock + variance accuracy (#809) merged. Build branch `feat/pouriq-par-reorder` off `main`. Migration `0049`.

## Locked decisions
- **Core now, velocity-suggested par next.** Ship manual par (set once, editable) + low-stock flag + reorder quantity + order report. The velocity-based "suggested par" is a fast-follow (it leans on sales-history density).
- **Order report = its own printable page** (`/trade/pouriq/stock/order`), reusing the spec-card/menu-builder print pattern; linked from the stock page.
- **Par in bottles**, comparing directly to `on_hand_bottles`. **ml-scope** (the stock loader is already ml-only).
- Reorder quantity = `ceil(par − on_hand)` whole bottles.

## Data model (migration `0049`)
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN par_bottles REAL;
```
Nullable; `NULL` = no par set (not tracked for reorder). Additive, no backfill.

## Pure helper (`src/lib/pouriq/stock.ts`)
```ts
// Whole bottles to order to reach par. 0 when at/above par, when on-hand is
// unknown, or when no par is set. Uses raw on-hand (a negative on-hand orders more).
export function reorderQty(onHandBottles: number | null, parBottles: number | null): number {
  if (onHandBottles === null || parBottles === null) return 0
  return Math.max(0, Math.ceil(parBottles - onHandBottles))
}
```
Unit-tested.

## Loader (`src/lib/pouriq/stock-loader.ts`)
- `readTenantLibrary` SELECT + `LibraryMetaRow` gain `par_bottles: number | null`.
- `RollingStockRow` gains `par_bottles: number | null`, `needs_reorder: boolean`, `reorder_qty: number`.
- Per row: `reorder_qty = reorderQty(on_hand, par_bottles)`; `needs_reorder = reorder_qty > 0`. For `needs_opening_count` rows (on-hand null) reorder is 0 (can't compute without a count), but `par_bottles` still surfaces so the field shows.

## Set-par action (`src/lib/pouriq/server-actions.ts`)
`setParAction(libraryId, parBottles)`:
- Tenant-guard the ingredient.
- Accept a non-negative number or `null` (clear, to stop tracking). Reject negative / NaN.
- `UPDATE pouriq_ingredients_library SET par_bottles = ?, updated_at = ... WHERE id = ? AND trade_account_id = ?`.
- `revalidatePath('/trade/pouriq/stock')` and `revalidatePath('/trade/pouriq/stock/order')`.

## Stock page UI (`StockManager.tsx`)
- A **Par** input per row (number, bottles) with a Save (mirrors the existing receive/count controls + transition/error pattern). Shows the current `par_bottles` (blank when null).
- When `needs_reorder`, a low-stock indicator on the on-hand line, e.g. amber `Low — order N` (N = `reorder_qty`).
- A link/button to the order report at the top of the page.

## Order report page (`/trade/pouriq/stock/order/page.tsx` + a small client print component)
- Server page: `loadStockLevels`, filter `rows.filter(r => r.needs_reorder)`, sort by name.
- Render a printable list: ingredient name, on-hand (bottles), par, **order quantity**. Empty state when nothing is below par ("Nothing to order").
- A **Print** button using the established `.print-region` / `window.print()` pattern (as menu-builder / spec cards). No server-side PDF.
- Back link to the stock page.

## Tests
- `reorderQty`: at/above par → 0; below par rounds up (par 6, on-hand 2.3 → 4); on-hand null → 0; par null → 0; negative on-hand orders more (par 6, on-hand −1 → 7).
- Migration `0049` schema validity (in-memory): `par_bottles` column present on a rebuilt-minimal `pouriq_ingredients_library`.
- `setParAction` reasoning: non-negative/null accepted, negative/NaN rejected (covered by a small validation helper if extracted; else by review).

## Out of scope (fast-follows)
- **Velocity-suggested par** (typical weekly usage × cover) — the next sub-slice.
- Low-stock surfaced on the main "attention" dashboard (`attention.ts`) — later.
- Supplier grouping on the order report (no per-ingredient supplier field today).
- g/each ingredients (stays ml-only).
- Auto-mutating "dynamic par."

## Success criteria
- A manager sets a par on an ingredient; when estimated on-hand drops below it the stock page flags it and shows how many bottles to order.
- The order report lists everything below par with quantities, and prints cleanly to take to the supplier.
- No change to on-hand, costing, variance, or non-ml behaviour.
