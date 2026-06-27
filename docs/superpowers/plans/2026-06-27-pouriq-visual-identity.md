# Pour IQ Visual Identity ("Daylight" reskin) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the Pour IQ trade app (`/trade`) from the inherited dark Jerry Can rum-brand theme to its own light "Daylight" identity — white surfaces, slate neutrals, an `emerald-600` accent, Inter UI with a single serif "Pour IQ" wordmark, and a quiet "Built by Jerry Can Spirits" line.

**Architecture:** Styling only — no schema, no behaviour, no migration. The look is centralised in shared className constants (`button-styles.ts` + a new `ui.ts`) and a `PourIqWordmark` component, then every `/trade` page/component is swept from the dark classes to the light ones using a fixed mapping table (Task 0). The consumer marketing site and its `jerry-green`/`gold`/`parchment` Tailwind tokens are untouched — Pour IQ uses stock Tailwind `slate`/`white`/`emerald`/`amber`/`rose`.

**Tech Stack:** Next.js 15 (App Router), Tailwind 4, TypeScript. Inter + Playfair Display are already loaded app-wide (`src/app/layout.tsx`), so no font work.

**Spec:** `docs/superpowers/specs/2026-06-27-pouriq-visual-identity-design.md`

**Scope:** 29 pages under `src/app/trade/pouriq/**` + `src/app/trade/landing` + `src/app/trade/login`, and 55 components under `src/components/pouriq/**`. ~1,500 dark-class occurrences.

**Verification model:** styling is not unit-testable. Each task is verified by (a) `npx tsc --noEmit` clean, (b) a targeted grep proving no dark-theme classes remain in the task's files, and (c) a visual check in dev. The whole branch ends with `npm run build` + a global grep sweep.

---

## Task 0 (reference): the class mapping table

Every sweep task applies this fixed mapping. Keep this open while working. (Opacity suffixes like `/40`, `/20` on the dark classes all collapse to the solid light value shown.)

**Surfaces / backgrounds**
- `bg-jerry-green-900*` (full-page bg) → `bg-slate-50`
- `bg-jerry-green-800*`, `bg-jerry-green-700/30|40` (cards, dropdowns, panels) → `bg-white`
- `bg-jerry-green-700/50` (inputs) → `bg-white`
- `hover:bg-jerry-green-700/20|40` (row/link hover) → `hover:bg-slate-100`
- `backdrop-blur-sm|md|lg` on those panels → remove (not needed on opaque white)

**Borders**
- `border-gold-500/10|15|20|30|40` → `border-slate-200`
- `border-gold-400`, `border-gold-400/60` (active / secondary) → `border-emerald-600`
- `border-red-500/*` → `border-rose-300`
- `border-amber-400/*` → `border-amber-300`

**Text (parchment ramp → slate ramp)**
- `text-parchment-50` → `text-slate-900`
- `text-parchment-100` → `text-slate-900`
- `text-parchment-200` → `text-slate-700`
- `text-parchment-300` → `text-slate-600`
- `text-parchment-400` → `text-slate-500`
- `text-parchment-500` → `text-slate-400`
- `text-white` (headings) → `text-slate-900`

**Gold (accent / labels / active) — two cases, judge by use**
- Uppercase tracked overline/label (`text-gold-300` on a small uppercase label) → `text-slate-500`
- Actionable/link/active/value (`text-gold-100|200|300` on a link, active nav, or a cost value) → `text-emerald-700`
- `bg-gold-500/15|20|25` (active nav bg, chip-active, secondary tint) → `bg-emerald-50`
- `text-jerry-green-900` (text sitting on a gold fill) → `text-white` (now on emerald)
- `hover:text-gold-*` → `hover:text-emerald-700`

**Status (dark-300 shades → light-600 shades)**
- `text-emerald-300` → `text-emerald-600`
- `text-amber-100|200|300` → `text-amber-600`
- `text-red-200|300|400` → `text-rose-600`
- `text-sky-300` → `text-sky-600`
- `bg-amber-500/5|15` → `bg-amber-50`; `bg-red-*/20` → `bg-rose-50`

**Typography**
- `font-serif` on any heading (h1–h4, page titles) → delete the `font-serif` class, keep or add `font-bold` (Inter). The ONLY serif left is the wordmark (Task 3).

