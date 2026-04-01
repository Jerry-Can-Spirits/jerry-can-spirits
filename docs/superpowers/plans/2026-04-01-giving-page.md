# Giving Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public `/giving/` page that shows where Jerry Can Spirits' 5% profit pledge goes — charity partners and contribution records — backed by two new D1 tables and rendered via two new server components.

**Architecture:** Two new D1 tables (`charities`, `charity_contributions`) added via migration `0008_charity_tables.sql`, both starting empty. The page is a server component with `dynamic = 'force-dynamic'` that fetches both datasets in a single `Promise.all` and passes them to two new display components. All data management via SQL migration files — no admin UI.

**Tech Stack:** Next.js 15 App Router, Cloudflare D1 (SQLite), TypeScript, Tailwind CSS, `@opennextjs/cloudflare`, `wrangler` CLI.

---

## File Map

| Action | File | What changes |
|---|---|---|
| Create | `migrations/0008_charity_tables.sql` | Creates `charities` and `charity_contributions` tables with indexes |
| Modify | `src/lib/d1.ts` | Append `Charity` interface, `CharityContribution` interface, `getCharities` function, `getCharityContributions` function |
| Create | `src/components/CharityCard.tsx` | Server component rendering a single charity card |
| Create | `src/components/ContributionsList.tsx` | Server component rendering contributions grouped by year |
| Create | `src/app/giving/page.tsx` | The `/giving/` page — metadata, data fetching, four sections |

---

## Chunk 1: Database Migration

### Task 1: Create and apply migration 0008

**Files:**
- Create: `migrations/0008_charity_tables.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Charity partners and contribution records
-- Apply with: wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0008_charity_tables.sql

CREATE TABLE IF NOT EXISTS charities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS charity_contributions (
  id TEXT PRIMARY KEY,
  charity_id TEXT NOT NULL REFERENCES charities(id),
  -- Note: SQLite does not enforce FK constraints by default. Data integrity via migration discipline.
  amount_gbp REAL,
  year INTEGER NOT NULL,
  period_description TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_charity_id
  ON charity_contributions(charity_id);

-- Note: DESC in index column definitions requires SQLite 3.33.0+ (2020). D1 supports this.
CREATE INDEX IF NOT EXISTS idx_charity_contributions_year
  ON charity_contributions(year DESC);
```

- [ ] **Step 2: Apply locally and verify**

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --file=migrations/0008_charity_tables.sql
```

Expected: success, no errors.

Then verify the tables exist:

```bash
npx wrangler d1 execute jerry-can-spirits-db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('charities','charity_contributions');"
```

Expected: two rows — `charities` and `charity_contributions`.

- [ ] **Step 3: Commit**

```bash
git add migrations/0008_charity_tables.sql
git commit -m "feat: add charities and charity_contributions D1 tables"
```

---

## Chunk 2: TypeScript Data Layer

### Task 2: Add charity types and queries to d1.ts

**Files:**
- Modify: `src/lib/d1.ts` (append to end of file, after the `getBatchIngredients` function)

The existing file ends at line 187 after the `getBatchIngredients` function. Do not modify anything already in the file. Append only.

- [ ] **Step 1: Append charity interfaces and query functions**

Add the following to the **end** of `src/lib/d1.ts`:

```typescript
// ── Charity Queries ──────────────────────────────────────────────────

export interface Charity {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
}

export interface CharityContribution {
  id: string;
  charity_id: string;
  amount_gbp: number | null;
  year: number;
  period_description: string;
  notes: string | null;
}

export async function getCharities(db: D1Database): Promise<Charity[]> {
  const result = await db
    .prepare(
      'SELECT id, name, description, logo_url, website_url, sort_order FROM charities ORDER BY sort_order ASC',
    )
    .all<Charity>();
  return result.results;
}

export async function getCharityContributions(
  db: D1Database,
): Promise<CharityContribution[]> {
  const result = await db
    .prepare(
      'SELECT id, charity_id, amount_gbp, year, period_description, notes FROM charity_contributions ORDER BY year DESC, created_at DESC',
    )
    .all<CharityContribution>();
  return result.results;
}
```

`created_at` is excluded from both interfaces — it is never used in rendering.

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: clean build, no TypeScript errors. The new functions are not yet called anywhere, so they are only checked for internal type correctness.

- [ ] **Step 3: Commit**

```bash
git add src/lib/d1.ts
git commit -m "feat: add Charity types and getCharities/getCharityContributions queries"
```

---

## Chunk 3: Components

### Task 3: Create CharityCard component

**Files:**
- Create: `src/components/CharityCard.tsx`

Server component. No `'use client'`. Receives pre-fetched data — no database calls inside the component.

- [ ] **Step 1: Create the component**

```tsx
import Image from 'next/image'
import type { Charity } from '@/lib/d1'

interface CharityCardProps {
  charity: Charity
}

