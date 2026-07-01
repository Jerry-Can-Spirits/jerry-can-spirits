# Pour IQ Finishing Batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three small finishing pieces — ingredient completeness checklist, Price Changes view, invoice inbox tabs.

**Architecture:** Pure helpers (completeness, pctChange, invoiceStatus) + thin surfaces over existing data. No migration, no new dependencies.

**Tech Stack:** Next.js 15 App Router (RSC + a client wrapper), Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-01-pouriq-finishing-batch-design.md`
**Branch:** `feat/pouriq-finishing-batch` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes in user copy. Pure helpers: no server imports.

**Verified facts:**
- `pouriq_cost_changes`: `id, library_ingredient_id, pricing_mode, old_cost_p, new_cost_p, source ('manual'|'invoice'), invoice_id, invoice_line_id, changed_at`.
- `InvoiceRow` (`invoices.ts`): `id, trade_account_id, supplier_name, invoice_number, invoice_date, net_total_p, line_count, applied_line_count, r2_key, created_at`. `listInvoicesForTenant` (`invoices.ts:141`).
- `getAttentionRows` (`attention.ts`) already builds an `estimated-costs` row from `cocktails[].ingredients[].library` — mirror it for incomplete ingredients. `IngredientLibraryRow` has `price_p, pack_size, purchase_qty, yield_pct, is_prepared, cost_confidence`.
- Cost-confidence helpers live in `src/lib/pouriq/cost-confidence.ts`.

---

## Task 1: Pure helpers + tests

**Files:** Modify `src/lib/pouriq/cost-confidence.ts`; create `src/lib/pouriq/cost-changes.ts` (pctChange) and `src/lib/pouriq/invoice-status.ts` (invoiceStatus); create the test files.

- [ ] **Step 1: Failing tests**

`tests/unit/lib/pouriq-completeness.test.ts`:
```ts
import { ingredientCompleteness } from '@/lib/pouriq/cost-confidence'
const base = { price_p: 500, pack_size: 700, purchase_qty: 1, is_prepared: 0 } as Parameters<typeof ingredientCompleteness>[0]
it('complete when price, pack, qty present', () => {
  expect(ingredientCompleteness(base)).toEqual({ complete: true, missing: [] })
})
it('lists each missing field', () => {
  expect(ingredientCompleteness({ ...base, price_p: 0 }).missing).toContain('price')
  expect(ingredientCompleteness({ ...base, pack_size: 0 }).missing).toContain('pack size')
  expect(ingredientCompleteness({ ...base, purchase_qty: 0 }).missing).toContain('purchase quantity')
})
it('prepared ingredient needs only a price', () => {
  expect(ingredientCompleteness({ price_p: 300, pack_size: 0, purchase_qty: 0, is_prepared: 1 } as Parameters<typeof ingredientCompleteness>[0])).toEqual({ complete: true, missing: [] })
})
```
`tests/unit/lib/pouriq-cost-changes.test.ts`:
```ts
import { pctChange } from '@/lib/pouriq/cost-changes'
it('computes percentage', () => {
  expect(pctChange(100, 150)).toBe(50)
  expect(pctChange(200, 100)).toBe(-50)
})
it('null when old missing or zero', () => {
  expect(pctChange(null, 100)).toBeNull()
  expect(pctChange(0, 100)).toBeNull()
})
```
`tests/unit/lib/pouriq-invoice-status.test.ts`:
```ts
import { invoiceStatus } from '@/lib/pouriq/invoice-status'
it('applied when all lines applied', () => {
  expect(invoiceStatus({ applied_line_count: 5, line_count: 5 })).toBe('applied')
})
it('attention when some lines unapplied', () => {
  expect(invoiceStatus({ applied_line_count: 3, line_count: 5 })).toBe('attention')
})
```

- [ ] **Step 2: Run red**

`npx vitest run tests/unit/lib/pouriq-completeness.test.ts tests/unit/lib/pouriq-cost-changes.test.ts tests/unit/lib/pouriq-invoice-status.test.ts` → FAIL.

- [ ] **Step 3: Implement**

In `cost-confidence.ts`:
```ts
export function ingredientCompleteness(
  row: { price_p: number; pack_size: number; purchase_qty: number; is_prepared: number },
): { complete: boolean; missing: string[] } {
  const missing: string[] = []
  if (row.price_p <= 0) missing.push('price')
  if (!row.is_prepared) {
    if (row.pack_size <= 0) missing.push('pack size')
    if (row.purchase_qty <= 0) missing.push('purchase quantity')
  }
  return { complete: missing.length === 0, missing }
}
```
`cost-changes.ts`:
```ts
export function pctChange(oldP: number | null, newP: number): number | null {
  if (oldP === null || oldP === 0) return null
  return Math.round(((newP - oldP) / oldP) * 100)
}
```
`invoice-status.ts`:
```ts
export function invoiceStatus(inv: { applied_line_count: number; line_count: number }): 'applied' | 'attention' {
  return inv.applied_line_count < inv.line_count ? 'attention' : 'applied'
}
```

- [ ] **Step 4: Green + commit**

`npm run test:unit`.
```bash
git add src/lib/pouriq/cost-confidence.ts src/lib/pouriq/cost-changes.ts src/lib/pouriq/invoice-status.ts tests/unit
git commit -m "feat(pouriq): completeness + pctChange + invoiceStatus pure helpers"
```

---

## Task 2: Completeness surfaces

**Files:** Modify `src/components/pouriq/IngredientForm.tsx`, `src/components/pouriq/IngredientList.tsx`, `src/lib/pouriq/attention.ts`.

- [ ] **Step 1: Form checklist**

In `IngredientForm` (editing an existing `entry`), compute `ingredientCompleteness(entry)` and render a small checklist under the price/pack fields: for each of price / pack size / purchase quantity, a ✓ when present or a muted "needed" when in `missing`. (Skip pack/qty rows when `entry.is_prepared`.) Presentational.

- [ ] **Step 2: List chip**

In `IngredientList`, for each entry compute `ingredientCompleteness(entry)`; when `!complete`, render a small amber chip "incomplete" beside the existing cost-confidence badge (desktop + mobile). Keep it compact.

- [ ] **Step 3: Attention nudge**

In `getAttentionRows` (`attention.ts`), mirror the `estimated-costs` block: compute `incompleteIngCount` = unique `library_ingredient_id` across `cocktails[].ingredients` where `ingredientCompleteness(i.library)` is not complete; when `> 0`, push a row `{ key: 'incomplete-ingredients', label: `${n} ingredient(s) ${is/are} missing cost details.`, href: '/trade/pouriq/library', severity: 'medium' }`. Place it just after the estimated-costs row. Correct singular/plural, no em-dash. Update `tests/unit/lib/pouriq-attention.test.ts` if the row set it asserts changes.

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/IngredientForm.tsx src/components/pouriq/IngredientList.tsx src/lib/pouriq/attention.ts tests/unit
git commit -m "feat(pouriq): surface ingredient completeness (form + list + attention)"
```

