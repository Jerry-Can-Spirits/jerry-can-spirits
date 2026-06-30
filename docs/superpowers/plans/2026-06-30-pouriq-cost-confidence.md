# Pour IQ Ingredient Cost Confidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every ingredient a `cost_confidence` (estimated / set / confirmed) reflecting how its current price was sourced, surfaced as a badge, a per-menu "unconfirmed costs" count, and an attention nudge.

**Architecture:** A `cost_confidence` column on `pouriq_ingredients_library`, written by each price-writing action (import stub → estimated, catalogue/manual → set, invoice → confirmed), with pure helpers for the badge + the per-menu rollup. No new dependencies.

**Tech Stack:** Next.js 15 App Router (server actions), TypeScript, Cloudflare D1, Vitest.

**Spec:** `docs/superpowers/specs/2026-06-30-pouriq-cost-confidence-design.md`
**Branch:** `feat/pouriq-cost-confidence` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes in user copy. Pure helpers must not import server-only/D1.

**Verified set-points:**
- Manual create/edit → `saveLibraryEntryAction` (`server-actions.ts:327`) → the INSERT/UPDATE in `src/lib/pouriq/ingredient-library.ts` (INSERT ~line 96).
- Menu-import stub → `src/app/api/pouriq/import/commit/route.ts:158` (INSERT INTO pouriq_ingredients_library).
- Invoice apply → `src/app/api/pouriq/invoices/commit/route.ts:243` (UPDATE ... SET price_p ...).
- Prepared recompute → `src/lib/pouriq/prepared.ts:110` (UPDATE price_p).
- Attention → `deriveMenuAttention` in `src/lib/pouriq/attention.ts`.

---

## File Structure

- `src/lib/pouriq/types.ts` — MODIFY: `CostConfidence` union; `cost_confidence: CostConfidence` on `IngredientLibraryRow`.
- `src/lib/pouriq/cost-confidence.ts` — CREATE: pure `costConfidenceBadge` + `menuCostConfidence`.
- `tests/unit/lib/pouriq-cost-confidence.test.ts` — CREATE.
- `migrations/0059_cost_confidence.sql` — CREATE: add column + backfill.
- `src/lib/pouriq/ingredient-library.ts` + `server-actions.ts` — MODIFY: manual save sets confidence.
- `src/app/api/pouriq/import/commit/route.ts`, `src/app/api/pouriq/invoices/commit/route.ts`, `src/lib/pouriq/prepared.ts` — MODIFY: set confidence at each price-write.
- `src/components/pouriq/IngredientList.tsx`, `src/components/pouriq/IngredientForm.tsx` — MODIFY: badge.
- `src/lib/pouriq/attention.ts` + the menu detail page (`src/app/trade/pouriq/[menuId]/page.tsx`) — MODIFY: attention nudge + menu count.

---

## Task 1: Types + pure helpers

**Files:**
- Modify: `src/lib/pouriq/types.ts`
- Create: `src/lib/pouriq/cost-confidence.ts`, `tests/unit/lib/pouriq-cost-confidence.test.ts`

- [ ] **Step 1: Types**

In `types.ts`:
```ts
export const COST_CONFIDENCE = ['estimated', 'set', 'confirmed'] as const
export type CostConfidence = typeof COST_CONFIDENCE[number]
```
Add `cost_confidence: CostConfidence` to `IngredientLibraryRow`.

- [ ] **Step 2: Failing test**

