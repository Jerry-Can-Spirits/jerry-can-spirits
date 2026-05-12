# Pour IQ — Ingredient Library + AI Menu Import — Design Spec

**Date:** 2026-05-12
**Status:** Design (pending implementation)
**Branches:** `feat/pouriq-ingredient-library` (PR 1 — library foundation), `feat/pouriq-menu-import` (PR 2 — AI import, branched later)

## Context & Goal

Pour IQ launched on 2026-05-11 with manual cocktail entry. Pilot venue The Bank Bar & Grill has 25+ cocktails to enter. Doing that one ingredient at a time, repeatedly typing "Vodka 700ml £25" for every cocktail that uses it, is the friction that will determine whether they actually use the tool or abandon it.

This spec covers two cohesive features designed together and shipped as two PRs:

1. **Ingredient library** (PR 1, foundation) — A tenant-scoped library of ingredients (`pouriq_ingredients_library`). Each cocktail's ingredient row references a library entry instead of duplicating name/size/cost inline. Bar manager defines "Tito's Vodka 700ml £25" once and reuses it across every drink. Sets up the schema for future cost-change ripple analysis (the next Pour IQ feature).
2. **AI-assisted menu import** (PR 2, builds on the library) — Bar manager pastes their menu text or uploads a PDF; Anthropic extracts drinks + ingredients; UI shows a match-status preview against the library; user confirms; menu is created in one commit.

Pour IQ's UI is also relabelled from "cocktail" to "drink" across user-facing copy, so simple serves (vodka & coke, house spirits) can be analysed alongside cocktails. The schema stays as `pouriq_cocktails` internally — relabel is UI-only.

Magic-link auth, photo OCR, cost benchmarking, and POS/Xero integrations are out of scope. The schema is designed to accommodate those without further refactors.

## Audience & Access

Unchanged from Pour IQ MVP. All routes in this spec live under `/trade/pouriq/*` and are gated by the existing `checkPourIqAccess()` (Trade Hub session + active `pouriq_subscriptions` licence). No changes to access control logic.

## Architecture Overview

### Surfaces

**PR 1 — Library foundation:**

| Path | Purpose | Auth |
|---|---|---|
| `/trade/pouriq/library` | List view of tenant's library entries | Session + licence |
| `/trade/pouriq/library/new` | Create form | Session + licence |
| `/trade/pouriq/library/[id]/edit` | Edit form + usage list + delete | Session + licence |

**PR 2 — Menu import:**

| Path | Purpose | Auth |
|---|---|---|
| `/trade/pouriq/[menuId]/import` | Three-step source → preview → commit UI | Session + licence |
| `POST /api/pouriq/import/upload` | PDF upload to R2, returns ticket | Session + licence |
| `POST /api/pouriq/import/extract` | Text or ticket → Anthropic extraction + match | Session + licence |
| `POST /api/pouriq/import/commit` | Write extracted/edited drinks to D1 atomically | Session + licence |

### File map

**Create (PR 1):**
- `migrations/0016_ingredient_library.sql`
- `src/lib/pouriq/ingredient-library.ts`
- `src/app/trade/pouriq/library/page.tsx`
- `src/app/trade/pouriq/library/new/page.tsx`
- `src/app/trade/pouriq/library/[id]/edit/page.tsx`
- `src/components/pouriq/IngredientForm.tsx`
- `src/components/pouriq/IngredientList.tsx`
- `src/components/pouriq/IngredientPicker.tsx`

**Modify (PR 1):**
- `src/lib/pouriq/menus.ts` — queries join the library
- `src/lib/pouriq/calculations.ts` — compute pour cost from library + per-cocktail pour_ml/unit_count
- `src/lib/pouriq/types.ts` — new `IngredientLibraryRow` interface; `IngredientRow` reshape
- `src/lib/pouriq/server-actions.ts` — `saveCocktailAction` accepts `library_ingredient_id` per ingredient
- `src/lib/pouriq/prompts.ts` — recommendation prompt receives library context
- `src/components/pouriq/CocktailForm.tsx` — uses `IngredientPicker` instead of free-form name/size/cost inputs
- Pour IQ pages and components: relabel "cocktail" → "drink" in user-facing copy

