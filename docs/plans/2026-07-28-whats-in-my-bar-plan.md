# What's in my bar? — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Field Manual tool where a visitor marks the bottles they own on a code-native "backbar" and instantly sees which cocktails they can make now and which they are one bottle away from.

**Architecture:** A pure, unit-tested match engine and index builder in `src/lib/bar/` (no framework, no I/O). An ISR server page fetches a compact index from Sanity and passes it to a client "backbar" component that persists the owned set in `localStorage` and renders results live. The backbar visual (shelves, spotlights, bottle silhouettes) is CSS + inline SVG, no image assets.

**Tech Stack:** Next.js 15 App Router (OpenNext/Cloudflare), Sanity (`next-sanity`), TypeScript, Tailwind v4, vitest.

## Global Constraints

- **Routing:** `trailingSlash: true`. Route is `/field-manual/whats-in-my-bar/`. Any internal `<Link href>` includes the trailing slash.
- **Data freshness:** the match index is fetched from Sanity in the server page with `{ next: { revalidate: 3600 } }` (ISR) — never a committed/baked JSON file. New cocktails must appear without a redeploy.
- **No new dependencies.** Use React, Tailwind, and the existing Sanity client only.
- **Sanity client (pages):** `import { client } from '@/sanity/lib/client'`; queries live in `src/sanity/queries.ts`.
- **Testing:** pure logic in `src/lib/bar/` is TDD'd with vitest (`npm run test:unit`, files in `tests/unit/lib/bar/`). React components are verified by `npx tsc --noEmit`, `npx eslint`, and `npm run build` — the repo has no component-test harness; do not add one.
- **Voice:** all user-facing copy follows `docs/VOICE.md` — British spelling, measured, no exclamation marks, no em/en dashes, no banned intensifiers, no standalone "premium". Product name is always "Expedition Spiced Rum" in full.
- **Mobile-first:** base styles target ~390px; widen with `sm:`/`md:`/`lg:`. Two-panel on desktop folds to single column on mobile.
- **Accessibility:** owned/not-owned is a real toggle button with `aria-pressed` and a non-colour indicator; spotlights/wood/cones are decorative (`aria-hidden`); inputs are labelled.
- **Ingredient categories (from `src/sanity/schemaTypes/ingredient.ts`):** `spirits`, `liqueurs`, `creme-liqueurs`, `anise-herbal`, `aromatics`, `wine` (titled "Wine & Champagne"), `bitters`, `mixers`, `fresh`, `garnishes`. Garnishes are excluded from the tool.

---

### Task 1: Types, shelf map, vessel map, assumed basics

**Files:**
- Create: `src/lib/bar/types.ts`
- Create: `src/lib/bar/config.ts`
- Test: `tests/unit/lib/bar/config.test.ts`

**Interfaces:**
- Produces:
  - `type ShelfId = 'spirits' | 'wines-liqueurs' | 'mixers' | 'fresh' | 'bitters'`
  - `type VesselType = 'spirit' | 'wine' | 'liqueur' | 'carton' | 'can' | 'dash'`
  - `interface CocktailIndexItem { slug: string; name: string; baseSpirit: string; coreIngredientIds: string[] }`
  - `interface BarIngredient { id: string; name: string; slug: string; category: string; shelf: ShelfId; vessel: VesselType; common: boolean }`
  - `interface ShelfGroup { id: ShelfId; label: string; ingredients: BarIngredient[] }`
  - `interface BarData { index: CocktailIndexItem[]; shelves: ShelfGroup[] }`
  - `const SHELVES: { id: ShelfId; label: string }[]`
  - `const CATEGORY_TO_SHELF: Record<string, ShelfId>`
  - `const CATEGORY_TO_VESSEL: Record<string, VesselType>`
  - `const ASSUMED_BASIC_SLUGS: string[]`
  - `function shelfForCategory(category: string): ShelfId | null`
  - `function vesselForCategory(category: string): VesselType`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/lib/bar/config.test.ts
import { describe, expect, it } from 'vitest'
import {
  SHELVES,
  shelfForCategory,
  vesselForCategory,
  ASSUMED_BASIC_SLUGS,
} from '@/lib/bar/config'

