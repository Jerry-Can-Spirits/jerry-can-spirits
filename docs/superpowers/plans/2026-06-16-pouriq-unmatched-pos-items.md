# Unmatched POS Items Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Capture unmatched POS sale lines, let venues map a till name → cocktail (or mark "not a cocktail") with one tap, backfill recently-dropped volume on mapping, and surface the count so operators get pulled to it.

**Architecture:** Two new D1 tables (persistent alias/ignore map; bounded 90-day unmatched-line log). Ingest gains a resolution order (ignored → alias → exact/fuzzy → log) and a shared bucketing helper reused by backfill. New data-access module, three API routes, a review screen, and count badges.

**Spec:** `docs/superpowers/specs/2026-06-16-pouriq-unmatched-pos-items-design.md`

**Branch:** `feat/pouriq-unmatched-pos-items` (off origin/main)

---

### Task 1: Migration + shared normalise/levenshtein

**Files:**
- Create: `migrations/0031_pos_item_matching.sql`
- Modify: `src/lib/pouriq/pos/match.ts`

- [ ] **Step 1: Migration** — create `migrations/0031_pos_item_matching.sql` with the two tables and index exactly as in the spec's "Data model" section (`pouriq_pos_item_map`, `pouriq_pos_unmatched_lines`, `idx_unmatched_tenant_name`).

- [ ] **Step 2: Export `normalise` and `levenshtein`** from `match.ts` (change `function normalise` → `export function normalise`, `function levenshtein` → `export function levenshtein`) so the item-map module and best-guess logic reuse them. Add a `bestGuessCocktail(itemName, cocktails)` export that returns the single nearest cocktail by Levenshtein regardless of threshold (or null if no cocktails):

```ts
export function bestGuessCocktail(itemName: string, cocktails: CocktailRow[]): CocktailRow | null {
  const target = normalise(itemName)
  if (!target || cocktails.length === 0) return null
  let best: { cocktail: CocktailRow; score: number } | null = null
  for (const c of cocktails) {
    const dist = levenshtein(target, normalise(c.name))
    if (best === null || dist < best.score) best = { cocktail: c, score: dist }
  }
  return best?.cocktail ?? null
}
```

- [ ] **Step 3:** `npx tsc --noEmit` → clean.
- [ ] **Step 4: Commit** — `feat(pouriq): item-matching tables and shared normalise/best-guess helpers`

---

### Task 2: Ingest resolution order + shared bucketing

**Files:**
- Modify: `src/lib/pouriq/pos/ingest.ts`
- Create: `src/lib/pouriq/pos/item-map.ts` (alias loader + types only in this task; review/backfill funcs in Task 3)

- [ ] **Step 1: Alias types + loader** in `item-map.ts`:

```ts
export interface PosItemAlias {
  normalised_pos_name: string
  cocktail_id: string | null
  cocktail_name: string | null
  ignored: number
}

export async function loadAliases(db: D1Database, tradeAccountId: string): Promise<Map<string, PosItemAlias>> {
  const res = await db
    .prepare(`SELECT normalised_pos_name, cocktail_id, cocktail_name, ignored FROM pouriq_pos_item_map WHERE trade_account_id = ?1`)
    .bind(tradeAccountId)
    .all<PosItemAlias>()
  return new Map((res.results ?? []).map((a) => [a.normalised_pos_name, a]))
}
```

- [ ] **Step 2: Extract bucketing helper** in `ingest.ts`. Pull the period-bucket + additive-upsert block into:

```ts
interface BucketEntry { cocktailId: string; periodStart: string; periodEnd: string; units: number }

async function upsertAdditiveVolumes(db: D1Database, entries: BucketEntry[]): Promise<void> {
  for (const v of entries) {
    await db.prepare(`
      INSERT INTO pouriq_drink_volumes (cocktail_id, period_start, period_end, units_sold, source)
      VALUES (?1, ?2, ?3, ?4, 'pos')
      ON CONFLICT(cocktail_id, period_start, period_end) DO UPDATE SET
        units_sold = units_sold + excluded.units_sold,
        source = CASE WHEN source = 'manual' THEN 'manual' ELSE 'pos' END,
        updated_at = datetime('now')
    `).bind(v.cocktailId, v.periodStart, v.periodEnd, Math.round(v.units)).run()
  }
}
```

