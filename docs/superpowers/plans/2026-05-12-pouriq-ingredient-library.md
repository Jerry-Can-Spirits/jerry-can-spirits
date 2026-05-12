# Pour IQ Ingredient Library — Implementation Plan (PR 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Pour IQ from per-cocktail inline ingredient data to a tenant-scoped ingredient library. Each cocktail-ingredient row references a library entry; bar managers define "Tito's Vodka 700ml £25" once and reuse it across drinks. Foundation for cost-change ripple analysis and AI menu import.

**Architecture:** New `pouriq_ingredients_library` table (tenant-scoped). Existing `pouriq_ingredients` keeps `cocktail_id`, gains `library_ingredient_id` FK + `unit_count` for fractional unit-priced items (lime wedge = 0.125 of a lime), drops the inline name/size/cost columns. Single atomic D1 migration handles schema reshape + backfill of existing data. New library CRUD pages at `/trade/pouriq/library`. Cocktail form ingredient row becomes a searchable combobox of library entries with inline "create new". UI copy updated to say "drink" instead of "cocktail" so simple serves are first-class.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind, Cloudflare Workers (OpenNext), D1, KV. No new dependencies in this PR.

**Spec:** `docs/superpowers/specs/2026-05-12-pouriq-menu-import-and-library-design.md`

**Branch:** `feat/pouriq-ingredient-library` (already created from `origin/main`; spec already committed)

---

## File Map

**Create:**
- `migrations/0016_ingredient_library.sql`
- `src/lib/pouriq/ingredient-library.ts`
- `src/app/trade/pouriq/library/page.tsx`
- `src/app/trade/pouriq/library/new/page.tsx`
- `src/app/trade/pouriq/library/[id]/edit/page.tsx`
- `src/components/pouriq/IngredientForm.tsx`
- `src/components/pouriq/IngredientList.tsx`
- `src/components/pouriq/IngredientPicker.tsx`

**Modify:**
- `src/lib/pouriq/types.ts` — new `IngredientLibraryRow`; `IngredientRow` reshape; `Cocktail*Metrics` unchanged in shape but recalculated
- `src/lib/pouriq/calculations.ts` — pour cost reads from library entry
- `src/lib/pouriq/menus.ts` — queries join the library, helpers updated
- `src/lib/pouriq/server-actions.ts` — `saveCocktailAction` accepts library FKs per ingredient
- `src/lib/pouriq/prompts.ts` — include library context in recommendation user message
- `src/components/pouriq/CocktailForm.tsx` — uses `IngredientPicker` instead of free-form inputs
- `src/app/trade/pouriq/page.tsx` — copy "cocktails" → "drinks"
- `src/app/trade/pouriq/[menuId]/page.tsx` — copy + add "Library" nav link
- `src/app/trade/pouriq/[menuId]/edit/page.tsx` — copy
- `src/components/pouriq/MenuListCard.tsx` — copy
- `src/components/pouriq/KpiCards.tsx` — copy (e.g., "Average GP" stays, "Best margin cocktail" → "Best margin drink")
- `src/components/pouriq/CocktailTable.tsx` — copy (heading + empty state)
- `src/components/pouriq/IngredientOverlapTable.tsx` — copy (e.g., "Used in N cocktails" → "Used in N drinks")
- `src/components/pouriq/RecommendationStream.tsx` — copy as needed

---

## Task 1: Update shared types

**Files:**
- Modify: `src/lib/pouriq/types.ts`

- [ ] **Step 1: Add `IngredientLibraryRow` and reshape `IngredientRow`**

Open `src/lib/pouriq/types.ts`. Add the new type and reshape the existing `IngredientRow`. Replace the existing `IngredientRow` interface with these two:

```ts
export interface IngredientLibraryRow {
  id: string
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IngredientRow {
  id: string
  cocktail_id: string
  library_ingredient_id: string
  pour_ml: number | null
  unit_count: number | null
}

// IngredientRow with the library entry joined in — what calculations and
// rendering layers actually want to work with.
export interface IngredientWithLibrary extends IngredientRow {
  library: IngredientLibraryRow
}
```

The `IngredientType` enum stays where it is — no change needed.

- [ ] **Step 2: Update `CocktailWithIngredients`**

Find `CocktailWithIngredients` (it currently uses `IngredientRow[]`). Replace `ingredients: IngredientRow[]` with `ingredients: IngredientWithLibrary[]`. This is the shape calculations and components consume.

```ts
export interface CocktailWithIngredients extends CocktailRow {
  ingredients: IngredientWithLibrary[]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/types.ts
git commit -m "feat: ingredient library types"
```

---

## Task 2: D1 migration

**Files:**
- Create: `migrations/0016_ingredient_library.sql`

- [ ] **Step 1: Write the migration**

Create `migrations/0016_ingredient_library.sql`:

```sql
-- Pour IQ ingredient library: tenant-scoped table holding the ingredients
-- a venue buys. pouriq_ingredients (per-cocktail) reshapes to FK into the
-- library instead of duplicating name/size/cost inline.
--
-- Apply with:
--   wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0016_ingredient_library.sql
--   wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0016_ingredient_library.sql
--
-- This migration is destructive (drops columns). Take a manual D1 export
-- before running remote:
--   wrangler d1 export jerry-can-spirits-db --remote --output=pre-0016-backup.sql

-- 1. Create the library table
CREATE TABLE pouriq_ingredients_library (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES trade_accounts(id),
  name             TEXT NOT NULL,
  ingredient_type  TEXT NOT NULL CHECK(ingredient_type IN ('spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other')),
  bottle_size_ml   REAL,
  bottle_cost_p    INTEGER,
  unit_cost_p      INTEGER,
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (bottle_size_ml IS NOT NULL AND bottle_cost_p IS NOT NULL)
    OR unit_cost_p IS NOT NULL
  )
);

CREATE INDEX idx_pouriq_lib_trade_account ON pouriq_ingredients_library(trade_account_id);
CREATE UNIQUE INDEX idx_pouriq_lib_uniqueness
  ON pouriq_ingredients_library(trade_account_id, LOWER(name), COALESCE(bottle_size_ml, -1));

-- 2. Add the new columns to pouriq_ingredients (nullable for now)
ALTER TABLE pouriq_ingredients ADD COLUMN library_ingredient_id TEXT REFERENCES pouriq_ingredients_library(id);
ALTER TABLE pouriq_ingredients ADD COLUMN unit_count REAL;

-- 3. Backfill: create one library entry per unique (tenant, lower(name), bottle_size_ml)
INSERT INTO pouriq_ingredients_library (
  trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p
)
SELECT
  m.trade_account_id,
  i.name,
  i.ingredient_type,
  i.bottle_size_ml,
  i.bottle_cost_p,
  i.unit_cost_p
FROM pouriq_ingredients i
JOIN pouriq_cocktails c ON c.id = i.cocktail_id
JOIN pouriq_menus m ON m.id = c.menu_id
GROUP BY m.trade_account_id, LOWER(i.name), COALESCE(i.bottle_size_ml, -1);

-- 4. Link existing pouriq_ingredients rows to their library entries
UPDATE pouriq_ingredients
SET library_ingredient_id = (
  SELECT l.id
  FROM pouriq_ingredients_library l
  JOIN pouriq_cocktails c ON c.id = pouriq_ingredients.cocktail_id
  JOIN pouriq_menus m ON m.id = c.menu_id
  WHERE l.trade_account_id = m.trade_account_id
    AND LOWER(l.name) = LOWER(pouriq_ingredients.name)
    AND COALESCE(l.bottle_size_ml, -1) = COALESCE(pouriq_ingredients.bottle_size_ml, -1)
);

-- 5. Set unit_count = 1.0 for rows that were unit-priced (had unit_cost_p)
UPDATE pouriq_ingredients
SET unit_count = 1.0
WHERE unit_cost_p IS NOT NULL;

-- 6. Drop the now-redundant inline columns
ALTER TABLE pouriq_ingredients DROP COLUMN name;
ALTER TABLE pouriq_ingredients DROP COLUMN ingredient_type;
ALTER TABLE pouriq_ingredients DROP COLUMN bottle_size_ml;
ALTER TABLE pouriq_ingredients DROP COLUMN bottle_cost_p;
ALTER TABLE pouriq_ingredients DROP COLUMN unit_cost_p;

-- 7. Rebuild pouriq_ingredients to add NOT NULL on library_ingredient_id
-- (SQLite can't ALTER COLUMN to add NOT NULL directly)
CREATE TABLE pouriq_ingredients_new (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cocktail_id           TEXT NOT NULL REFERENCES pouriq_cocktails(id) ON DELETE CASCADE,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id),
  pour_ml               REAL,
  unit_count            REAL,
  CHECK (pour_ml IS NOT NULL OR unit_count IS NOT NULL)
);

INSERT INTO pouriq_ingredients_new (id, cocktail_id, library_ingredient_id, pour_ml, unit_count)
SELECT id, cocktail_id, library_ingredient_id, pour_ml, unit_count FROM pouriq_ingredients;

DROP TABLE pouriq_ingredients;
ALTER TABLE pouriq_ingredients_new RENAME TO pouriq_ingredients;

CREATE INDEX idx_pouriq_ingredients_cocktail ON pouriq_ingredients(cocktail_id);
CREATE INDEX idx_pouriq_ingredients_library ON pouriq_ingredients(library_ingredient_id);
```

