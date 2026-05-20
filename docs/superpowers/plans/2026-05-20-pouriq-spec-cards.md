# Pour IQ™ Spec Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a print-styled spec-card page for every Pour IQ™ menu in time for the Thursday 21 May 2026 pilot meeting with The Bank Bar & Grill.

**Architecture:** Pure re-render of existing `pouriq_cocktails` + `pouriq_ingredients` data. One new server-component route (`/trade/pouriq/[menuId]/specs/`), one new presentational component (`SpecCard`), one button on the existing menu detail page. No new tables, no client interactivity, no AI calls.

**Tech Stack:** Next.js 15 App Router, React server components, TypeScript, Tailwind CSS (with `print:` utilities for the print layout), Cloudflare D1 via OpenNext.

**Spec:** `docs/superpowers/specs/2026-05-20-pouriq-spec-cards-design.md`

**Working branch:** `feat/pouriq-spec-cards` (already created off `origin/main`, spec already committed).

**Testing policy for this PR:** Manual smoke tests + `npx tsc --noEmit`. No automated test additions. Matches the precedent set by the `menu-copy` and `variance-lite` features per the approved spec.

---

## Task 1: SpecCard component scaffold — props, helpers, header

**Files:**
- Create: `src/components/pouriq/SpecCard.tsx`

- [ ] **Step 1: Create the component file with props interface, helpers, and header section**

Create `src/components/pouriq/SpecCard.tsx`:

```tsx
import type { CocktailWithIngredients } from '@/lib/pouriq/types'

interface Props {
  cocktail: CocktailWithIngredients
  priceIncludesVat: boolean
}

function formatPrice(pence: number, vatIncluded: boolean): string {
  const pounds = pence / 100
  return `£${pounds.toFixed(2)}${vatIncluded ? '' : ' net'}`
}

export function SpecCard({ cocktail, priceIncludesVat }: Props) {
  return (
    <article
      className="
        mb-12 p-8
        bg-jerry-green-800/40 border border-gold-500/30 rounded-xl
        print:bg-white print:border-stone-300 print:rounded-none print:p-6 print:mb-0
        print:break-before-page print:first:break-before-auto
      "
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-gold-500/20 print:border-stone-300 mb-4">
        <h2 className="text-3xl font-serif font-bold text-white print:text-black">
          {cocktail.name}
        </h2>
        <p className="font-mono text-2xl text-gold-300 print:text-black">
          {formatPrice(cocktail.sale_price_p, priceIncludesVat)}
        </p>
      </header>
    </article>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/SpecCard.tsx
git commit -m "feat(pouriq): SpecCard scaffold with header section"
```

---

## Task 2: SpecCard — garnish line + ingredients list

**Files:**
- Modify: `src/components/pouriq/SpecCard.tsx`

- [ ] **Step 1: Add measure formatter helper and ingredient sections**

Replace the body of `src/components/pouriq/SpecCard.tsx` with this expanded version (additions: `formatMeasure`, garnish/pour-ingredient split, garnish line, ingredients section):