**Create (PR 2):**
- `src/lib/pouriq/pdf-extract.ts`
- `src/lib/pouriq/menu-extract.ts`
- `src/lib/pouriq/match.ts`
- `src/lib/pouriq/measurement-parse.ts`
- `src/lib/pouriq/import-prompts.ts`
- `src/app/api/pouriq/import/upload/route.ts`
- `src/app/api/pouriq/import/extract/route.ts`
- `src/app/api/pouriq/import/commit/route.ts`
- `src/app/trade/pouriq/[menuId]/import/page.tsx`
- `src/components/pouriq/ImportSourceTabs.tsx`
- `src/components/pouriq/ImportPreview.tsx`
- `src/components/pouriq/IngredientMatchRow.tsx`

**Modify (PR 2):**
- `src/app/trade/pouriq/new/page.tsx` — add "or import an existing menu" link
- `src/app/trade/pouriq/[menuId]/page.tsx` — add "Import drinks" button next to "Add cocktail"
- `package.json` — add `pdf-parse` dependency
- `wrangler.jsonc` — no changes (reuses existing R2 bucket `jerry-can-spirits-trade-docs` with new `pouriq-imports/` prefix; same 24-hour lifecycle as `pending/`)

## D1 Schema Changes (PR 1)

Single migration `0016_ingredient_library.sql`. Creates library table, reshapes `pouriq_ingredients`, backfills existing rows, rebuilds table with `NOT NULL` on `library_ingredient_id`.

### `pouriq_ingredients_library` (new)

```sql
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
```

The uniqueness index prevents accidental duplicate entries within a tenant (same name + same bottle size), while permitting legitimate variants (Vodka 700ml + Vodka 1L for the same tenant).

### `pouriq_ingredients` (reshaped)

Final shape after migration:

```sql
CREATE TABLE pouriq_ingredients (
  id                    TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cocktail_id           TEXT NOT NULL REFERENCES pouriq_cocktails(id) ON DELETE CASCADE,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id),
  pour_ml               REAL,
  unit_count            REAL,
  CHECK (pour_ml IS NOT NULL OR unit_count IS NOT NULL)
);
```

- For bottle-priced library entries: application code sets `pour_ml`, leaves `unit_count` NULL
- For unit-priced library entries: application code sets `unit_count` (1 whole lime → 1.0; lime wedge → 0.125), leaves `pour_ml` NULL
- The CHECK enforces that at least one is set — application code is responsible for pairing the right column with the library entry's pricing mode
- The inline `name`, `ingredient_type`, `bottle_size_ml`, `bottle_cost_p`, `unit_cost_p` columns are dropped — the library entry holds them

### Cost calculation

| Pricing mode | Formula |
|---|---|
| Bottle | `(library.bottle_cost_p / library.bottle_size_ml) * pouriq_ingredients.pour_ml` |
| Unit | `library.unit_cost_p * pouriq_ingredients.unit_count` |

Implemented in `src/lib/pouriq/calculations.ts`.

### Migration sequence

Full SQL is in the migration file. High-level steps in order:

1. Create `pouriq_ingredients_library` table + indexes
2. Add nullable `library_ingredient_id` column + `unit_count` column (default 1.0) to `pouriq_ingredients`
3. INSERT library entries from existing `pouriq_ingredients` rows, deduped by `(trade_account_id, lower(name), bottle_size_ml)`
4. UPDATE `pouriq_ingredients` rows to reference their library entries
5. DROP redundant columns from `pouriq_ingredients`
6. Rebuild `pouriq_ingredients` to add `NOT NULL` on `library_ingredient_id` (SQLite table-rebuild pattern)
7. Recreate indexes

D1 applies the migration file as a single batch — atomic, rolls back on any failure.

### Pre/post verification

```sql
-- Pre-migration counts
SELECT COUNT(*) FROM pouriq_ingredients;
SELECT COUNT(*) FROM pouriq_cocktails;

-- Post-migration sanity
SELECT COUNT(*) FROM pouriq_ingredients WHERE library_ingredient_id IS NULL;  -- expected: 0
SELECT COUNT(*) FROM pouriq_ingredients_library;                              -- expected: ≥ 1 per tenant
```

Manual check: sign into the pilot account, open the test menu, confirm Cuba Libre's GP% matches the pre-migration value.

### Rollback plan

Take a manual D1 export immediately before the remote migration:

```bash
npx wrangler d1 export jerry-can-spirits-db --remote --output=pre-0016-backup.sql
```

