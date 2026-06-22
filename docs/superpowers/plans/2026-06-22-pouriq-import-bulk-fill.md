# Import Preview Bulk-Fill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** When a user resolves one ingredient row in the import preview, auto-fill every other still-unresolved row for the same ingredient (keeping each drink's own pour/unit), so the needs-a-choice count drops in bulk.

**Architecture:** A pure `planBulkFill` helper decides which rows to fill and what to copy. `ImportPreview` precomputes a group key per row, and on a row's resolve-commit (existing-entry pick, or price-field blur via `PriceInput`/`IngredientMatchRow`) applies the plan with a functional `setDrinks` updater. No API/schema/commit change.

**Spec:** `docs/superpowers/specs/2026-06-22-pouriq-import-bulk-fill-design.md`
**Branch:** `feat/pouriq-bulk-fill-ingredients` (off origin/main)

---

### Task 1: Pure `planBulkFill` helper + tests

**Files:** Create `src/lib/pouriq/import-bulk-fill.ts`, `tests/unit/lib/pouriq-import-bulk-fill.test.ts`

- [ ] **Step 1: Helper.**

```ts
import type { MatchRowState } from '@/components/pouriq/IngredientMatchRow'

export interface BulkFillRow {
  groupKey: string | null   // null = auto-matched / ungrouped: never source or target
  resolved: boolean
  state: MatchRowState
}

// Given all rows and the index just resolved, return the indices of OTHER
// still-unresolved rows in the same group and the resolution to copy
// (ingredient identity only — never pour/unit). Null when nothing to do.
export function planBulkFill(rows: BulkFillRow[], sourceIndex: number): {
  targets: number[]
  apply: Pick<MatchRowState, 'existing_library_id' | 'new_library'>
} | null {
  const source = rows[sourceIndex]
  if (!source || !source.resolved || source.groupKey === null) return null
  const targets: number[] = []
  for (let i = 0; i < rows.length; i++) {
    if (i === sourceIndex) continue
    const r = rows[i]
    if (r.groupKey === source.groupKey && !r.resolved) targets.push(i)
  }
  if (targets.length === 0) return null
  return {
    targets,
    apply: {
      existing_library_id: source.state.existing_library_id,
      new_library: source.state.new_library,
    },
  }
}
```

- [ ] **Step 2: Tests.**

```ts
import { describe, it, expect } from 'vitest'
import { planBulkFill, type BulkFillRow } from '@/lib/pouriq/import-bulk-fill'

const priced = { name: 'Sugar Syrup', ingredient_type: 'syrup' as const, bottle_size_ml: 1000, bottle_cost_p: 500, unit_cost_p: null }
const row = (groupKey: string | null, resolved: boolean, state: Partial<BulkFillRow['state']> = {}): BulkFillRow => ({
  groupKey, resolved, state: { pour_ml: 25, unit_count: null, ...state },
})

describe('planBulkFill', () => {
  it('fills other unresolved rows in the same group, copying the ingredient', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('cat:syr', false),
      row('cat:syr', false),
    ]
    const plan = planBulkFill(rows, 0)
    expect(plan?.targets).toEqual([1, 2])
    expect(plan?.apply.new_library?.name).toBe('Sugar Syrup')
    // apply carries ingredient identity only, not pour/unit
    expect('pour_ml' in (plan?.apply ?? {})).toBe(false)
  })
  it('skips rows already resolved by hand', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('cat:syr', true, { existing_library_id: 'x' }),
      row('cat:syr', false),
    ]
    expect(planBulkFill(rows, 0)?.targets).toEqual([2])
  })
  it('leaves other groups untouched', () => {
    const rows = [
      row('cat:syr', true, { new_library: { ...priced } }),
      row('name:gin', false),
    ]
    expect(planBulkFill(rows, 0)?.targets).toEqual([])  // -> becomes null
  })
  it('returns null when nothing to fill', () => {
    expect(planBulkFill([row('cat:syr', true, { new_library: { ...priced } }), row('name:gin', false)], 0)).toBeNull()
  })
  it('returns null when the source is unresolved or ungrouped', () => {
    expect(planBulkFill([row('cat:syr', false), row('cat:syr', false)], 0)).toBeNull()
    expect(planBulkFill([row(null, true, { existing_library_id: 'x' }), row('cat:syr', false)], 0)).toBeNull()
  })
})
```
Note: the "leaves other groups untouched" case yields `targets: []` → the helper returns `null` (empty targets). Adjust that assertion to `toBeNull()`.

- [ ] **Step 3:** `npx tsc --noEmit && npm run test:unit` → pass. **Commit:** `feat(pouriq): planBulkFill helper for import-preview bulk-fill`

---

### Task 2: PriceInput commit-on-blur

**Files:** Modify `src/components/pouriq/PriceInput.tsx`

