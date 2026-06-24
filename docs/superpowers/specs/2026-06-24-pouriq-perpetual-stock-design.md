# Pour IQ — Perpetual stock + receipts (Phase 3a)

**Date:** 2026-06-24
**Status:** Design approved (decisions locked with Dan)
**Origin:** Phase 3 (par/reorder/perpetual). 3a is the foundation: a live on-hand estimate per ingredient so a bar always knows roughly how much it has without constant counting. 3b (par + reorder) consumes it. Built before the full E2E to ship a robust product.

## Goal
Maintain a per-ingredient **estimated on-hand** that updates automatically from deliveries (receipts) and sales (depletion), anchored by occasional physical counts. No constant stock-takes.

## Locked decisions
- **Anchored perpetual:** `on-hand = last physical count + receipts since that count − expected usage since that count`. Each new count re-anchors; drift can't compound.
- **Receipts from invoices + manual.** A committed invoice books a receipt per matched line; a manual "received" entry covers un-invoiced deliveries.
- **Keg/line yield:** a per-ingredient `yield_pct` (default 100) feeds the SAME depletion used by variance v2, so expected usage = `sold ÷ (yield/100)`. Default 100 = no change to any existing ingredient or to shipped variance behaviour. Normal line loss becomes expected, not flagged.
- **Units:** on-hand, counts and receipts are in **bottles/containers** (matching `pouriq_stock_count_events.count_qty`, REAL). Bottle-priced ingredients only (same scope as variance v2).
- **UI is intentionally minimal** for now (a stock list + a receive form). A richer stock UI is a deliberate later workstream; 3a is about the engine.

## Data model
New migration `0042_stock_receipts_and_yield.sql`:
```sql
CREATE TABLE pouriq_stock_receipts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  received_at TEXT NOT NULL,            -- ISO date/datetime
  qty REAL NOT NULL,                    -- in stock units (bottles/containers)
  source TEXT NOT NULL CHECK (source IN ('invoice','manual')),
  invoice_line_id TEXT,                 -- set when source='invoice'; enables idempotent booking
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_stock_receipts_lookup
  ON pouriq_stock_receipts (trade_account_id, library_ingredient_id, received_at);
-- One receipt per invoice line (idempotent re-commit). Partial-unique via a
-- separate unique index on the non-null invoice_line_id.
CREATE UNIQUE INDEX uniq_stock_receipts_invoice_line
  ON pouriq_stock_receipts (invoice_line_id) WHERE invoice_line_id IS NOT NULL;

ALTER TABLE pouriq_ingredients_library ADD COLUMN yield_pct REAL NOT NULL DEFAULT 100;
```
(`par_level` is added in 3b, not here.)

## On-hand computation — `src/lib/pouriq/stock-loader.ts` (`'server-only'`)
Per bottle-priced library ingredient that has at least one count event (the anchor):
- `anchor` = latest count event (`counted_at`, `count_qty`).
- `receiptsSince` = Σ `qty` of receipts with `received_at > anchor.counted_at`.
- `usageSinceMl` = Σ over the ingredient's cocktail+serve recipe lines of `unitsSoldInWindow × pour_ml`, window `(anchor.counted_at, today]`, summed from `pouriq_drink_volumes` buckets (reuse `sumBucketsInWindow`). 
- `expectedUsageBottles = (usageSinceMl / bottle_size_ml) / (yield_pct / 100)`.
- `onHandBottles = anchor.count_qty + receiptsSince − expectedUsageBottles` (floored at 0 for display; can show a small negative as "check stock", but clamp the stored/derived figure sensibly — display `max(0, …)` with a note when it would be negative).
- Returns rows `{ library_ingredient_id, name, bottle_size_ml, onHandBottles, anchorCountAt, anchorCountQty, receiptsSince, expectedUsageBottles, yield_pct }`, ordered by name (or by £-value later).
- Ingredients with **no count yet**: returned with `onHandBottles = null` and a flag `needsOpeningCount = true` (the stock view prompts for an opening count, which is just a `pouriq_stock_count_events` row — reuse the variance count entry).

This reuses variance v2's count events and bucket-sum helper. The only new window is `(anchor, today]` vs variance's `(prev, latest]`.

## Yield in variance v2 (consistency)
Extend the existing depletion so both views agree. In `variance-rolling-loader.ts`, divide the per-ingredient theoretical usage by `(yield_pct / 100)` (load `lib.yield_pct` in the recipe query; default 100 means no change). Add a unit test that yield 100 is identical to today and yield 90 increases expected usage by ~11%.

## Receipts from invoices (idempotent)
File: `src/app/api/pouriq/invoices/commit/route.ts`. After the invoice + lines are committed, for each line with a `matched_library_id` AND a positive received quantity, insert a `pouriq_stock_receipts` row:
- `received_at` = the invoice date (or commit time if no date).
- `qty` = received quantity in **bottles**, converted from the invoice line via purchase basis: `qty = extracted_quantity × (purchase_qty of the matched ingredient if the line represents whole purchase-units, else 1)`. **Conversion rule (explicit):** the invoice's `extracted_quantity` is the number of *purchase units* on the line; received bottles = `extracted_quantity × purchase_qty`. When `purchase_qty = 1` (the common case) this is just `extracted_quantity`. If `extracted_quantity` is null, skip the receipt (cost still applies).
- `source = 'invoice'`, `invoice_line_id` = the line id.
- Use `INSERT ... ON CONFLICT(invoice_line_id) DO NOTHING` so re-committing the same invoice never double-books.
Tenant scope via the existing commit auth (`access.tradeAccountId`) and the matched ingredient's ownership (already validated in the commit flow).

## Manual receive
- Server action `receiveStockAction(libraryIngredientId, qtyBottles, receivedAtISO?)` in `server-actions.ts`: tenant-guards the ingredient, inserts a `pouriq_stock_receipts` row `source='manual'`, `revalidatePath` the stock page.
- Minimal UI: on the stock page, a small "Receive stock" control per ingredient (qty in bottles + optional date) calling the action.

## Minimal UI
A new tenant page `/trade/pouriq/stock`:
- Lists bottle-priced ingredients with: name, estimated on-hand (bottles), last-count anchor (date + qty), receipts since, expected usage since. 
- "Set opening count" / "Recount" inline (writes a `pouriq_stock_count_events` row — same entry as variance).
- "Receive stock" inline (manual receipt).
- An "estimate, last counted on X" caption so the number's provenance is clear.
- Hub link "Stock".
Keep styling consistent with existing Pour IQ pages; do not over-invest (UI redesign is later).

## Out of scope (3b / later)
Par levels, reorder suggestions, the order report, low-stock flags (all 3b). Lead-time modelling, supplier records, multi-location, and the richer stock UI redesign.

## Tests
- `stock-loader` on-hand math: count + receipts − usage/yield; no-count → needsOpeningCount; yield 100 vs 90.
- Receipt conversion: purchase_qty 1 and 24; null quantity skipped.
- Idempotent invoice booking (ON CONFLICT).
- Variance loader yield: 100 unchanged, 90 increases expected usage.

## Success criteria
- After an opening count, a synced invoice raises on-hand and POS sales lower it, with no further counting required.
- A keg with `yield_pct = 90` depletes ~11% faster than its raw pour total, and that loss is not flagged as variance.
- Re-committing an invoice does not double-count stock.
