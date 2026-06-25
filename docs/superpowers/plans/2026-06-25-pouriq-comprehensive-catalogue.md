# Pour IQ Comprehensive Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernise the shared ingredient catalogue to the new ingredient model, seed it comprehensively for UK bars (with brand↔generic aliases incl. the Bank pilot menu), and split compound "A & B juice" import lines into their atoms.

**Architecture:** Migration `0047` (already authored + validated in-memory) rebuilds `pouriq_ingredient_catalogue` with `base_unit`/`default_pack_size`/`aliases`, seeds ~126 entries, and renames the barcode catalogue's size column. The read layer (`ingredient-catalogue.ts`, `barcode-catalogue.ts`) and the two catalogue-match consumers (extract route, `ImportPreview`) move to the new fields. A new pure `compound.ts` splits compound lines before matching.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1 (SQLite), TypeScript, Vitest (`node:sqlite` for migration tests), OpenNext.

**Spec:** `docs/superpowers/specs/2026-06-25-pouriq-comprehensive-catalogue-design.md`

**Gates (every task):** `npm run test:unit` green. Final gate before finishing: `npx opennextjs-cloudflare build`. The migration is applied to prod by Dan after merge — never run `wrangler ... apply` during the build.

---

### Task 1: Migration 0047 tests

The migration `migrations/0047_catalogue_modernise_seed.sql` is **already authored and validated in-memory** (126 rows seed; barcode column renamed; CHECKs enforced). This task only adds its test. Do not edit the migration unless a test reveals a genuine defect.

**Files:**
- Create: `tests/unit/lib/pouriq-catalogue-migration.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

function openDb(): InstanceType<typeof DatabaseSync> {
  return new DatabaseSync(':memory:')
}
function loadMigration(filename: string): string {
  return readFileSync(path.resolve(__dirname, '../../../migrations', filename), 'utf-8')
}
function stripPragmas(sql: string): string {
  return sql.split('\n').filter((l) => !l.trim().toUpperCase().startsWith('PRAGMA')).join('\n')
}
// The migration renames a column on pouriq_barcode_catalogue, so it must exist first.
function seedBarcode(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(`CREATE TABLE pouriq_barcode_catalogue (
    barcode TEXT PRIMARY KEY, name TEXT, ingredient_type TEXT,
    bottle_size_ml INTEGER, contributor_count INTEGER NOT NULL DEFAULT 1,
    verified INTEGER NOT NULL DEFAULT 0, first_contributor_account_id TEXT,
    created_at TEXT, updated_at TEXT)`)
  db.exec(`INSERT INTO pouriq_barcode_catalogue (barcode, name, ingredient_type, bottle_size_ml)
           VALUES ('5000', 'Smirnoff Red', 'spirit', 700)`)
}
function apply(db: InstanceType<typeof DatabaseSync>): void {
  db.exec(stripPragmas(loadMigration('0047_catalogue_modernise_seed.sql')))
}

describe('migration 0047 catalogue modernise + seed', () => {
  it('rebuilds the ingredient catalogue on the new model', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_ingredient_catalogue')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('base_unit')
    expect(cols).toContain('default_pack_size')
    expect(cols).toContain('aliases')
    expect(cols).not.toContain('pricing_mode')
    expect(cols).not.toContain('default_bottle_size_ml')
    db.close()
  })

  it('enforces the base_unit and ingredient_type CHECKs', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    expect(() => db.exec(`INSERT INTO pouriq_ingredient_catalogue (name,normalised_name,ingredient_type,base_unit) VALUES ('x','x','spirit','litre')`)).toThrow()
    expect(() => db.exec(`INSERT INTO pouriq_ingredient_catalogue (name,normalised_name,ingredient_type,base_unit) VALUES ('y','y','widget','ml')`)).toThrow()
    db.close()
  })

  it('seeds comprehensive coverage with correct base units', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const count = (db.prepare(`SELECT count(*) c FROM pouriq_ingredient_catalogue`).get() as { c: number }).c
    expect(count).toBeGreaterThan(100)
    const sugar = db.prepare(`SELECT base_unit FROM pouriq_ingredient_catalogue WHERE normalised_name='caster sugar'`).get() as { base_unit: string }
    expect(sugar.base_unit).toBe('g')
    const lime = db.prepare(`SELECT base_unit, default_pack_size FROM pouriq_ingredient_catalogue WHERE normalised_name='lime'`).get() as { base_unit: string; default_pack_size: number | null }
    expect(lime.base_unit).toBe('each')
    expect(lime.default_pack_size).toBeNull()
    const vodka = db.prepare(`SELECT base_unit, default_pack_size FROM pouriq_ingredient_catalogue WHERE normalised_name='vodka'`).get() as { base_unit: string; default_pack_size: number }
    expect(vodka.base_unit).toBe('ml')
    expect(vodka.default_pack_size).toBe(700)
    db.close()
  })

  it('carries a brand alias for generic matching', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const peach = db.prepare(`SELECT aliases FROM pouriq_ingredient_catalogue WHERE normalised_name='peach schnapps'`).get() as { aliases: string }
    expect(JSON.parse(peach.aliases)).toContain('archers')
    db.close()
  })

  it('renames the barcode catalogue size column, preserving rows', () => {
    const db = openDb(); seedBarcode(db); apply(db)
    const cols = (db.prepare(`SELECT name FROM pragma_table_info('pouriq_barcode_catalogue')`).all() as Array<{ name: string }>).map((c) => c.name)
    expect(cols).toContain('pack_size_ml')
    expect(cols).not.toContain('bottle_size_ml')
    const row = db.prepare(`SELECT pack_size_ml FROM pouriq_barcode_catalogue WHERE barcode='5000'`).get() as { pack_size_ml: number }
    expect(row.pack_size_ml).toBe(700)
    db.close()
  })
})
```

