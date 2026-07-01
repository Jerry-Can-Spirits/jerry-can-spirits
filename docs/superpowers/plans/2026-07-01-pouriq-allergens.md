# Pour IQ Allergens + Dietary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the 14 regulated allergens + dietary (vegetarian/vegan/GF) per ingredient, roll up to each drink (never claiming safety that isn't confirmed), and show on spec cards + the printed menu.

**Architecture:** Additive columns on the ingredient library (JSON tags + a reviewed flag) + a pure propagation helper where `reviewed` gates every positive claim + entry UI + display surfaces. One migration (0062). No new dependencies.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-07-01-pouriq-allergens-design.md`
**Branch:** `feat/pouriq-allergens` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + `npx opennextjs-cloudflare build`. Keep package.json/lock/configs untouched. Light theme; no em-dashes. Pure helpers: no server imports.

**Verified facts:**
- `ingredient-library.ts`: `IngredientLibraryInsert` (insert/update shape), `LIBRARY_SELECT` const (line 23), `mapLibraryRow`, `insertLibraryEntry` (~90), `updateLibraryEntry` (~128). `saveLibraryEntryAction` (server-actions) maps its `LibraryEntryInput` to this.
- `menus.ts` `listCocktailsForMenu`/`getCocktail` build `IngredientWithLibrary.library` **field-by-field** (need the 3 new columns added + SELECTed as `l.*`).
- Display: `SpecCard.tsx`, `MenuBuilder.tsx` (printed menu). Attention: `getAttentionRows` in `attention.ts`.

---

## Task 1: Migration 0062 + types + constants

**Files:** Create `migrations/0062_allergens.sql`, `src/lib/pouriq/allergens.ts`, `tests/unit/lib/pouriq-allergens.test.ts`; modify `src/lib/pouriq/types.ts`.

- [ ] **Step 1: Migration** (latest is `0061_cocktail_updated_at.sql`)
```sql
ALTER TABLE pouriq_ingredients_library ADD COLUMN allergens TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pouriq_ingredients_library ADD COLUMN dietary TEXT NOT NULL DEFAULT '[]';
ALTER TABLE pouriq_ingredients_library ADD COLUMN allergens_reviewed INTEGER NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Types** — add to `IngredientLibraryRow`: `allergens: string`, `dietary: string`, `allergens_reviewed: number`.

- [ ] **Step 3: Failing test** (`pouriq-allergens.test.ts`)
```ts
import { parseTags, ALLERGENS, DIETARY } from '@/lib/pouriq/allergens'
it('has 14 allergens and 2 dietary keys', () => {
  expect(ALLERGENS).toHaveLength(14); expect(DIETARY).toEqual(['vegetarian', 'vegan'])
})
it('parseTags: valid, empty, malformed', () => {
  expect(parseTags('["milk","gluten"]')).toEqual(['milk', 'gluten'])
  expect(parseTags('[]')).toEqual([]); expect(parseTags('not json')).toEqual([]); expect(parseTags('{}')).toEqual([])
})
```

- [ ] **Step 4: Implement `allergens.ts`**
```ts
export const ALLERGENS = ['celery','gluten','crustaceans','eggs','fish','lupin','milk','molluscs','mustard','nuts','peanuts','sesame','soya','sulphites'] as const
export type AllergenKey = typeof ALLERGENS[number]
export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  celery: 'Celery', gluten: 'Gluten', crustaceans: 'Crustaceans', eggs: 'Eggs', fish: 'Fish', lupin: 'Lupin',
  milk: 'Milk', molluscs: 'Molluscs', mustard: 'Mustard', nuts: 'Tree nuts', peanuts: 'Peanuts',
  sesame: 'Sesame', soya: 'Soya', sulphites: 'Sulphites',
}
export const DIETARY = ['vegetarian', 'vegan'] as const
export type DietaryKey = typeof DIETARY[number]
export function parseTags(json: string): string[] {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [] }
  catch { return [] }
}
```

- [ ] **Step 5: node:sqlite migration validation** (scratch, not committed): columns added with defaults `'[]'`,`'[]'`,`0`. Print PASS.

- [ ] **Step 6: Green + commit**
```bash
git add migrations/0062_allergens.sql src/lib/pouriq/allergens.ts src/lib/pouriq/types.ts tests/unit
git commit -m "feat(pouriq): migration 0062 + allergen/dietary constants + parseTags"
```

---

## Task 2: Propagation helper

**Files:** Modify `src/lib/pouriq/allergens.ts`; extend `tests/unit/lib/pouriq-allergens.test.ts`.

