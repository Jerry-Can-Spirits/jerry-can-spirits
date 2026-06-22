# Trustworthy Numbers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Flag drinks with incomplete cost data (exclude from headline/avg/best/worst, show "cost incomplete" instead of an inflated GP) and make the menu headline the true blended GP (Σmargin·units ÷ Σnet·units) when sales volumes exist, falling back to a labelled average otherwise.

**Architecture:** Pure changes in `calculations.ts` + `types.ts`; presentational changes in `KpiCards.tsx` and `CocktailTable.tsx`. No schema, no migration.

**Spec:** `docs/superpowers/specs/2026-06-17-pouriq-trustworthy-numbers-design.md`
**Branch:** `feat/pouriq-trustworthy-numbers` (off origin/main)

---

### Task 1: Calc layer + types

**Files:** Modify `src/lib/pouriq/types.ts`, `src/lib/pouriq/calculations.ts`

- [ ] **Step 1: Types.** In `CocktailMetrics` add `cost_complete: boolean` and `net_sale_p: number`. In `MenuMetrics` add `blended_gp_pct: number | null`, `headline_gp_pct: number`, `headline_basis: 'blended' | 'average'`, `incomplete_cost_count: number`.

- [ ] **Step 2: `ingredientCostComplete`** in `calculations.ts` (exported, above `calculateCocktailMetrics`):

```ts
import type { /* existing */ IngredientWithLibrary } from './types'

export function ingredientCostComplete(i: IngredientWithLibrary): boolean {
  if (i.library.unit_cost_p !== null) return true
  return i.library.bottle_size_ml !== null
    && i.library.bottle_cost_p !== null
    && i.pour_ml !== null
}
```
(If `IngredientWithLibrary` isn't already imported, add it.)

- [ ] **Step 3: `calculateCocktailMetrics`** — compute and include the two new fields. After `net_sale_p` is computed, and building the `metrics` object:

```ts
const cost_complete = cocktail.ingredients.length > 0
  && cocktail.ingredients.every(ingredientCostComplete)
```
Add `net_sale_p,` and `cost_complete,` to the returned `CocktailMetrics` object literal.

- [ ] **Step 4: `calculateMenuMetrics`** — replace the avg/best/worst section. After `cocktail_metrics` is built:

```ts
const costed = cocktail_metrics.filter((m) => m.cost_complete && m.sale_price_p > 0)
const incomplete_cost_count = cocktail_metrics.filter((m) => !m.cost_complete).length

const avg_gp_pct = costed.length === 0
  ? 0
  : Math.round((costed.reduce((s, m) => s + m.gp_pct, 0) / costed.length) * 10) / 10

// Blended GP: total contribution margin ÷ total net sales across costed
// drinks that actually sold. The P&L-true headline.
let totalMargin = 0
let totalNet = 0
for (const m of costed) {
  if (!m.volume) continue
  totalMargin += m.margin_p * m.volume.units_sold
  totalNet += m.net_sale_p * m.volume.units_sold
}
const blended_gp_pct = totalNet > 0 ? Math.round((totalMargin / totalNet) * 1000) / 10 : null
const headline_gp_pct = blended_gp_pct ?? avg_gp_pct
const headline_basis: 'blended' | 'average' = blended_gp_pct !== null ? 'blended' : 'average'

const sorted = [...costed].sort((a, b) => b.margin_p - a.margin_p)
const best_margin = sorted[0] ?? null
const worst_margin = sorted[sorted.length - 1] ?? null
```
Return the new fields alongside the existing ones (`avg_gp_pct`, `best_margin`, `worst_margin`, `blended_gp_pct`, `headline_gp_pct`, `headline_basis`, `incomplete_cost_count`, plus the unchanged `waste_*`, `cocktail_metrics`, `ingredient_overlap`).

- [ ] **Step 5:** `npx tsc --noEmit` → expect errors only in KpiCards (it reads metrics) if any; fix in Task 2. Calc/types clean.

- [ ] **Step 6: Commit** — `feat(pouriq): cost-complete detection and blended GP in the calc layer`

---

### Task 2: UI — KPI headline + cocktail flags

**Files:** Modify `src/components/pouriq/KpiCards.tsx`, `src/components/pouriq/CocktailTable.tsx`

- [ ] **Step 1: KpiCards headline.** Replace the "Average GP" item with the headline:

```tsx
const gpDelta = metrics.headline_gp_pct - menu.target_gp_pct
const gpLabel = metrics.headline_basis === 'blended' ? 'Blended GP' : 'Average GP'
const gpNote =
  `${gpDelta >= 0 ? '+' : ''}${gpDelta.toFixed(1)} vs target` +
  (metrics.headline_basis === 'average' ? ' · no sales data yet' : '') +
  (metrics.incomplete_cost_count > 0 ? ` · ${metrics.incomplete_cost_count} excluded (cost incomplete)` : '')
```
Use `{ label: gpLabel, value: formatGp(metrics.headline_gp_pct), note: gpNote }` as the first card. Best/worst/waste unchanged.

- [ ] **Step 2: CocktailTable incomplete flag.** In the row body, compute `const incomplete = !m.cost_complete`. Replace the GP cell:

```tsx
<td className={`px-4 py-3 ${incomplete ? 'text-amber-200' : belowTarget ? 'text-red-300' : 'text-parchment-100'}`}>
  {incomplete ? (
    <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${cocktail.id}`} className="text-amber-200 hover:text-amber-100 underline">
      ⚠ Cost incomplete — add prices
    </Link>
  ) : (
    `${m.gp_pct.toFixed(1)}%`
  )}