`tests/unit/lib/pouriq-cost-confidence.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { costConfidenceBadge, menuCostConfidence } from '@/lib/pouriq/cost-confidence'

describe('costConfidenceBadge', () => {
  it('maps each value to a label', () => {
    expect(costConfidenceBadge('estimated').label).toBe('Estimated')
    expect(costConfidenceBadge('set').label).toBe('Set')
    expect(costConfidenceBadge('confirmed').label).toBe('Confirmed')
  })
})

describe('menuCostConfidence', () => {
  const drink = (confidences: string[]) => ({ ingredients: confidences.map((c) => ({ library: { cost_confidence: c } })) })
  it('all confirmed -> 0 unconfirmed, 0 estimated', () => {
    expect(menuCostConfidence([drink(['confirmed', 'confirmed'])] as any)).toEqual({ unconfirmed_drinks: 0, estimated_drinks: 0 })
  })
  it('one set ingredient -> unconfirmed only', () => {
    expect(menuCostConfidence([drink(['confirmed', 'set'])] as any)).toEqual({ unconfirmed_drinks: 1, estimated_drinks: 0 })
  })
  it('one estimated ingredient -> unconfirmed + estimated', () => {
    expect(menuCostConfidence([drink(['estimated'])] as any)).toEqual({ unconfirmed_drinks: 1, estimated_drinks: 1 })
  })
  it('empty menu -> 0', () => {
    expect(menuCostConfidence([])).toEqual({ unconfirmed_drinks: 0, estimated_drinks: 0 })
  })
})
```

- [ ] **Step 3: Run, verify fail**

Run: `npx vitest run tests/unit/lib/pouriq-cost-confidence.test.ts` → FAIL (module missing).

- [ ] **Step 4: Implement `cost-confidence.ts`**

```ts
import type { CostConfidence } from './types'

export function costConfidenceBadge(c: CostConfidence): { label: string; className: string } {
  switch (c) {
    case 'confirmed': return { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border border-emerald-600' }
    case 'set': return { label: 'Set', className: 'bg-slate-100 text-slate-600 border border-slate-300' }
    default: return { label: 'Estimated', className: 'bg-amber-50 text-amber-700 border border-amber-500' }
  }
}

// A drink is "unconfirmed" if any ingredient is not confirmed; "estimated" if any is estimated.
export function menuCostConfidence(
  cocktails: { ingredients: { library: { cost_confidence: CostConfidence } }[] }[],
): { unconfirmed_drinks: number; estimated_drinks: number } {
  let unconfirmed_drinks = 0
  let estimated_drinks = 0
  for (const c of cocktails) {
    if (c.ingredients.length === 0) continue
    if (c.ingredients.some((i) => i.library.cost_confidence !== 'confirmed')) unconfirmed_drinks++
    if (c.ingredients.some((i) => i.library.cost_confidence === 'estimated')) estimated_drinks++
  }
  return { unconfirmed_drinks, estimated_drinks }
}
```

- [ ] **Step 5: Fix `IngredientLibraryRow` test fixtures**

`cost_confidence` is now required. Run `npx tsc --noEmit`; for every test fixture that builds an `IngredientLibraryRow` literal, add `cost_confidence: 'set'`. (Grep `cost_confidence` after to confirm none missed.)

- [ ] **Step 6: Run + commit**

Run: `npm run test:unit` → PASS; `npx tsc --noEmit` clean.
```bash
git add src/lib/pouriq/types.ts src/lib/pouriq/cost-confidence.ts tests/unit
git commit -m "feat(pouriq): CostConfidence type + badge/menu-rollup helpers"
```

---

## Task 2: Migration 0059

**Files:** Create: `migrations/0059_cost_confidence.sql`

- [ ] **Step 1: Confirm 0059 is next** (`ls migrations/ | sort | tail -2` — latest is `0058_menu_sections.sql`).

- [ ] **Step 2: Write the migration**

```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN cost_confidence TEXT NOT NULL DEFAULT 'estimated';
UPDATE pouriq_ingredients_library SET cost_confidence = CASE WHEN price_p > 0 THEN 'set' ELSE 'estimated' END;
```

- [ ] **Step 3: Validate (node:sqlite scratch, not committed)**

Create `pouriq_ingredients_library` with `price_p`; insert a priced row + a price-0 row; apply the migration; assert the priced row → `'set'`, the price-0 row → `'estimated'`, column exists. Print PASS.

- [ ] **Step 4: Commit (SQL only)**

```bash
git add migrations/0059_cost_confidence.sql
git commit -m "feat(pouriq): migration 0059 - ingredient cost_confidence column + backfill"
```

---

## Task 3: Write confidence at every price-write

