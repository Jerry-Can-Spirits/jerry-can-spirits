# Pour IQ — Spec card polish: flexible print + cost per serve (redesign slice 8)

**Date:** 2026-06-26
**Status:** Scope agreed (Dan). Builds on the shipped spec cards (#697 + later glass/Directions/Print/alphabetical work).
**Origin:** [[pouriq-ui-redesign-vision]]. The spec card is already complete (glass, garnish, ingredients w/ serve units, Directions, "Tell the customer", Field Manual link, Print button, alphabetical). Dan's polish asks: **ease of reading + the option to print as a booklet OR multiple cards along the bar**, plus **cost per serve** on the card. Photo deferred (awaiting bar feedback); the builder form is fine as-is.

**Depends on:** the spec cards page + `calculateMenuMetrics`. Build branch `feat/pouriq-spec-card-polish-v2` off `main`. **No migration, no new data.**

## Scope
1. **Flexible print layout.** Today each card prints one-per-page (`print:break-before-page`). Add a **Layout** toggle on the spec-cards page: **One per page** (current, full A4 cards for a booklet/laminate) vs **Compact** (multiple cards per page — a 2-up print grid, no forced page break, for "along the bar" strips). Screen view is unchanged (single column); the toggle only affects print + card density.
2. **Cost per serve** on the card (manager-facing). A **Show costs** toggle (off by default, so bar cards stay clean). When on, each card shows a muted footer: `Pour cost £X.XX · GP Y%` (or "Cost incomplete" when an ingredient is unpriced). Computed from `calculateMenuMetrics` — no new data.
3. **Readability:** keep the existing clear hierarchy; ensure the compact layout stays legible (slightly reduced print padding/size).

## Components
- **`SpecCardsView`** (new client, wraps the cards): holds `compact` + `showCost` state; renders a no-print controls row — a Layout segmented toggle (One per page / Compact), a Show-costs checkbox, and the existing `PrintReportButton` — then the cards. Container is `print:grid print:grid-cols-2 print:gap-4` when `compact`, else a plain stack. Props: `{ cocktails: CocktailWithIngredients[]; costById: Record<string, { pourCostP: number; gpPct: number; complete: boolean }>; priceIncludesVat: boolean }`.
- **`SpecCard`** gains props `compact?: boolean`, `cost?: { pourCostP: number; gpPct: number; complete: boolean } | null`, `showCost?: boolean`:
  - Print break/density: `compact` → `print:break-inside-avoid print:p-4` (no break-before, slightly tighter); non-compact → the existing `print:break-before-page print:first:break-before-auto print:p-6`.
  - Cost footer: when `showCost && cost`, a muted line — `complete` → `Pour cost {£pourCostP} · GP {gpPct.toFixed(0)}%`; else `Cost incomplete`. Rendered after the existing content, before the Field Manual link (or as the card's last line).
- **Spec cards page** (`[menuId]/specs/page.tsx`): compute `const metrics = calculateMenuMetrics(cocktails, priceIncludesVat, [])` and build `costById[m.cocktail_id] = { pourCostP: m.pour_cost_p, gpPct: m.gp_pct, complete: m.cost_complete }`. Replace the inline `PrintReportButton` + the cards map with `<SpecCardsView cocktails={cocktails} costById={costById} priceIncludesVat={priceIncludesVat} />` (inside the existing `print-region`; the no-print header/back-link stay).

## Tests
- This is presentational (toggles + print CSS + a computed cost line); the cost numbers come from the already-tested `calculateMenuMetrics`. No new pure logic warrants a unit test. Gates: `npm run test:unit` (unchanged), `npx tsc --noEmit`, `npx opennextjs-cloudflare build`. Manual: toggle Compact → cards flow 2-up in print preview; Show costs → footer appears.

## Out of scope
- Photo per cocktail (awaiting bar feedback — new data).
- Cocktail builder/edit form changes (nothing flagged as clunky).
- Quiz mode / "new this week" briefing (separate deferred module).

## Success criteria
- A manager can print the spec cards either as full one-per-page cards (booklet/laminate) or compact multiple-per-page strips, and optionally show pour cost + GP per card; bar-facing cards stay clean by default. No data/engine changes.
