# Pour IQ Menu Sections (Batch 3, Piece 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the menu builder into a section-based composer: drinks arranged into custom two-level sections (auto-seeded from `item_type`), drag-and-drop, persisted, printed as a sectioned menu.

**Architecture:** A `pouriq_menu_sections` table + a `section_id` on `pouriq_cocktails`. Pure planning/ordering logic in `menu-sections-plan.ts` (unit-tested), D1 queries + server actions in `menu-sections.ts`, and a rewritten two-pane `MenuBuilder` using the native HTML5 Drag and Drop API with a keyboard `<select>` fallback.

**Tech Stack:** Next.js 15 App Router (server actions), TypeScript, Cloudflare D1 (SQLite), Vitest. **No new npm dependencies.**

**Spec:** `docs/superpowers/specs/2026-06-29-pouriq-menu-sections-design.md`

**DEPENDENCY:** Piece 1 (`item_type`, PR #844) must be merged to `main` first — the auto-seed reads `pouriq_cocktails.item_type`. Branch this work off `main` AFTER #844 merges; confirm the next free migration number is **0058** (0057 belongs to #844).

**Conventions:** before pushing — `npx tsc --noEmit` + `npx eslint src tests` (0 errors; no `as any` in non-test code) + `npm run test:unit` + `npm run build`. Keep `package.json`/lock/configs untouched. Light theme classes; no em-dashes in user copy. Pure helpers must NOT import server-only/D1 modules (so vitest can import them — see the IngredientPicker/test-env constraint).

---

## File Structure

- `migrations/0058_menu_sections.sql` — CREATE table + add `section_id` column + indexes.
- `src/lib/pouriq/types.ts` — MODIFY: `MenuSectionRow`; add `section_id: string | null` to `CocktailRow`.
- `src/lib/pouriq/menu-sections-plan.ts` — CREATE: PURE `itemTypeToSectionName`, `planSeededSections`, `resequence`. No server/D1 imports.
- `tests/unit/lib/pouriq-menu-sections-plan.test.ts` — CREATE.
- `src/lib/pouriq/menu-sections.ts` — CREATE: D1 queries + server actions (`'use server'` where needed) — `listSectionsForMenu`, `ensureSeededSections`, `createSection`, `renameSection`, `deleteSection`, `reorderSections`, `moveDrink`.
- `src/app/trade/pouriq/[menuId]/menu-builder/page.tsx` — MODIFY: load sections + drinks (with `section_id`/`item_type`), call `ensureSeededSections`, pass to `MenuBuilder`.
- `src/components/pouriq/MenuBuilder.tsx` — REWRITE: two-pane editor + DnD + sectioned preview.

---

## Task 1: Types + pure planning/ordering helpers

**Files:**
- Modify: `src/lib/pouriq/types.ts`
- Create: `src/lib/pouriq/menu-sections-plan.ts`
- Create: `tests/unit/lib/pouriq-menu-sections-plan.test.ts`

- [ ] **Step 1: Add types**

In `types.ts`:
```ts
export interface MenuSectionRow {
  id: string
  menu_id: string
  name: string
  parent_section_id: string | null
  position: number
  created_at: string
}
```
Add `section_id: string | null` to the `CocktailRow` interface.

- [ ] **Step 2: Write the failing test**

`tests/unit/lib/pouriq-menu-sections-plan.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { itemTypeToSectionName, planSeededSections, resequence } from '@/lib/pouriq/menu-sections-plan'
import type { ItemType } from '@/lib/pouriq/types'

describe('itemTypeToSectionName', () => {
  it.each([
    ['cocktail', 'Cocktails'], ['beer', 'Beer & Cider'], ['cider', 'Beer & Cider'],
    ['wine', 'Wine'], ['spirit', 'Spirits'], ['soft-drink', 'Soft Drinks'],
    ['food', 'Food'], ['other', 'Other'],
  ])('%s -> %s', (t, name) => expect(itemTypeToSectionName(t as ItemType)).toBe(name))
})

describe('planSeededSections', () => {
  it('groups drinks by section name in canonical order with assignments', () => {
    const plan = planSeededSections([
      { id: 'a', item_type: 'beer' }, { id: 'b', item_type: 'cocktail' },
      { id: 'c', item_type: 'cider' }, { id: 'd', item_type: 'cocktail' },
    ])
    expect(plan.sections.map((s) => s.name)).toEqual(['Cocktails', 'Beer & Cider'])
    const cocktails = plan.sections.find((s) => s.name === 'Cocktails')!
    expect(plan.assignments.filter((x) => x.tempId === cocktails.tempId).map((x) => x.cocktailId).sort())
      .toEqual(['b', 'd'])
  })
  it('empty menu -> no sections', () => {
    expect(planSeededSections([])).toEqual({ sections: [], assignments: [] })
  })
})

describe('resequence', () => {
  it('assigns 0-based positions in order', () => {
    expect(resequence(['x', 'y', 'z'])).toEqual([
      { id: 'x', position: 0 }, { id: 'y', position: 1 }, { id: 'z', position: 2 },
    ])
  })
})
```

- [ ] **Step 3: Run it, verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-menu-sections-plan.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement `menu-sections-plan.ts`**

```ts
import type { ItemType } from './types'

const SECTION_NAME: Record<ItemType, string> = {
  cocktail: 'Cocktails', beer: 'Beer & Cider', cider: 'Beer & Cider', wine: 'Wine',
  spirit: 'Spirits', 'soft-drink': 'Soft Drinks', food: 'Food', other: 'Other',
}
// Canonical display order of seeded sections.
const ORDER = ['Cocktails', 'Beer & Cider', 'Wine', 'Spirits', 'Soft Drinks', 'Food', 'Other']

export function itemTypeToSectionName(t: ItemType): string {
  return SECTION_NAME[t]
}

export function planSeededSections(
  drinks: { id: string; item_type: ItemType }[],
): { sections: { tempId: string; name: string }[]; assignments: { cocktailId: string; tempId: string }[] } {
  const byName = new Map<string, string[]>() // name -> cocktail ids
  for (const d of drinks) {
    const name = itemTypeToSectionName(d.item_type)
    const list = byName.get(name) ?? []
    list.push(d.id)
    byName.set(name, list)
  }
  const names = [...byName.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const sections = names.map((name) => ({ tempId: `seed:${name}`, name }))
  const assignments = sections.flatMap((s) =>
    (byName.get(s.name) ?? []).map((cocktailId) => ({ cocktailId, tempId: s.tempId })),
  )
  return { sections, assignments }
}

export function resequence(ids: string[]): { id: string; position: number }[] {
  return ids.map((id, position) => ({ id, position }))
}
```

- [ ] **Step 5: Run + commit**

Run: `npm run test:unit` → PASS.
```bash
git add src/lib/pouriq/types.ts src/lib/pouriq/menu-sections-plan.ts tests/unit/lib/pouriq-menu-sections-plan.test.ts
git commit -m "feat(pouriq): menu-section types + pure seed/order helpers"
```

---

## Task 2: Migration 0058 (sections table + section_id)

**Files:**
- Create: `migrations/0058_menu_sections.sql`

- [ ] **Step 1: Confirm 0058 is the next free number**

`ls migrations/ | sort | tail -3`. Expected latest is `0057_cocktail_item_type.sql` (from #844). If not, use the next free number and adjust the filename.

- [ ] **Step 2: Write the migration**

```sql
CREATE TABLE IF NOT EXISTS pouriq_menu_sections (
  id                TEXT PRIMARY KEY,
  menu_id           TEXT NOT NULL REFERENCES pouriq_menus(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  parent_section_id TEXT REFERENCES pouriq_menu_sections(id) ON DELETE CASCADE,
  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_menu_sections_menu ON pouriq_menu_sections(menu_id);

ALTER TABLE pouriq_cocktails ADD COLUMN section_id TEXT REFERENCES pouriq_menu_sections(id) ON DELETE SET NULL;
```
Note: SQLite does not enforce `ON DELETE SET NULL` for an ALTER-added FK without `PRAGMA foreign_keys=ON` at runtime; D1 has FKs off by default. So the application's `deleteSection` MUST also explicitly null `section_id` for affected drinks and delete sub-sections (do not rely on cascade). Keep the FK clauses for documentation/intent.

- [ ] **Step 3: Validate with node:sqlite (scratch, not committed)**

Script under the OS temp scratchpad: create `pouriq_menus`, `pouriq_cocktails` (with `id`, `menu_id`), apply the migration; insert a menu, a section, a sub-section (parent_section_id = section), and a drink with `section_id` = the section; assert the table + column exist and a row reads back. Print `PASS`. Do not apply to prod.

- [ ] **Step 4: Commit (SQL only)**

```bash
git add migrations/0058_menu_sections.sql
git commit -m "feat(pouriq): migration 0058 - menu sections table + section_id"
```

---

## Task 3: Data layer + server actions (`menu-sections.ts`)

**Files:**
- Create: `src/lib/pouriq/menu-sections.ts`
- Reference patterns: `src/lib/pouriq/menus.ts` (D1 prepare/bind, `getCloudflareContext`) and `src/lib/pouriq/server-actions.ts` (`'use server'`, `checkPourIqAccess`, `revalidatePath`).

- [ ] **Step 1: Queries + actions**

Implement, all tenant-scoped (resolve `tradeAccountId` via `checkPourIqAccess`; verify the menu/section belongs to the tenant before mutating) and each mutation calling `revalidatePath('/trade/pouriq/[menuId]/menu-builder', 'page')` and the menu detail path:

- `listSectionsForMenu(db, menuId): Promise<MenuSectionRow[]>` — `SELECT * FROM pouriq_menu_sections WHERE menu_id = ?1 ORDER BY position ASC`.
- `ensureSeededSections(menuId)` — if `listSectionsForMenu` is empty: load the menu's drinks (`id`, `item_type`), run `planSeededSections`, insert each section (new uuid per tempId; `parent_section_id` NULL; `position` by `resequence` order), then `UPDATE pouriq_cocktails SET section_id = ? WHERE id = ?` per assignment. No-op if any section exists.
- `createSection(menuId, name, parentSectionId | null)` — insert with `position` = count of current siblings (top-level for the menu, or sub-sections of that parent).
- `renameSection(sectionId, name)`.
- `deleteSection(sectionId)` — explicitly: `UPDATE pouriq_cocktails SET section_id = NULL WHERE section_id = sectionId OR section_id IN (sub-section ids)`, delete sub-sections, delete the section. (Do not rely on DB cascade — FKs off in D1.)
- `reorderSections(orderedIds: string[])` — `resequence(orderedIds)` then `UPDATE ... SET position = ? WHERE id = ?` each (within one sibling scope; the caller passes a single sibling set).
- `moveDrink(cocktailId, sectionId | null, position)` — `UPDATE pouriq_cocktails SET section_id = ?, position = ? WHERE id = ?`.

Use `crypto.randomUUID()` for ids (matches existing id generation — verify how other inserts mint ids and follow it).

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`, `npm run test:unit`.
```bash
git add src/lib/pouriq/menu-sections.ts
git commit -m "feat(pouriq): menu-sections data layer + server actions"
```

---

## Task 4: Page wiring

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/menu-builder/page.tsx`
- Modify (if needed): the cocktail read so `section_id` + `item_type` reach the page (the `menus.ts` reads use `SELECT *`, so both columns already flow once the migration runs — confirm).

- [ ] **Step 1: Load + seed + pass**

In the page: after loading the menu, `await ensureSeededSections(menuId)`, then `const sections = await listSectionsForMenu(db, menuId)` and `const cocktails = await listCocktailsForMenu(db, menuId)`. Pass `menu`, `sections`, and `drinks` (now including `id`, `section_id`, `item_type`, `name`, `description`, `sale_price_p`) to `MenuBuilder`. Keep `export const dynamic = 'force-dynamic'`.

- [ ] **Step 2: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`.
```bash
git add src/app/trade/pouriq/[menuId]/menu-builder/page.tsx
git commit -m "feat(pouriq): seed + load sections in the menu-builder page"
```

---

## Task 5: MenuBuilder rewrite — sectioned preview + arrange layout (no DnD yet)

**Files:**
- Modify: `src/components/pouriq/MenuBuilder.tsx`

Build the structure and rendering first; DnD + actions land in Task 6.

- [ ] **Step 1: New props + local model**

Props: `{ menuName, menuId, sections: MenuSectionRow[], drinks: { id; name; description; sale_price_p; section_id; item_type }[] }`. Keep `title`/`columns`/`showPrices`/`showDescriptions` state. Derive a view model: top sections (`parent_section_id === null`, ordered by `position`), each with its sub-sections (ordered) and its directly-assigned drinks (`section_id === section.id`, ordered by the drinks' order); plus an `unplaced` list (`section_id === null`).

- [ ] **Step 2: Arrange pane (read-only first) + Preview pane**

- Arrange pane (`no-print`): the Unplaced tray, each top section (name, its direct drinks, its sub-sections with their drinks), "+ Add section" / "+ sub-section" / rename / delete affordances rendered but wired in Task 6.
- Preview pane (inside the print region): title → for each top section: heading → direct drinks → each sub-section (sub-heading → drinks). Each drink: name, price (if `showPrices`), description (if `showDescriptions`). Respect `columns`.
- Keep the existing controls + "Save as PDF" (`window.print()`).

- [ ] **Step 3: Verify + commit**

Run: `npx tsc --noEmit`, `npm run build`. Reason: a seeded menu shows its sections + drinks in both panes; an all-cocktail menu shows one Cocktails section.
```bash
git add src/components/pouriq/MenuBuilder.tsx
git commit -m "feat(pouriq): sectioned menu builder layout + preview"
```

---

## Task 6: Native HTML5 drag-and-drop + action wiring

**Files:**
- Modify: `src/components/pouriq/MenuBuilder.tsx`

- [ ] **Step 1: Drag drinks between sections**

Make each drink row `draggable`; `onDragStart` sets `e.dataTransfer.setData('text/plain', drinkId)`. Each section, sub-section, and the Unplaced tray is a drop target: `onDragOver={(e) => e.preventDefault()}` and `onDrop` reads the drink id, updates optimistic local state (move the drink into that target, append at end), then calls `moveDrink(drinkId, targetSectionId, newPosition)`. On rejection, revert local state and show an inline error. Use a `useTransition`/`startTransition` so the UI stays responsive.

- [ ] **Step 2: Keyboard / non-drag fallback**

Each drink row also has a "Move to…" `<select>` listing every section + sub-section + "Unplaced"; changing it calls the same move handler. Each top section has up/down buttons calling `reorderSections` for the top-level set; sub-sections have up/down within their parent.

- [ ] **Step 3: Section CRUD wiring**

"+ Add section" → prompt-free inline input → `createSection(menuId, name, null)`. "+ sub-section" on a section → `createSection(menuId, name, section.id)`. Rename (inline edit on blur) → `renameSection`. Delete (with a confirm) → `deleteSection`; its drinks return to Unplaced in local state.

- [ ] **Step 4: Verify + commit**

Run: `npx tsc --noEmit`, `npx eslint src tests` (0 errors), `npm run test:unit`, `npm run build`.
```bash
git add src/components/pouriq/MenuBuilder.tsx
git commit -m "feat(pouriq): native drag-and-drop + section CRUD in the menu builder"
```

---

## Final

- [ ] `npx tsc --noEmit` clean; `npx eslint src tests` 0 errors; `npm run test:unit` green; `npm run build` green; `package.json`/lock/configs unchanged.
- [ ] Dispatch a final whole-branch review, then `superpowers:finishing-a-development-branch` to open the PR. PR body: notes the new table + column, that **migration 0058 must be applied to prod after merge**, that it depends on #844 (item_type) already being in main, and that no npm deps changed.
