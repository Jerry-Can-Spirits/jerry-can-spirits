# Pour IQ Inline Cost-Change Ripple — Design Spec

**Status:** Spec — not yet implemented. Sequenced as the next Pour IQ post-pilot enhancement after Square POS volume ingestion.

**Why:** Pour IQ already ships a complete cost-change ripple analysis as a "what-if" sandbox at `/trade/pouriq/library/what-if` — the bar manager picks an ingredient, types a hypothetical new cost, and sees per-menu GP impact. But when the same bar manager goes to the ingredient's edit page and saves an actual new cost, the change commits silently. They never see that vodka going from £20 to £25 just pushed four drinks below their target GP. The ripple analysis exists; it's just not in the path of real cost changes.

**Scope discipline:** This spec is *only* the inline ripple on the existing ingredient cost edit flow. Two related ripple features are deliberately out of scope and noted as future work: (1) historical cost-drift tracking ("vodka is up 15% over 3 months — your Negroni's GP dropped from 71% to 66%"), and (2) multi-ingredient combined ripple (for the upcoming AI invoice scanning feature, where a single invoice update mutates 12 prices at once).

---

## Concepts

**Ripple.** The cascade of GP changes across every cocktail when one ingredient's cost changes. Already computed by `src/lib/pouriq/cost-impact.ts`.

