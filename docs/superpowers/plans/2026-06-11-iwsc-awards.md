# IWSC 2026 Awards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the IWSC 2026 Bronze and Silver medals on the three Expedition Spiced product pages, the homepage Accreditations list, and the Product JSON-LD.

**Architecture:** A new hardcoded server component `ProductAwards` owns the award data and the list of awarded product handles, mirroring the existing `PressAwards` pattern. The product page renders it between price and description and merges the schema.org `award` property into its existing Product JSON-LD. `PressAwards` gains an optional thumbnail per award item.

**Tech Stack:** Next.js 15 App Router, server components, `next/image` with the existing Cloudflare Images custom loader, Tailwind.

**Testing note:** No React component test harness exists (vitest is node-environment, lib tests only) and these are presentational components with static data. Verification is `npm run lint` and `npm run build` — the same gate CI runs. Do not add a component testing stack.

**Spec:** `docs/superpowers/specs/2026-06-11-iwsc-awards-design.md`

**Branch:** `feat/iwsc-2026-awards` (already created from origin/main)

---

### Task 1: ProductAwards component

**Files:**
- Create: `src/components/ProductAwards.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ProductAwards.tsx` with exactly this content:

```tsx
import Image from 'next/image'

const CF_IMAGES = 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ'

interface ProductAward {
  title: string
  citation: string
  image: string
  schemaText: string
}

export const PRODUCT_AWARDS: ProductAward[] = [
  {
    title: 'IWSC 2026 Bronze',
    citation: 'Expedition Spiced.',
    image: `${CF_IMAGES}/863f3ff8-7252-477f-9627-a805f6c6a100/public`,
    schemaText: 'IWSC 2026 Bronze Medal - Expedition Spiced',
  },
  {
    title: 'IWSC 2026 Silver',
    citation: 'Expedition Spiced and cola, judged with Franklin and Sons.',
    image: `${CF_IMAGES}/2f7661db-3571-44d1-ee15-8bbd3c3cfd00/public`,
    schemaText: 'IWSC 2026 Silver Medal - Expedition Spiced and Cola',
  },
]

export const AWARDED_HANDLES = [
  'jerry-can-spirits-expedition-spiced-rum',
  'jerry-can-spirits-premium-gift-pack',
  'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
]

export default function ProductAwards() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
      {PRODUCT_AWARDS.map((award) => (
        <div key={award.title} className="flex items-center gap-3">
          <Image
            src={award.image}
            alt={`${award.title} medal. ${award.citation}`}
            width={80}
            height={80}
            className="flex-shrink-0"
          />
          <div>
            <p className="text-white font-semibold text-sm">{award.title}</p>
            <p className="text-parchment-400 text-xs mt-0.5">{award.citation}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

Notes for the implementer:
- The medal artwork already contains the IWSC branding; the caption deliberately repeats the award name for screen readers and scanners.
- The image URLs run through `src/lib/cloudflareImageLoader.ts`, which rewrites `imagedelivery.net/<hash>/<id>/public` to flexible variants (`/w=<width>,q=<quality>`). No loader or config changes needed.
- `AWARDED_HANDLES` is the same trio as `getIngredientsSlug` in the product page. Do not refactor that function; the lists serve different purposes.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors mentioning `ProductAwards.tsx` (pre-existing unrelated errors, if any, are out of scope).

- [ ] **Step 3: Commit**

```bash
git add src/components/ProductAwards.tsx
git commit -m "feat(awards): ProductAwards component with IWSC 2026 medal data"
```

---

### Task 2: Product page wiring (badges + JSON-LD)

**Files:**
- Modify: `src/app/shop/product/[handle]/page.tsx`

- [ ] **Step 1: Import the component**

In `src/app/shop/product/[handle]/page.tsx`, after the line:

```tsx
import ProductSpecifications from '@/components/ProductSpecifications'
```

add:

```tsx
import ProductAwards, { PRODUCT_AWARDS, AWARDED_HANDLES } from '@/components/ProductAwards'
```

- [ ] **Step 2: Add the award property to the Product JSON-LD**

In the same file, the `productSchema` object ends with this block (around line 377-402):

```tsx
    // Additional properties for spirits
    ...(isSpirit && {
      additionalProperty: [
```

Immediately BEFORE that `// Additional properties for spirits` comment line, insert:

```tsx
    ...(AWARDED_HANDLES.includes(handle) && {
      award: PRODUCT_AWARDS.map((a) => a.schemaText),
    }),
```

- [ ] **Step 3: Render the badges between price and description**

In the same file, the product info column contains (around line 469-499):

```tsx
                {unitPrice && (
                  <p className="text-sm text-parchment-400 mt-1">
                    ({unitPrice})
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
```

Insert the awards block so the result reads:

```tsx
                {unitPrice && (
                  <p className="text-sm text-parchment-400 mt-1">
                    ({unitPrice})
                  </p>
                )}
              </div>
            </div>

            {/* IWSC 2026 medals */}
            {AWARDED_HANDLES.includes(handle) && <ProductAwards />}

            {/* Description */}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `page.tsx`.

- [ ] **Step 5: Commit**

```bash
git add "src/app/shop/product/[handle]/page.tsx"
git commit -m "feat(awards): show IWSC 2026 medals and award schema on Expedition Spiced product pages"
```

---

### Task 3: Homepage PressAwards entries

**Files:**
- Modify: `src/components/PressAwards.tsx`

- [ ] **Step 1: Add the image field and entries**

In `src/components/PressAwards.tsx`:

1. Add the import at the top, after `import Link from 'next/link'`:

```tsx
import Image from 'next/image'
```

2. Extend the `AwardItem` interface:

```tsx
interface AwardItem {
  title: string
  body?: string
  year?: string
  image?: string
}
```

3. Append two entries to `awardItems` (after the Employer Recognition Scheme entry):

```tsx
  {
    title: 'IWSC 2026 Bronze Medal',
    body: 'Expedition Spiced. International Wine and Spirit Competition.',
    year: '2026',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/66191572-4bf8-4de0-ba4d-01aab5c20700/public',
  },
  {
    title: 'IWSC 2026 Silver Medal',
    body: 'Expedition Spiced and cola, judged with Franklin and Sons.',
    year: '2026',
    image: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2558fe93-bdf0-458c-85d6-5de6097ed300/public',
  },
```

(These are the Small PNG variants; the product page uses the Large PNGs.)

- [ ] **Step 2: Render the thumbnail when present**

In the same file, the award row currently renders:

```tsx
                  <div className="w-2 h-2 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
```

Replace that line with:

```tsx
                  {award.image ? (
                    <Image
                      src={award.image}
                      alt={`${award.title} medal`}
                      width={48}
                      height={48}
                      className="flex-shrink-0"
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-gold-400 mt-2 flex-shrink-0" />
                  )}
```

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors in `PressAwards.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/PressAwards.tsx
git commit -m "feat(awards): IWSC 2026 medals in homepage accreditations"
```

---

### Task 4: Full verification

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: passes with no new warnings or errors.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: completes successfully. This exercises `generateStaticParams` and renders product pages, so a syntax or schema error would surface here.

- [ ] **Step 3: Spot-check rendered output (if dev server practical)**

Optional but preferred. Run `npm run dev`, then check:
- `/shop/product/jerry-can-spirits-expedition-spiced-rum/` shows both medals between price and description, and page source contains `"award":["IWSC 2026 Bronze Medal - Expedition Spiced","IWSC 2026 Silver Medal - Expedition Spiced and Cola"]` inside the product-schema script tag.
- `/shop/product/jerry-can-spirits-premium-gift-pack/` and `/shop/product/jerry-can-spirits-expedition-pack-spiced-rum-6-bottles/` show the medals.
- A barware product page does NOT show the medals.
- Homepage Accreditations list shows four items, the two IWSC ones with medal thumbnails.

- [ ] **Step 4: Commit any fixes**

If lint/build surfaced fixes, commit them with a `fix(awards):` message. Otherwise nothing to commit.
