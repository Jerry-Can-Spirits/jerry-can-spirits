# Batch Botanicals & Sourcing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "What Goes In" botanical sourcing section to each batch detail page, backed by a new D1 table, and add a `product` field to `batches` so future spirits can be distinguished.

**Architecture:** Two new D1 migrations extend the existing database — one adds `product` to `batches`, one creates the `batch_ingredients` table and seeds Batch 001. A new `BatchIngredients` server component renders the data. The existing batch detail page fetches ingredients alongside its existing parallel queries and renders the new component below `BatchDetails`. Nothing existing is broken or restructured.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1 (SQLite), TypeScript, Tailwind CSS, `@opennextjs/cloudflare`, `wrangler` CLI.

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `migrations/0006_add_product_field.sql` | ALTER TABLE adds `product` column to `batches` |
| Create | `migrations/0007_batch_ingredients.sql` | Creates `batch_ingredients` table, seeds Batch 001 |
| Modify | `src/lib/d1.ts` | Add `product` to `Batch` interface; add `BatchIngredient` interface and `getBatchIngredients` function |
| Create | `src/components/BatchIngredients.tsx` | New server component rendering botanical cards |
| Modify | `src/app/batch/[batchNumber]/page.tsx` | Add `getBatchIngredients` to `Promise.all`; render `<BatchIngredients />` |

---

## Chunk 1: Database Migrations

### Task 1: Migration 0006 — add product field

**Files:**
- Create: `migrations/0006_add_product_field.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Add product field to batches for multi-spirit support
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0006_add_product_field.sql

ALTER TABLE batches ADD COLUMN product TEXT NOT NULL DEFAULT 'expedition-spiced-rum';
```

- [ ] **Step 2: Apply locally and verify**

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0006_add_product_field.sql
```

Expected output: `Executed 1 queries.` (or similar success message, no errors)

Then verify the column exists:

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command="SELECT id, product FROM batches;"
```

Expected: one row — `batch-001 | expedition-spiced-rum`

- [ ] **Step 3: Commit**

```bash
git add migrations/0006_add_product_field.sql
git commit -m "feat: add product field to batches table"
```

---

### Task 2: Migration 0007 — batch_ingredients table and Batch 001 seed

**Files:**
- Create: `migrations/0007_batch_ingredients.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Create batch_ingredients table for botanical sourcing provenance
-- Apply with: wrangler d1 execute jerry-can-spirits-db --file=migrations/0007_batch_ingredients.sql

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

-- Seed: Batch 001 — Expedition Spiced Rum
INSERT OR IGNORE INTO batch_ingredients (id, batch_id, name, origin, supplier, notes, sort_order) VALUES
  ('batch-001-rum-base',     'batch-001', 'Caribbean Rum Base',      'Caribbean',    NULL,                                    NULL, 1),
  ('batch-001-molasses',     'batch-001', 'Welsh Molasses',           'Wales',        'Spirit of Wales Distillery, Newport',   NULL, 2),
  ('batch-001-vanilla',      'batch-001', 'Madagascan Vanilla Pods',  'Madagascar',   NULL,                                    NULL, 3),
  ('batch-001-cinnamon',     'batch-001', 'Ceylon Cinnamon',          'Sri Lanka',    NULL,                                    NULL, 4),
  ('batch-001-ginger',       'batch-001', 'Ginger',                   NULL,           NULL,                                    NULL, 5),
  ('batch-001-orange-peel',  'batch-001', 'Orange Peel',              NULL,           NULL,                                    NULL, 6),
  ('batch-001-cloves',       'batch-001', 'Cloves',                   NULL,           NULL,                                    NULL, 7),
  ('batch-001-allspice',     'batch-001', 'Allspice',                 NULL,           NULL,                                    NULL, 8),
  ('batch-001-cassia',       'batch-001', 'Cassia Bark',              NULL,           NULL,                                    NULL, 9),
  ('batch-001-agave',        'batch-001', 'Agave Syrup',              NULL,           NULL,                                    NULL, 10),
  ('batch-001-glucose',      'batch-001', 'Glucose Syrup',            NULL,           NULL,                                    NULL, 11),
  ('batch-001-barrel-chips', 'batch-001', 'Bourbon Barrel Chips',     'United States',NULL,                                    NULL, 12);
```

