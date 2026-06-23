# Pour IQ — Unified "purchase basis" ingredient pricing

**Date:** 2026-06-23
**Status:** Draft for review (spec-first; no code yet)
**Origin:** Real-menu import E2E (The Bank, Blackpool). Bars buy ingredients in formats the current model can't express without mental maths or confusing entries: a case of 24 × 200ml mixers, a 6-pack of lemons, a 10L post-mix BIB.

## Problem

The library models cost two ways (`pouriq_ingredients_library`):
- **bottle**: `bottle_size_ml` + `bottle_cost_p` → cost/ml = `bottle_cost_p / bottle_size_ml`; recipe pours `pour_ml`.
- **unit**: `unit_cost_p` → recipe uses `unit_count`.

This conflates *how you buy* with *how much goes in a drink*. So:
- A **case of 24 × 200ml** tomato juice has no clean entry — the bar must divide £14.40 ÷ 24 themselves to get a per-bottle cost.
- A **6-pack of lemons** for £2 → bar must divide to get per-lemon cost before a "⅛ lemon" serve makes sense.
- **Post-mix** (10L BIB) only works if you happen to enter 10000ml as a "bottle".
- A 200ml single-serve bottle entered as "unit" reads with no size context ("looks confusing to somebody reading it").

## Goal

One consistent cost-entry pattern — **"what do you pay, and what does that buy?"** — that derives per-item and per-ml cost, covers bottles / cases / small mixers / post-mix / produce, and reads back in plain English. No new modes to choose between. **Minimal risk to the live costing core.**

## Design — add a `purchase_qty`, reinterpret the cost field as the *purchase* price

The key insight from the cost code: bottle cost is already `(bottle_cost_p / bottle_size_ml) × pour_ml` and unit cost is `unit_cost_p × unit_count`. We can express "a pack" by adding **one** field — how many items the purchase price covers — and dividing by it. This is **additive and backward-compatible**: existing rows get `purchase_qty = 1`, so their cost is unchanged.

### Data model
Add to `pouriq_ingredients_library`:
- `purchase_qty INTEGER NOT NULL DEFAULT 1` — how many items the price covers (1 bottle, 24 bottles, 6 lemons, 1 BIB).

Reinterpret the existing fields (no rename needed; semantics widen):
- `bottle_size_ml` = size of **one** item, ml (null for non-liquid whole items like a lemon).
- `bottle_cost_p` / `unit_cost_p` = **the purchase price you pay** (for all `purchase_qty` items together).

Derived (never stored):
- `cost_per_item_p = round(cost_p / purchase_qty)`
- `cost_per_ml = bottle_size_ml ? (cost_p / purchase_qty) / bottle_size_ml : null`

The existing CHECK (`(bottle_size_ml AND bottle_cost_p) OR unit_cost_p`) is unchanged. "Poured" vs "whole item" remains implicit: a row with `bottle_size_ml` set is poured (recipe `pour_ml`); a `unit_cost_p` row is whole-item (recipe `unit_count`, may be fractional).

### Worked examples
| Bought as | bottle_size_ml | cost field | purchase_qty | cost/item | cost/ml | recipe |
|---|---|---|---|---|---|---|
| 700ml gin, £20 | 700 | bottle 2000 | 1 | — | 0.0286p | 50ml pour |
| Case 24 × 200ml, £14.40 | 200 | bottle 1440 | 24 | 60p | 0.003p | 150ml pour |
| 6 lemons, £2 | null | unit 200 | 6 | 33.3p | — | ⅛ lemon (unit_count 0.125) |
| 10L post-mix BIB, £45 | 10000 | bottle 4500 | 1 | — | 0.0045p | 150ml pour |
| Single 700ml, £18 (existing row) | 700 | bottle 1800 | 1 (default) | — | 0.00257p | unchanged |

### Calculation changes (`src/lib/pouriq/calculations.ts`)
`ingredientCostPence`:
- unit branch → `round((unit_cost_p / purchase_qty) * unit_count)`
- bottle branch → `round(((bottle_cost_p / purchase_qty) / bottle_size_ml) * pour_ml)`

`ingredientCostComplete` — unchanged logic; `purchase_qty` is NOT NULL default 1 so never blocks completeness.

Because existing rows have `purchase_qty = 1`, **every existing calculation result is identical**. New unit tests cover qty > 1 (case + produce) alongside the existing qty = 1 cases.

### Other read sites that must divide by `purchase_qty`
- **Variance** (`src/lib/pouriq/variance.ts` `calcVarianceCostP`): per-ml cost = `(bottle_cost_p / purchase_qty) / bottle_size_ml`.
- **Cost-impact / ripple** (`cost-impact.ts`, `multi-cost-impact.ts`): any place computing per-ml from `bottle_cost_p / bottle_size_ml` divides by `purchase_qty`. Audit all usages of `bottle_cost_p` / `unit_cost_p` for cost derivation and route them through a single shared helper `costPerMl(entry)` / `costPerItem(entry)` added to `calculations.ts`, so the `purchase_qty` division lives in one place and can't be missed.

