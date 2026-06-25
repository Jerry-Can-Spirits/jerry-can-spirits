# Pour IQ Par + Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A par level per ml ingredient, a low-stock flag + suggested reorder quantity on the stock page, and a printable order report.

**Architecture:** Additive `par_bottles` column on the library; pure `reorderQty` helper; the stock loader surfaces `par_bottles`/`needs_reorder`/`reorder_qty`; `setParAction` persists par; `StockManager` gets a par control + low-stock flag; a new printable `/trade/pouriq/stock/order` page.

**Tech Stack:** Next.js 15, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-par-reorder-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`. Apply migration `0049` to prod after merge.

---

### Task 1: Migration `0049` + `reorderQty` helper

**Files:** `migrations/0049_ingredient_par.sql`; `src/lib/pouriq/stock.ts`; `tests/unit/lib/pouriq-par-migration.test.ts`; `tests/unit/lib/` reorder test (extend the stock test if one exists, else create `pouriq-reorder.test.ts`).

- [ ] **Step 1:** Write `migrations/0049_ingredient_par.sql`:
```sql
-- Par level (in bottles/packs) per ml ingredient, for low-stock + reorder.
-- Nullable: NULL = no par set / not tracked for reorder. Additive.
ALTER TABLE pouriq_ingredients_library ADD COLUMN par_bottles REAL;
```
- [ ] **Step 2:** Migration test (in-memory): create a minimal `pouriq_ingredients_library (id TEXT PRIMARY KEY)`, apply the migration, assert `par_bottles` is in `pragma_table_info`.
- [ ] **Step 3:** Add `reorderQty` to `src/lib/pouriq/stock.ts`:
```ts
// Whole bottles to order to reach par. 0 when at/above par, on-hand unknown,
// or no par set. Raw on-hand (a negative on-hand orders more).
export function reorderQty(onHandBottles: number | null, parBottles: number | null): number {
  if (onHandBottles === null || parBottles === null) return 0
  return Math.max(0, Math.ceil(parBottles - onHandBottles))
}
```
- [ ] **Step 4:** Test `reorderQty`: `(2.3, 6) → 4`; `(6, 6) → 0`; `(7, 6) → 0`; `(null, 6) → 0`; `(2, null) → 0`; `(-1, 6) → 7`.
- [ ] **Step 5:** Run `npm run test:unit -- pouriq-par-migration pouriq-reorder` (PASS). **Commit** `feat(pouriq): par_bottles column + reorderQty helper (migration 0049)`.

---

### Task 2: Loader + set-par action

**Files:** `src/lib/pouriq/stock-loader.ts`; `src/lib/pouriq/server-actions.ts`.

- [ ] **Step 1:** In `stock-loader.ts`: add `par_bottles` to the `readTenantLibrary` SELECT and to `LibraryMetaRow`/`LibraryMetaDbRow`. Import `reorderQty` from `./stock`. Add `par_bottles: number | null`, `needs_reorder: boolean`, `reorder_qty: number` to `RollingStockRow`.
- [ ] **Step 2:** In both row-push branches (anchor and no-anchor), set `par_bottles: meta.par_bottles`, `reorder_qty: reorderQty(on_hand, meta.par_bottles)` (use the computed on-hand; in the no-anchor branch on-hand is null so reorder_qty is 0), `needs_reorder: reorder_qty > 0`.
- [ ] **Step 3:** In `server-actions.ts`, add `setParAction`. Mirror the existing `recordStockCountAction` (read it for the tenant-guard + revalidate pattern). Signature `setParAction(libraryId: string, parBottles: number | null)`: reject when `parBottles` is a number that is negative or non-finite; accept `null` (clear). `UPDATE pouriq_ingredients_library SET par_bottles = ?1, updated_at = datetime('now') WHERE id = ?2 AND trade_account_id = ?3`. `revalidatePath('/trade/pouriq/stock')` and `revalidatePath('/trade/pouriq/stock/order')`.
- [ ] **Step 4:** Run `npm run test:unit` + `npx tsc --noEmit`. **Commit** `feat(pouriq): surface par/reorder in the stock loader + setParAction`.

---

### Task 3: Stock page par control + low-stock flag

**Files:** `src/components/pouriq/StockManager.tsx`.

- [ ] **Step 1:** Import `setParAction`. Add a `parInputs` state map (like `countInputs`) and a `handleSetPar(id)` (mirror `handleCount`: parse float; allow empty string → `null` to clear; call `setParAction(id, value)`; refresh).
- [ ] **Step 2:** Render a **Par** control per row (number input pre-filled from `row.par_bottles ?? ''`, placeholder "bottles", + a Save button), in the controls row alongside receive/count.
- [ ] **Step 3:** When `row.needs_reorder`, add an amber indicator on the on-hand block: `Low — order {row.reorder_qty} {row.reorder_qty === 1 ? 'bottle' : 'bottles'}`.
- [ ] **Step 4:** Add a link to the order report near the top of the component (e.g. a right-aligned `Order report →` linking `/trade/pouriq/stock/order`).
- [ ] **Step 5:** Run `npm run test:unit` + `npx tsc --noEmit`. **Commit** `feat(pouriq): par control + low-stock flag on the stock page`.

---

### Task 4: Printable order report page

**Files:** `src/app/trade/pouriq/stock/order/page.tsx`; a small client print component `src/components/pouriq/OrderReport.tsx`. First read `src/components/pouriq/MenuBuilder.tsx` for the established `.print-region` / `.no-print` / `window.print()` pattern and reuse it.

- [ ] **Step 1:** `order/page.tsx` (server, `force-dynamic`): same access/licence guard as `stock/page.tsx`; `loadStockLevels`; pass `rows.filter(r => r.needs_reorder).sort((a,b) => a.library_name.localeCompare(b.library_name))` to `OrderReport`.
- [ ] **Step 2:** `OrderReport.tsx` (client): a back link + Print button (`.no-print`), then a `.print-region` table — Ingredient, On hand (bottles, 1dp), Par, **Order (bottles)**. Empty state "Nothing to order — everything is at or above par." Use `window.print()`.
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`. **Commit** `feat(pouriq): printable order report`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: par + reorder + printable order report on the 3a engine; apply migration `0049` after merge; ml-only; on-hand/costing/variance unchanged; velocity-suggested par is the next fast-follow.