**Newly below target.** A cocktail whose GP would cross from ≥ target to < target as a result of the cost change. Distinguished from "already below target" (where the change didn't push it across the line). Only newly-below-target drinks trigger the confirm modal.

**Hybrid preview/gate model.** Inline preview is always shown when there is usage; the confirm modal only interrupts the save flow when at least one drink would be newly below target. Zero friction for safe changes; friction only where it matters.

---

## What already exists

| Asset | Where | What it does |
|---|---|---|
| Calc functions | `src/lib/pouriq/cost-impact.ts` | `projectCocktail`, `rollupByMenu`, `newIngredientContributionP`, `pricingMode` — pure, deterministic |
| Impact endpoint | `src/app/api/pouriq/library/[id]/impact/route.ts` | Returns the affected cocktails with current pour cost + this ingredient's contribution for client-side recomputation |
| Sandbox page | `src/app/trade/pouriq/library/what-if/page.tsx` | Ingredient picker + impact rendering for "I'm thinking of switching suppliers" exploration |
| Ripple UI | `src/components/pouriq/CostImpactPanel.tsx` | Fetches its own data, owns its own cost-input field, renders rollup cards + drilldown tables |

The calculation and data layers are solid. The gap is purely on the UI side — `CostImpactPanel` is structured for the standalone what-if page, not for embedding in another form.

---

## Architecture: two PRs

### PR 1 — `refactor/pouriq-extract-ripple-preview` (no behaviour change)

Extract the presentational pieces of `CostImpactPanel` into a new component that takes pre-computed projection data as props.

**New:** `src/components/pouriq/RipplePreview.tsx`

```ts
interface RipplePreviewProps {
  ingredient: ImpactIngredient
  projected: ProjectedCocktail[]
  rollups: MenuRollup[]
  currentP: number
  newCostP: number
  mode: 'bottle' | 'unit'
  emptyMessage?: string  // override default "isn't used in any drinks yet" copy
}
```

`RipplePreview` is pure — no fetch, no `useEffect`, no internal state. It renders the rollup cards grid and the per-menu drilldown tables exactly as `CostImpactPanel` does today.

**Changed:** `src/components/pouriq/CostImpactPanel.tsx` — becomes a thin wrapper that:
- Owns the impact data fetch (existing `useEffect`)
- Owns the cost input field for the what-if page (existing input)
- Computes `projected` + `rollups` via `cost-impact.ts` helpers
- Renders `<RipplePreview>` with the computed data

**No changes to:** `cost-impact.ts`, `/api/.../impact/route.ts`, the what-if page route, the page-level UX. The `/trade/pouriq/library/what-if` page renders identically before and after.

### PR 2 — `feat/pouriq-inline-cost-ripple` (the feature)

Wire the inline ripple, confirm modal, and post-save toast into the ingredient edit flow.

**Changed:** `src/components/pouriq/IngredientForm.tsx` and `src/app/trade/pouriq/library/[id]/edit/page.tsx`.

The edit page already fetches the entry + usage. It will now also fetch the impact payload once (using the same `GET /api/pouriq/library/[id]/impact` endpoint).

`IngredientForm` gains:
- A "preview" mode when `newCostP !== savedCostP` and the impact payload has at least one affected cocktail
- A `useMemo` that recomputes projection + rollups whenever `newCostP` changes
- `<RipplePreview>` rendered below the form fields
- A save handler that intercepts the submit, checks for newly-below-target drinks, and either opens the modal or calls `saveLibraryEntryAction` directly

The existing save path is a Next.js server action (`saveLibraryEntryAction` in `src/lib/pouriq/server-actions.ts`), not an HTTP endpoint. The interception is purely client-side — the gate decides whether to call the action immediately or wait for modal confirmation.

**New:** `src/components/pouriq/RippleConfirmModal.tsx`

```ts
interface RippleConfirmModalProps {
  isOpen: boolean
  ingredientName: string
  isFirstCost: boolean  // adapts copy when prior cost was null
  newlyBelowTarget: ProjectedCocktail[]
  onCancel: () => void
  onConfirm: () => void  // triggers commit (calls saveLibraryEntryAction)
}
```

Two buttons: **Cancel** and **Save**. The modal lists each newly-below-target drink with current → projected GP and the menu's target. Copy adapts for the first-cost case.

**New:** post-save toast. On successful commit, surface affected drinks as inline links. The toast contract:

```ts
interface CostUpdateToastData {
  ingredientName: string
  newlyBelowTarget: Array<{
    cocktailId: string
    cocktailName: string
    menuId: string
    menuName: string
    projectedGpPct: number
    targetGpPct: number
  }>
}
```

Implementation: reuse the existing toast mechanism if one exists in the codebase (check on entry to PR 2); otherwise add a minimal toast component scoped to this feature. The toast itself is a small adjacent decision — not central to the design — and the PR 2 plan will pick the approach based on what's already in use.

---

## Data flow (PR 2 — inline case)

```
User opens /trade/pouriq/library/[id]/edit
   │
   ▼
IngredientForm mounts with the saved entry
   │
   ├──► fetch /api/pouriq/library/[id]/impact  (once)
   │
   ▼
User edits the cost field → form state `newCostP` updates
   │
   ├──► useMemo recomputes projection + rollups
   │       (pure call to projectCocktail + rollupByMenu from cost-impact.ts)
   │
   ▼
<RipplePreview> renders below the form (if usage > 0 and newCostP differs)
   │
User clicks Save
   │
   ├─ Is any drink newly below target (below_target_after && !below_target_now)?
   │     │
   │     ├── YES → RippleConfirmModal opens
   │     │           ├── Cancel → close modal, no commit
   │     │           └── Save  → call saveLibraryEntryAction, close modal
   │     │
   │     └── NO → commit straight through
   │
   ▼
On successful commit
   │
   ├──► Toast renders with links to each newly-below-target drink
   │
   ▼
Page revalidates; impact payload refetched on next interaction
```

**Key point:** the impact endpoint is hit *once* per page load. All "as you type" recalculation happens client-side from the cached impact payload using the existing pure calc functions. No debouncing needed; no extra API traffic.

---

## Edge cases (in scope for PR 2)

| Case | Behaviour |
|---|---|
| Ingredient has no usage | Hide `<RipplePreview>` entirely. Save flows as today — no modal, no toast. |
| Impact API fetch fails | Show inline notice ("Couldn't load impact preview"). Save still works; no modal fires; no toast. |
| Save fails (network/5xx) | If modal open, show error inside modal and stay open. If no modal, surface error inline on the form (existing behaviour). No toast. |
| Cost equals saved cost | Preview shows "no change" via existing `currentP === newCostP` path. No modal triggers on save. |
| First-time cost (was null) | Modal fires if any drink would be below target with the new cost. Copy adapts: "Setting first cost for {ingredient} — N drinks will now reflect real pour costs." |
| User clicks Cancel in modal | Close modal. No commit. Cost field retains the typed value so the user can adjust. |
| Toast dismissed | Cost is committed; no further action required. Default lifetime ~6 s. |

## Edge cases acknowledged but out of scope

- **Concurrent edits race.** Another user updates the ingredient mid-edit; the impact payload becomes stale. Save succeeds but the ripple display may be slightly off. Same risk exists in the current edit flow — no regression. Defer to a broader optimistic-concurrency pass later.
- **Pricing mode switch mid-edit** (bottle ↔ unit). Treat as edge; the existing save flow handles it, the inline ripple may render stale during the switch. Acceptable for v1.
- **Multiple ingredients edited in one session.** A price change in one library item doesn't see "I just changed gin too" unless the user re-opens vodka. Combined-ripple is the future invoice-scanning feature.

---

## Testing

### PR 1 (refactor)

- Existing tests for `cost-impact.ts` calculations stay untouched and continue to pass — no pure logic moves.
- Manual visual confirmation: `/trade/pouriq/library/what-if` renders identically before and after the refactor.
- `tsc --noEmit` clean.

### PR 2 (inline ripple + modal + toast)

- **Unit:** pure function `getNewlyBelowTarget(projected: ProjectedCocktail[]): ProjectedCocktail[]` — filter logic for `below_target_after && !below_target_now`. Tested with synthetic projection arrays covering: all above, all newly below, mix, edge of target by 0.1pp, first-cost case.
- **Component:** render `<RippleConfirmModal>` with 0 / 1 / many newly-below-target drinks; verify Cancel and Save fire the correct callback; first-cost copy variant renders.
- **Manual integration:**
  - Edit cost with no usage → no panel, straight save, no toast
  - Edit cost with usage, all drinks stay above target → preview shows, save commits silently, no modal, no toast
  - Edit cost that drops a drink below target → preview shows; click Save → modal opens; click Cancel → no commit; click Save → commit + toast appears; toast link navigates to the right drink edit page
  - Impact API mocked to fail → form still saves cleanly; inline notice rendered

### CI

Both PRs go through standard CI (build + type-check). Branch off `origin/main`, PR review, merge after green. Follows the project branch-discipline rule (no commits to merged branches; fresh branch per PR).

---

## File-level change summary

### PR 1 — `refactor/pouriq-extract-ripple-preview`

| File | Change |
|---|---|
| `src/components/pouriq/RipplePreview.tsx` | **New.** Pure presentational component. |
| `src/components/pouriq/CostImpactPanel.tsx` | Refactored to delegate rendering to `<RipplePreview>`. Still owns fetch + cost input field. |

### PR 2 — `feat/pouriq-inline-cost-ripple`

| File | Change |
|---|---|
| `src/components/pouriq/IngredientForm.tsx` | Add inline ripple preview, save interception, modal trigger logic. |
| `src/app/trade/pouriq/library/[id]/edit/page.tsx` | Fetch impact payload server-side; pass to `IngredientForm`. |
| `src/components/pouriq/RippleConfirmModal.tsx` | **New.** Cancel/Save modal. |
| `src/components/pouriq/CostUpdateToast.tsx` *or equivalent* | **New** if no existing toast pattern; reuse if one exists. |
| `src/lib/pouriq/cost-impact.ts` | Add `getNewlyBelowTarget()` helper. Pure, tested. |

---

## Future work (not this spec)

1. **Historical cost-drift tracking.** Log every ingredient cost change over time; surface "vodka is up 15% over 3 months, Negroni's GP dropped from 71% to 66%" as a digest/notification. Needs a price-history table and a digest job. Worth pulling in once 2-3 venues have run on Pour IQ long enough for drift to be visible.

2. **Multi-ingredient combined ripple.** When the future AI invoice scanning feature updates many ingredient costs from one invoice, the ripple needs to be combined across all of them. Build this alongside the invoice scanning feature, not before — the UX only makes sense in that context.