D1 also retains automatic daily backups. Trivial belt-and-braces for a destructive migration.

## Library Management UI (PR 1)

### List view (`/library`)

Sorted alphabetically by name. Card grid (1-col mobile, 2-col tablet, 3-col desktop). Each card:

- Name + type badge
- Cost summary: `£25.00 / 700ml` or `£1.00 / unit`
- Usage count: "Used in N drinks"

Top-right: "Add ingredient" CTA → `/library/new`. Empty state encourages either manual creation or menu import.

### Create / edit form (`/library/new`, `/library/[id]/edit`)

Identical fields:

- **Name** (required)
- **Type** (enum dropdown)
- **Pricing mode** (radio: per bottle / per unit)
- **Bottle size** (chip picker: 500/700/750/1000 + custom) — shown when bottle
- **Bottle cost £** (number) — shown when bottle
- **Unit cost £** (number) — shown when unit; hint "e.g., cost of one whole lime, one bunch of mint"
- **Notes** (optional textarea)

Quick-pick chips for bottle sizes cover ~90% of cases; "custom" reveals number input for non-standard sizes.

### Edit page extras

Below the form:

- **Used in** — list of drinks referencing this entry, grouped by menu, linked to each drink's edit page
- **Delete** — button + confirm dialog. Disabled when `usage_count > 0` with explainer: "Used in N drinks. Remove from those drinks first, or change them to a different ingredient."

### Inline create from cocktail form

The cocktail edit form's `IngredientPicker` is a searchable combobox:

- Types to filter library by name
- Selecting an entry fills in the cocktail's ingredient row (just `pour_ml` or `unit_count` left to fill)
- "+ Create new" at bottom of dropdown opens a small inline form (name, type, pricing, cost); on save it creates the library entry and selects it

This is the UX that makes first-time menu entry tolerable — bar manager builds the library as they enter cocktails, not as a separate setup chore.

### Quick-pick measurement chips

For `pour_ml` (bottle-priced ingredients on the cocktail form):

```
[15ml] [25ml] [35ml] [50ml] [75ml] [100ml] [custom]
```

For `unit_count` (unit-priced ingredients):

```
[1/8] [1/4] [1/2] [1] [custom]
```

Default state: nothing selected. Forces an explicit choice rather than a sticky default the user forgets to change.

## Menu Import Flow (PR 2)

### Entry points

- New-menu form: a "or import an existing menu →" link below the name field
- Existing menu detail page: an "Import drinks" button alongside "Add cocktail"

Both navigate to `/trade/pouriq/[menuId]/import`. If the user starts from scratch (new menu flow), the menu row is created first, then the redirect goes to import.

### Step 1 — Source

Tabbed selector (Paste text / Upload PDF). Max PDF size 5MB. PDF upload uses the existing R2 bucket `jerry-can-spirits-trade-docs` with new prefix `pouriq-imports/` and the same 24-hour lifecycle as `pending/`. Upload-on-selection (returns a ticket) mirrors the trade application form pattern.

### Step 2 — AI extraction + matching

API: `POST /api/pouriq/import/extract`. Server flow:

1. Verify session + Pour IQ licence + menu ownership
2. If source = PDF: fetch from R2 by ticket, run through `pdf-parse` to extract plain text
3. Call Anthropic with system prompt + tool schema (`pouriq_extract_menu`); `tool_choice` forces structured output
4. For each extracted ingredient, run deterministic name-matching against the tenant's library (Section "AI Prompts & Matching" below)
5. Parse each `raw_measurement` string into `pour_ml` or `unit_count`
6. Return preview payload to the client

### Step 3 — Preview UI

Per-drink card showing:

- Drink name (editable) + sale price (editable; prefilled if AI extracted)
- "Skip drink" toggle (default off — drink is included)
- For each ingredient:
  - Match status icon + library entry picker (or "+ create new" affordance)
  - Pour or unit count (already parsed by server; quick-pick chips visible)

Summary bar at top of the page: `12 drinks · 23 ingredients matched · 8 to create · 2 need a choice`. Drinks past the first 3 are collapsible to manage long menus.

### Step 4 — Commit

API: `POST /api/pouriq/import/commit`. Body: user's confirmed preview state.

Server flow, inside a D1 batch (atomic):

