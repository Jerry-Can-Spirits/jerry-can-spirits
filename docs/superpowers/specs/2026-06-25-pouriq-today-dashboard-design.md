# Pour IQ — Today dashboard (redesign slice 2)

**Date:** 2026-06-25
**Status:** Design approved (the v2 dashboard blueprint was validated in the visual companion; this slice wires it to existing data). Builds on the shell (slice 1, PR #811).
**Origin:** [[pouriq-ui-redesign-vision]]. Make `/trade/pouriq` the **Today** dashboard (replacing the "Your menus" hub), assembling signals that already exist.

**Depends on:** shell slice (#811). Build branch `feat/pouriq-today-dashboard` off `main`. **No migration, no new engines.**

## Locked scope (Dan)
- **Ship now:** Attention required (with severity), Sales this period, Menu profitability, Quick actions — plus the routing move.
- **Defer:** the Tasks tile (overlaps Attention; needs its own signals), the tabbed insight chart, the Recent-activity feed (new event log), top-bar sync status, and the "since last close" timestamp ("this period" is what we have).

## Routing change
- `/trade/pouriq` → the **Today dashboard** (rewrite `page.tsx`).
- **Menus list moves** to `src/app/trade/pouriq/menus/page.tsx` (the current hub content: heading + Compare-menus link + `MenuListCard` grid).
- `nav.ts`: add **Dashboard** as the first Operate item (`href: '/trade/pouriq'`); repoint **Menus** to `/trade/pouriq/menus`. (`isNavActive` already exact-matches the home item, so Dashboard highlights only on the dashboard.) Menu-detail pages still don't highlight a nav item — unchanged, acceptable.

## Data (existing loaders only)
A `src/lib/pouriq/dashboard.ts` (server-only) assembles the tiles:
- **Attention** — reuse `getAttentionRows`, extended so each `AttentionRow` carries `severity: 'high' | 'medium'`: `paused` and `sync-*` → high; `unmatched`, `prices`, `gp` → medium.
- **Active-menu summary** — `getActiveMenu`; if none, sales/profitability are null (the tiles show an empty/onboarding hint). Else `listCocktailsForMenu` + `listVolumesForPeriod(currentPeriod(cadence))` + `calculateMenuMetrics` → one `MenuMetrics`, from which:
  - **Sales this period** (pure `deriveSalesSummary(metrics)`): `revenue_p = Σ volume.units_sold × sale_price_p`; `serves = Σ volume.units_sold`; `top` = top 3 drink names by `units_sold`.
  - **Menu profitability**: `headline_gp_pct` + `headline_basis`, `below_target` = `deriveMenuAttention(metrics, target).underTargetCount`, `incomplete` = `metrics.incomplete_cost_count`.

`loadDashboard(db, tradeAccountId)` returns `{ attention, sales | null, profitability | null, activeMenuId | null }`.

## UI (`page.tsx` = the dashboard, server component)
Approved v2 layout, existing dark-green/gold styling:
- **Attention required** — structured alert rows: severity dot (red=high, amber=medium), label, a severity chip, and a right chevron; the whole row links to `row.href`. Empty state when no rows ("Nothing needs attention right now").
- **Sales this period** + **Menu profitability** — the two compact cards (revenue/serves/top; headline GP / below-target / missing-cost). When there's no active menu, a single "Connect a till and set an active menu to see sales" hint.
- **Quick actions** — secondary buttons + text links per the agreed hierarchy: Scan invoice + Start stock count (secondary), Import menu / Check variance / Search ingredients (text links). (The single primary **+ Add / Import** already lives in the shell top bar.)
- Small presentational pieces may be extracted (e.g. an `AttentionList`), but no client state is needed (the deferred chart is what needed it).

## Cleanup
- The old `AttentionPanel` was used only by the hub; the dashboard renders attention in the new alert-row style. Remove `AttentionPanel.tsx` if nothing else imports it (verify), else leave.

## Tests
- `deriveSalesSummary`: given cocktail_metrics with volumes → correct revenue_p (Σ units × sale_price_p), serves (Σ units), and top-3 by units; drinks without `volume` contribute 0; empty → zeros + empty top.
- Attention severity mapping (if extracted as a pure map) — high for paused/sync, medium otherwise.
- Gates: `npm run test:unit`, `npx tsc --noEmit`, `npx opennextjs-cloudflare build`.

## Out of scope (later slices / fast-follows)
- Tasks tile; tabbed insight chart; Recent-activity feed (+ its event log); top-bar sync status; "since last close" period; onboarding empty-state dashboard (its own slice); brand/visual polish pass; trade app getting its own root (off the marketing chrome).

## Success criteria
- Opening Pour IQ lands on the Today dashboard: attention rows (clickable, severity-marked) first, then sales this period + menu profitability, then quick actions. The menus list is at `/trade/pouriq/menus` and reachable from the nav. No data/engine changes; behaviour of every other page unchanged.
