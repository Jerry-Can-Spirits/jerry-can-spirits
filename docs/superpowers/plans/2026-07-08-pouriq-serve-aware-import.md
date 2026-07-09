# Serve-aware Import + Catalogue Autocomplete (E1 + E4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make menu import turn a product sold in multiple measures (Guinness keg → half + pint; wine bottle → 125/175/250; spirit bottle → 25/50) into ONE correctly-sized, priced-once library ingredient with each menu line carrying its own serve; and add catalogue name-autocomplete to the manual Add-ingredient form.

**Architecture:** Approach A — reuse existing serve-unit + bulk-fill machinery. The AI separates serve from product; grouping (already name-based) then merges same-product lines; a serve-aware pack default gives draught a keg; and the import commit route is fixed to persist the serve (`recipe_unit`/`recipe_qty`) it currently drops. No core-model schema change. E4 wraps the existing catalogue matcher in a search route + a combobox.

**Tech Stack:** Next.js 15 App Router (nodejs routes), Cloudflare D1, React client components, vitest, Anthropic extraction.

**Spec:** `docs/superpowers/specs/2026-07-08-pouriq-serve-aware-import-design.md` — read first.

## Global Constraints

- Branch: `feat/pouriq-serve-aware-import` (created; spec committed on it).
- TypeScript throughout; no `any` (use `unknown` + cast).
- API routes: `export const runtime = 'nodejs'`.
- UI copy: no em-dashes, no emojis, no exclamation marks.
- **No core-model schema change** — `pouriq_ingredients.recipe_unit`/`recipe_qty` already exist (migration 0044). No new migration in this plan.
- **Sale price stays 1:1 with the menu line.** Grouping is cost-side only. Never invent an unlisted serve.
- Serve token vocabulary (fixed): `25ml`(25), `50ml`(50), `half_pint`(284), `pint`(568), `125ml`(125), `175ml`(175), `250ml`(250), `glass`(200), `null`.
- Serve → pack default: draught(`half_pint`/`pint`)→`{pack_format:'keg', pack_size:50000}`; wine(`125ml`/`175ml`/`250ml`)→`{pack_format:'bottle', pack_size:750}`; spirit(`25ml`/`50ml`)→`{pack_format:'bottle', pack_size:700}`; else no override.
- **Grouping key is name-based on the serve-stripped product name** (NOT catalogue_id — the existing code comment in `import-bulk-fill.ts` documents that catalogue_id over-collapses distinct products).
- Backwards-compatible: a line with `serve: null` behaves exactly as today.
- Before pushing: `npx tsc --noEmit`, `npx eslint src tests`, `npx vitest run`, `npx next build`, `npx opennextjs-cloudflare build`.
- Commit after every task with the message given.

---

### Task 1: Serve vocabulary + pack-default helpers (pure, TDD)

**Files:**
- Create: `src/lib/pouriq/serve-map.ts`
- Test: `tests/unit/lib/pouriq-serve-map.test.ts`

**Interfaces:**
- Consumes: `ServeUnit` type from `src/lib/pouriq/measures.ts` (`{ name: string; base_per_unit: number }`).
- Produces:
  - `type ServeToken = '25ml' | '50ml' | 'half_pint' | 'pint' | '125ml' | '175ml' | '250ml' | 'glass'`
  - `SERVE_TOKEN_ML: Record<ServeToken, number>`
  - `SERVE_TOKEN_TO_UNIT_NAME: Record<ServeToken, string>` (maps a token to the standard serve-unit `name` in `STANDARD_SERVE_UNITS.ml`, e.g. `half_pint`→`'half pint'`, `250ml`→`'large glass'`, `25ml`→`'ml'` with qty 25... see note)
  - `serveToRecipeUnit(token: ServeToken): { recipe_unit: string; recipe_qty: number; pour_ml: number }`
  - `packDefaultForServe(token: ServeToken): { pack_format: string; pack_size: number } | null`
  - `isKnownServeToken(s: string): s is ServeToken`

Design note on `serveToRecipeUnit`: recipe lines store `recipe_unit` (a serve-unit name) + `recipe_qty` + `pour_ml`. Map tokens to the standard units already in `measures.ts`:
- `half_pint`→`{recipe_unit:'half pint', recipe_qty:1, pour_ml:284}`
- `pint`→`{recipe_unit:'pint', recipe_qty:1, pour_ml:568}`
- `125ml`→`{recipe_unit:'small glass', recipe_qty:1, pour_ml:125}`
- `175ml`→`{recipe_unit:'medium glass', recipe_qty:1, pour_ml:175}`
- `250ml`→`{recipe_unit:'large glass', recipe_qty:1, pour_ml:250}`
- `25ml`→`{recipe_unit:'ml', recipe_qty:25, pour_ml:25}`
- `50ml`→`{recipe_unit:'ml', recipe_qty:50, pour_ml:50}`
- `glass`→`{recipe_unit:'ml', recipe_qty:200, pour_ml:200}`

