# Pour IQ — Variance detail drill-in (redesign slice 3)

**Date:** 2026-06-25
**Status:** Design approved (the variance-detail v2 mockup was validated in the visual companion). Builds on the shell (#811) + dashboard (#812) and the variance v2 / accuracy engines (#809).
**Origin:** [[pouriq-ui-redesign-vision]] point 7 — "Variance = an alert centre… drill-in shows the transparent calc." The dashboard's attention rows and the variance list need a per-ingredient detail page that makes the number trustworthy.

**Depends on:** variance v2 + #809. Build branch `feat/pouriq-variance-detail` off `main`. **No migration, no new engines.**

## Locked scope (existing data only)
- **Ship now:** a variance **detail page** per ingredient — the transparent ledger, the expected-usage drill-down (per-drink), the trend, the possible-cause list + setting the period reason (reusing the existing mechanism), and a derived **recommended checks** panel. Plus **drill-in links** from the existing variance list.
- **Defer (new data, agreed):** investigation status/assignee, count confidence, multi-tag causes + free-text note, and the full clean-alert-centre rework of the list (the current `VarianceEditor` keeps its inline count/reason for now; we only add a detail link).

## The ledger (reconciles with the #809 engine)
For an ingredient, over its latest count pair window `(previous, latest]`, all in bottles:
```
opening (previous count)
+ deliveries        = Σ receipts(window)            [stock_receipts.qty]
+ produced          = Σ production yield(window) / pack_size
− consumed          = Σ production consumption(window) / pack_size   [drawn down to make batches]
− expected usage    = applyYield(Σ sales×pour, yield_pct) / pack_size
= expected closing
actual closing (latest count)
⇒ unexplained variance = expected closing − actual closing
```
This equals the loader's `variance_ml / pack_size` exactly (same terms as `loadRollingVariance` since #809). Display the variance in **bottles + ml + £**.

## Pure helper (`src/lib/pouriq/variance.ts`)
`buildVarianceLedger(input)` → the bottle-denominated rows + `variance_bottles`, given `{ openingQty, closingQty, receiptsBottles, producedBottles, consumedBottles, expectedUsageBottles }`. Pure, unit-tested (reconciles: opening+deliveries+produced−consumed−expectedUsage−closing = variance).

## Detail loader (`src/lib/pouriq/variance-detail-loader.ts`, new, NOT server-only — matches the pattern)
`loadVarianceDetail(db, tradeAccountId, ingredientId): Promise<VarianceDetail | null>`. Mirrors `loadRollingVariance`'s per-ingredient block for the one ingredient, but exposes the components + the per-drink breakdown:
- ingredient `name`, `pack_size`, `price_p`, `purchase_qty`, `yield_pct`.
- window: `opening_at`, `opening_qty`, `closing_at`, `closing_qty` (null when fewer than two counts → page shows "needs two counts").
- `deliveries_bottles`, `produced_bottles`, `consumed_bottles`, `expected_usage_bottles`, `expected_closing_bottles`, `variance_bottles`, `variance_ml`, `variance_cost_p`, `severity`.
- `per_drink`: `Array<{ name; units; pour_ml; usage_ml }>` for cocktails/serves using the ingredient in the window (units from volumes, `usage_ml = units × pour_ml`).
- `trend` (reuse the rolling trend shape), `latest_reason`.
Reuses existing helpers (`pairLatestCounts`, `sumBucketsInWindow`, `sumAmountsInWindow`, `applyYield`, the receipts/production reads) and `buildVarianceLedger`.

## Detail page (`src/app/trade/pouriq/variance/[ingredientId]/page.tsx`, server)
Access/licence guard; `loadVarianceDetail`. If null → "Two stock counts are needed to show variance for this ingredient." Else the approved layout:
- **Headline block:** name, unexplained variance in **bottles / ml / £**, severity, "More usage than expected" caption when variance is a loss.
- **The ledger** (visible, not hidden), exactly the rows above; "+ Produced/Consumed" rows shown only when non-zero ("Adjustments" collapse for standard spirits); note "accounts for N deliveries this period".
- **Expected usage** drill-down: the per-drink table (Drink · serves × pour · usage).
- **Possible causes:** the existing `VARIANCE_REASONS` as selectable chips; current `latest_reason` shown; setting one reuses the existing `POST /api/pouriq/variance` (a small client control `VarianceReasonControl`). Single reason for now (multi-tag deferred).
- **Recommended checks:** a derived list (no new data) — e.g. if a POS is connected, "Confirm the cocktails using this are mapped to the right POS products"; if it's in cocktails, "Review the pour size for {top drinks}"; always "Check comps were recorded", "Verify any transfers", "Recount open bottles with measured partials".
- **Trend:** the recent variance points (reuse).
- Back link to `/trade/pouriq/variance`.

## List drill-in (`VarianceEditor.tsx`)
Add a "View detail →" `Link` to `/trade/pouriq/variance/${row.library_ingredient_id}` on each row (keep the existing inline count/reason/trend). Minimal change.

## Tests
- `buildVarianceLedger`: opening 12 + deliveries 6 + produced 0 − consumed 0 − expectedUsage 9.2 → expected closing 8.8; with actual 7.9 → variance 0.9 (loss); a delivery-heavy case; reconciliation holds.
- Detail loader: if extracted enough, a pure assembly test; else rely on `buildVarianceLedger` + the loader's reuse of already-tested helpers.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope (later)
- Investigation status/assignee, count confidence, multi-tag causes + note (the new-data slice).
- The clean alert-centre rework of the list + moving count entry out of the variance page.
- Brand/visual polish pass.

## Success criteria
- Clicking a variance alert (from the dashboard or the list) opens a detail page whose ledger transparently reconciles to the variance figure (bottles/ml/£), shows which drinks drove the expected usage, lets a reason be tagged, and suggests concrete checks. No engine/data changes; the list keeps working.
