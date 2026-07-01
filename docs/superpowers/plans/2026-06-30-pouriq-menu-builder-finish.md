# Finish the Menu Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the menu builder: reorder drinks within a section, brand with a logo + theme, and add dish photos (on menu + spec cards).

**Architecture:** Position-driven drink order + drag-to-position; theme presets via a pure helper; logo + photos via a shared R2 image upload/serve pattern (mirroring the invoice routes). One migration (0060).

**Tech Stack:** Next.js 15 App Router (route handlers + server actions + RSC/client), Cloudflare D1 + R2, TypeScript, Vitest. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-06-30-pouriq-menu-builder-finish-design.md`
**Branch:** `feat/pouriq-menu-builder-finish` (off main; spec committed there).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any`) + `npm run test:unit` + `npm run build` + **`npx opennextjs-cloudflare build`** (new routes). Keep package.json/lock/configs untouched. Light theme for app chrome; no em-dashes. Pure helpers no server imports. **All new route handlers nodejs runtime (`export const runtime = 'nodejs'`, NOT edge).**

**Verified facts:**
- `listCocktailsForMenu` (`menus.ts:159`) orders `name COLLATE NOCASE ASC`; a join read at ~479 too. `pouriq_cocktails.position` exists.
- Invoice upload pattern: `src/app/api/pouriq/invoices/upload/route.ts` (`r2.put(key, buffer, { httpMetadata })`, `env.TRADE_DOCS`); serve pattern: `invoices/[id]/pdf/route.ts` (auth via `checkPourIqAccess`, tenant-scoped, inline). Mirror both for images.
- `MenuBuilder.tsx` has `moveDrinkTo` (appends, early-returns same-section), `reorderSibling` (section up/down), native DnD `dropHandlers`, `ArrangeDrink` rows. `CocktailForm.tsx` is the drink editor (`saveCocktailAction`). `SpecCardsView.tsx`/`SpecCard.tsx` render cards.

---

## Task 1: Migration 0060 + types

**Files:** Create `migrations/0060_menu_builder.sql`; Modify `src/lib/pouriq/types.ts`.

- [ ] **Step 1: Migration** (`ls migrations | sort | tail -1` should be `0059_cost_confidence.sql`)

```sql
ALTER TABLE pouriq_menus ADD COLUMN theme TEXT NOT NULL DEFAULT 'clean';
ALTER TABLE pouriq_menus ADD COLUMN logo_r2_key TEXT;
ALTER TABLE pouriq_menus ADD COLUMN logo_align TEXT NOT NULL DEFAULT 'center';
ALTER TABLE pouriq_cocktails ADD COLUMN photo_r2_key TEXT;
```

- [ ] **Step 2: Types**

In `types.ts`:
```ts
export const MENU_THEMES = ['heritage', 'premium', 'clean', 'casual', 'bold', 'classic'] as const
export type MenuTheme = typeof MENU_THEMES[number]
export type LogoAlign = 'left' | 'center' | 'right'
```
Add to `MenuRow`: `theme: MenuTheme`, `logo_r2_key: string | null`, `logo_align: LogoAlign`. Add to `CocktailRow`: `photo_r2_key: string | null`.

- [ ] **Step 3: Validate migration (node:sqlite scratch, not committed)**

Create the two tables with prior columns; insert a menu + cocktail; apply; assert new columns exist with defaults (`theme='clean'`, `logo_align='center'`, null keys). Print PASS.

- [ ] **Step 4: tsc + fix mappers/fixtures**

Run `npx tsc --noEmit`. Add `theme`/`logo_r2_key`/`logo_align` to `MenuRow` mappers (the menu reads use `SELECT *` so they flow; verify any field-by-field menu mapper) and `photo_r2_key` to `CocktailRow` mappers (incl. the field-by-field join mappers in `menus.ts` — add `c.photo_r2_key`). Fix test fixtures building `MenuRow`/`CocktailRow` literals (add the new fields). Re-run until clean.

- [ ] **Step 5: Commit**

```bash
git add migrations/0060_menu_builder.sql src/lib/pouriq/types.ts src/lib/pouriq/menus.ts tests/unit
git commit -m "feat(pouriq): migration 0060 + menu theme/logo + cocktail photo columns"
```

---

## Task 2: Pure helpers (menuTheme + insertAt)

**Files:** Create `src/lib/pouriq/menu-theme.ts`, `src/lib/pouriq/reorder.ts` (or add `insertAt` to an existing pure util), + tests.

- [ ] **Step 1: Failing tests**

