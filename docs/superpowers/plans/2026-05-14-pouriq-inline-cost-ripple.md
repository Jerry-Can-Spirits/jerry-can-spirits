# Pour IQ Inline Cost-Change Ripple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire Pour IQ's existing cost-change ripple analysis into the real ingredient cost-edit flow so bar managers see GP impact as they type, get a confirm gate when drinks would cross below target, and get a post-save toast linking to affected drinks.

**Architecture:** Two sequential PRs cut from `origin/main`. PR 1 is a no-behaviour-change refactor that extracts the presentational pieces of `CostImpactPanel` into a pure `RipplePreview` component. PR 2 plumbs that component into `IngredientForm`, adds a confirm modal, and adds a post-save toast that mirrors the existing `SocialProofToast` pattern.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Cloudflare D1, `@headlessui/react` for dialog primitives. No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-14-pouriq-inline-cost-ripple-design.md](../specs/2026-05-14-pouriq-inline-cost-ripple-design.md)

**Verification path (project reality):** `npm run lint`, `npm run build` (runs `tsc`), and manual integration checks against `npm run dev`. No unit test framework is installed; do not introduce one.

---

## Phase 1 — PR 1: Refactor `CostImpactPanel`

**Branch:** `refactor/pouriq-extract-ripple-preview` (already exists; the spec is already committed on it).

### Task 1: Create the pure `RipplePreview` component

**Files:**
- Create: `src/components/pouriq/RipplePreview.tsx`

- [ ] **Step 1: Create the file with the extracted JSX**