- [ ] **Step 2: Apply locally and verify**

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0007_batch_ingredients.sql
```

Expected: success, no errors.

Then verify the rows:

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command="SELECT id, name, origin FROM batch_ingredients WHERE batch_id = 'batch-001' ORDER BY sort_order;"
```

Expected: 12 rows in sort_order sequence, with `origin` showing NULL for items pending Spirit of Wales confirmation.

- [ ] **Step 3: Commit**

```bash
git add migrations/0007_batch_ingredients.sql
git commit -m "feat: create batch_ingredients table and seed Batch 001"
```

---

## Chunk 2: TypeScript Data Layer

### Task 3: Update d1.ts

**Files:**
- Modify: `src/lib/d1.ts`

The current `Batch` interface is at lines 13-25. `getBatch` and `getAllBatches` use `SELECT *` so the new `product` column will be returned automatically once the migration runs — no query changes needed.

- [ ] **Step 1: Add `product` to the `Batch` interface**

Find this block in `src/lib/d1.ts` (around line 13):

```typescript
export interface Batch {
  id: string;
  name: string;
  cask_type: string | null;
```

Replace with:

```typescript
export interface Batch {
  id: string;
  name: string;
  product: string;
  cask_type: string | null;
```

- [ ] **Step 2: Add `BatchIngredient` interface and `getBatchIngredients` function**

Append to the end of `src/lib/d1.ts`:

```typescript
// ── Ingredient Queries ───────────────────────────────────────────────

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

- [ ] **Step 3: Type-check**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. If TypeScript errors appear referencing `product`, they indicate places in the codebase that destructure `Batch` exhaustively — fix them by adding `product` to the destructure.

- [ ] **Step 4: Commit**

```bash
git add src/lib/d1.ts
git commit -m "feat: add BatchIngredient type and getBatchIngredients query"
```

---

## Chunk 3: Component and Page

### Task 4: Create BatchIngredients component

**Files:**
- Create: `src/components/BatchIngredients.tsx`

This is a server component (no `'use client'`). It receives pre-fetched data — no database calls inside the component.

- [ ] **Step 1: Create the component**

```tsx
import type { BatchIngredient } from '@/lib/d1'

interface BatchIngredientsProps {
  ingredients: BatchIngredient[]
}

