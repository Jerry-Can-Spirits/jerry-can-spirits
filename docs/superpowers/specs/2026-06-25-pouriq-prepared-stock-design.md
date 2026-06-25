# Pour IQ — Prepared/in-house recipes, Part B: production + stock

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** [[pouriq-ingredient-model-redesign]] Slice 3, Part B. Part A (costing, #805) is live. Part B adds **production events**: making a batch of a prepared ingredient consumes its components and produces prepared on-hand, wired into the 3a perpetual-stock engine.

**Depends on:** Slice 3-costing (#805) merged + `0045` applied. Build branch off `main`.

## Goal
Let a bar record making a batch of a house recipe (e.g. "made 4 batches of simple syrup"). That **consumes** the components from stock and **produces** prepared on-hand, so the perpetual on-hand of both the prepared ingredient and its (ml) components stays accurate.

## Locked decisions
- **Snapshot at production time.** A production event records the exact components + amounts consumed and the yield produced, so later recipe edits never rewrite history.
- **Variance deferred.** Part B does production + stock on-hand only. Variance already ignores deliveries (it assumes counts happen around restocks); folding production AND deliveries into variance's expected usage is one later "variance accuracy" upgrade.
- **ml-scoped stock**, matching the existing 3a/variance boundary (stock loader = `base_unit='ml' AND price_p>0`). Production is recorded for every prepared ingredient (cost + audit), but on-hand integration applies to ml ingredients. g/each stock coverage is a separate future enhancement.

## How production folds into the 3a engine
The 3a on-hand formula is `on-hand = anchor count + receipts − usage` (windowed since the anchor count). Production augments the two existing terms (no structural change):
- **Prepared ingredient P:** its produced yield adds to its **receipts** (P gains stock from production, like a delivery).
- **Component C:** what production consumed adds to its **usage** (C loses stock to production, like a pour).
Both windowed since each ingredient's anchor count, exactly like the existing receipts/POS-usage.

## Data model (migration `0046`)
```sql
CREATE TABLE pouriq_production_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  prepared_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  batches REAL NOT NULL CHECK (batches > 0),
  yield_base_produced REAL NOT NULL,   -- pack_size(yield) × batches, in the prepared base unit, snapshot
  produced_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_production_events_tenant ON pouriq_production_events (trade_account_id, prepared_ingredient_id, produced_at);

CREATE TABLE pouriq_production_components (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  production_event_id TEXT NOT NULL REFERENCES pouriq_production_events(id) ON DELETE CASCADE,
  component_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE RESTRICT,
  amount_base_consumed REAL NOT NULL,   -- component amount_base × batches, in the component's base unit, snapshot
  produced_at TEXT NOT NULL            -- denormalised from the event for simple windowed queries
);
CREATE INDEX idx_production_components_component ON pouriq_production_components (component_ingredient_id, produced_at);
```
(`produced_at` denormalised onto the consumption rows avoids a join when windowing component consumption per anchor count.)

## Make-a-batch action (`server-actions.ts`)
`recordProductionAction(preparedId, batches)`:
- Tenant-guard the prepared ingredient (`is_prepared = 1`, belongs to the tenant).
- `batches > 0`.
- Load the prepared row (`pack_size` = yield) + its current components (`listPreparedComponents`).
- `yield_base = pack_size × batches`; per component `amount_base_consumed = component.amount_base × batches`.
- Insert one `pouriq_production_events` row + one `pouriq_production_components` row per component (the snapshot). Use the same `produced_at` on all.
- `revalidatePath('/trade/pouriq/stock')`.
- (Optional: `undoProductionAction(eventId)` deletes the event [cascade removes consumption] to correct a mistake — include if cheap.)

## Stock loader extension (`stock-loader.ts`)
Add two windowed reads (tenant-scoped), folded into the existing per-ingredient on-hand:
- **Production yield per prepared ingredient** (after that ingredient's anchor count): `Σ yield_base_produced` from `pouriq_production_events WHERE trade_account_id=? AND produced_at > anchor`. In packs = `Σ yield_base / pack_size`. Add to `receiptsSince`.
- **Production consumption per component** (after that component's anchor count): `Σ amount_base_consumed` from `pouriq_production_components WHERE trade_account_id=? (via the event) AND component_ingredient_id=? AND produced_at > anchor`. In packs = `Σ consumed / pack_size`. Add to the usage subtracted from on-hand.
Keep the ml-only universe (`base_unit='ml'`); a g/each component's production consumption is recorded but not shown (out of scope, matching the boundary). Reuse the same windowing approach (`> anchor.counted_at`) and the `9999-12-31` open-window convention already in the loader.

## UI
- **Stock page** (`/trade/pouriq/stock` + `StockManager`): for a prepared ingredient row, a **"Make a batch"** control (batches input → `recordProductionAction`). Prepared ingredients already appear (ml + price>0). Their on-hand now reflects production yield − cocktail usage.
- Optionally a small "recent batches" list / per-row production count. Keep minimal (UI redesign is later).
- Helper copy: "Records a batch: tops up this recipe's stock and draws down its components."

## Out of scope
- **Variance** accounting for production (and deliveries) — the later variance-accuracy upgrade.
- **g/each stock** coverage (matches the existing ml-only stock/variance scope).
- Editing batch quantities after the fact (create + optional delete-to-undo only).
- Component-shortfall warnings (making a batch when you lack the components) — future.

## Tests
- `recordProductionAction` snapshot math: 4 batches of a 1600ml syrup with 1000g sugar component → event `yield_base_produced=6400`, consumption row `amount_base_consumed=4000`.
- Stock loader: a prepared ml ingredient with a production event after its count shows on-hand raised by the yield (in packs); an ml component with production consumption after its count shows on-hand reduced. Pure helpers if the per-ingredient fold is extracted; else a focused loader test or the existing pattern.
- Migration `0046` schema validity (in-memory).

## Success criteria
- "Made 4 batches of simple syrup" raises simple syrup's on-hand and draws down its ml components; the numbers reconcile against a physical count.
- Recipe edits after a batch do not change that batch's recorded consumption (snapshot).
- No change to costing (#805), variance, or non-production stock behaviour.
