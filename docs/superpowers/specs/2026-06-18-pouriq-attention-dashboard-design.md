# Pour IQ: "Needs Attention" Dashboard — Design

**Date:** 2026-06-18
**Status:** Approved (design agreed during the 2026-06-18 brainstorm)

## Problem

A time-strapped operator has no single place to see what needs fixing. The signals exist but are scattered: unmatched POS items (review screen), drinks needing prices and drinks under target GP (buried in the menu table), POS sync health (integrations page). They have to go hunting.

## Decisions (from brainstorming)

- **Placement:** a panel at the top of the Pour IQ hub (`/trade/pouriq`), above the menus grid — seen the instant they open Pour IQ, no navigation.
- **Four signals:** unmatched POS items, drinks needing prices (incomplete cost), drinks under target GP, POS sync health. Variance excluded.
- **Scope to the active menu:** menu-specific signals (needs-prices, under-target) reflect only the active menu, never dormant ones — they were the source of noise.
- **Hidden when clear:** the panel does not render when nothing needs attention; the hub stays clean.
- Replaces the standalone unmatched banner currently on the hub (the integrations page keeps its own contextual banner).

## Architecture

### Aggregator — `src/lib/pouriq/attention.ts`

```ts
export interface AttentionRow { key: string; label: string; href: string }

// Pure: derive the menu-specific counts from computed metrics.
export function deriveMenuAttention(
  metrics: MenuMetrics, targetGpPct: number,
): { incompleteCostCount: number; underTargetCount: number }
```
`underTargetCount` = costed drinks (`cost_complete && sale_price_p > 0`) with `gp_pct < targetGpPct`; `incompleteCostCount` = `metrics.incomplete_cost_count`.

```ts
export async function getAttentionRows(db, tradeAccountId): Promise<AttentionRow[]>
```
Builds rows, in priority order:
1. **Sales paused** — if any enabled connection exists and there is no active menu: "Sales paused — set an active menu" → `/trade/pouriq`. (Most urgent: sales are being dropped.)
2. **Sync errors** — per connection with `last_sync_error`: "{Provider} sync error — reconnect" → `/trade/pouriq/settings/integrations`.
3. **Unmatched items** — `countUnmatched > 0`: "{n} unmatched till item(s) — sales not counting" → `/trade/pouriq/unmatched`.
4. **Needs prices** — active menu `incompleteCostCount > 0`: "{n} drink(s) need prices on {menu}" → `/trade/pouriq/{activeMenuId}`.
5. **Under target GP** — active menu `underTargetCount > 0`: "{n} drink(s) under target GP on {menu}" → `/trade/pouriq/{activeMenuId}`.

Data sources, all existing: `countUnmatched`, `listConnections`, `getActiveMenu`, `listCocktailsForMenu` + `listVolumesForPeriod`/`currentPeriod` + `calculateMenuMetrics`. The active menu's metrics are computed once.

### UI — `src/components/pouriq/AttentionPanel.tsx`

Server-rendered, takes `rows: AttentionRow[]`. Renders nothing when `rows` is empty. Otherwise an amber panel headed "Needs attention", one row per item: label + a "→" affordance, each a `Link` to its `href`. Reuses the existing amber styling from the current hub banner.

### Hub — `src/app/trade/pouriq/page.tsx`

Fetch `getAttentionRows` alongside the menus; render `<AttentionPanel rows={rows} />` above the menus grid. Remove the existing standalone `unmatchedCount` banner (now folded into the panel) and its `countUnmatched` import if unused.

## Testing

Unit (`tests/unit`): `deriveMenuAttention` — under-target counts only costed drinks below target; incomplete-cost drinks are not counted as under-target (they have no trustworthy GP); zero when all healthy. The aggregator itself is DB glue, covered by build.

`npx tsc --noEmit`, `npx next lint`, `npm run build`.

## Out of scope

- Variance signal (excluded by decision).
- Signals for dormant (non-active) menus.
- Per-row dismissal / snooze.
- A dedicated standalone attention page (the hub panel is the surface).

## No migration

Pure read aggregation + UI. No schema change.
