# Pour IQ — App shell: workflow nav + top bar (redesign slice 1)

**Date:** 2026-06-25
**Status:** Design approved in brainstorm (visual companion; Dan approved the shell shape + nav grouping). First buildable slice of the UI redesign.
**Origin:** [[pouriq-ui-redesign-vision]]. The redesign is a presentation layer over existing engines; it is far too big for one PR. Slice 1 = the **shell** (the frame everything hangs off): a persistent grouped left nav + top bar replacing today's per-page row of header buttons.

**Depends on:** nothing new. Build branch `feat/pouriq-shell-nav` off `main`. **No migration, no new engines.**

## Locked decisions
- **Shell first, on its own** (Dan). The Today dashboard is slice 2 — for now the home (`/trade/pouriq`) stays the "Your menus" hub.
- **Defer:** sync status in the top bar (needs integration state — a later slice), the activity feed, and all new-data items.
- The nav shows the full **Operate / Build / Connect / Settings** grouping but **only items that have a destination today**. Aspirational items (Dashboard, Sales & performance, Tasks & alerts, a global Cocktails & spec cards, Imports, Team & locations) are added as their screens ship — no dead links.

## Architecture / files
- **Create `src/app/trade/pouriq/layout.tsx`** (server, wraps every `/trade/pouriq/*` page):
  - `checkPourIqAccess()`; if `no-session` → `redirect('/trade/login')`. Licence handling stays on the pages (`LicenceGate`); the layout renders the frame for `ok` and `no-licence`.
  - Fetch the venue name for the top bar: `SELECT name FROM trade_accounts WHERE id = ?` (verify the column name during build; fall back to "Pour IQ™" if absent/empty).
  - Render `<PourIqShell venueName={...}>{children}</PourIqShell>`.
- **Create `src/components/pouriq/PourIqShell.tsx`** (client): the responsive frame.
  - Desktop (`lg+`): persistent left sidebar (grouped nav) + content area (`flex-1`).
  - Tablet/mobile: nav in a drawer toggled by a labelled hamburger in the top bar; content full-width. (Per Dan's note, quick actions/nav must stay reachable on tablet.)
  - Top bar: **Pour IQ™** wordmark (links to `/trade/pouriq`) + venue name on the left; **+ Add / Import** (the single primary action) on the right.
  - Active highlighting via `usePathname()` + a pure `isNavActive` helper; `aria-current="page"` on the active item; `<nav aria-label="Pour IQ">`.
- **Create `src/components/pouriq/AddImportMenu.tsx`** (client): the **+ Add / Import** dropdown. Actions → existing routes only:
  - New menu → `/trade/pouriq/new`
  - Upload invoice → `/trade/pouriq/invoices/new`
  - Add ingredient → `/trade/pouriq/library/new`
  - Start stock count → `/trade/pouriq/stock`
  - Connect POS → `/trade/pouriq/settings/integrations`
- **`src/lib/pouriq/nav.ts`** (new, pure): the nav config (groups → items → href) and `isNavActive(pathname, href)` (exact match for the `/trade/pouriq` home item; prefix match for the rest). Keeps config + logic testable and out of the client component.

## Nav map (slice 1 — existing destinations only)
- **Operate:** Variance (`/trade/pouriq/variance`), Stock (`/trade/pouriq/stock`)
- **Build:** Menus (`/trade/pouriq`), Ingredients (`/trade/pouriq/library`), Serves (`/trade/pouriq/serves`), Suppliers & invoices (`/trade/pouriq/invoices`)
- **Connect:** Integrations (`/trade/pouriq/settings/integrations`)
- **Settings:** Voice profile (`/trade/pouriq/settings/voice-profile`), Help (`/trade/pouriq/help`)

(Compare menus stays reachable from within Menus — omitted from the nav, matching the vision's "Compare belongs inside Menus".)

## Hub de-clutter (`src/app/trade/pouriq/page.tsx`)
Remove the header **button cluster** (Compare menus / Library / Serves / Variance / Stock / Integrations / Voice Profile / New menu) and the **"← Trade Hub"** back-link — the shell nav + the + Add / Import replace them. Keep the "Your menus" heading, the `AttentionPanel`, and the menu grid.

## Out of scope (later slices / cleanup)
- The **Today dashboard** (slice 2) — home stays the menus hub.
- **Sync status** in the top bar (needs integration state).
- Removing the **"← All menus" / "← Trade Hub" back-links** from the ~15 sub-pages — they stay functional and the nav is additive; a small follow-up cleanup, not this PR.
- The deferred nav items; the full **brand/visual polish pass** (this slice keeps the existing dark-green + gold styling; structural only).

## Tests
- `isNavActive`: `('/trade/pouriq', '/trade/pouriq')` → true; `('/trade/pouriq/variance', '/trade/pouriq')` → **false** (home is exact, not prefix); `('/trade/pouriq/library/new', '/trade/pouriq/library')` → true; `('/trade/pouriq/stock/order', '/trade/pouriq/variance')` → false.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build` (the real gate for a presentational shell).

## Success criteria
- Every `/trade/pouriq/*` page renders inside the shell: grouped left nav + top bar, active item highlighted, **+ Add / Import** working, responsive (sidebar on desktop, drawer on tablet/mobile).
- The hub's old top-row buttons are gone; navigation is the left nav.
- No behaviour change to the pages themselves; no data/engine changes.
