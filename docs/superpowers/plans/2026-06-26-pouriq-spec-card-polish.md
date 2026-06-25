# Pour IQ Spec Card Polish Implementation Plan

> Steps use checkbox (`- [ ]`) syntax. Gates each task: `npx tsc --noEmit`. Final: `npm run test:unit` (unchanged) + `npx opennextjs-cloudflare build`.

**Goal:** Flexible spec-card print (one-per-page vs compact multi-up) + an optional cost-per-serve footer.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-spec-card-polish-design.md`

---

### Task 1: `SpecCard` props (compact + cost)

**Files:** `src/components/pouriq/SpecCard.tsx`.

- [ ] **Step 1:** Add to `Props`: `compact?: boolean`, `showCost?: boolean`, `cost?: { pourCostP: number; gpPct: number; complete: boolean } | null`.
- [ ] **Step 2:** Make the `<article>` print classes conditional on `compact`: `compact` → `print:break-inside-avoid print:p-4 print:mb-4`; else the existing `print:break-before-page print:first:break-before-auto print:p-6 print:mb-0`. (Keep the screen classes `mb-12 p-8` etc.)
- [ ] **Step 3:** Before the Field Manual link, add the cost footer: when `showCost && cost`, a muted line —
  `cost.complete` → `<p className="text-xs text-parchment-400 print:text-stone-600 mt-2">Pour cost £{(cost.pourCostP/100).toFixed(2)} · GP {cost.gpPct.toFixed(0)}%</p>`; else `<p ...>Cost incomplete</p>`.
- [ ] **Step 4:** `npx tsc --noEmit`. **Commit** `feat(pouriq): spec card compact + cost-per-serve props`.

---

### Task 2: `SpecCardsView` + page wiring

**Files:** `src/components/pouriq/SpecCardsView.tsx` (new client); `src/app/trade/pouriq/[menuId]/specs/page.tsx`.

- [ ] **Step 1: `SpecCardsView.tsx`** (`'use client'`), props `{ cocktails: CocktailWithIngredients[]; costById: Record<string, { pourCostP: number; gpPct: number; complete: boolean }>; priceIncludesVat: boolean }`:
  - `const [compact, setCompact] = useState(false)`, `const [showCost, setShowCost] = useState(false)`.
  - A `no-print` controls row: a Layout segmented toggle (two buttons "One per page" / "Compact", active = `PRIMARY_BUTTON`, idle = `SECONDARY_BUTTON_SM` from `button-styles`), a `Show costs` checkbox label, and `<PrintReportButton label="Print spec cards" />`.
  - The cards container: `<div className={compact ? 'print:grid print:grid-cols-2 print:gap-4' : ''}>` mapping `cocktails` → `<SpecCard key={c.id} cocktail={c} priceIncludesVat={priceIncludesVat} compact={compact} showCost={showCost} cost={costById[c.id] ?? null} />`.
- [ ] **Step 2: `specs/page.tsx`:** import `calculateMenuMetrics` + `SpecCardsView`. After loading `cocktails`, `const metrics = calculateMenuMetrics(cocktails, priceIncludesVat, [])`; build `const costById: Record<string, { pourCostP: number; gpPct: number; complete: boolean }> = {}`; for each `m of metrics.cocktail_metrics` set `costById[m.cocktail_id] = { pourCostP: m.pour_cost_p, gpPct: m.gp_pct, complete: m.cost_complete }`. Remove the inline `PrintReportButton` and the `cocktails.map(... <SpecCard/> ...)` block; in their place (when `cocktails.length > 0`) render `<SpecCardsView cocktails={cocktails} costById={costById} priceIncludesVat={priceIncludesVat} />`. Drop now-unused imports (`SpecCard`, `PrintReportButton` move into the view).
- [ ] **Step 3:** `npx tsc --noEmit` + `npm run test:unit` (unchanged). Reason: One-per-page = today's behaviour; Compact adds a 2-col print grid + break-inside-avoid; Show costs adds the footer. **Commit** `feat(pouriq): spec cards view with print layout + cost toggles`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 8 — spec-card polish (compact-print toggle for booklet/along-the-bar + optional cost-per-serve); photo + builder changes out of scope; no migration.
