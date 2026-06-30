# Pour IQ Priced Serves (R15 + R14) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an ingredient carry multiple priced serves (single/double, wine glasses, half/pint, splash) that are sellable, POS-mappable, stock-depleting serves with live GP.

**Architecture:** Reuse the existing `is_serve` cocktail as the sellable serve (POS + stock already work on it); add a real price (it is hardcoded 0 today) and a fast "Serves" UI on the ingredient edit page that creates single-ingredient priced serves with presets, ml, and live GP. No new table; no migration.

**Tech Stack:** Next.js 15 App Router (server actions), TypeScript, Cloudflare D1, Vitest. **No new npm dependencies.**

**Spec:** `docs/superpowers/specs/2026-06-30-pouriq-priced-serves-design.md`
**Branch:** `feat/pouriq-priced-serves` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes in user copy. Pure helpers must not import server-only/D1.

**Key facts (verified):**
- A serve = `pouriq_cocktails` row with `is_serve = 1` on the tenant's serves menu (`getOrCreateServesMenu`), with a recipe (`replaceIngredients`). `sale_price_p` column exists; `saveServeAction` currently inserts it as `0`.
- POS maps a sale to a serve (`UnmatchedReview` → `target: 'serve'`); stock/variance deplete via `sales × recipe pour_ml`. No change needed.
- Costing helpers in `src/lib/pouriq/calculations.ts` (pure): `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct)` (net cost per ml, yield-aware) and `netPriceP(enteredP, includesVat)`.
- The ingredient edit surface: `src/app/trade/pouriq/library/[id]/edit/page.tsx` renders `IngredientForm`.

---

## File Structure

- `src/lib/pouriq/calculations.ts` — MODIFY: add pure `serveGp(...)`.
- `src/lib/pouriq/serve-presets.ts` — CREATE: pure preset table keyed by `IngredientType` + default-name helper.
- `tests/unit/lib/pouriq-serve-gp.test.ts` + `tests/unit/lib/pouriq-serve-presets.test.ts` — CREATE.
- `src/lib/pouriq/server-actions.ts` — MODIFY: `saveServeAction` stores `sale_price_p`; add `createIngredientServeAction`; add `listIngredientServes` query (or in `menus.ts`).
- `src/components/pouriq/ServeForm.tsx` + `ServeManager.tsx` — MODIFY: price field + GP display.
- `src/components/pouriq/IngredientServes.tsx` — CREATE: the "Serves" section for the ingredient edit page.
- `src/app/trade/pouriq/library/[id]/edit/page.tsx` — MODIFY: load this ingredient's serves + render `IngredientServes`.
- `src/components/pouriq/ServeUnitPicker.tsx` (and any small/medium/large size buttons) — MODIFY: show ml (R14).

---

## Task 1: `serveGp` + serve presets (pure)

**Files:**
- Modify: `src/lib/pouriq/calculations.ts`
- Create: `src/lib/pouriq/serve-presets.ts`
- Create: `tests/unit/lib/pouriq-serve-gp.test.ts`, `tests/unit/lib/pouriq-serve-presets.test.ts`

- [ ] **Step 1: Failing tests**

`pouriq-serve-gp.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { serveGp } from '@/lib/pouriq/calculations'

describe('serveGp', () => {
  it('null when price is 0', () => {
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 0, pricesIncludeVat: false })).toBeNull()
  })
  it('ex-VAT price: GP = (price - cost) / price', () => {
    // cost = 2p/ml * 25 = 50p; price 350p ex VAT -> (350-50)/350 = 85.71%
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 350, pricesIncludeVat: false })).toBeCloseTo(85.71, 1)
  })
  it('inc-VAT price is netted first', () => {
    // price 360p inc VAT -> net 300p; cost 50p -> (300-50)/300 = 83.33%
    expect(serveGp({ costPerMlNetP: 2, pourMl: 25, salePriceP: 360, pricesIncludeVat: true })).toBeCloseTo(83.33, 1)
  })
  it('zero cost -> 100%', () => {
    expect(serveGp({ costPerMlNetP: 0, pourMl: 25, salePriceP: 350, pricesIncludeVat: false })).toBe(100)
  })
})
```

