# Pour IQ Variance Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A per-ingredient variance detail page (transparent ledger + expected-usage drill-down + trend + reason + recommended checks), reached from the variance list.

**Architecture:** A pure `buildVarianceLedger` (variance.ts); a `loadVarianceDetail` loader mirroring the rolling-variance window math for one ingredient and exposing the ledger components + per-drink breakdown; a server detail page with a small client reason control reusing the existing API; drill-in links from the list. No engines, no migration.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-variance-detail-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`.

---

### Task 1: `buildVarianceLedger` pure helper

**Files:** `src/lib/pouriq/variance.ts`; `tests/unit/lib/pouriq-variance.test.ts` (extend).

- [ ] **Step 1:** Add to `variance.ts`:
```ts
export interface VarianceLedger {
  opening_bottles: number
  deliveries_bottles: number
  produced_bottles: number
  consumed_bottles: number
  expected_usage_bottles: number
  expected_closing_bottles: number
  actual_closing_bottles: number
  variance_bottles: number // expected closing − actual closing; positive = unexplained loss
}

// Reconciles the bottle-denominated stock identity for the variance detail
// ledger: opening + deliveries + produced − consumed − expected usage = expected
// closing; the gap to the actual count is the unexplained variance.
export function buildVarianceLedger(input: {
  openingQty: number
  closingQty: number
  deliveriesBottles: number
  producedBottles: number
  consumedBottles: number
  expectedUsageBottles: number
}): VarianceLedger {
  const expected_closing =
    input.openingQty + input.deliveriesBottles + input.producedBottles - input.consumedBottles - input.expectedUsageBottles
  return {
    opening_bottles: input.openingQty,
    deliveries_bottles: input.deliveriesBottles,
    produced_bottles: input.producedBottles,
    consumed_bottles: input.consumedBottles,
    expected_usage_bottles: input.expectedUsageBottles,
    expected_closing_bottles: expected_closing,
    actual_closing_bottles: input.closingQty,
    variance_bottles: expected_closing - input.closingQty,
  }
}
```
- [ ] **Step 2: Test:** opening 12, deliveries 6, produced 0, consumed 0, expectedUsage 9.2, closing 7.9 → `expected_closing_bottles` ≈ 8.8, `variance_bottles` ≈ 0.9 (use `toBeCloseTo`); a delivery-only period (opening 4, deliveries 6, expectedUsage 0, closing 10) → variance ≈ 0.
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-variance` + `npx tsc --noEmit`. **Commit** `feat(pouriq): buildVarianceLedger helper`.

---

### Task 2: `loadVarianceDetail` loader

**Files:** `src/lib/pouriq/variance-detail-loader.ts` (new; NOT `server-only`, matching `attention.ts`/`dashboard.ts`).

