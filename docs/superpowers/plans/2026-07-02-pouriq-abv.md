# Pour IQ ABV + Alcohol Units Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An `abv` per ingredient, a per-drink ABV% + UK units (computed from the pour), shown on spec cards + the printed menu.

**Architecture:** One additive column + a pure `cocktailAbv` helper (completeness inferred from ingredient type) + entry + display + attention. Mirrors the allergens feature. Migration 0063, no new dependencies.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-02-pouriq-abv-design.md`
**Branch:** `feat/pouriq-abv` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes. Pure helpers: no server imports.

**Verified facts:**
- `IngredientType` = spirit | liqueur | wine | beer | cider | mixer | syrup | juice | garnish | soft-drink | alcohol-free | food | other. Alcoholic = spirit/liqueur/wine/beer/cider.
- `ingredient-library.ts`: `IngredientLibraryInsert`, `LIBRARY_SELECT`, `insertLibraryEntry`, `updateLibraryEntry`, `mapLibraryRow`. `LibraryEntryInput` (server-actions) = `Omit<IngredientLibraryInsert,'trade_account_id'>` so it inherits new optional fields. `saveLibraryEntryAction` spreads `...input`.
- `menus.ts` `listCocktailsForMenu`/`getCocktail` build `library` field-by-field (need `l.abv` added). Ingredients carry `pour_ml`.
- Display + toggles: `SpecCard.tsx`, `SpecCardsView.tsx`, `MenuBuilder.tsx` (+ the builder page computes per-drink info server-side, as done for allergens `allergenInfoById`). Attention: `getAttentionRows` in `attention.ts`.

---

## Task 1: Migration 0063 + types + `cocktailAbv`

**Files:** Create `migrations/0063_abv.sql`, `src/lib/pouriq/abv.ts`, `tests/unit/lib/pouriq-abv.test.ts`; modify `src/lib/pouriq/types.ts`.

- [ ] **Step 1: Migration** (latest is `0062_allergens.sql`)
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN abv REAL NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Type** — add `abv: number` to `IngredientLibraryRow`.

- [ ] **Step 3: Failing tests** (`pouriq-abv.test.ts`)
```ts
import { cocktailAbv } from '@/lib/pouriq/abv'
const ing = (abv: number, type: string, pour_ml: number | null = 50) => ({ pour_ml, library: { abv, ingredient_type: type as never } })
it('computes abv% and units from the pour', () => {
  const r = cocktailAbv([ing(40, 'spirit', 50), ing(0, 'juice', 150)]) // alcohol 20ml / 200ml
  expect(r.abvPct).toBe(10); expect(r.units).toBe(2); expect(r.complete).toBe(true)
})
it('incomplete when an alcoholic ingredient has no abv', () => {
  expect(cocktailAbv([ing(0, 'spirit', 50)]).complete).toBe(false)
})
it('mocktail is complete at 0', () => {
  const r = cocktailAbv([ing(0, 'juice', 150), ing(0, 'syrup', 20)])
  expect(r).toEqual({ abvPct: 0, units: 0, complete: true })
})
it('no poured volume -> 0 abv, no divide by zero', () => {
  expect(cocktailAbv([{ pour_ml: null, library: { abv: 40, ingredient_type: 'spirit' as never } }]))
    .toEqual({ abvPct: 0, units: 0, complete: true })
})
```

- [ ] **Step 4: Implement `abv.ts`**
```ts
import type { IngredientType } from './types'
export const ALCOHOLIC_TYPES = new Set<IngredientType>(['spirit', 'liqueur', 'wine', 'beer', 'cider'])
export function isAlcoholicType(t: IngredientType): boolean { return ALCOHOLIC_TYPES.has(t) }
function round1(n: number): number { return Math.round(n * 10) / 10 }
export function cocktailAbv(
  ingredients: { pour_ml: number | null; library: { abv: number; ingredient_type: IngredientType } }[],
): { abvPct: number; units: number; complete: boolean } {
  const complete = ingredients
    .filter((i) => isAlcoholicType(i.library.ingredient_type))
    .every((i) => i.library.abv > 0)
  let alcoholMl = 0
  let volumeMl = 0
  for (const i of ingredients) {
    if (i.pour_ml == null) continue
    volumeMl += i.pour_ml
    alcoholMl += i.pour_ml * (i.library.abv / 100)
  }
  const abvPct = volumeMl > 0 ? round1((alcoholMl / volumeMl) * 100) : 0
  return { abvPct, units: round1(alcoholMl / 10), complete }
}
```

- [ ] **Step 5: node:sqlite migration validation** (scratch, not committed): column added, default 0 on existing + new rows. Print PASS.

- [ ] **Step 6: Green + commit**
```bash
git add migrations/0063_abv.sql src/lib/pouriq/abv.ts src/lib/pouriq/types.ts tests/unit
git commit -m "feat(pouriq): migration 0063 + cocktailAbv helper (per-pour ABV + units)"
```

---

## Task 2: Persistence flow-through

**Files:** Modify `src/lib/pouriq/ingredient-library.ts`, `src/lib/pouriq/menus.ts`, `src/lib/pouriq/server-actions.ts` (`LibraryEntryInput`); fix fixtures tsc flags.

- [ ] **Step 1** — add `abv?: number` to `IngredientLibraryInsert`.
- [ ] **Step 2** — add `abv` to `LIBRARY_SELECT`; in `insertLibraryEntry` add the column binding `data.abv ?? 0`; in `updateLibraryEntry` set `abv` when the patch includes it. `mapLibraryRow` carries `abv` (spread; confirm the row type includes it).
- [ ] **Step 3** — `menus.ts` `listCocktailsForMenu` + `getCocktail`: add `l.abv` (aliased, e.g. `l_abv`) to the SELECT and map onto the `library` object.
- [ ] **Step 4** — `LibraryEntryInput` inherits `abv?` via the `Omit`; confirm `saveLibraryEntryAction` passes it through.
- [ ] **Step 5** — `npx tsc --noEmit`; add `abv: 0` to test fixtures building `IngredientLibraryRow`/`CocktailWithIngredients` literals.
- [ ] **Step 6: Verify + commit**
```bash
git add src/lib/pouriq/ingredient-library.ts src/lib/pouriq/menus.ts src/lib/pouriq/server-actions.ts tests/unit
git commit -m "feat(pouriq): persist + read ingredient abv end to end"
```

---

## Task 3: Entry UI (ingredient form)

**Files:** Modify `src/components/pouriq/IngredientForm.tsx`.

- [ ] **Step 1** — add an "ABV %" number input (step 0.1, min 0, max 100), shown when the selected ingredient type is alcoholic (`isAlcoholicType(type)`); initialise from `entry?.abv ?? 0`. Clamp the value to 0-100 on change. Include `abv` in the values passed to `saveLibraryEntryAction` (both the standard and prepared `buildInput()` paths, matching how allergens/fields flow).
- [ ] **Step 2: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run build`.
```bash
git add src/components/pouriq/IngredientForm.tsx
git commit -m "feat(pouriq): ABV entry on the ingredient form (alcoholic types)"
```