- [ ] **Step 2: Apply locally**

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0016_ingredient_library.sql
```

Expected: all statements succeed. Watch for "Errors" in the output — there should be none.

- [ ] **Step 3: Verify locally**

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command "SELECT COUNT(*) AS lib_count FROM pouriq_ingredients_library;"
npx wrangler d1 execute jerry-can-spirits-db --local --command "SELECT COUNT(*) AS unmigrated FROM pouriq_ingredients WHERE library_ingredient_id IS NULL;"
```

Expected: `lib_count` ≥ 1 if there were any existing ingredient rows; `unmigrated` = 0.

If you have no pre-existing data locally, both can be 0 — that's fine.

- [ ] **Step 4: Commit**

```bash
git add migrations/0016_ingredient_library.sql
git commit -m "feat: ingredient library schema + backfill migration"
```

---

## Task 3: D1 query helpers for the library

**Files:**
- Create: `src/lib/pouriq/ingredient-library.ts`

- [ ] **Step 1: Write the query helpers**

```ts
import type { IngredientLibraryRow, IngredientType } from './types'

export interface IngredientLibraryInsert {
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  notes: string | null
}

export interface IngredientLibraryUsage {
  id: string
  menu_id: string
  menu_name: string
  cocktail_id: string
  cocktail_name: string
}

export async function listLibraryEntries(
  db: D1Database,
  tradeAccountId: string,
): Promise<IngredientLibraryRow[]> {
  const result = await db
    .prepare(`
      SELECT * FROM pouriq_ingredients_library
      WHERE trade_account_id = ?1
      ORDER BY LOWER(name) ASC
    `)
    .bind(tradeAccountId)
    .all<IngredientLibraryRow>()
  return result.results ?? []
}

export async function getLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<IngredientLibraryRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<IngredientLibraryRow>()
}

export async function insertLibraryEntry(
  db: D1Database,
  data: IngredientLibraryInsert,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_ingredients_library
        (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.ingredient_type,
      data.bottle_size_ml, data.bottle_cost_p, data.unit_cost_p, data.notes,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Library insert returned no id')
  return result.id
}

export async function updateLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
  patch: Partial<Omit<IngredientLibraryInsert, 'trade_account_id'>>,
): Promise<void> {
  const allowedFields = [
    'name','ingredient_type','bottle_size_ml','bottle_cost_p','unit_cost_p','notes',
  ] as const
  const sets: string[] = []
  const binds: unknown[] = []
  let idx = 1
  for (const key of allowedFields) {
    if (key in patch) {
      sets.push(`${key} = ?${idx++}`)
      binds.push((patch as Record<string, unknown>)[key])
    }
  }
  if (sets.length === 0) return
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_ingredients_library SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()
}

export async function deleteLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<void> {
  await db
    .prepare(`DELETE FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .run()
}

export async function getLibraryEntryUsage(
  db: D1Database,
  libraryIngredientId: string,
): Promise<IngredientLibraryUsage[]> {
  const result = await db
    .prepare(`
      SELECT
        i.id AS id,
        c.id AS cocktail_id,
        c.name AS cocktail_name,
        m.id AS menu_id,
        m.name AS menu_name
      FROM pouriq_ingredients i
      JOIN pouriq_cocktails c ON c.id = i.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE i.library_ingredient_id = ?1
      ORDER BY m.name, c.name
    `)
    .bind(libraryIngredientId)
    .all<IngredientLibraryUsage>()
  return result.results ?? []
}

