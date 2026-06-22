# Shared Ingredient Catalogue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** A global, curated, price-less ingredient catalogue that menu import matches against, so a bar adopts a common ingredient by just entering its price (creating a priced library entry) instead of hand-building it.

**Architecture:** New `pouriq_ingredient_catalogue` table + comprehensive seed. The import extract route loads the catalogue and, for ingredients not auto-matched to the bar's library, returns a new `catalogue` match kind. `ImportPreview` pre-stages a `new_library` entry from the catalogue hit (name/type/size), the bar enters the cost, and the **existing** commit path creates the library entry. Commit route unchanged.

**Spec:** `docs/superpowers/specs/2026-06-19-pouriq-ingredient-catalogue-design.md`
**Branch:** `feat/pouriq-ingredient-catalogue` (off origin/main)

---

### Task 1: Migration — table + comprehensive seed

**Files:** Create `migrations/0034_ingredient_catalogue.sql`

- [ ] **Step 1: Table + seed in one migration.** Create the table per the spec, then INSERT the curated set. Use the canonical name for `name`, lowercase for `normalised_name`, the enum `ingredient_type`, `pricing_mode` ('bottle' for anything poured, 'unit' for whole-item garnishes), and `default_bottle_size_ml` (700 for spirits/liqueurs unless noted; null for unit items; mixers/juices/syrups 1000; vermouth 750).

