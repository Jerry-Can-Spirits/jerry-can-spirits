# Pour IQ Import Picker (E2E Batch 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user pick from their existing library on every import row (cocktail recipe lines, menu-import rows, invoice rows) via one shared searchable select, instead of being forced to create duplicates — and compute cocktail costs from the real priced ingredient.

**Architecture:** Extract the search-and-pick core of `IngredientPicker` into a shared `LibrarySearchSelect` component; wire it into `IngredientMatchRow` (menu import + cocktail recipe lines) and `InvoiceLineRow` (invoice). Each surface keeps its own create/staging form (immediate-save for the library picker, staged-draft for import rows). Tighten the deterministic matcher (accent-fold; single-containment pre-select) so obvious cases pre-select, and add the cost-side VAT toggle to the menu-import staging form to close the third `price_p` writer.

**Tech Stack:** Next.js 15 (App Router) client components, TypeScript, Tailwind 4, Cloudflare D1, Vitest (`npm run test:unit`).

**Spec:** `docs/superpowers/specs/2026-06-29-pouriq-import-picker-design.md`

**Branch:** `feat/pouriq-import-picker` (already created off origin/main; the spec is committed there).

**Conventions to follow:**
- Light "Daylight" theme classes from `src/lib/pouriq/ui.ts` / existing component class consts (white surfaces, `emerald-*` accents, `slate-*` text). No em-dashes in user-facing copy.
- Tests live under `tests/unit/...`. Run a single file with `npx vitest run tests/unit/lib/<file>.test.ts`.
- After each task: `npm run test:unit` green, then commit. `npm run build` at the end of the plan (no runtime/route-shape changes that affect OpenNext, but the VAT route change in Task 8 must build).

---

## File Structure

- `src/lib/pouriq/match.ts` — MODIFY: accent-fold in `normalise`; add `singleContainmentMatch` helper.
- `src/components/pouriq/LibrarySearchSelect.tsx` — CREATE: shared searchable library dropdown (input + ranked matches + adopt-catalogue + create-new triggers). Selection UI only; no persistence.
- `src/components/pouriq/IngredientPicker.tsx` — MODIFY: use `LibrarySearchSelect` for its search/pick list; keep its immediate-create form. No behaviour change.
- `src/components/pouriq/IngredientMatchRow.tsx` — MODIFY: use `LibrarySearchSelect` for pick/suggestions/no-match; pre-select single-containment; keep staging form; add VAT toggle (Task 8).
- `src/components/pouriq/InvoiceLineRow.tsx` — MODIFY: same picker wiring for invoice rows.
- `src/lib/pouriq/import-bulk-fill.ts` + `src/components/pouriq/ImportPreview.tsx` — MODIFY: exclude `spirit` lines from same-name propagation.
- `src/app/api/pouriq/import/commit/route.ts` — MODIFY: convert gross→net via `netPriceP` + store `price_includes_vat`/`price_entered_p` (Task 8).
- Tests: `tests/unit/lib/pouriq-ingredient-match.test.ts` (or the existing match test file), `tests/unit/lib/pouriq-import-bulk-fill.test.ts`, plus component tests where the repo already has them.

---

## Task 1: Accent-fold in `normalise` (fixes "Kahlúa" != "Kahlua")

**Files:**
- Modify: `src/lib/pouriq/match.ts` (function `normalise`, lines ~11-18)
- Test: the existing match unit test file (find via `grep -rl "normalise" tests/unit`)

- [ ] **Step 1: Write the failing test**

Add to the match test file:

```ts
import { normalise } from '@/lib/pouriq/match'

describe('normalise — accent folding', () => {
  it('folds diacritics so accented brands match their plain spelling', () => {
    expect(normalise('Kahlúa')).toBe('kahlua')
    expect(normalise('Crème de Cassis')).toBe('creme de cassis')
  })
  it('leaves unaccented names unchanged', () => {
    expect(normalise('Absolut Vodka')).toBe('absolut vodka')
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-ingredient-match.test.ts`
Expected: FAIL — `normalise('Kahlúa')` returns `'kahlúa'`.

- [ ] **Step 3: Implement**

