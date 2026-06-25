# Pour IQ Invoice Review Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** Reorganise the flat invoice-line table into an attention-first review — summary bar + jump-to-unresolved + grouped sections (needs-attention / price-changes / collapsed auto-matched) — reusing `InvoiceLineRow`.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-invoice-review-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`.

---

### Task 1: Pure classifier

**Files:** `src/lib/pouriq/invoice-review.ts` (new); `tests/unit/lib/pouriq-invoice-review.test.ts` (new).

- [ ] **Step 1:** Implement `classifyInvoiceLine` + `summariseInvoiceLines` per the spec (types `InvoiceLineCategory`, `InvoiceLineInput`, `InvoiceReviewSummary`).
- [ ] **Step 2: Tests:** classify each match kind (auto+priceChanged→'price-change'; auto+!→'auto-ok'; catalogue/suggestions/no-match→'needs-attention'); summarise a mixed list → `{ autoMatched, needChoice, newProducts, unresolved }` correct (e.g. 2 auto [1 changed], 1 catalogue, 1 suggestions, 2 no-match, with 3 unresolved).
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-invoice-review` + `npx tsc --noEmit`. **Commit** `feat(pouriq): invoice-review line classifier`.

---

### Task 2: `InvoicePreview` rework

**Files:** `src/components/pouriq/InvoicePreview.tsx`.

- [ ] **Step 1:** Read the current file. Per line index, derive `priceChanged` (auto match only: `libraryById.get(library_id)?.price_p` defined and `!== state.unit_price_p`) and `resolved` (`!applied` → true; applied existing w/ `library_id` → true; applied `new_library` w/ `price_p > 0` → true; else false). Build `InvoiceLineInput[]` and call `summariseInvoiceLines` + `classifyInvoiceLine`.
- [ ] **Step 2:** Replace the single table with: invoice-details card (unchanged) → **summary bar** (`N auto-matched · M need a choice · K new`, the "net prices read correctly" note, and a **Jump to next unresolved** button that `scrollIntoView()`s the next `!resolved` row via a ref keyed by index) → **Needs your attention** table (needs-attention lines) → **Price changes detected** table (price-change lines) → **Auto-matched (count)** collapsed (toggle → table of auto-ok lines) → footer ("{unresolved} still need a decision" when > 0) + the existing **Save invoice** button. Each section renders its own `<table>` with the existing `thead` and the reused `InvoiceLineRow` rows (only the lines in that group, by original index, so `onChange(index, ...)` stays correct). Section headers/counts use the summary. Omit a section when its group is empty.
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually reason: each line appears in exactly one section; indices passed to `InvoiceLineRow`/`onChange` are the original `initial.lines` indices; commit body unchanged.
- [ ] **Step 4: Commit** `feat(pouriq): attention-first invoice review layout`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 4 — attention-first invoice review (summary + jump + grouped sections); inline ripple count deferred; commit/extract unchanged; no migration.