export async function getLibraryUsageCounts(
  db: D1Database,
  tradeAccountId: string,
): Promise<Map<string, number>> {
  const result = await db
    .prepare(`
      SELECT i.library_ingredient_id AS lib_id, COUNT(*) AS n
      FROM pouriq_ingredients i
      JOIN pouriq_cocktails c ON c.id = i.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE m.trade_account_id = ?1
      GROUP BY i.library_ingredient_id
    `)
    .bind(tradeAccountId)
    .all<{ lib_id: string; n: number }>()
  const map = new Map<string, number>()
  for (const row of result.results ?? []) {
    map.set(row.lib_id, row.n)
  }
  return map
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build completes; no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/ingredient-library.ts
git commit -m "feat: D1 query helpers for ingredient library"
```

---

## Task 4: Update calculations.ts for library-based costs

**Files:**
- Modify: `src/lib/pouriq/calculations.ts`

- [ ] **Step 1: Update `ingredientCostPence` to read from library**

Find the existing `ingredientCostPence` function. Replace it with:

```ts
function ingredientCostPence(i: import('./types').IngredientWithLibrary): number {
  // Unit-priced: library has unit_cost_p; cocktail row has unit_count
  if (i.library.unit_cost_p !== null) {
    const count = i.unit_count ?? 1
    return Math.round(i.library.unit_cost_p * count)
  }
  // Bottle-priced: library has bottle_size_ml + bottle_cost_p; cocktail row has pour_ml
  if (
    i.library.bottle_size_ml !== null &&
    i.library.bottle_cost_p !== null &&
    i.pour_ml !== null
  ) {
    return Math.round((i.library.bottle_cost_p / i.library.bottle_size_ml) * i.pour_ml)
  }
  return 0
}
```

The signature of `calculateCocktailMetrics`, `calculateMenuMetrics`, etc. is unchanged because `CocktailWithIngredients.ingredients` is now `IngredientWithLibrary[]` (updated in Task 1).

- [ ] **Step 2: Update import block at top of `calculations.ts`**

Find the existing type imports. The `IngredientRow` import may still be there from before — drop it if unused; add `IngredientWithLibrary` if it's not already there.

```ts
import type {
  CocktailWithIngredients,
  CocktailMetrics,
  IngredientOverlap,
  WasteRisk,
  MenuMetrics,
} from './types'
```

(No change needed if those are already the imports — the `IngredientWithLibrary` type is only used inside `ingredientCostPence` via inline `import('./types')` to avoid bumping the file's top-level imports.)

- [ ] **Step 3: Update `calculateIngredientOverlap` to use library name**

The current function reads `ing.name` directly. Now ingredient names come from `ing.library.name`. Find:

```ts
const key = normaliseIngredientName(ing.name)
...
map.get(key)!.cocktailIds.add(c.id)
...
display: ing.name.trim(),
```

Replace with:

```ts
const key = normaliseIngredientName(ing.library.name)
...
map.get(key)!.cocktailIds.add(c.id)
...
display: ing.library.name.trim(),
```

- [ ] **Step 4: Build check**

Run: `npm run build`

Expected: no type errors. If you see complaints about `IngredientRow.name`, you've missed a reference — search the file for `\.name` on ingredient objects and update.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/calculations.ts
git commit -m "refactor: calculations read costs from library entries"
```

---

## Task 5: Update menus.ts query helpers to join library

**Files:**
- Modify: `src/lib/pouriq/menus.ts`

- [ ] **Step 1: Update `listCocktailsForMenu` to join the library**

Find the existing `listCocktailsForMenu` function. It currently runs two queries (cocktails, then their ingredients) and stitches them. Update the ingredients query to also fetch the joined library entry. Replace the function body with:

```ts
export async function listCocktailsForMenu(
  db: D1Database,
  menuId: string,
): Promise<CocktailWithIngredients[]> {
  const cocktailsResult = await db
    .prepare(`SELECT * FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY position ASC, name ASC`)
    .bind(menuId)
    .all<CocktailRow>()
  const cocktails = cocktailsResult.results ?? []
  if (cocktails.length === 0) return []

  // Join library entry inline so calculations can read costs without a second pass.
  const ingredientsResult = await db
    .prepare(`
      SELECT
        i.id AS i_id,
        i.cocktail_id,
        i.library_ingredient_id,
        i.pour_ml,
        i.unit_count,
        l.id AS l_id,
        l.trade_account_id AS l_trade_account_id,
        l.name AS l_name,
        l.ingredient_type AS l_ingredient_type,
        l.bottle_size_ml AS l_bottle_size_ml,
        l.bottle_cost_p AS l_bottle_cost_p,
        l.unit_cost_p AS l_unit_cost_p,
        l.notes AS l_notes,
        l.created_at AS l_created_at,
        l.updated_at AS l_updated_at
      FROM pouriq_ingredients i
      JOIN pouriq_ingredients_library l ON l.id = i.library_ingredient_id
      WHERE i.cocktail_id IN (SELECT id FROM pouriq_cocktails WHERE menu_id = ?1)
    `)
    .bind(menuId)
    .all<{
      i_id: string
      cocktail_id: string
      library_ingredient_id: string
      pour_ml: number | null
      unit_count: number | null
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_bottle_size_ml: number | null
      l_bottle_cost_p: number | null
      l_unit_cost_p: number | null
      l_notes: string | null
      l_created_at: string
      l_updated_at: string
    }>()

  const byCocktail = new Map<string, IngredientWithLibrary[]>()
  for (const row of ingredientsResult.results ?? []) {
    const ing: IngredientWithLibrary = {
      id: row.i_id,
      cocktail_id: row.cocktail_id,
      library_ingredient_id: row.library_ingredient_id,
      pour_ml: row.pour_ml,
      unit_count: row.unit_count,
      library: {
        id: row.l_id,
        trade_account_id: row.l_trade_account_id,
        name: row.l_name,
        ingredient_type: row.l_ingredient_type,
        bottle_size_ml: row.l_bottle_size_ml,
        bottle_cost_p: row.l_bottle_cost_p,
        unit_cost_p: row.l_unit_cost_p,
        notes: row.l_notes,
        created_at: row.l_created_at,
        updated_at: row.l_updated_at,
      },
    }
    if (!byCocktail.has(row.cocktail_id)) byCocktail.set(row.cocktail_id, [])
    byCocktail.get(row.cocktail_id)!.push(ing)
  }
  return cocktails.map((c) => ({ ...c, ingredients: byCocktail.get(c.id) ?? [] }))
}
```

- [ ] **Step 2: Update imports at the top of `menus.ts`**

Add `IngredientWithLibrary` to the type import block:

```ts
import type {
  MenuRow,
  CocktailRow,
  IngredientRow,
  CocktailWithIngredients,
  IngredientWithLibrary,
  IngredientType,
} from './types'
```

- [ ] **Step 3: Update `getCocktail` similarly**

Find `getCocktail`. Replace its ingredients query with the joined version (same pattern as above, scoped to a single cocktail):

```ts
export async function getCocktail(
  db: D1Database,
  cocktailId: string,
): Promise<CocktailWithIngredients | null> {
  const cocktail = await db
    .prepare(`SELECT * FROM pouriq_cocktails WHERE id = ?1`)
    .bind(cocktailId)
    .first<CocktailRow>()
  if (!cocktail) return null

  const ingredientsResult = await db
    .prepare(`
      SELECT
        i.id AS i_id, i.cocktail_id, i.library_ingredient_id, i.pour_ml, i.unit_count,
        l.id AS l_id, l.trade_account_id AS l_trade_account_id, l.name AS l_name,
        l.ingredient_type AS l_ingredient_type, l.bottle_size_ml AS l_bottle_size_ml,
        l.bottle_cost_p AS l_bottle_cost_p, l.unit_cost_p AS l_unit_cost_p,
        l.notes AS l_notes, l.created_at AS l_created_at, l.updated_at AS l_updated_at
      FROM pouriq_ingredients i
      JOIN pouriq_ingredients_library l ON l.id = i.library_ingredient_id
      WHERE i.cocktail_id = ?1
    `)
    .bind(cocktailId)
    .all<{
      i_id: string
      cocktail_id: string
      library_ingredient_id: string
      pour_ml: number | null
      unit_count: number | null
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_bottle_size_ml: number | null
      l_bottle_cost_p: number | null
      l_unit_cost_p: number | null
      l_notes: string | null
      l_created_at: string
      l_updated_at: string
    }>()

  const ingredients: IngredientWithLibrary[] = (ingredientsResult.results ?? []).map((row) => ({
    id: row.i_id,
    cocktail_id: row.cocktail_id,
    library_ingredient_id: row.library_ingredient_id,
    pour_ml: row.pour_ml,
    unit_count: row.unit_count,
    library: {
      id: row.l_id,
      trade_account_id: row.l_trade_account_id,
      name: row.l_name,
      ingredient_type: row.l_ingredient_type,
      bottle_size_ml: row.l_bottle_size_ml,
      bottle_cost_p: row.l_bottle_cost_p,
      unit_cost_p: row.l_unit_cost_p,
      notes: row.l_notes,
      created_at: row.l_created_at,
      updated_at: row.l_updated_at,
    },
  }))

  return { ...cocktail, ingredients }
}
```

- [ ] **Step 4: Update `replaceIngredients` to take library FKs**

Find `replaceIngredients`. Replace it with:

```ts
export async function replaceIngredients(
  db: D1Database,
  cocktailId: string,
  ingredients: Array<{
    library_ingredient_id: string
    pour_ml: number | null
    unit_count: number | null
  }>,
): Promise<void> {
  await db.prepare(`DELETE FROM pouriq_ingredients WHERE cocktail_id = ?1`).bind(cocktailId).run()
  for (const ing of ingredients) {
    await db
      .prepare(`
        INSERT INTO pouriq_ingredients
          (cocktail_id, library_ingredient_id, pour_ml, unit_count)
        VALUES (?1, ?2, ?3, ?4)
      `)
      .bind(cocktailId, ing.library_ingredient_id, ing.pour_ml, ing.unit_count)
      .run()
  }
}
```

- [ ] **Step 5: Build check**

Run: `npm run build`

Expected: build completes. The compiler will surface any other call sites that need adjustment (server actions, components) — fix those in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/pouriq/menus.ts
git commit -m "refactor: menus.ts queries join library; replaceIngredients takes FKs"
```

---

## Task 6: Update server actions

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts`

- [ ] **Step 1: Update `CocktailInput` and `saveCocktailAction`**

Find the `CocktailInput` interface. Replace the `ingredients` field shape:

```ts
interface CocktailInput {
  name: string
  sale_price_p: number
  notes: string | null
  ingredients: Array<{
    library_ingredient_id: string
    pour_ml: number | null
    unit_count: number | null
  }>
}
```

`saveCocktailAction` body doesn't need a structural change — it passes the input through to `replaceIngredients` which now takes the new shape (Task 5). The Field Manual slug match logic stays as-is.

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: surface call sites in `CocktailForm.tsx` that pass the old shape. They'll be fixed in Task 11.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/server-actions.ts
git commit -m "refactor: saveCocktailAction takes library FKs per ingredient"
```

---

## Task 7: IngredientForm component

**Files:**
- Create: `src/components/pouriq/IngredientForm.tsx`

- [ ] **Step 1: Write the form component**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction, deleteLibraryEntryAction } from '@/lib/pouriq/server-actions'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]

const inputClass = 'w-full px-4 py-3 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 placeholder-parchment-400 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 focus:outline-none transition-colors duration-200'
const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'
const chipClass = 'px-3 py-2 rounded-lg border text-sm transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface Props {
  entry: IngredientLibraryRow | null
  usageCount?: number
}

export function IngredientForm({ entry, usageCount = 0 }: Props) {
  const router = useRouter()
  const [name, setName] = useState(entry?.name ?? '')
  const [ingredient_type, setIngredientType] = useState<IngredientType>(entry?.ingredient_type ?? 'spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined ? 'unit' : 'bottle'
  )
  const [bottle_size_ml, setBottleSize] = useState(entry?.bottle_size_ml?.toString() ?? '')
  const [bottle_cost_pounds, setBottleCostPounds] = useState(
    entry?.bottle_cost_p !== null && entry?.bottle_cost_p !== undefined
      ? (entry.bottle_cost_p / 100).toFixed(2) : ''
  )
  const [unit_cost_pounds, setUnitCostPounds] = useState(
    entry?.unit_cost_p !== null && entry?.unit_cost_p !== undefined
      ? (entry.unit_cost_p / 100).toFixed(2) : ''
  )
  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Name is required'); return }

    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) {
        setError('Bottle size must be a positive number'); return
      }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) {
        setError('Bottle cost must be a non-negative number'); return
      }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) {
        setError('Unit cost must be a non-negative number'); return
      }
    }

    setSubmitting(true)
    try {
      await saveLibraryEntryAction(entry?.id ?? null, {
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: bottle_size_ml_n,
        bottle_cost_p,
        unit_cost_p,
        notes: notes.trim() || null,
      })
      router.push('/trade/pouriq/library')
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!entry) return
    if (usageCount > 0) return
    if (!confirm(`Delete "${entry.name}"? This cannot be undone.`)) return
    await deleteLibraryEntryAction(entry.id)
    router.push('/trade/pouriq/library')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className={labelClass}>Name *</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Tito's Vodka" />
      </div>

      <div>
        <label htmlFor="ingredient_type" className={labelClass}>Type *</label>
        <select id="ingredient_type" value={ingredient_type} onChange={(e) => setIngredientType(e.target.value as IngredientType)} className={inputClass}>
          {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Pricing mode *</label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setPricingMode('bottle')} className={`${chipClass} ${pricing_mode === 'bottle' ? chipActive : chipIdle}`}>
            Per bottle
          </button>
          <button type="button" onClick={() => setPricingMode('unit')} className={`${chipClass} ${pricing_mode === 'unit' ? chipActive : chipIdle}`}>
            Per unit
          </button>
        </div>
      </div>

      {pricing_mode === 'bottle' ? (
        <>
          <div>
            <label htmlFor="bottle_size_ml" className={labelClass}>Bottle size (ml) *</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {COMMON_BOTTLE_SIZES.map((s) => (
                <button type="button" key={s} onClick={() => setBottleSize(String(s))} className={`${chipClass} ${bottle_size_ml === String(s) ? chipActive : chipIdle}`}>
                  {s}ml
                </button>
              ))}
            </div>
            <input id="bottle_size_ml" type="number" step="1" min={0} value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass} placeholder="700" />
          </div>
          <div>
            <label htmlFor="bottle_cost_pounds" className={labelClass}>Bottle cost (£) *</label>
            <input id="bottle_cost_pounds" type="number" step="0.01" min={0} value={bottle_cost_pounds} onChange={(e) => setBottleCostPounds(e.target.value)} className={inputClass} placeholder="25.00" />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="unit_cost_pounds" className={labelClass}>Unit cost (£) *</label>
          <input id="unit_cost_pounds" type="number" step="0.01" min={0} value={unit_cost_pounds} onChange={(e) => setUnitCostPounds(e.target.value)} className={inputClass} placeholder="1.00" />
          <p className="text-xs text-parchment-400 mt-2">e.g., the cost of one whole lime, one bunch of mint, one jar of cherries.</p>
        </div>
      )}

      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} placeholder="Optional — supplier, SKU, anything useful" />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-between items-center">
        {entry ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={usageCount > 0}
            title={usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'}. Remove from those first.` : undefined}
            className="text-sm text-red-300 hover:text-red-200 underline disabled:text-parchment-500 disabled:no-underline disabled:cursor-not-allowed"
          >
            {usageCount > 0 ? `Used in ${usageCount} drink${usageCount === 1 ? '' : 's'} — can't delete` : 'Delete ingredient'}
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : entry ? 'Save changes' : 'Add ingredient'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/IngredientForm.tsx
git commit -m "feat: IngredientForm component (create + edit)"
```

---

## Task 8: Add library server actions

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts`

