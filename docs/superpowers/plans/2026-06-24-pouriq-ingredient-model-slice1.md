# Ingredient Model Slice 1 (purchase model + base unit) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bottle/unit ingredient cost model with a unified purchase model (`packs × pack_size` of a `base_unit` ml/g/each for a `price`), migrate live data, and keep every cocktail/variance/stock/invoice flow working.

**Architecture:** A single cost-per-base-unit helper. New neutral columns on `pouriq_ingredients_library`; a SQLite table-rebuild migration drops the legacy columns. The refactor is made safe by keeping BOTH legacy and new fields on `IngredientLibraryRow` until the final task, migrating readers in grouped green steps, then removing the legacy fields so `tsc` flags any reader that was missed. The rebuild migration is committed early but applied locally only in verification, after testing on a prod-data snapshot.

**Tech Stack:** Cloudflare D1 (SQLite), Next.js, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-24-pouriq-ingredient-model-slice1-design.md`.

**Branch:** `feat/pouriq-ingredient-model-slice1` (already created off `origin/main`, which includes 3a).

**Model:** `costPerBaseUnitP = price_p ÷ (purchase_qty × pack_size)`; `usable = ÷ (yield_pct/100)`; recipe cost = `usable × amountInBase` (amountInBase = recipe line `pour_ml` for ml/g base, `unit_count` for each). Liquid→ml, Weight→g, Count→each. `purchase_qty` = packs.

**Safety rule:** every step must end with `npx tsc --noEmit` clean, `npm run test:unit` green, and (from Task 5 on) `npm run build` passing. The rebuild migration (`0043`) is NOT applied to the local dev DB until Task 9.

---

### Task 1: New cost helpers (TDD)

**Files:** Modify `src/lib/pouriq/calculations.ts`; Test `tests/unit/lib/pouriq-base-cost.test.ts`

- [ ] **Step 1: Failing test** — create `tests/unit/lib/pouriq-base-cost.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { costPerBaseUnitP, usableCostPerBaseUnitP } from '@/lib/pouriq/calculations'

describe('costPerBaseUnitP', () => {
  it('700ml bottle for £20 -> ~0.0286p/ml', () => {
    expect(costPerBaseUnitP(2000, 1, 700)).toBeCloseTo(2000 / 700, 6)
  })
  it('case of 24x200ml for £14.40 -> 0.003p/ml', () => {
    expect(costPerBaseUnitP(1440, 24, 200)).toBeCloseTo((1440 / 24) / 200, 6)
  })
  it('40 lemons for £8 -> 20p each', () => {
    expect(costPerBaseUnitP(800, 40, 1)).toBeCloseTo(20, 6)
  })
  it('5kg sugar for £6 -> 0.0012p/g', () => {
    expect(costPerBaseUnitP(600, 1, 5000)).toBeCloseTo(600 / 5000, 6)
  })
})