```sql
CREATE TABLE pouriq_ingredient_catalogue (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  normalised_name TEXT NOT NULL UNIQUE,
  ingredient_type TEXT NOT NULL CHECK (ingredient_type IN
    ('spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other')),
  pricing_mode TEXT NOT NULL CHECK (pricing_mode IN ('bottle','unit')),
  default_bottle_size_ml INTEGER,
  verified INTEGER NOT NULL DEFAULT 1,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO pouriq_ingredient_catalogue (name, normalised_name, ingredient_type, pricing_mode, default_bottle_size_ml) VALUES
-- Spirits (bottle, 700ml)
('White Rum','white rum','spirit','bottle',700),
('Dark Rum','dark rum','spirit','bottle',700),
('Spiced Rum','spiced rum','spirit','bottle',700),
('Aged Rum','aged rum','spirit','bottle',700),
('Overproof Rum','overproof rum','spirit','bottle',700),
('London Dry Gin','london dry gin','spirit','bottle',700),
('Old Tom Gin','old tom gin','spirit','bottle',700),
('Vodka','vodka','spirit','bottle',700),
('Blended Scotch Whisky','blended scotch whisky','spirit','bottle',700),
('Single Malt Scotch','single malt scotch','spirit','bottle',700),
('Bourbon','bourbon','spirit','bottle',700),
('Rye Whiskey','rye whiskey','spirit','bottle',700),
('Irish Whiskey','irish whiskey','spirit','bottle',700),
('Blanco Tequila','blanco tequila','spirit','bottle',700),
('Reposado Tequila','reposado tequila','spirit','bottle',700),
('Anejo Tequila','anejo tequila','spirit','bottle',700),
('Mezcal','mezcal','spirit','bottle',700),
('Cognac','cognac','spirit','bottle',700),
('Brandy','brandy','spirit','bottle',700),
('Pisco','pisco','spirit','bottle',700),
('Cachaca','cachaca','spirit','bottle',700),
('Absinthe','absinthe','spirit','bottle',700),
-- Liqueurs (bottle; vermouth 750)
('Triple Sec','triple sec','liqueur','bottle',700),
('Cointreau','cointreau','liqueur','bottle',700),
('Campari','campari','liqueur','bottle',700),
('Aperol','aperol','liqueur','bottle',700),
('Sweet Vermouth','sweet vermouth','liqueur','bottle',750),
('Dry Vermouth','dry vermouth','liqueur','bottle',750),
('Coffee Liqueur','coffee liqueur','liqueur','bottle',700),
('Amaretto','amaretto','liqueur','bottle',700),
('Elderflower Liqueur','elderflower liqueur','liqueur','bottle',700),
('Peach Schnapps','peach schnapps','liqueur','bottle',700),
('Blue Curacao','blue curacao','liqueur','bottle',700),
('Chambord','chambord','liqueur','bottle',700),
('Maraschino Liqueur','maraschino liqueur','liqueur','bottle',700),
('Benedictine','benedictine','liqueur','bottle',700),
('Irish Cream','irish cream','liqueur','bottle',700),
('Limoncello','limoncello','liqueur','bottle',700),
('Sloe Gin','sloe gin','liqueur','bottle',700),
('Apricot Brandy','apricot brandy','liqueur','bottle',700),
('Melon Liqueur','melon liqueur','liqueur','bottle',700),
('Orange Bitters','orange bitters','liqueur','bottle',100),
('Angostura Bitters','angostura bitters','liqueur','bottle',200),
-- Wine / sparkling
('Prosecco','prosecco','wine','bottle',750),
('Champagne','champagne','wine','bottle',750),
('Red Wine','red wine','wine','bottle',750),
('White Wine','white wine','wine','bottle',750),
('Aperitif Wine','aperitif wine','wine','bottle',750),
-- Beer
('Lager','lager','beer','bottle',330),
('Ginger Beer (Alcoholic)','ginger beer alcoholic','beer','bottle',330),
-- Mixers (bottle, 1000ml)
('Tonic Water','tonic water','mixer','bottle',1000),
('Soda Water','soda water','mixer','bottle',1000),
('Cola','cola','mixer','bottle',1000),
('Lemonade','lemonade','mixer','bottle',1000),
('Ginger Beer','ginger beer','mixer','bottle',1000),
('Ginger Ale','ginger ale','mixer','bottle',1000),
('Bitter Lemon','bitter lemon','mixer','bottle',1000),
('Cranberry Juice','cranberry juice','juice','bottle',1000),
-- Juices (bottle, 1000ml)
('Lime Juice','lime juice','juice','bottle',1000),
('Lemon Juice','lemon juice','juice','bottle',1000),
('Orange Juice','orange juice','juice','bottle',1000),
('Pineapple Juice','pineapple juice','juice','bottle',1000),
('Grapefruit Juice','grapefruit juice','juice','bottle',1000),
('Apple Juice','apple juice','juice','bottle',1000),
('Tomato Juice','tomato juice','juice','bottle',1000),
('Passion Fruit Puree','passion fruit puree','juice','bottle',1000),
-- Syrups (bottle, 1000ml)
('Sugar Syrup','sugar syrup','syrup','bottle',1000),
('Grenadine','grenadine','syrup','bottle',1000),
('Agave Syrup','agave syrup','syrup','bottle',1000),
('Honey Syrup','honey syrup','syrup','bottle',1000),
('Orgeat','orgeat','syrup','bottle',1000),
('Vanilla Syrup','vanilla syrup','syrup','bottle',1000),
('Elderflower Cordial','elderflower cordial','syrup','bottle',1000),
-- Garnishes (unit)
('Lime','lime','garnish','unit',NULL),
('Lemon','lemon','garnish','unit',NULL),
('Orange','orange','garnish','unit',NULL),
('Mint Sprig','mint sprig','garnish','unit',NULL),
('Cocktail Cherry','cocktail cherry','garnish','unit',NULL),
('Olive','olive','garnish','unit',NULL),
('Cucumber','cucumber','garnish','unit',NULL),
('Egg White','egg white','garnish','unit',NULL),
('Salt Rim','salt rim','garnish','unit',NULL),
('Sugar Rim','sugar rim','garnish','unit',NULL);
```

- [ ] **Step 2: Validate locally.** Run: `npx wrangler d1 execute jerry-can-spirits-db --local --file migrations/0034_ingredient_catalogue.sql` → expect success. Then `--local --command "SELECT COUNT(*) FROM pouriq_ingredient_catalogue"` → expect > 80.
- [ ] **Step 3: Commit.** `feat(pouriq): ingredient catalogue table + curated seed`

---

### Task 2: Catalogue data access + matcher

**Files:** Create `src/lib/pouriq/ingredient-catalogue.ts`; Modify `src/lib/pouriq/match.ts` (export helpers); Create `tests/unit/lib/pouriq-ingredient-catalogue.test.ts`

