# Pour IQ — Menu Sections / Section-Based Menu Builder (Batch 3, Piece 2)

Date: 2026-06-29
Status: Design agreed; ready for implementation plan.

## Goal

Turn the menu builder from an ephemeral flat print tool into a **section-based menu composer**: a venue arranges its drinks into custom, named, two-level sections (Cocktails → Signatures / Classics; Beer & Cider → Draught / Bottles), drag-and-drop, and the builder prints a real sectioned menu. Sections are persistent menu structure, auto-seeded from `item_type` so the venue starts ~80% done. This is the structural core of the "hand a designer a 90%-done menu" vision (`project_pouriq_menu_builder_vision`). Logo + fonts/colours styling are Piece 3.

**Depends on Piece 1 (`item_type`, PR #844).** Implementation must start after #844 is merged to main (the auto-seed reads `pouriq_cocktails.item_type`).

## Constraints

- **No new npm dependencies** (the #840 lock-file lesson). Drag-and-drop uses the native HTML5 Drag and Drop API, not a library.
- Light "Daylight" theme; no em-dashes in user copy. `unknown` not `any` in non-test code.

## Two-level model

- A menu has ordered top **sections**. A top section can optionally hold ordered **sub-sections**. Max two levels — no sub-sub-sections.
- A drink belongs to exactly one section OR one sub-section, or is **Unplaced** (no assignment).
- Sub-section drinks render under the sub-section; a section's own directly-assigned drinks render under the section heading, above its sub-sections.

## 1. Data model

- **New table** `pouriq_menu_sections`:
  - `id TEXT PRIMARY KEY`
  - `menu_id TEXT NOT NULL REFERENCES pouriq_menus(id) ON DELETE CASCADE`
  - `name TEXT NOT NULL`
  - `parent_section_id TEXT REFERENCES pouriq_menu_sections(id) ON DELETE CASCADE` — NULL = top section; set = sub-section (its parent must be a top section; enforced in code, not a 3rd level)
  - `position INTEGER NOT NULL DEFAULT 0` — order among siblings (top sections among top sections; sub-sections within their parent)
  - `created_at TEXT NOT NULL DEFAULT (datetime('now'))`
  - Index on `(menu_id)`.
- **New column** on `pouriq_cocktails`: `section_id TEXT REFERENCES pouriq_menu_sections(id) ON DELETE SET NULL` (NULL = unplaced). When a drink's section is deleted, SET NULL leaves it unplaced.
- Drink order within a section/sub-section reuses the existing `pouriq_cocktails.position` (ordered ascending within the same `section_id`).
- **Migration 0058** (next free number; verify at write time): create the table + add the column + indexes. Additive, no rebuild. Validate via node:sqlite.

## 2. Auto-seed (one-time, pure-planned)

- A pure planner `planSeededSections(drinks: {id, item_type}[])` → `{ sections: {tempId, name}[]; assignments: {cocktailId, tempId}[] }`, deterministic, unit-tested. It groups drinks by a section name derived from `item_type` via `itemTypeToSectionName`:
  - `cocktail`→"Cocktails", `beer`→"Beer & Cider", `cider`→"Beer & Cider", `wine`→"Wine", `spirit`→"Spirits", `soft-drink`→"Soft Drinks", `food`→"Food", `other`→"Other".
  - Section order: the order the names first appear in a fixed canonical list (Cocktails, Beer & Cider, Wine, Spirits, Soft Drinks, Food, Other).
  - No sub-sections are auto-created (the venue adds Signatures/Classics etc. themselves).
- A server action `ensureSeededSections(menuId)` runs the planner and inserts sections + sets `section_id` **only when the menu currently has zero sections**. Idempotent: never overwrites once any section exists. Called when the builder page loads.

## 3. Server actions (CRUD + arrangement)

All in `src/lib/pouriq/server-actions.ts` (or a focused `menu-sections` module if that file is already large — prefer a new `src/lib/pouriq/menu-sections.ts` for the data layer + thin actions), tenant-scoped via `checkPourIqAccess`, each `revalidatePath` the builder + menu detail paths:

- `createSection(menuId, name, parentSectionId | null)` — append at end of siblings.
- `renameSection(sectionId, name)`.
- `deleteSection(sectionId)` — ON DELETE CASCADE removes sub-sections; affected drinks' `section_id` SET NULL (so they return to Unplaced). 
- `reorderSections(parentScope, orderedIds)` — set `position` for a sibling set (top-level for a menu, or sub-sections of one parent).
- `moveDrink(cocktailId, sectionId | null, position)` — set `section_id` + `position`; re-sequence siblings as needed.

Keep position logic in small pure helpers (e.g. `resequence(ids)` → `{id, position}[]`) so it is unit-testable without the DB.

## 4. The builder UI (`MenuBuilder` rewrite)

`MenuBuilder` becomes a stateful editor fed by the page with `{ menu, sections, drinks (with section_id + item_type) }`.

- **Layout:** two panes (stacks on mobile). Left "Arrange", right live "Preview".
- **Arrange pane:** an "Unplaced" tray, then each top section (name inline-editable, drag handle, "+ sub-section", delete), its directly-assigned drinks, then its sub-sections (each with its drinks). "+ Add section" at the end.
- **Native HTML5 DnD:** drinks are `draggable`; drop targets are sections, sub-sections, and the Unplaced tray (`onDragOver` preventDefault + `onDrop`). Sections (and sub-sections within a parent) are draggable to reorder. On drop, update optimistic local state immediately, then call the matching server action; on failure, revert + show a small inline error. Provide a non-drag fallback for accessibility: each drink has a "Move to…" `<select>` of sections (keyboard-usable), and sections have up/down buttons.
- **Preview pane / print:** render title → for each top section: heading → its direct drinks → each sub-section (sub-heading → drinks). Each drink shows name, price (if shown), description (if shown). Respects the existing controls.
- **Keep existing controls:** menu title, 1/2 columns, show prices, show descriptions, Save as PDF (`window.print()`).
- Only the preview is inside the print region; the Arrange pane is `no-print`.

## Out of scope

- **Piece 3:** logo upload, fonts/colours/themes, templates.
- Grouping the profitability / matrix / spec-card views by section (future; sections just exist now). (Spec cards still filter by `item_type` from Piece 1, unchanged.)
- Sub-sub-sections; a drink in multiple sections.

## Testing

- **Unit:** `itemTypeToSectionName` (each mapping); `planSeededSections` (grouping, canonical order, empty menu, all-cocktail menu); `resequence`/position helpers; `ensureSeededSections` is a no-op when sections already exist (test the guard logic as a pure check where possible).
- **Migration:** node:sqlite validation — table + column + cascade/SET-NULL behaviour (delete a section → its drinks' section_id becomes NULL; delete a parent → sub-sections gone).
- **No jsdom component tests** (no new deps) — the DnD interactions are reasoned/manually verified; keep all real logic in pure helpers + server actions so it is unit-covered.
- Full `npm run test:unit` green; `npx tsc --noEmit` + `npx eslint src tests` 0 errors; `npm run build` green; `package.json`/lock/configs unchanged.

## Risks / notes

- This is the largest Piece. Keep the data layer (`menu-sections.ts`: queries + pure helpers) separate from the `MenuBuilder` component so each is testable and holdable in context.
- Native DnD is fiddlier than a library; the keyboard `<select>` fallback both aids accessibility and de-risks the drag implementation.
- Persisting on every drop is fine at menu scale (tens of drinks); no batching needed.
- After merge, **migration 0058 must be applied to prod**; no npm deps changed.
