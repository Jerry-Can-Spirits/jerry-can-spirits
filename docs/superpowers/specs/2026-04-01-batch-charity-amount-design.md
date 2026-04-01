# Batch Charity Amount Design

## Goal

Add a `charity_amount_gbp` field to the `batches` table so each batch detail page can display how much that batch contributed to armed forces charities. Starts null on all batches. Populated via a future migration once a donation is made.

## Architecture

Single migration adds a nullable `REAL` column to `batches`. The `Batch` TypeScript interface gains one nullable field. `BatchDetails` renders a new row in its Production Details section when the value is non-null. No other files change.

---

## Database

### Migration: `0009_add_batch_charity_amount.sql`

```sql
-- Add charity contribution amount to batches
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0009_add_batch_charity_amount.sql

ALTER TABLE batches ADD COLUMN charity_amount_gbp REAL;
```

Nullable — no `NOT NULL` constraint, no `DEFAULT`. Existing rows get `NULL` automatically.

### Setting the value for a batch

When a donation is confirmed for a specific batch:

```sql
-- Example: 0010_batch001_charity_amount.sql
UPDATE batches SET charity_amount_gbp = 250.00 WHERE id = 'batch-001';
```

---

## TypeScript

### `src/lib/d1.ts` — update `Batch` interface

Add `charity_amount_gbp: number | null;` after `founder_notes`:

```typescript
export interface Batch {
  id: string;
  name: string;
  product: string;
  cask_type: string | null;
  distillation_date: string | null;
  bottling_date: string | null;
  bottle_count: number | null;
  abv: number | null;
  status: string;
  tasting_notes: string | null;
  founder_notes: string | null;
  charity_amount_gbp: number | null;
  created_at: string;
}
```

Existing queries use `SELECT *` — no query changes needed.

---

## Component: `src/components/BatchDetails.tsx`

Add one conditional row to the Production Details `<dl>` grid. Render only when `batch.charity_amount_gbp` is non-null.

Format using `toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2 })`.

Label: **"Charity contribution"**

The new row follows the existing `dt`/`dd` pattern already in the component:

```tsx
{batch.charity_amount_gbp !== null && batch.charity_amount_gbp !== undefined && (
  <>
    <dt className="text-parchment-500 text-sm">Charity contribution</dt>
    <dd className="text-white text-sm font-medium">
      {batch.charity_amount_gbp.toLocaleString('en-GB', {
        style: 'currency',
        currency: 'GBP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}
    </dd>
  </>
)}
```

Placement: last row in the Production Details `dl`, after existing fields.

---

## What Is Not In Scope

- Per-charity breakdown on the batch page (that lives on `/giving/`)
- Automatic calculation from bottle sales
- Admin UI
- Linking batch charity amounts to `charity_contributions` records (separate concern)