```tsx
import type { CocktailWithIngredients } from '@/lib/pouriq/types'

interface Props {
  cocktail: CocktailWithIngredients
  priceIncludesVat: boolean
}

function formatPrice(pence: number, vatIncluded: boolean): string {
  const pounds = pence / 100
  return `£${pounds.toFixed(2)}${vatIncluded ? '' : ' net'}`
}

function formatMeasure(pour_ml: number | null, unit_count: number | null): string {
  if (pour_ml != null) return `${pour_ml}ml`
  if (unit_count != null) return unit_count === 1 ? '1 unit' : `${unit_count} units`
  return ''
}

export function SpecCard({ cocktail, priceIncludesVat }: Props) {
  const garnishes = cocktail.ingredients.filter(
    (i) => i.library.ingredient_type === 'garnish'
  )
  const pourIngredients = cocktail.ingredients.filter(
    (i) => i.library.ingredient_type !== 'garnish'
  )

  return (
    <article
      className="
        mb-12 p-8
        bg-jerry-green-800/40 border border-gold-500/30 rounded-xl
        print:bg-white print:border-stone-300 print:rounded-none print:p-6 print:mb-0
        print:break-before-page print:first:break-before-auto
      "
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-gold-500/20 print:border-stone-300 mb-4">
        <h2 className="text-3xl font-serif font-bold text-white print:text-black">
          {cocktail.name}
        </h2>
        <p className="font-mono text-2xl text-gold-300 print:text-black">
          {formatPrice(cocktail.sale_price_p, priceIncludesVat)}
        </p>
      </header>

      {garnishes.length > 0 && (
        <p className="text-sm text-parchment-300 print:text-black mb-6">
          <span className="font-semibold">Garnish:</span>{' '}
          {garnishes.map((g) => g.library.name).join(', ')}
        </p>
      )}

      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
          Ingredients
        </h3>
        {pourIngredients.length === 0 ? (
          <p className="text-sm italic text-parchment-400 print:text-stone-600">
            No ingredients recorded yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {pourIngredients.map((i) => (
              <li
                key={i.id}
                className="text-sm text-parchment-200 print:text-black flex gap-3"
              >
                <span className="font-mono w-20 flex-shrink-0">
                  {formatMeasure(i.pour_ml, i.unit_count)}
                </span>
                <span>{i.library.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/SpecCard.tsx
git commit -m "feat(pouriq): SpecCard renders garnish line and ingredient list"
```

---

## Task 3: SpecCard — note, description, Field Manual link

**Files:**
- Modify: `src/components/pouriq/SpecCard.tsx`

- [ ] **Step 1: Add the three conditional sections at the bottom of the card**

Inside the `<article>` in `src/components/pouriq/SpecCard.tsx`, immediately after the existing ingredients `<section>` closing tag and before the article's closing tag, insert:

```tsx
      {cocktail.notes != null && cocktail.notes.trim() !== '' && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
            Note
          </h3>
          <p className="text-sm italic text-parchment-300 print:text-stone-700">
            {cocktail.notes}
          </p>
        </section>
      )}

      {cocktail.description != null && cocktail.description.trim() !== '' && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
            Tell the customer
          </h3>
          <p className="text-sm text-parchment-200 print:text-black leading-relaxed">
            {cocktail.description}
          </p>
        </section>
      )}

      {cocktail.field_manual_slug != null && (
        <a
          href={`https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.field_manual_slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gold-300 hover:text-gold-200 print:text-black print:underline border-b border-gold-500/30 hover:border-gold-400 print:border-none pb-1"
        >
          Full method &amp; technique
          <span aria-hidden="true" className="ml-2 print:hidden">→</span>
        </a>
      )}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/SpecCard.tsx
git commit -m "feat(pouriq): SpecCard conditional note, description, and Field Manual link"
```

---

## Task 4: /specs/ route — server component with access gate and data fetch

**Files:**
- Create: `src/app/trade/pouriq/[menuId]/specs/page.tsx`

- [ ] **Step 1: Create the route file**

Create `src/app/trade/pouriq/[menuId]/specs/page.tsx`:

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu, listCocktailsForMenu } from '@/lib/pouriq/menus'
import { SpecCard } from '@/components/pouriq/SpecCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
}

export default async function SpecCardsPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktails = await listCocktailsForMenu(db, menuId)
  const priceIncludesVat = menu.prices_include_vat === 1

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link
          href={`/trade/pouriq/${menuId}`}
          className="text-sm text-parchment-400 hover:text-parchment-200"
        >
          ← {menu.name}
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-6 mb-8">
          Spec cards ({cocktails.length})
        </h1>
        <p className="text-parchment-300">
          Loaded {cocktails.length} cocktails. Render coming next task.
        </p>
        <p className="text-parchment-500 text-xs mt-2">
          priceIncludesVat: {String(priceIncludesVat)}
        </p>
      </div>
    </main>
  )
}
```

The placeholder rendering at the bottom is intentional — it confirms data fetch and prop shape before we wire SpecCard in (Task 5).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/specs/page.tsx
git commit -m "feat(pouriq): specs route scaffolded with access gate and data fetch"
```

---

## Task 5: /specs/ route — render SpecCards, page chrome, empty state

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/specs/page.tsx`