- [ ] **Step 2: Run the test**

Run: `npm run test:unit -- pouriq-catalogue-migration`
Expected: all 5 pass.

- [ ] **Step 3: Commit**

```bash
git add migrations/0047_catalogue_modernise_seed.sql tests/unit/lib/pouriq-catalogue-migration.test.ts
git commit -m "feat(pouriq): modernise + comprehensively seed the ingredient catalogue (migration 0047)"
```

---

### Task 2: Modernise the catalogue read/match code layer

Move the `CatalogueEntry` chain and its two consumers from the legacy `pricing_mode`/`default_pack_size_ml` to `base_unit`/`default_pack_size`.

**CRITICAL — do NOT touch the cost-ledger / invoice `pricing_mode`.** A separate, unrelated `pricing_mode` (`'bottle'|'unit'`) exists in `cost-changes.ts`, `app/api/pouriq/invoices/commit/route.ts`, `app/trade/pouriq/invoices/[id]/impact/page.tsx`, `multi-cost-impact.ts`, and `new_pricing_mode` in `InvoiceLineRow.tsx`/`InvoicePreview.tsx`. Those are the cost-change ledger and invoice-line mode — leave them entirely. Only the catalogue's fields change, which is exactly these three files: `ingredient-catalogue.ts`, `import/extract/route.ts`, `ImportPreview.tsx`.

**Files:**
- Modify: `src/lib/pouriq/ingredient-catalogue.ts`
- Modify: `src/lib/pouriq/barcode-catalogue.ts`
- Modify: `src/app/api/pouriq/import/extract/route.ts`
- Modify: `src/components/pouriq/ImportPreview.tsx`
- Test: `tests/unit/lib/pouriq-catalogue-match.test.ts` (create, or extend an existing catalogue test if present)

- [ ] **Step 1: Write the failing match test**

```ts
import { describe, it, expect } from 'vitest'
import { matchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const entries: CatalogueEntry[] = [
  { id: '1', name: 'Peach Schnapps', normalised_name: 'peach schnapps', ingredient_type: 'liqueur', base_unit: 'ml', default_pack_size: 700, aliases: ['archers'] },
  { id: '2', name: 'Irish Cream', normalised_name: 'irish cream', ingredient_type: 'liqueur', base_unit: 'ml', default_pack_size: 700, aliases: ['baileys'] },
  { id: '3', name: 'Caster Sugar', normalised_name: 'caster sugar', ingredient_type: 'food', base_unit: 'g', default_pack_size: 1000, aliases: ['sugar'] },
]

describe('matchCatalogue on the new model', () => {
  it('resolves a brand alias to its generic entry', () => {
    expect(matchCatalogue('Archers', entries)?.name).toBe('Peach Schnapps')
    expect(matchCatalogue('Baileys', entries)?.name).toBe('Irish Cream')
  })
  it('exposes base_unit on the matched entry', () => {
    expect(matchCatalogue('sugar', entries)?.base_unit).toBe('g')
  })
})
```

- [ ] **Step 2: Run it — fails to compile**

Run: `npm run test:unit -- pouriq-catalogue-match`
Expected: TYPE error — `CatalogueEntry` still has `pricing_mode`/`default_pack_size_ml`, not `base_unit`/`default_pack_size`.

- [ ] **Step 3: Update `ingredient-catalogue.ts`**

In `CatalogueEntry` (lines ~14-15) and `CatalogueRow` (lines ~25-26) replace:
```ts
  pricing_mode: 'bottle' | 'unit'
  default_pack_size_ml: number | null
```
with:
```ts
  base_unit: 'ml' | 'g' | 'each'
  default_pack_size: number | null
```
Update `listCatalogue`'s SELECT (line ~42) to:
```ts
    .prepare(`SELECT id, name, normalised_name, ingredient_type, base_unit, default_pack_size, aliases FROM pouriq_ingredient_catalogue`)
```
And the row map (lines ~49-50):
```ts
    base_unit: r.base_unit,
    default_pack_size: r.default_pack_size,
```