1. For each "new library entry" requested: insert into `pouriq_ingredients_library`
2. For each non-skipped drink: insert `pouriq_cocktails` row (name + sale_price + Field Manual slug via existing matcher)
3. For each drink's ingredients: insert `pouriq_ingredients` row (cocktail_id, library_ingredient_id, pour_ml/unit_count)
4. Return success

On success: redirect to `/trade/pouriq/[menuId]` with success banner "Imported N drinks. Review and adjust as needed."

### Error handling

| Failure | Behaviour |
|---|---|
| Anthropic 5xx | Retry once with exponential backoff; on second failure surface "Could not read your menu — try again or paste the text directly" |
| Anthropic returns empty/garbage | Show raw extracted output and prompt user to edit the source text or upload a different file |
| PDF text extraction fails | "Could not read this PDF — try pasting the text instead" |
| Schema validation fails on tool output | Sentry-log; friendly error. Rare due to `tool_choice` enforcement. |
| Commit fails partway | D1 batch rolls back; user retries |
| R2 ticket missing/expired | "Upload expired — please re-upload the PDF" |

## AI Prompts & Matching (PR 2)

### Extraction system prompt (cached)

```
You are an extraction engine inside Pour IQ. You receive raw menu text from
a UK trade venue (pub, bar, restaurant, hotel) and extract every drink line
with its ingredients.

Rules:
- Extract every drink that appears: cocktails AND simple serves (vodka & coke,
  house spirits with a mixer, beer, wine by the glass).
- For each ingredient, capture the name AS WRITTEN on the menu. Do not
  normalise or rename. "Tito's vodka" stays "Tito's vodka", not "Vodka".
- Capture the raw measurement string as written. "50ml", "1.5oz", "1/2 lime",
  "barspoon", "top with soda" — pass it through.
- Infer ingredient_type conservatively from name + context. When uncertain
  return 'other'. Valid types: spirit, liqueur, wine, beer, mixer, syrup,
  juice, garnish, other.
- Capture sale_price_p if visible (in pence; £9.50 = 950). Else null.
- Never invent ingredients. If a drink has no recipe shown, return it with
  an empty ingredients array — the bar manager will fill in.
- Section headings ("Cocktails", "House Spirits") are NOT drinks.

Output: call the pouriq_extract_menu tool with the structured result.
```

System prompt cached via `cache_control: { type: 'ephemeral' }`. Menu text varies per import and isn't cached.

### Tool schema

