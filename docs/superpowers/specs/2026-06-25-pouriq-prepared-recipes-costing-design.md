# Pour IQ — Prepared/in-house recipes, Part A: costing (Slice 3-costing)

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** [[pouriq-ingredient-model-redesign]] Slice 3. A prepared ingredient (simple syrup, house sour, grenadine, espresso batch, lime juice) is made in-house from other library ingredients with a yield. Part A = costing only: a cocktail that uses a house recipe costs correctly, with nesting + recompute. Part B (production + prepared stock, tied into the 3a perpetual engine) is the next sub-slice.

**Depends on:** Slices 1+2 (merged). Build branch off `main`.

## Goal
Let an ingredient be **made in-house** from components + a yield, with its cost **derived** (`batch cost ÷ yield`) and **materialised** onto the library row so the entire cost/variance/stock machinery works unchanged. Support nesting (a prepared recipe used inside another) with cycle detection, and recompute derived costs when a component's cost changes.

## Locked decisions
- **Nesting yes, with cycle detection** (house sour mix can use your simple syrup).
- **Costing only in Part A.** Production events + prepared stock = Part B.
- **Derived cost materialised** as the prepared row's `price_p` (= batch cost) and `pack_size` (= yield); `purchase_qty = 1`. So `cost_per_base = price_p ÷ pack_size = batch cost ÷ yield`, and cocktails/variance/stock cost it like any ingredient — no special-casing in the cost helpers.