- [ ] **Step 4: Update `barcode-catalogue.ts`**

In `findCatalogueEntry` (line ~28) change `bottle_size_ml AS pack_size_ml` to `pack_size_ml`. In `contributeToCatalogue`'s INSERT (line ~59) change the column list `bottle_size_ml` to `pack_size_ml`. `BarcodeCatalogueEntry`/`ContributeInput` already use `pack_size_ml` — no type change.

- [ ] **Step 5: Update the extract route**

`src/app/api/pouriq/import/extract/route.ts` — the catalogue arm of the `PreviewIngredient['match']` union (line ~35) replace `pricing_mode: 'bottle' | 'unit'; default_pack_size_ml: number | null` with `base_unit: 'ml' | 'g' | 'each'; default_pack_size: number | null`. In the construction (lines ~172-173) replace:
```ts
            pricing_mode: cat.pricing_mode,
            default_pack_size_ml: cat.default_pack_size_ml,
```
with:
```ts
            base_unit: cat.base_unit,
            default_pack_size: cat.default_pack_size,
```

- [ ] **Step 6: Update `ImportPreview.tsx`**

The catalogue arm of the match union (line ~24) gets the same field swap as the extract route. In the prefill (lines ~84-94) replace:
```ts
    const m = input.match
    const isUnit = m.pricing_mode === 'unit'
    return {
      new_library: {
        name: m.name,
        ingredient_type: m.ingredient_type,
        base_unit: isUnit ? 'each' : 'ml',
        pack_size: isUnit ? 1 : (m.default_pack_size_ml ?? 700),
```
with:
```ts
    const m = input.match
    return {
      new_library: {
        name: m.name,
        ingredient_type: m.ingredient_type,
        base_unit: m.base_unit,
        pack_size: m.default_pack_size ?? (m.base_unit === 'each' ? 1 : 700),
```

- [ ] **Step 7: Run the test + typecheck the whole project**

Run: `npm run test:unit -- pouriq-catalogue-match` (expect PASS), then `npm run test:unit` (all green). If any pre-existing catalogue test built entries with `pricing_mode`, update it to the new fields. tsc errors must all be in the three catalogue files above — if tsc flags `cost-changes`/invoice/impact `pricing_mode`, you changed the wrong thing; revert that.

- [ ] **Step 8: Commit**

```bash
git add src/lib/pouriq/ingredient-catalogue.ts src/lib/pouriq/barcode-catalogue.ts src/app/api/pouriq/import/extract/route.ts src/components/pouriq/ImportPreview.tsx tests/unit/lib/pouriq-catalogue-match.test.ts
git commit -m "feat(pouriq): move the catalogue read/match layer to base_unit/default_pack_size"
```

---

### Task 3: Compound ingredient splitting

Split `"Lime & Apple juice"` into `"Lime juice"` + `"Apple juice"` before matching, even-splitting a plain-volume measurement 50/50.

**Files:**
- Create: `src/lib/pouriq/compound.ts`
- Modify: `src/app/api/pouriq/import/extract/route.ts`
- Test: `tests/unit/lib/pouriq-compound.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { splitCompoundIngredients, halfMeasure } from '@/lib/pouriq/compound'

describe('halfMeasure', () => {
  it('halves a plain volume, preserving the unit', () => {
    expect(halfMeasure('50ml')).toBe('25ml')
    expect(halfMeasure('1oz')).toBe('0.5oz')
  })
  it('returns null for non-volume measurements', () => {
    expect(halfMeasure('2 dashes')).toBeNull()
    expect(halfMeasure('wedge')).toBeNull()
    expect(halfMeasure('1 lime')).toBeNull()
  })
})

describe('splitCompoundIngredients', () => {
  it('splits a two-part compound with an even measurement', () => {
    const out = splitCompoundIngredients([{ name: 'Lime & Apple juice', raw_measurement: '50ml' }])
    expect(out).toEqual([
      { name: 'Lime juice', raw_measurement: '25ml' },
      { name: 'Apple juice', raw_measurement: '25ml' },
    ])
  })
  it('handles "and" and an uppercase noun', () => {
    const out = splitCompoundIngredients([{ name: 'Orange & Cranberry Juice', raw_measurement: '25ml' }])
    expect(out.map((i) => i.name)).toEqual(['Orange Juice', 'Cranberry Juice'])
  })
  it('keeps the original measurement on both when not a plain volume', () => {
    const out = splitCompoundIngredients([{ name: 'Lemon and Lime cordial', raw_measurement: 'dash' }])
    expect(out).toEqual([
      { name: 'Lemon cordial', raw_measurement: 'dash' },
      { name: 'Lime cordial', raw_measurement: 'dash' },
    ])
  })
  it('does not split a non-compound or a missing noun', () => {
    expect(splitCompoundIngredients([{ name: 'salt & pepper', raw_measurement: 'pinch' }])).toEqual([{ name: 'salt & pepper', raw_measurement: 'pinch' }])
    expect(splitCompoundIngredients([{ name: 'gin and tonic', raw_measurement: '50ml' }])).toEqual([{ name: 'gin and tonic', raw_measurement: '50ml' }])
    expect(splitCompoundIngredients([{ name: 'passion fruit juice', raw_measurement: '25ml' }])).toEqual([{ name: 'passion fruit juice', raw_measurement: '25ml' }])
  })
  it('leaves a 3-way list intact', () => {
    const out = splitCompoundIngredients([{ name: 'lime, lemon & orange juice', raw_measurement: '30ml' }])
    expect(out).toHaveLength(1)
  })
  it('preserves extra fields on the split atoms', () => {
    const out = splitCompoundIngredients([{ name: 'Lime & Apple juice', raw_measurement: '50ml', inferred_type: 'juice' }])
    expect(out.every((i) => i.inferred_type === 'juice')).toBe(true)
  })
})
```