`tests/unit/lib/pouriq-menu-theme.test.ts`:
```ts
import { menuTheme } from '@/lib/pouriq/menu-theme'
import { MENU_THEMES } from '@/lib/pouriq/types'
it('returns a token set for every theme', () => {
  for (const t of MENU_THEMES) {
    const s = menuTheme(t)
    expect(typeof s.page).toBe('string'); expect(typeof s.section).toBe('string')
  }
})
it('unknown theme falls back to clean', () => {
  expect(menuTheme('nope' as never)).toEqual(menuTheme('clean'))
})
```
`tests/unit/lib/pouriq-reorder.test.ts`:
```ts
import { insertAt } from '@/lib/pouriq/reorder'
it('inserts moved id at the index', () => {
  expect(insertAt(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b'])
  expect(insertAt(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a'])
})
it('no-op when index unchanged', () => {
  expect(insertAt(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'b', 'c'])
})
```

- [ ] **Step 2: Run red, then implement**

`menu-theme.ts`: a `Record<MenuTheme, ThemeTokens>` where `ThemeTokens = { page; title; sub; section; drinkName; price; desc }` (Tailwind class strings per theme — heritage dark/serif/gold, premium charcoal, clean light, casual warm, bold high-contrast, classic neutral). `menuTheme(t)` returns the entry or the `clean` entry for unknown.

`reorder.ts`:
```ts
export function insertAt(ids: string[], movedId: string, index: number): string[] {
  const without = ids.filter((id) => id !== movedId)
  const clamped = Math.max(0, Math.min(index, without.length))
  return [...without.slice(0, clamped), movedId, ...without.slice(clamped)]
}
```

- [ ] **Step 3: Run green + commit**

```bash
git add src/lib/pouriq/menu-theme.ts src/lib/pouriq/reorder.ts tests/unit
git commit -m "feat(pouriq): menuTheme presets + insertAt reorder helper (pure)"
```

---

## Task 3: Piece 1 — drink reorder

**Files:** Modify `src/lib/pouriq/menus.ts` (order + `reorderDrinks`), `src/lib/pouriq/server-actions.ts` (`reorderDrinksAction`), `src/app/trade/pouriq/[menuId]/menu-builder/page.tsx` (pass `position`), `src/components/pouriq/MenuBuilder.tsx`.

- [ ] **Step 1: Order by position**

In `menus.ts`, change the cocktail reads feeding the builder/menu to `ORDER BY position ASC, name COLLATE NOCASE ASC` (line ~159 and the join ~479). Add `reorderDrinks(db, menuId, sectionId, orderedIds)`: for each id at index i, `UPDATE pouriq_cocktails SET section_id = ?, position = ? WHERE id = ? AND menu_id = ?` (batched), tenant via the menu.

- [ ] **Step 2: Action**

`reorderDrinksAction(menuId, sectionId | null, orderedCocktailIds)` in `server-actions.ts`: resolve tenant, verify the menu belongs to it + each id belongs to the menu, call `reorderDrinks`, `revalidatePath` the builder path.

- [ ] **Step 3: Builder wiring**

In the page, add `position` (and `photo_r2_key` for Task 6) to the `drinks` mapped from cocktails. In `MenuBuilder`: add `position` to the `Drink` type; `buildViewModel` sorts each section's drinks by `position`. Remove the same-section early-return in `moveDrinkTo`. Make each `ArrangeDrink` a drop target: `onDragOver` preventDefault, `onDrop` reads the dragged id, computes the target section's ordered list via `insertAt(currentSectionOrderedIds, draggedId, dropIndex)`, optimistic-updates local `position`s, and calls `reorderDrinksAction(menuId, targetSectionId, orderedIds)`. Dropping on the section body still appends (reuse existing path). Add per-drink up/down move buttons (keyboard fallback) calling the same reorder. Keep temp-section guards.

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit`, `npm run test:unit`, `npm run build`.
```bash
git add src/lib/pouriq/menus.ts src/lib/pouriq/server-actions.ts "src/app/trade/pouriq/[menuId]/menu-builder/page.tsx" src/components/pouriq/MenuBuilder.tsx
git commit -m "feat(pouriq): reorder drinks within a section (position-driven + drag)"
```

---

## Task 4: Shared R2 image upload + serve routes

**Files:** Create `src/app/api/pouriq/images/upload/route.ts`, `src/app/api/pouriq/menus/[menuId]/logo/route.ts`, `src/app/api/pouriq/cocktails/[cocktailId]/photo/route.ts`. **nodejs runtime on all three.**

- [ ] **Step 1: Upload route**

`POST` — `checkPourIqAccess` (401/403); parse `multipart/form-data` (`file` + `target` = `'menu-logo' | 'drink-photo'` + `id`); reject if `file.type` not in `['image/png','image/jpeg','image/webp']` (400) or size > 5 MB (413). Verify the `id` (menu or cocktail) belongs to the tenant. Compute key (`pouriq-menu-logos/${tradeAccountId}/${id}` or `pouriq-drink-photos/${tradeAccountId}/${id}`); `r2.put(key, buffer, { httpMetadata: { contentType: file.type } })`; `UPDATE pouriq_menus SET logo_r2_key = ? WHERE id = ? AND trade_account_id = ?` (or the cocktail's `photo_r2_key`). Return `{ ok: true }`.

- [ ] **Step 2: Serve routes** (mirror the invoice pdf route)

Menu logo: auth + `getMenu(db, menuId, tradeAccountId)`; 404 if no `logo_r2_key`; `r2.get`; inline response with the object's `httpMetadata.contentType` (fallback `image/png`), `cache-control: private, max-age=300`. Cocktail photo: same against the cocktail's `photo_r2_key` (verify the cocktail's menu belongs to the tenant).

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit`, `npm run build`, **`npx opennextjs-cloudflare build`** (the new routes must build).
```bash
git add src/app/api/pouriq/images "src/app/api/pouriq/menus/[menuId]/logo" "src/app/api/pouriq/cocktails/[cocktailId]/photo"
git commit -m "feat(pouriq): R2 image upload + serve routes (logo + drink photo)"
```