describe('usableCostPerBaseUnitP', () => {
  it('is a no-op at 100% yield', () => {
    expect(usableCostPerBaseUnitP(2000, 1, 700, 100)).toBeCloseTo(2000 / 700, 6)
  })
  it('raises cost as yield drops (lime 75%)', () => {
    expect(usableCostPerBaseUnitP(800, 40, 1, 75)).toBeCloseTo(20 / 0.75, 6)
  })
})
```
- [ ] **Step 2:** Run, confirm FAIL.
- [ ] **Step 3:** Implement (append to `calculations.ts`; keep existing helpers for now):
```ts
export function costPerBaseUnitP(price_p: number, packs: number, pack_size: number): number {
  const p = packs > 0 ? packs : 1
  const s = pack_size > 0 ? pack_size : 1
  return (price_p / p) / s
}
export function usableCostPerBaseUnitP(price_p: number, packs: number, pack_size: number, yield_pct: number): number {
  const y = yield_pct > 0 ? yield_pct : 100
  return costPerBaseUnitP(price_p, packs, pack_size) / (y / 100)
}
```
- [ ] **Step 4:** Run, confirm PASS, then `npm run test:unit`.
- [ ] **Step 5:** Commit `feat(pouriq): cost-per-base-unit helpers (ingredient model slice 1)`.

---

### Task 2: Migration 0043 (table rebuild) + backfill mapping test

**Files:** Create `migrations/0043_ingredient_purchase_model.sql`; Test `tests/unit/lib/pouriq-ingredient-migration.test.ts`

- [ ] **Step 1: Read the current schema.** Find the migration that creates `pouriq_ingredients_library` (grep `CREATE TABLE pouriq_ingredients_library`) and note the EXACT column list, the CHECK, and ALL indexes (barcode, trade_account_id, etc.). The rebuild must recreate every index.

- [ ] **Step 2: Write the rebuild migration.** Standard SQLite table-rebuild. Template (adapt column/index list to the real schema; `ingredient_type` is carried through unchanged — verify it has no DB-level CHECK; if it does, widen it to include `soft-drink`,`food` in the rebuilt CHECK or leave the category set as a TS-only concern):
```sql
-- Ingredient model slice 1: unify the purchase model. Neutral columns
-- (base_unit/pack_size/price_p/pack_format/subcategory); drop bottle_size_ml/
-- bottle_cost_p/unit_cost_p. Table rebuild because the old CHECK references the
-- dropped columns and there are inbound FKs.
PRAGMA foreign_keys=OFF;
CREATE TABLE pouriq_ingredients_library_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ingredient_type TEXT NOT NULL,
  base_unit TEXT NOT NULL DEFAULT 'ml',
  pack_size REAL NOT NULL DEFAULT 1,
  price_p INTEGER NOT NULL DEFAULT 0,
  purchase_qty INTEGER NOT NULL DEFAULT 1,
  yield_pct REAL NOT NULL DEFAULT 100,
  pack_format TEXT,
  subcategory TEXT,
  barcode TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (base_unit IN ('ml','g','each') AND pack_size > 0 AND price_p >= 0)
);
INSERT INTO pouriq_ingredients_library_new
  (id, trade_account_id, name, ingredient_type, base_unit, pack_size, price_p,
   purchase_qty, yield_pct, pack_format, subcategory, barcode, notes, created_at, updated_at)
SELECT
  id, trade_account_id, name, ingredient_type,
  CASE WHEN bottle_size_ml IS NOT NULL THEN 'ml' ELSE 'each' END,
  COALESCE(bottle_size_ml, 1),
  COALESCE(bottle_cost_p, unit_cost_p, 0),
  purchase_qty, yield_pct, NULL, NULL, barcode, notes, created_at, updated_at