`pouriq-serve-presets.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { servePresetsFor, defaultServeName } from '@/lib/pouriq/serve-presets'

describe('servePresetsFor', () => {
  it('spirit -> single + double', () => {
    expect(servePresetsFor('spirit').map((p) => [p.name, p.ml])).toEqual([['Single', 25], ['Double', 50]])
  })
  it('wine -> glass sizes + bottle', () => {
    expect(servePresetsFor('wine').map((p) => p.ml)).toEqual([125, 175, 250, 750])
  })
  it('soft-drink -> splash + half + pint', () => {
    expect(servePresetsFor('soft-drink').map((p) => p.name)).toEqual(['Splash', 'Small (half)', 'Pint'])
  })
  it('unknown type -> no presets', () => {
    expect(servePresetsFor('food')).toEqual([])
  })
})
describe('defaultServeName', () => {
  it('combines ingredient + preset', () => {
    expect(defaultServeName("Gordon's", 'Double')).toBe("Gordon's Double")
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run tests/unit/lib/pouriq-serve-gp.test.ts tests/unit/lib/pouriq-serve-presets.test.ts`
Expected: FAIL (not defined).

- [ ] **Step 3: Implement**

In `calculations.ts` (near the other GP helpers; reuse `netPriceP`):
```ts
export function serveGp(args: { costPerMlNetP: number; pourMl: number; salePriceP: number; pricesIncludeVat: boolean }): number | null {
  if (args.salePriceP <= 0) return null
  const saleNet = args.pricesIncludeVat ? netPriceP(args.salePriceP, true) : args.salePriceP
  if (saleNet <= 0) return null
  const cost = args.costPerMlNetP * args.pourMl
  return ((saleNet - cost) / saleNet) * 100
}
```

Create `serve-presets.ts`:
```ts
import type { IngredientType } from './types'

export interface ServePreset { name: string; ml: number }

const PRESETS: Partial<Record<IngredientType, ServePreset[]>> = {
  spirit: [{ name: 'Single', ml: 25 }, { name: 'Double', ml: 50 }],
  liqueur: [{ name: 'Single', ml: 25 }, { name: 'Double', ml: 50 }],
  wine: [{ name: 'Small', ml: 125 }, { name: 'Medium', ml: 175 }, { name: 'Large', ml: 250 }, { name: 'Bottle', ml: 750 }],
  beer: [{ name: 'Half', ml: 284 }, { name: 'Pint', ml: 568 }],
  cider: [{ name: 'Half', ml: 284 }, { name: 'Pint', ml: 568 }],
  'soft-drink': [{ name: 'Splash', ml: 25 }, { name: 'Small (half)', ml: 284 }, { name: 'Pint', ml: 568 }],
  mixer: [{ name: 'Splash', ml: 25 }, { name: 'Small (half)', ml: 284 }, { name: 'Pint', ml: 568 }],
  juice: [{ name: 'Splash', ml: 25 }, { name: 'Small', ml: 125 }],
  'alcohol-free': [{ name: 'Half', ml: 284 }, { name: 'Pint', ml: 568 }],
}

export function servePresetsFor(type: IngredientType): ServePreset[] {
  return PRESETS[type] ?? []
}
export function defaultServeName(ingredientName: string, presetName: string): string {
  return `${ingredientName} ${presetName}`.trim()
}
```

- [ ] **Step 4: Run, verify pass; commit**

Run: `npm run test:unit` → PASS.
```bash
git add src/lib/pouriq/calculations.ts src/lib/pouriq/serve-presets.ts tests/unit/lib/pouriq-serve-gp.test.ts tests/unit/lib/pouriq-serve-presets.test.ts
git commit -m "feat(pouriq): serveGp + serve-preset helpers (pure)"
```

---

## Task 2: Serves carry a real price

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts` (`saveServeAction`)
- Modify: `src/components/pouriq/ServeForm.tsx`, `src/components/pouriq/ServeManager.tsx`

- [ ] **Step 1: Store the price in `saveServeAction`**

Add `sale_price_p: number` to the action's `input` type. In the INSERT (`server-actions.ts:504`) bind it instead of the literal `0`; in the UPDATE (`:518`) add `sale_price_p = ?`. Default to `0` when omitted (keeps callers that do not pass it valid). Pass it through from `ServeManager.save`.

- [ ] **Step 2: Price field + GP in the UI**

In `ServeForm`, add a price input (pounds, like the cocktail editor's price field) and include it in `onSubmit`. In `ServeManager`, show each serve's price and, when the serve has exactly one ingredient, its GP via `serveGp` (compute `costPerMlNetP` from the library entry: `usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct)`; pull the menu's `prices_include_vat` for the serves menu, or treat serve prices as entered net — match how the serves page already treats VAT; if unsure, default `pricesIncludeVat: false`).

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/server-actions.ts src/components/pouriq/ServeForm.tsx src/components/pouriq/ServeManager.tsx
git commit -m "feat(pouriq): serves carry a sale price + show GP"
```

