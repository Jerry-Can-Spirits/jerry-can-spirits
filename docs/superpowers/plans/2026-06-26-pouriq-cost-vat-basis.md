# Pour IQ — Cost-side VAT basis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users mark a purchase price as inc or ex VAT, and store cost net of VAT so GP compares net cost to net sale consistently.

**Architecture:** One invariant — `pouriq_ingredients_library.price_p` is always net of VAT. Conversion happens once at each entry boundary (library form, invoice commit) via a single pure helper. `calculations.ts` GP logic is otherwise untouched. The exact figure the user typed is also stored (`price_entered_p`) for penny-exact re-edit and audit, with a basis flag (`price_includes_vat`).

**Tech Stack:** Next.js 15 (App Router), TypeScript, Cloudflare D1 (SQLite), Vitest for unit tests, Tailwind.

**Spec:** `docs/superpowers/specs/2026-06-26-pouriq-cost-vat-basis-design.md`

**Branch:** `feat/pouriq-cost-vat-basis` (off `origin/main`). Rebase onto main after PRs #826/#827 merge so the migration sequence stays 0051→0054.

---

## File structure

- `src/lib/pouriq/calculations.ts` — add pure `netPriceP(enteredP, includesVat)` helper (single conversion source).
- `tests/unit/lib/pouriq-vat-basis.test.ts` — unit test for the helper (new).
- `migrations/0054_library_price_vat_basis.sql` — add two columns + backfill (new).
- `src/lib/pouriq/types.ts` — extend `IngredientLibraryRow`.
- `src/lib/pouriq/ingredient-library.ts` — extend insert type, SELECT, row mapper, insert/update.
- `src/lib/pouriq/server-actions.ts` — prepared path sets the new columns to safe defaults.
- `src/components/pouriq/IngredientForm.tsx` — inc/ex toggle, net conversion, penny-exact display.
- `src/app/api/pouriq/invoices/commit/route.ts` — per-invoice basis, conversion on insert+update, cider/AF enum fix.
- `src/components/pouriq/InvoicePreview.tsx` — per-invoice inc/ex toggle, send in commit body.
- `src/components/pouriq/InvoiceLineRow.tsx` — net-vs-net delta when inc.

---

## Task 1: Pure net-price helper

**Files:**
- Modify: `src/lib/pouriq/calculations.ts` (add export near `netSalePrice`, ~line 51-54)
- Test: `tests/unit/lib/pouriq-vat-basis.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/pouriq-vat-basis.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { netPriceP } from '@/lib/pouriq/calculations'

describe('netPriceP', () => {
  it('passes ex-VAT prices through unchanged', () => {
    expect(netPriceP(1440, false)).toBe(1440)
    expect(netPriceP(0, false)).toBe(0)
  })

  it('divides inc-VAT prices by 1.20 and rounds to whole pence', () => {
    expect(netPriceP(1440, true)).toBe(1200) // £14.40 inc -> £12.00 net
    expect(netPriceP(1200, true)).toBe(1000) // £12.00 inc -> £10.00 net
    expect(netPriceP(999, true)).toBe(833)   // round(832.5)
    expect(netPriceP(0, true)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- pouriq-vat-basis`
Expected: FAIL — `netPriceP is not a function` / no export.

- [ ] **Step 3: Add the helper**

In `src/lib/pouriq/calculations.ts`, immediately after the `netSalePrice` function (which ends at line 54), add:

```ts
// VAT basis conversion for purchase prices. A price entered inc-VAT is divided
// by VAT_DIVISOR to the net price we store; an ex-VAT price is already net.
// Whole pence. Single source of truth for the library form and invoice import.
export function netPriceP(enteredP: number, includesVat: boolean): number {
  if (!includesVat) return enteredP
  return Math.round(enteredP / VAT_DIVISOR)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- pouriq-vat-basis`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/calculations.ts tests/unit/lib/pouriq-vat-basis.test.ts