- [ ] **Step 1: Add `saveLibraryEntryAction` and `deleteLibraryEntryAction`**

Append these to `src/lib/pouriq/server-actions.ts`. The IngredientForm component (Task 7) already imports them.

```ts
import {
  insertLibraryEntry,
  updateLibraryEntry,
  deleteLibraryEntry,
  getLibraryEntry,
  getLibraryUsageCounts,
} from './ingredient-library'

interface LibraryEntryInput {
  name: string
  ingredient_type: import('./types').IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  notes: string | null
}

export async function saveLibraryEntryAction(
  entryId: string | null,
  input: LibraryEntryInput,
): Promise<{ entryId: string }> {
  const { db, tradeAccountId } = await requireDb()
  if (entryId === null) {
    const id = await insertLibraryEntry(db, { ...input, trade_account_id: tradeAccountId })
    revalidatePath('/trade/pouriq/library')
    return { entryId: id }
  }
  // Verify ownership before update
  const existing = await getLibraryEntry(db, entryId, tradeAccountId)
  if (!existing) throw new Error('Ingredient not found')
  await updateLibraryEntry(db, entryId, tradeAccountId, input)
  revalidatePath('/trade/pouriq/library')
  revalidatePath(`/trade/pouriq/library/${entryId}/edit`)
  return { entryId }
}

export async function deleteLibraryEntryAction(entryId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Block delete if in use — match the UI guard
  const usage = await getLibraryUsageCounts(db, tradeAccountId)
  if ((usage.get(entryId) ?? 0) > 0) {
    throw new Error('Cannot delete: ingredient is used in one or more drinks')
  }
  // Verify ownership before delete
  const existing = await getLibraryEntry(db, entryId, tradeAccountId)
  if (!existing) throw new Error('Ingredient not found')
  await deleteLibraryEntry(db, entryId, tradeAccountId)
  revalidatePath('/trade/pouriq/library')
}
```

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build completes; types resolve.

- [ ] **Step 3: Commit**

```bash
git add src/lib/pouriq/server-actions.ts
git commit -m "feat: library server actions (save + delete with usage guard)"
```

---

## Task 9: IngredientList component

**Files:**
- Create: `src/components/pouriq/IngredientList.tsx`

- [ ] **Step 1: Write the list component**

```tsx
import Link from 'next/link'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

interface Props {
  entries: IngredientLibraryRow[]
  usageCounts: Map<string, number>
}

function formatCost(entry: IngredientLibraryRow): string {
  if (entry.unit_cost_p !== null) {
    return `£${(entry.unit_cost_p / 100).toFixed(2)} / unit`
  }
  if (entry.bottle_size_ml !== null && entry.bottle_cost_p !== null) {
    return `£${(entry.bottle_cost_p / 100).toFixed(2)} / ${entry.bottle_size_ml}ml`
  }
  return '—'
}

export function IngredientList({ entries, usageCounts }: Props) {
  if (entries.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
        <p className="text-parchment-300 mb-2">No ingredients yet.</p>
        <p className="text-parchment-400 text-sm">
          Add your first ingredient to begin building your library, or import a menu to populate automatically.
        </p>
      </div>
    )
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map((entry) => {
        const count = usageCounts.get(entry.id) ?? 0
        return (
          <Link
            key={entry.id}
            href={`/trade/pouriq/library/${entry.id}/edit`}
            className="block bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-5 border border-gold-500/20 hover:border-gold-400/40 transition-colors"
          >
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="text-base font-serif font-bold text-white truncate">{entry.name}</h3>
              <span className="text-xs uppercase tracking-widest text-parchment-400 shrink-0">{entry.ingredient_type}</span>
            </div>
            <p className="text-parchment-200 text-sm">{formatCost(entry)}</p>
            <p className="text-parchment-500 text-xs mt-2">
              {count === 0 ? 'Not used yet' : `Used in ${count} drink${count === 1 ? '' : 's'}`}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/IngredientList.tsx
git commit -m "feat: IngredientList component for library listing"
```