---

## Task 3: `createIngredientServeAction` + list-by-ingredient

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts`
- Modify: `src/lib/pouriq/menus.ts` (a `listIngredientServes(db, libraryIngredientId)` query)

- [ ] **Step 1: List an ingredient's single-ingredient serves**

In `menus.ts`, add `listIngredientServes(db, tradeAccountId, libraryIngredientId)`: select `is_serve` cocktails on the tenant's serves menu whose recipe is exactly one ingredient referencing `libraryIngredientId`. Return `{ id, name, sale_price_p, pour_ml }[]` (the single ingredient's `pour_ml` is the size). Reuse the existing serves-menu lookup pattern; scope by tenant.

- [ ] **Step 2: `createIngredientServeAction`**

In `server-actions.ts` (`'use server'`), add `createIngredientServeAction(libraryIngredientId, name, pourMl, salePriceP)`: resolve `db` + tenant, verify the library ingredient belongs to the tenant, get the serves menu, INSERT an `is_serve` cocktail with `name` + `sale_price_p = salePriceP`, then `replaceIngredients(db, id, [{ library_ingredient_id: libraryIngredientId, pour_ml: pourMl, unit_count: null, recipe_unit: null, recipe_qty: null }])`. `revalidatePath('/trade/pouriq/library/${libraryIngredientId}/edit')` and `'/trade/pouriq/serves'`. Reuse the insert shape from `saveServeAction`.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npm run test:unit`.
```bash
git add src/lib/pouriq/server-actions.ts src/lib/pouriq/menus.ts
git commit -m "feat(pouriq): create + list single-ingredient priced serves"
```

---

## Task 4: "Serves" section on the ingredient edit page

**Files:**
- Create: `src/components/pouriq/IngredientServes.tsx`
- Modify: `src/app/trade/pouriq/library/[id]/edit/page.tsx`

- [ ] **Step 1: Load serves on the page**

In the edit page, after loading the ingredient (`library` row), call `listIngredientServes` and pass `{ libraryId, ingredientName, ingredientType, costPerMlNetP, serves }` to `<IngredientServes>`. Compute `costPerMlNetP = usableCostPerBaseUnitP(price_p, purchase_qty, pack_size, yield_pct)`.

- [ ] **Step 2: The component**

`IngredientServes.tsx` (`'use client'`):
- Lists existing serves: name, **size in ml** (R14), price, and **live GP** via `serveGp({ costPerMlNetP, pourMl, salePriceP, pricesIncludeVat: false })`.
- "Add serve" row: preset chips from `servePresetsFor(ingredientType)` (each chip shows e.g. "Double (50ml)"), a name input (default `defaultServeName(ingredientName, preset.name)`), a size (ml) input pre-filled from the preset, and a price input. As the user types the price, GP updates live. On save, call `createIngredientServeAction(libraryId, name, ml, pricePence)` inside `useTransition`; `router.refresh()` on success; inline error on failure.
- Reuse existing input/button class consts; light theme; no em-dashes.

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/IngredientServes.tsx src/app/trade/pouriq/library/[id]/edit/page.tsx
git commit -m "feat(pouriq): priced-serves section on the ingredient edit page"
```

---

## Task 5: R14 — show ml next to serve-size options

**Files:**
- Modify: `src/components/pouriq/ServeUnitPicker.tsx` (and any small/medium/large serve-size buttons in `ServeForm`/recipe pickers)

- [ ] **Step 1: Add ml to the labels**

Where serve-size presets or small/medium/large buttons render a label, append the ml, e.g. `Small (125ml)`. Use the unit's `base_per_unit`/preset ml. Keep it purely presentational.

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`.
```bash
git add src/components/pouriq/ServeUnitPicker.tsx
git commit -m "feat(pouriq): show ml next to serve sizes (R14)"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: notes that serves now carry a price + are created from the ingredient; **no migration**; POS/stock unchanged (reuses `is_serve`); composed-serve auto-pricing is a noted fast-follow; no npm deps changed.