```tsx
import Link from 'next/link'
import type { MenuRollup, ProjectedCocktail } from '@/lib/pouriq/cost-impact'

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

interface Props {
  projected: ProjectedCocktail[]
  rollups: MenuRollup[]
  /** Override the default "isn't used in any drinks yet" empty-state copy. */
  emptyMessage?: string
}

export function RipplePreview({ projected, rollups, emptyMessage }: Props) {
  if (projected.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6 text-sm text-parchment-300">
        {emptyMessage ?? "This ingredient isn’t used in any drinks yet. Add it to a cocktail to see the impact."}
      </div>
    )
  }

  const projectedByMenu = new Map<string, ProjectedCocktail[]>()
  for (const p of projected) {
    if (!projectedByMenu.has(p.menu_id)) projectedByMenu.set(p.menu_id, [])
    projectedByMenu.get(p.menu_id)!.push(p)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rollups.map((r) => {
          const gpDelta = r.projected_avg_gp_pct - r.current_avg_gp_pct
          return (
            <div key={r.menu_id} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
              <Link href={`/trade/pouriq/${r.menu_id}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
                {r.menu_name}
              </Link>
              <p className="text-xs text-parchment-400 mt-1">Target {r.menu_target_gp_pct}% · {r.cocktail_count} drink{r.cocktail_count === 1 ? '' : 's'}</p>
              <p className="text-sm mt-3 text-parchment-200">
                Avg GP: {formatPct(r.current_avg_gp_pct)}{' → '}
                <strong className={gpDelta < 0 ? 'text-amber-300' : gpDelta > 0 ? 'text-emerald-300' : 'text-parchment-100'}>
                  {formatPct(r.projected_avg_gp_pct)}
                </strong>
              </p>
              {r.newly_below_target > 0 && (
                <p className="text-xs text-red-300 mt-2">
                  {r.newly_below_target} drink{r.newly_below_target === 1 ? '' : 's'} would drop below target after this change.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {Array.from(projectedByMenu.entries()).map(([menuId, cocktails]) => (
        <div key={menuId} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gold-500/10">
            <Link href={`/trade/pouriq/${menuId}`} className="text-base font-serif font-bold text-white hover:text-gold-200">
              {cocktails[0].menu_name}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-jerry-green-900/40">
                <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                  <th className="px-4 py-3">Drink</th>
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3">Now: pour / GP</th>
                  <th className="px-4 py-3">After: pour / GP</th>
                </tr>
              </thead>
              <tbody>
                {cocktails.map((c) => (
                  <tr key={c.cocktail_id} className="border-t border-gold-500/10">
                    <td className="px-4 py-3 text-parchment-100">{c.cocktail_name}</td>
                    <td className="px-4 py-3 text-parchment-200">{formatMoney(c.sale_price_p)}</td>
                    <td className={`px-4 py-3 ${c.below_target_now ? 'text-red-300' : 'text-parchment-200'}`}>
                      {formatMoney(c.current_pour_cost_p)} · {formatPct(c.current_gp_pct)}
                    </td>
                    <td className={`px-4 py-3 ${c.below_target_after ? 'text-red-300' : (c.projected_gp_pct < c.current_gp_pct ? 'text-amber-200' : 'text-parchment-100')}`}>
                      {formatMoney(c.projected_pour_cost_p)} · {formatPct(c.projected_gp_pct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run build`
Expected: PASS. Any unused imports or missing types here will fail the build.

---

### Task 2: Refactor `CostImpactPanel` to delegate to `RipplePreview`

**Files:**
- Modify: `src/components/pouriq/CostImpactPanel.tsx`

- [ ] **Step 1: Replace the file contents with the slimmed version**

```tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  pricingMode,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'
import { RipplePreview } from './RipplePreview'

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

interface Props {
  ingredientId: string
}

export function CostImpactPanel({ ingredientId }: Props) {
  const [data, setData] = useState<CostImpactPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [newCostPounds, setNewCostPounds] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/pouriq/library/${encodeURIComponent(ingredientId)}/impact`)
      .then((r) => (r.ok ? (r.json() as Promise<CostImpactPayload>) : Promise.reject(new Error('Could not load impact data'))))
      .then((d) => {
        if (cancelled) return
        setData(d)
        const currentP = d.ingredient.unit_cost_p ?? d.ingredient.bottle_cost_p ?? 0
        setNewCostPounds((currentP / 100).toFixed(2))
        setError(null)
      })
      .catch((e: Error) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [ingredientId])

  const projection = useMemo(() => {
    if (!data) return null
    const newCostP = Math.round((parseFloat(newCostPounds) || 0) * 100)
    const mode = pricingMode(data.ingredient)
    const currentP = (mode === 'unit' ? data.ingredient.unit_cost_p : data.ingredient.bottle_cost_p) ?? 0
    const delta = newCostP - currentP
    const projected: ProjectedCocktail[] = data.affected.map((c) =>
      projectCocktail(data.ingredient, c, newCostP),
    )
    const rollups = rollupByMenu(projected)
    return { projected, rollups, newCostP, currentP, delta, mode }
  }, [data, newCostPounds])

  if (loading) {
    return <p className="text-sm text-parchment-300">Loading impact…</p>
  }
  if (error || !data || !projection) {
    return <p role="alert" className="text-sm text-red-300">{error ?? 'Could not load impact data'}</p>
  }

  const { ingredient } = data
  const { projected, rollups, currentP, delta, mode } = projection
  const unitLabel = mode === 'unit' ? 'per unit' : `per ${ingredient.bottle_size_ml ?? ''}ml bottle`

  return (
    <div className="space-y-6">
      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
        <h2 className="text-lg font-serif font-bold text-white mb-1">Cost change impact</h2>
        <p className="text-sm text-parchment-300 mb-5">
          {ingredient.name} · current {formatMoney(currentP)} {unitLabel}
        </p>

        <label htmlFor="new-cost" className="block text-sm font-medium text-parchment-200 mb-2">
          New cost ({unitLabel})
        </label>
        <input
          id="new-cost"
          type="number"
          step="0.01"
          min={0}
          value={newCostPounds}
          onChange={(e) => setNewCostPounds(e.target.value)}
          className="w-48 px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:outline-none"
        />
        <p className="mt-3 text-sm text-parchment-300">
          Change: <strong className={delta === 0 ? 'text-parchment-200' : delta > 0 ? 'text-amber-300' : 'text-emerald-300'}>
            {delta === 0 ? 'no change' : `${delta > 0 ? '+' : ''}${formatMoney(delta)}`}
          </strong>{' '}
          {currentP > 0 && delta !== 0 && (
            <span className="text-parchment-400">({((delta / currentP) * 100).toFixed(1)}%)</span>
          )}
        </p>
      </div>

      <RipplePreview projected={projected} rollups={rollups} />
    </div>
  )
}
```

- [ ] **Step 2: Run type-check and lint**

Run: `npm run build`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

---

### Task 3: Manual visual verification

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Open the what-if page in a browser**

URL: `http://localhost:3000/trade/pouriq/library/what-if`

(Use a trade login PIN that has access to a tenant with at least one ingredient that's used in cocktails. If no such fixture exists, pick an ingredient via the dropdown that you know has usage.)

- [ ] **Step 3: Visually confirm parity**

Check:
- The cost input card at the top renders with the ingredient name, current cost, and `per Xml bottle` or `per unit` label
- Typing a new cost updates the `Change: …` line
- The rollup card grid renders below the input card with menu name, target GP, drink count, current → projected avg GP, and (when applicable) the "N drinks would drop below target" warning
- The per-menu drilldown table renders with all four columns and the right colour coding (red for below-target, amber for "went down but still above target", green for improvements on the avg GP line)
- Picking an ingredient that has no usage shows the "This ingredient isn't used in any drinks yet" empty state

No visual differences before vs after the refactor.

- [ ] **Step 4: Stop the dev server**

`Ctrl+C` in the terminal.

---

### Task 4: Commit PR 1 and open the pull request

- [ ] **Step 1: Stage and commit the refactor**

```bash
git add src/components/pouriq/RipplePreview.tsx src/components/pouriq/CostImpactPanel.tsx
git commit -m "$(cat <<'EOF'
refactor(pouriq): extract RipplePreview from CostImpactPanel

Pulls the presentational pieces of CostImpactPanel (empty state, per-menu
rollup cards, per-menu drilldown tables) out into a pure RipplePreview
component that takes pre-computed projection data as props.

CostImpactPanel keeps the impact-fetch and cost-input ownership for the
what-if page. The new RipplePreview is what PR 2 will embed inline on
the ingredient edit page so the same UI renders in both surfaces without
forking the component.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 2: Push the branch and open the PR**

```bash
git push -u origin refactor/pouriq-extract-ripple-preview
gh pr create --title "refactor(pouriq): extract RipplePreview for inline reuse" --body "$(cat <<'EOF'
## Summary

- Extracts the presentational pieces of `CostImpactPanel` into a new pure `RipplePreview` component
- No behaviour change; `/trade/pouriq/library/what-if` renders identically
- Preparation for the inline cost-ripple feature on the ingredient edit page (see committed spec for design)

## Test plan

- [x] `npm run build` passes
- [x] `npm run lint` passes
- [x] Manually opened `/trade/pouriq/library/what-if`, picked an ingredient with usage, typed a new cost — rollup cards and drilldown tables render identically; below-target warnings show correctly; empty-state path renders identically for ingredients with no usage

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR opened cleanly**

The command output should print the PR URL. CI build + lint should pass within a few minutes.

**STOP HERE for PR 1.** Do not begin Phase 2 until PR 1 has been reviewed and merged.

---

## Phase 2 — PR 2: Feature `feat/pouriq-inline-cost-ripple`

**Prerequisite:** PR 1 has been merged into `main`.

### Task 5: Cut the PR 2 branch from updated `main`

- [ ] **Step 1: Switch to main, pull the merged refactor, cut the new branch**

```bash
git checkout main
git pull --rebase origin main
git checkout -b feat/pouriq-inline-cost-ripple
git status
```

Expected: on `feat/pouriq-inline-cost-ripple`, clean working tree, with the refactor commit (or the squash merge of it) visible in `git log --oneline -5`.

---

### Task 6: Add the `getNewlyBelowTarget` helper to `cost-impact.ts`

**Files:**
- Modify: `src/lib/pouriq/cost-impact.ts`

- [ ] **Step 1: Append the helper function to the end of the file**

Add this export after the existing `rollupByMenu` function:

```ts
/**
 * Drinks that would cross from at/above their menu's target GP to below
 * it as a result of the cost change. Used by the inline cost-ripple flow
 * to decide whether to fire the confirm modal on save — only newly-below
 * drinks warrant interruption; already-below drinks are not regressions
 * caused by this change.
 */
export function getNewlyBelowTarget(projected: ProjectedCocktail[]): ProjectedCocktail[] {
  return projected.filter((p) => !p.below_target_now && p.below_target_after)
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/cost-impact.ts
git commit -m "feat(pouriq): getNewlyBelowTarget helper for ripple gate"
```

---

### Task 7: Create the `RippleConfirmModal` component

**Files:**
- Create: `src/components/pouriq/RippleConfirmModal.tsx`

- [ ] **Step 1: Create the modal file**

Uses `@headlessui/react` `Dialog` for the accessible modal primitive (already a project dependency).

```tsx
'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import type { ProjectedCocktail } from '@/lib/pouriq/cost-impact'

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

interface Props {
  isOpen: boolean
  ingredientName: string
  newlyBelowTarget: ProjectedCocktail[]
  onCancel: () => void
  onConfirm: () => void
  submitting?: boolean
}

export function RippleConfirmModal({
  isOpen,
  ingredientName,
  newlyBelowTarget,
  onCancel,
  onConfirm,
  submitting = false,
}: Props) {
  const count = newlyBelowTarget.length
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg bg-jerry-green-800 border border-gold-500/30 rounded-xl p-6 shadow-2xl">
          <DialogTitle className="text-lg font-serif font-bold text-white">
            {count === 1 ? '1 drink will drop below target' : `${count} drinks will drop below target`}
          </DialogTitle>
          <p className="mt-2 text-sm text-parchment-300">
            Saving the new cost for <span className="font-medium text-parchment-100">{ingredientName}</span> would push the following below their menu&rsquo;s target GP:
          </p>

          <ul className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {newlyBelowTarget.map((p) => (
              <li key={p.cocktail_id} className="text-sm bg-jerry-green-900/40 border border-gold-500/10 rounded-lg px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-parchment-100 font-medium">{p.cocktail_name}</span>
                  <span className="text-parchment-400 text-xs">{p.menu_name}</span>
                </div>
                <div className="mt-1 text-xs text-parchment-300">
                  GP {formatPct(p.current_gp_pct)} {'→'}{' '}
                  <strong className="text-red-300">{formatPct(p.projected_gp_pct)}</strong>
                  <span className="text-parchment-500"> (target {p.menu_target_gp_pct}%)</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 text-sm text-parchment-200 hover:text-parchment-50 disabled:text-parchment-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="px-6 py-2 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg text-sm"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/RippleConfirmModal.tsx
git commit -m "feat(pouriq): RippleConfirmModal for cost-change gate"
```

---

### Task 8: Create the `CostUpdateToast` component (mirrors `SocialProofToast`)

**Files:**
- Create: `src/components/pouriq/CostUpdateToast.tsx`

- [ ] **Step 1: Create the toast file**

Same fixed positioning, dismiss patterns, and animation classes as `src/components/SocialProofToast.tsx`. Differs by not using session storage (fires per-save) and listing affected drinks as links.

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AffectedDrink {
  cocktailId: string
  cocktailName: string
  menuId: string
  menuName: string
  projectedGpPct: number
  targetGpPct: number
}

interface Props {
  ingredientName: string
  newlyBelowTarget: AffectedDrink[]
  onDismiss: () => void
}

function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}

export function CostUpdateToast({ ingredientName, newlyBelowTarget, onDismiss }: Props) {
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 6000)
    return () => clearTimeout(timer)
    // dismiss is stable across renders; safe to omit from deps for parity with SocialProofToast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    setDismissing(true)
    setTimeout(() => onDismiss(), 300)
  }

  const count = newlyBelowTarget.length

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-40 rounded-lg border border-gold-500/20 bg-jerry-green-800 p-4 shadow-xl ${
        dismissing ? 'toast-fade-out' : 'toast-slide-in'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-gold-500" aria-hidden="true" />

        <div className="flex-1 text-sm text-parchment-100">
          <p>
            <span className="font-semibold text-gold-400">{ingredientName}</span> updated.
            {count === 1 ? ' 1 drink now below target:' : ` ${count} drinks now below target:`}
          </p>
          <ul className="mt-2 space-y-1">
            {newlyBelowTarget.map((d) => (
              <li key={d.cocktailId}>
                <Link
                  href={`/trade/pouriq/${d.menuId}/edit?cocktail=${d.cocktailId}`}
                  className="text-gold-300 hover:text-gold-200 underline"
                >
                  {d.cocktailName}
                </Link>
                <span className="text-parchment-400 text-xs"> {formatPct(d.projectedGpPct)} (target {d.targetGpPct}%)</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={dismiss}
          className="flex-shrink-0 text-parchment/40 hover:text-parchment transition-colors"
          aria-label="Dismiss notification"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/CostUpdateToast.tsx
git commit -m "feat(pouriq): CostUpdateToast mirrors SocialProofToast pattern"
```

---

### Task 9: Fetch impact payload in the ingredient edit page and pass to the form

**Files:**
- Modify: `src/app/trade/pouriq/library/[id]/edit/page.tsx`

The edit page is a Server Component. Pull the impact payload server-side using the same query shape as the existing impact endpoint so the form has the data it needs the moment it mounts. This avoids a client-side waterfall.

- [ ] **Step 1: Replace the file contents**

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  getLibraryEntry,
  getLibraryEntryUsage,
} from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'
import { SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'
import type {
  CostImpactPayload,
  ImpactCocktail,
  ImpactIngredient,
} from '@/lib/pouriq/cost-impact'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

interface RawRow {
  cocktail_id: string
  cocktail_name: string
  cocktail_sale_price_p: number
  menu_id: string
  menu_name: string
  menu_target_gp_pct: number
  menu_prices_include_vat: number
  ingredient_library_id: string
  ingredient_pour_ml: number | null
  ingredient_unit_count: number | null
  lib_bottle_size_ml: number | null
  lib_bottle_cost_p: number | null
  lib_unit_cost_p: number | null
}

function rowContributionP(row: RawRow): number {
  if (row.lib_unit_cost_p !== null) {
    const count = row.ingredient_unit_count ?? 1
    return Math.round(row.lib_unit_cost_p * count)
  }
  if (
    row.lib_bottle_size_ml !== null &&
    row.lib_bottle_cost_p !== null &&
    row.ingredient_pour_ml !== null
  ) {
    return Math.round((row.lib_bottle_cost_p / row.lib_bottle_size_ml) * row.ingredient_pour_ml)
  }
  return 0
}

async function loadImpactPayload(
  db: D1Database,
  ingredientId: string,
  tradeAccountId: string,
  entry: { id: string; name: string; ingredient_type: string; bottle_size_ml: number | null; bottle_cost_p: number | null; unit_cost_p: number | null },
): Promise<CostImpactPayload> {
  const result = await db
    .prepare(`
      WITH affected AS (
        SELECT DISTINCT c.id AS cocktail_id
        FROM pouriq_ingredients i
        JOIN pouriq_cocktails c ON c.id = i.cocktail_id
        JOIN pouriq_menus m ON m.id = c.menu_id
        WHERE i.library_ingredient_id = ?1
          AND m.trade_account_id = ?2
      )
      SELECT
        c.id AS cocktail_id,
        c.name AS cocktail_name,
        c.sale_price_p AS cocktail_sale_price_p,
        m.id AS menu_id,
        m.name AS menu_name,
        m.target_gp_pct AS menu_target_gp_pct,
        m.prices_include_vat AS menu_prices_include_vat,
        i.library_ingredient_id AS ingredient_library_id,
        i.pour_ml AS ingredient_pour_ml,
        i.unit_count AS ingredient_unit_count,
        lib.bottle_size_ml AS lib_bottle_size_ml,
        lib.bottle_cost_p AS lib_bottle_cost_p,
        lib.unit_cost_p AS lib_unit_cost_p
      FROM affected a
      JOIN pouriq_cocktails c ON c.id = a.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      JOIN pouriq_ingredients i ON i.cocktail_id = c.id
      JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
      ORDER BY m.name, c.name
    `)
    .bind(ingredientId, tradeAccountId)
    .all<RawRow>()

  const rows = result.results ?? []
  const byCocktail = new Map<string, RawRow[]>()
  for (const row of rows) {
    if (!byCocktail.has(row.cocktail_id)) byCocktail.set(row.cocktail_id, [])
    byCocktail.get(row.cocktail_id)!.push(row)
  }

  const affected: ImpactCocktail[] = []
  for (const cocktailRows of byCocktail.values()) {
    const first = cocktailRows[0]
    let totalPourCost = 0
    let thisContribution = 0
    let pourMl: number | null = null
    let unitCount: number | null = null
    for (const r of cocktailRows) {
      const contribution = rowContributionP(r)
      totalPourCost += contribution
      if (r.ingredient_library_id === ingredientId) {
        thisContribution += contribution
        pourMl = r.ingredient_pour_ml
        unitCount = r.ingredient_unit_count
      }
    }
    affected.push({
      cocktail_id: first.cocktail_id,
      cocktail_name: first.cocktail_name,
      menu_id: first.menu_id,
      menu_name: first.menu_name,
      menu_target_gp_pct: first.menu_target_gp_pct,
      menu_prices_include_vat: first.menu_prices_include_vat === 1,
      sale_price_p: first.cocktail_sale_price_p,
      current_pour_cost_p: totalPourCost,
      current_ingredient_contribution_p: thisContribution,
      pour_ml: pourMl,
      unit_count: unitCount,
    })
  }

  const ingredient: ImpactIngredient = {
    id: entry.id,
    name: entry.name,
    ingredient_type: entry.ingredient_type,
    bottle_size_ml: entry.bottle_size_ml,
    bottle_cost_p: entry.bottle_cost_p,
    unit_cost_p: entry.unit_cost_p,
  }

  return { ingredient, affected }
}

export default async function EditLibraryEntryPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const entry = await getLibraryEntry(db, id, access.tradeAccountId)
  if (!entry) notFound()

  const usage = await getLibraryEntryUsage(db, id)
  const impactPayload = await loadImpactPayload(db, id, access.tradeAccountId, entry)

  const byMenu = new Map<string, { menuName: string; cocktails: Array<{ id: string; name: string }> }>()
  for (const u of usage) {
    if (!byMenu.has(u.menu_id)) byMenu.set(u.menu_id, { menuName: u.menu_name, cocktails: [] })
    byMenu.get(u.menu_id)!.cocktails.push({ id: u.cocktail_id, name: u.cocktail_name })
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3 mb-8">
          <h1 className="text-3xl font-serif font-bold text-white">{entry.name}</h1>
          {usage.length > 0 && (
            <Link
              href={`/trade/pouriq/library/what-if?ingredient=${encodeURIComponent(entry.id)}`}
              className={SECONDARY_BUTTON_SM}
            >
              Test a cost change
            </Link>
          )}
        </div>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
          <IngredientForm entry={entry} usageCount={usage.length} impactPayload={impactPayload} />
        </div>

        {byMenu.size > 0 && (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <h2 className="text-lg font-serif font-bold text-white mb-4">Used in</h2>
            <div className="space-y-4">
              {Array.from(byMenu.entries()).map(([menuId, info]) => (
                <div key={menuId}>
                  <Link href={`/trade/pouriq/${menuId}`} className="text-sm font-medium text-gold-300 hover:text-gold-200 underline">
                    {info.menuName}
                  </Link>
                  <ul className="mt-1 text-sm text-parchment-300 list-inside list-disc">
                    {info.cocktails.map((c) => (
                      <li key={c.id}>
                        <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${c.id}`} className="hover:text-parchment-100 underline">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Run type-check**

Run: `npm run build`
Expected: FAIL on `IngredientForm` — the `impactPayload` prop isn't declared yet. That's expected; Task 10 adds it.

If the failure is something other than the `impactPayload` prop, stop and investigate before continuing.

- [ ] **Step 3: Do NOT commit yet**

Keep the changes uncommitted; Task 10 lands them together so each commit is self-consistent.

---

### Task 10: Plumb ripple preview, modal, and toast into `IngredientForm`

**Files:**
- Modify: `src/components/pouriq/IngredientForm.tsx`

This is the largest single change. Replace the file's contents with the new version, which:
- Accepts the optional `impactPayload` prop
- Tracks `newCostP` derived from the active pricing-mode input
- Renders `<RipplePreview>` below the form when there's a non-empty preview to show
- Intercepts submit to decide modal-or-straight-commit
- Renders the modal and toast as needed

- [ ] **Step 1: Replace the file contents**

```tsx
'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction, deleteLibraryEntryAction } from '@/lib/pouriq/server-actions'
import { BarcodeScanner } from '@/components/pouriq/BarcodeScanner'
import { RipplePreview } from '@/components/pouriq/RipplePreview'
import { RippleConfirmModal } from '@/components/pouriq/RippleConfirmModal'
import { CostUpdateToast } from '@/components/pouriq/CostUpdateToast'
import {
  getNewlyBelowTarget,
  projectCocktail,
  rollupByMenu,
  type CostImpactPayload,
  type ProjectedCocktail,
} from '@/lib/pouriq/cost-impact'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'
const chipClass = 'px-3 py-2 rounded-lg border text-sm transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface Props {
  entry: IngredientLibraryRow | null
  usageCount?: number
  impactPayload?: CostImpactPayload
}

interface PendingToast {
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

export function IngredientForm({ entry, usageCount = 0, impactPayload }: Props) {
  const router = useRouter()
  const [name, setName] = useState(entry?.name ?? '')
  const [ingredient_type, setIngredientType] = useState<IngredientType>(entry?.ingredient_type ?? 'spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined ? 'unit' : 'bottle'
  )
  const [bottle_size_ml, setBottleSize] = useState(entry?.bottle_size_ml?.toString() ?? '')
  const [bottle_cost_pounds, setBottleCostPounds] = useState(
    entry?.bottle_cost_p !== null && entry?.bottle_cost_p !== undefined
      ? (entry.bottle_cost_p / 100).toFixed(2) : ''
  )
  const [unit_cost_pounds, setUnitCostPounds] = useState(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined
      ? (entry.unit_cost_p / 100).toFixed(2) : ''
  )
  const [barcode, setBarcode] = useState(entry?.barcode ?? '')
  const [scanOpen, setScanOpen] = useState(false)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [existingEntryHref, setExistingEntryHref] = useState<string | null>(null)
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [pendingToast, setPendingToast] = useState<PendingToast | null>(null)

  // Saved cost (in pence) for the current pricing mode, or null if not yet set.
  const savedCostP =
    pricing_mode === 'unit' ? entry?.unit_cost_p ?? null : entry?.bottle_cost_p ?? null

  // The newCostP the user has currently typed, in pence. Returns null when
  // the input is empty or non-numeric.
  const newCostP = useMemo(() => {
    const raw = pricing_mode === 'unit' ? unit_cost_pounds : bottle_cost_pounds
    if (raw === '') return null
    const n = Math.round(parseFloat(raw) * 100)
    return Number.isFinite(n) ? n : null
  }, [pricing_mode, unit_cost_pounds, bottle_cost_pounds])

  const projection = useMemo(() => {
    if (!impactPayload || newCostP === null) return null
    // Only run the projection when the user has actually entered a cost
    // value that differs from the saved one (or is being set for the
    // first time on a null cost).
    if (savedCostP !== null && newCostP === savedCostP) return null
    const projected: ProjectedCocktail[] = impactPayload.affected.map((c) =>
      projectCocktail(impactPayload.ingredient, c, newCostP),
    )
    const rollups = rollupByMenu(projected)
    return { projected, rollups }
  }, [impactPayload, newCostP, savedCostP])

  async function handleScan(code: string) {
    setScanOpen(false)
    setScanInfo(null)
    setExistingEntryHref(null)
    setBarcode(code)
    try {
      const res = await fetch(`/api/pouriq/library/by-barcode?code=${encodeURIComponent(code)}`)
      if (!res.ok) return
      const data = await res.json() as {
        entry: IngredientLibraryRow | null
        catalogue: { name: string; ingredient_type: IngredientType; bottle_size_ml: number | null; verified: boolean } | null
      }
      if (data.entry && data.entry.id !== entry?.id) {
        setExistingEntryHref(`/trade/pouriq/library/${data.entry.id}/edit`)
        setScanInfo(`This barcode is already on your library entry "${data.entry.name}".`)
        return
      }
      if (data.catalogue && !entry) {
        if (!name.trim()) setName(data.catalogue.name)
        setIngredientType(data.catalogue.ingredient_type)
        if (data.catalogue.bottle_size_ml) {
          setPricingMode('bottle')
          setBottleSize(String(data.catalogue.bottle_size_ml))
        }
        setScanInfo("Name, type and size came from the Pour IQ shared catalogue — sanity-check before saving.")
      }
    } catch { /* network blip — just leave the barcode populated */ }
  }

  function validate(): { bottle_size_ml_n: number | null, bottle_cost_p: number | null, unit_cost_p: number | null } | null {
    setError(null)
    if (!name.trim()) { setError('Name is required'); return null }
    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) {
        setError('Bottle size must be a positive number'); return null
      }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) {
        setError('Bottle cost must be a non-negative number'); return null
      }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) {
        setError('Unit cost must be a non-negative number'); return null
      }
    }
    return { bottle_size_ml_n, bottle_cost_p, unit_cost_p }
  }

  async function commit(values: { bottle_size_ml_n: number | null, bottle_cost_p: number | null, unit_cost_p: number | null }, toastData: PendingToast | null) {
    setSubmitting(true)
    try {
      await saveLibraryEntryAction(entry?.id ?? null, {
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: values.bottle_size_ml_n,
        bottle_cost_p: values.bottle_cost_p,
        unit_cost_p: values.unit_cost_p,
        barcode: barcode.trim() || null,
        notes: notes.trim() || null,
      })
      if (toastData) {
        // Stash toast data in sessionStorage; the library page will render
        // the toast after the redirect. (Alternative: stay on this page and
        // render the toast inline. Library-page approach matches the existing
        // post-save router.push() behaviour.)
        sessionStorage.setItem('pouriq_cost_update_toast', JSON.stringify(toastData))
      }
      router.push('/trade/pouriq/library')
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const values = validate()
    if (!values) return

    // First-cost case: savedCostP is null. Skip the gate entirely; commit
    // straight through. No toast either — there's no "newly below" comparison
    // to make against a non-existent baseline.
    const isFirstCost = savedCostP === null
    if (isFirstCost || !projection) {
      await commit(values, null)
      return
    }

    const newlyBelow = getNewlyBelowTarget(projection.projected)
    if (newlyBelow.length === 0) {
      await commit(values, null)
      return
    }

    // Gate: open the modal. The modal's Save button calls commit with the
    // pending toast data.
    const toastData: PendingToast = {
      ingredientName: name.trim(),
      newlyBelowTarget: newlyBelow.map((p) => ({
        cocktailId: p.cocktail_id,
        cocktailName: p.cocktail_name,
        menuId: p.menu_id,
        menuName: p.menu_name,
        projectedGpPct: p.projected_gp_pct,
        targetGpPct: p.menu_target_gp_pct,
      })),
    }
    setPendingToast(toastData)
    pendingValuesRef.current = values
    setModalOpen(true)
  }

  // Held in a ref so the modal's confirm handler can read the validated
  // values without them being re-passed through React state.
  const pendingValuesRef = useRef<{ bottle_size_ml_n: number | null, bottle_cost_p: number | null, unit_cost_p: number | null } | null>(null)

  async function handleDelete() {
    if (!entry) return
    if (usageCount > 0) return
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return
    await deleteLibraryEntryAction(entry.id)
    router.push('/trade/pouriq/library')
    router.refresh()
  }

  const showRipple = projection !== null && impactPayload !== undefined && impactPayload.affected.length > 0

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className={labelClass}>Name *</label>
          <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Tito's Vodka" />
        </div>

        <div>
          <label htmlFor="ingredient_type" className={labelClass}>Type *</label>
          <select id="ingredient_type" value={ingredient_type} onChange={(e) => setIngredientType(e.target.value as IngredientType)} className={inputClass}>
            {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Pricing mode *</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPricingMode('bottle')} className={`${chipClass} ${pricing_mode === 'bottle' ? chipActive : chipIdle}`}>
              Per bottle
            </button>
            <button type="button" onClick={() => setPricingMode('unit')} className={`${chipClass} ${pricing_mode === 'unit' ? chipActive : chipIdle}`}>
              Per unit
            </button>
          </div>
        </div>

        {pricing_mode === 'bottle' ? (
          <>
            <div>
              <label htmlFor="bottle_size_ml" className={labelClass}>Bottle size (ml) *</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_BOTTLE_SIZES.map((s) => (
                  <button type="button" key={s} onClick={() => setBottleSize(String(s))} className={`${chipClass} ${bottle_size_ml === String(s) ? chipActive : chipIdle}`}>
                    {s}ml
                  </button>
                ))}
              </div>
              <input id="bottle_size_ml" type="number" step="1" min={0} value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass} placeholder="700" />
            </div>
            <div>
              <label htmlFor="bottle_cost_pounds" className={labelClass}>Bottle cost (£) *</label>
              <input id="bottle_cost_pounds" type="number" step="0.01" min={0} value={bottle_cost_pounds} onChange={(e) => setBottleCostPounds(e.target.value)} className={inputClass} placeholder="25.00" />
            </div>
          </>
        ) : (
          <div>
            <label htmlFor="unit_cost_pounds" className={labelClass}>Unit cost (£) *</label>
            <input id="unit_cost_pounds" type="number" step="0.01" min={0} value={unit_cost_pounds} onChange={(e) => setUnitCostPounds(e.target.value)} className={inputClass} placeholder="1.00" />
            <p className="text-xs text-parchment-400 mt-2">e.g., the cost of one whole lime, one bunch of mint, one jar of cherries.</p>
          </div>
        )}

        {showRipple && projection && (
          <div>
            <p className="text-sm text-parchment-300 mb-3">Impact on drinks using this ingredient:</p>
            <RipplePreview projected={projection.projected} rollups={projection.rollups} />
          </div>
        )}

        <div>
          <label htmlFor="barcode" className={labelClass}>Barcode</label>
          <div className="flex gap-2">
            <input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} className={inputClass} placeholder="Optional — scan or type the bottle's barcode" />
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="shrink-0 px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-100 hover:border-gold-400 transition-colors text-sm"
            >
              Scan
            </button>
          </div>
          <p className="text-xs text-parchment-400 mt-2">Once set, scanning this bottle in the cocktail editor auto-selects this ingredient.</p>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>Notes</label>
          <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} placeholder="Optional — supplier, SKU, anything useful" />
        </div>

        {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

        {scanInfo && (
          <p className="text-xs text-gold-200">
            {scanInfo}{' '}
            {existingEntryHref && (
              <a href={existingEntryHref} className="underline hover:text-gold-100">Open it</a>
            )}
          </p>
        )}

        {scanOpen && (
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setScanOpen(false)}
          />
        )}

        <div className="flex justify-between items-center">
          {entry ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={usageCount > 0}
              title={usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'}. Remove from those first.` : undefined}
              className="text-sm text-red-300 hover:text-red-200 underline disabled:text-parchment-500 disabled:no-underline disabled:cursor-not-allowed"
            >
              {usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'} — can't delete` : 'Delete ingredient'}
            </button>
          ) : <span />}
          <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
            {submitting ? 'Saving…' : entry ? 'Save changes' : 'Add ingredient'}
          </button>
        </div>
      </form>

      <RippleConfirmModal
        isOpen={modalOpen}
        ingredientName={name.trim()}
        newlyBelowTarget={projection ? getNewlyBelowTarget(projection.projected) : []}
        submitting={submitting}
        onCancel={() => { setModalOpen(false); setPendingToast(null); pendingValuesRef.current = null }}
        onConfirm={() => {
          setModalOpen(false)
          if (pendingValuesRef.current) {
            void commit(pendingValuesRef.current, pendingToast)
          }
        }}
      />
    </>
  )
}
```

- [ ] **Step 2: Render the post-save toast on the library page**

The form redirects to `/trade/pouriq/library` after save and stashes the toast data in `sessionStorage`. The library page needs a small client-side reader to pick that up and render the toast.

Modify `src/app/trade/pouriq/library/page.tsx` to add a client child that hydrates the toast.

First create the toast reader:

**Files:**
- Create: `src/components/pouriq/CostUpdateToastReader.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { CostUpdateToast } from './CostUpdateToast'

interface ToastData {
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

export function CostUpdateToastReader() {
  const [data, setData] = useState<ToastData | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('pouriq_cost_update_toast')
    if (!raw) return
    sessionStorage.removeItem('pouriq_cost_update_toast')
    try {
      const parsed = JSON.parse(raw) as ToastData
      if (parsed.newlyBelowTarget && parsed.newlyBelowTarget.length > 0) {
        setData(parsed)
      }
    } catch {
      // Malformed payload — drop it silently
    }
  }, [])

  if (!data) return null
  return (
    <CostUpdateToast
      ingredientName={data.ingredientName}
      newlyBelowTarget={data.newlyBelowTarget}
      onDismiss={() => setData(null)}
    />
  )
}
```

- [ ] **Step 3: Mount the toast reader on the library page**

Modify `src/app/trade/pouriq/library/page.tsx`. Add the import and render the reader as a sibling to the main content. Open the file and replace the `import` block and `return` block:

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries, getLibraryUsageCounts } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientList } from '@/components/pouriq/IngredientList'
import { CostUpdateToastReader } from '@/components/pouriq/CostUpdateToastReader'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [entries, usageCounts] = await Promise.all([
    listLibraryEntries(db, access.tradeAccountId),
    getLibraryUsageCounts(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Ingredient library</h1>
            <p className="text-parchment-400 text-sm mt-2">{entries.length} ingredient{entries.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/trade/pouriq/library/what-if" className={SECONDARY_BUTTON}>Run a what-if</Link>
            <Link href="/trade/pouriq/library/new" className={PRIMARY_BUTTON}>Add ingredient</Link>
          </div>
        </div>

        <IngredientList entries={entries} usageCounts={usageCounts} />
      </div>
      <CostUpdateToastReader />
    </main>
  )
}
```

- [ ] **Step 4: Run type-check and lint**

Run: `npm run build`
Expected: PASS.

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit the feature**

```bash
git add src/components/pouriq/IngredientForm.tsx \
        src/components/pouriq/CostUpdateToastReader.tsx \
        src/app/trade/pouriq/library/[id]/edit/page.tsx \
        src/app/trade/pouriq/library/page.tsx
git commit -m "$(cat <<'EOF'
feat(pouriq): inline cost-change ripple, modal gate, post-save toast

Plumbs the existing cost-ripple analysis into the real save flow:

- Edit page fetches the impact payload server-side and passes it to the
  form, avoiding a client waterfall
- IngredientForm renders <RipplePreview> as the user types a new cost
- Save intercepted: if any drink would cross from at/above target to
  below, RippleConfirmModal opens with the list of affected drinks
- First-cost saves (savedCostP === null) bypass the gate entirely; the
  preview still renders so bar managers see resulting GP before saving
- Post-save toast (mirrors SocialProofToast pattern) appears on the
  library page with links to each newly-below-target drink

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Manual integration verification

Run through every case from the spec's testing section.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Verify "no usage" path**

1. Open `/trade/pouriq/library`
2. Pick an ingredient with usage count `0` (or add a fresh one for the test)
3. Edit its cost
4. Expected: no `<RipplePreview>` renders. Save commits without modal. No toast on the library page after the redirect.

- [ ] **Step 3: Verify "safe change" path**

1. Pick an ingredient used in cocktails where all drinks have plenty of GP headroom
2. Edit the cost by a small amount (e.g. +£1 on a £20 bottle)
3. Expected: `<RipplePreview>` renders below the cost field with rollup cards and tables. No drink is newly below target. Save commits without modal. No toast.

- [ ] **Step 4: Verify "below target" gate path**

1. Pick an ingredient where increasing the cost meaningfully will push at least one drink below its menu's target GP
2. Edit the cost up (e.g. £20 → £40)
3. Expected: `<RipplePreview>` shows the warning on the rollup card and drilldown row(s) in red
4. Click **Save changes**
5. Expected: `RippleConfirmModal` opens listing the newly-below-target drinks
6. Click **Cancel** → modal closes. Cost field still has the typed value. Nothing committed.
7. Click **Save changes** again → modal reopens.
8. Click **Save** in the modal → modal closes, ingredient saves, redirect to library, toast appears bottom-left
9. Toast shows the ingredient name, the count, and a link per affected drink
10. Click a link → navigates to `/trade/pouriq/[menuId]/edit?cocktail=[id]` for the right drink
11. Toast auto-dismisses after ~6 s if not clicked

- [ ] **Step 5: Verify first-cost path**

This requires a library entry that has `bottle_cost_p` (or `unit_cost_p`) still `null` *and* is referenced by at least one cocktail. If none exist, you can construct one by:
  - Adding a fresh ingredient via Add ingredient (skip the cost field)
  - Adding it to a cocktail recipe via the cocktail edit page

Then:
1. Open the edit page for that ingredient
2. Type a cost
3. Expected: `<RipplePreview>` renders showing real pour costs for each drink that uses it. Some drinks may show as below target — that's fine, expected.
4. Click **Save changes**
5. Expected: no modal opens (first-cost case bypasses the gate). The save commits straight through. No toast appears on the library page (no "newly below" comparison made against a null baseline).

- [ ] **Step 6: Verify save-failure path (best effort)**

Use DevTools to throttle network to Offline or block requests to the save action endpoint, then attempt to save. The form's existing error path should surface "Could not save" inline. No toast should fire. (This is a best-effort manual test — there's no clean mock for server actions in this codebase.)

- [ ] **Step 7: Stop the dev server**

`Ctrl+C`.

---

### Task 12: Push PR 2 and open the pull request

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-inline-cost-ripple
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(pouriq): inline cost-change ripple with confirm gate" --body "$(cat <<'EOF'
## Summary

- Inline ripple preview shows on the ingredient edit page as you type a new cost
- Save is gated by a confirm modal only when a drink would cross from at/above its menu's target GP to below
- First-cost saves (ingredient cost was null) bypass the gate but still show the preview so bar managers can land the GP they want before saving
- Post-save toast (mirrors `SocialProofToast` pattern) appears on the library page with links to each newly-below-target drink

## Spec

See `docs/superpowers/specs/2026-05-14-pouriq-inline-cost-ripple-design.md` (merged in PR 1) for design rationale and out-of-scope items.

## Test plan

- [x] `npm run build` and `npm run lint` clean
- [x] No usage: form behaves as before, no panel, no modal, no toast
- [x] Safe cost change (all drinks stay above target): preview shows, save commits silently, no modal, no toast
- [x] Below-target cost change: preview shows, modal lists affected drinks, Cancel preserves the typed value, Save commits and triggers post-redirect toast with working drink links
- [x] First-cost entry: preview renders so resulting GP is visible; save commits straight through with no modal and no toast
- [x] Save failure surfaces inline error

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR opened**

The command prints the PR URL. CI build + lint should pass within a few minutes.

---

## Self-review checklist (engineer)

Before requesting review on PR 2, verify:

- [ ] Both branches were cut from up-to-date `origin/main` (not from each other, not from a merged branch)
- [ ] No `console.log` statements left behind
- [ ] No `any` types introduced (use `unknown` with a cast if forced)
- [ ] No emojis or em-dashes in user-visible copy (per project CLAUDE.md)
- [ ] The `/trade/pouriq/library/what-if` page still works identically — the refactor didn't break the explore flow
- [ ] `pendingValuesRef` uses `useRef` (idiomatic). If you ever need to share validated values across React state and event handlers, the same pattern works elsewhere