---

## Task 10: Library pages (list, new, edit)

**Files:**
- Create: `src/app/trade/pouriq/library/page.tsx`
- Create: `src/app/trade/pouriq/library/new/page.tsx`
- Create: `src/app/trade/pouriq/library/[id]/edit/page.tsx`

- [ ] **Step 1: Write `src/app/trade/pouriq/library/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries, getLibraryUsageCounts } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientList } from '@/components/pouriq/IngredientList'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [entries, usageCounts] = await Promise.all([
    listLibraryEntries(db, access.tradeAccountId),
    getLibraryUsageCounts(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Ingredient library</h1>
            <p className="text-parchment-400 text-sm mt-2">{entries.length} ingredient{entries.length === 1 ? '' : 's'}</p>
          </div>
          <Link href="/trade/pouriq/library/new" className="inline-flex items-center px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm">
            Add ingredient
          </Link>
        </div>

        <IngredientList entries={entries} usageCounts={usageCounts} />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Write `src/app/trade/pouriq/library/new/page.tsx`**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'

export const dynamic = 'force-dynamic'

export default async function NewLibraryEntryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-3 mb-8">Add an ingredient</h1>
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <IngredientForm entry={null} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Write `src/app/trade/pouriq/library/[id]/edit/page.tsx`**

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  getLibraryEntry,
  getLibraryEntryUsage,
} from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditLibraryEntryPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const entry = await getLibraryEntry(db, id, access.tradeAccountId)
  if (!entry) notFound()

  const usage = await getLibraryEntryUsage(db, id)

  // Group usage by menu for the "Used in" section
  const byMenu = new Map<string, { menuName: string; cocktails: Array<{ id: string; name: string }> }>()
  for (const u of usage) {
    if (!byMenu.has(u.menu_id)) byMenu.set(u.menu_id, { menuName: u.menu_name, cocktails: [] })
    byMenu.get(u.menu_id)!.cocktails.push({ id: u.cocktail_id, name: u.cocktail_name })
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-3 mb-8">{entry.name}</h1>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
          <IngredientForm entry={entry} usageCount={usage.length} />
        </div>

        {byMenu.size > 0 && (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <h2 className="text-lg font-serif font-bold text-white mb-4">Used in</h2>
            <div className="space-y-4">
              {Array.from(byMenu.entries()).map(([menuId, info]) => (
                <div key={menuId}>
                  <Link href={`/trade/pouriq/${menuId}`} className="text-sm font-medium text-gold-300 hover:text-gold-200 underline">
                    {info.menuName}
                  </Link>
                  <ul className="mt-1 text-sm text-parchment-300 list-inside list-disc">
                    {info.cocktails.map((c) => (
                      <li key={c.id}>
                        <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${c.id}`} className="hover:text-parchment-100 underline">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Build check**

Run: `npm run build`

Expected: routes `/trade/pouriq/library`, `/trade/pouriq/library/new`, `/trade/pouriq/library/[id]/edit` appear in route table.

- [ ] **Step 5: Commit**

```bash
git add src/app/trade/pouriq/library/
git commit -m "feat: library pages (list, new, edit with usage)"
```

---

## Task 11: IngredientPicker combobox

**Files:**
- Create: `src/components/pouriq/IngredientPicker.tsx`

- [ ] **Step 1: Write the picker**

The picker is a combobox that filters the tenant's library by typed text and lets the user pick an entry or open an inline "create new" form. It uses native HTML elements + Tailwind — no headless-ui dependency.

```tsx
'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'
import { saveLibraryEntryAction } from '@/lib/pouriq/server-actions'

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']
const COMMON_BOTTLE_SIZES = [500, 700, 750, 1000]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'

interface Props {
  libraryEntries: IngredientLibraryRow[]
  selectedEntryId: string | null
  onChange: (entry: IngredientLibraryRow) => void
}

export function IngredientPicker({ libraryEntries, selectedEntryId, onChange }: Props) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  // Inline-create form state
  const [name, setName] = useState('')
  const [ingredient_type, setIngredientType] = useState<IngredientType>('spirit')
  const [pricing_mode, setPricingMode] = useState<'bottle' | 'unit'>('bottle')
  const [bottle_size_ml, setBottleSize] = useState('700')
  const [bottle_cost_pounds, setBottleCostPounds] = useState('')
  const [unit_cost_pounds, setUnitCostPounds] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const selectedEntry = libraryEntries.find((e) => e.id === selectedEntryId) ?? null

  const matches = useMemo(() => {
    if (!query.trim()) return libraryEntries.slice(0, 20)
    const q = query.toLowerCase()
    return libraryEntries
      .filter((e) => e.name.toLowerCase().includes(q))
      .slice(0, 20)
  }, [libraryEntries, query])

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current?.parentElement?.contains(e.target as Node)) return
      setOpen(false)
      setShowCreate(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function selectEntry(entry: IngredientLibraryRow) {
    onChange(entry)
    setQuery('')
    setOpen(false)
    setShowCreate(false)
  }

  async function handleCreate() {
    setCreateError(null)
    if (!name.trim()) { setCreateError('Name required'); return }
    let bottle_size_ml_n: number | null = null
    let bottle_cost_p: number | null = null
    let unit_cost_p: number | null = null
    if (pricing_mode === 'bottle') {
      bottle_size_ml_n = parseFloat(bottle_size_ml)
      bottle_cost_p = Math.round(parseFloat(bottle_cost_pounds) * 100)
      if (!Number.isFinite(bottle_size_ml_n) || bottle_size_ml_n <= 0) { setCreateError('Bottle size invalid'); return }
      if (!Number.isFinite(bottle_cost_p) || bottle_cost_p < 0) { setCreateError('Bottle cost invalid'); return }
    } else {
      unit_cost_p = Math.round(parseFloat(unit_cost_pounds) * 100)
      if (!Number.isFinite(unit_cost_p) || unit_cost_p < 0) { setCreateError('Unit cost invalid'); return }
    }
    setCreating(true)
    try {
      const result = await saveLibraryEntryAction(null, {
        name: name.trim(), ingredient_type,
        bottle_size_ml: bottle_size_ml_n, bottle_cost_p, unit_cost_p,
        notes: null,
      })
      // Build the new entry shape for the parent. Full row would require a refetch;
      // synthesise enough for the parent to render and recalc.
      const newEntry: IngredientLibraryRow = {
        id: result.entryId,
        trade_account_id: '',
        name: name.trim(),
        ingredient_type,
        bottle_size_ml: bottle_size_ml_n,
        bottle_cost_p,
        unit_cost_p,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      // Append to local library copy so it appears in the dropdown for the next pick.
      libraryEntries.push(newEntry)
      selectEntry(newEntry)
      // Reset form
      setName(''); setBottleCostPounds(''); setUnitCostPounds(''); setShowCreate(false)
    } catch (e) {
      setCreateError((e as Error).message || 'Could not create')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={open || showCreate ? query : (selectedEntry?.name ?? '')}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        placeholder={selectedEntry ? selectedEntry.name : 'Pick an ingredient…'}
        className={inputClass}
      />
      {open && !showCreate && (
        <div className="absolute z-10 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-jerry-green-800 border border-gold-500/30 rounded-lg shadow-lg">
          {matches.length === 0 && (
            <p className="px-3 py-2 text-sm text-parchment-400">No matches in your library.</p>
          )}
          {matches.map((entry) => (
            <button
              type="button"
              key={entry.id}
              onClick={() => selectEntry(entry)}
              className="block w-full text-left px-3 py-2 text-sm text-parchment-100 hover:bg-jerry-green-700"
            >
              <span className="font-medium">{entry.name}</span>
              <span className="text-xs text-parchment-400 ml-2">{entry.ingredient_type}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setShowCreate(true); setName(query) }}
            className="block w-full text-left px-3 py-2 text-sm text-gold-300 hover:bg-jerry-green-700 border-t border-gold-500/20"
          >
            + Create new ingredient{query.trim() ? `: "${query.trim()}"` : ''}
          </button>
        </div>
      )}

      {showCreate && (
        <div className="absolute z-10 left-0 right-0 mt-1 p-4 bg-jerry-green-800 border border-gold-500/30 rounded-lg shadow-lg space-y-3">
          <div>
            <label className={labelClass}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="e.g. Tito's Vodka" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type</label>
              <select value={ingredient_type} onChange={(e) => setIngredientType(e.target.value as IngredientType)} className={inputClass}>
                {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pricing</label>
              <select value={pricing_mode} onChange={(e) => setPricingMode(e.target.value as 'bottle' | 'unit')} className={inputClass}>
                <option value="bottle">Per bottle</option>
                <option value="unit">Per unit</option>
              </select>
            </div>
          </div>
          {pricing_mode === 'bottle' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Size (ml)</label>
                <select value={bottle_size_ml} onChange={(e) => setBottleSize(e.target.value)} className={inputClass}>
                  {COMMON_BOTTLE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Cost (£)</label>
                <input type="number" step="0.01" min={0} value={bottle_cost_pounds} onChange={(e) => setBottleCostPounds(e.target.value)} className={inputClass} placeholder="25.00" />
              </div>
            </div>
          ) : (
            <div>
              <label className={labelClass}>Unit cost (£)</label>
              <input type="number" step="0.01" min={0} value={unit_cost_pounds} onChange={(e) => setUnitCostPounds(e.target.value)} className={inputClass} placeholder="1.00" />
            </div>
          )}
          {createError && <p role="alert" className="text-xs text-red-300">{createError}</p>}
          <div className="flex justify-between items-center">
            <button type="button" onClick={() => setShowCreate(false)} className="text-xs text-parchment-400 hover:text-parchment-200">Cancel</button>
            <button type="button" onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded text-sm disabled:opacity-50">
              {creating ? 'Adding…' : 'Add to library'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pouriq/IngredientPicker.tsx
git commit -m "feat: IngredientPicker combobox with inline create"
```