```ts
{
  name: 'pouriq_extract_menu',
  input_schema: {
    type: 'object',
    required: ['drinks'],
    properties: {
      drinks: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'ingredients'],
          properties: {
            name: { type: 'string' },
            sale_price_p: { type: ['integer', 'null'] },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'raw_measurement', 'inferred_type'],
                properties: {
                  name: { type: 'string' },
                  raw_measurement: { type: 'string' },
                  inferred_type: { enum: ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other'] }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

`tool_choice: { type: 'tool', name: 'pouriq_extract_menu' }` forces structured output.

### Model & cost

Claude Sonnet 4.6 for v1. Per-import cost: ~1–3p for a typical 20–30 drink menu. Non-streaming (single response).

### Server-side matching algorithm

For each extracted ingredient name, against the tenant's library:

1. **Exact** (case-insensitive on normalised name) → AUTO_MATCHED
2. **Levenshtein distance ≤ 2** on normalised names → SUGGESTIONS (top 3 by ascending distance)
3. **Substring match** (one normalised name contains the other, length ≥ 4) → SUGGESTIONS
4. **Else** → NO_MATCH

Normalisation: lowercase, strip apostrophes/dots/commas, collapse multi-space, strip trailing size suffixes ("70cl", "700ml").

Hand-rolled implementation (~30 lines, no new dependency).

### Measurement parsing

Server-side after AI extraction. Maps raw strings to structured fields:

| Raw input | Result |
|---|---|
| `50ml`, `50 ml` | `pour_ml: 50` |
| `1.5oz`, `1.5 oz` | `pour_ml: 44` (oz→ml, round to nearest 5) |
| `barspoon` | `pour_ml: 5` |
| `dash`, `2 dashes` | `pour_ml: 1 × count` |
| `1/2 lime`, `half lime` | `unit_count: 0.5` |
| `wedge`, `1/4 wedge` | `unit_count: 0.125` (assume 1/8 wedges per lime) |
| `1 sprig`, `sprig of mint` | `unit_count: 1` |
| `top`, `splash`, `top with soda` | `pour_ml: 50` (default top-up) |
| Anything else | Leave raw for user to fix |

Anything unmatched is surfaced in the preview as `raw_measurement: "..."` for the user to set manually.

## UI Relabel: "cocktail" → "drink"

Schema stays as `pouriq_cocktails` / `pouriq_ingredients` (internal). User-facing copy changes:

- Page titles: "Cocktails" → "Drinks" sections on menu detail page
- Buttons: "Add cocktail" → "Add drink"
- Form headings: "Cocktail name" → "Drink name"
- Empty states + helper copy: "No cocktails yet" → "No drinks yet"

URLs unchanged (`/trade/pouriq/[menuId]/edit`). The `Cocktail*` TypeScript types stay (it's an internal name). Just user-visible strings.

## Acceptance Criteria

### PR 1 — Library foundation

- [ ] `0016_ingredient_library.sql` applies cleanly local and remote
- [ ] Pre-migration pilot menu KPIs match post-migration KPIs
- [ ] `/trade/pouriq/library` renders list of entries with usage counts
- [ ] Create flow saves a new entry and returns to the list
- [ ] Edit flow updates an entry; cocktail GPs reflect the cost change immediately on the menu detail page
- [ ] Delete blocked while `usage_count > 0` with the "remove from N drinks first" message
- [ ] Cocktail form `IngredientPicker` filters by typed text and selects library entries
- [ ] "+ Create new" inline form creates a library entry and selects it without leaving the cocktail form
- [ ] Pour IQ recommendation flow runs end-to-end against the new schema; KPIs unchanged
- [ ] UI surfaces "drink" not "cocktail" everywhere in user-facing copy
- [ ] `npm run build` and `npx opennextjs-cloudflare build` both pass

### PR 2 — AI menu import

- [ ] Paste text path works end-to-end (paste → extract → preview → commit)
- [ ] PDF upload path works end-to-end (using a real venue menu PDF as test fixture)
- [ ] Preview displays match status accurately (auto, suggestions, no-match)
- [ ] "+ Create new" inline from preview commits a library entry and updates the match
- [ ] Skip drink / skip ingredient toggles exclude items from commit
- [ ] Commit creates drinks + ingredients atomically; failures roll back cleanly
- [ ] Friendly error messages surface for: bad PDF, Anthropic timeout, empty extraction
- [ ] **Time-to-live menu test**: importing The Bank's 25-cocktail menu via paste-text completes in under 10 minutes including review (vs. ~2 hours of manual entry)
- [ ] `npm run build` and `npx opennextjs-cloudflare build` both pass

## Pilot Logistics

After PR 1 ships:

1. Remote migration applied (with manual D1 backup taken first)
2. Verify pilot menu still renders correctly on the production deploy
3. Email The Bank Bar & Grill that the library page is now available; they can manually add their 25+ cocktails using the new system
4. Observe library usage growth; collect feedback on the picker UX

After PR 2 ships:

5. Test extraction with The Bank's actual menu PDF (or paste-text of their menu)
6. Email them: "If you'd rather not type the rest manually, you can now import your menu — here's how" with a screenshot and a link
7. Use the time-to-live metric (~10 min vs. 2 hr typing) as the headline pilot outcome

## Out of Scope (Phase 3+)

- Cost-change ripple analysis (the next agreed Pour IQ priority, separate spec)
- Photo OCR menu import (Phase 4 — Anthropic Vision API)
- Cost suggestion from UK on-trade market data (Phase 4 — supplier benchmarking)
- Bulk library operations (multi-select delete, bulk price update)
- Library CSV import/export
- Library entry merging (e.g., consolidating "Tito's Vodka" and "Tito's vodka")
- Library version history (price change audit log)
- Re-importing into a menu that already has drinks (collision handling)
- POS / Xero integrations (Phase 5+ — separate spec)

## Open Questions (Non-blocking)

- Whether to add a `default_pour_ml` column on the library so common spirits prefill 50ml in new cocktails. Deferred per Section 3 discussion — chip-picker UX is fast enough that prefill saves marginal effort. Easy to add later if pilot feedback warrants.
- Whether to surface a "favourites" or "recently used" filter on the library list once tenants accumulate 50+ entries. Out of scope for v1; the alphabetical list is fine at pilot scale.