- [ ] **Step 1: Write the failing test**

`tests/unit/lib/pouriq-serve-map.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { SERVE_TOKEN_ML, serveToRecipeUnit, packDefaultForServe, isKnownServeToken } from '@/lib/pouriq/serve-map'

describe('SERVE_TOKEN_ML', () => {
  it('maps tokens to ml', () => {
    expect(SERVE_TOKEN_ML.pint).toBe(568)
    expect(SERVE_TOKEN_ML.half_pint).toBe(284)
    expect(SERVE_TOKEN_ML['175ml']).toBe(175)
    expect(SERVE_TOKEN_ML['50ml']).toBe(50)
  })
})

describe('serveToRecipeUnit', () => {
  it('maps draught to the standard pint/half units', () => {
    expect(serveToRecipeUnit('pint')).toEqual({ recipe_unit: 'pint', recipe_qty: 1, pour_ml: 568 })
    expect(serveToRecipeUnit('half_pint')).toEqual({ recipe_unit: 'half pint', recipe_qty: 1, pour_ml: 284 })
  })
  it('maps wine to glass units', () => {
    expect(serveToRecipeUnit('175ml')).toEqual({ recipe_unit: 'medium glass', recipe_qty: 1, pour_ml: 175 })
    expect(serveToRecipeUnit('250ml')).toEqual({ recipe_unit: 'large glass', recipe_qty: 1, pour_ml: 250 })
  })
  it('maps spirit measures to a raw ml pour', () => {
    expect(serveToRecipeUnit('25ml')).toEqual({ recipe_unit: 'ml', recipe_qty: 25, pour_ml: 25 })
    expect(serveToRecipeUnit('50ml')).toEqual({ recipe_unit: 'ml', recipe_qty: 50, pour_ml: 50 })
  })
})

describe('packDefaultForServe', () => {
  it('gives draught a 50L keg', () => {
    expect(packDefaultForServe('pint')).toEqual({ pack_format: 'keg', pack_size: 50000 })
    expect(packDefaultForServe('half_pint')).toEqual({ pack_format: 'keg', pack_size: 50000 })
  })
  it('gives wine a 750ml bottle', () => {
    expect(packDefaultForServe('175ml')).toEqual({ pack_format: 'bottle', pack_size: 750 })
  })
  it('gives spirit measures a 700ml bottle', () => {
    expect(packDefaultForServe('50ml')).toEqual({ pack_format: 'bottle', pack_size: 700 })
  })
  it('returns null for glass (no override)', () => {
    expect(packDefaultForServe('glass')).toBeNull()
  })
})

describe('isKnownServeToken', () => {
  it('recognises valid tokens and rejects others', () => {
    expect(isKnownServeToken('pint')).toBe(true)
    expect(isKnownServeToken('nonsense')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-serve-map.test.ts`
Expected: FAIL (cannot resolve `@/lib/pouriq/serve-map`).

- [ ] **Step 3: Write `serve-map.ts`**

```typescript
// Serve token vocabulary for menu import. The extraction returns a serve token
// per beverage line; these helpers map it to a recipe-line serve (recipe_unit +
// recipe_qty + pour_ml, reusing the standard units in measures.ts) and to a
// sensible pack default (draught -> keg, wine/spirit -> bottle).

export type ServeToken =
  | '25ml' | '50ml' | 'half_pint' | 'pint' | '125ml' | '175ml' | '250ml' | 'glass'

const KNOWN: readonly ServeToken[] = ['25ml', '50ml', 'half_pint', 'pint', '125ml', '175ml', '250ml', 'glass']

export function isKnownServeToken(s: string): s is ServeToken {
  return (KNOWN as readonly string[]).includes(s)
}

export const SERVE_TOKEN_ML: Record<ServeToken, number> = {
  '25ml': 25, '50ml': 50, half_pint: 284, pint: 568,
  '125ml': 125, '175ml': 175, '250ml': 250, glass: 200,
}

// Map each token to a recipe-line serve. Draught + wine reuse the named standard
// units (pint/half pint/small|medium|large glass) so the drink editor shows the
// same wording; spirit/glass store a raw ml pour.
const RECIPE_UNIT: Record<ServeToken, { recipe_unit: string; recipe_qty: number }> = {
  half_pint: { recipe_unit: 'half pint', recipe_qty: 1 },
  pint: { recipe_unit: 'pint', recipe_qty: 1 },
  '125ml': { recipe_unit: 'small glass', recipe_qty: 1 },
  '175ml': { recipe_unit: 'medium glass', recipe_qty: 1 },
  '250ml': { recipe_unit: 'large glass', recipe_qty: 1 },
  '25ml': { recipe_unit: 'ml', recipe_qty: 25 },
  '50ml': { recipe_unit: 'ml', recipe_qty: 50 },
  glass: { recipe_unit: 'ml', recipe_qty: 200 },
}

export function serveToRecipeUnit(token: ServeToken): { recipe_unit: string; recipe_qty: number; pour_ml: number } {
  const u = RECIPE_UNIT[token]
  return { recipe_unit: u.recipe_unit, recipe_qty: u.recipe_qty, pour_ml: SERVE_TOKEN_ML[token] }
}

export function packDefaultForServe(token: ServeToken): { pack_format: string; pack_size: number } | null {
  if (token === 'pint' || token === 'half_pint') return { pack_format: 'keg', pack_size: 50000 }
  if (token === '125ml' || token === '175ml' || token === '250ml') return { pack_format: 'bottle', pack_size: 750 }
  if (token === '25ml' || token === '50ml') return { pack_format: 'bottle', pack_size: 700 }
  return null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/pouriq-serve-map.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/serve-map.ts tests/unit/lib/pouriq-serve-map.test.ts
git commit -m "feat(pouriq): serve-token vocabulary + pack-default helpers for import"
```