---

## Task 12: Refactor CocktailForm to use the picker

**Files:**
- Modify: `src/components/pouriq/CocktailForm.tsx`

- [ ] **Step 1: Refactor CocktailForm**

This is the big component change. Open `src/components/pouriq/CocktailForm.tsx`. The component currently has free-form name/type/pricing/cost inputs per ingredient row. Replace with the IngredientPicker, leaving only the pour_ml or unit_count for the user to set per cocktail.

Replace the entire file with:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCocktailAction, deleteCocktailAction } from '@/lib/pouriq/server-actions'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import type { CocktailWithIngredients, IngredientLibraryRow } from '@/lib/pouriq/types'

const POUR_CHIPS = [15, 25, 35, 50, 75, 100]
const UNIT_CHIPS: Array<{ label: string; value: number }> = [
  { label: '1/8', value: 0.125 },
  { label: '1/4', value: 0.25 },
  { label: '1/2', value: 0.5 },
  { label: '1', value: 1 },
]

const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded-lg text-parchment-50 text-sm placeholder-parchment-400 focus:border-gold-400 focus:outline-none'
const labelClass = 'block text-xs font-medium text-parchment-300 mb-1'
const chipClass = 'px-2 py-1 rounded border text-xs transition-colors'
const chipActive = 'bg-gold-500/20 border-gold-400 text-gold-100'
const chipIdle = 'bg-jerry-green-700/30 border-gold-500/20 text-parchment-300 hover:border-gold-400/40'

interface FormIngredient {
  library_entry: IngredientLibraryRow | null
  pour_ml: string
  unit_count: string
}

function ingredientRowToForm(row: CocktailWithIngredients['ingredients'][0]): FormIngredient {
  return {
    library_entry: row.library,
    pour_ml: row.pour_ml?.toString() ?? '',
    unit_count: row.unit_count?.toString() ?? '',
  }
}

function blankIngredient(): FormIngredient {
  return { library_entry: null, pour_ml: '', unit_count: '' }
}

function isUnitPriced(entry: IngredientLibraryRow | null): boolean {
  return entry !== null && entry.unit_cost_p !== null
}

interface Props {
  menuId: string
  cocktail: CocktailWithIngredients | null
  libraryEntries: IngredientLibraryRow[]
}

