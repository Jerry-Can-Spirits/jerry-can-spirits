# Pour IQ Serve Mapping — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a non-cocktail POS sale (vodka & coke, house single, pint) carry a light pour spec so it depletes stock, via "serve" recipes mapped from the unmatched-items review.

**Architecture:** A *serve* is a `pouriq_cocktails` row with `is_serve = 1`, living on a hidden per-tenant "Bar serves" menu (`pouriq_menus.is_serves_menu = 1`). It reuses the recipe model + ingredient library. POS ingest becomes **item-map/serve-aware**: a sale whose item-map alias points at a serve records volume against that serve regardless of the active menu, bucketed by the tenant's cadence. Serves are excluded from customer-facing views (menu list, GP, spec cards) and included only in serve management + (later) variance depletion.

**Tech Stack:** Cloudflare D1, Next.js server actions/route handlers, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-06-23-pouriq-variance-v2-design.md` (Phase 1).

**Branch:** create `feat/pouriq-serve-mapping` off `origin/main`.

**Key existing code:** `pos/ingest.ts` (active-menu-scoped routing — to change), `pos/item-map.ts` (`loadAliases`, `createMapping`, `ignoreItem`, `listMappableCocktails`), `menus.ts` (`insertCocktail`, `replaceIngredients`, `listMenusForTradeAccount`, `listCocktailsForMenu`, `getActiveMenu`), `pos/volume-buckets.ts` (`bucketLines`, `upsertAdditiveVolumes`), unmatched route `src/app/api/pouriq/integrations/unmatched/{route,map,ignore}/route.ts`, UI `src/components/pouriq/UnmatchedReview.tsx` + `src/app/trade/pouriq/unmatched/page.tsx`.

---

### Task 1: Migration — `is_serve` + `is_serves_menu`

**Files:** Create `migrations/0039_serve_mapping.sql` (use the next free number; 0038 is latest)

- [ ] **Step 1: Write the migration**

```sql
-- Serve mapping: a "serve" is a cocktail row (is_serve=1) on a hidden per-tenant
-- "Bar serves" menu (is_serves_menu=1). Both additive, default 0 = no change to
-- existing rows.
ALTER TABLE pouriq_cocktails ADD COLUMN is_serve INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pouriq_menus ADD COLUMN is_serves_menu INTEGER NOT NULL DEFAULT 0;
```

- [ ] **Step 2: Apply locally + verify**

Run: `npx wrangler d1 migrations apply jerry-can-spirits-db --local && npx wrangler d1 execute jerry-can-spirits-db --local --command "PRAGMA table_info(pouriq_cocktails);"`
Expected: `is_serve` present, default 0, notnull 1.

- [ ] **Step 3: Commit**

```bash
git add migrations/0039_serve_mapping.sql
git commit -m "feat(pouriq): is_serve + is_serves_menu columns (serve mapping)"
```

---

### Task 2: Serves-menu helper + serve data access (`menus.ts`)

**Files:** Modify `src/lib/pouriq/menus.ts`; Test `tests/unit/lib/pouriq-serves.test.ts` (pure helper only — DB fns are integration, covered by build)

- [ ] **Step 1: Add `getOrCreateServesMenu`**

In `menus.ts`:
```ts
// The hidden per-tenant menu that holds serves. Created lazily. Never active,
// never shown in menu lists; exists only to satisfy the cocktails.menu_id FK.
export async function getOrCreateServesMenu(db: D1Database, tradeAccountId: string): Promise<string> {
  const existing = await db
    .prepare(`SELECT id FROM pouriq_menus WHERE trade_account_id = ?1 AND is_serves_menu = 1 LIMIT 1`)
    .bind(tradeAccountId)
    .first<{ id: string }>()
  if (existing) return existing.id
  const created = await db
    .prepare(`
      INSERT INTO pouriq_menus
        (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes, prices_include_vat, is_active, is_serves_menu)
      VALUES (?1, 'Bar serves', NULL, NULL, 0, NULL, NULL, 1, 0, 1)
      RETURNING id
    `)
    .bind(tradeAccountId)
    .first<{ id: string }>()
  if (!created) throw new Error('Could not create serves menu')
  return created.id
}
```
(Confirm the `pouriq_menus` column list matches the table — `venue_type`, `city`, `positioning`, `notes` are nullable per the existing `createMenu` INSERT at `menus.ts:75`.)

- [ ] **Step 2: Add serve listing + the active-menu exclusion**

Add:
```ts
export async function listServes(db: D1Database, tradeAccountId: string): Promise<CocktailWithIngredients[]> {
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  return listCocktailsForMenu(db, menuId)
}
```
In `listMenusForTradeAccount` (menus.ts:9), add `AND is_serves_menu = 0` to its WHERE clause so the hidden menu never appears in menu pickers/lists. Verify `getActiveMenu` already filters `is_active = 1` (the serves menu is created with `is_active = 0`, so it can never be active — no change needed there).

- [ ] **Step 3: Build + commit**

Run: `npm run build`
Expected: passes.
```bash
git add src/lib/pouriq/menus.ts
git commit -m "feat(pouriq): serves menu helper + exclude it from menu lists"
```

---

### Task 3: Serve CRUD server actions

**Files:** Modify `src/lib/pouriq/server-actions.ts`

- [ ] **Step 1: Add serve save/delete actions**

A serve is a cocktail on the serves menu with `is_serve` semantics. `insertCocktail` writes to `pouriq_cocktails` but does not set `is_serve`; extend it OR set the flag in a dedicated path. Simplest: a `saveServeAction` that uses `getOrCreateServesMenu` + a direct insert/update with `is_serve = 1` and `sale_price_p = 0`, then `replaceIngredients`.

```ts
export async function saveServeAction(
  serveId: string | null,
  input: { name: string; ingredients: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null }> },
): Promise<{ serveId: string }> {
  const { db, tradeAccountId } = await requireDb()
  if (!input.name.trim()) throw new Error('Serve name is required')
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  let id = serveId
  if (id === null) {
    const row = await db.prepare(`
      INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position, field_manual_slug, notes, is_serve)
      VALUES (?1, ?2, 0, 0, NULL, NULL, 1) RETURNING id
    `).bind(menuId, input.name.trim()).first<{ id: string }>()
    if (!row) throw new Error('Serve insert returned no id')
    id = row.id
  } else {
    // ownership: serve must belong to this tenant's serves menu
    const owns = await db.prepare(`SELECT 1 FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2 AND is_serve = 1`).bind(id, menuId).first()
    if (!owns) throw new Error('Serve not found')
    await db.prepare(`UPDATE pouriq_cocktails SET name = ?1, updated_at = datetime('now') WHERE id = ?2`).bind(input.name.trim(), id).run()
  }
  await replaceIngredients(db, id, input.ingredients)
  revalidatePath('/trade/pouriq/serves')
  return { serveId: id }
}