- [ ] **Step 1: Export `normalise` + `levenshtein`** from `src/lib/pouriq/match.ts` (change `function normalise` → `export function normalise`, `function levenshtein` → `export function levenshtein`) so catalogue matching uses the same normalisation as library matching.

- [ ] **Step 2: `ingredient-catalogue.ts`:**

```ts
import type { IngredientType } from './types'
import { normalise, levenshtein } from './match'

export interface CatalogueEntry {
  id: string
  name: string
  normalised_name: string
  ingredient_type: IngredientType
  pricing_mode: 'bottle' | 'unit'
  default_bottle_size_ml: number | null
}

export async function listCatalogue(db: D1Database): Promise<CatalogueEntry[]> {
  const res = await db
    .prepare(`SELECT id, name, normalised_name, ingredient_type, pricing_mode, default_bottle_size_ml FROM pouriq_ingredient_catalogue`)
    .all<CatalogueEntry>()
  return res.results ?? []
}

// Best catalogue entry when confident: exact normalised match, else nearest
// within Levenshtein <= 2 (and a substring guard for multi-word names). Null
// otherwise so we never silently mis-adopt.
export function matchCatalogue(name: string, entries: CatalogueEntry[]): CatalogueEntry | null {
  const target = normalise(name)
  if (!target) return null
  const exact = entries.find((e) => e.normalised_name === target)
  if (exact) return exact
  let best: { entry: CatalogueEntry; score: number } | null = null
  for (const e of entries) {
    const cand = e.normalised_name
    if (cand.length < 3) continue
    const dist = levenshtein(target, cand)
    if (dist <= 2 && (best === null || dist < best.score)) best = { entry: e, score: dist }
    else if (
      (target.length >= 5 && cand.includes(target)) ||
      (cand.length >= 5 && target.includes(cand))
    ) {
      const s = 100 + Math.abs(target.length - cand.length)
      if (best === null || s < best.score) best = { entry: e, score: s }
    }
  }
  return best?.entry ?? null
}
```