export default function CharityCard({ charity }: CharityCardProps) {
  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
      {charity.logo_url && (
        <div className="relative h-20 w-full mb-4">
          <Image
            src={charity.logo_url}
            alt={charity.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <p className="text-white font-semibold text-lg">{charity.name}</p>
      <p className="text-parchment-300 text-sm leading-relaxed mt-2">{charity.description}</p>
      {charity.website_url && (
        <a
          href={charity.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-gold-400 text-sm hover:text-gold-300 transition-colors"
        >
          Donate directly
        </a>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: clean build. The component is not yet imported anywhere.

- [ ] **Step 3: Commit**

```bash
git add src/components/CharityCard.tsx
git commit -m "feat: add CharityCard component"
```

---

### Task 4: Create ContributionsList component

**Files:**
- Create: `src/components/ContributionsList.tsx`

Server component. No `'use client'`. Receives pre-fetched data. Groups contributions by year using a reduce over the already-sorted results (SQL returns `ORDER BY year DESC`).

- [ ] **Step 1: Create the component**

```tsx
import type { CharityContribution, Charity } from '@/lib/d1'

interface ContributionsListProps {
  contributions: CharityContribution[]
  charities: Charity[]
}

export default function ContributionsList({ contributions, charities }: ContributionsListProps) {
  if (contributions.length === 0) return null

  // Group by year, preserving DESC order from SQL
  const byYear = contributions.reduce<Record<number, CharityContribution[]>>((acc, c) => {
    if (!acc[c.year]) acc[c.year] = []
    acc[c.year].push(c)
    return acc
  }, {})

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div className="space-y-8">
      {years.map((year) => (
        <div key={year}>
          <h3 className="text-xl font-serif font-bold text-white mb-4">{year}</h3>
          <div className="space-y-4">
            {byYear[year].map((contribution) => {
              const charity = charities.find((c) => c.id === contribution.charity_id)
              const charityName = charity?.name ?? contribution.charity_id
              const amount =
                contribution.amount_gbp !== null
                  ? contribution.amount_gbp.toLocaleString('en-GB', {
                      style: 'currency',
                      currency: 'GBP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : 'Non-monetary contribution'

              return (
                <div
                  key={contribution.id}
                  className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-4"
                >
                  <p className="text-parchment-500 text-sm">{contribution.period_description}</p>
                  <p className="text-white font-medium mt-1">{charityName}</p>
                  <p className="text-gold-400 font-semibold mt-1">{amount}</p>
                  {contribution.notes && (
                    <p className="text-parchment-400 text-sm mt-2">{contribution.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/components/ContributionsList.tsx
git commit -m "feat: add ContributionsList component"
```

---

## Chunk 4: Page

### Task 5: Create the /giving/ page

**Files:**
- Create: `src/app/giving/page.tsx`

Server component. `dynamic = 'force-dynamic'` — required because D1 data is fetched at request time. Static `metadata` export (not `generateMetadata`) — metadata does not depend on fetched data.

- [ ] **Step 1: Create the page**

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { getD1, getCharities, getCharityContributions } from '@/lib/d1'
import CharityCard from '@/components/CharityCard'
import ContributionsList from '@/components/ContributionsList'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Where the 5% Goes | Jerry Can Spirits®',
  description:
    'Jerry Can Spirits donates 5% of profits to armed forces charities. A transparent record of who receives what, and when.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/giving/',
  },
}

export default async function GivingPage() {
  const db = await getD1()
  const [charities, contributions] = await Promise.all([
    getCharities(db),
    getCharityContributions(db),
  ])

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* 1. Header */}
        <div className="mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Giving Back
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Where the 5% Goes
          </h1>
          <p className="text-parchment-300 text-lg max-w-2xl">
            Five percent of profits from every bottle sold goes to armed forces charities. This page is the record.
          </p>
        </div>

        {/* 2. Commitment block — always shown */}
        <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">The Pledge</h2>
          <div className="space-y-4 text-parchment-300 leading-relaxed">
            <p>
              From the first bottle sold, five percent of profits is committed to armed forces charities. Not a one-off donation. Not a marketing claim. A standing commitment, built into how we run the company.
            </p>
            <p>
              We launched in April 2026. We have not yet reached a profit position from which to donate. When we do, it will appear here.
            </p>
            <p>
              The full commitment is set out on our{' '}
              <Link
                href="/armed-forces-covenant/"
                className="text-gold-400 hover:text-gold-300 transition-colors"
              >
                Armed Forces Covenant page
              </Link>
              .
            </p>
          </div>
        </div>

        {/* 3. Charity partners — conditional */}
        <div className="mb-12">
          {charities.length > 0 ? (
            <>
              <h2 className="text-2xl font-serif font-bold text-white mb-6">Our Charity Partners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {charities.map((charity) => (
                  <CharityCard key={charity.id} charity={charity} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-parchment-400">
              We are reviewing armed forces charities to partner with. We will announce our chosen partners ahead of our first donation.
            </p>
          )}
        </div>

        {/* 4. Contributions to date — only shown when data exists */}
        {contributions.length > 0 && (
          <div>
            <h2 className="text-2xl font-serif font-bold text-white mb-6">Contributions to Date</h2>
            <ContributionsList contributions={contributions} charities={charities} />
          </div>
        )}

      </div>
    </main>
  )
}
```

- [ ] **Step 2: Type-check and build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Visual check**

```bash
npm run dev
```

Navigate to `http://localhost:3000/giving/` and confirm:
- Gold "Giving Back" badge visible
- H1 "Where the 5% Goes" visible
- Commitment block renders with AFC link
- Empty-state charity message: "We are reviewing armed forces charities..."
- Contributions section absent (tables empty)
- Page is properly styled (dark green background, gold accents)

- [ ] **Step 4: Commit**

```bash
git add src/app/giving/page.tsx
git commit -m "feat: add /giving/ page"
```

---

## Chunk 5: Navigation and Copy Fixes

### Task 6: Add /giving/ link to footer

**Files:**
- Modify: `src/components/Footer.tsx`

The "The Brand" quick link group starts at line 38. It currently has 4 links: Home, Our Story, Sustainability, Friends & Partners.

- [ ] **Step 1: Add the link**

Find this block in `src/components/Footer.tsx`:

```typescript
    {
      label: 'The Brand',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Our Story', href: '/about/story' },
        { name: 'Sustainability', href: '/sustainability' },
        { name: 'Friends & Partners', href: '/friends' },
      ]
    },
```

Replace with:

```typescript
    {
      label: 'The Brand',
      links: [
        { name: 'Home', href: '/' },
        { name: 'Our Story', href: '/about/story' },
        { name: 'Sustainability', href: '/sustainability' },
        { name: 'Friends & Partners', href: '/friends' },
        { name: 'Where the 5% Goes', href: '/giving/' },
      ]
    },
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Footer.tsx
git commit -m "feat: add giving page link to footer"
```

---

### Task 7: Fix 5% figure on AFC page

**Files:**
- Modify: `src/app/armed-forces-covenant/page.tsx`

Two occurrences of "5-15%" need to be updated to "5%". The authoritative figure is 5%.

- [ ] **Step 1: Fix line 207**

Find:
```
<li>Supporting armed forces housing charities through our annual profit-sharing programme (5-15% of net profits)</li>
```

Replace with:
```
<li>Supporting armed forces housing charities through our annual profit-sharing programme (5% of net profits)</li>
```

- [ ] **Step 2: Fix line 231**

Find:
```
<li>Donating 5-15% of annual net profits to vetted armed forces charities, with transparent annual reporting of contributions and impact</li>
```

Replace with:
```
<li>Donating 5% of annual net profits to vetted armed forces charities, with transparent annual reporting of contributions and impact</li>
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add src/app/armed-forces-covenant/page.tsx
git commit -m "fix: correct profit pledge to 5% on AFC page"
```

---

## Chunk 6: Deploy

### Task 8: Apply migration to production and open PR

- [ ] **Step 1: Apply migration 0008 to production**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/0008_charity_tables.sql
```

Expected: `Executed 4 queries.` (CREATE TABLE × 2, CREATE INDEX × 2), no errors.

- [ ] **Step 2: Verify production tables**

```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('charities','charity_contributions');"
```

Expected: two rows.

- [ ] **Step 3: Push branch and open PR**

```bash
git push -u origin feat/giving-page
gh pr create --title "feat: giving page — where the 5% goes" --body "Adds public /giving/ page showing charity partners and contribution history. Two new D1 tables (charities, charity_contributions) via migration 0008 — both start empty. Page handles empty state honestly: commitment block always shown, charity partners and contributions appear as data is added via future migrations. No admin UI."
```

---

## Adding Future Data

When a charity partner is confirmed, add via a new migration file:

```sql
-- Example: 0009_add_first_charity.sql
INSERT INTO charities (id, name, description, logo_url, website_url, sort_order)
VALUES (
  'raf-benevolent-fund',
  'RAF Benevolent Fund',
  'The RAF Benevolent Fund supports serving and former members of the RAF and their families.',
  NULL,
  'https://rafbf.org',
  1
);
```

When a contribution is made:

```sql
-- Example: 0010_contribution_2026.sql
INSERT INTO charity_contributions (id, charity_id, amount_gbp, year, period_description, notes)
VALUES ('2026-raf-q1', 'raf-benevolent-fund', 250.00, 2026, 'Q1 2026', NULL);
```

Apply with:
```bash
npx wrangler d1 execute jerry-can-spirits-db --remote --file=migrations/000X_description.sql
```
