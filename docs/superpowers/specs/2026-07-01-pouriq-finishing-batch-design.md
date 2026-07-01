# Pour IQ — Finishing Batch (completeness checklist + Price Changes + invoice inbox)

Date: 2026-07-01
Status: Design agreed; ready for implementation plan.

Three small, independent "finish the job" pieces. No migration, no new dependencies. One branch, one PR (three commits). Xero is deliberately NOT here (Dan chose the live API integration, which is its own project — see `project_pouriq_xero_integration`).

---

## Piece 1 — Ingredient completeness checklist

Extends cost confidence. Confidence says *how a price was sourced*; completeness says *whether the cost basis is even fillable* — you can't cost a pour without a price, a pack size, and a purchase quantity.

- **Pure helper** `ingredientCompleteness(row)` in `src/lib/pouriq/cost-confidence.ts` (co-located with the confidence helpers) → `{ complete: boolean; missing: string[] }`. Missing labels (human): `'price'` when `price_p <= 0`; `'pack size'` when `pack_size <= 0`; `'purchase quantity'` when `purchase_qty <= 0`. (Yield defaults to 100% so it is NOT required — matches `usableCostPerBaseUnitP`.) Prepared/sub-recipe ingredients (`is_prepared`) derive cost from components, so treat them as complete when they have a `price_p > 0` (skip pack/qty checks). Unit-tested.
- **Surface:**
  - Ingredient form (`IngredientForm`, editing an existing entry): a small checklist under the price fields — one line per requirement with a ✓ (met) or a muted "needed" (missing).
  - Ingredient list (`IngredientList`): where an entry is incomplete, a small amber "incomplete" chip beside the cost-confidence badge.
  - Menu-level: reuse the existing attention surface — in `getAttentionRows` add a row when the menu has ingredients that are incomplete (count unique), e.g. "N ingredients are missing cost details." Placed near the estimated-costs nudge.
- No migration.

---

## Piece 2 — Price Changes view

A named, read-only page listing recent supplier cost changes (validates the "we already have the data" story — `pouriq_cost_changes` is written on every invoice/manual price change).

- **Data fn** `listCostChanges(db, tradeAccountId, limit = 100)` in `src/lib/pouriq/invoices.ts` (or a small `cost-changes.ts`): `SELECT` from `pouriq_cost_changes cc JOIN pouriq_ingredients_library l ON l.id = cc.library_ingredient_id AND l.trade_account_id = ?1 LEFT JOIN pouriq_invoices i ON i.id = cc.invoice_id ORDER BY cc.changed_at DESC LIMIT ?2`. Returns `{ id, ingredient_name, old_cost_p, new_cost_p, source, supplier_name, changed_at }[]`. Tenant-scoped via the ingredient join.
- **Pure helper** `pctChange(oldP, newP)` → `number | null` (null when old is null/0) for the display, unit-tested.
- **Page** `src/app/trade/pouriq/price-changes/page.tsx` (server component, force-dynamic, `checkPourIqAccess` + `LicenceGate`): a table — Date, Ingredient, Old → New, Change (coloured: red up / emerald down), Source (manual/invoice), Supplier. Empty state when none. A link to it from the invoices page header (and/or library).
- No migration.

---

## Piece 3 — Invoice status inbox

Pour IQ invoices exist only after commit, so there is no async pipeline. The meaningful split is whether every line was applied.

- **Pure helper** `invoiceStatus(inv: { applied_line_count: number; line_count: number })` → `'applied' | 'attention'` (`attention` when `applied_line_count < line_count`), unit-tested.
- **Client wrapper** `src/components/pouriq/InvoiceListTabs.tsx` (`'use client'`): takes the already-loaded invoices, renders tabs **All / Fully applied / Needs attention** with counts, filters the rendered rows by `invoiceStatus`, and shows a small per-row status chip (emerald "applied" / amber "needs attention"). The invoice list page (`invoices/page.tsx`) moves its table into this wrapper (keeps the server-side data load + the header/"Scan an invoice" button).
- No migration.

---

## Scope

- **IN:** the three pieces above (pure helpers + the surfaces), all migration-free and dependency-free.
- **OUT:** Xero (separate project); per-ingredient completeness *scoring* beyond present/missing; invoice re-processing/status transitions (invoices are immutable post-commit); pagination on Price Changes beyond a simple `LIMIT`.

## Testing

- **Unit (pure):** `ingredientCompleteness` (each missing field + complete + prepared case); `pctChange` (up, down, null-old, zero-old); `invoiceStatus` (applied vs attention, and applied==line_count boundary).
- **Reasoned:** the Price Changes page query (tenant scope via the ingredient join), the attention row, the tab filtering — verified by tsc + build.
- No jsdom component tests. Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; no new npm dependencies; no migration.

## Risks / notes

- `listCostChanges` must scope by the ingredient's `trade_account_id` (cost_changes has no direct tenant column) — the JOIN condition, not a WHERE afterthought.
- The invoice list page becomes partly client (the tabs) — keep the data fetch + auth on the server; pass plain data into the client wrapper.
- Completeness vs confidence are distinct and both surface on the ingredient — keep the badges compact so they don't crowd (confidence badge + optional incomplete chip).