git commit -m "feat(pouriq): add netPriceP VAT-basis helper"
```

---

## Task 2: Migration — add VAT-basis columns

**Files:**
- Create: `migrations/0054_library_price_vat_basis.sql`
- Validation script (scratch, not committed): node:sqlite reproduction

- [ ] **Step 1: Write the migration**

Create `migrations/0054_library_price_vat_basis.sql`:

```sql
-- Cost-side VAT basis. price_p is now always stored NET of VAT; these columns
-- remember how the user entered it. See spec
-- docs/superpowers/specs/2026-06-26-pouriq-cost-vat-basis-design.md.
--   price_includes_vat: 0 = entered net/ex VAT; 1 = entered inc VAT (stored net).
--   price_entered_p:    the exact pence the user typed (gross when inc), for
--                       penny-exact re-edit and accountant-facing audit.
-- Additive; the table CHECK references only base_unit/pack_size/price_p so a
-- plain ADD COLUMN is safe. Existing rows: flag defaults 0 (behaviour unchanged)
-- and price_entered_p is backfilled to the current (net-treated) price_p.
ALTER TABLE pouriq_ingredients_library
  ADD COLUMN price_includes_vat INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pouriq_ingredients_library
  ADD COLUMN price_entered_p INTEGER;
UPDATE pouriq_ingredients_library
  SET price_entered_p = price_p WHERE price_entered_p IS NULL;
```

- [ ] **Step 2: Validate against a reproduction of the live schema**

Create a scratch file (do not commit), e.g. in the OS temp dir, `validate_0054.mjs`:

```js
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'

const db = new DatabaseSync(':memory:')
// Minimal current library schema (cols relevant to the migration).
db.exec(`
CREATE TABLE pouriq_ingredients_library (
  id TEXT PRIMARY KEY,
  trade_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  ingredient_type TEXT NOT NULL,
  base_unit TEXT NOT NULL DEFAULT 'ml',
  pack_size REAL NOT NULL DEFAULT 1,
  price_p INTEGER NOT NULL DEFAULT 0,
  purchase_qty INTEGER NOT NULL DEFAULT 1,
  yield_pct REAL NOT NULL DEFAULT 100,
  is_prepared INTEGER NOT NULL DEFAULT 0,
  CHECK (base_unit IN ('ml','g','each') AND pack_size > 0 AND price_p >= 0)
);
`)
db.prepare(`INSERT INTO pouriq_ingredients_library (id, trade_account_id, name, ingredient_type, price_p) VALUES ('a','t','Test',  'spirit', 1440)`).run()

const sql = readFileSync(new URL('file:///C:/Users/dan/.vscode/jerry-can-spirits/migrations/0054_library_price_vat_basis.sql')).toString()
db.exec(sql)

const cols = db.prepare(`PRAGMA table_info(pouriq_ingredients_library)`).all().map(c => c.name)
if (!cols.includes('price_includes_vat') || !cols.includes('price_entered_p')) throw new Error('FAIL: columns missing')
const row = db.prepare(`SELECT price_p, price_includes_vat, price_entered_p FROM pouriq_ingredients_library WHERE id='a'`).get()
if (row.price_includes_vat !== 0) throw new Error('FAIL: flag default not 0')
if (row.price_entered_p !== 1440) throw new Error('FAIL: backfill did not copy price_p')
console.log('PASS', JSON.stringify(row))
```

Run: `node <tempdir>/validate_0054.mjs`
Expected: `PASS {"price_p":1440,"price_includes_vat":0,"price_entered_p":1440}`

- [ ] **Step 3: Commit**

```bash
git add migrations/0054_library_price_vat_basis.sql
git commit -m "feat(pouriq): migration 0054 — library VAT-basis columns"
```

(Do NOT apply to prod here. It is applied after merge via `wrangler d1 migrations apply jerry-can-spirits-db --remote`, per the project rule. Local dev DB: `npx wrangler d1 migrations apply jerry-can-spirits-db --local`.)

---

## Task 3: Types + DB layer

**Files:**
- Modify: `src/lib/pouriq/types.ts:80-97` (`IngredientLibraryRow`)
- Modify: `src/lib/pouriq/ingredient-library.ts` (insert type, SELECT, mapper, insert, update)

- [ ] **Step 1: Extend the row type**

In `src/lib/pouriq/types.ts`, in `IngredientLibraryRow` (after `price_p: number` on line 87), add:

```ts
  price_includes_vat: number
  price_entered_p: number | null
