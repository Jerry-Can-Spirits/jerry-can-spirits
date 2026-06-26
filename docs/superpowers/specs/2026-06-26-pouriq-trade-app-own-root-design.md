# Pour IQ — Trade app off the marketing chrome (redesign item 3)

**Date:** 2026-06-26
**Status:** Approach + scope approved (Dan, AskUserQuestion): conditional chrome, strip visual chrome AND the consumer gates.
**Origin:** [[pouriq-ui-redesign-vision]] noted item: "the trade app still renders INSIDE the marketing `RootLayout` Header/Footer (`pt-20`), so the shell's sticky header sits below the public site chrome." Address by giving `/trade/pouriq/*` its own chrome.

## Problem
Every page — including `/trade/pouriq/*` — renders inside the single root layout (`src/app/layout.tsx`), which wraps `children` in the marketing chrome:
- `Header` is `fixed`; the marketing `<main>` carries `pt-20` to clear it. On the trade app the marketing header overlays the top **and** PourIqShell's own sticky header sits at `top-0` underneath it — a visible double-header.
- `Footer` + `ShippingBanner` render below the app; the cartographic background renders behind.
- The marketing `<main id="main-content" className="pt-20">` **wraps each trade page's own `<main>`** (all 27 trade pages render their own `<main>`), so there is already a nested-`<main>` (invalid HTML) on every trade route today.
- Consumer chrome leaks in: the alcohol **AgeGate** (`ClientWrapper`) gates a fresh trade login behind "are you 18?", and the **SocialProofToast** ("someone just bought a bottle") shows in a B2B inventory tool.

## Approach (approved): conditional chrome by pathname
No route-group refactor, no file moves. A small client component decides whether to render the marketing chrome, keyed on the pathname. Reversible and low blast radius. Marketing routes are untouched.

A single shared predicate is the source of truth for "is this the trade app":
- **`isPourIqAppRoute(pathname: string | null): boolean`** in `src/lib/pouriq/nav.ts` → `pathname != null && (pathname === '/trade/pouriq' || pathname.startsWith('/trade/pouriq/'))`. Used by SiteChrome, ClientWrapper, and SocialProofToast so the rule lives in one place.

## Components
- **`SiteChrome`** (new client, `src/components/SiteChrome.tsx`): `usePathname()`; when `isPourIqAppRoute` → return `{children}` bare (the page's own `<main>` and PourIqShell own the viewport). Otherwise render today's chrome exactly: the `print:hidden` `LazyCartographicBackground`, then `<div className="relative z-10">` with `Header`, `<main id="main-content" className="pt-20" style={{paddingTop:'calc(5rem + var(--announcement-height, 0px))'}}>{children}</main>`, the `print:hidden` `ShippingBanner`, and `Footer`. (This is the block moved verbatim out of `layout.tsx`; the existing inline `style` is relocated as-is, not newly introduced.)
- **`layout.tsx`**: inside `<ClientWrapper>`, replace the background + `relative z-10` chrome block with `<SiteChrome>{children}</SiteChrome>`. The skip-to-content link, `CartProvider`, analytics scripts, `LazyCartDrawer`, `LazySocialProofToast` stay where they are.
- **`PourIqShell`**: the content wrapper `<div className="flex-1 min-w-0">{children}</div>` gains `id="main-content"` (stays a `<div>`, NOT a `<main>`, because each trade page renders its own `<main>` inside it). This keeps the global skip-to-content link (`href="#main-content"`) working on trade routes without nesting `<main>`.
- **`ClientWrapper`**: add `isPourIqAppRoute(pathname)` to `shouldBypassGate` so the AgeGate never shows in the trade app.
- **`SocialProofToast`**: add `usePathname()`; when `isPourIqAppRoute`, skip the fetch effect and render `null`.

## Out of scope
- Route groups / two root layouts (rejected — too large for the problem).
- Marketing analytics (Cookiebot/Klaviyo/FB Pixel/Google Tag/AdSense) on the trade app — a separate consent concern, left as-is.
- `LazyCartDrawer` — harmless, left rendered.
- The other `/trade/*` entry pages (`login`, `apply`, `landing`) keep the marketing chrome (public-facing).

## Tests
Pure predicate `isPourIqAppRoute` is unit-tested in `tests/unit/lib/pouriq-nav.test.ts` (exact home, sub-routes, non-trade paths, null). The chrome wiring is presentational (pathname → which subtree) and covered by the build + manual check. Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`. Manual: load `/trade/pouriq` → no marketing header/footer/background, no double-header, no age gate, no social-proof toast; load `/` → chrome unchanged.

## Success criteria
The Pour IQ shell owns the full viewport on `/trade/pouriq/*` (no marketing header/footer/banner/background, no `pt-20`, no nested `<main>`, no consumer age gate or social-proof toast), while every marketing route renders exactly as before. Skip-to-content still lands in the main content region on both.