---

## Task 4: Display (spec cards + printed menu)

**Files:** Modify `src/components/pouriq/SpecCard.tsx`, `src/components/pouriq/SpecCardsView.tsx`, `src/components/pouriq/MenuBuilder.tsx`, the menu-builder page.

- [ ] **Step 1: Spec cards** — `SpecCardsView` gains a `showAbv` toggle (default on when any visible cocktail has an alcoholic-type ingredient), passed to `SpecCard`. `SpecCard` computes `cocktailAbv(cocktail.ingredients)`; when on, renders (complete) "ABV {abvPct}% · {units} units" else "ABV estimate incomplete". Print-aware. Match the allergen block's styling.
- [ ] **Step 2: Printed menu** — `MenuBuilder` gains a `showAbv` control alongside show-prices/photos/allergens. The builder page computes `cocktailAbv` per drink server-side and passes `abvById: Record<string, { abvPct; units; complete }>` (mirror `allergenInfoById`); the client renders it per drink in the preview/print. Print-aware.
- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/SpecCard.tsx src/components/pouriq/SpecCardsView.tsx src/components/pouriq/MenuBuilder.tsx src/app/trade/pouriq
git commit -m "feat(pouriq): show ABV + units on spec cards and the printed menu"
```

---

## Task 5: Attention nudge

**Files:** Modify `src/lib/pouriq/attention.ts`.

- [ ] **Step 1** — In `getAttentionRows`, mirror the allergen-review block: `needsAbvCount` = unique `library_ingredient_id` across the menu's cocktail ingredients where `isAlcoholicType(i.library.ingredient_type) && i.library.abv === 0`; when `> 0`, push `{ key: 'abv-missing', label: `${n} alcoholic ingredient${n===1?'':'s'} need${n===1?'s':''} an ABV.`, href: '/trade/pouriq/library', severity: 'medium' }`. Correct singular/plural, no em-dash. Place near the other ingredient-data rows.
- [ ] **Step 2: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/lib/pouriq/attention.ts
git commit -m "feat(pouriq): attention nudge for alcoholic ingredients missing an ABV"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: the feature, **migration 0063 to apply after merge**, no deps, the "as-poured" ABV caveat.
