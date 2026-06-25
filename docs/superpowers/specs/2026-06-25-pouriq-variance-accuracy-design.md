# Pour IQ — Variance accuracy (account for deliveries + production)

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** Deferred from the ingredient-model slices and the Slice 3 Part B work. Variance v2 measures actual usage as the physical drop between two counts, which silently treats a delivery (count goes up) or a produced/consumed batch as if it were pour usage. Now that the 3a stock engine tracks receipts and production, fold both into variance so the number is genuine unexplained loss.

**Depends on:** variance v2 + 3a stock + Slice 3 Part B (all merged). Build branch `feat/pouriq-variance-accuracy` off `main`. **No migration** — reuses existing tables (`pouriq_stock_receipts`, `pouriq_production_events`, `pouriq_production_components`).

## The problem
`variance-rolling-loader.ts:168`:
```ts
actual = (pair.previous.count_qty - pair.latest.count_qty) * meta.pack_size
```
Between two counts the inventory identity is `usage = opening + deliveries + production_in − closing`. The current `actual` omits deliveries and production, so:
- a restock between counts makes the count rise → usage looks too low (even negative) → false "gain";
- making a batch of a prepared ingredient raises its count (same false gain);
- an ingredient drawn down to make a batch shows as loss, though it is accounted usage.

## The fix
For each ingredient, in the existing count window `(prev.counted_at, latest.counted_at]`:
```
actual_ml = (prev - latest) * pack_size
          + receipts_ml                 // deliveries raised the count
          + production_yield_ml          // batches produced raised the count (prepared ingredients)
          - production_consumption_ml    // drawn down to make batches = accounted, not loss
variance  = actual_ml - theoretical     // theoretical unchanged (sales pours, yield-adjusted)
```
All terms are raw physical stock movements (no yield applied — yield only adjusts `theoretical`, as today). Applied to the **headline window** and to **every historical trend point**. Scope stays **ml-only** (`base_unit='ml' AND price_p>0`), matching variance v2 and the stock loader.

Units: receipts `qty` is in bottles/packs → `× pack_size` for ml; production yield/consumption are already in base ml (`sumProductionAfter` semantics). This mirrors `stock-loader.ts` exactly.

## Data sources (reuse, no new tables)
Add to `loadRollingVariance` the same reads the stock loader uses:
- `pouriq_stock_receipts` → `{ library_ingredient_id, received_at, qty }` (bottles).
- `readProductionYields(db, tradeAccountId)` → `{ prepared_ingredient_id, yield_base_produced, produced_at }`.
- `readProductionConsumption(db, tradeAccountId)` → `{ component_ingredient_id, amount_base_consumed, produced_at }`.
Group into per-ingredient maps exactly as the stock loader does (receipts by ingredient; yields by prepared id; consumption by component id).

## Pure helper (testable)
Add to `src/lib/pouriq/variance.ts`:
```ts
// Sum amounts strictly after `ws` and up to and including `we` (raw string
// compare; all timestamps are server datetimes in the same format as counts).
export function sumAmountsInWindow(
  rows: Array<{ amount: number; at: string }>,
  ws: string,
  we: string,
): number {
  let total = 0
  for (const r of rows) if (r.at > ws && r.at <= we) total += r.amount
  return total
}
```
The loader uses it for receipts (then `× pack_size`), production yield, and production consumption, for both the headline and each trend window.

## Loader changes (`variance-rolling-loader.ts`)
- Load + map receipts, production yields, production consumption (as in `stock-loader.ts`).
- Headline: replace the `actual` line with
  ```ts
  const receiptsMl = sumAmountsInWindow(ingReceipts.map(r => ({ amount: r.qty, at: r.received_at })), ws, we) * meta.pack_size
  const prodYieldMl = sumAmountsInWindow(yieldRows, ws, we)
  const prodConsumeMl = sumAmountsInWindow(consumeRows, ws, we)
  actual = (pair.previous.count_qty - pair.latest.count_qty) * meta.pack_size + receiptsMl + prodYieldMl - prodConsumeMl
  ```
- Trend loop: same three terms per `(prev, cur]` window.
- New `RollingVarianceRow` fields: `deliveries_in_window: number` (count of receipt rows in the headline window) and `batches_in_window: number` (count of production yield + consumption rows touching this ingredient in the headline window) — for the UI indicator.

## UI (`VarianceEditor.tsx`)
Mirror the existing "unmatched sales this period" note. On a row where `deliveries_in_window > 0 || batches_in_window > 0`, show a small neutral line, e.g. `Accounts for 2 deliveries, 1 batch this period.` (pluralise; omit a zero term; omit the whole note when both are zero). Add the two fields to the component's local `RollingVarianceRow` interface.

## Tests
- `sumAmountsInWindow`: excludes `<= ws`, includes `> ws` and `= we`, excludes `> we`; empty rows → 0.
- A focused loader-style assertion (pure where possible): given prev=10, latest=8 bottles (700ml) and one 1-bottle delivery in the window, actual = (10−8)×700 + 700 = 2100ml, not 1400 — so a restocked period no longer shows a false 700ml gain.
- Production: a prepared ingredient with a batch produced in the window has its yield added; a component consumed by that batch has its consumption subtracted (not flagged as loss).
- Trend points get the same correction.

## Out of scope
- g/each variance (stays ml-only, matching variance v2).
- Changing the count UI, reason codes, severity bands, or `theoretical` calc.
- Backfilling historical receipts/production (only data already captured is used).

## Success criteria
- A count period that included a delivery or a batch shows true unexplained variance, not delivery/production noise, and the row notes that deliveries/batches were accounted for.
- No change to `theoretical`, severity, cost conversion, or non-ml behaviour.
