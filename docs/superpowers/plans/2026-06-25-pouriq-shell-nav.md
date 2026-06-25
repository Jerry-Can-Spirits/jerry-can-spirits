# Pour IQ App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development or executing-plans. Checkbox steps.

**Goal:** A persistent shell (grouped left nav + top bar with + Add / Import) wrapping every `/trade/pouriq` page, replacing the per-page header button row.

**Architecture:** Pure `nav.ts` (config + `isNavActive`); a client `PourIqShell` (responsive frame, `usePathname` active state) with an `AddImportMenu` dropdown; a server `layout.tsx` that guards the session, fetches the venue name, and renders the shell; the hub page de-cluttered. No engines, no migration.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-shell-nav-design.md`

**Gates (each task):** `npm run test:unit` + `npx tsc --noEmit`. Final: `npx opennextjs-cloudflare build`.

---

### Task 1: nav config + `isNavActive`

**Files:** `src/lib/pouriq/nav.ts`; `tests/unit/lib/pouriq-nav.test.ts`.

- [ ] **Step 1: Write `src/lib/pouriq/nav.ts`:**
```ts
export interface NavItem { label: string; href: string }
export interface NavGroup { label: string; items: NavItem[] }

const HOME = '/trade/pouriq'

// Slice 1: only items with a destination today. Deferred items (Dashboard,
// Sales & performance, Tasks & alerts, global Cocktails, Imports, Team &
// locations) are added as their screens ship.
export const NAV_GROUPS: NavGroup[] = [
  { label: 'Operate', items: [
    { label: 'Variance', href: '/trade/pouriq/variance' },
    { label: 'Stock', href: '/trade/pouriq/stock' },
  ] },
  { label: 'Build', items: [
    { label: 'Menus', href: HOME },
    { label: 'Ingredients', href: '/trade/pouriq/library' },
    { label: 'Serves', href: '/trade/pouriq/serves' },
    { label: 'Suppliers & invoices', href: '/trade/pouriq/invoices' },
  ] },
  { label: 'Connect', items: [
    { label: 'Integrations', href: '/trade/pouriq/settings/integrations' },
  ] },
  { label: 'Settings', items: [
    { label: 'Voice profile', href: '/trade/pouriq/settings/voice-profile' },
    { label: 'Help', href: '/trade/pouriq/help' },
  ] },
]

// The home item matches only its exact path; every other item also matches its
// sub-routes (e.g. /library/new highlights Ingredients).
export function isNavActive(pathname: string, href: string): boolean {
  if (href === HOME) return pathname === HOME
  return pathname === href || pathname.startsWith(href + '/')
}
```
- [ ] **Step 2: Test** `tests/unit/lib/pouriq-nav.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { isNavActive } from '@/lib/pouriq/nav'