**Buttons / inputs / chips** are centralised — Tasks 1–2 fix them once; sweeps just adopt the constants.

---

## Task 1: Shared light-theme class constants (`ui.ts`)

**Files:**
- Create: `src/lib/pouriq/ui.ts`

- [ ] **Step 1: Create the constants module**

Create `src/lib/pouriq/ui.ts`:

```ts
// Shared Tailwind class strings for the Pour IQ trade portal's light
// ("Daylight") identity. Single source of truth for surfaces, inputs, labels,
// tables and status colours so the look stays consistent across every page.
// Pour IQ uses stock Tailwind (slate/white/emerald/amber/rose); the consumer
// site keeps jerry-green/gold/parchment.

export const CANVAS = 'bg-slate-50'
export const CARD = 'bg-white border border-slate-200 rounded-xl'
export const CARD_PAD = 'bg-white border border-slate-200 rounded-xl p-6'
export const PANEL = 'bg-white border border-slate-200 rounded-lg'

export const INPUT =
  'w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden transition-colors duration-200'
export const SELECT = INPUT

export const LABEL = 'block text-sm font-medium text-slate-700 mb-2'
export const HELPER = 'text-xs text-slate-500 mt-1.5'
export const SECTION_LABEL = 'text-xs font-semibold uppercase tracking-widest text-slate-500'
export const PAGE_TITLE = 'text-3xl md:text-4xl font-bold text-slate-900 tracking-tight'
export const HEADING = 'text-lg font-bold text-slate-900'

export const TABLE_WRAP = 'overflow-hidden rounded-xl border border-slate-200'
export const TABLE_HEAD = 'bg-slate-50 text-left text-slate-500 text-xs uppercase tracking-widest'
export const TABLE_ROW = 'border-t border-slate-200 hover:bg-slate-50'

export const CHIP = 'px-3 py-2 rounded-lg border text-sm transition-colors'
export const CHIP_ACTIVE = 'bg-emerald-50 border-emerald-600 text-emerald-700'
export const CHIP_IDLE = 'bg-white border-slate-300 text-slate-600 hover:border-emerald-400'

export const EMPTY_STATE = 'bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500'

// Severity → text colour (variance, GP traffic-lights, attention).
export type Severity = 'good' | 'watch' | 'bad' | 'neutral'
export function statusText(sev: Severity): string {
  return sev === 'good' ? 'text-emerald-600'
    : sev === 'watch' ? 'text-amber-600'
    : sev === 'bad' ? 'text-rose-600'
    : 'text-slate-500'
}
export function statusDot(sev: Severity): string {
  const base = 'inline-block w-2 h-2 rounded-full '
  return base + (sev === 'good' ? 'bg-emerald-500'
    : sev === 'watch' ? 'bg-amber-500'
    : sev === 'bad' ? 'bg-rose-500'
    : 'bg-slate-300')
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (new file, no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/ui.ts
git commit -m "feat(pouriq): light-theme shared class constants (ui.ts)"
```

---

## Task 2: Repoint the button system (`button-styles.ts`)

**Files:**
- Modify: `src/lib/pouriq/button-styles.ts` (whole file)

- [ ] **Step 1: Replace the four constants**