## Data model (migration `0045`)
- Mark prepared ingredients on the library row:
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN is_prepared INTEGER NOT NULL DEFAULT 0;
```
For a prepared row: `is_prepared = 1`, `base_unit` = the yield's unit (ml/g/each), `pack_size` = the **yield amount**, `price_p` = the **derived batch cost** (pence), `purchase_qty = 1`, `yield_pct = 100`, `pack_format` = null. price_p/pack_size are computed, not typed.
- Components:
```sql
CREATE TABLE pouriq_prepared_components (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  prepared_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  component_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE RESTRICT,
  amount_base REAL NOT NULL CHECK (amount_base > 0),  -- in the COMPONENT's base unit
  recipe_unit TEXT,    -- display/entry (Slice 2 serve unit)
  recipe_qty REAL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_prepared_components_parent ON pouriq_prepared_components (prepared_ingredient_id);
CREATE INDEX idx_prepared_components_child ON pouriq_prepared_components (component_ingredient_id);
```
`ON DELETE RESTRICT` on the component prevents deleting an ingredient still used in a prepared recipe (mirrors the existing in-use guard). Note: components are costed ingredients only; free inputs (water) are captured by the yield, not as a component.

## Cost computation (`src/lib/pouriq/prepared.ts`)
- Pure: `batchCostP(components: Array<{ price_p; purchase_qty; pack_size; yield_pct; amount_base }>): number` = `Σ round(usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct) × amount_base)`. Unit-tested.
- Server: `recomputePreparedCost(db, preparedId)`: load the prepared row's components (with each component's current cost fields), compute `batchCostP`, and `UPDATE pouriq_ingredients_library SET price_p = ?, updated_at = ... WHERE id = preparedId` (pack_size already = yield). Returns the new price_p.
- A prepared component that is itself prepared has its `price_p` already materialised, so the formula is correct **provided dependencies are recomputed first** (topological order).

## Nesting, cycles, recompute propagation
- **Cycle detection** (`prepared.ts`, pure-ish): `wouldCreateCycle(db, preparedId, candidateComponentId)` — true if `preparedId` is in the transitive component closure of `candidateComponentId` (i.e. adding it loops). Reject the add in the save action.
- **Dependents recompute** `recomputeDependents(db, tradeAccountId, changedIngredientId)`: find all prepared ingredients that have `changedIngredientId` in their transitive component set; recompute them in **topological order** (a component before anything that depends on it); persist each new `price_p`. Bounded by the tenant's prepared-ingredient count (small).
- **Triggers (call `recomputeDependents`):**
  - Saving a prepared recipe (its components/yield changed) → recompute it, then its dependents.
  - Editing a purchased ingredient's cost (`saveLibraryEntryAction`) → recompute dependents.
  - Invoice commit (updates purchased ingredient costs) → for each changed ingredient, recompute dependents (after the cost UPDATE, before the response).
  After recompute, cocktail/menu costs are automatically correct (computed live from the updated prepared `price_p`).

## Cost-impact ripple interaction
The existing what-if ripple (`cost-impact.ts`) projects affected cocktails for a hypothetical ingredient cost. In Part A, the minimum is that the **persisted** recompute is correct (cocktails read live). Enhancing the what-if PREVIEW to also show "this raises your simple syrup, which raises these cocktails" is a nice-to-have; if low-cost, surface affected prepared ingredients in the impact payload, else defer. Do NOT block Part A on the preview enhancement.

## UI — ingredient form 4th option "Made in-house"
Extend the Slice-1 "How do you buy this?" with a 4th card **Made in-house / Prepared recipe**. When selected:
- Hide price/packs/pack_size. Show: **base unit** of the yield (ml/g/each), **yield amount** (= pack_size), and a **components editor**.
- Components editor (gated to EDIT, like serve units — needs the prepared id): "Add component" picks a library ingredient (via the existing `IngredientPicker`, **excluding this ingredient and any that would create a cycle**) + a `ServeUnitPicker` for the amount (in the component's units → amount_base). List components with their per-component cost; a Delete control.
- **Live derived cost readout**: batch cost + cost per yield unit (per ml/g/each) + per common serve, recomputed as components change.
- On save: persist `is_prepared=1`, `base_unit`, `pack_size`=yield, the components; call `recomputePreparedCost` + `recomputeDependents`.
- On create (no id yet): let the user set name + "Made in-house" + base unit + yield, save, then add components on edit (note: "Save first, then add the components").
- Persistent helper text (yield: "how much this batch makes"; component amount: "how much of this goes into one batch").
- A prepared ingredient then appears in the library and is usable in cocktails via the normal Slice-2 recipe entry.

## Server actions / data access
- `saveServeUnitAction`-style: `addPreparedComponentAction(preparedId, componentId, amount_base, recipe_unit, recipe_qty)` (tenant-guard both ingredients; reject self + cycles), `removePreparedComponentAction(componentRowId)`, recompute after each. 
- `listPreparedComponents(db, preparedId)` (+ the component ingredients' cost fields for the live readout).
- `saveLibraryEntryAction` extended: when the form is "Made in-house", set `is_prepared`, skip the price/pack inputs (derived), set pack_size=yield. After save, recompute.

## Migration / data
Additive (`is_prepared` default 0 = all existing ingredients are purchased; the new table is empty). No backfill.

## Tests
- `batchCostP`: simple syrup = 1000 g sugar (sugar £0.001/g) → £1.00 batch; yield 1600 ml → £0.000625/ml.
- Nesting: sour mix uses 500 ml simple syrup (£0.000625/ml) + 500 ml lemon juice → correct batch cost; recompute order.
- `wouldCreateCycle`: A→B then adding A into B is rejected.
- `recomputeDependents`: changing sugar cost updates simple syrup price_p, then sour mix price_p (topological).

## Out of scope (Part B / later)
- Production events (making a batch consumes components, adds prepared on-hand), prepared-ingredient stock/variance — the next sub-slice (ties into 3a perpetual stock).
- The what-if ripple PREVIEW showing prepared-ingredient knock-on (persisted recompute is in; preview enhancement optional).

## Success criteria
- A bar defines "Simple syrup: 1 kg sugar yields 1.6 L" and uses "15 ml simple syrup" in a cocktail; the cocktail costs correctly, and changing the sugar invoice price updates the syrup and the cocktail automatically.
- Nested recipes (sour mix using simple syrup) cost correctly and recompute in order; cycles are impossible.
- Cross-dimension is handled: "lime juice" as a prepared ingredient (e.g. components capture the lime, yield in ml) lets a cocktail use "15 ml lime juice".
- Existing purchased ingredients and all current costs are unchanged.
