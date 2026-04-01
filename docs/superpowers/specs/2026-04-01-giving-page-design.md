# Giving Page Design

## Goal

Build a public `/giving/` page that shows where Jerry Can Spirits' 5% profit pledge goes — which charities are supported, and what has been donated. Manually maintained via D1 migration files. Starts with empty tables and honest empty-state copy; grows as contributions are made.

## URL and Navigation

- URL: `https://jerrycanspirits.co.uk/giving/`
- Linked from: footer, AFC page
- Page heading: "Where the 5% Goes"

> **Copy note:** The AFC page currently states "5-15% of annual net profits". The authoritative figure is **5%**. The giving page uses 5% throughout. The AFC page should be updated separately to align.

## Architecture

Server-rendered Next.js page. Fetches two datasets from Cloudflare D1 in a single `Promise.all`. Passes data to two display components. No client-side interactivity. Consistent with the batch detail page pattern.

Two new D1 tables added via a single migration (`0008_charity_tables.sql`). Both start empty. The page handles empty state at each section independently.

---

## Database

### New table: `charities`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | e.g. `raf-benevolent-fund` |
| `name` | TEXT NOT NULL | Full charity name |
| `description` | TEXT NOT NULL | 1-2 sentences, brand voice |
| `logo_url` | TEXT | Nullable — image URL (Cloudflare Images or absolute URL) |
| `website_url` | TEXT | Nullable — charity's donation page or homepage |
| `sort_order` | INTEGER NOT NULL DEFAULT 0 | Controls display order |
| `created_at` | TEXT NOT NULL DEFAULT (datetime('now')) | |

### New table: `charity_contributions`

| Column | Type | Notes |
|---|---|---|
| `id` | TEXT PRIMARY KEY | e.g. `2026-raf-benevolent-q1` |
| `charity_id` | TEXT NOT NULL REFERENCES charities(id) | FK → charities (declarative only — SQLite does not enforce FKs by default; data integrity maintained via migration discipline) |
| `amount_gbp` | REAL | Nullable — for non-monetary contributions |
| `year` | INTEGER NOT NULL | e.g. `2026` |
| `period_description` | TEXT NOT NULL | e.g. `Q1 2026`, `Year ending April 2026` |
| `notes` | TEXT | Nullable — short context note |
| `created_at` | TEXT NOT NULL DEFAULT (datetime('now')) | |

### Migration file: `0008_charity_tables.sql`

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
  amount_gbp REAL,
  year INTEGER NOT NULL,
  period_description TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_charity_id
  ON charity_contributions(charity_id);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_year
  ON charity_contributions(year DESC);
-- Note: DESC in index column definitions requires SQLite 3.33.0+ (2020). D1 supports this.
```

Both tables start empty. No seed data.

### Adding future data

When a charity partner is confirmed, add via a new migration:

```sql
-- Example: 0009_add_first_charity.sql
INSERT INTO charities (id, name, description, logo_url, website_url, sort_order)
VALUES ('charity-slug', 'Charity Name', 'Description in brand voice.', NULL, 'https://...', 1);
```

When a contribution is made:

```sql
-- Example: 0010_contribution_q1_2026.sql
INSERT INTO charity_contributions (id, charity_id, amount_gbp, year, period_description, notes)
VALUES ('2026-charity-slug-q1', 'charity-slug', 250.00, 2026, 'Q1 2026', NULL);
```

---

## D1 Query Layer

New additions to `src/lib/d1.ts`:

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

`created_at` excluded from interfaces — never used in rendering.

---

## New Components

### `src/components/CharityCard.tsx`

Server component. Props: `{ charity: Charity }`.

Layout:
- If `logo_url` non-null: logo image at top — use `next/image` with `fill` inside a `relative h-20 w-full mb-4` container, `object-contain`, `sizes="(max-width: 768px) 100vw, 50vw"`
- Charity name: `text-white font-semibold text-lg`
- Description: `text-parchment-300 text-sm leading-relaxed`
- If `website_url` non-null: "Donate directly" link — `text-gold-400 text-sm hover:text-gold-300`, opens in new tab with `rel="noopener noreferrer"`

Card style: `bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6`

### `src/components/ContributionsList.tsx`

Server component. Props: `{ contributions: CharityContribution[], charities: Charity[] }`.

Renders a list of contribution rows. Each row:
- Period: `text-parchment-500 text-sm`
- Charity name (resolved from charities array by `charity_id`): `text-white font-medium` — if `charity_id` has no matching entry in the charities array (should not occur via normal migration workflow but SQLite does not enforce the FK), render the `charity_id` string as a fallback
- Amount: `text-gold-400 font-semibold` — if non-null, format with `amount_gbp.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 2 })`; if null, render "Non-monetary contribution"
- Notes: `text-parchment-400 text-sm` — rendered only if non-null

Grouped by year with a year heading: `text-xl font-serif font-bold text-white mb-4`

Renders nothing if `contributions` is empty — the page handles the empty state at the section level.

---

## Page: `src/app/giving/page.tsx`

Server component. `dynamic = 'force-dynamic'`.

### Metadata

Static export (not `generateMetadata` — metadata does not depend on fetched data):

```typescript
export const metadata: Metadata = {
  title: "Where the 5% Goes | Jerry Can Spirits®",
  description: "Jerry Can Spirits donates 5% of profits to armed forces charities. A transparent record of who receives what, and when.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/giving/",
  },
}
```

No `openGraph` block — omitted intentionally for simplicity.

### Data fetching

```typescript
const db = await getD1()
const [charities, contributions] = await Promise.all([
  getCharities(db),
  getCharityContributions(db),
])
```

### Page sections (in order)

**1. Header**
- Small gold badge: "Giving Back"
- H1: "Where the 5% Goes"
- One short paragraph: "Five percent of profits from every bottle sold goes to armed forces charities. This page is the record."

**2. Commitment block** (always shown, hardcoded)
- Dark green card
- Text: explains the pledge, links to `/armed-forces-covenant/` for the full commitment
- Honest about pre-profit status: "We launched in April 2026. We haven't yet reached a profit position from which to donate. When we do, it will appear here."

**3. Charity partners** (conditional)
- If `charities.length > 0`: section heading "Our Charity Partners", 2-column grid of `CharityCard` components
- If empty: single muted line — "We're reviewing armed forces charities to partner with. We'll announce our chosen partners ahead of our first donation."

**4. Contributions to date** (conditional)
- If `contributions.length > 0`: section heading "Contributions to Date", `ContributionsList` component
- If empty: nothing rendered — the commitment block covers the "not yet" position

---

## What Is Not In Scope

- Customer submission of their own donations
- Automated profit calculation
- Admin UI — all data managed via migration files
- Email notifications or reminders
- Charity search or filtering
