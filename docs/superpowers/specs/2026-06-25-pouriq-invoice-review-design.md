# Pour IQ — Invoice review redesign (redesign slice 4)

**Date:** 2026-06-25
**Status:** Design approved (the invoice-mapping mockup was validated in the visual companion). Builds on the shell (#811) + dashboard (#812).
**Origin:** [[pouriq-ui-redesign-vision]]. The invoice review is where a new venue first judges Pour IQ ("this saves me hours"). Reorganise the flat line table into an attention-first layout: surface only the lines needing a decision, collapse the confident ones, and group price changes.

**Depends on:** the existing invoice extract/commit flow + the catalogue match (#807/#808). Build branch `feat/pouriq-invoice-review` off `main`. **No migration, no new engines, no new server data.**

## Locked scope
- **Ship now (layout rework of `InvoicePreview`, reusing `InvoiceLineRow`):** a summary bar (auto-matched / need-a-choice / new counts) + **Jump to next unresolved**; three grouped sections — **Needs your attention** (catalogue-adopt / pick / create-new), **Price changes detected** (auto-matched lines whose invoice net price differs from the stored cost — shows old → new + Δ), and **Auto-matched** (no-change lines, collapsed); a footer showing how many lines still need a decision.
- **Defer (agreed):** the inline "affects N cocktails" ripple count (the full ripple already lives on the post-commit impact page; wiring cost-impact into the preview is a fast-follow).

## Pure classifier (`src/lib/pouriq/invoice-review.ts`, new + unit-tested)
```ts
export type InvoiceLineCategory = 'needs-attention' | 'price-change' | 'auto-ok'
export interface InvoiceLineInput {
  matchKind: 'auto' | 'catalogue' | 'suggestions' | 'no-match'
  priceChanged: boolean   // auto match AND invoice net price ≠ stored cost
  resolved: boolean       // no further action needed (skipped, or applied with a valid target/price)
}
export interface InvoiceReviewSummary { autoMatched: number; needChoice: number; newProducts: number; unresolved: number }
export function classifyInvoiceLine(i: InvoiceLineInput): InvoiceLineCategory
export function summariseInvoiceLines(items: InvoiceLineInput[]): InvoiceReviewSummary
```
- `classifyInvoiceLine`: `auto` → (`priceChanged` ? `'price-change'` : `'auto-ok'`); else `'needs-attention'`.
- `summariseInvoiceLines`: `autoMatched` = count `matchKind==='auto'`; `newProducts` = count `'no-match'`; `needChoice` = count `'catalogue'|'suggestions'`; `unresolved` = count `!resolved`.

## `InvoicePreview` rework (client)
The component already builds `LineState[]` and a `libraryById` map. Add, per line index, the derived inputs:
- `priceChanged`: only for `match.kind==='auto'` — `current = libraryById.get(library_id)?.price_p`; `priceChanged = current != null && state.unit_price_p !== current`.
- `resolved`: `!state.applied` → true; applied existing with a `library_id` → true; applied `new_library` with `price_p > 0` → true; else false.
Then `summariseInvoiceLines` for the summary bar, and `classifyInvoiceLine` to place each line.

Render order (replace the single table):
1. **Invoice details** card (unchanged: supplier / number / date).
2. **Summary bar:** `N auto-matched · M need a choice · K new` + a **Jump to next unresolved** button (scrolls the next `!resolved` row into view via a ref/`scrollIntoView`). "net prices read correctly" trust line stays.
3. **Needs your attention (count)** — a table of the `needs-attention` lines (`InvoiceLineRow` reused).
4. **Price changes detected (count)** — a table of the `price-change` lines.
5. **Auto-matched (count)** — collapsed behind a toggle; expands to a table of the `auto-ok` lines.
6. **Footer:** "{unresolved} line(s) still need a decision" (when > 0) + the existing **Save invoice** primary (always enabled; skips unapplied lines as today) + a "Save & finish later" affordance is out of scope.

`InvoiceLineRow` is reused unchanged (it is a `<tr>`; each section renders its own small table with the same `thead`). Density: keep the row's existing column layout; the grouped tables are narrower than the old single full-width table, addressing the "data spread edge-to-edge" note.

## Tests
- `classifyInvoiceLine`: auto+priceChanged → 'price-change'; auto+!priceChanged → 'auto-ok'; catalogue/suggestions/no-match → 'needs-attention'.
- `summariseInvoiceLines`: a mixed set → correct counts (autoMatched, needChoice, newProducts, unresolved).
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope (later)
- Inline "affects N cocktails" ripple (fast-follow); the post-commit impact page is unchanged.
- Any change to extract/commit, matching, or the catalogue.
- Brand/visual polish pass.

## Success criteria
- After a scan, the review surfaces the handful of lines needing a decision first, groups detected price changes, and tucks confident auto-matches behind a count; Jump to next unresolved moves through the decisions; the footer makes the remaining work obvious. Commit behaviour is unchanged.
