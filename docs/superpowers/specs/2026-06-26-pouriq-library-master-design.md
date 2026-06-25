# Pour IQ — Ingredient library master list (redesign slice 7)

**Date:** 2026-06-26
**Status:** Design approved (visual companion). Builds on the library page + the par/reorder stock engine (#810).
**Origin:** [[pouriq-ui-redesign-vision]] — "Ingredients (master list, invoice-derived prices, supplier history, pack sizes, substitutions, low-stock)." Turn today's flat card grid into a searchable, filterable master list that surfaces low stock.

**Depends on:** existing library data + `loadStockLevels` (#810). Build branch `feat/pouriq-library-master` off `main`. **No migration, no new data.**

## Locked design (Dan)
- **Responsive: a dense table on desktop, the card grid on mobile.** Both render the same filtered set.
- **Search** (by name) + **category filter** chips (All + each ingredient type present + a **Low stock** filter).
- **Low stock surfaced here**, pulled from the par/reorder signal set on the Stock page (existing data — no new tables).
- **Keep:** the cost basis (`formatPurchaseBasis`), usage count, and the bulk-delete checkbox on unused ingredients.
- **Defer (new data):** per-ingredient supplier price history and substitutions.

## Data
- The library **page** (`src/app/trade/pouriq/library/page.tsx`) additionally loads `loadStockLevels(db, tradeAccountId)` and builds `stockById: Record<string, { needs_reorder: boolean; reorder_qty: number; on_hand_bottles: number | null }>` keyed by `library_ingredient_id`. Passes it to `IngredientList`. (Only ml-priced ingredients appear in the stock loader; others get no stock entry → shown as "—".)

## Pure filter (`src/lib/pouriq/ingredient-filter.ts`, new + unit-tested)
```ts
import type { IngredientLibraryRow } from './types'
export function filterIngredients(
  entries: IngredientLibraryRow[],
  opts: { search: string; category: string }, // category: 'all' | <ingredient_type> | 'low-stock'
  lowStockIds: ReadonlySet<string>,
): IngredientLibraryRow[] {
  const q = opts.search.trim().toLowerCase()
  return entries.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q)) return false
    if (opts.category === 'all') return true
    if (opts.category === 'low-stock') return lowStockIds.has(e.id)
    return e.ingredient_type === opts.category
  })
}
```

## `IngredientList` rework (client)
- New prop `stockById` (as above). Derive `lowStockIds = new Set(ids where stockById[id]?.needs_reorder)`.
- State: `search` (string), `category` (string, default `'all'`). `const visible = filterIngredients(entries, { search, category }, lowStockIds)`.
- **Toolbar:** a search `<input>` + category chips. Chips = `All`, then the distinct `ingredient_type`s present (sorted), then `Low stock` (shown only when at least one low-stock ingredient exists). Active chip highlighted.
- **Desktop table** (`hidden lg:block`): columns — select (checkbox on unused only) · **Ingredient** (a `Link` to `/trade/pouriq/library/${id}/edit`) · **Type** · **Purchase & cost** (`formatPurchaseBasis`) · **Used in** (count) · **Stock**. Stock cell: `needs_reorder` → amber `Low · order {reorder_qty}`; else `on_hand_bottles != null` → `{toFixed(1)} left`; else `—`.
- **Mobile cards** (`lg:hidden`): the existing card markup, over `visible`, with a small low-stock badge when `needs_reorder`.
- **Bulk-delete** unchanged (selected set + `bulkDeleteLibraryEntriesAction`, checkbox on unused), operating across `visible`.
- Empty states: no ingredients at all → the existing "No ingredients yet" card; ingredients exist but the filter matches none → "No ingredients match your search/filter."

## Tests
- `filterIngredients`: search narrows by name (case-insensitive); `category` = a type filters to that type; `'low-stock'` filters to `lowStockIds`; `'all'` returns everything; combined search + category.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope (later)
- Supplier price history (per-ingredient cost-over-time) and substitutions — both need new data wiring.
- Sorting controls (default order is preserved; alphabetical-everywhere is handled elsewhere).
- Editing stock/par from the library (that lives on the Stock page; the library only surfaces the flag).

## Success criteria
- The library page shows a searchable, category-filterable master list (table on desktop, cards on mobile) with a low-stock indicator drawn from par/reorder; bulk-delete and the cost basis still work; no data/engine changes.