In `normalise`, add NFD decomposition + combining-mark stripping immediately after `.toLowerCase()`:

```ts
export function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics. IMPLEMENTER: write the regex using the escaped range u0300 to u036f, i.e. backslash-u-0300 hyphen backslash-u-036f inside the char class, NOT literal combining marks.
    .replace(/['.,]/g, '')
    .replace(/\b(\d+\s?(?:ml|cl|l|oz))\b/g, '') // strip size suffixes like "70cl"
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 4: Run the full unit suite**

Run: `npm run test:unit`
Expected: PASS, including all pre-existing matcher tests (accent-folding must not regress any).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/match.ts tests/unit/lib/pouriq-ingredient-match.test.ts
git commit -m "fix(pouriq): accent-fold in normalise so Kahlua matches Kahlua"
```

---

## Task 2: `singleContainmentMatch` helper (pre-select one unambiguous library match)

A confident pre-select for rows where the deterministic matcher would only return *suggestions* but there is exactly ONE library entry whose significant tokens fully contain (or are contained by) the line's tokens (e.g. library "Absolut" vs invoice "Absolut Vodka"). Keeps `matchIngredient`'s `auto` contract unchanged; this is an additive helper used by the rows.

**Files:**
- Modify: `src/lib/pouriq/match.ts`
- Test: `tests/unit/lib/pouriq-ingredient-match.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { singleContainmentMatch } from '@/lib/pouriq/match'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

const lib = (id: string, name: string): IngredientLibraryRow =>
  ({ id, name, ingredient_type: 'spirit', base_unit: 'ml', pack_size: 700, price_p: 1500,
     trade_account_id: 't', price_includes_vat: 0, price_entered_p: 1500, pack_format: null,
     subcategory: null, is_prepared: 0, purchase_qty: 1, yield_pct: 100, barcode: null,
     notes: null, created_at: '', updated_at: '' } as IngredientLibraryRow)

describe('singleContainmentMatch', () => {
  it('returns the sole entry whose tokens are contained by the line', () => {
    const library = [lib('1', 'Absolut'), lib('2', 'Beefeater')]
    expect(singleContainmentMatch('Absolut Vodka', library)?.id).toBe('1')
  })
  it('returns null when two entries both contain (ambiguous)', () => {
    const library = [lib('1', 'Gordon\'s Gin'), lib('2', 'Gordon\'s Pink Gin')]
    expect(singleContainmentMatch('Gordon\'s', library)).toBeNull()
  })
  it('returns null when nothing is a clean containment', () => {
    const library = [lib('1', 'Lime Juice')]
    expect(singleContainmentMatch('Lemon Juice', library)).toBeNull()
  })
  it('returns null when an exact auto-match already exists (leave to matchIngredient)', () => {
    const library = [lib('1', 'Absolut Vodka')]
    expect(singleContainmentMatch('Absolut Vodka', library)).toBeNull()
  })
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-ingredient-match.test.ts`
Expected: FAIL — `singleContainmentMatch` is not exported.

- [ ] **Step 3: Implement**

Add to `match.ts` (reuse `significantTokens`/`tokenKey`):

```ts
// One unambiguous containment match for UI pre-selection. Returns the sole
// library entry whose significant tokens fully contain, or are contained by,
// the line's tokens — but NOT an exact token-set equal (that is matchIngredient's
// `auto` job) and NOT when more than one entry qualifies (ambiguous → user picks).
export function singleContainmentMatch(
  extractedName: string,
  library: IngredientLibraryRow[],
): IngredientLibraryRow | null {
  const t = significantTokens(extractedName)
  if (t.length === 0) return null
  const tKey = tokenKey(t)
  const tSet = new Set(t)
  const hits: IngredientLibraryRow[] = []
  for (const e of library) {
    const c = significantTokens(e.name)
    if (c.length === 0) continue
    if (tokenKey(c) === tKey) return null // exact equal exists → not our job
    const cSet = new Set(c)
    const contains = t.every((x) => cSet.has(x)) || c.every((x) => tSet.has(x))
    if (contains) hits.push(e)
    if (hits.length > 1) return null
  }
  return hits.length === 1 ? hits[0] : null
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/match.ts tests/unit/lib/pouriq-ingredient-match.test.ts
git commit -m "feat(pouriq): singleContainmentMatch helper for confident pre-select"
```