- [ ] **Step 1: Failing tests**
```ts
import { cocktailAllergenInfo } from '@/lib/pouriq/allergens'
const ing = (allergens: string[], dietary: string[], reviewed: number) => ({ library: { allergens: JSON.stringify(allergens), dietary: JSON.stringify(dietary), allergens_reviewed: reviewed } })
it('unions allergens and needs full review', () => {
  const r = cocktailAllergenInfo([ing(['milk'], ['vegetarian'], 1), ing(['sulphites'], ['vegetarian'], 1)])
  expect(r.contains).toEqual(['milk', 'sulphites']); expect(r.reviewed).toBe(true); expect(r.vegetarian).toBe(true)
})
it('any unreviewed ingredient blocks reviewed + all claims', () => {
  const r = cocktailAllergenInfo([ing(['milk'], ['vegan'], 1), ing([], [], 0)])
  expect(r.reviewed).toBe(false); expect(r.vegan).toBe(false); expect(r.vegetarian).toBe(false); expect(r.glutenFree).toBe(false)
})
it('vegan implies vegetarian; gluten blocks GF', () => {
  const r = cocktailAllergenInfo([ing([], ['vegan'], 1)])
  expect(r.vegan).toBe(true); expect(r.vegetarian).toBe(true); expect(r.glutenFree).toBe(true)
  const g = cocktailAllergenInfo([ing(['gluten'], ['vegan'], 1)])
  expect(g.glutenFree).toBe(false)
})
it('empty drink is not reviewed', () => {
  expect(cocktailAllergenInfo([]).reviewed).toBe(false)
})
```

- [ ] **Step 2: Implement**
```ts
import type { AllergenKey } from './allergens' // (same file — inline)
export function cocktailAllergenInfo(
  ingredients: { library: { allergens: string; dietary: string; allergens_reviewed: number } }[],
): { contains: AllergenKey[]; reviewed: boolean; vegetarian: boolean; vegan: boolean; glutenFree: boolean } {
  const reviewed = ingredients.length > 0 && ingredients.every((i) => i.library.allergens_reviewed === 1)
  const set = new Set<string>()
  for (const i of ingredients) for (const a of parseTags(i.library.allergens)) set.add(a)
  const contains = ALLERGENS.filter((a) => set.has(a))
  const diet = ingredients.map((i) => parseTags(i.library.dietary))
  const vegan = reviewed && diet.every((d) => d.includes('vegan'))
  const vegetarian = reviewed && diet.every((d) => d.includes('vegetarian') || d.includes('vegan'))
  const glutenFree = reviewed && !contains.includes('gluten')
  return { contains, reviewed, vegetarian, vegan, glutenFree }
}
```

- [ ] **Step 3: Green + commit**
```bash
git add src/lib/pouriq/allergens.ts tests/unit
git commit -m "feat(pouriq): cocktailAllergenInfo propagation (reviewed gates all claims)"
```

---

## Task 3: Persistence flow-through

**Files:** Modify `src/lib/pouriq/ingredient-library.ts`, `src/lib/pouriq/menus.ts`, `src/lib/pouriq/server-actions.ts` (`LibraryEntryInput`), and any test fixtures tsc flags.

- [ ] **Step 1: Read + extend the insert shape** — add to `IngredientLibraryInsert`: `allergens?: string[]`, `dietary?: string[]`, `allergens_reviewed?: boolean`.

- [ ] **Step 2: SELECT + writes** — add `allergens, dietary, allergens_reviewed` to `LIBRARY_SELECT`. In `insertLibraryEntry` add the three columns, binding `JSON.stringify(data.allergens ?? [])`, `JSON.stringify(data.dietary ?? [])`, `data.allergens_reviewed ? 1 : 0`. In `updateLibraryEntry`, when the patch includes them, set them the same way.

- [ ] **Step 3: Mappers** — `mapLibraryRow` returns the raw `allergens`/`dietary` strings + `allergens_reviewed` number (spread already carries them once the type has them; confirm). In `menus.ts` `listCocktailsForMenu` + `getCocktail`, add `l.allergens`, `l.dietary`, `l.allergens_reviewed` to the SELECT and map them onto the `library` object.

- [ ] **Step 4: Action input** — extend `LibraryEntryInput` (server-actions) with `allergens: string[]`, `dietary: string[]`, `allergens_reviewed: boolean`, and pass them through to the insert/update in `saveLibraryEntryAction`.

