# Active Menu (unified routing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** One active menu per venue, set explicitly, that POS sales route to — replacing per-connection `target_menu_id` routing.

**Spec:** `docs/superpowers/specs/2026-06-18-pouriq-active-menu-design.md`
**Branch:** `feat/pouriq-active-menu` (off origin/main)

---

### Task 1: Migration + menu data access

**Files:** Create `migrations/0032_menu_is_active.sql`; modify `src/lib/pouriq/types.ts`, `src/lib/pouriq/menus.ts`

- [ ] **Step 1: Migration** `0032_menu_is_active.sql`:

```sql
ALTER TABLE pouriq_menus ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0;

-- Default: each tenant's oldest menu becomes active.
UPDATE pouriq_menus SET is_active = 1
WHERE id IN (
  SELECT id FROM pouriq_menus m
  WHERE m.created_at = (SELECT MIN(created_at) FROM pouriq_menus WHERE trade_account_id = m.trade_account_id)
);

-- Prefer the POS-routed menu where one exists: clear the tenant's flags, then
-- set the connection's target menu active.
UPDATE pouriq_menus SET is_active = 0
WHERE trade_account_id IN (SELECT trade_account_id FROM pouriq_pos_connections WHERE target_menu_id IS NOT NULL);
UPDATE pouriq_menus SET is_active = 1
WHERE id IN (
  SELECT target_menu_id FROM pouriq_pos_connections
  WHERE target_menu_id IS NOT NULL GROUP BY trade_account_id
);
```

- [ ] **Step 2: Type.** Add `is_active: number` to `MenuRow` in `types.ts`.

- [ ] **Step 3: `getActiveMenu`** in `menus.ts`:

```ts
export async function getActiveMenu(db: D1Database, tradeAccountId: string): Promise<MenuRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_menus WHERE trade_account_id = ?1 AND is_active = 1 LIMIT 1`)
    .bind(tradeAccountId)
    .first<MenuRow>()
}
```

- [ ] **Step 4: `setActiveMenu`** — verify ownership first (never clear without setting):

```ts
export async function setActiveMenu(db: D1Database, tradeAccountId: string, menuId: string): Promise<void> {
  const owns = await db
    .prepare(`SELECT 1 AS one FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId).first<{ one: number }>()
  if (!owns) throw new Error('Menu not found for this account')
  await db.batch([
    db.prepare(`UPDATE pouriq_menus SET is_active = 0, updated_at = datetime('now') WHERE trade_account_id = ?1 AND is_active = 1`).bind(tradeAccountId),
    db.prepare(`UPDATE pouriq_menus SET is_active = 1, updated_at = datetime('now') WHERE id = ?1 AND trade_account_id = ?2`).bind(menuId, tradeAccountId),
  ])
}
```

- [ ] **Step 5: First-menu-auto-active in `insertMenu`.** Before the INSERT, count the tenant's menus; pass `is_active` accordingly:

```ts
const existing = await db
  .prepare(`SELECT COUNT(*) AS c FROM pouriq_menus WHERE trade_account_id = ?1`)
  .bind(data.trade_account_id).first<{ c: number }>()
const isActive = (existing?.c ?? 0) === 0 ? 1 : 0
```
Add `is_active` to the INSERT column list and bind `isActive` as `?9`.

- [ ] **Step 6: Delete-promotes-next in `deleteMenu`.** Read whether the menu was active, delete, then promote if needed:

```ts
export async function deleteMenu(db: D1Database, menuId: string, tradeAccountId: string): Promise<void> {
  const row = await db
    .prepare(`SELECT is_active FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId).first<{ is_active: number }>()
  await db.prepare(`DELETE FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`).bind(menuId, tradeAccountId).run()
  if (row?.is_active === 1) {
    await db.prepare(`
      UPDATE pouriq_menus SET is_active = 1, updated_at = datetime('now')
      WHERE id = (SELECT id FROM pouriq_menus WHERE trade_account_id = ?1 ORDER BY updated_at DESC LIMIT 1)
    `).bind(tradeAccountId).run()
  }
}
```

- [ ] **Step 7:** `npx tsc --noEmit` → clean. **Commit:** `feat(pouriq): active-menu column, data access, first-active and delete-promote`

---

### Task 2: POS routing → active menu

**Files:** Modify `src/lib/pouriq/pos/ingest.ts`, `src/lib/pouriq/pos/item-map.ts`; delete `src/app/api/pouriq/integrations/[provider]/target-menu/route.ts`

- [ ] **Step 1: ingest.ts.** Change the import `import { listCocktailsForMenu, listMenusForTradeAccount } from '../menus'` to `import { listCocktailsForMenu, getActiveMenu } from '../menus'`. Replace the target-menu resolution block:

```ts
  const targetMenu = await getActiveMenu(db, connection.trade_account_id)
  if (!targetMenu) {
    return { matched: 0, unmatched: 0, paused: true }
  }
