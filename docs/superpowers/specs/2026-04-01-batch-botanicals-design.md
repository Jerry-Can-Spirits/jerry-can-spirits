# Batch Botanicals & Sourcing Design

## Goal

Add a "Botanicals & Sourcing" section to each batch detail page (`/batch/[batchNumber]/`) showing per-ingredient provenance: name, origin, supplier, and a short flavour/sourcing note.

## Architecture

All botanical data lives in a new `batch_ingredients` table in Cloudflare D1 — the same database already used for the `batches` and `bottles` tables. This keeps all batch-related data in one place and is consistent with the existing migration-file pattern for data management.

A new `BatchIngredients` server component fetches and renders the data. It is added to the existing batch detail page alongside the existing `BatchDetails` and tasting notes sections.

## Database

### New table: `batch_ingredients`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | e.g. `batch-001-vanilla` |
| `batch_id` | TEXT NOT NULL | Foreign key → `batches.id` |
| `name` | TEXT NOT NULL | e.g. `Madagascan Vanilla Pods` |
| `origin` | TEXT NOT NULL | Country or region, e.g. `Madagascar` |
| `supplier` | TEXT | Nullable — omitted from display if null |
| `notes` | TEXT | Nullable — shows "Sourcing details to follow." if null |
| `sort_order` | INTEGER NOT NULL DEFAULT 0 | Controls display order |
| `created_at` | TEXT NOT NULL | Defaults to `datetime('now')` |

### Migration file: `0006_batch_ingredients.sql`

Creates the table and seeds Batch 001 with the following ingredients in display order:

1. Caribbean Rum Base — Caribbean
2. Welsh Molasses — Wales (Spirit of Wales Distillery, Newport)
3. Madagascan Vanilla Pods — Madagascar
4. Ceylon Cinnamon — Sri Lanka
5. Ginger — supplier/origin pending
6. Orange Peel — supplier/origin pending
7. Cloves — supplier/origin pending
8. Allspice — supplier/origin pending
9. Cassia Bark — supplier/origin pending
10. Agave Syrup — supplier/origin pending
11. Glucose Syrup — supplier/origin pending
12. Bourbon Barrel Chips — United States

Items where Spirit of Wales holds the sourcing detail have `supplier` and `notes` set to NULL. The display handles this gracefully — no blank fields, no "pending" labels cluttering the UI.

## D1 Query Layer

New additions to `src/lib/d1.ts`:

```typescript
export interface BatchIngredient {
  id: string;
  batch_id: string;
  name: string;
  origin: string;
  supplier: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
}

export async function getBatchIngredients(
  db: D1Database,
  batchId: string,
): Promise<BatchIngredient[]>
```

Query: `SELECT * FROM batch_ingredients WHERE batch_id = ? ORDER BY sort_order ASC`

## New Component: `BatchIngredients`

**File:** `src/components/BatchIngredients.tsx`

Server component. Props: `{ ingredients: BatchIngredient[] }`.

Renders nothing if `ingredients` is empty (no error state needed — the section simply won't appear).

### Card layout per ingredient

- **Name** — white, medium weight, e.g. "Madagascan Vanilla Pods"
- **Origin** — gold-tinted label, e.g. "Madagascar"
- **Supplier** — parchment subdued text, rendered only if non-null
- **Notes** — parchment body text; if null renders "Sourcing details to follow." in a slightly more muted style

### Grid

- Mobile: 1 column
- Tablet (md): 2 columns
- Desktop (lg): 3 columns

### Styling

Consistent with existing batch page cards: `bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6`. No new design tokens required.

## Page Integration

**File:** `src/app/batch/[batchNumber]/page.tsx`

`getBatchIngredients` is added to the existing `Promise.all` fetch on the page. The new section renders between Production Details and Tasting Notes in the main column.

Section heading: "Botanicals & Sourcing"

## What Is Not In Scope

- Admin UI for managing ingredients — data is managed via migration files, consistent with existing pattern
- Charity contribution data — separate piece of work, separate migration
- Ingredient images or icons
- Links to supplier websites (supplier name as text only for now)

## Future: Charity Contributions

Separate design. Will cover: a manually maintained list per batch/year of which charities received what, with logo and website link. Potentially a customer-facing "add your own donation" pointer. Not part of this piece of work.