---

### Task 2: Commit route persists recipe_unit/recipe_qty (the latent bug)

**Files:**
- Create: `src/lib/pouriq/import-commit-validate.ts` (extract the `CommitBody`/`CommitIngredient`/`CommitDrink` types + `validateBody` + the small `isPositive*` helpers out of the route so they're unit-testable without server-only imports)
- Modify: `src/app/api/pouriq/import/commit/route.ts` (import the types + `validateBody` from the new lib; add the two columns to the INSERT ~262-270)
- Test: `tests/unit/lib/pouriq-import-commit-validate.test.ts`

**Interfaces:**
- Consumes: `IngredientType`, `ALL_INGREDIENT_TYPES` from `@/lib/pouriq/types`.
- Produces (in `import-commit-validate.ts`): the `CommitBody`, `CommitDrink`, `CommitIngredient` interfaces (with `CommitIngredient` gaining `recipe_unit?: string | null` and `recipe_qty?: number | null`) and `export function validateBody(body: CommitBody): string | null`. The route imports these; the INSERT writes `recipe_unit`/`recipe_qty`.

Behaviour: the client already computes `recipe_unit`/`recipe_qty` via the serve picker; today the commit route's INSERT only writes `pour_ml`/`unit_count`, silently dropping the serve. Move the body types + validator to a pure lib (no `next/server` / `@opennextjs/cloudflare` imports, so vitest can load it), add the two optional columns, and write them. They are optional (null when absent) so existing paths still work; when present, a non-empty string + positive number.

- [ ] **Step 1: Extract types + validator to the lib, then add a failing test**

Move the `CommitIngredient`/`CommitDrink`/`CommitBody` interfaces, the `isPositiveInteger`/`isNonNegativeInteger`/`isPositiveNumber` helpers, and `validateBody` from the route into `src/lib/pouriq/import-commit-validate.ts`, exporting the types and `validateBody`. Add `recipe_unit?: string | null` and `recipe_qty?: number | null` to `CommitIngredient`. The route then `import { validateBody, type CommitBody } from '@/lib/pouriq/import-commit-validate'` and deletes the local copies. Then:

`tests/unit/lib/pouriq-import-commit-validate.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { validateBody } from '@/lib/pouriq/import-commit-validate'

const base = {
  menuId: 'm1',
  drinks: [{
    name: 'Guinness Pint',
    sale_price_p: 620,
    ingredients: [{
      existing_library_id: 'lib-guinness',
      pour_ml: 568,
      unit_count: null,
      recipe_unit: 'pint',
      recipe_qty: 1,
    }],
  }],
}

describe('validateBody with serve fields', () => {
  it('accepts a line carrying recipe_unit + recipe_qty', () => {
    expect(validateBody(structuredClone(base) as never)).toBeNull()
  })
  it('accepts a line with no serve fields (backwards compatible)', () => {
    const b = structuredClone(base) as never as { drinks: { ingredients: Record<string, unknown>[] }[] }
    delete b.drinks[0].ingredients[0].recipe_unit
    delete b.drinks[0].ingredients[0].recipe_qty
    expect(validateBody(b as never)).toBeNull()
  })
  it('rejects a recipe_qty that is not positive when recipe_unit is set', () => {
    const b = structuredClone(base) as never as { drinks: { ingredients: Record<string, unknown>[] }[] }
    b.drinks[0].ingredients[0].recipe_qty = 0
    expect(validateBody(b as never)).toMatch(/recipe_qty/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-import-commit-validate.test.ts`
Expected: FAIL — TypeScript error (recipe_unit/recipe_qty not on the type) or the positive-qty assertion fails (no validation yet).

- [ ] **Step 3: Add the fields, validation, and INSERT columns**

In `CommitIngredient` (in `import-commit-validate.ts`, after `unit_count: number | null`):
```typescript
  recipe_unit?: string | null
  recipe_qty?: number | null
```

In `validateBody` (now in `import-commit-validate.ts`), inside the per-ingredient loop after the pour/count check, add:
```typescript
      const hasServeUnit = ing.recipe_unit !== undefined && ing.recipe_unit !== null
      const hasServeQty = ing.recipe_qty !== undefined && ing.recipe_qty !== null
      if (hasServeUnit !== hasServeQty) return `${tag}: recipe_unit and recipe_qty must be set together`
      if (hasServeUnit) {
        if (typeof ing.recipe_unit !== 'string' || !ing.recipe_unit.trim()) return `${tag}: recipe_unit must be a non-empty string`
        if (!isPositiveNumber(ing.recipe_qty)) return `${tag}: recipe_qty must be > 0`
      }
```

Change the recipe-line INSERT (~262-270) to:
```typescript
        statements.push(
          db
            .prepare(`
              INSERT INTO pouriq_ingredients
                (cocktail_id, library_ingredient_id, pour_ml, unit_count, recipe_unit, recipe_qty)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            `)
            .bind(cocktailId, libraryId, ing.pour_ml, ing.unit_count, ing.recipe_unit ?? null, ing.recipe_qty ?? null),
        )
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/pouriq-import-commit-validate.test.ts`
Expected: PASS. Then `npx tsc --noEmit` clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/import-commit-validate.ts src/app/api/pouriq/import/commit/route.ts tests/unit/lib/pouriq-import-commit-validate.test.ts
git commit -m "fix(pouriq): import commit persists recipe_unit/recipe_qty (serve no longer dropped)"
```

---

### Task 3: Serve-stripped grouping key (bulk-fill)

**Files:**
- Modify: `src/lib/pouriq/import-bulk-fill.ts` (`groupKeyFor`, ~5-17)
- Test: `tests/unit/lib/pouriq-import-bulk-fill.test.ts` (extend if it exists; else create)

**Interfaces:**
- Consumes: nothing new.
- Produces: `groupKeyFor` accepts an optional `base_product` and groups by its normalised form when present, so "Guinness Half" and "Guinness Pint" (base_product "Guinness") share a group. Signature becomes:
  `groupKeyFor(input: { extracted_name: string; base_product?: string | null; inferred_type: IngredientType; match: { kind: string; catalogue_id?: string } }): string | null`

Rationale: today grouping keys on `normalise(extracted_name)`, so different names never merge. Feeding the serve-stripped `base_product` (when the extractor provides it) makes same-product multi-serve lines share a key while genuinely different products stay separate. Also relax the `inferred_type === 'spirit'` early-return to allow grouping when a `base_product` is present (so a spirit sold as single + double can share one bottle), but keep the spirit exclusion when no base_product is given (preserves today's behaviour on measure-less spirit lines).

- [ ] **Step 1: Write the failing test**

`tests/unit/lib/pouriq-import-bulk-fill.test.ts` (add cases; keep any existing):

```typescript
import { describe, expect, it } from 'vitest'
import { groupKeyFor } from '@/lib/pouriq/import-bulk-fill'

describe('groupKeyFor with base_product', () => {
  const cat = { kind: 'catalogue', catalogue_id: 'c-stout' }
  it('groups two serves of the same product by base_product', () => {
    const a = groupKeyFor({ extracted_name: 'Guinness Half', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    const b = groupKeyFor({ extracted_name: 'Guinness Pint', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    expect(a).not.toBeNull()
    expect(a).toBe(b)
  })
  it('keeps different products in different groups', () => {
    const a = groupKeyFor({ extracted_name: 'Guinness Pint', base_product: 'Guinness', inferred_type: 'beer', match: cat })
    const b = groupKeyFor({ extracted_name: 'Peroni Pint', base_product: 'Peroni', inferred_type: 'beer', match: cat })
    expect(a).not.toBe(b)
  })
  it('falls back to extracted_name when no base_product (unchanged behaviour)', () => {
    const a = groupKeyFor({ extracted_name: 'Triple Sec', inferred_type: 'liqueur', match: { kind: 'no-match' } })
    expect(a).toBe('name:triple sec')
  })
  it('allows grouping a spirit when base_product is present', () => {
    const a = groupKeyFor({ extracted_name: 'House Gin single', base_product: 'House Gin', inferred_type: 'spirit', match: cat })
    expect(a).toBe('name:house gin')
  })
  it('still excludes a measure-less spirit line (no base_product)', () => {
    const a = groupKeyFor({ extracted_name: 'House Gin', inferred_type: 'spirit', match: cat })
    expect(a).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-import-bulk-fill.test.ts`
Expected: FAIL (base_product not read; spirit case returns null).

- [ ] **Step 3: Update `groupKeyFor`**

```typescript
export function groupKeyFor(input: { extracted_name: string; base_product?: string | null; inferred_type: IngredientType; match: { kind: string; catalogue_id?: string } }): string | null {
  const base = input.base_product && input.base_product.trim() ? input.base_product : null
  // Measure-less spirit lines stay ungrouped (today's behaviour); once a
  // base_product is present the line is a serve of a known product and can group.
  if (input.inferred_type === 'spirit' && !base) return null
  const m = input.match
  // Group by the serve-stripped product name when we have it, else the line's
  // own name. Name-based (not catalogue_id) keeps distinct products that share
  // one generic entry separate; the serve-strip is what lets multi-serve lines
  // of the SAME product share a key.
  if (m.kind === 'catalogue' || m.kind === 'suggestions' || m.kind === 'no-match') {
    return `name:${normalise(base ?? input.extracted_name)}`
  }
  return null
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/unit/lib/pouriq-import-bulk-fill.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/import-bulk-fill.ts tests/unit/lib/pouriq-import-bulk-fill.test.ts
git commit -m "feat(pouriq): group import rows by serve-stripped product name"
```

---

### Task 4: Extraction returns serve + base_product

**Files:**
- Modify: `src/lib/pouriq/menu-extract.ts` (the Anthropic extraction — its per-ingredient output type + prompt), and `src/lib/pouriq/import-prompts.ts` if the prompt string lives there.
- Modify: `src/app/api/pouriq/import/extract/route.ts` (`PreviewIngredient` type ~28-38; populate `serve`/`base_product` per ingredient).

**Interfaces:**
- Consumes: `isKnownServeToken`, `ServeToken` from Task 1.
- Produces: `PreviewIngredient` gains `serve: ServeToken | null` and `base_product: string | null`. The extractor is prompted to, for each beverage/ingredient, put the PRODUCT (measure stripped) in `extracted_name` / a `base_product` field and the measure as a serve token; unknown/absent → `serve: null`, `base_product: null`.

Read `menu-extract.ts` first to see the current extraction schema and prompt. The change: (a) prompt instructs separating measure from product and emitting a serve token from the fixed vocabulary (map "pint"→`pint`, "half"/"1/2 pint"→`half_pint`, "large glass"/"250ml"→`250ml`, "double"→`50ml`, "single"→`25ml`, "175ml"→`175ml`, etc.); (b) validate the returned serve with `isKnownServeToken`, coercing anything else to `null`; (c) thread `serve` + `base_product` into `PreviewIngredient` in the extract route.

This task is prompt + plumbing; the pure validation (coerce unknown serve → null) is the testable seam.

- [ ] **Step 1: Add the coercion helper + failing test**

In `src/lib/pouriq/serve-map.ts` add:
```typescript
export function coerceServeToken(raw: unknown): ServeToken | null {
  return typeof raw === 'string' && isKnownServeToken(raw) ? raw : null
}
```

Add to `tests/unit/lib/pouriq-serve-map.test.ts`:
```typescript
import { coerceServeToken } from '@/lib/pouriq/serve-map'

describe('coerceServeToken', () => {
  it('passes known tokens', () => { expect(coerceServeToken('pint')).toBe('pint') })
  it('nulls unknown / non-string', () => {
    expect(coerceServeToken('flagon')).toBeNull()
    expect(coerceServeToken(undefined)).toBeNull()
    expect(coerceServeToken(42)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-serve-map.test.ts`
Expected: FAIL (coerceServeToken not exported).

- [ ] **Step 3: Implement coercion, then wire the extractor**

Add `coerceServeToken` (above). Then in `menu-extract.ts`:
- Extend the extraction JSON schema/prompt so each ingredient returns `base_product` (string) and `serve` (string token or null). Add prompt lines: "Separate the measure from the product. Put the product name (without any measure) in base_product. Put the measure as one of: 25ml, 50ml, half_pint, pint, 125ml, 175ml, 250ml, glass, or null if none is stated. A pint is pint, a half is half_pint, a large glass of wine is 250ml, a double spirit is 50ml, a single is 25ml."
- When mapping the model output to the per-ingredient object, set `serve = coerceServeToken(raw.serve)` and `base_product = typeof raw.base_product === 'string' && raw.base_product.trim() ? raw.base_product.trim() : null`.

In `import/extract/route.ts`, add to `PreviewIngredient`:
```typescript
  serve: import('@/lib/pouriq/serve-map').ServeToken | null   // (use a top-level import, not inline)
  base_product: string | null
```
(Top-level: `import type { ServeToken } from '@/lib/pouriq/serve-map'` then `serve: ServeToken | null`.)
Populate both fields when building each `PreviewIngredient` from the extractor output. If `menu-extract.ts` doesn't already carry them, pass them through.

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run tests/unit/lib/pouriq-serve-map.test.ts` (PASS) and `npx tsc --noEmit` (clean).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/serve-map.ts tests/unit/lib/pouriq-serve-map.test.ts src/lib/pouriq/menu-extract.ts src/app/api/pouriq/import/extract/route.ts
git commit -m "feat(pouriq): extraction separates serve token + base_product per line"
```

---

### Task 5: Preview uses serve for pack default, grouping, and the serve picker

**Files:**
- Modify: `src/components/pouriq/ImportPreview.tsx` (`initialIngredientState` — the catalogue branch sets `new_library.pack_size`; the bulk-fill call site; the commit body builder)
- Modify: `src/components/pouriq/IngredientMatchRow.tsx` (pre-set the ServeUnitPicker from `serve`; `MatchRowState` may need `recipe_unit`/`recipe_qty` already present — confirm)

**Interfaces:**
- Consumes: `packDefaultForServe`, `serveToRecipeUnit` (Task 1); `groupKeyFor` new signature (Task 3); `PreviewIngredient.serve`/`base_product` (Task 4); commit `recipe_unit`/`recipe_qty` (Task 2).
- Produces: preview rows that (a) default a draught product to a keg, (b) group by base_product, (c) carry the serve into the commit body.

Read both components first. Changes:
1. **Pack default:** in `initialIngredientState`, when building `new_library` for a `catalogue`/`no-match` row, if `ingredient.serve` is set, apply `packDefaultForServe(serve)` — override `pack_size` (and record pack_format) with the keg/bottle default instead of `default_pack_size ?? 700`. For draught this yields 50000.
2. **Grouping:** where `groupKeyFor` is called for bulk-fill, pass `base_product: ingredient.base_product`.
3. **Serve pre-fill:** initialise the row's `recipe_unit`/`recipe_qty`/`pour_ml` from `serveToRecipeUnit(serve)` when `serve` is set (so the ServeUnitPicker shows "pint" pre-selected). When `serve` is null, keep the existing `parsed`/`pour_ml` behaviour.
4. **Commit body:** in `handleCommit`, include `recipe_unit` and `recipe_qty` on each ingredient (they're now accepted by the route from Task 2). Confirm the ServeUnitPicker's onChange already stores these on row state; if so, just forward them.

There is no clean unit-test seam for the React state assembly; verify via tsc + build + the manual E2E. State in the report exactly what a tester checks (draught row shows keg 50L; half+pint rows collapse to one product; committed lines carry the serve).

- [ ] **Step 1: Make the changes above.** Read the files, apply 1-4.

- [ ] **Step 2: Typecheck, lint, build**

Run: `npx tsc --noEmit && npx eslint src && npx next build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/ImportPreview.tsx src/components/pouriq/IngredientMatchRow.tsx
git commit -m "feat(pouriq): import preview defaults draught to keg, groups by product, carries serve"
```

---

### Task 6: "Priced once, shown as shared" indicator

**Files:**
- Modify: `src/components/pouriq/ImportPreview.tsx` and/or `src/components/pouriq/IngredientMatchRow.tsx`

**Interfaces:**
- Consumes: the group membership already computed for bulk-fill (Task 5).
- Produces: when a product row is a bulk-fill target (price/pack propagated from another row of the same group), the row shows a small note "priced via [product]" and the source shows "shared with N other drink(s)", so the keg price/size is visibly set once.

This is presentational. When rendering a row whose `existing_library_id`/`new_library` was filled by bulk-fill (not user-entered), render a muted line "Priced via [base_product]" instead of repeating the full price/pack editor, and on the group's source row show a "Shared with N other drink(s)" chip. No em-dashes/emojis/exclamation marks.

- [ ] **Step 1: Implement the indicator.** Track, per row, whether its resolution came from bulk-fill (a boolean already exists or add one to row state), and render accordingly.

- [ ] **Step 2: Typecheck, lint, build**

Run: `npx tsc --noEmit && npx eslint src && npx next build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/ImportPreview.tsx src/components/pouriq/IngredientMatchRow.tsx
git commit -m "feat(pouriq): show shared-product 'priced once' indicator in import preview"
```

---

### Task 7: Catalogue search route (E4 backend)

**Files:**
- Create: `src/app/api/pouriq/catalogue/search/route.ts`
- Test: `tests/unit/lib/pouriq-catalogue-search.test.ts`

**Interfaces:**
- Consumes: `listCatalogue`, `matchCatalogue`, `CatalogueEntry` from `src/lib/pouriq/ingredient-catalogue.ts`; `checkPourIqAccess`.
- Produces: `GET /api/pouriq/catalogue/search?q=&type=` → `{ results: Array<{ id, name, ingredient_type, base_unit, default_pack_size }> }` (top matches). Plus a pure exported `searchCatalogue(q: string, entries: CatalogueEntry[], type?: IngredientType, limit?: number): CatalogueEntry[]` in `ingredient-catalogue.ts` so it's unit-testable and reused by the route.

`matchCatalogue` returns a single best entry. For autocomplete we want up to N ranked entries. Add `searchCatalogue` to `ingredient-catalogue.ts` that reuses the same token/alias scoring as `matchCatalogue` but returns the top `limit` (default 8) instead of one, or (simpler, DRY) a prefix/substring + token match returning several. Implement it as: exact/alias/token-subset/typo scored (reuse the scoring block from `matchCatalogue`), sorted, sliced to `limit`.

- [ ] **Step 1: Write the failing test**

`tests/unit/lib/pouriq-catalogue-search.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { searchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const entries: CatalogueEntry[] = [
  { id: '1', name: 'Everleaf Forest', normalised_name: 'everleaf forest', ingredient_type: 'alcohol-free', base_unit: 'ml', default_pack_size: 500, generic: null, aliases: [] },
  { id: '2', name: 'Everleaf Mountain', normalised_name: 'everleaf mountain', ingredient_type: 'alcohol-free', base_unit: 'ml', default_pack_size: 500, generic: null, aliases: [] },
  { id: '3', name: 'Smirnoff', normalised_name: 'smirnoff', ingredient_type: 'spirit', base_unit: 'ml', default_pack_size: 700, generic: 'vodka', aliases: [] },
]

describe('searchCatalogue', () => {
  it('returns multiple matches for a shared token', () => {
    const r = searchCatalogue('everleaf', entries)
    expect(r.map((e) => e.id).sort()).toEqual(['1', '2'])
  })
  it('returns an exact-name match', () => {
    const r = searchCatalogue('smirnoff', entries)
    expect(r[0].id).toBe('3')
  })
  it('respects the limit', () => {
    expect(searchCatalogue('everleaf', entries, undefined, 1)).toHaveLength(1)
  })
  it('returns empty for no match', () => {
    expect(searchCatalogue('zzzz', entries)).toEqual([])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/unit/lib/pouriq-catalogue-search.test.ts`
Expected: FAIL (searchCatalogue not exported).

- [ ] **Step 3: Implement `searchCatalogue` + the route**

In `ingredient-catalogue.ts` add (reusing the imported `normalise, significantTokens, tokenKey, tokensAreTypoNear`):
```typescript
export function searchCatalogue(q: string, entries: CatalogueEntry[], inferredType?: IngredientType, limit = 8): CatalogueEntry[] {
  const targetNorm = normalise(q)
  if (!targetNorm) return []
  const isGarnishy = (t: IngredientType) => t === 'garnish' || t === 'food'
  const typeOk = (e: CatalogueEntry) => inferredType === undefined || isGarnishy(inferredType) === isGarnishy(e.ingredient_type)
  const tTokens = significantTokens(q)
  const tKey = tokenKey(tTokens)
  const tSet = new Set(tTokens)
  const scored: { entry: CatalogueEntry; score: number }[] = []
  for (const e of entries) {
    if (!typeOk(e)) continue
    let best: number | null = null
    for (const cand of [e.normalised_name, ...e.aliases]) {
      if (cand === targetNorm) { best = 0; break }
      const cTokens = significantTokens(cand)
      if (cTokens.length === 0) continue
      const cSet = new Set(cTokens)
      if (tokenKey(cTokens) === tKey) { best = Math.min(best ?? 99, 0); continue }
      if (tTokens.every((t) => cSet.has(t)) || cTokens.every((c) => tSet.has(c))) { best = Math.min(best ?? 99, 1 + Math.abs(tTokens.length - cTokens.length)); continue }
      if (tokensAreTypoNear(tTokens, cTokens)) best = Math.min(best ?? 99, 10)
    }
    if (best !== null) scored.push({ entry: e, score: best })
  }
  scored.sort((a, b) => a.score - b.score || a.entry.name.localeCompare(b.entry.name))
  return scored.slice(0, limit).map((s) => s.entry)
}
```

Create `src/app/api/pouriq/catalogue/search/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listCatalogue, searchCatalogue } from '@/lib/pouriq/ingredient-catalogue'
import { ALL_INGREDIENT_TYPES, type IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ results: [] })
  const typeParam = url.searchParams.get('type')
  const type = typeParam && ALL_INGREDIENT_TYPES.includes(typeParam as IngredientType) ? (typeParam as IngredientType) : undefined
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const entries = await listCatalogue(db)
  const results = searchCatalogue(q, entries, type).map((e) => ({
    id: e.id, name: e.name, ingredient_type: e.ingredient_type, base_unit: e.base_unit, default_pack_size: e.default_pack_size,
  }))
  return NextResponse.json({ results })
}
```

- [ ] **Step 4: Run test + typecheck**

Run: `npx vitest run tests/unit/lib/pouriq-catalogue-search.test.ts` (PASS); `npx tsc --noEmit` (clean).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pouriq/ingredient-catalogue.ts src/app/api/pouriq/catalogue/search/route.ts tests/unit/lib/pouriq-catalogue-search.test.ts
git commit -m "feat(pouriq): catalogue search helper + GET /catalogue/search route (E4 backend)"
```

---

### Task 8: Catalogue autocomplete on the Add-ingredient name field (E4 UI)

**Files:**
- Modify: `src/components/pouriq/IngredientForm.tsx` (name field ~552-561; reuse the catalogue-prefill shape from `handleScan` ~269-278)

**Interfaces:**
- Consumes: `GET /api/pouriq/catalogue/search` (Task 7).
- Produces: the Name input becomes a combobox with catalogue suggestions; picking one prefills name/type/base_unit/pack_size.

Read the form's name state (`const [name, setName]`), `handleScan`'s prefill (sets name/ingredientType/baseUnit/packSizeStr), and the existing setters. Add:
- Local state `suggestions: Array<{ id, name, ingredient_type, base_unit, default_pack_size }>` and `showSuggestions: boolean`.
- On name change (only when `entry === null`, i.e. new ingredient, and `name.length >= 2`), debounce ~200ms and `fetch('/api/pouriq/catalogue/search?q=' + encodeURIComponent(value) + (typeChosen ? '&type=' + ingredient_type : ''))`, set suggestions. Guard against stale responses (track latest query).
- Render a dropdown under the input; each item shows `name` + a small type label. On click: setName(name), setIngredientType(type), if base_unit set it, if default_pack_size set base_unit ml + packSizeStr — mirroring `handleScan`. Close the dropdown.
- Keyboard: Escape closes; typing a non-matching name just leaves the field as free text. No blocking.
- Copy: no em-dashes/emojis/exclamation marks.

No unit-test seam (the search logic is tested in Task 7). Verify via tsc + build; report the manual check (type "Everleaf" → two suggestions → pick → fields prefill).

- [ ] **Step 1: Implement the combobox.**

- [ ] **Step 2: Typecheck, lint, build**

Run: `npx tsc --noEmit && npx eslint src && npx next build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/IngredientForm.tsx
git commit -m "feat(pouriq): catalogue name-autocomplete on the manual add-ingredient form (E4)"
```

---

### Task 9: Full verification + PR

**Files:** none new.

- [ ] **Step 1: Full gate sequence**

```bash
npx tsc --noEmit
npx eslint src tests
npx vitest run
npx next build
npx opennextjs-cloudflare build
```
Expected: all clean.

- [ ] **Step 2: Rebase onto origin/main**

```bash
git fetch origin && git rebase origin/main
```
Re-run the gates if anything was rebased over.

- [ ] **Step 3: Push + open PR**

```bash
git push -u origin feat/pouriq-serve-aware-import
gh pr create --title "feat(pouriq): serve-aware menu import + catalogue autocomplete (E1+E4)" --body "$(cat <<'EOF'
## Summary
- Menu import now turns a product sold in multiple measures (Guinness keg -> half + pint; wine 125/175/250; spirit 25/50) into ONE priced-once library entry with each menu line carrying its own serve.
- The import commit route now persists recipe_unit/recipe_qty (previously silently dropped).
- Draught products default to a 50L keg at import instead of a bottle size (fixes F2).
- E4: catalogue name-autocomplete on the manual Add-ingredient form.

No schema change (recipe-line serve columns already exist since 0044). Sale price stays 1:1 with the menu line; grouping is cost-side only.

## Spec
docs/superpowers/specs/2026-07-08-pouriq-serve-aware-import-design.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Post-merge note.** No migration to apply. The extraction change is additive; validate with a real menu import (Dan): Guinness half+pint -> one keg priced once; wine/spirit multi-serve share one bottle; manual-add autocomplete surfaces catalogue hits.

---

## Manual E2E (after deploy, with Dan)

1. Import a whole-venue menu with draught (Guinness half + pint), wine by the glass (125/175/250), and a spirit.
2. Confirm the Guinness rows collapse to ONE product priced once, defaulted to a 50L keg; each drink keeps its own sale price.
3. Confirm the committed drinks cost correctly (pint ~£1.25, half ~£0.62 for a £110 50L keg) and the drink editor shows "pint" / "half pint" on the lines.
4. Add an ingredient manually, type "Everleaf" — catalogue suggestions appear; pick one; fields prefill.
