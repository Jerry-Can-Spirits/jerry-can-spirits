# Pour IQ: Unmatched POS Items — Design

**Date:** 2026-06-16
**Status:** Approved

## Problem

POS ingest matches till item-names to cocktails via exact-normalised then Levenshtein ≤2 fuzzy matching (`src/lib/pouriq/pos/match.ts`). Anything that misses is counted as `unmatched` in `ingestOrderLines` and **silently dropped** — never stored, never shown. A till that rings "Esp Martini" against a menu's "Espresso Martini" loses that drink's entire sales volume, and the operator has no signal their data is incomplete. This quietly undermines every downstream number the POS connectors feed (variance, contribution, volume-weighted GP).

## Goals

1. Capture unmatched sale lines so they can be reviewed and recovered.
2. Let a venue map a till name → cocktail once, persisting so future syncs match automatically.
3. Recover recently-dropped sales when a mapping is created (backfill, bounded window).
4. Let a venue mark a till item "not a cocktail" so non-drink buttons (food, service charge) stop reappearing.
5. Make the operator aware unmatched items exist, without hunting.

## Decisions (from brainstorming)

- **Backfill recent, then forward.** Store unmatched lines for a 90-day window; mapping re-attributes that volume and applies going forward.
- **One-tap confirm.** The review screen pre-selects a best-guess cocktail per item; operator usually just confirms. Manual dropdown remains.
- **"Not a cocktail" is in scope** (added during design). Without it the review list never clears.
- **Aliases resolve by cocktail name** so a mapping survives a seasonal menu change when the cocktail name is unchanged.

## Architecture (Approach A)

### Data model — migration `0031_pos_item_matching.sql`

```sql
-- Persistent till-name → cocktail mappings (and ignores), per tenant.
CREATE TABLE IF NOT EXISTS pouriq_pos_item_map (
  trade_account_id TEXT NOT NULL,
  normalised_pos_name TEXT NOT NULL,
  cocktail_id TEXT,            -- null when ignored = 1
  cocktail_name TEXT,          -- normalised; used to resolve across menu changes
  ignored INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (trade_account_id, normalised_pos_name)
);

-- Bounded log of unmatched sale lines, for review + backfill. Pruned > 90 days.
CREATE TABLE IF NOT EXISTS pouriq_pos_unmatched_lines (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  connection_id TEXT NOT NULL,
  trade_account_id TEXT NOT NULL,
  normalised_name TEXT NOT NULL,
  raw_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  sold_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_unmatched_tenant_name
  ON pouriq_pos_unmatched_lines (trade_account_id, normalised_name);
```

`normalised_pos_name` / `normalised_name` use the existing `normalise()` from `match.ts` (lowercase, strip punctuation, collapse whitespace) — exported for reuse.

### Ingest change (`src/lib/pouriq/pos/ingest.ts`)

Resolution order per line, after the existing order-level dedup:

1. **Ignored** — name has an `ignored = 1` alias → skip silently (not counted, not logged).
2. **Alias** — name has a mapping whose `cocktail_name` matches a cocktail in the target menu → count it.
3. **Exact / fuzzy** — current `matchPosItemToCocktail` behaviour.
4. **Unmatched** — write a row to `pouriq_pos_unmatched_lines` and increment `unmatched`.

Aliases for the tenant are loaded once per ingest call (small per-tenant set). The period-bucketing block (lines ~78–104 today) is extracted into a shared helper `bucketAndUpsertVolumes(db, menu, entries)` so backfill reuses the identical logic.

Pruning: delete `pouriq_pos_unmatched_lines` older than 90 days at the start of each ingest call (cheap, keeps the window bounded without a separate cron).

### Mapping + backfill

New file `src/lib/pouriq/pos/item-map.ts`:
- `listUnmatched(db, tradeAccountId)` → grouped by `normalised_name`: raw name(s), total quantity, last seen, plus a best-guess cocktail from the current target menu (nearest by Levenshtein, even outside the auto-match threshold).
- `createMapping(db, tradeAccountId, normalisedName, cocktailId)` → upsert alias (with denormalised cocktail name); fetch the logged lines for that name; re-bucket via `bucketAndUpsertVolumes` into `pouriq_drink_volumes`; delete the consumed log rows. The alias is tenant-wide (a till name means the same cocktail regardless of which POS produced it). Each logged line carries its `connection_id`, so backfill buckets it by *that connection's* current target menu cadence; a line whose connection has no target menu, or whose target menu does not contain the cocktail, is left in the log (not lost) for a later sync/menu change.
- `ignoreItem(db, tradeAccountId, normalisedName)` → upsert alias with `ignored = 1`; delete the log rows for that name.

### API

Under `src/app/api/pouriq/integrations/unmatched/`:
- `GET /api/pouriq/integrations/unmatched` → `listUnmatched` for the licensed tenant.
- `POST /api/pouriq/integrations/unmatched/map` → `{ normalisedName, cocktailId }`, calls `createMapping`.
- `POST /api/pouriq/integrations/unmatched/ignore` → `{ normalisedName }`, calls `ignoreItem`.

All `checkPourIqAccess()`-gated like every Pour IQ route. After a write, `revalidatePath` is not needed (data is force-dynamic), but the client refreshes.

### UI

- New review screen (client component) listing unmatched items: raw till name, "N sales waiting," last seen, a pre-selected best-guess `<select>` of the target menu's cocktails, **Confirm** and **Not a cocktail** buttons. Reuses Pour IQ button styles.
- Surfacing: a count badge ("3 unmatched") on each connected `IntegrationCard` and the Trade Hub Pour IQ tile, linking to the review screen. The count comes from a lightweight `countUnmatched` query.

## Testing

- Unit (`tests/unit`): matcher precedence (ignored > alias > exact > fuzzy > log), backfill re-bucketing produces identical volumes to a live match, alias resolves across a menu change by name, prune drops > 90-day rows. Period/calc helpers stay pure.
- `npx tsc --noEmit`, `npx next lint`, `npm run build`.

## Out of scope

- Editing/removing an existing mapping (v1 maps and ignores; un-ignore/re-map is a follow-up).
- Bulk actions on the review screen.
- Cross-tenant or global alias suggestions.
- Surfacing unmatched for manual (non-POS) volume entry — POS only.

## Migration note

`0031_pos_item_matching.sql` additive (two new tables) — apply to prod D1 at deploy; no backfill of historical data (the window fills from the first sync after deploy).
