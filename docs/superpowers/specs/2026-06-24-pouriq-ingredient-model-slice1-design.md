# Pour IQ — Ingredient model redesign, Slice 1: purchase model + base unit

**Date:** 2026-06-24
**Status:** Design approved in brainstorm (decisions locked with Dan)
**Origin:** [[pouriq-ingredient-model-redesign]] — shift the ingredient model from "bottle vs unit" to "how was this bought, and how is it used?". Slice 1 is the foundation: the purchase side + base unit. Slices 2 (recipe units) and 3 (prepared/in-house recipes) follow.

## Goal
Replace the bottle/unit cost model with a single unified purchase model: an ingredient is bought as **`packs` × `pack_size` of a `base_unit`** for a **`price`**, from which cost-per-base-unit (and usable cost via yield) derives. Add Weight (grams) as a first-class base unit, a human-readable pack-format label, and category/subcategory. Migrate the live data; keep every cocktail working.

## Locked decisions
- **Migration = neutral columns + migrate, then drop the legacy columns** (clean, "dead right").
- **Slice 1 = the full purchase model**: Liquid / Weight / Count, base units ml / g / each, pack-format label, category + subcategory, generalised yield, live cost readout.
- **Recipe lines unchanged in Slice 1.** A Weight ingredient is purchasable / stockable / costable, but not yet usable directly in a cocktail recipe line (weight is used via prepared recipes, Slice 3). Named recipe units (wedge, wheel, bean) are Slice 2.
- **Tooltips / helper text on every field** — persistent and tablet-friendly (not hover-only).

## The unified model
```
cost per base unit (p) = price_p ÷ (packs × pack_size)
usable cost per base unit (p) = costPerBaseUnit ÷ (yield_pct ÷ 100)
recipe cost (p) = usableCostPerBaseUnit × amount_in_base_unit
```
- **Liquid** → base_unit `ml`. 700ml bottle = packs 1, pack_size 700. Case of 24×330ml = packs 24, pack_size 330.
- **Weight** → base_unit `g`. 5kg sugar = packs 1, pack_size 5000.
- **Count** → base_unit `each`. 40 lemons = packs 40, pack_size 1. Case of 24 cans = packs 24, pack_size 1.

## Schema (migration)
Current `pouriq_ingredients_library`: `id, trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, purchase_qty, yield_pct, barcode, notes, created_at, updated_at`, with CHECK `(bottle_size_ml IS NOT NULL AND bottle_cost_p IS NOT NULL) OR unit_cost_p IS NOT NULL`.

**Target columns:**
- `base_unit TEXT NOT NULL DEFAULT 'ml'` CHECK in (`ml`,`g`,`each`)
- `pack_size REAL NOT NULL DEFAULT 1` — base units per pack
- `price_p INTEGER NOT NULL DEFAULT 0` — price for `purchase_qty` packs (unifies bottle_cost_p/unit_cost_p)
- `pack_format TEXT` — human label (bottle/can/keg/bag-in-box/carton/pouch/case/crate/bag/tub/box/other); nullable
- `subcategory TEXT` — nullable
- keep `purchase_qty` (= **packs**, default already 1), `yield_pct`, `barcode`, `notes`, `ingredient_type` (now the **category**; extend the allowed set with `soft-drink` and `food`)
- **drop** `bottle_size_ml`, `bottle_cost_p`, `unit_cost_p`
- New CHECK: `pack_size > 0 AND price_p >= 0 AND base_unit IN ('ml','g','each')`

**Migration mechanics (the key risk):** because the legacy CHECK references the columns we drop, and the table has inbound foreign keys (`pouriq_ingredients`, `pouriq_stock_receipts`, `pouriq_stock_count_events`, `pouriq_cost_changes`, `pouriq_invoice_lines`, `pouriq_pos_item_map` all reference `library_ingredient_id`), this requires the standard **SQLite table-rebuild**:
1. `PRAGMA foreign_keys=OFF;` (connection-level; confirm D1 honours it within a migration — if not, see fallback)
2. `CREATE TABLE pouriq_ingredients_library_new (... new schema ...)`
3. `INSERT INTO ..._new SELECT id, trade_account_id, name, ingredient_type, purchase_qty, yield_pct, barcode, notes, created_at, updated_at, CASE WHEN bottle_size_ml IS NOT NULL THEN 'ml' ELSE 'each' END AS base_unit, COALESCE(bottle_size_ml, 1) AS pack_size, COALESCE(bottle_cost_p, unit_cost_p, 0) AS price_p, NULL AS pack_format, NULL AS subcategory FROM pouriq_ingredients_library;`
4. `DROP TABLE pouriq_ingredients_library; ALTER TABLE pouriq_ingredients_library_new RENAME TO pouriq_ingredients_library;`
5. recreate indexes (barcode, trade_account_id) and `PRAGMA foreign_keys=ON;`
**Verify locally against a copy of prod data before applying remote.** If D1 cannot safely rebuild a table with inbound FKs inside a migration, **fall back** to additive-only: add the new columns, backfill, keep the legacy columns NULLable, and replace the CHECK is impossible without rebuild — so the fallback keeps legacy columns populated in sync (dual-write) and defers the drop to a later cleanup. Decide during the plan after testing the rebuild on a prod snapshot. Document the chosen path in the PR.