- [ ] **Step 1: Replace the page body with the full render**

Replace the entire `return (...)` block in `src/app/trade/pouriq/[menuId]/specs/page.tsx` with the complete version. The full file becomes:

```tsx
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu, listCocktailsForMenu } from '@/lib/pouriq/menus'
import { SpecCard } from '@/components/pouriq/SpecCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
}

export default async function SpecCardsPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktails = await listCocktailsForMenu(db, menuId)
  const priceIncludesVat = menu.prices_include_vat === 1

  const reportDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <main className="min-h-screen print-region">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="no-print">
          <Link
            href={`/trade/pouriq/${menuId}`}
            className="text-sm text-parchment-400 hover:text-parchment-200"
          >
            ← {menu.name}
          </Link>
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Pour IQ™
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
            Spec cards
          </h1>
          <p className="text-parchment-300 text-base leading-relaxed mb-8">
            Every drink on this menu as a one-page training reference. Open your browser&apos;s print dialog for one card per page. Print the lot, or pick a range.
          </p>
        </div>

        <div className="hidden print:block mb-6 pb-4 border-b border-stone-300">
          <p className="text-xs uppercase tracking-widest">Pour IQ™ spec cards</p>
          <p className="text-xs">
            {menu.name} · Generated {reportDate}
          </p>
        </div>

        {cocktails.length === 0 ? (
          <p className="text-parchment-300">
            No drinks on this menu yet.{' '}
            <Link
              href={`/trade/pouriq/${menuId}`}
              className="text-gold-300 hover:text-gold-200 underline"
            >
              Add or import drinks
            </Link>{' '}
            first.
          </p>
        ) : (
          <div>
            {cocktails.map((c) => (
              <SpecCard key={c.id} cocktail={c} priceIncludesVat={priceIncludesVat} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/specs/page.tsx
git commit -m "feat(pouriq): specs route renders SpecCards with empty state and print header"
```

---

## Task 6: Menu page entry point — add "Spec cards" button

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`

- [ ] **Step 1: Add the new link to the header action row**

In `src/app/trade/pouriq/[menuId]/page.tsx`, find the existing Menu copy link (around the header action row). It looks like:

```tsx
<Link href={`/trade/pouriq/${menuId}/menu-copy`} className={SECONDARY_BUTTON}>Menu copy</Link>
```

Immediately after that line (still inside the same JSX block that's guarded by `cocktails.length > 0`), add:

```tsx
              <Link href={`/trade/pouriq/${menuId}/specs`} className={SECONDARY_BUTTON}>Spec cards</Link>