Export it (and a `bucketLines(menu, lines)` pure helper that turns `{cocktail_id, quantity, sold_at}[]` into `BucketEntry[]` using `currentPeriod(menu.volume_cadence, ...)`) so Task 3's backfill reuses both.

- [ ] **Step 3: Resolution order.** In the per-line loop, before the existing `matchPosItemToCocktail` call:
  1. Load aliases once: `const aliases = await loadAliases(db, connection.trade_account_id)` (after the target-menu resolution).
  2. Build a normalised-name → cocktail map for the target menu's cocktails (`allCocktails`) for alias-by-name resolution.
  3. Per line: `const norm = normalise(line.name)`. If `aliases.get(norm)?.ignored` → `continue` (skip, not counted/logged). Else if an alias exists with a `cocktail_name` that matches a target-menu cocktail → use that cocktail. Else `matchPosItemToCocktail(...)`. Else → collect into an `unmatchedLines` array.

- [ ] **Step 4: Persist unmatched + prune.** At the start of ingest, prune: `DELETE FROM pouriq_pos_unmatched_lines WHERE created_at < datetime('now','-90 days')`. After the loop, batch-insert the `unmatchedLines` (connection_id, trade_account_id, normalised_name, raw_name, quantity, sold_at). Keep the returned `{ matched, unmatched }` shape (unmatched = count of logged lines).

- [ ] **Step 5:** `npx tsc --noEmit` → clean.
- [ ] **Step 6: Commit** — `feat(pouriq): ingest resolves aliases/ignores and logs unmatched POS lines`

---

### Task 3: Review + backfill data access

**Files:**
- Modify: `src/lib/pouriq/pos/item-map.ts`

- [ ] **Step 1: `countUnmatched`** — `SELECT COUNT(DISTINCT normalised_name)` from `pouriq_pos_unmatched_lines` for the tenant.

- [ ] **Step 2: `listUnmatched(db, tradeAccountId)`** — group log rows by `normalised_name`: return `{ normalised_name, raw_name (most recent), total_quantity, last_seen, suggestion }`. The `suggestion` is `bestGuessCocktail(raw_name, targetMenuCocktails)` — resolve the tenant's connections, take each connection's target menu cocktails (dedupe), and suggest from that pool (`{ cocktail_id, name }` or null).

- [ ] **Step 3: `createMapping(db, tradeAccountId, normalisedName, cocktailId)`**:
  1. Resolve the cocktail to get its normalised name; reject if it does not belong to the tenant (join `pouriq_cocktails` → `pouriq_menus` on `trade_account_id`).
  2. Upsert into `pouriq_pos_item_map` (`ignored = 0`, store `cocktail_id` + normalised `cocktail_name`).
  3. Backfill: load the logged lines for `(tradeAccountId, normalisedName)`. Group by `connection_id`; for each connection with a `target_menu_id` whose menu contains the cocktail, `bucketLines(menu, lines)` → `upsertAdditiveVolumes`. Delete only the consumed log rows; leave un-placeable lines.

- [ ] **Step 4: `ignoreItem(db, tradeAccountId, normalisedName)`** — upsert alias `ignored = 1` (null cocktail), delete that name's log rows.

- [ ] **Step 5:** `npx tsc --noEmit` → clean.
- [ ] **Step 6: Commit** — `feat(pouriq): unmatched review, mapping-with-backfill, and ignore`

---

### Task 4: API routes

**Files:**
- Create: `src/app/api/pouriq/integrations/unmatched/route.ts` (GET)
- Create: `src/app/api/pouriq/integrations/unmatched/map/route.ts` (POST)
- Create: `src/app/api/pouriq/integrations/unmatched/ignore/route.ts` (POST)