---

## Task 5: Piece 2 — logo + theme UI

**Files:** Modify `src/components/pouriq/MenuBuilder.tsx`; add `setMenuThemeAction` + `setMenuLogoAlignAction` (+ a remove-logo action) in `server-actions.ts`; the builder page passes `menu.theme`/`logo_r2_key`/`logo_align`.

- [ ] **Step 1: Theme**

Add a `theme` `<select>` (the `MENU_THEMES`) in the builder controls; on change call `setMenuThemeAction(menuId, theme)` (optimistic). Apply `menuTheme(theme)` tokens to the printed menu (`<article>` and the section/drink/title elements). Keep the existing columns/show-prices/show-descriptions controls.

- [ ] **Step 2: Logo**

In the controls: an "Upload logo" file input → POST to `/api/pouriq/images/upload` (FormData: file, target `'menu-logo'`, id `menuId`) via `fetch` inside `useTransition`; on success `router.refresh()`. A "Remove logo" button (action clears `logo_r2_key` + deletes the R2 object or just nulls the key). An alignment toggle (left/center/right) → `setMenuLogoAlignAction`. In the printed menu, when `logo_r2_key`, render `<img src={`/api/pouriq/menus/${menuId}/logo?v=${menu.updated_at}`} className="h-16 ..." />` in a container aligned per `logo_align`.

- [ ] **Step 3: Verify + commit**

`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/MenuBuilder.tsx src/lib/pouriq/server-actions.ts "src/app/trade/pouriq/[menuId]/menu-builder/page.tsx"
git commit -m "feat(pouriq): logo upload + alignment + theme presets on the menu builder"
```

---

## Task 6: Piece 3 — dish photos

**Files:** Modify `src/components/pouriq/CocktailForm.tsx` (upload), `src/components/pouriq/MenuBuilder.tsx` (display + toggle), `src/components/pouriq/SpecCardsView.tsx` + `SpecCard.tsx` (display + toggle), the relevant pages to pass `photo_r2_key`.

- [ ] **Step 1: Upload on the cocktail editor**

In `CocktailForm` (editing an existing cocktail), add an "Add photo" file input → POST `/api/pouriq/images/upload` (target `'drink-photo'`, id = cocktail id) inside `useTransition`; show the current photo (`/api/pouriq/cocktails/${id}/photo?v=...`) when `photo_r2_key`; a "Remove photo" action. (New cocktails: photo after first save.)

- [ ] **Step 2: Menu display + toggle**

In `MenuBuilder`, thread `photo_r2_key` onto the `Drink`; add a "Photos" on/off toggle (default on if any drink has a photo); when on, render a small `<img>` thumbnail beside each drink that has one (both preview + print).

- [ ] **Step 3: Spec cards display + toggle**

`SpecCardsView`: a "Photos" on/off toggle (default on if any visible cocktail has a photo); `SpecCard` renders the cocktail photo (`/api/pouriq/cocktails/${id}/photo?v=...`) when on. Print-aware.

- [ ] **Step 4: Verify + commit**

`npx tsc --noEmit`, `npx eslint src tests`, `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/CocktailForm.tsx src/components/pouriq/MenuBuilder.tsx src/components/pouriq/SpecCardsView.tsx src/components/pouriq/SpecCard.tsx src/app/trade/pouriq
git commit -m "feat(pouriq): dish photos on the cocktail editor, menu, and spec cards"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; **`npx opennextjs-cloudflare build` green**; package.json/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: the three pieces, **migration 0060 to apply after merge**, the new image routes (nodejs), no npm deps.
