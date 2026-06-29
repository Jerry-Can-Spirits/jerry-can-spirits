# Pour IQ Menu Item Type (Batch 3, Piece 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every menu drink a coarse `item_type` (cocktail/beer/cider/wine/spirit/soft-drink/food/other), auto-inferred on import + manually overridable + backfilled, and use it so spec cards default to cocktails.

**Architecture:** A real `item_type` column on `pouriq_cocktails`, fed by one pure heuristic (`itemTypeFromIngredients`) at the import-commit site, by the drink editor for manual override, and by a backfill migration for existing rows. The spec-cards view filters on it.

**Tech Stack:** Next.js 15 App Router, TypeScript, Cloudflare D1 (SQLite), Vitest (`npm run test:unit`).

**Spec:** `docs/superpowers/specs/2026-06-29-pouriq-item-type-design.md`
**Branch:** `feat/pouriq-item-type` (already created; spec committed there).

**Conventions:** no new npm dependencies (keep the lock untouched — see the #840 lock-file lesson). Before pushing: `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any` — `@typescript-eslint/no-explicit-any` is an error) + `npm run test:unit` + `npm run build`. Apply prod migrations via `wrangler d1 migrations apply` (the user does this after merge). Light theme classes; no em-dashes in user copy.

---

## File Structure

- `migrations/0057_cocktail_item_type.sql` — CREATE: add column + backfill.
- `src/lib/pouriq/types.ts` — MODIFY: `ITEM_TYPES`, `ItemType`, `CocktailRow.item_type`.
- `src/lib/pouriq/item-type.ts` — CREATE: `itemTypeFromIngredients` helper (pure, one home shared by import + tests).
- `tests/unit/lib/pouriq-item-type.test.ts` — CREATE: heuristic unit tests.
- `src/lib/pouriq/menus.ts` — MODIFY: select `item_type` in cocktail reads; set it at the insert at line ~379.
- `src/app/api/pouriq/import/commit/route.ts` — MODIFY: compute + write `item_type` at the insert (line ~192).
- `src/lib/pouriq/server-actions.ts` — MODIFY: `saveCocktailAction` carries `item_type` (insert line ~494 + the update path).
- `src/components/pouriq/CocktailForm.tsx` — MODIFY: `item_type` `<select>`.
- `src/app/trade/pouriq/[menuId]/specs/page.tsx` + `src/components/pouriq/SpecCardsView.tsx` — MODIFY: thread `item_type`, default to cocktails, add category filter.

---

## Task 1: Types + heuristic helper

**Files:**
- Modify: `src/lib/pouriq/types.ts`
- Create: `src/lib/pouriq/item-type.ts`
- Create: `tests/unit/lib/pouriq-item-type.test.ts`

- [ ] **Step 1: Add the type union to `types.ts`**

Near the other shared constants (e.g. by `ALL_INGREDIENT_TYPES`):

```ts
export const ITEM_TYPES = ['cocktail', 'beer', 'cider', 'wine', 'spirit', 'soft-drink', 'food', 'other'] as const
export type ItemType = typeof ITEM_TYPES[number]
```

Add `item_type: ItemType` to the `CocktailRow` interface (find `interface CocktailRow` — it's the base of `CocktailWithIngredients`).

- [ ] **Step 2: Write the failing test**

`tests/unit/lib/pouriq-item-type.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { itemTypeFromIngredients } from '@/lib/pouriq/item-type'
import type { IngredientType } from '@/lib/pouriq/types'

describe('itemTypeFromIngredients', () => {
  it('multiple ingredients -> cocktail', () => {
    expect(itemTypeFromIngredients(['spirit', 'juice', 'syrup'] as IngredientType[])).toBe('cocktail')
  })
  it('no ingredients -> cocktail', () => {
    expect(itemTypeFromIngredients([])).toBe('cocktail')
  })
  it.each([
    ['beer', 'beer'], ['cider', 'cider'], ['wine', 'wine'],
    ['spirit', 'spirit'], ['liqueur', 'spirit'],
    ['soft-drink', 'soft-drink'], ['alcohol-free', 'soft-drink'], ['mixer', 'soft-drink'], ['juice', 'soft-drink'],
    ['food', 'food'], ['syrup', 'other'], ['garnish', 'other'],
  ])('single %s ingredient -> %s', (ing, expected) => {
    expect(itemTypeFromIngredients([ing as IngredientType])).toBe(expected)
  })
})
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-item-type.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `item-type.ts`**

```ts
import type { IngredientType, ItemType } from './types'

// Coarse drink type from its recipe. >1 ingredient is a cocktail; a single
// ingredient takes that ingredient's category; empty defaults to cocktail.
export function itemTypeFromIngredients(ingredientTypes: IngredientType[]): ItemType {
  if (ingredientTypes.length !== 1) return 'cocktail'
  switch (ingredientTypes[0]) {
    case 'beer': return 'beer'
    case 'cider': return 'cider'
    case 'wine': return 'wine'
    case 'spirit': case 'liqueur': return 'spirit'
    case 'soft-drink': case 'alcohol-free': case 'mixer': case 'juice': return 'soft-drink'
    case 'food': return 'food'
    default: return 'other'
  }
}
```

- [ ] **Step 5: Run tests, then commit**

Run: `npm run test:unit` → PASS.
```bash
git add src/lib/pouriq/types.ts src/lib/pouriq/item-type.ts tests/unit/lib/pouriq-item-type.test.ts
git commit -m "feat(pouriq): item_type union + itemTypeFromIngredients heuristic"
```

---

## Task 2: Migration 0057 (add column + backfill)

**Files:**
- Create: `migrations/0057_cocktail_item_type.sql`

- [ ] **Step 1: Confirm the live schema column names**

Read `migrations/0015_pouriq.sql` (and any later cocktail/ingredient migrations) to confirm: `pouriq_cocktails.id`, `pouriq_ingredients.cocktail_id`, `pouriq_ingredients.library_ingredient_id`, `pouriq_ingredients_library.id`, `pouriq_ingredients_library.ingredient_type`. Adjust the SQL below if any differ.

- [ ] **Step 2: Write the migration**

```sql
-- Add a coarse item_type to menu drinks; backfill single-ingredient drinks
-- from their one ingredient's type. Multi/zero-ingredient drinks stay 'cocktail'.
ALTER TABLE pouriq_cocktails ADD COLUMN item_type TEXT NOT NULL DEFAULT 'cocktail';

UPDATE pouriq_cocktails
SET item_type = (
  SELECT CASE il.ingredient_type
    WHEN 'beer' THEN 'beer' WHEN 'cider' THEN 'cider' WHEN 'wine' THEN 'wine'
    WHEN 'spirit' THEN 'spirit' WHEN 'liqueur' THEN 'spirit'
    WHEN 'soft-drink' THEN 'soft-drink' WHEN 'alcohol-free' THEN 'soft-drink'
    WHEN 'mixer' THEN 'soft-drink' WHEN 'juice' THEN 'soft-drink'
    WHEN 'food' THEN 'food' ELSE 'other' END
  FROM pouriq_ingredients i
  JOIN pouriq_ingredients_library il ON il.id = i.library_ingredient_id
  WHERE i.cocktail_id = pouriq_cocktails.id
)
WHERE (SELECT COUNT(*) FROM pouriq_ingredients WHERE cocktail_id = pouriq_cocktails.id) = 1;
```

- [ ] **Step 3: Validate with node:sqlite (do NOT apply to prod)**

Write a scratch script under the OS temp scratchpad (NOT committed) that: creates `pouriq_cocktails`, `pouriq_ingredients`, `pouriq_ingredients_library` with the relevant columns; inserts a multi-ingredient drink, a single-beer drink, a single-spirit drink, and a zero-ingredient drink; runs the migration SQL; asserts item_types are `cocktail/beer/spirit/cocktail` respectively and every value is in `ITEM_TYPES`. Run with `node` (Node 24 has `node:sqlite`). Print `PASS`.

- [ ] **Step 4: Commit (SQL only)**

```bash
git add migrations/0057_cocktail_item_type.sql
git commit -m "feat(pouriq): migration 0057 - cocktail item_type column + backfill"
```

---

## Task 3: Persist + read item_type (selects, inserts, update)

**Files:**
- Modify: `src/lib/pouriq/menus.ts` (select in cocktail reads; insert ~line 379)
- Modify: `src/app/api/pouriq/import/commit/route.ts` (insert ~line 192)
- Modify: `src/lib/pouriq/server-actions.ts` (`saveCocktailAction` insert ~494 + update path)

- [ ] **Step 1: Read item_type in cocktail SELECTs**

In `menus.ts`, find every `SELECT ... FROM pouriq_cocktails` that maps to a `CocktailRow`/`CocktailWithIngredients` (e.g. `listCocktailsForMenu` ~line 157, and others around 192/272). Add `item_type` to the selected columns and to the row mapping so `CocktailRow.item_type` is populated. (TypeScript will now require it — `tsc` will flag any mapper you miss.)

- [ ] **Step 2: Set item_type at the import-commit insert**

In `import/commit/route.ts` (~line 192, `INSERT INTO pouriq_cocktails`): compute `const item_type = itemTypeFromIngredients(<this drink's ingredient types>)` (the commit route already has each drink's resolved ingredients + their types — use the inferred/library ingredient_type per line) and add `item_type` to the INSERT columns + bind value. Import the helper.

- [ ] **Step 3: Set item_type at the other inserts**

- `menus.ts` ~line 379 `INSERT INTO pouriq_cocktails`: determine what this path is (duplicate-menu / add-drink). If it copies an existing drink, carry its `item_type`; otherwise default `'cocktail'`. Add the column + value.
- `server-actions.ts` `saveCocktailAction` (~line 494 insert): add `item_type` to the INSERT and bind from the action payload (Task 4 adds it to the payload); default `'cocktail'` if absent. Also update the cocktail UPDATE path in the same action to set `item_type = ?`.

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit` (must be clean — confirms every CocktailRow mapper now provides item_type) and `npm run test:unit`.
```bash
git add src/lib/pouriq/menus.ts src/app/api/pouriq/import/commit/route.ts src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): persist + read item_type across cocktail inserts/selects"
```

---

## Task 4: item_type dropdown on the drink editor

**Files:**
- Modify: `src/components/pouriq/CocktailForm.tsx`
- Modify: `src/lib/pouriq/server-actions.ts` (`saveCocktailAction` signature/payload — already touched in Task 3)

- [ ] **Step 1: Add the field to the form**

In `CocktailForm.tsx`: add `const [itemType, setItemType] = useState<ItemType>(cocktail?.item_type ?? 'cocktail')` (import `ITEM_TYPES`, `ItemType`). Render a labelled `<select>` near the name/price fields (match the existing input/label classes) listing `ITEM_TYPES`. Include `item_type: itemType` in the object passed to `saveCocktailAction`.

- [ ] **Step 2: Thread it through the action**

In `saveCocktailAction`, accept `item_type` on the input type and use it in the INSERT/UPDATE (Task 3 wired the SQL; here ensure the payload type includes `item_type: ItemType` and defaults to `'cocktail'` when omitted).

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/CocktailForm.tsx src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): item_type selector on the drink editor"
```

---

## Task 5: Spec-card filter (default cocktails + category toggles)

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/specs/page.tsx` (already passes `cocktails` which now carry `item_type`)
- Modify: `src/components/pouriq/SpecCardsView.tsx`

- [ ] **Step 1: Default to cocktails + category filter in SpecCardsView**

`SpecCardsView` already receives `cocktails: CocktailWithIngredients[]` (now with `item_type`). Add:
- `const present = [...new Set(cocktails.map((c) => c.item_type))]` (the item_types actually on this menu).
- `const [selected, setSelected] = useState<Set<ItemType>>(new Set(['cocktail']))` — default to cocktails only.
- `const visible = cocktails.filter((c) => selected.has(c.item_type))`.
- In the `no-print` toolbar, render a toggle chip per `present` type (label the type; `cocktail` chip pressed by default) that adds/removes it from `selected`. Use the existing chip classes.
- Render `visible` instead of `cocktails`. If `visible.length === 0`, show a `no-print` "No cards for the selected categories." note.

- [ ] **Step 2: Verify + commit**

Run: `npm run test:unit`, `npm run build`. Manually reason: a menu of all cocktails shows all cards (unchanged); a menu with a beer hides the beer card until its chip is ticked.
```bash
git add src/components/pouriq/SpecCardsView.tsx src/app/trade/pouriq/[menuId]/specs/page.tsx
git commit -m "feat(pouriq): spec cards default to cocktails with a category filter"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: notes the new column, that **migration 0057 must be applied to prod after merge** (`wrangler d1 migrations apply jerry-can-spirits-db --remote`), and that no npm deps changed.
