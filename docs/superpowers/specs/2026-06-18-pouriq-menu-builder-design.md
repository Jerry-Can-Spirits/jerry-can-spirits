# Pour IQ: Customer Menu Builder (print-to-PDF) — Design

**Date:** 2026-06-18
**Status:** Approved (demo-scoped)

## Background

Pour IQ has internal outputs (KPI report, spec cards) and a raw copy export (`/menu-copy`), but nothing that produces the **customer-facing, branded menu** people read at the table. This builds that — a laid-out menu from data already held (cocktails, brand-voiced descriptions, prices), saved to PDF via the browser, replacing the agency spend on menu refreshes.

Demo-scoped: zero new dependencies, no schema, reusing the established `.print-region` / `.no-print` print system.

## Decisions

- **Recommended scope:** branded menu + view options.
- **Save-as-PDF = `window.print()`** (browser "Save as PDF"), same proven path as the report/spec cards. No server-side PDF library (the Worker bundle is ~7 MB of 10 MB; a PDF lib is unjustified for this).
- **Deferred:** QR-served public digital menu (needs a public unauthenticated route — own security design); logo/colour upload; section grouping (no section field exists).

## Architecture

### Page — `src/app/trade/pouriq/[menuId]/menu-builder/page.tsx`

Server component: access gate (mirror `/specs`), `getMenu(db, menuId, tradeAccountId)` (notFound if missing), `listCocktailsForMenu`. Maps to a minimal shape `{ name, description, sale_price_p }[]` (ordered by position, as `listCocktailsForMenu` already returns) and renders `<MenuBuilder menuName title drinks />`.

### Component — `src/components/pouriq/MenuBuilder.tsx` (client)

State: `title` (default menu name), `columns` (1 | 2), `showPrices` (default true), `showDescriptions` (default true).

Layout:
- An options bar (`no-print`): a text input for the menu title, a 1/2-column toggle, checkboxes for prices and descriptions, and a "Save as PDF" button (`window.print()`).
- The menu itself inside the page's `.print-region` main: a centred serif title, then the drinks. Each drink: name + price on a row (price hidden when `showPrices` is off), description beneath in italic (hidden when `showDescriptions` is off or the drink has none). Two-column uses CSS columns (`columns-2`) when `columns === 2`.
- Prices are the customer-facing `sale_price_p` as entered (what the guest pays); no VAT maths.

The print CSS already forces white background + dark text inside `.print-region` and hides `.no-print`, so the on-screen dark theme converts to a clean printed menu automatically.

### Entry point

A "Menu builder" link in the menu detail page header (`[menuId]/page.tsx`), alongside the existing "Menu copy" and "Spec cards" links.

## Testing

This is presentational (view state + print). No pure logic worth unit-testing beyond what exists; covered by `npx tsc --noEmit`, `npx next lint`, `npm run build`, and a manual screen + print-preview check. Consistent with how spec cards shipped.

## Out of scope

QR/digital menu, branding upload, section grouping, server-side PDF, per-drink reordering beyond existing `position`.