```

- [ ] **Step 2: Extend the insert type**

In `src/lib/pouriq/ingredient-library.ts`, in `IngredientLibraryInsert` (after `price_p: number` on line 10), add:

```ts
  price_includes_vat?: number      // 0 = net/ex; 1 = inc (price_p already net)
  price_entered_p?: number | null  // exact entered pence (gross when inc)
```

- [ ] **Step 3: Extend SELECT + row mapper**

In the same file, update `LIBRARY_SELECT` (lines 21-25) to include the two columns:

```ts
const LIBRARY_SELECT = `
  id, trade_account_id, name, ingredient_type,
  base_unit, pack_size, price_p, price_includes_vat, price_entered_p,
  pack_format, subcategory,
  is_prepared, purchase_qty, yield_pct, barcode, notes, created_at, updated_at
`
```

And add the two fields to the `mapLibraryRow` parameter object type (after `price_p: number` on line 34):

```ts
  price_includes_vat: number
  price_entered_p: number | null
```

(`mapLibraryRow` returns `{ ...r }`, so no body change is needed.)

- [ ] **Step 4: Persist on insert**

Replace the `insertLibraryEntry` INSERT (lines 90-102) so the two columns are written:

```ts
  const result = await db
    .prepare(`
      INSERT INTO pouriq_ingredients_library
        (trade_account_id, name, ingredient_type, base_unit, pack_size, price_p, price_includes_vat, price_entered_p, purchase_qty, yield_pct, pack_format, subcategory, barcode, notes, is_prepared)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.ingredient_type,
      data.base_unit, data.pack_size > 0 ? data.pack_size : 1, data.price_p,
      data.price_includes_vat ?? 0, data.price_entered_p ?? data.price_p,
      data.purchase_qty ?? 1, data.yield_pct ?? 100,
      data.pack_format ?? null, data.subcategory ?? null,
      data.barcode, data.notes, isPrepared,
    )
    .first<{ id: string }>()
```

- [ ] **Step 5: Persist on update**

In `updateLibraryEntry`, the cost/size block (lines 138-143) currently sets `base_unit`/`pack_size`/`price_p` when any of them is present. Extend it to carry the two VAT columns whenever `price_p` is part of the patch:

```ts
  const hasCostOrSize = 'base_unit' in patch || 'pack_size' in patch || 'price_p' in patch
  if (hasCostOrSize) {
    newModelPatch['base_unit'] = patch.base_unit ?? before.base_unit
    newModelPatch['pack_size'] = patch.pack_size != null && patch.pack_size > 0 ? patch.pack_size : before.pack_size
    newModelPatch['price_p'] = patch.price_p ?? before.price_p
  }
  if ('price_includes_vat' in patch) newModelPatch['price_includes_vat'] = patch.price_includes_vat ?? 0
  if ('price_entered_p' in patch) newModelPatch['price_entered_p'] = patch.price_entered_p ?? newModelPatch['price_p'] ?? before.price_p
```

(The generic `for...of` loop below at lines 151-154 already turns `newModelPatch` into `SET` clauses, so no further change.)

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (If `tsc` is slow/unconfigured, use the IDE diagnostics on the two files instead — both must be clean.)

- [ ] **Step 7: Commit**

```bash
git add src/lib/pouriq/types.ts src/lib/pouriq/ingredient-library.ts
git commit -m "feat(pouriq): persist VAT basis on library insert/update"
```

---

## Task 4: Library save action — prepared defaults

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts:335-363`

Standard entries already pass `price_includes_vat`/`price_entered_p` through `LibraryEntryInput` (Task 3 wired insert/update). Prepared entries must pin them to safe values since their price is derived.

- [ ] **Step 1: Set prepared defaults on insert**

In `saveLibraryEntryAction`, the prepared insert branch (lines 339-346) — add the two fields alongside the existing `price_p: 0`:

```ts
      savedId = await insertLibraryEntry(db, {
        ...input,
        trade_account_id: tradeAccountId,
        is_prepared: 1,
        price_p: 0,
        price_includes_vat: 0,
        price_entered_p: 0,
        purchase_qty: 1,
        yield_pct: 100,
      })
```

- [ ] **Step 2: Set prepared defaults on update**

The prepared update branch (lines 354-360) — add:

```ts
      await updateLibraryEntry(db, entryId, tradeAccountId, {
        ...input,
        is_prepared: 1,
        price_includes_vat: 0,
        price_entered_p: 0,
        purchase_qty: 1,
        yield_pct: 100,
      })
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` (or IDE diagnostics on the file) — expect clean.

```bash
git add src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): pin VAT-basis defaults for prepared ingredients"
```

---

## Task 5: Library form — inc/ex toggle + net conversion

**Files:**
- Modify: `src/components/pouriq/IngredientForm.tsx`

- [ ] **Step 1: Import the helper**

Update the import on line 12:

```ts
import { costPerBaseUnitP, usableCostPerBaseUnitP, netPriceP } from '@/lib/pouriq/calculations'
```

- [ ] **Step 2: Seed price + basis state from the entered figure**

Replace the `price_str` initialiser (lines 97-99) and add a basis state right after:

```ts
  const [price_str, setPriceStr] = useState(() => {
    if (!entry || entry.is_prepared) return ''
    const entered = entry.price_entered_p ?? entry.price_p
    return entered > 0 ? (entered / 100).toFixed(2) : ''
  })
  const [priceIncludesVat, setPriceIncludesVat] = useState<boolean>(
    entry ? entry.price_includes_vat === 1 : true,
  )