- [ ] **Step 5: Fixtures** — `npx tsc --noEmit`; add `allergens: '[]', dietary: '[]', allergens_reviewed: 0` to test fixtures building `IngredientLibraryRow`/`CocktailWithIngredients` literals.

- [ ] **Step 6: Verify + commit**
```bash
git add src/lib/pouriq/ingredient-library.ts src/lib/pouriq/menus.ts src/lib/pouriq/server-actions.ts tests/unit
git commit -m "feat(pouriq): persist + read allergen/dietary fields end to end"
```

---

## Task 4: Entry UI (IngredientForm)

**Files:** Modify `src/components/pouriq/IngredientForm.tsx` (optionally add `src/components/pouriq/AllergenPicker.tsx`).

- [ ] **Step 1** — When editing an existing entry, render an "Allergens & dietary" block: 14 allergen toggle-chips (from `ALLERGENS`/`ALLERGEN_LABELS`) bound to a parsed-`allergens` state; `vegetarian`/`vegan` toggles (ticking `vegan` also sets `vegetarian`); a "These allergen details are confirmed" checkbox bound to an `allergensReviewed` state. Initialise from `parseTags(entry.allergens)` / `parseTags(entry.dietary)` / `entry.allergens_reviewed === 1`. Keep it a contained block (extract `AllergenPicker` if it aids readability). Light theme, no em-dashes.

- [ ] **Step 2** — Include `allergens`, `dietary`, `allergens_reviewed` in the values passed to `saveLibraryEntryAction`.

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run build`.
```bash
git add src/components/pouriq/IngredientForm.tsx src/components/pouriq/AllergenPicker.tsx
git commit -m "feat(pouriq): allergen + dietary entry on the ingredient form"
```

---

## Task 5: Display (spec cards + printed menu)

**Files:** Modify `src/components/pouriq/SpecCard.tsx`, `src/components/pouriq/SpecCardsView.tsx`, `src/components/pouriq/MenuBuilder.tsx`.

- [ ] **Step 1: Spec cards** — `SpecCardsView` gains a `showAllergens` toggle (default on when any visible cocktail's ingredients have allergen/dietary data), passed to `SpecCard`. `SpecCard` computes `cocktailAllergenInfo(cocktail.ingredients)` and, when on, renders: `Contains: {labels}` (via `ALLERGEN_LABELS`), dietary badges (V / Ve / GF from vegetarian/vegan/glutenFree), and a distinct "Allergen info incomplete" line when `!reviewed`. Print-aware.

- [ ] **Step 2: Printed menu** — `MenuBuilder` gains a `showAllergens` control alongside show-prices/photos; when on, each drink in the preview/print shows a compact `Contains:` line + dietary badges, and "allergen info incomplete" when `!reviewed`. The `Drink`/preview needs the ingredients' allergen fields — thread them (the builder page maps cocktails; include `allergens`/`dietary`/`allergens_reviewed` per ingredient, or compute `cocktailAllergenInfo` server-side and pass the result per drink). Prefer computing `cocktailAllergenInfo` on the page and passing `{ contains, reviewed, vegetarian, vegan, glutenFree }` per drink to keep the client light.

- [ ] **Step 3: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/SpecCard.tsx src/components/pouriq/SpecCardsView.tsx src/components/pouriq/MenuBuilder.tsx src/app/trade/pouriq
git commit -m "feat(pouriq): show allergens + dietary on spec cards and the printed menu"
```

---

## Task 6: Attention nudge

**Files:** Modify `src/lib/pouriq/attention.ts`.

- [ ] **Step 1** — In `getAttentionRows`, mirror the completeness/estimated blocks: compute `unreviewedIngCount` = unique `library_ingredient_id` across the menu's cocktail ingredients where `library.allergens_reviewed === 0`; when `> 0`, push `{ key: 'allergen-review', label: `${n} ingredient(s) need${n===1?'s':''} an allergen review.`, href: '/trade/pouriq/library', severity: 'medium' }`. Correct singular/plural, no em-dash. Place near the other ingredient-data rows.

- [ ] **Step 2: Verify + commit**
`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`, `npx opennextjs-cloudflare build`.
```bash
git add src/lib/pouriq/attention.ts
git commit -m "feat(pouriq): attention nudge for ingredients needing allergen review"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `npx opennextjs-cloudflare build` green; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review (strictest on the `reviewed`-gates-all-claims legal-safety logic), then `superpowers:finishing-a-development-branch` to open the PR. PR body: the feature, **migration 0062 to apply after merge**, no deps, catalogue-seeding/filtering deferred.