</td>
```

- [ ] **Step 3: Sort incomplete drinks last** so an understated (inflated) margin can't top the table. In both sort branches, push incomplete to the bottom:

```tsx
const rank = (m: CocktailMetrics) => (m.cost_complete ? 1 : 0)
if (anyVolume) {
  rows.sort((a, b) => rank(b.m) - rank(a.m) || (b.m.volume?.contribution_p ?? -1) - (a.m.volume?.contribution_p ?? -1))
} else {
  rows.sort((a, b) => rank(b.m) - rank(a.m) || b.m.margin_p - a.m.margin_p)
}
```

- [ ] **Step 4:** `npx tsc --noEmit && npx next lint` → clean.

- [ ] **Step 5: Commit** — `feat(pouriq): blended-GP headline and cost-incomplete flags in menu UI`

---

### Task 3: Tests + verification

**Files:** Create `tests/unit/lib/pouriq-trustworthy-numbers.test.ts`

- [ ] **Step 1: Unit tests** (vitest, node env). Build minimal `CocktailWithIngredients` fixtures (helper to make a cocktail with priced/unpriced ingredients). Cover:
  - `ingredientCostComplete`: unit-priced → true; bottle-priced with all three fields → true; missing `pour_ml` → false; missing `bottle_cost_p` → false; missing `bottle_size_ml` → false; no pricing at all → false.
  - `calculateCocktailMetrics`: `cost_complete` true for fully-priced; false when one ingredient unpriced; false for zero-ingredient cocktail; `net_sale_p` equals gross ÷ 1.2 when `priceIncludesVat`.
  - `calculateMenuMetrics`: with volumes, `blended_gp_pct` = Σmargin·u ÷ Σnet·u (compute expected by hand for a 2-drink fixture) and `headline_basis==='blended'`; with no volumes, `blended_gp_pct` null and `headline_basis==='average'`; an incomplete drink is excluded from `avg_gp_pct`, `blended_gp_pct`, `best_margin`, `worst_margin`, and counted in `incomplete_cost_count`.

- [ ] **Step 2:** `npm run test:unit` → pass.
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4: Commit** — `test(pouriq): cover cost-complete detection and blended GP`

---

### Task 4: PR

- [ ] **Step 1:** Push, open PR. Body: pure calc + UI, no migration; incomplete-cost flagging is a no-op for fully-priced menus; blended GP applies once sales volumes exist.
- [ ] **Step 2:** Watch CI green.