export async function deleteServeAction(serveId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  const owns = await db.prepare(`SELECT 1 FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2 AND is_serve = 1`).bind(serveId, menuId).first()
  if (!owns) throw new Error('Serve not found')
  await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(serveId).run()
  revalidatePath('/trade/pouriq/serves')
}
```
(Imports: `getOrCreateServesMenu`, `replaceIngredients` from `./menus`. `replaceIngredients` already deletes+reinserts the cocktail's ingredient rows — confirm at `menus.ts`.)

- [ ] **Step 2: Build + commit**

Run: `npm run build`
```bash
git add src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): serve save/delete server actions"
```

---

### Task 4: Exclude serves from customer-facing views

**Files:** Modify `src/lib/pouriq/menus.ts` (cocktail-listing queries), `src/app/trade/pouriq/[menuId]/specs/page.tsx`, and audit GP/matrix/movers consumers.

- [ ] **Step 1: Exclude `is_serve` from menu cocktail listings**

`listCocktailsForMenu` (menus.ts:152) is used both for customer-facing menus AND will be used for serve listing (Task 2 calls it on the serves menu). So do NOT filter inside it. Instead, the serves menu is separate (its own menu_id), and normal menus never contain `is_serve` rows (serves only ever live on the serves menu). Therefore no per-row filter is needed for normal menu pages — they query a normal `menu_id` which has no serves. **Verify:** confirm no query lists cocktails across ALL menus without a menu_id filter (grep). If one exists (e.g. a tenant-wide cocktail list), add `AND is_serve = 0` there.

Run:
```bash
grep -rn "FROM pouriq_cocktails" src/lib/pouriq src/app/api/pouriq | grep -iv "menu_id = \|WHERE c.id = \|is_serve"
```
Expected: any cross-menu cocktail query is flagged; add `is_serve = 0` to it. (The serves menu being excluded from `listMenusForTradeAccount` in Task 2 means menu-scoped listings already never reach it.)

- [ ] **Step 2: GP / calc**

`calculateMenuMetrics` already excludes `sale_price_p <= 0` from costed drinks; serves have `sale_price_p = 0`, so they're excluded from GP headline/avg/blended automatically. No change. (Confirm by reading `calculations.ts:185` `costed` filter — present.)

- [ ] **Step 3: Commit if anything changed**

```bash
git add -A && git commit -m "feat(pouriq): keep serves out of customer-facing cocktail lists"
```

---

### Task 5: POS ingest routes serve-mapped sales (the core change)

**Files:** Modify `src/lib/pouriq/pos/ingest.ts`, `src/lib/pouriq/pos/item-map.ts`

- [ ] **Step 1: Make alias resolution serve-aware in ingest**

In `ingest.ts`, after building `cocktailByNormName` from the active menu, also load the tenant's serves and index them by id and normalised name:
```ts
import { listServes } from '../menus'
// ...after cocktails/cocktailByNormName:
const serves = await listServes(db, connection.trade_account_id)
const serveById = new Map(serves.map((s) => [s.id, s]))
```
Change the alias-resolution block so a mapped alias pointing at a serve resolves even though the serve isn't in the active menu. The `pouriq_pos_item_map` row carries `cocktail_id`; resolve serves by id (stable), cocktails by name (survive seasonal menu change):
```ts
let cocktailId: string | null = null
if (alias?.cocktail_id && serveById.has(alias.cocktail_id)) {
  cocktailId = alias.cocktail_id          // mapped to a serve — route regardless of active menu
} else if (alias?.cocktail_name) {
  cocktailId = cocktailByNormName.get(alias.cocktail_name)?.id ?? null
}
if (!cocktailId) {
  cocktailId = matchPosItemToCocktail(line.name, cocktails)?.id ?? null
}
```
`loadAliases` already selects `cocktail_id` — confirm the `PosItemAlias` interface includes it (it does: `cocktail_id: string | null`). Serve-routed lines bucket fine: `bucketLines(targetMenu, matchedLines)` uses `targetMenu.volume_cadence` for ALL matched lines including serves, which is correct (the tenant's cadence).

- [ ] **Step 2: Build + commit**

Run: `npm run build`
```bash
git add src/lib/pouriq/pos/ingest.ts
git commit -m "feat(pouriq): route serve-mapped POS sales to serves regardless of active menu"
```

---

### Task 6: "Map to serve" in the mapping data layer

**Files:** Modify `src/lib/pouriq/pos/item-map.ts`

- [ ] **Step 1: Add `createServeMapping` + list serves for the picker**

`createMapping` (item-map.ts:90) resolves the cocktail's menu and only backfills when it's the active menu. For serves, backfill always (serves aren't menu-seasonal). Add:
```ts
import { listServes, getOrCreateServesMenu } from '../menus'