---

## Task 3: Price Changes view

**Files:** Modify `src/lib/pouriq/invoices.ts` (add `listCostChanges` + a row type); create `src/app/trade/pouriq/price-changes/page.tsx`; add a link on `src/app/trade/pouriq/invoices/page.tsx`.

- [ ] **Step 1: Data fn**

In `invoices.ts`:
```ts
export interface CostChangeRow {
  id: string
  ingredient_name: string
  old_cost_p: number | null
  new_cost_p: number
  source: 'manual' | 'invoice'
  supplier_name: string | null
  changed_at: string
}
export async function listCostChanges(db: D1Database, tradeAccountId: string, limit = 100): Promise<CostChangeRow[]> {
  const { results } = await db
    .prepare(`SELECT cc.id, l.name AS ingredient_name, cc.old_cost_p, cc.new_cost_p, cc.source,
                     i.supplier_name, cc.changed_at
              FROM pouriq_cost_changes cc
              JOIN pouriq_ingredients_library l ON l.id = cc.library_ingredient_id AND l.trade_account_id = ?1
              LEFT JOIN pouriq_invoices i ON i.id = cc.invoice_id
              ORDER BY cc.changed_at DESC LIMIT ?2`)
    .bind(tradeAccountId, limit)
    .all<CostChangeRow>()
  return results ?? []
}
```

- [ ] **Step 2: Page**

`src/app/trade/pouriq/price-changes/page.tsx` — server component, `export const dynamic = 'force-dynamic'`, `checkPourIqAccess` (redirect no-session, `LicenceGate` no-licence), load `listCostChanges`. Render a table: Date (`changed_at.slice(0,10)`), Ingredient, Old → New (`£`), Change (`pctChange`; red when > 0, emerald when < 0, muted when null), Source, Supplier (`?? '—'`). Empty state "No price changes yet." Match the invoices page layout (`max-w-4xl`, slate theme). No em-dashes in copy.

- [ ] **Step 3: Link**

On `invoices/page.tsx`, add a header link "Price changes" → `/trade/pouriq/price-changes` near the "Scan an invoice" button.

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit`, `npx eslint src tests`, `npm run build`.
```bash
git add src/lib/pouriq/invoices.ts "src/app/trade/pouriq/price-changes/page.tsx" "src/app/trade/pouriq/invoices/page.tsx"
git commit -m "feat(pouriq): Price Changes view over cost_change history"
```

---

## Task 4: Invoice inbox tabs

**Files:** Create `src/components/pouriq/InvoiceListTabs.tsx`; modify `src/app/trade/pouriq/invoices/page.tsx`.

- [ ] **Step 1: Client wrapper**

`InvoiceListTabs.tsx` (`'use client'`): props `{ invoices: InvoiceRow[]; priceHref?: string }` (or the minimal fields the table needs). Local `tab` state `'all' | 'applied' | 'attention'`. Compute counts via `invoiceStatus`. Render three tab buttons with counts, then the existing invoice table filtered to the active tab, each row with a small status chip (emerald "applied" / amber "needs attention"). Move the current table markup from the page into here. Keep the row link to `/trade/pouriq/invoices/${id}`.

- [ ] **Step 2: Wire the page**

`invoices/page.tsx` keeps the server auth + `listInvoicesForTenant`, and renders `<InvoiceListTabs invoices={invoices} />` instead of the inline table (header + "Scan an invoice" stay on the server page). Empty state stays.

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/components/pouriq/InvoiceListTabs.tsx "src/app/trade/pouriq/invoices/page.tsx"
git commit -m "feat(pouriq): invoice inbox tabs (all / applied / needs attention)"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged; no migration.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: the three pieces, no migration, no deps.
