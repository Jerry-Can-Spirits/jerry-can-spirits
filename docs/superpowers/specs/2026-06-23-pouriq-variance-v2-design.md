# Pour IQ — Variance v2 (with serve mapping)

**Date:** 2026-06-23
**Status:** Draft for review (spec-first; no code yet)
**Origin:** E2E phase 10 + follow-up. The shipped tolerance band (#784) reduced noise but two structural problems remain: (a) per-period start+end counting is admin-heavy and noisy; (b) Pour IQ only models cocktails, so theoretical depletion ignores non-cocktail sales (vodka & coke, house doubles, pints) that empty the same bottles — making variance on shared spirits/mixers meaningless.

## Goal

Make variance trustworthy and low-admin for the items that matter (spirits/mixers), without becoming a full inventory app. Two coupled phases, built in order:

1. **Serve mapping** — account for *all* sales that pour a tracked ingredient, not just cocktails.
2. **Variance v2** — rolling, whole-bar counts; theoretical depletion = cocktails + serves; coverage-aware; reason codes; trend; count-what-matters.

## Agreed decisions
- **Rolling counts, no delivery log.** Each count auto-pairs with the previous count of that ingredient as the baseline; variance = POS-theoretical usage vs counted usage between the two count dates. One number per count, not start+end. No live perpetual level, no delivery ledger.
- **Whole-bar (tenant) scope.** You count your bar's stock of each ingredient once; theoretical usage = all sales of every drink (cocktail or serve) that uses it, across menus.
- **Serve-as-lightweight-recipe.** A "serve" reuses the existing recipe model rather than a new one.
- **Keep it LITE.** Bottle-priced ingredients only; no inventory ledger.

---

## Phase 1 — Serve mapping

### Concept
A **serve** is a non-cocktail sold item that pours stock: "Vodka & Coke", "House Single Gin", "175ml House White". It carries a light **pour spec** (ingredient + ml lines) so its sales deplete stock. The bar only needs to model the ingredients it cares to cost (e.g. just the 50ml vodka; the post-mix coke can be omitted or added).

### Data model
- A serve is a `pouriq_cocktails` row with **`is_serve INTEGER NOT NULL DEFAULT 0`** (migration: `ALTER TABLE pouriq_cocktails ADD COLUMN is_serve ...`). Its ingredients use the existing `pouriq_ingredients` table and the ingredient library — full reuse.
- **Home menu:** serves live on an auto-created, hidden per-tenant **"Bar serves"** menu (a `pouriq_menus` row flagged so it's excluded from menu pickers, GP headline, customer menu, spec cards and the menu-engineering matrix). Created lazily the first time a tenant adds a serve. This satisfies the `pouriq_cocktails.menu_id` FK without nullable-column churn.
- **`sale_price_p`** for a serve is set to 0 and never used (GP calc already excludes `sale_price_p <= 0`; serves are additionally excluded by `is_serve`).

### Mapping a POS item to a serve
No schema change to `pouriq_pos_item_map` — a serve *is* a cocktail, so the map points `cocktail_id` at the serve. From the existing **unmatched-items review**, each till item gains a third action beside "map to cocktail / ignore": **"map to a serve"** (pick an existing serve or quick-create one with a pour spec). POS sales of that item then record volumes against the serve exactly like a cocktail.

**Implementation note (for the plan):** POS volume recording currently routes to the *active menu*. Serves sit on the hidden menu, so the ingest must record volumes against a mapped serve `cocktail_id` regardless of menu (the item-map cocktail_id is the source of truth, not the active menu). Verify and adjust the POS ingest/routing so serve sales aren't dropped.

### Exclusions
Serves must be excluded everywhere a cocktail is shown to a customer or counted for margin: menu detail/list, GP headline + blended GP, spec cards, menu copy, menu-engineering matrix, movers report. They are **included** only in: the serve-management UI, POS depletion, and variance.

### Serve management UI
A simple list under the trade portal (e.g. `/trade/pouriq/serves`): create/edit/delete serves with name + pour-spec rows (reuse the ingredient picker + pour presets). Quick-create is also reachable inline from the unmatched-items review.

---

## Phase 2 — Variance v2 (consumes Phase 1)

### Data model
New table `pouriq_stock_count_events`:
- `id`, `trade_account_id`, `library_ingredient_id`, `counted_at` (ISO timestamp), `count_qty` (bottles of that item, REAL), `reason` (TEXT nullable), `created_at`.
- Index `(trade_account_id, library_ingredient_id, counted_at)`.
- The v1 `pouriq_stock_counts` table is **superseded**: left in place, no longer written/read by the editor, no data migration (pilot data negligible).

### Rolling variance computation (per ingredient, whole-bar)
For each bottle-priced library ingredient with ≥ 2 count events, take the two most recent:
- `actual_used_ml = (previous.count_qty − latest.count_qty) × bottle_size_ml`
- `theoretical_used_ml = Σ` over every cocktail **and serve** that uses the ingredient, of `units_sold_in_window × pour_ml`, where the window is `(previous.counted_at, latest.counted_at]`.
- variance ml / % / £ via the existing helpers; cost through the pack-aware `costPerMlP`; classified by the shipped tolerance band (`classifyVariance`).

**Sales-granularity caveat (accepted):** POS sales live in `pouriq_drink_volumes` bucketed by the tenant's cadence (weekly/monthly), not per-day. Theoretical usage sums the buckets whose period falls in the count window — exact when counts land on the cadence, approximate mid-bucket. Guidance in the UI: "count on your normal weekly/monthly rhythm." No per-day sales storage (would be heavy; out of scope).

### Coverage flagging (the honesty mechanism)
An ingredient's variance is only **trusted** when every POS item that sells it is accounted for (mapped to a cocktail, a serve, or ignored). If the ingredient appears in any **unmatched** POS line in the window, show **"usage understated — N unmapped sales"** with a link to the unmatched-items review, instead of a (misleadingly large) loss figure. This turns the cocktails-only blind spot into an actionable prompt rather than a false alarm.

### Reason codes
When a count yields a flagged (amber/red) variance, an optional dropdown — **over-pour / spillage / comps / breakage / theft / unknown** — stored on the latest count event's `reason`. Surfaced in the trend so patterns emerge.

### Trend
Per ingredient, the last N count-to-count variances (£ + reason). A simple **"persistent loss"** flag when variance is negative for ≥ 3 consecutive counts — the signal that separates real shrinkage from one-off counting noise.

### Count-what-matters
The count list orders by **£-impact** (per-bottle cost × recent usage), so staff count the few high-value items every time and the long tail rarely.

### UI (VarianceEditor rework)
Replace the period start/end grid with a rolling-count list:
- Each ingredient row: last count (date + qty), expected usage since (from POS), a single **"count now"** input.
- On entry: show the tolerance-banded variance (£/ml/%), the reason dropdown if flagged, or the coverage warning if under-covered.
- A per-ingredient **trend** view (last N + persistent-loss flag).
- Ordered by £-impact.

---

## Surface / files
**Phase 1:** migration (`is_serve` on `pouriq_cocktails`; "Bar serves" hidden menu handling); `menus.ts` (exclude serves/hidden menu from listings + GP; include in depletion); POS ingest/item-map (`map to serve`, volume routing by mapped cocktail_id); unmatched-items review UI (serve action + quick-create); new `/trade/pouriq/serves` management page; exclude serves from spec cards / matrix / movers / menu copy.
**Phase 2:** migration (`pouriq_stock_count_events`); `variance.ts` (rolling pair calc, reuse `classifyVariance`, helpers); new whole-bar variance loader (replaces per-menu `variance-loader.ts` logic; theoretical from cocktails+serves volumes in window; coverage check against unmatched lines); `VarianceEditor.tsx` rework; trend + count-what-matters ordering.

## Forward compatibility (long-term: everything through Pour IQ)
The serve model is deliberately the **same model as a menu item**, so the long-term goal of running complete menus through Pour IQ (not just cocktails) is a promotion, not a rebuild: a serve becomes a visible menu item by flipping `is_serve` off, giving it a sale price, and assigning it to a real menu — same recipe rows, same ingredient library, same depletion. Today serves are hidden, depletion-only; tomorrow the bar can surface them as priced menu items and they already cost/deplete correctly.

The separate prerequisite for full menus is **AI extraction of complete menus** (a real venue menu is ~14 pages of beers, wines, spirits and food, not 2–3 cocktail pages). That is its own future workstream — it ties into the existing large-PDF import timeout and the compound-ingredient extraction item — and is explicitly NOT part of variance v2. Serves here are mapped manually from the POS unmatched-items review.

## Out of scope (future)
Live perpetual on-hand + delivery ledger; per-day POS sales storage; keg line-wastage yield % (tracked separately); auto-suggesting serve pour specs from POS item names; full-menu AI extraction (above).

## Success criteria
- A spirit sold mostly outside cocktails shows an **accurate** variance once its serves are mapped — or a clear "usage understated" prompt until they are, never a false loss.
- Counting is one number per item, on the bar's normal rhythm; high-value items surface first.
- Real shrinkage stands out from noise (tolerance band + persistent-loss trend); reasons are captured.
- Serves never leak into customer menu, GP, spec cards, or the matrix.
