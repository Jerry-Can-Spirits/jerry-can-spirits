# Batch Botanicals & Sourcing Design

## Goal

Add a "Botanicals & Sourcing" section to each batch detail page (`/batch/[batchNumber]/`) showing per-ingredient provenance: name, origin, supplier, and a short flavour/sourcing note.

## Architecture

All botanical data lives in a new `batch_ingredients` table in Cloudflare D1 — the same database already used for the `batches` and `bottles` tables. This keeps all batch-related data in one place and is consistent with the existing migration-file pattern for data management.

A new `BatchIngredients` server component fetches and renders the data. It is added to the existing batch detail page as a new block in the main (`lg:col-span-2`) column, positioned after the existing `BatchDetails` block. `BatchDetails` is not modified.

## Database

### New table: `batch_ingredients`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | e.g. `batch-001-vanilla` — set by migration author, format: `{batch_id}-{slug}` |
| `batch_id` | TEXT NOT NULL REFERENCES batches(id) | Foreign key → `batches.id` |
| `name` | TEXT NOT NULL | e.g. `Madagascan Vanilla Pods` |
| `origin` | TEXT NOT NULL | Country or region, e.g. `Madagascar` |
| `supplier` | TEXT | Nullable — omitted from display if null |
| `notes` | TEXT | Nullable — omitted from display if null |
| `sort_order` | INTEGER NOT NULL DEFAULT 0 | Controls display order |
| `created_at` | TEXT NOT NULL | Defaults to `datetime('now')` |

### Migration file: `0006_batch_ingredients.sql`

```sql
CREATE TABLE IF NOT EXISTS batch_ingredients (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  name TEXT NOT NULL,
  origin TEXT NOT NULL,
  supplier TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_batch_ingredients_batch_id
  ON batch_ingredients(batch_id);
```

Then seeds Batch 001 with the following ingredients in display order. Items where Spirit of Wales holds the sourcing detail have `supplier` and `notes` set to NULL — the display omits those fields entirely rather than showing a placeholder.

| sort_order | id | name | origin | supplier | notes |
|---|---|---|---|---|---|
| 1 | batch-001-rum-base | Caribbean Rum Base | Caribbean | NULL | NULL |
| 2 | batch-001-molasses | Welsh Molasses | Wales | Spirit of Wales Distillery, Newport | NULL |
| 3 | batch-001-vanilla | Madagascan Vanilla Pods | Madagascar | NULL | NULL |
| 4 | batch-001-cinnamon | Ceylon Cinnamon | Sri Lanka | NULL | NULL |
| 5 | batch-001-ginger | Ginger | NULL (pending) | NULL | NULL |
| 6 | batch-001-orange-peel | Orange Peel | NULL (pending) | NULL | NULL |
| 7 | batch-001-cloves | Cloves | NULL (pending) | NULL | NULL |
| 8 | batch-001-allspice | Allspice | NULL (pending) | NULL | NULL |
| 9 | batch-001-cassia | Cassia Bark | NULL (pending) | NULL | NULL |
| 10 | batch-001-agave | Agave Syrup | NULL (pending) | NULL | NULL |
| 11 | batch-001-glucose | Glucose Syrup | NULL (pending) | NULL | NULL |
| 12 | batch-001-barrel-chips | Bourbon Barrel Chips | United States | NULL | NULL |

Note: `origin` is NOT NULL in the schema. For items pending Spirit of Wales confirmation, use the best-known origin (e.g. ginger is typically sourced from Nigeria, Peru, or China — use NULL only if the column is made nullable, otherwise use a reasonable placeholder until confirmed). Implementer should make `origin` nullable in the migration to support pending items cleanly.

**Correction:** Make `origin` nullable (`origin TEXT`) so pending items can be represented as NULL and omitted from display rather than guessing.

## D1 Query Layer

New additions to `src/lib/d1.ts`:

```typescript
export interface BatchIngredient {
  id: string;
  batch_id: string;
  name: string;
  origin: string | null;
  supplier: string | null;
  notes: string | null;
  sort_order: number;
}

export async function getBatchIngredients(
  db: D1Database,
  batchId: string,
): Promise<BatchIngredient[]> {
  const result = await db
    .prepare('SELECT id, batch_id, name, origin, supplier, notes, sort_order FROM batch_ingredients WHERE batch_id = ? ORDER BY sort_order ASC')
    .bind(batchId)
    .all<BatchIngredient>();
  return result.results;
}
```

`created_at` is excluded from the SELECT and the interface — it is never used in rendering.

## New Component: `BatchIngredients`

**File:** `src/components/BatchIngredients.tsx`

Server component. Props: `{ ingredients: BatchIngredient[] }`.

Renders nothing if `ingredients` is empty.

### Card layout per ingredient

- **Name** — `text-white font-semibold`
- **Origin** — `text-gold-400 text-sm` — rendered only if non-null
- **Supplier** — `text-parchment-400 text-sm` — rendered only if non-null
- **Notes** — `text-parchment-300 text-sm leading-relaxed` — rendered only if non-null

No fallback text for null fields. Fields are simply absent.

### Grid

- Mobile: 1 column
- Tablet (`md`): 2 columns
- Desktop (`lg`): 3 columns

### Styling

Section heading: `text-2xl font-serif font-bold text-white mb-6` — matches existing `BatchDetails` heading style.

Cards: `bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6` — matches existing batch page card style.

## Page Integration

**File:** `src/app/batch/[batchNumber]/page.tsx`

`getBatchIngredients` is added to the existing `Promise.all` fetch:

```typescript
const [batch, stats, cocktails, ingredients] = await Promise.all([
  getBatch(db, batchId),
  getBatchStats(db, batchId),
  client.fetch<FeaturedCocktail[]>(featuredCocktailsQuery),
  getBatchIngredients(db, batchId),
])
```

`BatchIngredients` renders in the `lg:col-span-2` main column, after `<BatchDetails />`. `BatchDetails` is not modified.

```tsx
<div className="lg:col-span-2">
  <BatchDetails batch={batch} stats={stats} />
  {ingredients.length > 0 && (
    <div className="mt-8">
      <BatchIngredients ingredients={ingredients} />
    </div>
  )}
</div>
```

## What Is Not In Scope

- Admin UI for managing ingredients — data is managed via migration files
- Charity contribution data — separate piece of work, separate migration
- Ingredient images or icons
- Links to supplier websites
- Modifying `BatchDetails`
