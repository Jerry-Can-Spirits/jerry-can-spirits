# Pour IQ Trade-App-Own-Root Implementation Plan

> Gates each task: `npx tsc --noEmit`. Final: `npm run test:unit` + `npx opennextjs-cloudflare build`.

**Goal:** `/trade/pouriq/*` renders without the marketing chrome (header/footer/banner/background/`pt-20`/age gate/social-proof toast); marketing routes unchanged.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-trade-app-own-root-design.md`

---

### Task 1: shared route predicate + test

**Files:** `src/lib/pouriq/nav.ts`; `tests/unit/lib/pouriq-nav.test.ts`.

- [ ] **Step 1:** In `nav.ts`, after `isNavActive`, add:
  ```ts
  // True on the authenticated Pour IQ app (its own chrome), false on marketing
  // routes and the public /trade entry pages (login/apply/landing).
  export function isPourIqAppRoute(pathname: string | null): boolean {
    return pathname != null && (pathname === HOME || pathname.startsWith(HOME + '/'))
  }
  ```
- [ ] **Step 2:** In `tests/unit/lib/pouriq-nav.test.ts`, add a `describe('isPourIqAppRoute', ...)` (import it alongside `isNavActive`):
  ```ts
  it('is true on the app home and its sub-routes', () => {
    expect(isPourIqAppRoute('/trade/pouriq')).toBe(true)
    expect(isPourIqAppRoute('/trade/pouriq/menus')).toBe(true)
    expect(isPourIqAppRoute('/trade/pouriq/variance/abc')).toBe(true)
  })
  it('is false on marketing and public trade pages', () => {
    expect(isPourIqAppRoute('/')).toBe(false)
    expect(isPourIqAppRoute('/trade/login')).toBe(false)
    expect(isPourIqAppRoute('/trade/apply')).toBe(false)
    expect(isPourIqAppRoute(null)).toBe(false)
  })
  ```
- [ ] **Step 3:** `npx tsc --noEmit` + `npm run test:unit`. **Commit** `feat(pouriq): isPourIqAppRoute predicate`.

---

### Task 2: `SiteChrome` + layout extraction

**Files:** `src/components/SiteChrome.tsx` (new); `src/app/layout.tsx`.

- [ ] **Step 1: `SiteChrome.tsx`** (`'use client'`):
  ```tsx
  'use client'

  import type { ReactNode } from 'react'
  import { usePathname } from 'next/navigation'
  import Header from './Header'
  import Footer from './Footer'
  import ShippingBanner from './ShippingBanner'
  import { LazyCartographicBackground } from './ClientLazy'
  import { isPourIqAppRoute } from '@/lib/pouriq/nav'

  export default function SiteChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    if (isPourIqAppRoute(pathname)) return <>{children}</>

    return (
      <>
        <div className="print:hidden">
          <LazyCartographicBackground opacity={0.75} showCoordinates={true} showCompass={true} className="fixed inset-0 z-0 pointer-events-none" />
        </div>
        <div className="relative z-10">
          <Header />
          <main id="main-content" className="pt-20" style={{ paddingTop: 'calc(5rem + var(--announcement-height, 0px))' }}>
            {children}
          </main>
          <div className="print:hidden">
            <ShippingBanner />
          </div>
          <Footer />
        </div>
      </>
    )
  }
  ```
- [ ] **Step 2: `layout.tsx`** — remove the imports now only used by SiteChrome (`Header`, `Footer`, `ShippingBanner`, `LazyCartographicBackground` — keep `LazyCartDrawer`, `LazySocialProofToast`), add `import SiteChrome from "@/components/SiteChrome";`. Inside `<ClientWrapper>`, replace the background `<div className="print:hidden">...</div>` + the entire `<div className="relative z-10">...</div>` block with:
  ```tsx
  <SiteChrome>{children}</SiteChrome>
  ```
  Leave the skip-to-content link, the `{/* Consent now handled by Cookiebot CMP */}` comment, `LazyCartDrawer`, `LazySocialProofToast`, and the AdSense script exactly where they are.
- [ ] **Step 3:** `npx tsc --noEmit`. **Commit** `feat(pouriq): SiteChrome gates marketing chrome off the trade app`.

---

### Task 3: skip-target + consumer gates

**Files:** `src/components/PourIqShell.tsx`; `src/components/ClientWrapper.tsx`; `src/components/SocialProofToast.tsx`.

- [ ] **Step 1: `PourIqShell.tsx`** — give the content wrapper the skip-link id (keep it a `<div>`; pages render their own `<main>`):
  ```tsx
  <div id="main-content" className="flex-1 min-w-0">{children}</div>
  ```
- [ ] **Step 2: `ClientWrapper.tsx`** — import `isPourIqAppRoute` from `@/lib/pouriq/nav`; extend the bypass:
  ```ts
  const shouldBypassGate = isAgeVerified || isLegalPage || isBot || isPourIqAppRoute(pathname)
  ```
- [ ] **Step 3: `SocialProofToast.tsx`** — import `usePathname` from `next/navigation` and `isPourIqAppRoute`. At the top of the component `const pathname = usePathname()`. In the existing `useEffect`, first line `if (isPourIqAppRoute(pathname)) return`. Guard render: change the existing early return so it also returns `null` on the app, e.g. `if (!data || isPourIqAppRoute(pathname)) return null` (keep all hooks above any return).
- [ ] **Step 4:** `npx tsc --noEmit` + `npm run test:unit`. **Commit** `feat(pouriq): app skip-target, bypass age gate + social proof on trade app`.

---

## Final gate
- [ ] `npm run test:unit` green, `npx tsc --noEmit` clean, `npx opennextjs-cloudflare build` completes.
- [ ] Independent review (correctness: pathname predicate everywhere, no nested `<main>`, no lost imports, hooks-before-return in SocialProofToast).
- [ ] PR. Body: redesign item 3 — trade app off the marketing chrome (conditional SiteChrome + consumer-gate bypass); no migration.
