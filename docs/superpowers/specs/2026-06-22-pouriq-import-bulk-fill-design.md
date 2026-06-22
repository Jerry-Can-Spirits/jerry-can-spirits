# Pour IQ: Import Preview Bulk-Fill — Design

**Date:** 2026-06-22
**Status:** Approved

## Problem

A menu import can produce ~180 ingredient rows needing a price/choice, and common ingredients repeat heavily — 8 drinks all use simple syrup, many use gin, etc. Today each row is resolved independently, so a user types the same price 8 times. (At commit, duplicates already collapse to one library row by name — and in fact only the *first* duplicate's price is kept, the rest ignored — so the repeated typing is pure wasted effort.)

## Solution

When a row in the import preview becomes **resolved**, auto-apply its resolution to every other **still-unresolved** row for the **same ingredient**, so the "needs a price/choice" count drops in bulk as the user works down the list. Entirely client-side in the preview; no API, schema, or commit change.

## Decisions (from brainstorming)

- **Group by resolved ingredient identity**, not literal menu wording — so catalogue spelling variants ("simple syrup" / "sugar syrup", both → catalogue *Sugar Syrup*) fill together.
- **Automatic**, filling only still-unresolved rows; never overwrite a row the user has already resolved.
- **Propagate the ingredient resolution** (the chosen existing library entry, or the new_library definition incl. price/type/size). **Do not** propagate the per-drink **pour_ml / unit_count** — those legitimately differ per drink (catalogue defaults remain for the user to glance-confirm).
- **Trigger on field blur/commit**, not on every keystroke, so propagation doesn't fire mid-typing (e.g. after "2" before "2.50").

## Architecture

### Group key — derived once per preview row

Computed from the extract match (stable for the row's lifetime):
- `match.kind === 'catalogue'` → `cat:<catalogue_id>`
- `match.kind === 'suggestions' | 'no-match'` → `name:<normalise(extracted_name)>`
- `match.kind === 'auto'` → no group key (already resolved; never a source or target of propagation)

`normalise` is the existing helper exported from `src/lib/pouriq/match.ts`.

### Resolution check (reuse existing logic)

A row is **resolved** when `existing_library_id` is set, or `new_library` is present and `newLibraryPriced(new_library)` is true (the helper already in `ImportPreview.tsx`). Unresolved = everything else (incl. a catalogue row whose price is still blank).

### Pure helper — `propagateResolution`

New pure function (own module `src/lib/pouriq/import-bulk-fill.ts` so it is unit-testable without React):

```ts
import type { MatchRowState } from '@/components/pouriq/IngredientMatchRow'

export interface BulkFillRow {
  groupKey: string | null      // null = no group (auto-matched); never targeted
  resolved: boolean
  state: MatchRowState
}

// Given the flat list of all ingredient rows across all drinks and the index
// of the row the user just resolved, return the indices to auto-fill and the
// resolution to copy. Copies the source's existing_library_id OR new_library
// (deep-cloned); callers keep each target's own pour_ml / unit_count.
export function planBulkFill(rows: BulkFillRow[], sourceIndex: number): {
  targets: number[]
  apply: Pick<MatchRowState, 'existing_library_id' | 'new_library'>
} | null
```
Logic: the source must be resolved and have a non-null `groupKey`; targets are all **other** rows with the same `groupKey` that are **not** resolved. Returns null when nothing to do.

### Wiring in `ImportPreview`

- Precompute `groupKey` per `(drinkIdx, ingIdx)` from `extracted[].ingredients[].match` once.
- `IngredientMatchRow` gains an `onResolvedCommit` callback fired when the user finishes a resolving action: selecting an existing entry, or **blurring the price field** of a new entry that is now priced. (The price field is the `PriceInput` we just shipped; add an `onBlur`/commit hook, or fire from the row when its state transitions to resolved on blur.)
- On that callback, `ImportPreview` flattens its `drinks[].ingredients[]` to `BulkFillRow[]`, calls `planBulkFill`, and for each target index applies `{ ...target, ...apply }` (deep-cloning `new_library`) while preserving the target's `pour_ml` / `unit_count`. State updates via the existing `setDrinks`.
- The stats counter (`matched` / `toCreate` / `needsChoice`) recomputes from state as it already does, so the count visibly drops.

### What does NOT change

Commit route, API, schema, the catalogue, `PriceInput`. Auto-matched rows and already-resolved rows are untouched. Per-drink amounts are never propagated.

## Testing

Unit (`tests/unit/lib/pouriq-import-bulk-fill.test.ts`) on `planBulkFill`:
- Resolving a catalogue row fills other unresolved rows with the same `cat:` key, copying `new_library`; targets keep their own pour/unit (caller responsibility — assert the returned `apply` omits pour/unit).
- A row already resolved by hand is **not** in `targets`.
- Rows in a different group are untouched.
- A source with a `name:` group fills same-name unresolved rows.
- Returns null when the source is unresolved or has no group.

`npx tsc --noEmit`, `npx next lint`, `npm run build`, `npm run test:unit`.

## Out of scope

- Propagating pour/unit amounts.
- A "review what was auto-filled" panel / undo (chosen: automatic, only-untouched, no toast).
- Cross-import memory (this is within a single preview session).

## No migration

Pure client-side preview behaviour + one pure helper.