- [ ] **Step 3: Unit tests** (`pouriq-ingredient-catalogue.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { matchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const c = (name: string): CatalogueEntry => ({
  id: name, name, normalised_name: name.toLowerCase(),
  ingredient_type: 'spirit', pricing_mode: 'bottle', default_bottle_size_ml: 700,
})
const cat = [c('Dark Rum'), c('White Rum'), c('Lime Juice'), c('Campari')]

describe('matchCatalogue', () => {
  it('exact normalised match', () => {
    expect(matchCatalogue('dark rum', cat)?.name).toBe('Dark Rum')
    expect(matchCatalogue('DARK RUM', cat)?.name).toBe('Dark Rum')
  })
  it('fuzzy within threshold', () => {
    expect(matchCatalogue('dark rom', cat)?.name).toBe('Dark Rum') // 1 edit
  })
  it('substring multi-word ("fresh lime juice" -> "Lime Juice")', () => {
    expect(matchCatalogue('fresh lime juice', cat)?.name).toBe('Lime Juice')
  })
  it('returns null when nothing is close', () => {
    expect(matchCatalogue('elderflower tonic foam', cat)).toBeNull()
  })
})
```

- [ ] **Step 4:** `npx tsc --noEmit && npm run test:unit` → pass. **Commit:** `feat(pouriq): ingredient catalogue data access + confident matcher`

---

### Task 3: Wire the catalogue into import extraction

**Files:** Modify `src/app/api/pouriq/import/extract/route.ts`

- [ ] **Step 1: Extend the preview match union.** In `PreviewIngredient.match`, add:
```ts
    | { kind: 'catalogue'; catalogue_id: string; name: string; ingredient_type: IngredientType; pricing_mode: 'bottle' | 'unit'; default_bottle_size_ml: number | null }
```

- [ ] **Step 2: Load the catalogue and apply precedence.** Add imports `import { listCatalogue, matchCatalogue } from '@/lib/pouriq/ingredient-catalogue'`. After `const library = await listLibraryEntries(...)`, add `const catalogue = await listCatalogue(db)`. Replace the per-ingredient match block so precedence is: library auto → catalogue confident → library suggestions → no-match:

```ts
      const parsed = parseMeasurement(i.raw_measurement)
      const matched = matchIngredient(i.name, library)
      let match: PreviewIngredient['match']
      if (matched.kind === 'auto') {
        match = { kind: 'auto', library_id: matched.entry.id, library_name: matched.entry.name }
      } else {
        const cat = matchCatalogue(i.name, catalogue)
        if (cat) {
          match = {
            kind: 'catalogue',
            catalogue_id: cat.id,
            name: cat.name,
            ingredient_type: cat.ingredient_type,
            pricing_mode: cat.pricing_mode,
            default_bottle_size_ml: cat.default_bottle_size_ml,
          }
        } else if (matched.kind === 'suggestions') {
          match = { kind: 'suggestions', entries: matched.entries.map((e) => ({ id: e.id, name: e.name })) }
        } else {
          match = { kind: 'no-match' }
        }
      }
```

- [ ] **Step 3:** `npx tsc --noEmit` → expect ImportPreview type errors (its local `match` union doesn't yet include `catalogue`); fixed in Task 4. The route file itself type-checks. **Commit:** `feat(pouriq): import extraction matches the shared catalogue`

---

### Task 4: Adopt-with-price in the import preview

**Files:** Modify `src/components/pouriq/ImportPreview.tsx`, `src/components/pouriq/IngredientMatchRow.tsx`

- [ ] **Step 1: Mirror the union** in `ImportPreview.tsx` `PreviewDrinkInput.ingredients[].match` — add the same `catalogue` variant as Task 3 Step 1.

- [ ] **Step 2: Pre-stage a new_library from a catalogue hit.** In `initialIngredientState`, before the final `return`, add a branch:

```ts
  if (input.match.kind === 'catalogue') {
    const m = input.match
    return {
      new_library: {
        name: m.name,
        ingredient_type: m.ingredient_type,
        bottle_size_ml: m.pricing_mode === 'bottle' ? (m.default_bottle_size_ml ?? 700) : null,
        bottle_cost_p: m.pricing_mode === 'bottle' ? null : null,
        unit_cost_p: m.pricing_mode === 'unit' ? null : null,
      },
      pour_ml,
      unit_count,
    }
  }
```
(So the row opens in "creating new library entry" mode, pre-filled, with the cost blank for the bar to type.)

- [ ] **Step 3: Require a price before commit.** In `ImportPreview`, the resolved-state derivation currently treats any `new_library` as resolved. Add a helper and use it in the stats/submit guard so a `new_library` with no usable price counts as unresolved:

```ts
function newLibraryPriced(nl: NonNullable<MatchRowState['new_library']>): boolean {
  if (nl.unit_cost_p !== null) return nl.unit_cost_p > 0
  return nl.bottle_size_ml !== null && nl.bottle_cost_p !== null && nl.bottle_cost_p > 0
}
```
In the `reduce` that computes stats: an ingredient with `new_library` that is **not** `newLibraryPriced` should count toward `needsChoice` (label it "needs price"), not `toCreate`. The submit guard already blocks when `needsChoice > 0`; reuse it. Update the guard message to "{n} ingredients still need a library match or price".

- [ ] **Step 4: Badge for catalogue rows.** `IngredientMatchRow` shows the match badge from `matchKind`. Add `'catalogue'` to the `matchKind` prop type (`'auto' | 'suggestions' | 'no-match' | 'catalogue'`) and a badge: `matchKind === 'catalogue'` → `<span className="text-xs text-sky-300">from catalogue — set your price</span>`. Pass `matchKind={ing.match.kind}` (already wired). No other change needed — the catalogue row renders through the existing `new_library` create UI (pre-staged in Step 2), so the bar sees name/type pre-filled and just enters cost.

- [ ] **Step 5:** `npx tsc --noEmit && npx next lint && npm run build` → clean. **Commit:** `feat(pouriq): adopt catalogue ingredients with a price in import preview`

---

### Task 5: Verify + PR

- [ ] **Step 1:** `npm run test:unit` (catalogue matcher + existing suites) → pass; `npm run build` → succeeds.
- [ ] **Step 2:** Push, open PR. Body: migration 0034 (table + seed) to apply at deploy; import now suggests shared-catalogue ingredients with set-your-price adoption; commit route unchanged; crowd-growth and EAN-13 linkage out of scope.
- [ ] **Step 3:** Watch CI green.