```

- [ ] **Step 3: Derive entered + net pence**

Replace the `price_p_live` memo (lines 146-149) with an entered figure and a derived net figure:

```ts
  const entered_p_live = useMemo(() => {
    const n = Math.round(parseFloat(price_str) * 100)
    return Number.isFinite(n) ? n : null
  }, [price_str])

  const price_p_live = useMemo(() => {
    return entered_p_live === null ? null : netPriceP(entered_p_live, priceIncludesVat)
  }, [entered_p_live, priceIncludesVat])
```

(`price_p_live` is now the NET figure, so every existing consumer — `costReadout`, `projection` — keeps working and shows net cost.)

- [ ] **Step 4: Add the toggle + net read-back under the price field**

In the standard-mode price block, replace the existing helper line (post-#827 it reads `<FieldHelper>The total you pay your supplier, including VAT if applicable. Enter every ingredient on the same VAT basis (inc or ex VAT), or your pour costs will not be comparable.</FieldHelper>`, around line 588) with the toggle and an updated helper:

```tsx
              <div className="mt-2 inline-flex items-stretch rounded-lg border border-gold-500/30 overflow-hidden bg-jerry-green-800/40">
                <button
                  type="button"
                  onClick={() => setPriceIncludesVat(true)}
                  aria-pressed={priceIncludesVat}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${priceIncludesVat ? 'bg-gold-500/30 text-gold-50' : 'text-parchment-300 hover:text-parchment-100'}`}
                >
                  Inc VAT
                </button>
                <span aria-hidden="true" className="w-px bg-gold-500/30" />
                <button
                  type="button"
                  onClick={() => setPriceIncludesVat(false)}
                  aria-pressed={!priceIncludesVat}
                  className={`px-3 py-1.5 text-xs font-semibold transition-colors ${!priceIncludesVat ? 'bg-gold-500/30 text-gold-50' : 'text-parchment-300 hover:text-parchment-100'}`}
                >
                  Ex VAT
                </button>
              </div>
              <FieldHelper>
                {priceIncludesVat
                  ? 'The total you pay your supplier including VAT. We store it net (÷ 1.2) so cost matches your net sale prices.'
                  : 'The ex-VAT (net) price, as it appears on most trade invoice lines.'}
                {' '}Flat 20%: enter zero-rated items as Ex VAT.
              </FieldHelper>
              {priceIncludesVat && entered_p_live !== null && entered_p_live > 0 && (
                <p className="text-xs text-gold-200 mt-1 tabular-nums">Stored net: £{((price_p_live ?? 0) / 100).toFixed(2)}</p>
              )}
```