---

## Task 3: Extract `LibrarySearchSelect` shared component

The shared search-and-pick core: a text input that opens a dropdown of the tenant's library, ranked with `inferredType` matches first, plus an optional "Adopt <catalogue name>" row and a "+ Create new" row. Pure selection UI — it persists nothing. Modelled on the dropdown already in `IngredientPicker.tsx` (lines ~187-240): the input + the `open && !showCreate` matches list.

**Files:**
- Create: `src/components/pouriq/LibrarySearchSelect.tsx`
- Test: `tests/unit/components/pouriq-library-search-select.test.tsx` (create; follow any existing component test setup — check for `tests/unit/components/*.test.tsx` and reuse its render/import pattern. If the repo has no component-test harness, make this a thin render smoke test with `@testing-library/react` which is already a dependency.)

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { LibrarySearchSelect } from '@/components/pouriq/LibrarySearchSelect'

const entries = [
  { id: '1', name: 'Gordon\'s London Dry', ingredient_type: 'spirit' },
  { id: '2', name: 'Lemon Juice', ingredient_type: 'juice' },
] as any

test('filters library and fires onPick', () => {
  const onPick = vi.fn()
  render(<LibrarySearchSelect libraryEntries={entries} onPick={onPick} onRequestCreate={() => {}} />)
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gor' } })
  fireEvent.click(screen.getByText(/Gordon's London Dry/))
  expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
})

test('shows create-new option', () => {
  render(<LibrarySearchSelect libraryEntries={entries} onPick={() => {}} onRequestCreate={() => {}} />)
  fireEvent.focus(screen.getByRole('textbox'))
  expect(screen.getByText(/Create new/)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/components/pouriq-library-search-select.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the component**

Create `LibrarySearchSelect.tsx`. Interface:

```tsx
'use client'
import { useId, useMemo, useRef, useState, useEffect } from 'react'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

interface Props {
  libraryEntries: Array<Pick<IngredientLibraryRow, 'id' | 'name' | 'ingredient_type'>>
  onPick: (entry: { id: string; name: string; ingredient_type: IngredientType }) => void
  onRequestCreate: (query: string) => void
  inferredType?: IngredientType
  catalogueSuggestion?: { id: string; name: string } | null
  onAdoptCatalogue?: () => void
  placeholder?: string
  initialQuery?: string
}
```

Behaviour (port from `IngredientPicker` lines 51-57, 59-72, 187-240):
- Filter `libraryEntries` by case-insensitive substring of `query`; when `inferredType` is set, sort entries of that type before others; cap at 20.
- Click-outside closes the dropdown (the existing `useEffect` containment pattern).
- Dropdown rows: each library match shows `name` + a muted `ingredient_type`; calls `onPick`. If `catalogueSuggestion` is set, render an "Adopt: <name> — set your price" row that calls `onAdoptCatalogue`. Always render a final "+ Create new ingredient: \"<query>\"" row calling `onRequestCreate(query)`.
- Use the existing class consts (`inputClass`, dropdown classes) copied from `IngredientPicker` for visual parity.

- [ ] **Step 4: Run the test**

Run: `npx vitest run tests/unit/components/pouriq-library-search-select.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pouriq/LibrarySearchSelect.tsx tests/unit/components/pouriq-library-search-select.test.tsx
git commit -m "feat(pouriq): LibrarySearchSelect shared searchable library dropdown"
```

---

## Task 4: Refactor `IngredientPicker` to use `LibrarySearchSelect` (no behaviour change)

**Files:**
- Modify: `src/components/pouriq/IngredientPicker.tsx`
- Test: existing `IngredientPicker` tests if present (find via `grep -rl IngredientPicker tests/unit`); otherwise a render smoke test.

- [ ] **Step 1: Characterisation test (lock current behaviour)**

If no test exists, add a smoke test: rendering with `selectedEntryId` shows the selected name; focusing shows library options; clicking an option calls `onChange`. Run it green against the CURRENT component first so it is a true characterisation.

- [ ] **Step 2: Refactor**

Replace the inline search input + `open && !showCreate` matches block (lines ~189-240) with `<LibrarySearchSelect>`, passing `libraryEntries`, `onPick={selectEntry}`, `onRequestCreate={(q) => { setShowCreate(true); setName(q) }}`. Keep the Scan button, the `showCreate` inline-create form, and `handleScan`/`handleCreate` exactly as-is. `selectEntry` already calls `onChange`.

- [ ] **Step 3: Run tests**

Run: `npm run test:unit`
Expected: PASS (cocktail editor behaviour unchanged).

- [ ] **Step 4: Commit**

```bash
git add src/components/pouriq/IngredientPicker.tsx tests/unit
git commit -m "refactor(pouriq): IngredientPicker uses LibrarySearchSelect (no behaviour change)"
```

---

## Task 5: Wire the picker into `IngredientMatchRow` (menu import + cocktail recipe lines)

This delivers #9, #10. The row currently: shows a `matchBadge`, a suggestion list for `suggestions`, and a staged-create form for `new_library`. Add a full library search/pick via `LibrarySearchSelect` for the `suggestions` / `no-match` states, and pre-select a single-containment match.

**Files:**
- Modify: `src/components/pouriq/IngredientMatchRow.tsx`
- Modify: `src/components/pouriq/ImportPreview.tsx` (pass `singleContainmentMatch` result + `libraryEntries` already passed)
- Test: `tests/unit/components/pouriq-ingredient-match-row.test.tsx` (create or extend)

- [ ] **Step 1: Write the failing test**

```tsx
// A no-match row lets the user search the library and pick an existing entry,
// setting existing_library_id (not staging a new entry).
test('no-match row can pick an existing library entry', () => {
  const onChange = vi.fn()
  render(<IngredientMatchRow {...baseProps} matchKind="no-match"
    libraryEntries={[{ id: '9', name: 'Gordon\'s London Dry', ingredient_type: 'spirit' } as any]}
    state={{ pour_ml: 50, unit_count: null, recipe_unit: null, recipe_qty: null }}
    onChange={onChange} />)
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gor' } })
  fireEvent.click(screen.getByText(/Gordon's London Dry/))
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ existing_library_id: '9' }))
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/components/pouriq-ingredient-match-row.test.tsx`
Expected: FAIL — no searchable picker in the row.

- [ ] **Step 3: Implement**

In `IngredientMatchRow`, for states without an existing pick and without an active `new_library` staging form, render `<LibrarySearchSelect>`:
- `libraryEntries={libraryEntries}`, `inferredType={inferredType}`.
- `onPick={(e) => onChange({ existing_library_id: e.id, pour_ml: state.pour_ml, unit_count: state.unit_count, recipe_unit: state.recipe_unit, recipe_qty: state.recipe_qty }); onResolvedCommit?.()`.
- `onRequestCreate={(q) => startNewLibrary(q)}` — extend `startNewLibrary` to accept an optional name (default `extractedName`).
- Keep the existing `suggestions` quick-pick chips (if present) as a convenience above the search, or remove them in favour of the unified search (prefer the unified search to avoid two pick UIs).
- When the `new_library` staging form is shown, keep it (with the existing PriceInput + the Task-8 VAT toggle) and a "search instead" affordance to return to `LibrarySearchSelect`.

In `ImportPreview.tsx`, pre-select a single-containment match when the extract returned `suggestions`/`no-match`: in `initialIngredientState`, after the `auto`/`catalogue` branches, call `singleContainmentMatch(input.extracted_name, libraryEntries)`; if non-null, seed `existing_library_id` to it (still overridable). NOTE: `libraryEntries` must be in scope in `initialIngredientState` — thread it in (it is a prop of `ImportPreview`; pass it through `initialDrinkState`/`initialIngredientState`).

- [ ] **Step 4: Run tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pouriq/IngredientMatchRow.tsx src/components/pouriq/ImportPreview.tsx tests/unit
git commit -m "feat(pouriq): searchable library pick + single-containment pre-select on menu-import rows"
```

---

## Task 6: Exclude `spirit` lines from same-name propagation

Per the design: an identical extracted name fills sibling rows EXCEPT when the line's inferred type is `spirit` (a gin could be Gordon's in one cocktail, Sipsmith in another).

**Files:**
- Modify: `src/components/pouriq/ImportPreview.tsx` (`groupKeyFor`, lines ~46-51) and/or `src/lib/pouriq/import-bulk-fill.ts`
- Test: `tests/unit/lib/pouriq-import-bulk-fill.test.ts` (extend) — and confirm `groupKeyFor` is reachable for unit test; if it is local to `ImportPreview`, move it into `import-bulk-fill.ts` and import it, so it is testable.

- [ ] **Step 1: Write the failing test**

```ts
// groupKeyFor (moved to import-bulk-fill.ts) returns null for spirit lines so
// they never propagate; non-spirit identical names still group.
import { groupKeyFor } from '@/lib/pouriq/import-bulk-fill'

test('spirit lines do not group (picked per cocktail)', () => {
  expect(groupKeyFor({ extracted_name: 'Gin', inferred_type: 'spirit', match: { kind: 'no-match' } } as any)).toBeNull()
})
test('non-spirit identical names group', () => {
  expect(groupKeyFor({ extracted_name: 'Lemon Juice', inferred_type: 'juice', match: { kind: 'no-match' } } as any))
    .toBe('name:lemon juice')
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-import-bulk-fill.test.ts`
Expected: FAIL — `groupKeyFor` not exported from `import-bulk-fill.ts`, or spirit not excluded.

- [ ] **Step 3: Implement**

Move `groupKeyFor` into `import-bulk-fill.ts` (export it) and import it in `ImportPreview.tsx`. Add the spirit guard at the top:

```ts
export function groupKeyFor(input: { extracted_name: string; inferred_type: IngredientType; match: { kind: string; catalogue_id?: string } }): string | null {
  if (input.inferred_type === 'spirit') return null // picked per cocktail; never propagate
  const m = input.match
  if (m.kind === 'catalogue') return `cat:${m.catalogue_id}`
  if (m.kind === 'suggestions' || m.kind === 'no-match') return `name:${normalise(input.extracted_name)}`
  return null
}
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/import-bulk-fill.ts src/components/pouriq/ImportPreview.tsx tests/unit/lib/pouriq-import-bulk-fill.test.ts
git commit -m "feat(pouriq): exclude spirit lines from same-name propagation"
```

---

## Task 7: Wire the picker into `InvoiceLineRow` (invoice; delivers #4)

**Files:**
- Modify: `src/components/pouriq/InvoiceLineRow.tsx`
- Modify: `src/components/pouriq/InvoicePreview.tsx` (single-containment pre-select, mirroring Task 5)
- Test: `tests/unit/components/pouriq-invoice-line-row.test.tsx` (create or extend)

- [ ] **Step 1: Write the failing test**

```tsx
test('invoice row can pick an existing library entry (no duplicate)', () => {
  const onChange = vi.fn()
  render(<InvoiceLineRow {...baseInvoiceProps} matchKind="no-match"
    libraryEntries={[{ id: '5', name: 'Kahlua', ingredient_type: 'liqueur' } as any]}
    onChange={onChange} />)
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'kah' } })
  fireEvent.click(screen.getByText(/Kahlua/))
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ existing_library_id: '5' }))
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `npx vitest run tests/unit/components/pouriq-invoice-line-row.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Mirror Task 5 in `InvoiceLineRow`: render `<LibrarySearchSelect>` for non-resolved rows; `onPick` sets `existing_library_id` (the existing invoice commit already treats an existing pick as a price-change to that entry — verify in `src/app/api/pouriq/invoices/commit/route.ts` and do not change it); `onRequestCreate` opens the row's existing staging form. In `InvoicePreview.tsx`, pre-select `singleContainmentMatch` for `suggestions`/`no-match` lines (thread `libraryEntries` into the initial-state builder as in Task 5).

- [ ] **Step 4: Run tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pouriq/InvoiceLineRow.tsx src/components/pouriq/InvoicePreview.tsx tests/unit
git commit -m "feat(pouriq): searchable library pick + pre-select on invoice rows (fixes invoice/library mismatch)"
```

---

## Task 8: Menu-import cost-side VAT toggle (closes the third price_p writer)

**Files:**
- Modify: `src/components/pouriq/IngredientMatchRow.tsx` (staging form: add Inc/Ex toggle, default Ex)
- Modify: `src/components/pouriq/ImportPreview.tsx` (carry the basis in `MatchRowState.new_library` and the commit payload)
- Modify: `src/app/api/pouriq/import/commit/route.ts` (convert gross→net + store basis)
- Reference: how the invoice flow does it — `src/app/api/pouriq/invoices/commit/route.ts` and `netPriceP` in `src/lib/pouriq/calculations.ts`
- Test: `tests/unit/lib/...` for the conversion (call `netPriceP`); extend the route's existing test if present.

- [ ] **Step 1: Write the failing test (conversion contract)**

```ts
import { netPriceP } from '@/lib/pouriq/calculations'
test('gross 1440 inc VAT stores as net 1200', () => {
  expect(netPriceP(1440, true)).toBe(1200)   // confirm signature against calculations.ts first
})
```
(Use this to confirm the helper's exact signature; adjust the test to match it. The real change is wiring, covered by Step 3 + the route.)

- [ ] **Step 2: Implement the UI**

In `IngredientMatchRow`'s staging form, beside `Price paid (£)`, add an Inc/Ex VAT toggle defaulting to **Ex**, matching the library form / `InvoiceLineRow` pattern. Add `price_includes_vat: boolean` and keep the typed gross in `MatchRowState.new_library`. The helper line added in PR #835 stays.

- [ ] **Step 3: Implement the commit conversion**

In `import/commit/route.ts`, where a new library entry is created from a staged `new_library`, convert the entered price to net via `netPriceP(entered, includesVat)`, store `price_p` = net, `price_includes_vat`, and `price_entered_p` = the gross typed — mirroring `invoices/commit/route.ts`. Do not change the GP calculation.

- [ ] **Step 4: Run tests + build**

Run: `npm run test:unit && npm run build`
Expected: PASS (build must succeed; this touches an API route).

- [ ] **Step 5: Commit**

```bash
git add src/components/pouriq/IngredientMatchRow.tsx src/components/pouriq/ImportPreview.tsx src/app/api/pouriq/import/commit/route.ts tests/unit
git commit -m "feat(pouriq): cost-side VAT toggle on menu-import (closes the third price_p writer)"
```

---

## Task 9: Keg/serve cost basis (#8) — conditional fold-in

**Files:**
- Investigate first: `grep -rn "pour_ml\|serve\|pint\|half\|pack_size" src/lib/pouriq/calculations.ts src/components/pouriq/` to locate how a serve variant (pint/half of a keg) derives its cost.

- [ ] **Step 1: Investigate**

Determine whether half/pint serves of one keg derive their per-serve cost from the parent ingredient's `price_p`/`purchase_qty`/`pack_size`, or whether they carry an independent "how many does it buy" that can drift. Write findings in the commit message / PR.

- [ ] **Step 2: Decide**

- If the fix is contained (serve variants reference the parent ingredient's purchase basis and only the pour size differs): write a failing test for "half and pint of the same keg yield proportional, consistent per-serve cost", implement, commit.
- If it requires a broader serve-model change: STOP, do NOT implement here. Note it in the PR description as a follow-up and leave Task 9 unchecked. (This is the agreed escape hatch — it must not block Tasks 1-8.)

- [ ] **Step 3: Commit (only if contained)**

```bash
git add -A
git commit -m "fix(pouriq): serve variants of one keg share its purchase basis"
```

---

## Final

- [ ] `npm run test:unit` — all green.
- [ ] `npm run build` — green.
- [ ] Dispatch a final whole-branch review (spec compliance + quality), then use `superpowers:finishing-a-development-branch` to open the PR. PR body must list: what shipped (picker on 3 surfaces, accent-fold, pre-select, spirit-exclusion, VAT toggle), the #8 decision (folded in or deferred), and that no migration is required.