describe('isNavActive', () => {
  it('matches the home item only exactly', () => {
    expect(isNavActive('/trade/pouriq', '/trade/pouriq')).toBe(true)
    expect(isNavActive('/trade/pouriq/variance', '/trade/pouriq')).toBe(false)
  })
  it('matches a section and its sub-routes', () => {
    expect(isNavActive('/trade/pouriq/library', '/trade/pouriq/library')).toBe(true)
    expect(isNavActive('/trade/pouriq/library/new', '/trade/pouriq/library')).toBe(true)
    expect(isNavActive('/trade/pouriq/stock/order', '/trade/pouriq/stock')).toBe(true)
  })
  it('does not cross sections', () => {
    expect(isNavActive('/trade/pouriq/stock', '/trade/pouriq/variance')).toBe(false)
  })
})
```
- [ ] **Step 3:** Run `npm run test:unit -- pouriq-nav` (PASS). **Commit** `feat(pouriq): nav config + isNavActive helper`.

---

### Task 2: `AddImportMenu` + `PourIqShell` components

**Files:** `src/components/pouriq/AddImportMenu.tsx`; `src/components/pouriq/PourIqShell.tsx`. Match the existing theme (`bg-jerry-green-*`, `gold-*`, `parchment-*`) and reuse `PRIMARY_BUTTON` from `@/lib/pouriq/button-styles` for the + Add / Import trigger.

- [ ] **Step 1: `AddImportMenu.tsx`** (`'use client'`): a `PRIMARY_BUTTON` "+ Add / Import" that toggles a dropdown of `Link`s — New menu (`/trade/pouriq/new`), Upload invoice (`/trade/pouriq/invoices/new`), Add ingredient (`/trade/pouriq/library/new`), Start stock count (`/trade/pouriq/stock`), Connect POS (`/trade/pouriq/settings/integrations`). `useState` open; close on item click, on `Escape`, and via a full-screen transparent backdrop behind the menu. Menu items are styled list rows.
- [ ] **Step 2: `PourIqShell.tsx`** (`'use client'`, props `{ venueName: string; children: React.ReactNode }`):
  - `usePathname()`; `const [navOpen, setNavOpen] = useState(false)` for the mobile drawer.
  - **Top bar** (sticky): left = a hamburger button (`lg:hidden`, `aria-label="Menu"`, toggles `navOpen`) + `Link href="/trade/pouriq"` Pour IQ™ wordmark + `venueName` (muted). Right = `<AddImportMenu />`.
  - **Body:** a flex row. **Nav** = `<nav aria-label="Pour IQ">` rendering `NAV_GROUPS` (group `.label` + items as `Link`s; active item via `isNavActive(pathname, item.href)` → highlighted + `aria-current="page"`; clicking an item also `setNavOpen(false)`). Desktop: `hidden lg:block` persistent sidebar. Mobile: when `navOpen`, an overlay drawer (fixed, with a backdrop that closes it).
  - **Content:** `<div className="flex-1 min-w-0">{children}</div>` (pages keep their own `<main>`/containers inside).
- [ ] **Step 3:** `npx tsc --noEmit` (components compile; not yet mounted). **Commit** `feat(pouriq): PourIqShell + AddImportMenu components`.

---

### Task 3: `layout.tsx` + hub de-clutter

**Files:** Create `src/app/trade/pouriq/layout.tsx`; modify `src/app/trade/pouriq/page.tsx`.

- [ ] **Step 1:** Confirm the venue-name column: check `trade_accounts` schema (grep migrations / `git grep "CREATE TABLE trade_accounts"`). Use the real column (likely `name`); if none exists, pass `'Pour IQ™'` and note it.
- [ ] **Step 2: `layout.tsx`** (server):
```tsx
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { PourIqShell } from '@/components/pouriq/PourIqShell'

export default async function PourIqLayout({ children }: { children: React.ReactNode }) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const row = await db.prepare(`SELECT name FROM trade_accounts WHERE id = ?1`).bind(access.tradeAccountId).first<{ name: string | null }>()
  const venueName = row?.name?.trim() || 'Pour IQ™'

  return <PourIqShell venueName={venueName}>{children}</PourIqShell>
}
```
(Pages keep their own `checkPourIqAccess` + `LicenceGate` — the layout only short-circuits `no-session` and supplies the frame. If the `name` column differs, adjust the SELECT.)
- [ ] **Step 3: De-clutter `page.tsx`:** remove the header `<div className="flex flex-wrap items-center gap-2">…</div>` button cluster (Compare/Library/Serves/Variance/Stock/Integrations/Voice Profile/New menu) and the `← Trade Hub` `Link`. Keep the "Your menus" heading, `AttentionPanel`, and the menu grid. Drop now-unused imports (`PRIMARY_BUTTON`/`SECONDARY_BUTTON`, `Link` if unused).
- [ ] **Step 4:** Run `npm run test:unit` + `npx tsc --noEmit`. Manually reason: every `/trade/pouriq` route now renders inside the shell; the hub no longer shows the button row.
- [ ] **Step 5: Commit** `feat(pouriq): mount the app shell layout + de-clutter the hub`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] PR. Body: redesign slice 1 — workflow-nav shell + top bar; no engines/migration; Today dashboard + sync status + back-link cleanup are later slices.