- [ ] **Step 5: Write net + entered + flag on submit**

In `buildInput`, the standard-mode branch (lines 310-340) — replace the `price_p` derivation and the returned object's price fields:

```ts
    const entered_p = Math.round(parseFloat(price_str) * 100)
    if (!Number.isFinite(entered_p) || entered_p < 0) { setError('Enter a valid price'); return null }
    const price_p = netPriceP(entered_p, priceIncludesVat)
```

and in the returned object (lines 327-340) add the two fields next to `price_p`:

```ts
    return {
      name: name.trim(),
      ingredient_type,
      base_unit,
      pack_size,
      price_p,
      price_includes_vat: priceIncludesVat ? 1 : 0,
      price_entered_p: entered_p,
      purchase_qty,
      yield_pct,
      pack_format: pack_format.trim() || null,
      subcategory: subcategory.trim() || null,
      barcode: barcode.trim() || null,
      notes: notes.trim() || null,
      is_prepared: false,
    }
```

- [ ] **Step 6: Verify in the running app**

Run the dev server (`npm run dev`), open `/trade/pouriq/library` and add an ingredient:
- Enter £14.40, Inc VAT selected → readout shows "Stored net: £12.00" and the per-ml cost reflects £12.00.
- Save, re-open the entry → price field shows exactly £14.40, toggle on Inc.
- Switch to Ex VAT, save → reopen shows the same number, toggle Ex, cost uses the entered value as net.

Also confirm IDE diagnostics on the file are clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/pouriq/IngredientForm.tsx
git commit -m "feat(pouriq): inc/ex VAT toggle on the library form"
```

---

## Task 6: Invoice commit route — per-invoice basis + cider/AF fix

**Files:**
- Modify: `src/app/api/pouriq/invoices/commit/route.ts`

- [ ] **Step 1: Fix the ingredient-type enum (separate latent bug)**

Replace `INGREDIENT_TYPES` (lines 28-30) so new cider/alcohol-free lines are accepted:

```ts
const INGREDIENT_TYPES: ReadonlyArray<IngredientType> = [
  'spirit', 'liqueur', 'wine', 'beer', 'cider', 'mixer', 'syrup', 'juice',
  'garnish', 'soft-drink', 'alcohol-free', 'food', 'other',
]
```

- [ ] **Step 2: Accept the per-invoice basis in the body**

In `CommitBody` (lines 52-58) add the field:

```ts
interface CommitBody {
  ticket: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  prices_include_vat: boolean
  lines: CommitLine[]
}
```

- [ ] **Step 3: Import the helper and derive a per-line net price**

Add to the imports at the top of the file:

```ts
import { netPriceP } from '@/lib/pouriq/calculations'
```

Inside the line loop, after `const newCostP = line.new_cost_p!` (line 218), derive the net + entered figures once:

```ts
      const includesVat = body.prices_include_vat === true
      const netCostP = netPriceP(newCostP, includesVat)
      const enteredCostP = newCostP
      const vatFlag = includesVat ? 1 : 0
```

- [ ] **Step 4: Store net + flag + entered on the new-library insert**

In the new-library insert (lines 195-205), change `price_p` to the net figure and add the two columns:

```ts
          libraryId = await insertLibraryEntry(db, {
            trade_account_id: access.tradeAccountId,
            name: line.new_library.name.trim(),
            ingredient_type: line.new_library.ingredient_type,
            base_unit: line.new_library.base_unit,
            pack_size: line.new_library.pack_size,
            purchase_qty: line.new_library.purchase_qty,
            price_p: netPriceP(line.new_library.price_p, includesVat),
            price_includes_vat: includesVat ? 1 : 0,
            price_entered_p: line.new_library.price_p,
            barcode: null,
            notes: null,
          })
