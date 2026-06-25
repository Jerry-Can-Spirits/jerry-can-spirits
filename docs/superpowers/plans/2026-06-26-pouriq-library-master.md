# Pour IQ Ingredient Library Master List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A searchable, category-filterable ingredient master list (table on desktop, cards on mobile) that surfaces low stock from par/reorder.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-library-master-design.md`

**Gates:** `npm run test:unit` + `npx tsc --noEmit`; final `npx opennextjs-cloudflare build`.

---

### Task 1: Pure `filterIngredients`

**Files:** `src/lib/pouriq/ingredient-filter.ts` (new); `tests/unit/lib/pouriq-ingredient-filter.test.ts` (new).

- [ ] **Step 1:** Implement `filterIngredients(entries, { search, category }, lowStockIds)` exactly as in the spec.
- [ ] **Step 2: Tests** (minimal `IngredientLibraryRow`s — fields read: `id`, `name`, `ingredient_type`): `'all'` → all; search narrows by name (case-insensitive); a type category filters to that type; `'low-stock'` filters to the `lowStockIds` set; search + category combined.
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-ingredient-filter` + `npx tsc --noEmit`. **Commit** `feat(pouriq): ingredient library filter`.

---

### Task 2: Library page loads stock

**Files:** `src/app/trade/pouriq/library/page.tsx` (read it first for the existing load + how `IngredientList` is rendered).

- [ ] **Step 1:** Import `loadStockLevels` from `@/lib/pouriq/stock-loader`. Alongside the existing entries/usageCounts load, `const stockRows = await loadStockLevels(db, access.tradeAccountId)` (use `Promise.all` with the existing reads).
- [ ] **Step 2:** Build `const stockById: Record<string, { needs_reorder: boolean; reorder_qty: number; on_hand_bottles: number | null }> = {}`; for each row set `stockById[row.library_ingredient_id] = { needs_reorder: row.needs_reorder, reorder_qty: row.reorder_qty, on_hand_bottles: row.on_hand_bottles }`. Pass `stockById={stockById}` to `<IngredientList />`.
- [ ] **Step 3:** `npx tsc --noEmit` (will error until `IngredientList` accepts the prop — Task 3). **Commit** with Task 3 (or stage and proceed).

---

### Task 3: `IngredientList` rework

**Files:** `src/components/pouriq/IngredientList.tsx`.

- [ ] **Step 1:** Add the `stockById` prop (typed as in the page). Import `filterIngredients`. Derive `const lowStockIds = new Set(entries.filter((e) => stockById[e.id]?.needs_reorder).map((e) => e.id))`.
- [ ] **Step 2:** Add `useState` for `search` ('') and `category` ('all'). `const visible = filterIngredients(entries, { search, category }, lowStockIds)`. Keep the existing `selected`/bulk-delete state + the top-of-component `entries.length === 0` empty state.
- [ ] **Step 3:** Render a **toolbar**: a search input (`value`/`onChange`), then chips — `All`, the distinct `ingredient_type`s present (`[...new Set(entries.map(e => e.ingredient_type))].sort()`), and `Low stock` when `lowStockIds.size > 0`; clicking sets `category`; active chip styled. (Reuse the existing chip styling idiom.)
- [ ] **Step 4:** Add a `stockCell(entry)` helper: `const s = stockById[entry.id]; if (s?.needs_reorder) → amber "Low · order {s.reorder_qty}"; else if (s && s.on_hand_bottles != null) → "{max(0,on_hand).toFixed(1)} left"; else → muted "—"`.
- [ ] **Step 5:** **Desktop table** (`<div className="hidden lg:block ...">`): a `<table>` with the columns from the spec, mapping `visible`. The select checkbox stays on unused rows (`usageCounts.get(id) === 0`); the Ingredient name is a `Link` to `/trade/pouriq/library/${id}/edit`; Type, `formatPurchaseBasis(entry)`, used-in count, and `stockCell(entry)`.
- [ ] **Step 6:** **Mobile cards** (`<div className="lg:hidden grid sm:grid-cols-2 gap-4">`): the existing card markup over `visible`, adding a small amber low-stock badge when `stockById[id]?.needs_reorder`.
- [ ] **Step 7:** When `visible.length === 0` (but `entries.length > 0`), show "No ingredients match your search or filter." in place of the table/cards.
- [ ] **Step 8:** Run `npm run test:unit` + `npx tsc --noEmit`. Reason: search/category narrow both views; low-stock chip + cell read from `stockById`; bulk-delete works on `visible` unused rows. **Commit** `feat(pouriq): searchable ingredient master list with low-stock`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 7 — ingredient master list (search + category + low-stock; table on desktop, cards on mobile); supplier history + substitutions deferred; no migration.
