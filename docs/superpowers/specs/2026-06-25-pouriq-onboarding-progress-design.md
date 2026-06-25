# Pour IQ — Onboarding setup-progress panel (redesign slice 5)

**Date:** 2026-06-25
**Status:** Design approved (vision point 5 + Dan's "Pour IQ setup: 2 of 4 complete" dashboard note). Builds on the dashboard (#812).
**Origin:** [[pouriq-ui-redesign-vision]] point 5 — a new venue's dashboard should teach the workflow, not show an empty shell. The existing `/trade/pouriq/onboarding` page is a static Quickstart doc; this adds a **live** setup-progress panel on the dashboard.

**Depends on:** the dashboard (#812). Build branch `feat/pouriq-onboarding-progress` off `main`. **No migration, no new data** — derives from existing rows.

## Scope
A **setup-progress panel** at the top of the Today dashboard, shown only until setup is complete:
- "**Pour IQ setup: N of 4 complete**" + the four steps, each done (✓) or a link (→):
  1. Upload your first invoice → `/trade/pouriq/invoices/new`
  2. Import your first menu → `/trade/pouriq/new`
  3. Connect your till → `/trade/pouriq/settings/integrations`
  4. Complete your first stock count → `/trade/pouriq/stock`
- When all four are done, the panel is not rendered (established venues never see it).

## Data (existing rows; `src/lib/pouriq/dashboard.ts`)
- Pure `buildSetupProgress(flags)` (unit-tested): `flags = { hasInvoice, hasMenu, hasPos, hasCount }` → `{ steps: SetupStep[]; completeCount; total: 4; allComplete }`. `SetupStep = { key; label; href; done }`.
- `loadSetupProgress(db, tradeAccountId)`: gathers the flags and calls `buildSetupProgress` —
  - `hasInvoice`: `SELECT 1 FROM pouriq_invoices WHERE trade_account_id = ?1 LIMIT 1`.
  - `hasMenu`: `SELECT 1 FROM pouriq_menus WHERE trade_account_id = ?1 LIMIT 1`.
  - `hasCount`: `SELECT 1 FROM pouriq_stock_count_events WHERE trade_account_id = ?1 LIMIT 1`.
  - `hasPos`: `listConnections(db, tradeAccountId)` → any `enabled === 1`.

## UI (dashboard `page.tsx`)
Call `loadSetupProgress` alongside `loadDashboard`. When `!allComplete`, render the panel **above** the Attention section: a card with the heading + a `completeCount / total` indicator and a list of steps (done = ✓ + muted; not-done = a `Link` with a → ). Keep the existing dashboard sections below. (The new-venue "set an active menu" null-hint card stays; the setup panel sits above it and supersedes it visually for brand-new venues.)

## Tests
- `buildSetupProgress`: all false → `completeCount 0`, `allComplete false`, 4 steps with correct hrefs/done; mixed flags → correct count; all true → `allComplete true`.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope
- Changing the static `/trade/pouriq/onboarding` Quickstart doc (the panel may link to it later).
- Gating/locking dashboard tiles until setup completes (the vision's "unlock progressively") — the panel nudges; tiles already handle their own empty states.

## Success criteria
- A brand-new venue opening Pour IQ sees "Pour IQ setup: 0 of 4 complete" with four actionable steps; each completed step ticks off; the panel disappears once all four are done. No data/engine changes.