```

- [ ] **Step 5: Store net + flag + entered on the existing-row UPDATE**

The cost UPDATE (lines 230-238) compares against `oldCostP` (net) and writes `newCostP`. Change it to compare/write the net figure and set the two columns:

```ts
      const shouldUpdateLibraryCost = oldCostP !== null && netCostP !== oldCostP
      if (shouldUpdateLibraryCost) {
        stmts.push(
          db.prepare(
            `UPDATE pouriq_ingredients_library SET price_p = ?1, price_includes_vat = ?2, price_entered_p = ?3, updated_at = datetime('now') WHERE id = ?4 AND trade_account_id = ?5`,
          ).bind(netCostP, vatFlag, enteredCostP, libraryId, access.tradeAccountId),
        )
        costUpdatedLibraryIds.add(libraryId)
      }
```

Then, in the `pouriq_cost_changes` INSERT immediately below (the `VALUES` bind that currently passes `newCostP` for the `new_cost_p` column, around lines 256-265), change that bound value from `newCostP` to `netCostP` so the audit ledger records the net cost consistently with the stored `price_p`. The `old_cost_p` bind stays `oldCostP` (already net).

- [ ] **Step 6: Default the basis when missing (back-compat)**

In `validateBody` (around line 72), allow the field to be absent and treat it as `false`. Add near the top of the function:

```ts
  if (body.prices_include_vat !== undefined && typeof body.prices_include_vat !== 'boolean') {
    return 'prices_include_vat must be a boolean'
  }
```

(No hard requirement — absence means ex/net, the current behaviour.)

- [ ] **Step 7: Typecheck + commit**

Run: `npx tsc --noEmit` (or IDE diagnostics) — expect clean.

```bash
git add src/app/api/pouriq/invoices/commit/route.ts
git commit -m "feat(pouriq): invoice commit applies VAT basis to cost; add cider/AF types"
```

---

## Task 7: Invoice preview UI — basis toggle + honest deltas

**Files:**
- Modify: `src/components/pouriq/InvoicePreview.tsx`
- Modify: `src/components/pouriq/InvoiceLineRow.tsx`

- [ ] **Step 1: Add basis state to the preview**

In `InvoicePreview`, after the `invoiceDate` state (line 19) add:

```ts
  const [pricesIncludeVat, setPricesIncludeVat] = useState(false)
```

- [ ] **Step 2: Send it in the commit body**

In `handleSave`, add the field to `body` (after `invoice_date` on line 160):

```ts
      invoice_date: invoiceDate.trim() || null,
      prices_include_vat: pricesIncludeVat,
```

- [ ] **Step 3: Render the toggle + update the copy**

Replace the summary-bar caption (line 246, `Net prices read from the invoice.`) with a toggle:

```tsx
          <span className="mt-1 inline-flex items-center gap-2">
            <span className="text-xs text-parchment-500">Invoice prices are</span>
            <span className="inline-flex items-stretch rounded-md border border-gold-500/30 overflow-hidden">
              <button type="button" onClick={() => setPricesIncludeVat(false)} aria-pressed={!pricesIncludeVat}
                className={`px-2 py-1 text-xs font-semibold ${!pricesIncludeVat ? 'bg-gold-500/30 text-gold-50' : 'text-parchment-300'}`}>Ex VAT</button>
              <span aria-hidden="true" className="w-px bg-gold-500/30" />
              <button type="button" onClick={() => setPricesIncludeVat(true)} aria-pressed={pricesIncludeVat}
                className={`px-2 py-1 text-xs font-semibold ${pricesIncludeVat ? 'bg-gold-500/30 text-gold-50' : 'text-parchment-300'}`}>Inc VAT</button>
            </span>
          </span>
