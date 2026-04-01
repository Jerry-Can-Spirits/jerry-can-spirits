# Batch Botanicals & Sourcing Design

## Goal

Add a "Botanicals & Sourcing" section to each batch detail page (`/batch/[batchNumber]/`) showing per-ingredient provenance: name, origin, supplier, and a short flavour/sourcing note.

Also add a `product` field to the `batches` table so that future batches of different spirits (e.g. a second product line) can be distinguished and filtered, without changing the URL structure.

## Architecture

All data lives in Cloudflare D1 — the same database already used for `batches` and `bottles`. Changes are applied via numbered migration files, consistent with the existing pattern.

A new `BatchIngredients` server component fetches and renders botanical data. It is added to the existing batch detail page as a new block in the main (`lg:col-span-2`) column, after the existing `BatchDetails` block. `BatchDetails` is not modified.

---

## Migration 1: `0006_add_product_field.sql`

Adds a `product` column to the existing `batches` table. All existing rows (including Batch 001) default to `'expedition-spiced-rum'`.

```sql
ALTER TABLE batches ADD COLUMN product TEXT NOT NULL DEFAULT 'expedition-spiced-rum';
```

No further UPDATE required — the DEFAULT value covers existing rows in SQLite.

### Updated `Batch` TypeScript interface

Add `product: string` to the existing `Batch` interface in `src/lib/d1.ts`:

```typescript
export interface Batch {
  id: string;
  name: string;
  product: string;        // ← new
  cask_type: string | null;
  distillation_date: string | null;
  bottling_date: string | null;
  bottle_count: number | null;
  abv: number | null;
  status: string;
  tasting_notes: string | null;
  founder_notes: string | null;
  created_at: string;
}
```

Product-based filtering on the `/batch/` index page is **out of scope** for this piece of work. The column is added now so future batches are correctly tagged from the start.

### Batch ID convention for future products

Current format: `batch-001`, `batch-002` (global sequential numbering).

When a second product launches, continue the same global sequence — `batch-003` etc. — and use the `product` column to distinguish. Do not introduce per-product numbering (e.g. `batch-rum-001`) as this would break existing URLs.

---

## Migration 2: `0007_batch_ingredients.sql`

### New table: `batch_ingredients`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | Format: `{batch_id}-{slug}`, e.g. `batch-001-vanilla` |
| `batch_id` | TEXT NOT NULL REFERENCES batches(id) | Foreign key → `batches.id` |
| `name` | TEXT NOT NULL | e.g. `Madagascan Vanilla Pods` |
| `origin` | TEXT | Nullable — country or region; omitted from display if null |
| `supplier` | TEXT | Nullable — omitted from display if null |
| `notes` | TEXT | Nullable — omitted from display if null |
| `sort_order` | INTEGER NOT NULL DEFAULT 0 | Controls display order |
| `created_at` | TEXT NOT NULL DEFAULT (datetime('now')) | |

```sql
CREATE TABLE IF NOT EXISTS batch_ingredients (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  name TEXT NOT NULL,
  origin TEXT,
  supplier TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_batch_ingredients_batch_id
  ON batch_ingredients(batch_id);
```

### Batch 001 seed data

Items where Spirit of Wales holds the sourcing detail have `origin`, `supplier`, and `notes` set to NULL. The display omits null fields entirely — no placeholder text.

| sort_order | id | name | origin | supplier | notes |
|---|---|---|---|---|---|
| 1 | batch-001-rum-base | Caribbean Rum Base | Caribbean | NULL | NULL |
| 2 | batch-001-molasses | Welsh Molasses | Wales | Spirit of Wales Distillery, Newport | NULL |
| 3 | batch-001-vanilla | Madagascan Vanilla Pods | Madagascar | NULL | NULL |
| 4 | batch-001-cinnamon | Ceylon Cinnamon | Sri Lanka | NULL | NULL |
| 5 | batch-001-ginger | Ginger | NULL | NULL | NULL |
| 6 | batch-001-orange-peel | Orange Peel | NULL | NULL | NULL |
| 7 | batch-001-cloves | Cloves | NULL | NULL | NULL |
| 8 | batch-001-allspice | Allspice | NULL | NULL | NULL |
| 9 | batch-001-cassia | Cassia Bark | NULL | NULL | NULL |
| 10 | batch-001-agave | Agave Syrup | NULL | NULL | NULL |
| 11 | batch-001-glucose | Glucose Syrup | NULL | NULL | NULL |
| 12 | batch-001-barrel-chips | Bourbon Barrel Chips | United States | NULL | NULL |

When Spirit of Wales provides sourcing detail, update the relevant rows with a further migration file.

---

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
    .prepare(
      'SELECT id, batch_id, name, origin, supplier, notes, sort_order FROM batch_ingredients WHERE batch_id = ? ORDER BY sort_order ASC',
    )
    .bind(batchId)
    .all<BatchIngredient>();
  return result.results;
}
```

`created_at` is excluded from the SELECT and the interface — it is never used in rendering.

---

## New Component: `BatchIngredients`

**File:** `src/components/BatchIngredients.tsx`

Server component. Props: `{ ingredients: BatchIngredient[] }`. Renders nothing if the array is empty.

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

Section heading text: **"What Goes In"** — direct, no label-style language, consistent with brand voice.

Section heading style: `text-2xl font-serif font-bold text-white mb-6` — matches `BatchDetails` heading style.

Cards: `bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6` — matches existing batch page card style.

---

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

`BatchIngredients` renders in the `lg:col-span-2` main column, after `<BatchDetails />`:

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

`BatchDetails` is not modified.

---

## What Is Not In Scope

- Admin UI — data is managed via migration files
- Charity contribution data — separate design, separate migration
- Ingredient images or icons
- Links to supplier websites
- Product-based filtering on the `/batch/` index page
- Modifying `BatchDetails`

## Adding Future Batches

For each new batch (same or different product):

1. Add a row to `batches` in a new migration file, with the correct `product` value
2. Add rows to `batch_ingredients` for that `batch_id` in the same migration
3. For a different product, set `product` to a new slug (e.g. `'expedition-gin'`) — existing URLs are unaffected