- [ ] **Step 2: Run it — fails (module missing)**

Run: `npm run test:unit -- pouriq-compound`
Expected: FAIL — cannot find `@/lib/pouriq/compound`.

- [ ] **Step 3: Write `src/lib/pouriq/compound.ts`**

```ts
// Split compound ingredient lines like "Lime & Apple juice" into their atoms
// ("Lime juice" + "Apple juice") before matching, so each costs separately.
// Conservative: only fires when a recognised noun trails a two-part list
// joined by "&", "and" or "/". The measurement is even-split 50/50 when it is
// a plain volume; otherwise both atoms keep the original measurement.

const COMPOUND_NOUNS = ['juice', 'syrup', 'puree', 'purée', 'cordial', 'bitters', 'liqueur'] as const

const COMPOUND_RE = new RegExp(`^(.+?)\\s+(${COMPOUND_NOUNS.join('|')})$`, 'i')
const SEPARATOR_RE = /\s*(?:&|\band\b|\/)\s*/i

// Halve a plain volume measurement, preserving the unit. Returns null when the
// measurement is not a single numeric volume (dashes, "wedge", "top", "1 lime").
export function halfMeasure(raw: string): string | null {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(ml|cl|l|oz)$/i)
  if (!m) return null
  const half = parseFloat(m[1]) / 2
  return `${half}${m[2].toLowerCase()}`
}

export function splitCompoundIngredients<T extends { name: string; raw_measurement: string }>(
  ingredients: T[],
): T[] {
  return ingredients.flatMap((ing) => {
    const m = ing.name.trim().match(COMPOUND_RE)
    if (!m) return [ing]
    // A comma signals a 3+ item list — leave it intact rather than guess.
    if (m[1].includes(',')) return [ing]
    const noun = m[2]
    const parts = m[1].split(SEPARATOR_RE).map((p) => p.trim()).filter((p) => p.length > 0)
    if (parts.length !== 2) return [ing]
    const measure = halfMeasure(ing.raw_measurement) ?? ing.raw_measurement
    return parts.map((p) => ({ ...ing, name: `${p} ${noun}`, raw_measurement: measure }))
  })
}
```

- [ ] **Step 4: Run the test — passes**

Run: `npm run test:unit -- pouriq-compound`
Expected: all pass.

- [ ] **Step 5: Wire into the extract route**

`src/app/api/pouriq/import/extract/route.ts` — add the import near the other `@/lib/pouriq` imports:
```ts
import { splitCompoundIngredients } from '@/lib/pouriq/compound'
```
Change the ingredients map (line ~156) from:
```ts
    ingredients: d.ingredients.map((i): PreviewIngredient => {
```
to:
```ts
    ingredients: splitCompoundIngredients(d.ingredients).map((i): PreviewIngredient => {
```

- [ ] **Step 6: Run the full suite**

Run: `npm run test:unit`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add src/lib/pouriq/compound.ts src/app/api/pouriq/import/extract/route.ts tests/unit/lib/pouriq-compound.test.ts
git commit -m "feat(pouriq): split compound 'A & B juice' import lines before matching"
```

---

## Final gate (after all tasks)

- [ ] `npm run test:unit` — all green.
- [ ] `npx opennextjs-cloudflare build` — completes (the strongest gate; catches OpenNext/type issues).
- [ ] Then finish the branch (PR). PR body must note: apply migration `0047` to prod after merge (rebuilds the curated, no-FK ingredient catalogue + renames the barcode size column; low risk); costing/variance/stock untouched.