FROM pouriq_ingredients_library;
DROP TABLE pouriq_ingredients_library;
ALTER TABLE pouriq_ingredients_library_new RENAME TO pouriq_ingredients_library;
-- recreate every index that existed on the original table:
CREATE INDEX idx_pouriq_ingredients_library_account ON pouriq_ingredients_library (trade_account_id);
-- (add the barcode index / any others exactly as they were)
PRAGMA foreign_keys=ON;
```

- [ ] **Step 3: Unit-test the backfill mapping** in `tests/unit/lib/pouriq-ingredient-migration.test.ts` using in-memory SQLite (`node:sqlite`): create the OLD table, insert one bottle row (bottle_size_ml=700, bottle_cost_p=2000, purchase_qty=1) and one unit row (unit_cost_p=800, purchase_qty=40), run the migration SQL, assert the rebuilt rows have base_unit/pack_size/price_p = (`ml`,700,2000) and (`each`,1,800), and the same `id`s. (If `node:sqlite` is unavailable, write the SELECT-mapping as a pure TS function `migrateRow(old)` and test that instead, mirroring the SQL CASE/COALESCE.)

- [ ] **Step 4:** Commit `feat(pouriq): migration 0043 unify ingredient purchase model (rebuild)`. Do NOT apply to the local D1 yet.

---

### Task 3: Types — add new fields (keep legacy) + fix row mapping

**Files:** `src/lib/pouriq/types.ts`; the SELECT/row-mappers: `menus.ts`, `ingredient-library.ts`, `ingredient-catalogue.ts`, `barcode-catalogue.ts`, `src/app/api/pouriq/library/by-barcode/route.ts`.

- [ ] **Step 1:** On `IngredientLibraryRow` ADD `base_unit: 'ml'|'g'|'each'`, `pack_size: number`, `price_p: number`, `pack_format: string | null`, `subcategory: string | null`. KEEP `bottle_size_ml`/`bottle_cost_p`/`unit_cost_p` for now (removed in Task 8).
- [ ] **Step 2:** Update every query that SELECTs/maps a library row to select and map the NEW columns (`base_unit, pack_size, price_p, pack_format, subcategory`) and STOP selecting the legacy columns (they are dropped by 0043). Where a mapper builds an `IngredientLibraryRow`, set the legacy fields to a derived/placeholder value so the type still satisfies (e.g. `bottle_size_ml: row.base_unit === 'ml' ? row.pack_size : null` is NOT needed — simpler: set legacy fields to `null`/`0` since nothing should read them after Task 4; they exist only to satisfy the type until Task 8). Document in a comment that legacy fields are transitional.
- [ ] **Step 3:** `npx tsc --noEmit` clean; `npm run test:unit` green. Commit `feat(pouriq): ingredient row carries base_unit/pack_size/price_p`.

---

### Task 4: Cost maths → new model

**Files:** `calculations.ts` (`ingredientCostPence`, `formatPurchaseBasis`, `ingredientCostComplete`), `variance-rolling-loader.ts` + `variance-loader.ts`, `stock-loader.ts` + `stock.ts`, `cost-impact.ts` + `cost-impact-loader.ts` + `multi-cost-impact.ts`.

- [ ] **Step 1:** Route ALL cost derivation through `usableCostPerBaseUnitP`/`costPerBaseUnitP`. `ingredientCostPence`: `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct) × amountInBase` (amountInBase = `pour_ml` or `unit_count`). `formatPurchaseBasis`: reword base-unit-aware (`£X / N × {size}{ml|g} (£y/{ml|g})`, `£X / N each (£y each)`). `ingredientCostComplete`: complete when `pack_size>0 && price_p>=0` (always true post-migration) — adjust the rule to the new fields.
- [ ] **Step 2:** Stock: rename `computeOnHandBottles`→`computeOnHandPacks` and base it on `pack_size` (usage_in_base ÷ pack_size = packs); `stock-loader` reads `pack_size`/`base_unit`/`price_p`; variance loaders read the new fields (yield via `applyYield` unchanged). Update the relevant unit tests + add a regression test that a migrated 700ml/£20 bottle yields the same recipe cost as before. Remove the now-unused legacy helpers (`costPerMlP`/`bottlePourCostP`/`unitPourCostP`) if nothing references them (grep).
- [ ] **Step 3:** `tsc` clean; `npm run test:unit` green. Commit `feat(pouriq): cost/variance/stock maths on the base-unit model`.

---

### Task 5: Form redesign + tooltips

**Files:** `IngredientForm.tsx`, `IngredientMatchRow.tsx`, `IngredientPicker.tsx` (inline create), `measures.ts` (gram presets), `server-actions.ts` (save uses new fields).

- [ ] **Step 1:** Replace "Pricing mode" with **"How do you buy this?"** three cards: Liquid (ml) / Weight (g) / Count (each). Fields: Price paid (`price_p`), Packs bought (`purchase_qty`), Quantity per pack (`pack_size`) with the unit from base_unit, Pack format (dropdown: bottle/can/keg/bag-in-box/carton/pouch/case/crate/bag/tub/box/other), Category (`ingredient_type`, extend options with soft-drink/food) + Subcategory, Yield % under an "Advanced costing" disclosure. **Live readout** (cost per base unit + per common serve). Save writes the new fields via the existing save action (update `saveLibraryEntryAction`/`LibraryEntryInput` to the new shape).
- [ ] **Step 2: Tooltips/helper text on every field** — persistent captions (tablet-friendly, not hover-only), per the spec examples (pack size, packs, pack format, yield, base unit). A small shared `FieldHint` component is fine.
- [ ] **Step 3:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): how-do-you-buy-this ingredient form + tooltips`.

---

### Task 6: Import + invoice write paths → new model

**Files:** `ImportPreview.tsx` + `src/app/api/pouriq/import/commit/route.ts`; `InvoiceLineRow.tsx` + `InvoicePreview.tsx` + `invoices.ts` + `invoice-match.ts` + `src/app/api/pouriq/invoices/commit/route.ts`; `measurement-parse.ts`.