export function CocktailForm({ menuId, cocktail, libraryEntries }: Props) {
  const router = useRouter()
  const [name, setName] = useState(cocktail?.name ?? '')
  const [salePricePounds, setSalePricePounds] = useState(
    cocktail ? (cocktail.sale_price_p / 100).toFixed(2) : ''
  )
  const [notes, setNotes] = useState(cocktail?.notes ?? '')
  const [ingredients, setIngredients] = useState<FormIngredient[]>(
    cocktail?.ingredients.length
      ? cocktail.ingredients.map(ingredientRowToForm)
      : [blankIngredient()]
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateIngredient(idx: number, patch: Partial<FormIngredient>) {
    setIngredients((arr) => arr.map((ing, i) => i === idx ? { ...ing, ...patch } : ing))
  }

  function addIngredient() {
    setIngredients((arr) => [...arr, blankIngredient()])
  }

  function removeIngredient(idx: number) {
    setIngredients((arr) => arr.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const sale_price_p = Math.round(Number(salePricePounds) * 100)
    if (!name.trim()) { setError('Drink name is required'); return }
    if (!Number.isFinite(sale_price_p) || sale_price_p <= 0) { setError('Sale price must be > 0'); return }

    const parsed: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null }> = []
    for (let idx = 0; idx < ingredients.length; idx++) {
      const ing = ingredients[idx]
      if (!ing.library_entry) {
        setError(`Ingredient ${idx + 1}: pick an ingredient or remove the row`)
        return
      }
      if (isUnitPriced(ing.library_entry)) {
        const count = parseFloat(ing.unit_count)
        if (!Number.isFinite(count) || count <= 0) {
          setError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): unit count must be > 0`)
          return
        }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: null, unit_count: count })
      } else {
        const pour = parseFloat(ing.pour_ml)
        if (!Number.isFinite(pour) || pour <= 0) {
          setError(`Ingredient ${idx + 1} ("${ing.library_entry.name}"): pour must be > 0 ml`)
          return
        }
        parsed.push({ library_ingredient_id: ing.library_entry.id, pour_ml: pour, unit_count: null })
      }
    }

    if (parsed.length === 0) { setError('Add at least one ingredient'); return }

    setSubmitting(true)
    try {
      await saveCocktailAction(menuId, cocktail?.id ?? null, {
        name: name.trim(),
        sale_price_p,
        notes: notes.trim() || null,
        ingredients: parsed,
      })
      router.push(`/trade/pouriq/${menuId}`)
      router.refresh()
    } catch (e) {
      setError((e as Error).message || 'Could not save')
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!cocktail) return
    if (!confirm(`Delete "${cocktail.name}"?`)) return
    await deleteCocktailAction(menuId, cocktail.id)
    router.push(`/trade/pouriq/${menuId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cocktail_name" className={labelClass}>Drink name *</label>
          <input id="cocktail_name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="sale_price" className={labelClass}>Sale price (£) *</label>
          <input id="sale_price" type="number" step="0.01" min={0} required value={salePricePounds} onChange={(e) => setSalePricePounds(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="border border-gold-500/20 rounded-lg p-4 bg-jerry-green-900/30">
        <h3 className="text-sm font-medium text-parchment-100 mb-4">Ingredients</h3>
        <div className="space-y-4">
          {ingredients.map((ing, idx) => {
            const unitPriced = isUnitPriced(ing.library_entry)
            return (
              <div key={idx} className="border border-gold-500/10 rounded-lg p-3 bg-jerry-green-800/30">
                <label className={labelClass}>Ingredient {idx + 1}</label>
                <IngredientPicker
                  libraryEntries={libraryEntries}
                  selectedEntryId={ing.library_entry?.id ?? null}
                  onChange={(entry) => updateIngredient(idx, {
                    library_entry: entry,
                    pour_ml: isUnitPriced(entry) ? '' : ing.pour_ml,
                    unit_count: isUnitPriced(entry) ? ing.unit_count : '',
                  })}
                />

                {ing.library_entry && (
                  <div className="mt-3">
                    {unitPriced ? (
                      <div>
                        <label className={labelClass}>How much per drink</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {UNIT_CHIPS.map((c) => (
                            <button type="button" key={c.value} onClick={() => updateIngredient(idx, { unit_count: c.value.toString() })}
                              className={`${chipClass} ${ing.unit_count === c.value.toString() ? chipActive : chipIdle}`}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <input type="number" step="0.001" min={0} value={ing.unit_count} onChange={(e) => updateIngredient(idx, { unit_count: e.target.value })} className={inputClass} placeholder="custom (e.g., 0.5 for half a lime)" />
                      </div>
                    ) : (
                      <div>
                        <label className={labelClass}>Pour (ml)</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {POUR_CHIPS.map((ml) => (
                            <button type="button" key={ml} onClick={() => updateIngredient(idx, { pour_ml: ml.toString() })}
                              className={`${chipClass} ${ing.pour_ml === ml.toString() ? chipActive : chipIdle}`}>
                              {ml}ml
                            </button>
                          ))}
                        </div>
                        <input type="number" step="0.1" min={0} value={ing.pour_ml} onChange={(e) => updateIngredient(idx, { pour_ml: e.target.value })} className={inputClass} placeholder="custom" />
                      </div>
                    )}
                  </div>
                )}

                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(idx)} className="mt-3 text-xs text-parchment-400 hover:text-red-300 underline">
                    Remove ingredient
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <button type="button" onClick={addIngredient} className="mt-4 text-sm text-gold-300 hover:text-gold-200 underline">
          Add another ingredient
        </button>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>Notes</label>
        <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={`${inputClass} resize-vertical`} />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      <div className="flex justify-between items-center">
        {cocktail ? (
          <button type="button" onClick={handleDelete} className="text-sm text-red-300 hover:text-red-200 underline">
            Delete drink
          </button>
        ) : <span />}
        <button type="submit" disabled={submitting} className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 disabled:from-gray-600 disabled:to-gray-500 text-jerry-green-900 font-semibold rounded-lg">
          {submitting ? 'Saving…' : cocktail ? 'Save changes' : 'Add drink'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Update the edit page to pass library entries to the form**

Open `src/app/trade/pouriq/[menuId]/edit/page.tsx`. Add a library fetch and pass it as a prop:

Find the existing data fetches inside `EditMenuPage`. Add a `listLibraryEntries` call alongside the menu and cocktail fetches:

```tsx
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
// ...

const [menu, cocktail, libraryEntries] = await Promise.all([
  getMenu(db, menuId, access.tradeAccountId),
  cocktailId ? getCocktail(db, cocktailId) : Promise.resolve(null),
  listLibraryEntries(db, access.tradeAccountId),
])
```

(Adjust based on the existing structure of the file — the goal is to fetch library entries and pass them to `CocktailForm` as a new prop.)

In the JSX, pass the prop:

```tsx
<CocktailForm menuId={menuId} cocktail={cocktail} libraryEntries={libraryEntries} />
```

- [ ] **Step 3: Build check**

Run: `npm run build`

Expected: build completes. If you get a TS error about the `libraryEntries` prop, you've missed the prop addition in the edit page.

- [ ] **Step 4: Commit**

```bash
git add src/components/pouriq/CocktailForm.tsx src/app/trade/pouriq/[menuId]/edit/page.tsx
git commit -m "refactor: CocktailForm uses IngredientPicker; passes library from edit page"
```

---

## Task 13: Add Library nav link to menu detail page

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`

- [ ] **Step 1: Add a "Library" link to the menu detail header**

Open `src/app/trade/pouriq/[menuId]/page.tsx`. Find the section near the top of the page (around the "← All menus" link). Add a secondary link to `/trade/pouriq/library` so the bar manager can jump between menus and library easily.

Find:

```tsx
<Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
```

Replace with:

```tsx
<div className="flex items-baseline gap-4">
  <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
  <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">Library</Link>
</div>
```

Also add the same library link on `/trade/pouriq/page.tsx` (the dashboard). Find the section with the dashboard heading and add a small "Library" link next to "New menu":

```tsx
<div className="flex items-center gap-3">
  <Link href="/trade/pouriq/library" className="text-sm text-parchment-300 hover:text-parchment-100 underline">Library</Link>
  <Link href="/trade/pouriq/new" className="inline-flex items-center px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm">
    New menu
  </Link>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/page.tsx src/app/trade/pouriq/page.tsx
git commit -m "feat: add Library nav link to menu detail and dashboard"
```

---

## Task 14: UI relabel — cocktail → drink

**Files:**
- Modify: `src/app/trade/pouriq/page.tsx`
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`
- Modify: `src/app/trade/pouriq/[menuId]/edit/page.tsx`
- Modify: `src/components/pouriq/MenuListCard.tsx`
- Modify: `src/components/pouriq/KpiCards.tsx`
- Modify: `src/components/pouriq/CocktailTable.tsx`
- Modify: `src/components/pouriq/IngredientOverlapTable.tsx`
- Modify: `src/components/pouriq/RecommendationStream.tsx`

- [ ] **Step 1: Sweep user-facing strings**

In each file, search for user-visible "cocktail" and "Cocktail" and replace with "drink" / "Drink" UNLESS the string is:
- A code identifier (variable name, type name, route segment, CSS class)
- An import path
- A comment that genuinely refers to the schema concept

Specific places to update (per file):

**`src/app/trade/pouriq/page.tsx`:**
- Empty state copy: "Create your first to begin analysis" → "Create your first menu to begin analysis"
- Page subtitle if it mentions cocktails

**`src/app/trade/pouriq/[menuId]/page.tsx`:**
- Heading "Cocktails" → "Drinks"
- "Add cocktail" button label → "Add drink"
- Empty state: "No cocktails yet" → "No drinks yet"; "Add your first to see the numbers" → unchanged
- "Add a cocktail" link in empty state → "Add a drink"

**`src/app/trade/pouriq/[menuId]/edit/page.tsx`:**
- Page title "Edit {cocktail.name}" → "Edit {cocktail.name}" (drink name itself is fine — no change)
- "Add a cocktail" heading when creating new → "Add a drink"

**`src/components/pouriq/KpiCards.tsx`:**
- "Best margin cocktail" → "Best margin drink" (if the label says cocktail)
- "Worst margin cocktail" → "Worst margin drink"
- Anywhere else: replace user-facing "cocktail" with "drink"

**`src/components/pouriq/CocktailTable.tsx`:**
- Table heading "Cocktail" → "Drink"
- The component file name stays as `CocktailTable.tsx` — internal naming

**`src/components/pouriq/IngredientOverlapTable.tsx`:**
- "Used in N cocktail(s)" → "Used in N drink(s)"
- "single-use cocktail ingredient" if it appears → "single-use ingredient" (drop the noun)

**`src/components/pouriq/MenuListCard.tsx`:**
- If any cocktail-specific copy exists, swap to drink

**`src/components/pouriq/RecommendationStream.tsx`:**
- Loading state: "Reading your menu…" — unchanged (no cocktail word)
- Any "cocktail" in CTA copy → "drink"

- [ ] **Step 2: Build check**

Run: `npm run build`

Expected: build clean, no behaviour change.

- [ ] **Step 3: Smoke-test in browser**

Run `npm run dev` and navigate the Pour IQ pages. Confirm copy reads naturally — no "cocktail" appears in user-facing text outside the actual schema-level discussion.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/pouriq src/components/pouriq
git commit -m "chore: relabel 'cocktail' to 'drink' in user-facing Pour IQ copy"
```

---

## Task 15: Update Pour IQ recommendation prompt for library context

**Files:**
- Modify: `src/lib/pouriq/prompts.ts`

- [ ] **Step 1: Update `buildUserMessage` to include library context**

The recommendation AI currently sees per-cocktail ingredient data with inline costs. With the library, costs come from the library entry; the cocktail row holds pour/unit_count. Update the user message to include the library data alongside the cocktail data so the AI can reason about ingredient overlap and waste risks correctly.

Open `src/lib/pouriq/prompts.ts`. Find `buildUserMessage`. Replace it with:

```ts
export function buildUserMessage(
  menu: MenuRow,
  metrics: MenuMetrics,
  fieldManualMatches: FieldManualMatch[],
): string {
  return JSON.stringify({
    menu: {
      name: menu.name,
      venue_type: menu.venue_type,
      city: menu.city,
      target_gp_pct: menu.target_gp_pct,
      positioning: menu.positioning,
    },
    drinks: metrics.cocktail_metrics.map((m) => {
      const fm = fieldManualMatches.find((f) => f.cocktail_id === m.cocktail_id)
      return {
        drink_id: m.cocktail_id,
        name: m.name,
        sale_price_p: m.sale_price_p,
        pour_cost_p: m.pour_cost_p,
        margin_p: m.margin_p,
        gp_pct: m.gp_pct,
        field_manual_url: fm?.field_manual_url,
      }
    }),
    ingredient_overlap: metrics.ingredient_overlap,
    waste_risks: metrics.waste_risks,
  }, null, 2)
}
```

The shape passed to the AI is essentially the same; the renaming of `cocktail_id` → `drink_id` and `cocktails` → `drinks` aligns the prompt with the new UI vocabulary. The deterministic metrics in `MenuMetrics` already account for the library-based cost calculation (Task 4), so no other change is needed.

- [ ] **Step 2: Update the system prompt's `cocktail_id` references**

Find the existing `SYSTEM_PROMPT` constant. Change references to `cocktail_id` → `drink_id` and "cocktail" → "drink" wherever they appear in user-visible parts of the prompt (the AI's output schema and copy guidance). Keep the tool name (`pouriq_recommendations`) and category enums unchanged — those are internal.

Look for and update:
- `"Reference cocktails by their cocktail_id when applicable."` → `"Reference drinks by their drink_id when applicable."`
- Any other natural-language mentions of "cocktail" in the system prompt

- [ ] **Step 3: Update the tool schema field name**

In `RECOMMEND_TOOL`, find the `cocktail_id` field in the recommendation item schema. Rename to `drink_id`:

```ts
drink_id: { type: 'string', description: 'References a drink in the menu, if applicable' },
```

- [ ] **Step 4: Update the recommend route to read the new field**

Open `src/app/api/pouriq/recommend/route.ts`. Find any reference to a recommendation's `cocktail_id` (in the SSE event emit or analysis storage). Rename to `drink_id` to match.

Also update the `Recommendation` type in `src/lib/pouriq/types.ts`:

```ts
export interface Recommendation {
  severity: RecommendationSeverity
  category: RecommendationCategory
  drink_id?: string   // was cocktail_id
  title: string
  body: string
  suggested_change?: {
    action: RecommendationAction
    from?: string
    to?: string
    impact_summary: string
  }
  field_manual_reference?: {
    url: string
    why_relevant: string
  }
}
```

- [ ] **Step 5: Update the RecommendationStream component**

`src/components/pouriq/RecommendationStream.tsx` — if any rendering references `cocktail_id`, rename to `drink_id`.

- [ ] **Step 6: Build check**

Run: `npm run build`

Expected: build clean.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pouriq/prompts.ts src/lib/pouriq/types.ts src/app/api/pouriq/recommend/route.ts src/components/pouriq/RecommendationStream.tsx
git commit -m "refactor: rename cocktail_id to drink_id in AI prompt + recommendation type"
```

---

## Task 16: Manual end-to-end verification

This is a checklist. No code, no commit (unless an issue surfaces).

**Pre-deploy:**

- [ ] All previous tasks committed cleanly
- [ ] `npx opennextjs-cloudflare build` completes without errors
- [ ] Take manual D1 backup: `npx wrangler d1 export jerry-can-spirits-db --remote --output=pre-0016-backup.sql`

**Deploy order (manual, before the PR's auto-deploy):**

1. Apply the migration to remote D1:
   ```
   npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0016_ingredient_library.sql
   ```
2. Verify on remote:
   ```
   npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT COUNT(*) AS unmigrated FROM pouriq_ingredients WHERE library_ingredient_id IS NULL;"
   npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p FROM pouriq_ingredients_library;"
   ```
   Expected: `unmigrated = 0`, library rows correspond to pre-migration unique ingredient combinations.
3. Merge the PR; Cloudflare Workers Builds deploys the new Worker code.

**Browser flow (preview deploy, then prod after merge):**

- [ ] Sign in as the pilot account (The Bank Bar & Grill PIN at `/trade/login`)
- [ ] Navigate to `/trade/pouriq/library` — list renders; pilot's existing ingredients (Rum, Cola from test menu) are present
- [ ] Click an existing entry → edit form shows correct values; "Used in" section shows the test cocktail
- [ ] Update an ingredient's cost; return to menu detail page; confirm GP recalculated correctly
- [ ] Try to delete an in-use entry → delete button is disabled with the "Used in N drinks" message
- [ ] Add a new entry from `/library/new`; verify it appears in the list
- [ ] Open the test cocktail's edit page; ingredient picker is the combobox; existing ingredients show their library names
- [ ] Type a search query in the picker → matches filter; select one → cocktail row updates
- [ ] Click "+ Create new" in the picker → inline form opens → fill it out → confirm new entry is created AND selected without leaving the cocktail form
- [ ] Save the cocktail; confirm GP recalculated correctly on menu detail
- [ ] Open Pour IQ recommendation flow; confirm it still runs end-to-end and the AI's references to drinks use the new "drink" language
- [ ] UI sweep: all user-facing copy says "drink" not "cocktail" except where it doesn't matter (e.g., a venue's own cocktail name)

**Pilot communication:**

Email The Bank Bar & Grill after merge:

> Subject: Pour IQ — new ingredient library
>
> Hi [name],
>
> Pour IQ has a new ingredient library at jerrycanspirits.co.uk/trade/pouriq/library. You can now add an ingredient once and reuse it across drinks, which makes it much faster to build out the rest of your menu. Drinks already on your menu have been migrated automatically.
>
> When you change a cost, every drink using that ingredient updates automatically — useful when a supplier price changes.
>
> Menu import (paste your menu or upload a PDF, AI extracts the drinks) is coming next, hopefully later this week.
>
> Dan

---

## Self-Review

### Spec coverage

| Spec section | Tasks |
|---|---|
| D1 schema changes (library + reshape pouriq_ingredients) | 2 |
| Backfill migration | 2 |
| Library CRUD page | 10 |
| IngredientForm (create + edit + delete with usage guard) | 7 + 8 + 10 |
| Inline create from cocktail form (IngredientPicker) | 11 + 12 |
| Cost calculation reads from library | 4 |
| Query helpers join the library | 5 |
| Server actions take library FKs | 6 + 8 |
| UI relabel cocktail → drink | 14 |
| AI prompt updated for drink/library terminology | 15 |
| Manual verification + pilot comms | 16 |

### Placeholder scan
- No "TBD" / "implement later"
- Each task contains the actual code to write
- Migration SQL is verbatim and complete

### Type consistency
- `IngredientLibraryRow`, `IngredientRow`, `IngredientWithLibrary` defined in Task 1; used consistently in Tasks 3, 4, 5, 7, 9, 11, 12
- `Recommendation.drink_id` renamed in Task 15; consumers updated in same task
- `replaceIngredients` (Task 5) takes `{ library_ingredient_id, pour_ml, unit_count }[]`; `saveCocktailAction` (Task 6) passes the same shape from `CocktailForm` (Task 12)
- `saveLibraryEntryAction` signature matches `IngredientForm` and `IngredientPicker` call sites

---

## Notes for the implementer

- The schema migration is the highest-risk single step. Run it locally first against any test data, verify, then run remote with the manual backup taken.
- The `IngredientPicker`'s inline-create has a small quirk: after creating an entry it appends to the parent's `libraryEntries` array in-place (a mutation). Acceptable in this scope because the form refreshes server-rendered data on next save. Cleaner alternative for a future iteration: hoist the library list to a context and refetch.
- `Cocktail*` type names stay in the codebase (e.g., `CocktailMetrics`, `CocktailTable`) — they're internal identifiers. Only user-facing strings change.
- The unused `unit_count` for bottle-priced rows is allowed by the schema CHECK (`pour_ml IS NOT NULL OR unit_count IS NOT NULL`). Application code never reads it for bottle-priced ingredients; leave it null.