## Cost helpers (`src/lib/pouriq/calculations.ts`)
- New single source: `costPerBaseUnitP(price_p, packs, pack_size)` = `(price_p / packs) / pack_size`; `usableCostPerBaseUnitP(..., yield_pct)` = `costPerBaseUnitP ÷ (yield/100)`.
- Replace `costPerMlP` / `bottlePourCostP` / `unitPourCostP` usages with the new helper. Keep thin compatibility wrappers ONLY if it reduces churn, otherwise remove.
- `ingredientCostPence`: recipe cost = `usableCostPerBaseUnitP(entry) × amountInBase`, where `amountInBase` = the recipe line's `pour_ml` (ml/g base) or `unit_count` (each base). (Slice 1: a `g`-base ingredient has no recipe line yet, so this is fine.)
- `formatPurchaseBasis`: reword to the new model, e.g. `£14.40 / 24 × 200ml (£0.003/ml)`, `£8.00 / 40 each (£0.20 each)`, `£20.00 / 1 × 5000g (£0.004/g)`. Base-unit aware (ml/g/each), shows L/kg for large quantities.

## Types (`src/lib/pouriq/types.ts`)
Replace on `IngredientLibraryRow`: remove `bottle_size_ml`, `bottle_cost_p`, `unit_cost_p`; add `base_unit: 'ml' | 'g' | 'each'`, `pack_size: number`, `price_p: number`, `pack_format: string | null`, `subcategory: string | null`. Keep `purchase_qty` (packs), `yield_pct`, `ingredient_type` (category). **Removing the three legacy fields makes `tsc` flag every reader** — that is the safe-refactor mechanism; work through all of them.

## Read/write sites to update (tsc-driven; ~39 files reference the old fields, but most just carry the row)
- **Cost maths (the real logic):** `calculations.ts`, `variance.ts`/`variance-rolling-loader.ts` (theoretical uses base unit; `applyYield` unchanged), `stock.ts`/`stock-loader.ts` (3a — `computeOnHandBottles` becomes `computeOnHandPacks`: `usage_in_base ÷ pack_size = packs`; "bottles" wording → "packs/units"), `cost-impact.ts`/`cost-impact-loader.ts`/`multi-cost-impact.ts`.
- **Row mapping / queries:** `menus.ts`, `ingredient-library.ts`, `ingredient-catalogue.ts`, `barcode-catalogue.ts`, `by-barcode` route.
- **Forms (write):** `IngredientForm.tsx`, `IngredientMatchRow.tsx`, `IngredientPicker.tsx` inline-create, `ServeForm.tsx`/`PortionHelper.tsx` (recipe-side, mostly unaffected since recipe lines unchanged).
- **Import / invoice (write library entries):** `ImportPreview.tsx`, `import/commit` route, `InvoiceLineRow.tsx`/`InvoicePreview.tsx`/`invoices.ts`/`invoice-match.ts`/`invoices/commit` route, `measurement-parse.ts`/`measurement` parsing → map to base_unit + pack_size.
- **Display:** `SpecCard.tsx`, `IngredientList.tsx`, `menu-copy.ts`, `CostImpactPanel.tsx`, `StockManager.tsx` (packs wording).
- **3a invoice receipt booking:** `receiptBottlesFromInvoiceLine` → packs from invoice line (`extracted_quantity × packs`), terminology "packs".

## Form redesign (the manager-facing change)
Rename "Pricing mode" → **"How do you buy this?"** with three cards (Prepared recipe deferred to Slice 3):
- **Liquid / volume** (base `ml`) · **Weight** (base `g`) · **Count / each** (base `each`).
Fields after selection: **Price paid** (`price_p`), **Packs bought** (`purchase_qty`), **Quantity per pack** (`pack_size`) + unit shown from base_unit, **Pack format** (dropdown label), **Category** + **Subcategory**, **Yield %** under an "Advanced costing" disclosure (default 100). **Live readout**: cost per base unit + cost per common serve (25ml/50ml for ml; per item for each; per 100g for g).
**Tooltips/helper text on every field** (persistent captions, tablet-friendly):
- Pack size: "the amount in ONE pack — 700 for a 700ml bottle, 24 for a case of 24, 5000 for a 5kg bag."
- Packs bought: "how many packs this price covers — 1 bottle, 24 for a case, leave 1 for a single item."
- Pack format: "what it physically arrives as. Backend still costs on the measured quantity."
- Yield: "usable proportion — 100 for spirits, ~75 for citrus juice, lower for kegs with line loss."
Reuse `BOTTLE_SIZES_ML` presets for ml; add gram presets (e.g. 500/1000/2500/5000) and free entry.

## Out of scope (later slices / separate)
- **Recipe units** (wedge/wheel/dash/bean, count→weight conversion) — Slice 2. **Coffee-bean garnish is the canonical Slice 2 test** (bean ≈ 0.2g on a Weight ingredient). Slice-1 interim for such garnishes: a Count ingredient where one item = a garnish portion (serves-per-pack estimate).
- **Prepared / in-house recipes** (simple syrup, batches) — Slice 3.
- Weight ingredients in cocktail recipe lines (needs Slice 2/3).
- The dashboard / nav UI redesign ([[pouriq-ui-redesign-vision]]).

## Tests
- `costPerBaseUnitP` / `usableCostPerBaseUnitP` (ml, g, each; packs>1; yield).
- `ingredientCostPence` byte-identical to today for migrated bottle/unit data (regression).
- `formatPurchaseBasis` for ml/g/each.
- Migration: a fixture of bottle + unit rows migrates to the right base_unit/pack_size/price_p; costs unchanged.
- stock `computeOnHandPacks` (renamed) unchanged behaviour for ml-base; correct for g/each.

## Success criteria
- A manager can record a bottle, a case, a keg, a 10L BIB, a 5kg bag, and 40 lemons through one consistent form, see the cost-per-base-unit live, and know what each field means without training.
- Every existing ingredient migrates with identical cost/GP; all cocktails, variance, stock, invoices keep working.
- Weight is a first-class purchasable/stockable type (ready for prepared recipes in Slice 3).
- No legacy `bottle_*`/`unit_cost_p` references remain (tsc-clean against the new type).