export async function listMappableServes(db: D1Database, tradeAccountId: string): Promise<Array<{ id: string; name: string }>> {
  return (await listServes(db, tradeAccountId)).map((s) => ({ id: s.id, name: s.name }))
}

// Map a till name to a serve and backfill all its logged lines (serves are
// tenant-stable, not menu-scoped, so always backfill).
export async function createServeMapping(
  db: D1Database, tradeAccountId: string, normalisedName: string, serveId: string,
): Promise<void> {
  const servesMenuId = await getOrCreateServesMenu(db, tradeAccountId)
  const serve = await db.prepare(`SELECT id, name FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2 AND is_serve = 1`).bind(serveId, servesMenuId).first<{ id: string; name: string }>()
  if (!serve) throw new Error('Serve not found for this account')
  await db.prepare(`
    INSERT INTO pouriq_pos_item_map (trade_account_id, normalised_pos_name, cocktail_id, cocktail_name, ignored)
    VALUES (?1, ?2, ?3, ?4, 0)
    ON CONFLICT(trade_account_id, normalised_pos_name) DO UPDATE SET
      cocktail_id = excluded.cocktail_id, cocktail_name = excluded.cocktail_name, ignored = 0, updated_at = datetime('now')
  `).bind(tradeAccountId, normalisedName, serveId, normalise(serve.name)).run()

  const linesRes = await db.prepare(`SELECT id, quantity, sold_at FROM pouriq_pos_unmatched_lines WHERE trade_account_id = ?1 AND normalised_name = ?2`).bind(tradeAccountId, normalisedName).all<{ id: string; quantity: number; sold_at: string }>()
  const lines = linesRes.results ?? []
  if (lines.length === 0) return
  const active = await getActiveMenu(db, tradeAccountId)
  const cadence = active?.volume_cadence ?? 'weekly'
  await upsertAdditiveVolumes(db, bucketLines({ volume_cadence: cadence }, lines.map((l) => ({ cocktail_id: serveId, quantity: l.quantity, sold_at: l.sold_at }))))
  await db.batch(lines.map((l) => db.prepare(`DELETE FROM pouriq_pos_unmatched_lines WHERE id = ?1`).bind(l.id)))
}
```

- [ ] **Step 2: Build + commit**

Run: `npm run build`
```bash
git add src/lib/pouriq/pos/item-map.ts
git commit -m "feat(pouriq): map a POS item to a serve (with backfill)"
```

---

### Task 7: Unmatched-review API + UI — "map to serve" / quick-create

**Files:** Modify `src/app/api/pouriq/integrations/unmatched/map/route.ts` (accept a `serveId` target), add quick-create via `saveServeAction`; Modify `src/components/pouriq/UnmatchedReview.tsx` + `src/app/trade/pouriq/unmatched/page.tsx` (load serves list, add the action).

- [ ] **Step 1: API — accept a serve target**

Read `unmatched/map/route.ts`. It currently calls `createMapping(db, tradeAccountId, normalisedName, cocktailId)`. Extend the POST body to allow `{ target: 'cocktail' | 'serve', id }`; when `serve`, call `createServeMapping`. Keep the existing cocktail path. Show the exact handler with both branches (read the file first to match its auth/parse style).

- [ ] **Step 2: UI — add "map to serve" + quick-create**

Read `UnmatchedReview.tsx`. Beside the existing "map to cocktail / ignore" controls, add a serve picker (from `listMappableServes`, passed via the page) and a "＋ Create serve" inline (name + ingredient picker rows → `saveServeAction`, then map to it). Pass the serves list from `unmatched/page.tsx` (call `listMappableServes`). Show the new control + handler wiring matching the existing buttons.

- [ ] **Step 3: Build + commit**

Run: `npm run build`
```bash
git add -A && git commit -m "feat(pouriq): map unmatched POS items to serves (+ quick-create)"
```

---

### Task 8: Serve management page

**Files:** Create `src/app/trade/pouriq/serves/page.tsx`; reuse `IngredientPicker` + `POUR_PRESETS`/`UNIT_CHIPS` for the pour spec. Optionally a `ServeForm` client component.

- [ ] **Step 1: Build the page**

A server page (access-gated like other trade pages) listing serves (`listServes`) with create/edit/delete via `saveServeAction`/`deleteServeAction`. Each serve = name + ingredient rows (reuse the `IngredientPicker` + pour/unit entry from `CocktailForm`). Link it from the trade hub / Pour IQ nav.

- [ ] **Step 2: Build + commit**

Run: `npm run build`
```bash
git add -A && git commit -m "feat(pouriq): serve management page"
```

---

### Task 9: Verification + finish

- [ ] **Step 1:** `npm run test:unit && npm run build && npx opennextjs-cloudflare build` — all pass.
- [ ] **Step 2:** Manual: create a serve "House Vodka" (50ml vodka); map a POS unmatched item to it; confirm a synced sale records volume against the serve and it does NOT appear on any customer menu / GP / spec cards.
- [ ] **Step 3:** Use `superpowers:finishing-a-development-branch` → PR. PR body notes: **apply migration 0039 to prod after merge** (`wrangler d1 migrations apply jerry-can-spirits-db --remote`).

---

## Notes for the variance v2 plan (next)
Theoretical depletion will sum POS volumes across cocktails **and serves** in the count window; coverage = an ingredient is "fully covered" when it has no rows in `pouriq_pos_unmatched_lines`. The serves built here are the depletion inputs.