- [ ] **Step 1:** The import match-row inline-create and the invoice commit both create library entries — write the NEW fields (`base_unit`, `pack_size`, `price_p`, `purchase_qty`). Map parsed measurements (`measurement-parse.ts`) to `base_unit` + `pack_size` (ml/g/each). The 3a invoice receipt booking (`receiptBottlesFromInvoiceLine`) already converts via packs — keep it consistent (it now reads `purchase_qty`/`pack_size` naming; terminology "packs").
- [ ] **Step 2:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): import + invoice write the base-unit ingredient model`.

---

### Task 7: Display + terminology

**Files:** `SpecCard.tsx`, `IngredientList.tsx`, `menu-copy.ts`, `CostImpactPanel.tsx`, `StockManager.tsx`, `InvoiceLineRow.tsx`/`InvoicePreview.tsx` display.

- [ ] **Step 1:** Update displays that show purchase basis / size / cost to use `formatPurchaseBasis` (new) and the base unit. `StockManager`: "bottles" → "packs" (or the pack_format label where available). No cost recompute in the client (use server values).
- [ ] **Step 2:** `npm run build`, `tsc`, `test:unit` green. Commit `feat(pouriq): displays read the base-unit model`.

---

### Task 8: Remove legacy fields (the tsc safety net)

**Files:** `src/lib/pouriq/types.ts` + any stragglers tsc flags.

- [ ] **Step 1:** Remove `bottle_size_ml`/`bottle_cost_p`/`unit_cost_p` from `IngredientLibraryRow`. Run `npx tsc --noEmit` — fix EVERY error it surfaces (these are readers that were missed; migrate them to the new fields). Also `grep -rn "bottle_size_ml\|bottle_cost_p\|unit_cost_p" src/` and confirm zero remain (except inside the 0043 migration's backfill SELECT, which is correct).
- [ ] **Step 2:** `tsc` clean, `npm run test:unit` green, `npm run build` passes. Commit `feat(pouriq): drop legacy bottle/unit fields from the ingredient model`.

---

### Task 9: Verification + finish

- [ ] **Step 1: Test the migration on real-shaped data.** Export the prod (or a representative) `pouriq_ingredients_library` to a local sqlite, run `0043`, and verify: row count unchanged, every row has a valid base_unit/pack_size/price_p, and spot-check that a few known ingredients' computed costs are unchanged. If the rebuild misbehaves (FK/data issue) STOP and fall back to the additive approach documented in the spec.
- [ ] **Step 2:** Apply `0043` to the LOCAL dev D1 (`npx wrangler d1 migrations apply jerry-can-spirits-db --local`) and smoke-test: create one ingredient of each type (Liquid/Weight/Count) and confirm the live readout; open a cocktail spec, the variance page, and the stock page and confirm costs render.
- [ ] **Step 3:** `npm run test:unit`, `npm run build`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build` — all green.
- [ ] **Step 4:** `superpowers:finishing-a-development-branch` → PR. PR body MUST: note **apply migration 0043 to prod after merge**; state the rebuild was tested on a data snapshot; note this is Slice 1 (recipe units = Slice 2, prepared recipes = Slice 3); confirm existing ingredient costs are unchanged.

---

## Notes / risks
- **Riskiest task is the rebuild (0043).** It is committed in Task 2 but applied locally only in Task 9 after a snapshot test, and to prod only after merge. Additive-only fallback (keep legacy columns + dual-write, defer drop) is documented in the spec if the rebuild proves unsafe on D1.
- **Green between tasks:** the type keeps legacy + new fields until Task 8, so Tasks 3-7 stay tsc-green while readers migrate; Task 8's removal makes tsc prove no reader was missed. Local DB is not migrated until Task 9, so unit tests (pure) and build are the per-task gates.
- **Costs must be unchanged** for migrated data — the regression test in Task 4 + the snapshot check in Task 9 enforce this.
- **Out of scope:** recipe units (Slice 2; coffee-bean garnish is its canonical test), prepared recipes (Slice 3), weight in recipe lines, the dashboard/nav UI redesign.
