# Pour IQ Variance Accuracy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** Fold deliveries (receipts) and production (yield + consumption) into variance v2's actual usage so the variance shown is genuine unexplained loss.

**Architecture:** A pure windowed-sum helper in `variance.ts`; `variance-rolling-loader.ts` loads receipts + production (same sources as `stock-loader.ts`) and adds `+receipts +production_yield −production_consumption` to actual for the headline and every trend window; `VarianceEditor.tsx` shows a small note when a period included deliveries/batches. No migration.

**Tech Stack:** Next.js 15, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-variance-accuracy-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`. No migration to apply.

---

### Task 1: `sumAmountsInWindow` pure helper

**Files:** `src/lib/pouriq/variance.ts`; `tests/unit/lib/pouriq-variance.test.ts` (extend if present, else create).

- [ ] **Step 1: Failing test**
```ts
import { sumAmountsInWindow } from '@/lib/pouriq/variance'
describe('sumAmountsInWindow', () => {
  const rows = [
    { amount: 1, at: '2026-06-01 09:00:00' }, // <= ws, excluded
    { amount: 2, at: '2026-06-02 09:00:00' }, // in window
    { amount: 4, at: '2026-06-03 09:00:00' }, // = we, included
    { amount: 8, at: '2026-06-04 09:00:00' }, // > we, excluded
  ]
  it('sums amounts in (ws, we]', () => {
    expect(sumAmountsInWindow(rows, '2026-06-01 09:00:00', '2026-06-03 09:00:00')).toBe(6)
  })
  it('returns 0 for no rows', () => {
    expect(sumAmountsInWindow([], 'a', 'b')).toBe(0)
  })
})
```
- [ ] **Step 2: Run** `npm run test:unit -- pouriq-variance` (FAIL — not exported).
- [ ] **Step 3: Implement** in `variance.ts`:
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
- [ ] **Step 4: Run** (PASS). **Step 5: Commit** `feat(pouriq): sumAmountsInWindow helper for variance windows`.

---

### Task 2: Fold receipts + production into the variance loader

**Files:** `src/lib/pouriq/variance-rolling-loader.ts`.

- [ ] **Step 1:** Import `sumAmountsInWindow` from `./variance` and `readProductionYields, readProductionConsumption` from `./prepared`. Add a `ReceiptRow { library_ingredient_id: string; received_at: string; qty: number }` interface and a `readTenantReceipts` query (copy from `stock-loader.ts`: `SELECT library_ingredient_id, received_at, qty FROM pouriq_stock_receipts WHERE trade_account_id = ?1`).
- [ ] **Step 2:** In `loadRollingVariance`, extend the `Promise.all` to also load `readTenantReceipts`, `readProductionYields`, `readProductionConsumption`. Build maps: `receiptsByIngredient` (`{amount: r.qty, at: r.received_at}[]`), `yieldByPrepared` (`{amount: y.yield_base_produced, at: y.produced_at}[]` keyed by `prepared_ingredient_id`), `consumptionByComponent` (`{amount: c.amount_base_consumed, at: c.produced_at}[]` keyed by `component_ingredient_id`) — mirror `stock-loader.ts`.
- [ ] **Step 3:** Add `deliveries_in_window: number` and `batches_in_window: number` to `RollingVarianceRow`.
- [ ] **Step 4:** In the headline block (where `pair` is set), after computing the raw drop, fold in the window terms:
```ts
const ingReceipts = receiptsByIngredient.get(ingId) ?? []
const yieldRows = yieldByPrepared.get(ingId) ?? []
const consumeRows = consumptionByComponent.get(ingId) ?? []
const receiptsMl = sumAmountsInWindow(ingReceipts, ws, we) * meta.pack_size
const prodYieldMl = sumAmountsInWindow(yieldRows, ws, we)
const prodConsumeMl = sumAmountsInWindow(consumeRows, ws, we)
actual = (pair.previous.count_qty - pair.latest.count_qty) * meta.pack_size + receiptsMl + prodYieldMl - prodConsumeMl
deliveries = ingReceipts.filter((r) => r.at > ws && r.at <= we).length
batches = yieldRows.filter((r) => r.at > ws && r.at <= we).length + consumeRows.filter((r) => r.at > ws && r.at <= we).length
```
(declare `let deliveries = 0`, `let batches = 0` alongside `theoretical`/`actual`/`unmatched`; set the row's `deliveries_in_window: deliveries, batches_in_window: batches`).
- [ ] **Step 5:** In the trend loop, fold the same three terms into `act` for each `(prev, cur]` window:
```ts
const wsT = prev.counted_at, weT = cur.counted_at
const receiptsMlT = sumAmountsInWindow(ingReceipts, wsT, weT) * meta.pack_size
const prodYieldMlT = sumAmountsInWindow(yieldRows, wsT, weT)
const prodConsumeMlT = sumAmountsInWindow(consumeRows, wsT, weT)
const act = (prev.count_qty - cur.count_qty) * meta.pack_size + receiptsMlT + prodYieldMlT - prodConsumeMlT
```
(`ingReceipts`/`yieldRows`/`consumeRows` are available from Step 4 scope — hoist them above the headline `if (pair)` so the trend loop can use them.)
- [ ] **Step 6:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually verify: prev=10, latest=8, pack 700, one 1-bottle delivery in window → actual 2100 not 1400.
- [ ] **Step 7: Commit** `feat(pouriq): account for deliveries and production in variance`.

---

### Task 3: Surface the indicator in the UI

**Files:** `src/components/pouriq/VarianceEditor.tsx`.

- [ ] **Step 1:** Add `deliveries_in_window: number` and `batches_in_window: number` to the component's local `RollingVarianceRow` interface.
- [ ] **Step 2:** Below the existing "unmatched sales this period" note, add (when `row.deliveries_in_window > 0 || row.batches_in_window > 0`) a small neutral note, building the text from the non-zero parts, e.g.:
```tsx
{(row.deliveries_in_window > 0 || row.batches_in_window > 0) && (
  <p className="text-xs text-parchment-400 mt-1">
    Accounts for{' '}
    {[
      row.deliveries_in_window > 0 ? `${row.deliveries_in_window} ${row.deliveries_in_window === 1 ? 'delivery' : 'deliveries'}` : null,
      row.batches_in_window > 0 ? `${row.batches_in_window} ${row.batches_in_window === 1 ? 'batch' : 'batches'}` : null,
    ].filter(Boolean).join(', ')}{' '}this period.
  </p>
)}
```
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`.
- [ ] **Step 4: Commit** `feat(pouriq): note deliveries/batches accounted in the variance row`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: variance now accounts for deliveries + production (true unexplained loss); ml-only; no migration; theoretical/severity/cost unchanged.