```

The indentation should match the surrounding lines (look at the surrounding `Link` elements in the same block). The `SECONDARY_BUTTON` constant is already imported at the top of the file via the existing import line `import { PRIMARY_BUTTON, SECONDARY_BUTTON, SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/pouriq/[menuId]/page.tsx
git commit -m "feat(pouriq): menu page links to new spec cards route"
```

---

## Task 7: Manual smoke test

**Files:**
- No code changes. This task confirms the feature works end-to-end before opening the PR.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

Expected: dev server boots on `http://localhost:3000`. No build errors in the terminal.

- [ ] **Step 2: Authenticate as the pilot trade account**

In a browser, visit `http://localhost:3000/trade/login`. Sign in with the pilot account that has Pour IQ™ access and at least one menu populated.

- [ ] **Step 3: Walk the happy path**

Open a Pour IQ™ menu that has cocktails with ingredients. Confirm:
- The menu page header action row shows a new "Spec cards" button alongside "Menu copy."
- Clicking the button navigates to `/trade/pouriq/<menuId>/specs/`.
- The page renders one card per cocktail, in menu position order.
- Each card shows: name, price, garnish (when applicable), ingredient list with measures.
- The back link "← <menu name>" returns to the menu detail page.

- [ ] **Step 4: Confirm conditional sections work**

For a single menu, exercise the three conditional sections:
- A cocktail with `notes` set: confirm "Note" section renders in italic.
- A cocktail with `description` set: confirm "Tell the customer" section renders.
- A cocktail with `field_manual_slug` set: confirm "Full method &amp; technique" link renders and opens the public Field Manual page in a new tab.
- A cocktail with none of these: confirm those sections are absent — no empty placeholders.

If your test menu does not include any cocktail with `field_manual_slug` set, manually set one on a cocktail via the edit UI (or D1 query) to verify the link renders.

- [ ] **Step 5: Confirm the empty state**

Open or create a brand-new menu with no cocktails. Navigate to its `/specs/` route. Confirm the empty-state message renders with the link back to the menu page.

- [ ] **Step 6: Print preview**

On a populated menu, open the browser's print preview (Ctrl+P / Cmd+P). Confirm:
- Each card is on its own page.
- Backgrounds are white, text is black, the on-screen Pour IQ™ chrome (back link, eyebrow chip, page heading, intro paragraph) is hidden.
- The print-only header at the top of the first page shows the menu name and report date.
- The Field Manual link, when present, shows as underlined black text without the screen-only arrow.

- [ ] **Step 7: Confirm access gates**

In a private/incognito window, hit `/trade/pouriq/<some-menu-id>/specs/` directly. Expect a redirect to `/trade/login`. After signing in to an account without a Pour IQ™ licence, expect the `LicenceGate` to render.

- [ ] **Step 8: Final type-check**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 9: Stop the dev server**

Stop the `npm run dev` process.

---

## Task 8: Open the pull request

**Files:**
- No code changes.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin feat/pouriq-spec-cards`

- [ ] **Step 2: Open the PR**

Run:

```bash
gh pr create --title "feat(pouriq): training-generator spec cards" --body "$(cat <<'EOF'
## Summary
First slice of the training-generator module from the Pour IQ™ backlog. Adds a print-styled spec-card page that renders every drink on a menu as a one-page training reference for staff.

Pure re-render of existing data. No new tables. No client interactivity. No AI calls.

## What's in
- New route `/trade/pouriq/[menuId]/specs/` (server component, PIN-gated via existing `checkPourIqAccess`).
- New `SpecCard` presentational component with conditional sections for garnish, ingredients, manager note, brand-voiced description, and Field Manual link.
- "Spec cards" button on the menu detail page header.
- Spec at `docs/superpowers/specs/2026-05-20-pouriq-spec-cards-design.md`.

## What's out (deferred to follow-on PRs)
- Per-cocktail individual URLs.
- Flash-card quiz mode.
- "New this week" briefing.
- New free-text fields for glassware or build method.

## Help guide
Section drafted in the spec under "Help guide section (drafted, ready for paste into Sanity Studio)." Paste into Sanity once merged, per the standard Pour IQ™ help-guide content workflow.

## Test plan
- [ ] CI build + type checks pass
- [ ] Visit `/trade/pouriq/<menuId>/specs/` — every cocktail renders as a card
- [ ] Cards with notes / descriptions / field_manual_slug render the right sections
- [ ] Cards without those fields omit the sections cleanly
- [ ] Empty menu shows the empty state
- [ ] Print preview: one card per page, colours flip, screen-only chrome hidden
- [ ] Access gates: no session redirects to login, no licence renders LicenceGate

## Demo path for Thursday's pilot meeting
1. Log into the pilot's Pour IQ™ account
2. Open The Bank Bar & Grill's menu
3. Click "Spec cards" in the header
4. Walk through one card with Riccardo's team
5. Open browser print preview — one card per A4 page
6. Discuss next iteration: build-method field, quiz mode, briefing

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Verify CI starts**

Expected output: a URL like `https://github.com/Jerry-Can-Spirits/jerry-can-spirits/pull/<n>`. Open it in a browser and confirm the build and type-check jobs are queued.

---

## After the PR is merged (operator action, not a code task)

1. Paste the help guide section from the spec into Sanity Studio under a new "Printing spec cards" entry on the `tradeHelp` singleton.
2. Update the Pour IQ™ backlog memory (`project_pour_iq_backlog.md`) to move spec cards from "Queued for later → Raised 2026-05-20" into the "Shipped" list with the PR number and date.