**Files:** `ingredient-library.ts`, `import/commit/route.ts`, `invoices/commit/route.ts`, `prepared.ts` (+ confirm `IngredientLibraryRow` reads carry the column).

- [ ] **Step 1: Manual create/edit**

In `src/lib/pouriq/ingredient-library.ts`, the INSERT (~line 96) and any UPDATE that sets `price_p`: add `cost_confidence` to the columns and bind `price_p > 0 ? 'set' : 'estimated'`. (Compute from the entry's `price_p`.) Confirm `saveLibraryEntryAction` flows through here.

- [ ] **Step 2: Menu-import stub**

In `import/commit/route.ts` (~line 158 INSERT INTO pouriq_ingredients_library): add `cost_confidence` to the INSERT, bind `new_library.price_p > 0 ? 'set' : 'estimated'`.

- [ ] **Step 3: Invoice apply**

In `invoices/commit/route.ts` (~line 243 UPDATE ... SET price_p ...): add `, cost_confidence = 'confirmed'` to the SET clause.

- [ ] **Step 4: Prepared recompute**

In `prepared.ts` (~line 110 UPDATE ... SET price_p): add `, cost_confidence = 'set'` (a derived in-house price is deliberate but not invoice-verified).

- [ ] **Step 5: Reads carry the column**

`pouriq_ingredients_library` reads use `SELECT *` (e.g. `listLibraryEntries`, the joins building `IngredientWithLibrary`), so `cost_confidence` flows at runtime once the migration is applied. Confirm no mapper constructs the row field-by-field omitting it (tsc will not catch this — grep the library reads and verify they cast/spread `SELECT *`).

- [ ] **Step 6: Verify + commit**

Run: `npx tsc --noEmit`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/ingredient-library.ts src/app/api/pouriq/import/commit/route.ts src/app/api/pouriq/invoices/commit/route.ts src/lib/pouriq/prepared.ts
git commit -m "feat(pouriq): set cost_confidence at every ingredient price-write"
```

---

## Task 4: Badge on the ingredient list + form

**Files:** `src/components/pouriq/IngredientList.tsx`, `src/components/pouriq/IngredientForm.tsx`

- [ ] **Step 1: List badge**

In `IngredientList`, next to each entry's name (or in its row), render the badge: `const b = costConfidenceBadge(entry.cost_confidence)` → `<span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${b.className}`}>{b.label}</span>`.

- [ ] **Step 2: Form badge**

In `IngredientForm`, when editing an existing entry (`entry`), show the same badge near the price field so the user sees the current confidence. (New entries have none yet.)

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`.
```bash
git add src/components/pouriq/IngredientList.tsx src/components/pouriq/IngredientForm.tsx
git commit -m "feat(pouriq): cost-confidence badge on the ingredient list + form"
```

---

## Task 5: Menu count + attention nudge

**Files:** `src/lib/pouriq/attention.ts`, `src/app/trade/pouriq/[menuId]/page.tsx`

- [ ] **Step 1: Menu count**

On the menu detail page, compute `menuCostConfidence(cocktails)` (the page already loads cocktails-with-ingredients) and, when `unconfirmed_drinks > 0`, render a small caption near the GP summary / table heading: e.g. `{unconfirmed_drinks} drinks use unconfirmed costs` (slate, `no-print` optional). Keep it presentational; the GP numbers are unchanged.

- [ ] **Step 2: Attention nudge**

In `deriveMenuAttention` (`attention.ts`), add an attention row when `estimated_drinks > 0` (or estimated ingredients exist on the menu): "N ingredients have estimated costs — scan an invoice to confirm." Place it in the existing ordered list around the needs-price items (below sync/unmatched). Match the existing `AttentionRow` shape. If `deriveMenuAttention` does not already receive ingredient confidence, thread the per-menu estimated count in from the same data the page computes.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npx eslint src tests` (0 errors), `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/attention.ts "src/app/trade/pouriq/[menuId]/page.tsx"
git commit -m "feat(pouriq): menu unconfirmed-cost count + attention nudge"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: notes the new column, **migration 0059 to apply to prod after merge**, the three set-points + honest "Set" backfill, no npm deps.