Replace the entire body of `src/lib/pouriq/button-styles.ts` (keep the export names — call sites don't change):

```ts
// Shared Tailwind class strings for the Pour IQ trade portal so the button
// hierarchy stays consistent across menus / library / what-if / import / print
// / delete pages. Light ("Daylight") identity: emerald primary on white.

export const PRIMARY_BUTTON =
  'inline-flex items-center px-5 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50'

export const SECONDARY_BUTTON =
  'inline-flex items-center px-4 py-3 bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50'

export const SECONDARY_BUTTON_SM =
  'inline-flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 rounded-lg transition-colors text-sm font-semibold disabled:opacity-50'

export const DESTRUCTIVE_BUTTON =
  'inline-flex items-center px-4 py-2 bg-rose-600 text-white font-semibold rounded-lg border border-rose-600 hover:bg-rose-700 hover:border-rose-700 transition-colors text-sm disabled:opacity-50'
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (string constants only).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/button-styles.ts
git commit -m "feat(pouriq): repoint button system to emerald-on-white"
```

---

## Task 3: `PourIqWordmark` component

**Files:**
- Create: `src/components/pouriq/PourIqWordmark.tsx`

- [ ] **Step 1: Create the wordmark**

Create `src/components/pouriq/PourIqWordmark.tsx`:

```tsx
// The Pour IQ wordmark: the one serif touch (Playfair, already loaded) as a
// quiet family cue to Jerry Can Spirits, with an optional attribution subline.
// No JCS logo — attribution is a text microline only.

export function PourIqWordmark({ attribution = true }: { attribution?: boolean }) {
  return (
    <span className="inline-flex flex-col leading-none">
      <span className="font-serif font-extrabold text-slate-900 text-lg tracking-tight">
        Pour IQ<span className="align-super text-[0.6em] font-semibold">™</span>
      </span>
      {attribution && (
        <span className="text-[10px] text-slate-400 mt-0.5">Built by Jerry Can Spirits</span>
      )}
    </span>
  )
}
```

(`font-serif` here intentionally resolves to Playfair Display per the Tailwind theme; this is the single allowed serif in the trade app.)

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/PourIqWordmark.tsx
git commit -m "feat(pouriq): PourIqWordmark (serif wordmark + attribution)"
```

---

## Task 4: Restyle the app shell (`PourIqShell.tsx`)

**Files:**
- Modify: `src/components/pouriq/PourIqShell.tsx`

Read the file first. Apply the Task 0 mapping throughout, plus these specific targets:

- [ ] **Step 1: Header bar**

The sticky header currently uses `bg-jerry-green-900/80 backdrop-blur-sm border-b border-gold-500/20`. Change to `bg-white border-b border-slate-200` (drop backdrop-blur). The hamburger button `text-parchment-200 hover:text-white` → `text-slate-500 hover:text-slate-900`.

- [ ] **Step 2: Wordmark**

Replace the current header brand (`<span class="text-gold-300 font-semibold uppercase tracking-widest text-sm">Pour IQ&trade;</span>` + venue name) with the new component:

```tsx
import { PourIqWordmark } from './PourIqWordmark'
// ...in the header brand link:
<Link href="/trade/pouriq" className="flex items-center gap-3 min-w-0">
  <PourIqWordmark />
  <span className="text-slate-400 text-sm truncate border-l border-slate-200 pl-3">{venueName}</span>
</Link>
```

- [ ] **Step 3: Sidebar nav**

- Sidebar container border `border-r border-gold-500/15` → `border-r border-slate-200`; add `bg-white` if not inherited.
- Group label `text-parchment-500` → `text-slate-400` (keep uppercase tracking).
- Active link `bg-gold-500/15 text-gold-100 font-semibold` → `bg-emerald-50 text-emerald-700 font-semibold`.
- Idle link `text-parchment-300 hover:bg-jerry-green-700/40 hover:text-parchment-100` → `text-slate-600 hover:bg-slate-100 hover:text-slate-900`.
- Mobile drawer `bg-jerry-green-900 border-gold-500/20` → `bg-white border-slate-200`; the overlay `bg-black/50` stays.

- [ ] **Step 4: Exit link (folded-in audit fix)**

The "← Return to trade account" link currently uses `border border-red-500/30 px-3 py-2 ... text-red-300 hover:border-red-500/50 hover:bg-red-900/20 hover:text-red-200`. Re-style as a neutral, non-destructive link:

```tsx
className="block rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700"
```

Keep the `← Return to trade account` text and the top border separator `border-t border-gold-500/10` → `border-t border-slate-200`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit` (clean).
Run: `grep -nE "jerry-green|parchment|gold-|font-serif" src/components/pouriq/PourIqShell.tsx` — expected: no matches (the only serif is inside `PourIqWordmark`).
Visual: load any `/trade/pouriq` page in dev — white shell, emerald active nav, serif wordmark with attribution.

- [ ] **Step 6: Commit**

```bash
git add src/components/pouriq/PourIqShell.tsx
git commit -m "feat(pouriq): light app shell + wordmark, neutral exit link"
```

---

## Task 5: Landing + login + licence gate

**Files:**
- Modify: `src/app/trade/landing/page.tsx`
- Modify: `src/app/trade/login/page.tsx`
- Modify: `src/components/pouriq/LicenceGate.tsx` (if present; grep for it)

- [ ] **Step 1: Apply the mapping + wordmark**

In all three, apply the Task 0 mapping. Replace any "Trade Portal" gold-pill/brand treatment and the page heading with `<PourIqWordmark />` where a brand mark belongs (import it). Page canvases → `bg-slate-50`; cards → `CARD`/`CARD_PAD` from `ui.ts`.

- [ ] **Step 2: Flatten the login button (folded-in audit fix)**

In `src/app/trade/login/page.tsx`, the submit button currently uses `bg-linear-to-r from-gold-600 to-gold-500 ... text-jerry-green-900`. Replace with the shared primary:

```tsx
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
// ...
<button type="submit" className={`${PRIMARY_BUTTON} w-full justify-center`} disabled={...}>...</button>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit` (clean).
Run: `grep -nE "jerry-green|parchment|gold-|bg-linear" src/app/trade/landing/page.tsx src/app/trade/login/page.tsx` — expected: no matches.
Visual: `/trade/login` and `/trade/landing` render light with the wordmark; login button is flat emerald.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/landing/page.tsx src/app/trade/login/page.tsx src/components/pouriq/LicenceGate.tsx
git commit -m "feat(pouriq): light landing + login, flat primary login button"
```

---

## Sweep tasks (6–11): pages + components by area

Each sweep task is the same shape, so it is written once here and the file list differs per task:

**For every file in the task's list:**
- [ ] Apply the Task 0 mapping to all inline dark classes.
- [ ] Where a file has a local `inputClass`/`labelClass`/`chipClass`/`helperClass`/card string, replace it by importing the matching constant from `@/lib/pouriq/ui.ts` (`INPUT`, `LABEL`, `CHIP`/`CHIP_ACTIVE`/`CHIP_IDLE`, `HELPER`, `CARD`). Delete the now-dead local constant.
- [ ] Replace any inline `bg-linear-to-r from-gold-* text-jerry-green-900` submit buttons with `PRIMARY_BUTTON` from `@/lib/pouriq/button-styles`.
- [ ] For severity/traffic-light colours, use `statusText`/`statusDot` from `ui.ts` instead of inline `text-emerald-300`/`amber`/`red`.
- [ ] **Verify the area:** `npx tsc --noEmit` clean; `grep -rnE "jerry-green|parchment|gold-|font-serif" <area files>` returns nothing; visual check of the area's main page in dev.
- [ ] Commit with `feat(pouriq): light <area> reskin`.

**Bespoke spots to handle explicitly when you reach them:**
- `MenuMatrix.tsx` — the 4 quadrant colours (currently emerald/sky/amber/red borders) → `border-emerald-300` (Winners), `border-sky-300` (Promote), `border-amber-300` (Fix), `border-rose-300` (Review), each with the matching `-50` soft fill; keep them visually distinct (this also helps the later print fix).
- `KpiCards.tsx` / stat numbers — positive values use `text-emerald-600`, negative/under-target `text-rose-600`.
- `SpecCard.tsx` / `MenuBuilder.tsx` — restyle only the on-screen chrome (controls, container); do NOT alter the `print-region` markup or the print stylesheet (white-label is out of scope).
- Severity dots / bands in `VarianceEditor.tsx`, `AttentionPanel.tsx` — use `statusDot`/`statusText`.

### Task 6: Dashboard + onboarding area
**Files:** `src/app/trade/pouriq/page.tsx`, `src/app/trade/pouriq/onboarding/page.tsx`, and components `AttentionPanel.tsx`, `KpiCards.tsx`, `RecommendationStream.tsx`, `MenuListCard.tsx` (grep `src/components/pouriq` for the ones the dashboard renders). Apply the sweep shape above.

### Task 7: Menus / cocktails / spec cards / builder area
**Files:** pages `src/app/trade/pouriq/menus/**`, `src/app/trade/pouriq/[menuId]/**` (detail, specs, menu-builder, menu-copy); components `MenuMatrix.tsx`, `MoversReport.tsx`, `MenuBalance.tsx`, `CocktailForm.tsx`, `CocktailTable.tsx`, `SpecCard.tsx`, `SpecCardsView.tsx`, `MenuBuilder.tsx`, `MenuCopyExport.tsx`, `VolumeEditor.tsx`, `ServeManager.tsx`, `CreateMenuForm.tsx`, `MakeActiveButton.tsx`. Apply the sweep shape.

### Task 8: Ingredients / library / import area
**Files:** pages `src/app/trade/pouriq/library/**`, `src/app/trade/pouriq/serves/**`, `src/app/trade/pouriq/[menuId]/import/**`; components `IngredientList.tsx`, `IngredientForm.tsx`, `IngredientPicker.tsx`, `ServeUnitPicker.tsx`, `BarcodeScanner.tsx`, `RipplePreview.tsx`, `RippleConfirmModal.tsx`, `ImportSourceTabs.tsx`, `ImportPreview.tsx`, `IngredientMatchRow.tsx`. Apply the sweep shape. (`IngredientForm.tsx` carries the canonical local `inputClass`/`labelClass`/`chipClass`/`helperClass` — replace them with the `ui.ts` constants here.)

### Task 9: Invoices area
**Files:** pages `src/app/trade/pouriq/invoices/**`; components `InvoiceScanFlow.tsx`, `InvoiceUpload.tsx`, `InvoicePreview.tsx`, `InvoiceLineRow.tsx`, `DeleteInvoiceButton.tsx`, `PriceInput.tsx`. Apply the sweep shape. (Note: `InvoicePreview.tsx`/`InvoiceLineRow.tsx` were last touched by the VAT work — keep the VAT toggle markup, only restyle colours.)

### Task 10: Variance / stock area
**Files:** pages `src/app/trade/pouriq/variance/**`, `src/app/trade/pouriq/stock/**`; components `VarianceEditor.tsx`, `VarianceReasonControl.tsx`, `StockManager.tsx`, `OrderReport.tsx`. Apply the sweep shape (use `statusText`/`statusDot` for the variance severity).

### Task 11: Settings / integrations / voice / help area
**Files:** pages `src/app/trade/pouriq/settings/**` (integrations, voice-profile), `src/app/trade/pouriq/help/**`; components `IntegrationCard.tsx`, `UnmatchedReview.tsx`, `VatModeToggle.tsx`, plus any settings forms. Apply the sweep shape.

---

## Task 12: Final verification + PR

- [ ] **Step 1: Global grep sweep**

Run:
```bash
grep -rnE "jerry-green|parchment|gold-|font-serif" src/app/trade/pouriq src/app/trade/landing src/app/trade/login src/components/pouriq | grep -v "PourIqWordmark"
```
Expected: **no output**. (The only legitimate `font-serif` is inside `PourIqWordmark.tsx`.) Fix any stragglers, committing per area.

- [ ] **Step 2: Typecheck + build**

Run: `npx tsc --noEmit` — expected clean.
Run: `npm run build` — expected: completes, no errors.

- [ ] **Step 3: Print-region regression check**

Confirm `.print-region` pages (spec cards, menu report, menu builder) still force white background on print and remain legible (the light theme should help, not hurt). No code change expected; just verify the print CSS in `globals.css` is untouched.

- [ ] **Step 4: Visual pass**

In dev, click through: login → landing → dashboard → menus → a menu detail → library → ingredient form → invoices → variance → stock → settings/integrations. Confirm: white surfaces, emerald accents, slate text, serif wordmark with attribution, distinguishable status colours, no dark-green panels anywhere.

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/pouriq-visual-identity
gh pr create --title "feat(pouriq): Daylight visual identity (light reskin)" --body "<summary: own light identity per spec; styling only, no migration; consumer site untouched; folds in exit-link + login-button fixes>"
```

---

## Self-review notes

- **Spec coverage:** identity decisions (Tasks 1–4), colour system as stock Tailwind via constants (Tasks 1–2, mapping Task 0), Inter + serif wordmark only (Tasks 3–4 + `font-serif` removal in mapping), attribution line (Task 3), shell/landing/login + folded fixes (Tasks 4–5), full page/component sweep (Tasks 6–11), consumer site untouched (mapping uses stock Tailwind, never edits the consumer tokens), out-of-scope respected (no white-label, no dark mode, no print-bug fix, no behaviour change), verification (Task 12). Covered.
- **No migration / behaviour change:** confirmed throughout; only class strings change.
- **Consistency:** constant names (`INPUT`, `LABEL`, `CHIP`, `CARD`, `statusText`, `statusDot`, `PRIMARY_BUTTON`, `PourIqWordmark`) are used identically across tasks.
- **Branch:** `feat/pouriq-visual-identity` (off `origin/main`); the cider/AF import fix (#829) is independent and may merge before or after.