export default function BatchIngredients({ ingredients }: BatchIngredientsProps) {
  if (ingredients.length === 0) return null

  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
      <h2 className="text-2xl font-serif font-bold text-white mb-6">What Goes In</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((ingredient) => (
          <div
            key={ingredient.id}
            className="bg-jerry-green-700/40 border border-gold-500/10 rounded-lg p-4"
          >
            <p className="text-white font-semibold">{ingredient.name}</p>
            {ingredient.origin && (
              <p className="text-gold-400 text-sm mt-1">{ingredient.origin}</p>
            )}
            {ingredient.supplier && (
              <p className="text-parchment-400 text-sm mt-1">{ingredient.supplier}</p>
            )}
            {ingredient.notes && (
              <p className="text-parchment-300 text-sm leading-relaxed mt-2">{ingredient.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: no errors. The component is not yet imported anywhere so it won't be exercised — just confirm it compiles clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/BatchIngredients.tsx
git commit -m "feat: add BatchIngredients component"
```

---

### Task 5: Integrate into batch detail page

**Files:**
- Modify: `src/app/batch/[batchNumber]/page.tsx`

- [ ] **Step 1: Add the import**

At the top of `src/app/batch/[batchNumber]/page.tsx`, add alongside the existing imports:

```typescript
import BatchIngredients from '@/components/BatchIngredients'
import { getD1, getBatch, getBatchStats, getBatchIngredients } from '@/lib/d1'
```

The existing import line for `d1` currently reads:

```typescript
import { getD1, getBatch, getBatchStats } from '@/lib/d1'
```

Replace it with the line above (adding `getBatchIngredients`).

- [ ] **Step 2: Add `getBatchIngredients` to the parallel fetch**

Find the existing `Promise.all` (around line 75):

```typescript
const [batch, stats, cocktails] = await Promise.all([
  getBatch(db, batchId),
  getBatchStats(db, batchId),
  client.fetch<FeaturedCocktail[]>(featuredCocktailsQuery),
])
```

Replace with:

```typescript
const [batch, stats, cocktails, ingredients] = await Promise.all([
  getBatch(db, batchId),
  getBatchStats(db, batchId),
  client.fetch<FeaturedCocktail[]>(featuredCocktailsQuery),
  getBatchIngredients(db, batchId),
])
```

- [ ] **Step 3: Render the component**

Find the existing main column div (around line 131):

```tsx
<div className="lg:col-span-2">
  <BatchDetails batch={batch} stats={stats} />
</div>
```

Replace with:

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

- [ ] **Step 4: Type-check and build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 5: Visual check**

```bash
npm run dev
```

Navigate to `http://localhost:3000/batch/001/` and confirm:
- "What Goes In" section appears below the existing production details and tasting notes
- Caribbean Rum Base, Welsh Molasses (with supplier), Madagascan Vanilla Pods, Ceylon Cinnamon show origin
- Ginger, Orange Peel, Cloves, Allspice, Cassia Bark, Agave Syrup, Glucose Syrup show name only (origin/supplier null)
- Bourbon Barrel Chips shows "United States"
- Layout: 3 columns on wide screen, 2 on tablet, 1 on mobile

- [ ] **Step 6: Commit**

```bash
git add src/app/batch/[batchNumber]/page.tsx
git commit -m "feat: render batch ingredients on batch detail page"
```

---

## Chunk 4: Deploy

### Task 6: Apply migrations to production and open PR

- [ ] **Step 1: Apply migration 0006 to production**

```bash
npx wrangler d1 execute jerry-can-spirits-db --file=migrations/0006_add_product_field.sql
```

Expected: `Executed 1 queries.`

- [ ] **Step 2: Apply migration 0007 to production**

```bash
npx wrangler d1 execute jerry-can-spirits-db --file=migrations/0007_batch_ingredients.sql
```

Expected: success, 12 rows inserted.

- [ ] **Step 3: Verify production data**

```bash
npx wrangler d1 execute jerry-can-spirits-db --command="SELECT id, name FROM batch_ingredients WHERE batch_id = 'batch-001' ORDER BY sort_order;"
```

Expected: 12 rows.

- [ ] **Step 4: Push branch and open PR**

```bash
git push -u origin feat/batch-botanicals
gh pr create --title "feat: batch botanicals sourcing section" --body "Adds 'What Goes In' ingredient provenance section to batch detail pages. New batch_ingredients D1 table. Product field added to batches for multi-spirit support. Batch 001 seeded with known origins; Spirit of Wales sourcing detail to follow in a future migration."
```

---

## Adding Future Batch Data

When Spirit of Wales provides sourcing details, or when adding Batch 002, create a new migration file (`0008_...sql`) with `UPDATE` or `INSERT` statements:

```sql
-- Example: fill in ginger origin once confirmed
UPDATE batch_ingredients SET origin = 'Nigeria', supplier = 'Example Supplier', notes = 'West African ginger, prized for its intensity.' WHERE id = 'batch-001-ginger';

-- Example: add Batch 002 ingredients (same recipe)
INSERT OR IGNORE INTO batch_ingredients (id, batch_id, name, origin, supplier, notes, sort_order) VALUES
  ('batch-002-rum-base', 'batch-002', 'Caribbean Rum Base', 'Caribbean', NULL, NULL, 1),
  -- ... remaining rows
```

New spirits get a new `product` slug on their `batches` row and their own ingredient rows.