```
(removing the `!connection.target_menu_id` check and the `listMenusForTradeAccount` lookup). The rest of ingest is unchanged.

- [ ] **Step 2: item-map.ts `listMappableCocktails`.** Resolve the active menu instead of per-connection targets:

```ts
export async function listMappableCocktails(db: D1Database, tradeAccountId: string): Promise<Array<{ id: string; name: string }>> {
  const active = await getActiveMenu(db, tradeAccountId)
  if (!active) return []
  return (await listCocktailsForMenu(db, active.id)).map((c) => ({ id: c.id, name: c.name }))
}
```
Update imports: drop `listConnections`, add `getActiveMenu` (keep `listCocktailsForMenu`).

- [ ] **Step 3: item-map.ts `createMapping` backfill.** Replace the connection-target eligibility with the active menu. After the cocktail-ownership check and alias upsert:

```ts
  const active = await getActiveMenu(db, tradeAccountId)
  if (!active || active.id !== cocktail.menu_id) return // backfill only into the active menu

  const linesRes = await db
    .prepare(`SELECT id, quantity, sold_at FROM pouriq_pos_unmatched_lines WHERE trade_account_id = ?1 AND normalised_name = ?2`)
    .bind(tradeAccountId, normalisedName)
    .all<{ id: string; quantity: number; sold_at: string }>()
  const lines = linesRes.results ?? []
  if (lines.length === 0) return

  await upsertAdditiveVolumes(db, bucketLines(
    { volume_cadence: cocktail.volume_cadence },
    lines.map((l) => ({ cocktail_id: cocktailId, quantity: l.quantity, sold_at: l.sold_at })),
  ))
  await db.batch(lines.map((l) => db.prepare(`DELETE FROM pouriq_pos_unmatched_lines WHERE id = ?1`).bind(l.id)))
```
Remove the now-unused `listConnections` import and `connectionsForMenu` logic.

- [ ] **Step 4: Delete** `src/app/api/pouriq/integrations/[provider]/target-menu/route.ts`.

- [ ] **Step 5:** `npx tsc --noEmit` → clean. **Commit:** `feat(pouriq): POS ingest and unmatched backfill route to the active menu`

---

### Task 3: Server action + hub/menu UI

**Files:** Modify `src/lib/pouriq/server-actions.ts`, `src/components/pouriq/MenuListCard.tsx`, `src/app/trade/pouriq/page.tsx`, `src/app/trade/pouriq/[menuId]/page.tsx`

- [ ] **Step 1: `setActiveMenuAction`** in server-actions.ts (add `setActiveMenu` to the menus import):

```ts
export async function setActiveMenuAction(menuId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  await setActiveMenu(db, tradeAccountId, menuId)
  revalidatePath('/trade/pouriq')
  revalidatePath(`/trade/pouriq/${menuId}`)
}
```

- [ ] **Step 2: MenuListCard** — show an "Active" badge when `menu.is_active === 1`, and a "Make active" button otherwise. The button is a tiny client form posting the server action; to keep the card a server component, extract a small client `MakeActiveButton` (in the same file or `MakeActiveButton.tsx`) that calls `setActiveMenuAction` via `useTransition`. Badge example:

```tsx
{menu.is_active === 1
  ? <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-[10px] uppercase tracking-widest">Active</span>
  : <MakeActiveButton menuId={menu.id} />}
```
`MakeActiveButton` ('use client'): a button that `startTransition(() => setActiveMenuAction(menuId))` then `router.refresh()`. Use `SECONDARY_BUTTON_SM`.

- [ ] **Step 3: Menu detail header** — in `[menuId]/page.tsx`, near the title, show the "Active" badge when `menu.is_active === 1`, else a "Make this the active menu" `MakeActiveButton`.

- [ ] **Step 4:** `npx tsc --noEmit && npx next lint` → clean. **Commit:** `feat(pouriq): set/show the active menu on the hub and menu page`

---

### Task 4: Integrations page — routing note replaces picker

**Files:** Modify `src/components/pouriq/IntegrationCard.tsx`, `src/app/trade/pouriq/settings/integrations/page.tsx`

- [ ] **Step 1:** Remove from `IntegrationCard`: the `menus` prop usage for the "Route sales to" `<select>`, the `targetMenuId` state, `updateTargetMenu`, and the `targetMissing` block. Replace with a read-only routing line driven by a new prop `activeMenuName: string | null`:

```tsx
{connection && (
  <p className="text-xs text-parchment-400 mb-4">
    {activeMenuName
      ? <>Sales route to your active menu: <span className="text-parchment-200">{activeMenuName}</span></>
      : <span className="text-amber-200">Set an active menu so sales can flow — choose one on the Pour IQ dashboard.</span>}
  </p>
)}
```
Keep the `menus` prop only if still used elsewhere; otherwise drop it from `Props`.

- [ ] **Step 2:** Integrations page — fetch `getActiveMenu`, pass `activeMenuName={activeMenu?.name ?? null}` to each card; remove the `menus={menuOptions}` wiring if no longer used. Keep the unmatched banner.

- [ ] **Step 3:** `npx tsc --noEmit && npx next lint && npm run build` → clean. **Commit:** `feat(pouriq): integrations show active-menu routing instead of per-connection picker`

---

### Task 5: Tests + PR

**Files:** Create `tests/unit/lib/pouriq-active-menu.test.ts` (if practical as pure tests; otherwise rely on build)

- [ ] **Step 1:** The active-menu invariants are DB-backed (D1), which the unit suite doesn't mock. Add tests only for any pure helper introduced; otherwise document that invariants are covered by the SQL + manual verification, and skip a DB-mock test (consistent with the repo's light DB-test approach). Run `npm run test:unit` → existing pass.

- [ ] **Step 2:** `npm run build` → succeeds.

- [ ] **Step 3:** Push, open PR. Body: migration 0032 to apply at deploy; unifies routing onto the active menu; per-connection `target_menu_id` deprecated; pilot routing preserved by the backfill. **Commit** any remaining, then watch CI.