- [ ] **Step 1:** Implement `loadVarianceDetail(db, tradeAccountId, ingredientId): Promise<VarianceDetail | null>`. Reuse `pairLatestCounts`, `sumAmountsInWindow`, `sumBucketsInWindow`, `applyYield`, `calcVariance`, `calcVarianceCostP`, `classifyVariance`, `buildVarianceLedger` from `./variance`, and `readProductionYields`/`readProductionConsumption` from `./prepared`.
  - Queries (tenant-scoped, ml ingredient): ingredient meta (`name, pack_size, price_p, purchase_qty, yield_pct` from `pouriq_ingredients_library WHERE id=?1 AND trade_account_id=?2 AND base_unit='ml'`; return `null` if absent); the ingredient's cocktail lines **with cocktail names** (`c.id, c.name AS cocktail_name, i.pour_ml` joined through `pouriq_ingredients`/`pouriq_cocktails`/`pouriq_menus`, `i.library_ingredient_id=?`); tenant volumes (as the rolling loader); count events for the ingredient (`counted_at, count_qty, reason` ASC); receipts for the ingredient (`received_at, qty`); production yields + consumption (tenant-wide reads, filtered to this ingredient).
  - `pair = pairLatestCounts(events)`; if null → return a `VarianceDetail` with `window: null` (page shows the two-counts hint) but still include `name`/`pack_size`.
  - Window `ws = pair.previous.counted_at`, `we = pair.latest.counted_at`. Compute (bottles): `deliveriesBottles = sumAmountsInWindow(receipts.map(r=>({amount:r.qty,at:r.received_at})), ws, we)`; `producedBottles = sumAmountsInWindow(yields, ws, we)/pack`; `consumedBottles = sumAmountsInWindow(consumption, ws, we)/pack`. Per drink: `units = sumBucketsInWindow(volumesForCocktail, ws.slice(0,10), we.slice(0,10))`, `usage_ml = units × pour_ml`; `rawUsage = Σ usage_ml`; `expectedUsageBottles = applyYield(rawUsage, yield_pct)/pack`.
  - `ledger = buildVarianceLedger({ openingQty: pair.previous.count_qty, closingQty: pair.latest.count_qty, deliveriesBottles, producedBottles, consumedBottles, expectedUsageBottles })`. `variance_ml = ledger.variance_bottles × pack`. For severity/% reuse the loader's framing: `actual_used_ml = (pair.previous.count_qty − pair.latest.count_qty)×pack + deliveriesBottles×pack + producedBottles×pack − consumedBottles×pack`; `{ variance_pct } = calcVariance(actual_used_ml, applyYield(rawUsage, yield_pct))`; `severity = classifyVariance(variance_ml, variance_pct, pack)`; `variance_cost_p = calcVarianceCostP(variance_ml, pack, price_p, purchase_qty)`.
  - `per_drink`: `Array<{ name; units; pour_ml; usage_ml }>` (only drinks with units > 0, sorted by usage_ml desc). `trend`: reuse the rolling per-pair loop over sorted events (variance_cost_p + reason per point, last 6). `latest_reason = pair.latest.reason`.
  - Return `VarianceDetail { name, pack_size, price_p, purchase_qty, ingredient_id, window: { opening_at, opening_qty, closing_at, closing_qty } | null, ledger, variance_ml, variance_cost_p, variance_pct, severity, deliveries_count, batches_count, per_drink, trend, latest_reason }`.
- [ ] **Step 2:** `npx tsc --noEmit` (loader compiles; page consumes it in Task 3). **Commit** `feat(pouriq): loadVarianceDetail loader`.

---

### Task 3: Detail page + reason control + list drill-in

**Files:** `src/app/trade/pouriq/variance/[ingredientId]/page.tsx` (new); `src/components/pouriq/VarianceReasonControl.tsx` (new client); `src/components/pouriq/VarianceEditor.tsx` (add link).

- [ ] **Step 1: `VarianceReasonControl.tsx`** (`'use client'`): props `{ ingredientId: string; current: string | null }`. A `VARIANCE_REASONS` select + Save that POSTs `{ library_ingredient_id, reason }` to `/api/pouriq/variance` (same shape the list uses; no `count_qty` → confirm the route treats reason-only updates correctly; if the route requires a count, pass the latest count through instead or add a small reason-only branch). `router.refresh()` on success.
- [ ] **Step 2: Detail page** (server): access/licence guard; `const d = await loadVarianceDetail(db, access.tradeAccountId, params.ingredientId)`; if `!d` → "Ingredient not found"; if `d.window === null` → "Two stock counts are needed to show variance for this ingredient." Else render the approved layout: headline (variance in bottles / ml / £, severity, "more usage than expected" when `variance_bottles > 0`); the ledger rows (opening / + deliveries / + produced [only if ≠0] / − consumed [only if ≠0] / − expected usage / = expected closing / actual / ⇒ variance), with the "accounts for N deliveries" note; the **per-drink** table; **possible causes** (`VARIANCE_REASONS`) + `<VarianceReasonControl current={d.latest_reason} ingredientId={...} />`; **recommended checks** (derived list); the **trend**; a back link to `/trade/pouriq/variance`.
- [ ] **Step 3: List link** — in `VarianceEditor.tsx`, add a `Link href={\`/trade/pouriq/variance/${id}\`}` "View detail →" on each row (keep the rest).
- [ ] **Step 4:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually reason: the ledger sums reconcile to the variance figure; the page renders for an ingredient with two counts and shows the hint otherwise.
- [ ] **Step 5: Commit** `feat(pouriq): variance detail page + drill-in from the list`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 3 — variance detail drill-in (transparent ledger + drill-down + trend + reason + recommended checks) on existing data; status/confidence/multi-tag deferred; no migration.
