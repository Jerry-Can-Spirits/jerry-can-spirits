# Pour IQ: Active Menu (unified sales routing) — Design

**Date:** 2026-06-18
**Status:** Approved

## Background

A venue realistically runs one live menu with several dormant ones in the background. Pour IQ had no explicit "active menu" concept — the only thing resembling it was the per-POS-connection `target_menu_id` ("Route sales to"). That per-connection granularity is an unnecessary degree of freedom (no venue routes Square and Zettle to different menus) and there was no way to see or set the live menu in general.

This makes the **active menu a single tenant-level concept that is also the sales destination**, unifying the two. It is the prerequisite for the "needs attention" dashboard (which should focus on the active menu, not dormant ones).

## Decision

Unify: the venue picks one active menu; all POS sales route there. Remove the per-connection "Route sales to" picker. Contained refactor of the just-shipped POS routing, with a data migration so existing routing carries over.

## Data model — migration `0032_menu_is_active.sql`

- `ALTER TABLE pouriq_menus ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0`.
- Backfill so every tenant with ≥1 menu has exactly one active:
  1. Default each tenant's **oldest** menu active.
  2. Where a POS connection has a `target_menu_id`, prefer that menu instead (clear the tenant's others, set the target active).
- `pouriq_pos_connections.target_menu_id` is left in place but **deprecated/unused** (avoids a risky column drop; ingest stops reading it).

Invariant: at most one `is_active = 1` per `trade_account_id`, enforced in code by clearing siblings within a transaction whenever one is set.

## Data access — `src/lib/pouriq/menus.ts`

- `getActiveMenu(db, tradeAccountId): Promise<MenuRow | null>` — the `is_active = 1` menu.
- `setActiveMenu(db, tradeAccountId, menuId)` — verify menu belongs to tenant; in a batch, clear all the tenant's `is_active` then set the one. Throws if the menu isn't the tenant's.
- `insertMenu` — if this is the tenant's first menu, set `is_active = 1` (there is always an active menu once one exists). Later menus insert inactive.
- `deleteMenu` — if the deleted menu was active, promote the most-recently-updated remaining menu to active (none → none).
- `MenuRow` gains `is_active: number`.

## POS routing refactor

- **`ingest.ts`**: replace `connection.target_menu_id` resolution with `getActiveMenu(db, connection.trade_account_id)`. No active menu → `paused: true` (unchanged safe-pause semantics; the next sync after one is set backfills). Everything downstream (dedup, alias resolution, unmatched logging) is unchanged.
- **`item-map.ts`**: `listMappableCocktails` and `createMapping` resolve cocktails/backfill against the **active menu** instead of per-connection targets. Backfill of a logged line is eligible when the mapped cocktail's menu is the active menu.
- **Removed:** `src/app/api/pouriq/integrations/[provider]/target-menu/route.ts` and the connection card's "Route sales to" `<select>` + its handler.

## UI

- **Hub (`/trade/pouriq`)**: the active menu's `MenuListCard` shows an "Active" badge; other cards show a "Make active" button (server action `setActiveMenuAction`). The menu detail page header shows an "Active" indicator or a "Make this the active menu" button.
- **Integrations page / card**: replace the per-connection routing picker with a line — "Sales route to your active menu: *{name}*", or, when none is set, an amber "Set an active menu so sales can flow" linking to the hub. The paused-state copy updates accordingly.

## Server actions — `src/lib/pouriq/server-actions.ts`

- `setActiveMenuAction(menuId)` — access-gated, calls `setActiveMenu`, `revalidatePath('/trade/pouriq')` and the menu page.
- `createMenuAction` — unchanged call site; `insertMenu`'s first-menu rule handles auto-active.
- `deleteMenuAction` — unchanged call site; `deleteMenu`'s promotion handles it.

## Testing

Unit (`tests/unit`): the "one active per tenant" invariant (setting B clears A), first-menu-auto-active on insert, delete-promotes-next. POS ingest's active-menu resolution and the unmatched backfill are covered by build + existing suites; the pure invariant logic is the unit-tested part.

`npx tsc --noEmit`, `npx next lint`, `npm run build`.

## Migration note

`0032_menu_is_active.sql` to apply to prod D1 at deploy. After it, every tenant with menus has exactly one active (oldest, or the existing POS target). The pilot's existing Square/Zettle/SumUp routing is preserved because step 2 prefers the connection target.

## Out of scope

- Dropping the deprecated `target_menu_id` column (later cleanup).
- The "needs attention" dashboard (the next task, which consumes `getActiveMenu`).
- Per-connection routing to different menus (deliberately removed).