describe('bar config', () => {
  it('has five shelves in display order', () => {
    expect(SHELVES.map((s) => s.id)).toEqual([
      'spirits',
      'wines-liqueurs',
      'mixers',
      'fresh',
      'bitters',
    ])
    expect(SHELVES.find((s) => s.id === 'wines-liqueurs')?.label).toBe('Wines & Liqueurs')
  })

  it('maps ingredient categories to shelves, excluding garnishes', () => {
    expect(shelfForCategory('spirits')).toBe('spirits')
    expect(shelfForCategory('liqueurs')).toBe('wines-liqueurs')
    expect(shelfForCategory('creme-liqueurs')).toBe('wines-liqueurs')
    expect(shelfForCategory('anise-herbal')).toBe('wines-liqueurs')
    expect(shelfForCategory('wine')).toBe('wines-liqueurs')
    expect(shelfForCategory('mixers')).toBe('mixers')
    expect(shelfForCategory('fresh')).toBe('fresh')
    expect(shelfForCategory('bitters')).toBe('bitters')
    expect(shelfForCategory('aromatics')).toBe('bitters')
    expect(shelfForCategory('garnishes')).toBeNull()
  })

  it('maps categories to a vessel silhouette, defaulting to spirit', () => {
    expect(vesselForCategory('spirits')).toBe('spirit')
    expect(vesselForCategory('wine')).toBe('wine')
    expect(vesselForCategory('liqueurs')).toBe('liqueur')
    expect(vesselForCategory('fresh')).toBe('carton')
    expect(vesselForCategory('mixers')).toBe('can')
    expect(vesselForCategory('bitters')).toBe('dash')
    expect(vesselForCategory('unknown-x')).toBe('spirit')
  })

  it('treats water and ice as assumed basics', () => {
    expect(ASSUMED_BASIC_SLUGS).toContain('water')
    expect(ASSUMED_BASIC_SLUGS).toContain('ice')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/bar/config.test.ts`
Expected: FAIL — cannot resolve `@/lib/bar/config`.

- [ ] **Step 3: Write the types**

```typescript
// src/lib/bar/types.ts
export type ShelfId = 'spirits' | 'wines-liqueurs' | 'mixers' | 'fresh' | 'bitters'
export type VesselType = 'spirit' | 'wine' | 'liqueur' | 'carton' | 'can' | 'dash'

export interface CocktailIndexItem {
  slug: string
  name: string
  baseSpirit: string
  coreIngredientIds: string[]
}

export interface BarIngredient {
  id: string
  name: string
  slug: string
  category: string
  shelf: ShelfId
  vessel: VesselType
  common: boolean
}

export interface ShelfGroup {
  id: ShelfId
  label: string
  ingredients: BarIngredient[]
}

export interface BarData {
  index: CocktailIndexItem[]
  shelves: ShelfGroup[]
}
```

- [ ] **Step 4: Write the config**

```typescript
// src/lib/bar/config.ts
import type { ShelfId, VesselType } from './types'

export const SHELVES: { id: ShelfId; label: string }[] = [
  { id: 'spirits', label: 'Spirits' },
  { id: 'wines-liqueurs', label: 'Wines & Liqueurs' },
  { id: 'mixers', label: 'Mixers & syrups' },
  { id: 'fresh', label: 'Fresh & juice' },
  { id: 'bitters', label: 'Bitters & aromatics' },
]

// Ingredient category -> shelf. Categories absent here (garnishes) are excluded.
export const CATEGORY_TO_SHELF: Record<string, ShelfId> = {
  spirits: 'spirits',
  liqueurs: 'wines-liqueurs',
  'creme-liqueurs': 'wines-liqueurs',
  'anise-herbal': 'wines-liqueurs',
  wine: 'wines-liqueurs',
  champagne: 'wines-liqueurs', // legacy value, safe catch
  mixers: 'mixers',
  fresh: 'fresh',
  bitters: 'bitters',
  aromatics: 'bitters',
}

// Ingredient category -> bottle silhouette shape.
export const CATEGORY_TO_VESSEL: Record<string, VesselType> = {
  spirits: 'spirit',
  wine: 'wine',
  champagne: 'wine',
  liqueurs: 'liqueur',
  'creme-liqueurs': 'liqueur',
  'anise-herbal': 'liqueur',
  fresh: 'carton',
  mixers: 'can',
  bitters: 'dash',
  aromatics: 'dash',
}

// Every bar is assumed to have these; they never count against a match.
// Confirm these slugs exist in Sanity before relying on them.
export const ASSUMED_BASIC_SLUGS: string[] = ['water', 'ice', 'hot-water']

export function shelfForCategory(category: string): ShelfId | null {
  return CATEGORY_TO_SHELF[category] ?? null
}

export function vesselForCategory(category: string): VesselType {
  return CATEGORY_TO_VESSEL[category] ?? 'spirit'
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/bar/config.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/bar/types.ts src/lib/bar/config.ts tests/unit/lib/bar/config.test.ts
git commit -m "feat(bar): types, shelf/vessel maps and assumed basics for the bar tool"
```

---

### Task 2: The match engine

**Files:**
- Create: `src/lib/bar/match-engine.ts`
- Test: `tests/unit/lib/bar/match-engine.test.ts`

**Interfaces:**
- Consumes: `CocktailIndexItem` from `src/lib/bar/types.ts`.
- Produces:
  - `interface OneAway { cocktail: CocktailIndexItem; missingId: string }`
  - `interface MatchResult { makeable: CocktailIndexItem[]; oneAway: OneAway[] }`
  - `function match(ownedIds: Set<string>, index: CocktailIndexItem[]): MatchResult`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/lib/bar/match-engine.test.ts
import { describe, expect, it } from 'vitest'
import { match } from '@/lib/bar/match-engine'
import type { CocktailIndexItem } from '@/lib/bar/types'

const INDEX: CocktailIndexItem[] = [
  { slug: 'daiquiri', name: 'Daiquiri', baseSpirit: 'white-rum', coreIngredientIds: ['rum', 'lime', 'syrup'] },
  { slug: 'gimlet', name: 'Gimlet', baseSpirit: 'gin', coreIngredientIds: ['gin', 'lime', 'syrup'] },
  { slug: 'negroni', name: 'Negroni', baseSpirit: 'gin', coreIngredientIds: ['gin', 'campari', 'vermouth'] },
  { slug: 'martini', name: 'Martini', baseSpirit: 'gin', coreIngredientIds: ['gin', 'vermouth'] },
]

describe('match engine', () => {
  it('returns cocktails where every core ingredient is owned', () => {
    const res = match(new Set(['rum', 'lime', 'syrup']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['daiquiri'])
  })

  it('returns cocktails missing exactly one core ingredient, naming the missing id', () => {
    const res = match(new Set(['gin', 'vermouth']), INDEX)
    expect(res.makeable.map((c) => c.slug).sort()).toEqual(['martini'])
    const negroni = res.oneAway.find((o) => o.cocktail.slug === 'negroni')
    expect(negroni?.missingId).toBe('campari')
  })

  it('does not list a cocktail as both makeable and one-away', () => {
    const res = match(new Set(['gin', 'vermouth', 'campari']), INDEX)
    const makeableSlugs = new Set(res.makeable.map((c) => c.slug))
    expect(res.oneAway.some((o) => makeableSlugs.has(o.cocktail.slug))).toBe(false)
  })

  it('excludes cocktails missing two or more ingredients from both tiers', () => {
    const res = match(new Set(['gin']), INDEX)
    expect(res.makeable).toEqual([])
    expect(res.oneAway.map((o) => o.cocktail.slug).sort()).toEqual(['martini'])
  })

  it('orders makeable by fewest ingredients then name (deterministic)', () => {
    const res = match(new Set(['gin', 'vermouth', 'lime', 'syrup', 'rum', 'campari']), INDEX)
    expect(res.makeable.map((c) => c.slug)).toEqual(['martini', 'daiquiri', 'gimlet', 'negroni'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/bar/match-engine.test.ts`
Expected: FAIL — cannot resolve `@/lib/bar/match-engine`.

- [ ] **Step 3: Write the engine**

```typescript
// src/lib/bar/match-engine.ts
import type { CocktailIndexItem } from './types'

export interface OneAway {
  cocktail: CocktailIndexItem
  missingId: string
}

export interface MatchResult {
  makeable: CocktailIndexItem[]
  oneAway: OneAway[]
}

// Pure. Assumed basics are already stripped from coreIngredientIds at index build,
// so this needs no special-casing. A cocktail with no core ingredients is makeable.
export function match(ownedIds: Set<string>, index: CocktailIndexItem[]): MatchResult {
  const makeable: CocktailIndexItem[] = []
  const oneAway: OneAway[] = []

  for (const cocktail of index) {
    const missing = cocktail.coreIngredientIds.filter((id) => !ownedIds.has(id))
    if (missing.length === 0) {
      makeable.push(cocktail)
    } else if (missing.length === 1) {
      oneAway.push({ cocktail, missingId: missing[0] })
    }
  }

  makeable.sort(
    (a, b) => a.coreIngredientIds.length - b.coreIngredientIds.length || a.name.localeCompare(b.name),
  )
  oneAway.sort((a, b) => a.cocktail.name.localeCompare(b.cocktail.name))

  return { makeable, oneAway }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/bar/match-engine.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/bar/match-engine.ts tests/unit/lib/bar/match-engine.test.ts
git commit -m "feat(bar): pure match engine (makeable + one-bottle-away)"
```

---

### Task 3: Index builder and common-bottle ranking

**Files:**
- Create: `src/lib/bar/build-index.ts`
- Test: `tests/unit/lib/bar/build-index.test.ts`

**Interfaces:**
- Consumes: `shelfForCategory`, `vesselForCategory`, `ASSUMED_BASIC_SLUGS` from `./config`; types from `./types`.
- Produces:
  - `interface RawCocktail { slug: string; name: string; baseSpirit: string; ingredientIds: string[] }`
  - `interface RawIngredient { id: string; name: string; slug: string; category: string }`
  - `function buildBarData(cocktails: RawCocktail[], ingredients: RawIngredient[], commonPerShelf?: number): BarData`
  - Behaviour: drops garnish-shelf ingredients; strips assumed-basic ids from each cocktail's core; marks the top `commonPerShelf` (default 8) ingredients per shelf by cocktail frequency as `common: true`; groups ingredients into shelves in `SHELVES` order; sorts each shelf's ingredients common-first then by name.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/lib/bar/build-index.test.ts
import { describe, expect, it } from 'vitest'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'

const INGREDIENTS: RawIngredient[] = [
  { id: 'gin', name: 'Gin', slug: 'gin', category: 'spirits' },
  { id: 'rum', name: 'White Rum', slug: 'white-rum', category: 'spirits' },
  { id: 'vermouth', name: 'Sweet Vermouth', slug: 'sweet-vermouth', category: 'wine' },
  { id: 'lime', name: 'Lime Juice', slug: 'lime-juice', category: 'fresh' },
  { id: 'water', name: 'Water', slug: 'water', category: 'mixers' },
  { id: 'ice', name: 'Ice', slug: 'ice', category: 'fresh' },
  { id: 'mint', name: 'Mint', slug: 'fresh-mint', category: 'garnishes' },
]

const COCKTAILS: RawCocktail[] = [
  { slug: 'gimlet', name: 'Gimlet', baseSpirit: 'gin', ingredientIds: ['gin', 'lime', 'water', 'ice'] },
  { slug: 'martini', name: 'Martini', baseSpirit: 'gin', ingredientIds: ['gin', 'vermouth', 'ice', 'mint', 'ghost'] },
  { slug: 'daiquiri', name: 'Daiquiri', baseSpirit: 'white-rum', ingredientIds: ['rum', 'lime'] },
]

describe('buildBarData', () => {
  it('strips assumed basics from each cocktail core', () => {
    const { index } = buildBarData(COCKTAILS, INGREDIENTS)
    const gimlet = index.find((c) => c.slug === 'gimlet')!
    expect(gimlet.coreIngredientIds.sort()).toEqual(['gin', 'lime'])
  })

  it('drops basics, garnish-category refs and dangling ids from the core', () => {
    // martini references ice (basic), mint (garnish category) and ghost (no such
    // ingredient) — the core is only the shelvable ingredients it needs.
    const { index } = buildBarData(COCKTAILS, INGREDIENTS)
    const martini = index.find((c) => c.slug === 'martini')!
    expect(martini.coreIngredientIds.sort()).toEqual(['gin', 'vermouth'])
  })

  it('excludes garnish-category ingredients from the shelves', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const all = shelves.flatMap((s) => s.ingredients.map((i) => i.id))
    expect(all).not.toContain('mint')
  })

  it('groups ingredients into shelves in display order', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    expect(shelves.map((s) => s.id)).toEqual(['spirits', 'wines-liqueurs', 'mixers', 'fresh', 'bitters'])
    expect(shelves.find((s) => s.id === 'spirits')!.ingredients.map((i) => i.id).sort()).toEqual(['gin', 'rum'])
  })

  it('marks the most-used ingredients per shelf as common', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS, 1)
    const spirits = shelves.find((s) => s.id === 'spirits')!.ingredients
    // gin appears in 2 cocktails, rum in 1 -> gin is the single common spirit
    expect(spirits.find((i) => i.id === 'gin')!.common).toBe(true)
    expect(spirits.find((i) => i.id === 'rum')!.common).toBe(false)
  })

  it('assigns a vessel shape to each ingredient', () => {
    const { shelves } = buildBarData(COCKTAILS, INGREDIENTS)
    const lime = shelves.find((s) => s.id === 'fresh')!.ingredients.find((i) => i.id === 'lime')!
    expect(lime.vessel).toBe('carton')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/bar/build-index.test.ts`
Expected: FAIL — cannot resolve `@/lib/bar/build-index`.

- [ ] **Step 3: Write the builder**

```typescript
// src/lib/bar/build-index.ts
import { SHELVES, shelfForCategory, vesselForCategory, ASSUMED_BASIC_SLUGS } from './config'
import type { BarData, BarIngredient, CocktailIndexItem, ShelfGroup } from './types'

export interface RawCocktail {
  slug: string
  name: string
  baseSpirit: string
  ingredientIds: string[]
}

export interface RawIngredient {
  id: string
  name: string
  slug: string
  category: string
}

const DEFAULT_COMMON_PER_SHELF = 8

export function buildBarData(
  cocktails: RawCocktail[],
  ingredients: RawIngredient[],
  commonPerShelf: number = DEFAULT_COMMON_PER_SHELF,
): BarData {
  const basicIds = new Set(
    ingredients.filter((i) => ASSUMED_BASIC_SLUGS.includes(i.slug)).map((i) => i.id),
  )

  // Ingredients that can sit on a shelf (mapped to a shelf, not an assumed basic).
  const shelvable: BarIngredient[] = ingredients
    .filter((i) => !basicIds.has(i.id))
    .map((i) => {
      const shelf = shelfForCategory(i.category)
      if (!shelf) return null
      return {
        id: i.id,
        name: i.name,
        slug: i.slug,
        category: i.category,
        shelf,
        vessel: vesselForCategory(i.category),
        common: false,
      }
    })
    .filter((x): x is BarIngredient => x !== null)
  const shelvableIds = new Set(shelvable.map((i) => i.id))

  // Compact index: a cocktail's core is exactly the shelvable ingredients it
  // needs. Assumed basics, garnish-category refs and dangling ids all fall away,
  // so a data glitch never leaves a cocktail permanently unmakeable.
  const index: CocktailIndexItem[] = cocktails.map((c) => ({
    slug: c.slug,
    name: c.name,
    baseSpirit: c.baseSpirit,
    coreIngredientIds: Array.from(new Set(c.ingredientIds)).filter((id) => shelvableIds.has(id)),
  }))

  // Frequency: how many cocktails need each shelvable ingredient.
  const frequency = new Map<string, number>()
  for (const item of index) {
    for (const id of item.coreIngredientIds) {
      frequency.set(id, (frequency.get(id) ?? 0) + 1)
    }
  }

  const shelves: ShelfGroup[] = SHELVES.map(({ id, label }) => {
    const members = shelvable.filter((i) => i.shelf === id)
    const topIds = new Set(
      [...members]
        .sort((a, b) => (frequency.get(b.id) ?? 0) - (frequency.get(a.id) ?? 0) || a.name.localeCompare(b.name))
        .slice(0, commonPerShelf)
        .map((i) => i.id),
    )
    const ingredients = members
      .map((i) => ({ ...i, common: topIds.has(i.id) }))
      .sort((a, b) => Number(b.common) - Number(a.common) || a.name.localeCompare(b.name))
    return { id, label, ingredients }
  })

  return { index, shelves }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/bar/build-index.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/bar/build-index.ts tests/unit/lib/bar/build-index.test.ts
git commit -m "feat(bar): index builder with per-shelf common-bottle ranking"
```

---

### Task 4: Sanity queries for the bar index

**Files:**
- Modify: `src/sanity/queries.ts` (append two exports)
- Test: none (GROQ strings; verified at build in Task 5)

**Interfaces:**
- Produces: `barIndexQuery` (returns `RawCocktail[]`-shaped rows) and `barIngredientsQuery` (returns `RawIngredient[]`-shaped rows).

- [ ] **Step 1: Append the queries**

Add to the end of `src/sanity/queries.ts`:

```typescript
// "What's in my bar" tool: compact cocktail -> ingredient-id index.
export const barIndexQuery = `*[_type == "cocktail" && defined(slug.current)]{
  "slug": slug.current,
  name,
  baseSpirit,
  "ingredientIds": ingredients[defined(ingredientRef)].ingredientRef._ref
}`

// "What's in my bar" tool: shelvable ingredients (garnishes excluded).
export const barIngredientsQuery = `*[_type == "ingredient" && defined(slug.current) && category != "garnishes"]{
  "id": _id,
  name,
  "slug": slug.current,
  category
}`
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/sanity/queries.ts
git commit -m "feat(bar): GROQ queries for the bar index and shelvable ingredients"
```

---

### Task 5: ISR server page

**Files:**
- Create: `src/app/field-manual/whats-in-my-bar/page.tsx`
- (depends on Task 9's `BarClient`; until then, render a placeholder so the page builds — replaced in Task 9)

**Interfaces:**
- Consumes: `client`, `barIndexQuery`, `barIngredientsQuery`, `buildBarData`, `RawCocktail`, `RawIngredient`.
- Produces: a default-exported async server component at route `/field-manual/whats-in-my-bar/` that computes `BarData` and passes it to the client component.

- [ ] **Step 1: Write the page (placeholder client until Task 9)**

```tsx
// src/app/field-manual/whats-in-my-bar/page.tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { client } from '@/sanity/lib/client'
import { barIndexQuery, barIngredientsQuery } from '@/sanity/queries'
import { buildBarData, type RawCocktail, type RawIngredient } from '@/lib/bar/build-index'
import Breadcrumbs from '@/components/Breadcrumbs'
import BarClient from './BarClient'

export const metadata: Metadata = {
  title: "What's in My Bar",
  description:
    'Mark the bottles you own and see which cocktails you can make now, and which you are one bottle away from. A free tool from the Jerry Can Spirits Field Manual.',
  alternates: { canonical: 'https://jerrycanspirits.co.uk/field-manual/whats-in-my-bar/' },
}

export default async function WhatsInMyBarPage() {
  const [cocktails, ingredients] = await Promise.all([
    client.fetch<RawCocktail[]>(barIndexQuery, {}, { next: { revalidate: 3600 } }),
    client.fetch<RawIngredient[]>(barIngredientsQuery, {}, { next: { revalidate: 3600 } }),
  ])
  const barData = buildBarData(cocktails, ingredients)

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 mb-8">
        <Breadcrumbs items={[{ label: 'Field Manual', href: '/field-manual/' }, { label: "What's in My Bar" }]} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-3">What&apos;s in my bar</h1>
        <p className="text-lg text-parchment-300 max-w-3xl">
          Stock your backbar, and see what you can pour tonight. Tap a bottle to add it to your shelf.
        </p>
      </div>
      <Suspense>
        <BarClient data={barData} />
      </Suspense>
    </>
  )
}
```

- [ ] **Step 2: Verify Breadcrumbs props**

Run: `grep -n "interface\|items" src/components/Breadcrumbs.tsx | head`
Expected: confirms `items` is `{ label: string; href?: string }[]`. If the prop shape differs, adjust the `items` array to match.

- [ ] **Step 3: Commit (page compiles once Task 9 lands)**

Do not build yet — `BarClient` does not exist until Task 9. This task is committed together with Task 9. Skip the commit here and proceed; the page + client are one shippable unit.

> **Note for the executor:** Tasks 5–9 form one deliverable (a working page). Build/verify at the end of Task 9. Commit each component task's file as you go, but the first green `npm run build` is at Task 9 Step "verify".

---

### Task 6: Bottle silhouette component (inline SVG shape library)

**Files:**
- Create: `src/app/field-manual/whats-in-my-bar/BottleSilhouette.tsx`

**Interfaces:**
- Consumes: `VesselType` from `@/lib/bar/types`.
- Produces: `export default function BottleSilhouette({ vessel, lit }: { vessel: VesselType; lit: boolean })` — an inline `<svg>` (aria-hidden) rendering the shape for `vessel`, styled lit (amber fill + glow) or dark.

- [ ] **Step 1: Write the component**

```tsx
// src/app/field-manual/whats-in-my-bar/BottleSilhouette.tsx
import type { VesselType } from '@/lib/bar/types'

// Simple silhouette paths on a 40x110 viewBox. Placeholder art; a designer can
// refine the shapes later without changing this component's contract.
const PATHS: Record<VesselType, string> = {
  spirit: 'M16,4 h8 v8 h1 v7 q7,4 7,15 v65 q0,7 -7,7 h-10 q-7,0 -7,-7 v-65 q0,-11 7,-15 v-7 h1 z',
  wine: 'M17,3 h6 v46 q9,4 9,18 v36 q0,7 -6,7 h-12 q-6,0 -6,-7 v-36 q0,-14 9,-18 v-46 z',
  liqueur: 'M15,10 h10 v12 q8,3 8,13 v57 q0,7 -7,7 h-12 q-7,0 -7,-7 v-57 q0,-10 8,-13 v-12 z',
  carton: 'M8,30 l12,-14 l12,14 v72 q0,4 -4,4 h-16 q-4,0 -4,-4 z',
  can: 'M11,20 h18 q3,0 3,5 v76 q0,5 -5,5 h-14 q-5,0 -5,-5 v-76 q0,-5 3,-5 z',
  dash: 'M17,6 h6 v10 q6,2 6,10 v58 q0,6 -6,6 h-6 q-6,0 -6,-6 v-58 q0,-8 6,-10 z',
}

export default function BottleSilhouette({ vessel, lit }: { vessel: VesselType; lit: boolean }) {
  return (
    <svg
      viewBox="0 0 40 110"
      className={`h-20 w-auto transition duration-200 ${lit ? 'drop-shadow-[0_0_6px_rgba(255,205,120,0.55)]' : ''}`}
      aria-hidden="true"
    >
      <path
        d={PATHS[vessel]}
        className={lit ? 'fill-gold-300' : 'fill-jerry-green-900'}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="0.6"
      />
    </svg>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (If `fill-gold-300` / `fill-jerry-green-900` are not valid Tailwind utilities in this project, replace with `style={{ fill: lit ? '#e8c66a' : '#14100b' }}` — confirm against `src/lib/design-tokens.ts`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/field-manual/whats-in-my-bar/BottleSilhouette.tsx
git commit -m "feat(bar): inline SVG bottle silhouettes by vessel type"
```

---

### Task 7: Backbar (shelves, slots, per-shelf add)

**Files:**
- Create: `src/app/field-manual/whats-in-my-bar/Backbar.tsx`

**Interfaces:**
- Consumes: `ShelfGroup`, `BarIngredient` from `@/lib/bar/types`; `BottleSilhouette`.
- Produces: `export default function Backbar({ shelves, owned, onToggle, onAddRequest, extraByShelf }: BackbarProps)` where
  `BackbarProps = { shelves: ShelfGroup[]; owned: Set<string>; onToggle: (id: string) => void; onAddRequest: (shelf: ShelfId) => void; extraByShelf: Record<string, string[]> }`.
  Renders each shelf: its common bottles plus any `extraByShelf[shelfId]` ids (added via search), each as a toggle button (lit when in `owned`), a wood plank, and a per-shelf "＋ add" button that calls `onAddRequest`. The add-picker modal itself is owned by `BarClient` (Task 9), scoped to the shelf's ingredients.

- [ ] **Step 1: Write the component**

```tsx
// src/app/field-manual/whats-in-my-bar/Backbar.tsx
'use client'

import type { BarIngredient, ShelfGroup, ShelfId } from '@/lib/bar/types'
import BottleSilhouette from './BottleSilhouette'

interface BackbarProps {
  shelves: ShelfGroup[]
  owned: Set<string>
  onToggle: (id: string) => void
  onAddRequest: (shelf: ShelfId) => void
  // ids the user added to a shelf via search (beyond the common set)
  extraByShelf: Record<string, string[]>
}

function BottleButton({
  ingredient,
  lit,
  onToggle,
}: {
  ingredient: BarIngredient
  lit: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={lit}
      onClick={() => onToggle(ingredient.id)}
      className="flex w-[52px] flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded"
    >
      <span className={`text-[8px] mb-0.5 ${lit ? 'text-gold-300' : 'text-transparent'}`} aria-hidden="true">✓</span>
      <BottleSilhouette vessel={ingredient.vessel} lit={lit} />
      <span className={`mt-1 text-[9px] leading-tight text-center ${lit ? 'text-gold-200 font-semibold' : 'text-parchment-400/60'}`}>
        {ingredient.name}
      </span>
    </button>
  )
}

export default function Backbar({ shelves, owned, onToggle, onAddRequest, extraByShelf }: BackbarProps) {
  return (
    <div className="rounded-xl bg-[#140d08] p-4 sm:p-6">
      {shelves.map((shelf) => {
        const byId = new Map(shelf.ingredients.map((i) => [i.id, i]))
        const extras = (extraByShelf[shelf.id] ?? [])
          .map((id) => byId.get(id))
          .filter((x): x is BarIngredient => Boolean(x))
        const shown = [
          ...shelf.ingredients.filter((i) => i.common),
          ...extras.filter((i) => !i.common),
        ]
        return (
          <section key={shelf.id} className="mb-6 last:mb-0">
            <h2 className="text-[10px] uppercase tracking-[0.14em] text-gold-300/85 mb-2">{shelf.label}</h2>
            <div className="flex flex-wrap items-end gap-3 border-b-2 border-gold-500/30 pb-3">
              {shown.map((i) => (
                <BottleButton key={i.id} ingredient={i} lit={owned.has(i.id)} onToggle={onToggle} />
              ))}
              <button
                type="button"
                onClick={() => onAddRequest(shelf.id)}
                className="flex w-[44px] flex-col items-center text-parchment-400/70 hover:text-gold-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 rounded"
              >
                <span className="flex h-16 w-8 items-center justify-center rounded border border-dotted border-white/25 text-lg">+</span>
                <span className="mt-1 text-[9px]">add</span>
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors. (Confirm `text-parchment-*`, `text-gold-*`, `border-gold-*` utilities exist in this project; they are used across existing components, so they should.)

- [ ] **Step 3: Commit**

```bash
git add src/app/field-manual/whats-in-my-bar/Backbar.tsx
git commit -m "feat(bar): backbar shelves with lit/dim bottle toggles and per-shelf add"
```

---

### Task 8: Results panel

**Files:**
- Create: `src/app/field-manual/whats-in-my-bar/Results.tsx`

**Interfaces:**
- Consumes: `MatchResult`, `OneAway` from `@/lib/bar/match-engine`; a `nameById: Map<string,string>` for rendering missing-ingredient names.
- Produces: `export default function Results({ result, nameById }: { result: MatchResult; nameById: Map<string, string> })` — two tiers with counts and links to each cocktail at `/field-manual/cocktails/<slug>/`, and an "add X" hint per one-away row.

- [ ] **Step 1: Write the component**

```tsx
// src/app/field-manual/whats-in-my-bar/Results.tsx
import Link from 'next/link'
import type { MatchResult } from '@/lib/bar/match-engine'

export default function Results({
  result,
  nameById,
}: {
  result: MatchResult
  nameById: Map<string, string>
}) {
  const { makeable, oneAway } = result
  return (
    <div className="rounded-xl border border-gold-500/20 p-4 sm:p-6">
      <h2 className="text-xs uppercase tracking-wider text-parchment-300/70 mb-3">
        You can make <span className="text-gold-300 font-bold">· {makeable.length}</span>
      </h2>
      {makeable.length === 0 ? (
        <p className="text-sm text-parchment-400/70 mb-4">Add a couple of spirits and a mixer to get started.</p>
      ) : (
        <ul className="mb-6 divide-y divide-white/5">
          {makeable.map((c) => (
            <li key={c.slug} className="py-2 text-sm">
              <Link href={`/field-manual/cocktails/${c.slug}/`} className="text-parchment-200 hover:text-gold-300">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-xs uppercase tracking-wider text-parchment-300/70 mb-3">
        One bottle away <span className="text-gold-300 font-bold">· {oneAway.length}</span>
      </h2>
      <ul className="divide-y divide-white/5">
        {oneAway.map(({ cocktail, missingId }) => (
          <li key={cocktail.slug} className="flex items-baseline justify-between py-2 text-sm">
            <Link href={`/field-manual/cocktails/${cocktail.slug}/`} className="text-parchment-200 hover:text-gold-300">
              {cocktail.name}
            </Link>
            <span className="text-[10px] text-parchment-400/60">add {nameById.get(missingId) ?? 'one bottle'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/field-manual/whats-in-my-bar/Results.tsx
git commit -m "feat(bar): results panel (you can make / one bottle away)"
```

---

### Task 9: BarClient — state, persistence, global + scoped search, layout

**Files:**
- Create: `src/app/field-manual/whats-in-my-bar/BarClient.tsx`

**Interfaces:**
- Consumes: `BarData` from `@/lib/bar/types`; `match` from `@/lib/bar/match-engine`; `Backbar`, `Results`.
- Produces: `export default function BarClient({ data }: { data: BarData })` — the two-panel layout, owned-set state persisted to `localStorage` key `jcs:bar`, the live match, an add-picker (scoped to a shelf's categories, or global) built from `data.shelves`, and a "clear" control.

- [ ] **Step 1: Write the component**

```tsx
// src/app/field-manual/whats-in-my-bar/BarClient.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import type { BarData, BarIngredient, ShelfId } from '@/lib/bar/types'
import { match } from '@/lib/bar/match-engine'
import Backbar from './Backbar'
import Results from './Results'

const STORAGE_KEY = 'jcs:bar'

export default function BarClient({ data }: { data: BarData }) {
  const [owned, setOwned] = useState<Set<string>>(new Set())
  const [extraByShelf, setExtraByShelf] = useState<Record<string, string[]>>({})
  const [picker, setPicker] = useState<{ shelf: ShelfId | 'all'; query: string } | null>(null)

  // Load persisted bar on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setOwned(new Set(JSON.parse(raw) as string[]))
    } catch {
      // ignore malformed storage
    }
  }, [])

  // Persist on change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...owned]))
    } catch {
      // ignore write failures (private mode etc.)
    }
  }, [owned])

  const allIngredients = useMemo<BarIngredient[]>(
    () => data.shelves.flatMap((s) => s.ingredients),
    [data.shelves],
  )
  const nameById = useMemo(() => new Map(allIngredients.map((i) => [i.id, i.name])), [allIngredients])

  const result = useMemo(() => match(owned, data.index), [owned, data.index])

  function toggle(id: string) {
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // When a bottle is added from the picker, own it and pin it to its shelf.
  function addIngredient(i: BarIngredient) {
    setExtraByShelf((prev) => {
      const list = prev[i.shelf] ?? []
      return list.includes(i.id) ? prev : { ...prev, [i.shelf]: [...list, i.id] }
    })
    setOwned((prev) => new Set(prev).add(i.id))
    setPicker(null)
  }

  const pickerMatches = useMemo<BarIngredient[]>(() => {
    if (!picker) return []
    const q = picker.query.trim().toLowerCase()
    return allIngredients
      .filter((i) => (picker.shelf === 'all' ? true : i.shelf === picker.shelf))
      .filter((i) => (q ? i.name.toLowerCase().includes(q) : true))
      .slice(0, 40)
  }, [picker, allIngredients])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPicker({ shelf: 'all', query: '' })}
          className="text-sm text-gold-300 hover:text-gold-200 underline decoration-dotted"
        >
          Search all ingredients
        </button>
        {owned.size > 0 && (
          <button type="button" onClick={() => setOwned(new Set())} className="text-sm text-parchment-400/70 hover:text-parchment-200">
            Clear my bar
          </button>
        )}
      </div>

      <div className="flex flex-col gap-5 md:flex-row">
        <div className="md:basis-[56%]">
          <Backbar
            shelves={data.shelves}
            owned={owned}
            onToggle={toggle}
            onAddRequest={(shelf) => setPicker({ shelf, query: '' })}
            extraByShelf={extraByShelf}
          />
        </div>
        <div className="md:flex-1">
          <Results result={result} nameById={nameById} />
        </div>
      </div>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-24" onClick={() => setPicker(null)}>
          <div className="w-full max-w-md rounded-xl border border-gold-500/30 bg-jerry-green-900 p-4" onClick={(e) => e.stopPropagation()}>
            <label htmlFor="bar-add-search" className="sr-only">Search ingredients</label>
            <input
              id="bar-add-search"
              autoFocus
              value={picker.query}
              onChange={(e) => setPicker({ ...picker, query: e.target.value })}
              placeholder={picker.shelf === 'all' ? 'Search any ingredient…' : 'Search this shelf…'}
              className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-parchment-100"
            />
            <ul className="mt-3 max-h-72 overflow-y-auto">
              {pickerMatches.map((i) => (
                <li key={i.id}>
                  <button
                    type="button"
                    onClick={() => addIngredient(i)}
                    className="flex w-full items-center justify-between px-2 py-2 text-left text-sm text-parchment-200 hover:bg-white/5 rounded"
                  >
                    <span>{i.name}</span>
                    <span className="text-[10px] text-parchment-400/60">{owned.has(i.id) ? 'in bar' : 'add'}</span>
                  </button>
                </li>
              ))}
              {pickerMatches.length === 0 && <li className="px-2 py-3 text-sm text-parchment-400/60">No matches.</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck, lint, unit tests, build**

Run:
```
npx tsc --noEmit
npx eslint src/app/field-manual/whats-in-my-bar src/lib/bar
npm run test:unit
npm run build
```
Expected: tsc clean; eslint clean; all bar unit tests pass; build compiles and generates the `/field-manual/whats-in-my-bar` route (SSG/ISR).

- [ ] **Step 3: Manual verification checklist (dev server)**

Run: `npm run dev`, open `http://localhost:3000/field-manual/whats-in-my-bar/`. Confirm:
- Shelves render with common bottles dimmed; tapping one lights it and updates both result tiers.
- Per-shelf "＋ add" opens a picker listing only that shelf's ingredients; "Search all ingredients" lists everything.
- Adding a bottle pins it to its shelf and lights it.
- Reload the page: the bar persists (localStorage). "Clear my bar" empties it.
- Narrow the window to ~390px: the two panels stack, backbar above results.

- [ ] **Step 4: Commit**

```bash
git add src/app/field-manual/whats-in-my-bar/BarClient.tsx src/app/field-manual/whats-in-my-bar/page.tsx
git commit -m "feat(bar): backbar tool page with live matching, search and persistence"
```

---

### Task 10: Entry points and final verification

**Files:**
- Modify: `src/app/field-manual/page.tsx` (add a card/link to the tool)
- Modify: `src/components/Footer.tsx:62-67` (add "What's in my bar" to the Explore group, with trailing slash)

**Interfaces:**
- Consumes: the finished route.
- Produces: navigable entry points.

- [ ] **Step 1: Add a footer link**

In `src/components/Footer.tsx`, inside the `Explore` group's `links` array (near `/field-manual/`), add:

```typescript
{ name: "What's in my bar", href: '/field-manual/whats-in-my-bar/' },
```

- [ ] **Step 2: Add a Field Manual hub entry**

In `src/app/field-manual/page.tsx`, the section cards (Cocktails / Ingredients /
Equipment) are each a `<ScrollReveal delay={n}>` wrapping a `<Link className="group h-full">`.
Immediately after the Equipment card's closing `</ScrollReveal>` (the third card,
around line 300), insert this fourth card, matching the established markup:

```tsx
          {/* What's in my bar Section */}
          <ScrollReveal delay={3}>
          <Link href="/field-manual/whats-in-my-bar/" className="group h-full">
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8l-1 6a4 4 0 01-6 0L8 3zM12 13v8m-4 0h8" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">What&apos;s in my bar</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Pour What You Have
                  </div>
                </div>
                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Mark the bottles you own and see which cocktails you can make now, and which you are one bottle away from.
                </p>
                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">• Stock your backbar</div>
                  <div className="text-parchment-300">• Live "you can make" results</div>
                  <div className="text-parchment-300">• Saved between visits</div>
                </div>
              </div>
            </div>
          </Link>
          </ScrollReveal>
```

The three existing cards sit in a responsive grid. Adding a fourth makes it a
2x2 on desktop; confirm the grid wrapper wraps rather than forcing three columns
(check the parent `grid`/`grid-cols-*` class around line 173 and, if it is
`lg:grid-cols-3`, change to `lg:grid-cols-2` or `lg:grid-cols-4` so four cards
balance — pick whichever reads better at that width).

- [ ] **Step 3: Typecheck, lint, build**

Run:
```
npx tsc --noEmit
npx eslint src/components/Footer.tsx src/app/field-manual/page.tsx
npm run build
```
Expected: all clean; the tool route and both entry points build.

- [ ] **Step 4: Commit and open PR**

```bash
git add src/components/Footer.tsx src/app/field-manual/page.tsx
git commit -m "feat(bar): link the What's in my bar tool from the Field Manual hub and footer"
```

Then push the feature branch and open a PR to `main` summarising the tool, the ISR-fresh index, and the pure-engine test coverage.

---

## Out of scope (do not build)

- Photographic bottle art / bespoke illustration (SVG silhouettes only).
- Visual polish: final silhouette shapes, bottle spacing/density, wood texture.
- An editorial `vesselType` field on the ingredient doc.
- The guided "best next bottle" nudge (the engine's `oneAway` output already supports it; a later UI layer).
- Phase 2 SEO gateway pages.
- Allergen/dietary filtering.