### Invoice scanning interaction
Invoice scanning updates an ingredient's cost. With the new model it sets `bottle_cost_p`/`unit_cost_p` to the **purchase price on the invoice** and may set `purchase_qty` from the invoice line (e.g. "1 case (24)"). If pack size is unknown from the invoice, leave `purchase_qty` unchanged and update only the price. The cost-change audit (`pouriq_cost_changes`) records old/new purchase price as today. Ripple recompute uses the shared `costPerMl`/`costPerItem` helpers so it's automatically pack-aware.

### Catalogue interaction
Catalogue entries gain no new column — they only seed *defaults*. A catalogue adoption seeds `bottle_size_ml` (per-item size) and `purchase_qty = 1`; the bar then enters their purchase basis. No catalogue migration needed.

## Form UX (the seamless bit)
Cost entry on the ingredient form (`IngredientForm`, and the inline create in `IngredientPicker` / `IngredientMatchRow`) becomes a single block:

```
Cost
( ) Poured (mixers, spirits)   ( ) Whole item (fruit, garnish)

Price you pay   [ £14.40 ]
What that buys  [ 24 ] × [ 200 ] ml        ← "× N ml" only for "Poured"
                [ 6 ]  lemons              ← just "× N" for "Whole item"

  = £0.60 per bottle · £0.003 / ml          ← live derived readout
```
- `purchase_qty` defaults to 1, so the simple case ("£20, 1 × 700ml") is unchanged in feel — the "what that buys" qty just sits at 1.
- Bottle size becomes **free entry** (number) with the quick presets `150 / 200 / 500 / 700 / 750 / 1000 / 2000` plus a typed value for anything else (e.g. 10000 for a BIB). Replaces the fixed `COMMON_BOTTLE_SIZES` dropdown.
- The live derived readout removes any doubt about what's stored.

### Produce yield helper (optional sub-feature, same model)
For "Whole item" produce, an optional hint converts a serving into a fraction: "1 lemon = [8] slices → use 1 slice = 0.125". This just helps the user pick `unit_count`; it stores nothing extra. Can ship after the core.

### Display / read-back
Anywhere an ingredient's pricing is shown (library list, edit page, spec context), render the human basis:
> *Tomato Juice — £14.40 / 24 × 200ml (£0.003/ml)* · *Lemon — £2.00 / 6 (£0.33 each)* · *Gin — £20.00 / 700ml*

A shared `formatPurchaseBasis(entry)` helper produces this string.

## Migration
`00NN_ingredient_purchase_qty.sql` (next free number at implementation time):
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN purchase_qty INTEGER NOT NULL DEFAULT 1;
```
Additive, non-destructive, no backfill needed (default 1 == current behaviour). Apply local then `--remote` after merge.

## Surface / files
- Migration: new `migrations/00NN_ingredient_purchase_qty.sql`.
- `src/lib/pouriq/types.ts`: `IngredientLibraryRow.purchase_qty: number`.
- `src/lib/pouriq/calculations.ts`: add `costPerItemP` / `costPerMl` helpers; update `ingredientCostPence`. **All other per-ml/per-item math routes through these helpers.**
- `src/lib/pouriq/variance.ts`, `cost-impact.ts`, `multi-cost-impact.ts`: use the shared helpers.
- Server actions (`server-actions.ts`) + import commit + invoice commit: persist `purchase_qty`.
- Forms: `IngredientForm`, `IngredientPicker`, `IngredientMatchRow` (free-size entry + purchase qty + derived readout), shared `BOTTLE_SIZES_ML` presets (from `measures.ts`).
- Display helper `formatPurchaseBasis` + its usages (library list, edit page).
- Tests: `calculations` (qty > 1), `variance` cost (qty > 1), `formatPurchaseBasis`.

## Risks & mitigations
- **Missed division site** → single source of truth: every cost derivation goes through `costPerMl` / `costPerItem`; grep for raw `bottle_cost_p /` and `unit_cost_p *` after the change to confirm none remain.
- **Behaviour drift for existing data** → `purchase_qty` default 1 makes the change a no-op for current rows; assert this with tests that mirror today's expected costs.
- **Scope creep** → produce-yield helper and display polish are sub-features that can land after the core model + calc + form.

## Out of scope (separate items)
Variance v2 (perpetual depletion), compound "A & B juice" extraction, Field-Manual recipe import, bulk-delete on the library page, brand↔generic UI. Tracked in `memory/project_pour_iq_backlog.md`.

## Success criteria
- A bar can enter "case of 24 × 200ml for £14.40" (or "6 lemons for £2", or a 10L BIB) without doing division, and the row reads back in plain English.
- Existing ingredients' costs/GP are byte-for-byte unchanged (qty = 1).
- Per-ml/per-item cost is computed in exactly one place, pack-aware everywhere (recipes, variance, ripple, invoices).
