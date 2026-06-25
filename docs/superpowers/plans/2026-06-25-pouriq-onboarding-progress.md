# Pour IQ Onboarding Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A live "Pour IQ setup: N of 4 complete" panel on the dashboard, shown until a venue has uploaded an invoice, imported a menu, connected a till, and done a stock count.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-onboarding-progress-design.md`

**Gates:** `npm run test:unit` + `npx tsc --noEmit`; final `npx opennextjs-cloudflare build`.

---

### Task 1: `buildSetupProgress` + `loadSetupProgress`

**Files:** `src/lib/pouriq/dashboard.ts`; `tests/unit/lib/pouriq-dashboard.test.ts` (extend).

- [ ] **Step 1:** Add to `dashboard.ts`:
```ts
export interface SetupStep { key: string; label: string; href: string; done: boolean }
export interface SetupProgress { steps: SetupStep[]; completeCount: number; total: number; allComplete: boolean }

export function buildSetupProgress(flags: { hasInvoice: boolean; hasMenu: boolean; hasPos: boolean; hasCount: boolean }): SetupProgress {
  const steps: SetupStep[] = [
    { key: 'invoice', label: 'Upload your first invoice', href: '/trade/pouriq/invoices/new', done: flags.hasInvoice },
    { key: 'menu', label: 'Import your first menu', href: '/trade/pouriq/new', done: flags.hasMenu },
    { key: 'pos', label: 'Connect your till', href: '/trade/pouriq/settings/integrations', done: flags.hasPos },
    { key: 'count', label: 'Complete your first stock count', href: '/trade/pouriq/stock', done: flags.hasCount },
  ]
  const completeCount = steps.filter((s) => s.done).length
  return { steps, completeCount, total: steps.length, allComplete: completeCount === steps.length }
}

export async function loadSetupProgress(db: D1Database, tradeAccountId: string): Promise<SetupProgress> {
  const exists = (table: string) => db.prepare(`SELECT 1 FROM ${table} WHERE trade_account_id = ?1 LIMIT 1`).bind(tradeAccountId).first()
  const [inv, menu, count, connections] = await Promise.all([
    exists('pouriq_invoices'),
    exists('pouriq_menus'),
    exists('pouriq_stock_count_events'),
    listConnections(db, tradeAccountId),
  ])
  return buildSetupProgress({
    hasInvoice: !!inv,
    hasMenu: !!menu,
    hasPos: connections.some((c) => c.enabled === 1),
    hasCount: !!count,
  })
}
```
Add `import { listConnections } from './pos/connections'` (the table names are interpolated constants, not user input — no injection risk).
- [ ] **Step 2: Test `buildSetupProgress`:** all-false → `{ completeCount: 0, total: 4, allComplete: false }` and 4 steps with the right hrefs/`done`; mixed (invoice+menu only) → `completeCount: 2, allComplete: false`; all-true → `allComplete: true`.
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-dashboard` + `npx tsc --noEmit`. **Commit** `feat(pouriq): setup-progress loader`.

---

### Task 2: Dashboard panel

**Files:** `src/app/trade/pouriq/page.tsx`.

- [ ] **Step 1:** Import `loadSetupProgress`. After `loadDashboard`, `const setup = await loadSetupProgress(db, access.tradeAccountId)` (or `Promise.all` both).
- [ ] **Step 2:** When `!setup.allComplete`, render a panel **above** the "Attention required" section: a bordered card with "Pour IQ setup" + `{setup.completeCount} of {setup.total} complete`, then `setup.steps.map` — done steps show a ✓ + muted label; not-done show a `Link href={step.href}` label with a `→`. When `allComplete`, render nothing.
- [ ] **Step 3:** Run `npm run test:unit` + `npx tsc --noEmit`. Reason: new venue (0 done) shows 4 steps; a fully-set venue shows no panel.
- [ ] **Step 4: Commit** `feat(pouriq): setup-progress panel on the dashboard`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 5 — live onboarding setup-progress panel; existing data; no migration. Note: the menus performance table is deferred to a brainstorm (it overlaps the menu-engineering matrix).