- [ ] **Step 1:** All three: `runtime = 'nodejs'`, `checkPourIqAccess()` gate (401 if not ok), `getCloudflareContext()` for `db`. GET returns `{ items }` from `listUnmatched`. map: body `{ normalisedName, cocktailId }` (400 if missing) → `createMapping` → `{ ok: true }` (422 if the cocktail isn't the tenant's). ignore: body `{ normalisedName }` → `ignoreItem` → `{ ok: true }`. Reuse the rate-limit helper (`isRateLimited` from `@/lib/kv`) on the two POSTs.

- [ ] **Step 2:** `npx tsc --noEmit` → clean.
- [ ] **Step 3: Commit** — `feat(pouriq): API for unmatched item review, mapping, ignore`

---

### Task 5: Review screen + count badges

**Files:**
- Create: `src/app/trade/pouriq/unmatched/page.tsx` (server: access gate + initial `listUnmatched`)
- Create: `src/components/pouriq/UnmatchedReview.tsx` (client: list, per-row `<select>` pre-set to suggestion, Confirm, Not a cocktail)
- Modify: `src/components/pouriq/IntegrationCard.tsx` (count badge + link when `unmatchedCount > 0`)
- Modify: `src/app/trade/pouriq/settings/integrations/page.tsx` (pass `countUnmatched` to cards)
- Modify: `src/app/trade/pouriq/page.tsx` (Pour IQ hub: "Review unmatched sales (N)" link when N > 0)

- [ ] **Step 1:** Build `UnmatchedReview` — each item row: raw till name, "N sales waiting", last seen, a `<select>` of the suggestion pool pre-selected to `suggestion.cocktail_id`, a **Confirm** button (POST /map) and **Not a cocktail** button (POST /ignore); on success remove the row (`router.refresh()` or local state). Empty state: "No unmatched sales — every till item is mapped." Use `PRIMARY_BUTTON` / `SECONDARY_BUTTON_SM` / `DESTRUCTIVE_BUTTON`.

- [ ] **Step 2:** Server page wraps it with the Pour IQ access gate (mirror `settings/integrations/page.tsx` structure).

- [ ] **Step 3:** IntegrationCard: add optional `unmatchedCount?: number` prop; when `connection && unmatchedCount` render an amber badge linking to `/trade/pouriq/unmatched`. Integrations page computes the count once via `countUnmatched` and passes it to each connected card.

- [ ] **Step 4:** Pour IQ hub tile/link to the review screen when count > 0.

- [ ] **Step 5:** `npx tsc --noEmit && npx next lint` → clean.
- [ ] **Step 6: Commit** — `feat(pouriq): unmatched sales review screen and count badges`

---

### Task 6: Tests + full verification

**Files:**
- Create: `tests/unit/lib/pouriq-item-match.test.ts`

- [ ] **Step 1: Pure unit tests** (vitest, node env — matches existing `tests/unit` setup):
  - `normalise` collapses case/punctuation/whitespace.
  - `bestGuessCocktail` returns the nearest cocktail (e.g. "Esp Martini" → "Espresso Martini") and null on empty list.
  - `bucketLines` aggregates two lines in the same week/month into one entry with summed units, and splits across periods correctly (weekly + monthly cadence).

```ts
import { describe, it, expect } from 'vitest'
import { normalise, bestGuessCocktail } from '@/lib/pouriq/pos/match'
// ...build minimal CocktailRow fixtures...
```

- [ ] **Step 2:** `npm run test:unit` → pass.
- [ ] **Step 3:** `npm run build` → succeeds.
- [ ] **Step 4: Commit** — `test(pouriq): unit cover normalise, best-guess, and line bucketing`

---

### Task 7: PR

- [ ] **Step 1:** Push, open PR. Body must flag: migration `0031_pos_item_matching.sql` to apply to prod D1 at deploy; no historical backfill (window fills from first sync post-deploy); depends on the live POS connectors (Square/Zettle/SumUp).
- [ ] **Step 2:** Watch CI green.