```

- [ ] **Step 4: Pass basis to the line rows for honest deltas**

In `sectionTable` (lines 136-147), pass the new prop:

```tsx
            <InvoiceLineRow
              key={idx}
              index={idx}
              line={initial.lines[idx]}
              state={lines[idx]}
              library={library}
              libraryById={libraryById}
              pricesIncludeVat={pricesIncludeVat}
              onChange={handleChange}
              onToggleCreateNew={handleToggleCreateNew}
            />
```

- [ ] **Step 5: Use the net figure for the delta in the row**

In `src/components/pouriq/InvoiceLineRow.tsx`:

Add `netPriceP` import:

```ts
import { netPriceP } from '@/lib/pouriq/calculations'
```

Add `pricesIncludeVat: boolean` to `InvoiceLineRowProps` (after `libraryById` on line 28):

```ts
  pricesIncludeVat: boolean
```

Destructure it in the component signature (line 46) and compute the delta against the net figure (replace line 50):

```ts
function InvoiceLineRowComponent({ index, line, state, library, libraryById, pricesIncludeVat, onChange, onToggleCreateNew }: InvoiceLineRowProps) {
  const match = state.match
  const libraryId = match.kind === 'existing' ? match.library_id : null
  const currentP = currentCostFor(libraryById, libraryId)
  const netNewP = netPriceP(state.unit_price_p, pricesIncludeVat)
  const delta = currentP !== null ? netNewP - currentP : null
```

(The editable price field keeps showing the figure as typed; only the comparison uses net, so the delta vs the stored net cost stays honest.)

- [ ] **Step 6: Verify in the running app**

With `npm run dev`, scan/upload a test invoice:
- Default Ex VAT → behaviour unchanged, deltas as before.
- Flip to Inc VAT → the Δ column shifts to compare net-of-VAT; saving an applied line stores the net price (confirm on the library entry afterward: price field shows the gross you saw on the invoice, toggle Inc, cost is net).
- A line typed as a new `cider`/`alcohol-free` entry commits without the previous "invalid ingredient_type" error.

Confirm IDE diagnostics clean on both files.

- [ ] **Step 7: Commit**

```bash
git add src/components/pouriq/InvoicePreview.tsx src/components/pouriq/InvoiceLineRow.tsx
git commit -m "feat(pouriq): per-invoice inc/ex VAT toggle on import"
```

---

## Task 8: Full verification

- [ ] **Step 1: Unit tests**

Run: `npm run test:unit -- pouriq`
Expected: PASS, including `pouriq-vat-basis`.

- [ ] **Step 2: Build / typecheck**

Run: `npm run build`
Expected: completes with no type errors.

- [ ] **Step 3: Local migration apply (dev DB)**

Run: `npx wrangler d1 migrations apply jerry-can-spirits-db --local`
Expected: applies `0054` cleanly; app runs against the new schema.

- [ ] **Step 4: GP regression sanity**

In the running app, create two identical drinks; price one ingredient as Inc £14.40 and an equivalent ingredient as Ex £12.00. Confirm both yield the same pour cost and GP%.

- [ ] **Step 5: Push + PR**

```bash
git push -u origin feat/pouriq-cost-vat-basis
gh pr create --title "feat(pouriq): cost-side VAT basis (inc/ex VAT, migration 0054)" --body "<summary from the spec; note: apply 0054 after merge via migrations apply>"
```

---

## Self-review notes

- **Spec coverage:** invariant (Task 1 helper + Tasks 3/5/6 store net), schema (Task 2), types/DB (Task 3), library form default Inc + penny-exact (Task 5), import default Ex + commit conversion (Tasks 6/7), cider/AF fix (Task 6), existing rows unchanged + backfilled (Task 2), flat-20% note in helper (Task 5). Covered.
- **Migration ordering:** numbered 0054 above in-flight 0052/0053; rebase after they merge.
- **No prod apply mid-plan:** the only prod step is post-merge `migrations apply`, matching project rule and keeping `d1_migrations` in sync (the 0052 desync lesson).
- **Type consistency:** `netPriceP(enteredP, includesVat)` signature used identically in calculations.ts, IngredientForm, commit route, InvoiceLineRow. New columns named `price_includes_vat` / `price_entered_p` everywhere.