- [ ] **Step 1:** Add an optional `onCommit?: () => void` prop, called on blur (after the latest value has been emitted). Add to the `Props` interface and the input:

```tsx
  onCommit?: () => void
```
and on the `<input>`: `onBlur={() => onCommit?.()}`.

- [ ] **Step 2:** `npx tsc --noEmit` → clean (callers unaffected; prop optional). **Commit:** `feat(pouriq): PriceInput onCommit (blur) hook`

---

### Task 3: IngredientMatchRow resolve-commit callback

**Files:** Modify `src/components/pouriq/IngredientMatchRow.tsx`

- [ ] **Step 1:** Add optional prop `onResolvedCommit?: () => void` to `Props`.
- [ ] **Step 2:** Fire it on the two resolve actions:
  - In `pickExisting`, after `onChange(...)`, call `onResolvedCommit?.()` (picking an existing entry resolves instantly, no blur).
  - On both `PriceInput`s (unit and bottle cost), pass `onCommit={onResolvedCommit}` so leaving a now-priced field triggers propagation.
- [ ] **Step 3:** `npx tsc --noEmit` → clean. **Commit:** `feat(pouriq): IngredientMatchRow signals when a row is resolved`

---

### Task 4: Wire propagation in ImportPreview

**Files:** Modify `src/components/pouriq/ImportPreview.tsx`

- [ ] **Step 1: Import + group-key helper.** Add `import { normalise } from '@/lib/pouriq/match'`, `import { planBulkFill, type BulkFillRow } from '@/lib/pouriq/import-bulk-fill'`. Add a module-level helper:

```ts
function groupKeyFor(input: PreviewDrinkInput['ingredients'][0]): string | null {
  const m = input.match
  if (m.kind === 'catalogue') return `cat:${m.catalogue_id}`
  if (m.kind === 'suggestions' || m.kind === 'no-match') return `name:${normalise(input.extracted_name)}`
  return null // auto: already resolved, never grouped
}
```

- [ ] **Step 2: Resolved predicate.** Add (reusing the existing `newLibraryPriced`):

```ts
function isRowResolved(s: MatchRowState): boolean {
  if (s.existing_library_id) return true
  if (s.new_library) return newLibraryPriced(s.new_library)
  return false
}
```

- [ ] **Step 3: Propagation handler.** Inside `ImportPreview`, add a function that flattens current state, runs `planBulkFill`, and applies — using the functional `setDrinks` updater so it reads the latest state (the resolving `onChange` queued just before is already applied):

```ts
function propagateFrom(drinkIdx: number, ingIdx: number) {
  setDrinks((arr) => {
    // Build a flat list with a back-map to (drinkIdx, ingIdx).
    const flat: BulkFillRow[] = []
    const coords: Array<{ d: number; i: number }> = []
    arr.forEach((d, di) => {
      if (d.skip) return
      d.ingredients.forEach((st, ii) => {
        flat.push({
          groupKey: groupKeyFor(extracted[di].ingredients[ii]),
          resolved: isRowResolved(st),
          state: st,
        })
        coords.push({ d: di, i: ii })
      })
    })
    const sourcePos = coords.findIndex((c) => c.d === drinkIdx && c.i === ingIdx)
    if (sourcePos < 0) return arr
    const plan = planBulkFill(flat, sourcePos)
    if (!plan) return arr
    // Apply to each target, preserving its own pour/unit; deep-clone new_library.
    const next = arr.map((d) => ({ ...d, ingredients: d.ingredients.slice() }))
    for (const t of plan.targets) {
      const { d, i } = coords[t]
      const target = next[d].ingredients[i]
      next[d].ingredients[i] = {
        ...target,
        existing_library_id: plan.apply.existing_library_id,
        new_library: plan.apply.new_library ? { ...plan.apply.new_library } : undefined,
      }
    }
    return next
  })
}
```
(Note: skipped drinks are excluded from both source and targets — consistent with stats, which ignore skipped drinks.)

- [ ] **Step 4: Pass the callback to the row.** In the `IngredientMatchRow` render, add `onResolvedCommit={() => propagateFrom(idx, ingIdx)}`.

- [ ] **Step 5: Verify.** `npx tsc --noEmit && npx next lint && npm run build` → clean.
- [ ] **Step 6: Commit:** `feat(pouriq): bulk-fill repeated ingredients across the import preview`

---

### Task 5: Full verification + PR

- [ ] **Step 1:** `npm run test:unit` (planBulkFill + existing suites) → pass; `npm run build` → succeeds.
- [ ] **Step 2:** Push, open PR. Body: client-only preview UX; resolve one ingredient → others in the same group auto-fill (price/library copied, per-drink pour/unit preserved); triggers on existing-entry pick and price-field blur; no API/schema/commit change.
- [ ] **Step 3:** Watch CI green.
