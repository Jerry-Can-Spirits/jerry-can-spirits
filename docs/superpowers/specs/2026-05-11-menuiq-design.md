# MenuIQ — AI Menu & Margin Optimisation Tool — Design Spec

**Date:** 2026-05-11
**Status:** Design (pending implementation)
**Branch:** `feat/menuiq`

## Context & Goal

Jerry Can Spirits trade customers (pubs, bars, restaurants, hotels) regularly rewrite their cocktail menus. Most do this by gut feel — they have no quick way to see which cocktails are pulling down their margin, which ingredients only appear in one drink (waste risk), or whether their menu over-indexes on one base spirit.

MenuIQ is an integrated tool inside the existing trade portal that lets a venue:

1. Enter their current cocktail menu (recipes, costs, sale prices)
2. See deterministic profitability metrics (GP% per cocktail, ingredient overlap, waste flags)
3. Receive AI-generated, brand-voiced recommendations for what to change to improve margin and reduce complexity
4. Save successive menu analyses to track changes over time

It is gated by a paid annual licence (`menuiq_subscriptions` table) on top of an existing trade account. The pilot venue receives a comp licence; future paying venues are added manually (Stripe Checkout integration is deferred to Phase 4+).

This spec covers the MVP. CSV/PDF/photo OCR upload, version comparison views, self-serve Stripe checkout, and magic-link auth migration are deliberately out of scope for v1.

## Audience & Access Control

### Visitor states

| State | Behaviour |
|---|---|
| Public (no PIN session) | `/trade/menuiq/*` redirects to existing `/trade/order/` login. Public `/trade/` page does NOT explicitly market MenuIQ in v1 — applying for a trade account is the gate. |
| Logged in, no MenuIQ licence | Trade portal nav shows MenuIQ tab. Clicking renders a "licence gate" page in brand voice with a `mailto:trade@jerrycanspirits.co.uk` enquiry link. No hard sell. |
| Logged in, has active MenuIQ licence | Full access to dashboard, create menu, analyse, AI recommendations. |

### Access function
A single library function gates every entry point:

```ts
// src/lib/menuiq/access.ts
async function assertMenuIqAccess(tradeAccountId: string): Promise<MenuIqLicence>
```

Reads the existing PIN-validated session, looks up an active row in `menuiq_subscriptions`, throws on miss. When PIN auth is later replaced by magic-link, only the session reader inside this function changes — nothing in MenuIQ itself does.

### Licence lifecycle (manual for v1)
- Pilot venue: `INSERT INTO menuiq_subscriptions (...) VALUES (..., 'pilot', 0, datetime('now', '+12 months'))`
- Future paying customers: same insert with `licence_type='annual'` and `price_paid_p` set after off-platform payment (bank transfer, invoice)
- Phase 4+: a Stripe webhook does the same insert automatically

The `licence_type` CHECK constraint accepts `'pilot' | 'annual' | 'biannual' | 'monthly'` from day one. Schema doesn't change when you flip on additional pricing models — only the licence-creation logic does.

## Architecture Overview

### Surface area
- All UI under `/trade/menuiq/*`, gated by existing PIN session middleware
- Server actions for forms (create menu, edit cocktails, save changes)
- API routes for two cases server actions cannot do well:
  - `POST /api/menuiq/analyze` — deterministic calculation (Node runtime, cacheable)
  - `POST /api/menuiq/recommend` — streaming AI output via SSE (edge runtime)
- Library modules in `src/lib/menuiq/` — pure calculations, AI client, D1 helpers, types

### Folder layout

```
src/
  app/trade/menuiq/
    page.tsx                  ← dashboard: licence status + saved menus list
    new/page.tsx              ← create menu
    [menuId]/page.tsx         ← menu detail + cocktails + analysis + AI recs
    [menuId]/edit/page.tsx    ← edit cocktails
  app/api/menuiq/
    analyze/route.ts          ← Node runtime, deterministic
    recommend/route.ts        ← Edge runtime, streams Anthropic via SSE
  lib/menuiq/
    access.ts                 ← assertMenuIqAccess
    calculations.ts           ← GP%, pour cost, overlap, waste (pure functions)
    anthropic.ts              ← fetch wrapper, streaming, prompt cache
    prompts.ts                ← system prompt + tool schema
    menus.ts                  ← D1 query helpers
    field-manual-match.ts     ← Sanity GROQ + fuzzy match
    types.ts
  components/menuiq/
    LicenceGate.tsx
    TradePortalLayout.tsx     ← shared nav for /trade/order and /trade/menuiq
    MenuList.tsx
    CocktailForm.tsx
    KpiCards.tsx
    IngredientOverlapTable.tsx
    RecommendationStream.tsx
    SuggestedChangeCard.tsx
migrations/
  0015_menuiq.sql
```

### Reused patterns
- `getCloudflareContext` for D1/KV access (existing project convention)
- Error handling matches `src/app/api/trade-application/route.ts`: Sentry on failure, friendly user-facing messages
- D1 ID convention: `lower(hex(randomblob(16)))` everywhere
- Money: integer pence (`*_p` suffix on column names), never floats

## D1 Schema

Single migration `0015_menuiq.sql`. Five tables. Multi-tenant via `trade_account_id` from day one.

### `menuiq_subscriptions`
Access / licensing record.

```sql
CREATE TABLE menuiq_subscriptions (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES trade_accounts(id),
  licence_type     TEXT NOT NULL CHECK(licence_type IN ('pilot','annual','biannual','monthly')),
  valid_from       TEXT NOT NULL DEFAULT (datetime('now')),
  valid_until      TEXT NOT NULL,
  price_paid_p     INTEGER NOT NULL DEFAULT 0,        -- pence; 0 for pilot/comp
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_menuiq_subscriptions_trade_account ON menuiq_subscriptions(trade_account_id);
CREATE INDEX idx_menuiq_subscriptions_valid_until   ON menuiq_subscriptions(valid_until);
```

### `menuiq_menus`
One row per saved menu analysis project.

```sql
CREATE TABLE menuiq_menus (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  trade_account_id TEXT NOT NULL REFERENCES trade_accounts(id),
  name             TEXT NOT NULL,
  venue_type       TEXT,                              -- 'pub','cocktail-bar','hotel','restaurant'
  city             TEXT,
  target_gp_pct    REAL NOT NULL DEFAULT 75.0,
  positioning      TEXT,                              -- 'premium','casual','mixed'
  notes            TEXT,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_menuiq_menus_trade_account ON menuiq_menus(trade_account_id);
```

### `menuiq_cocktails`
One row per cocktail in a menu.

```sql
CREATE TABLE menuiq_cocktails (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  menu_id           TEXT NOT NULL REFERENCES menuiq_menus(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  sale_price_p      INTEGER NOT NULL,                 -- pence
  position          INTEGER NOT NULL DEFAULT 0,       -- ordering on the menu
  field_manual_slug TEXT,                             -- nullable; matched on save against Sanity
  notes             TEXT
);

CREATE INDEX idx_menuiq_cocktails_menu      ON menuiq_cocktails(menu_id);
CREATE INDEX idx_menuiq_cocktails_field_man ON menuiq_cocktails(field_manual_slug);
```

### `menuiq_ingredients`
One row per ingredient line in a cocktail. Two pricing modes supported via the CHECK constraint.

```sql
CREATE TABLE menuiq_ingredients (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cocktail_id     TEXT NOT NULL REFERENCES menuiq_cocktails(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,                      -- e.g. "Vodka", "Cinnamon Syrup"
  ingredient_type TEXT NOT NULL CHECK(ingredient_type IN ('spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other')),
  pour_ml         REAL,                               -- volume served; null for unit-priced items
  bottle_size_ml  REAL,
  bottle_cost_p   INTEGER,
  unit_cost_p     INTEGER,                            -- per-unit cost (limes, mint sprigs, eggs)
  CHECK (
    (bottle_size_ml IS NOT NULL AND bottle_cost_p IS NOT NULL AND pour_ml IS NOT NULL)
    OR unit_cost_p IS NOT NULL
  )
);

CREATE INDEX idx_menuiq_ingredients_cocktail ON menuiq_ingredients(cocktail_id);
```

### `menuiq_analyses`
Append-only audit. One row per AI analysis run. Lets the user (and Dan) track how a menu's KPIs and AI advice evolved.

```sql
CREATE TABLE menuiq_analyses (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  menu_id              TEXT NOT NULL REFERENCES menuiq_menus(id) ON DELETE CASCADE,
  model                TEXT NOT NULL,                 -- 'claude-sonnet-4-6'
  prompt_tokens        INTEGER,
  output_tokens        INTEGER,
  recommendations_json TEXT NOT NULL,                 -- AI structured output
  metrics_json         TEXT NOT NULL,                 -- deterministic KPIs at this point in time
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_menuiq_analyses_menu ON menuiq_analyses(menu_id);
```

### Schema rationale
- **Money is integer pence.** Never floats. Industry standard for financial data.
- **CHECK constraint on ingredients.** Every ingredient must have either bottle pricing (size + cost + pour) or unit pricing. Garbage data cannot enter the DB.
- **`ingredient_type` enum check.** Catches typos at write time; the AI prompt can rely on these values being clean.
- **`field_manual_slug` is nullable.** Signature/house cocktails just don't get a link. Graceful degradation as the Field Manual grows.
- **`menuiq_analyses` is append-only.** Every analysis run preserved. Token counts tracked for cost auditing.
- **All foreign keys use `ON DELETE CASCADE` where the dependent row only makes sense alongside its parent** (cocktails/ingredients/analyses with their menu).

## Field Manual Integration

### Data flow
1. On cocktail save (create or edit), the server runs a Sanity GROQ query: `*[_type == "cocktail"]{ name, "slug": slug.current }`
2. Result is cached in the Worker isolate for ~15 minutes (small dataset, infrequent updates)
3. Fuzzy match the cocktail name against the result: lowercase, strip punctuation, exact match wins
4. If matched, save the slug to `menuiq_cocktails.field_manual_slug`. Otherwise null.

### Where the links surface
- **KPI cards and cocktail rows**: subtle inline link "Read in the Field Manual" beside the cocktail name when matched
- **AI recommendation cards**: if the AI references a specific cocktail and it has a slug, render a "See our recipe" link at the bottom of the card
- **AI prompt context**: the prompt receives a list of `{ cocktail_id, cocktail_name, field_manual_url }` for matched cocktails. The system prompt instructs: "When discussing a cocktail with a `field_manual_url`, you may recommend the venue's bartenders consult it for technique. Don't oversell."

### Why match-at-save (not at-render or at-analysis)
- One Sanity query per cocktail save, not per page view
- Resilient to Sanity outages — already-saved cocktails keep their links
- Easy to refresh later if Field Manual content moves (manual D1 update or a background job)

## AI Integration

### Provider and model
- **Anthropic API direct, fetch-based.** No SDK dependency. Matches existing Klaviyo/Resend pattern.
- **Default model: `claude-sonnet-4-6`.** Smart enough for genuinely useful hospitality reasoning. Typical per-analysis cost: 0.5–2 pence.
- **Cost-down option for later: `claude-haiku-4-5`.** 5x cheaper, viable once Sonnet's output is captured for eval data. Not for v1.

### Prompt structure
Three layers:

**1. System prompt (prompt-cached)** — defines persona, output rules:
- Hospitality consultant trained on British craft spirits trade
- Brand voice constraints from `CLAUDE.md` (no em-dashes, no exclamations, measured, direct)
- Must call the `menuiq_recommendations` tool — never free-text
- When a cocktail has a `field_manual_url`, may reference it where genuinely useful, sparingly

**2. User message (not cached)** — the menu data for this run:
- Menu metadata: venue type, target GP%, positioning, city
- Cocktails with pre-computed metrics (deterministic KPIs from `calculations.ts`)
- Ingredient overlap and waste-risk findings
- Field Manual matches: `[{ cocktail_id, cocktail_name, field_manual_url }]`

**3. Tool definition (structured output contract)**:

```ts
{
  name: "menuiq_recommendations",
  description: "Return a list of recommendations for this menu",
  input_schema: {
    type: "object",
    required: ["recommendations"],
    properties: {
      recommendations: {
        type: "array",
        items: {
          type: "object",
          required: ["severity", "category", "title", "body"],
          properties: {
            severity: { enum: ["info", "warn", "action"] },
            category: { enum: ["pricing", "waste", "balance", "complexity", "opportunity"] },
            cocktail_id: { type: "string", description: "References a cocktail in the menu, if applicable" },
            title: { type: "string", description: "Plain-English one-line summary" },
            body: { type: "string", description: "2-3 sentence explanation" },
            suggested_change: {
              type: "object",
              properties: {
                action: { enum: ["adjust_price", "remove_cocktail", "remove_ingredient", "swap_ingredient"] },
                from: { type: "string" },
                to: { type: "string" },
                impact_summary: { type: "string" }
              }
            },
            field_manual_reference: {
              type: "object",
              properties: {
                url: { type: "string" },
                why_relevant: { type: "string" }
              }
            }
          }
        }
      }
    }
  }
}
```

`tool_choice: { type: "tool", name: "menuiq_recommendations" }` forces the AI to call this tool. We always receive parseable JSON conforming to the schema.

### Streaming
**SSE from edge runtime endpoint.** Anthropic emits `input_json_delta` events with partial JSON. Server-side we accumulate JSON, detect when each top-level recommendation object closes (matched braces), and emit it to the client as a discrete SSE event. The client renders cards as they arrive — no long blank wait.

Hand-rolled streaming JSON parser, ~80 lines. No additional dependency.

### Prompt caching
Enabled on the system prompt only (~800 tokens, cacheable at 10% of input price). Menu data changes per run so isn't cached.

### Error handling

| Failure | Behaviour |
|---|---|
| Anthropic 5xx | Retry once with exponential backoff, then surface friendly "Recommendations couldn't be generated — try again". Deterministic KPIs still display. |
| Anthropic 4xx | Sentry-log, surface friendly error, no retry. |
| Stream drop mid-way | Client shows partial results plus a "Connection lost — refresh to retry" banner. |
| Tool output schema mismatch | Sentry-log raw output, friendly error. `tool_choice` enforcement should make this nearly impossible — defence in depth. |

### Token and cost tracking
Each analysis writes `prompt_tokens`, `output_tokens`, `model` to `menuiq_analyses`. Lets us reconcile against Anthropic's invoice and detect prompt creep.

### Environment variable
- `ANTHROPIC_API_KEY` — new Worker secret

## Trade Portal Integration

### Shared layout
A new `TradePortalLayout` component renders a top nav for `/trade/order/*` AND `/trade/menuiq/*`:

```
Trade Portal:  [Orders]  [MenuIQ]
```

Existing `/trade/order/*` pages refactor to use this layout in Phase 0. Single shared layout component, no duplication.

### Visibility rules

| State | Behaviour |
|---|---|
| Not logged in | `/trade/menuiq/*` redirects to `/trade/order/` login |
| Logged in, no licence | MenuIQ nav tab visible. Clicking shows licence-gate page with `mailto:trade@jerrycanspirits.co.uk` enquiry link |
| Logged in, with licence | Full MenuIQ access |

### Public marketing
The public `/trade/` page does NOT explicitly market MenuIQ in v1. The intent is that trade-account application itself remains the gate. Once the pilot is complete and a testimonial is available, a "benefits" section can be added on the public page in Phase 4+.

## MVP Phasing

### Phase 0 — Foundations (1 day)
- D1 migration `0015_menuiq.sql` (all five tables)
- `TradePortalLayout` shared nav component
- Refactor `/trade/order/*` pages to use shared layout
- `assertMenuIqAccess()` library + licence-gate page
- Route scaffolding under `/trade/menuiq` (dashboard, new, [menuId])
- Empty dashboard rendering "No menus yet — create one to begin"

**Pilot can't use this yet, but the bones are in place. Build verifies green on Cloudflare.**

### Phase 1 — Manual menu entry + deterministic analysis (2 days)
- "Create menu" form (name, venue type, target GP%, positioning, city)
- Add/edit cocktails with ingredient lines (per-bottle and per-unit pricing modes)
- Field Manual slug matching on cocktail save (one cached GROQ query)
- `calculations.ts`: pour cost per cocktail, GP%, margin per cocktail, ingredient overlap counts, waste flags
- Menu detail page with:
  - KPI cards (avg GP%, best margin, worst margin, waste-risk count)
  - Cocktail table sortable by margin
  - Ingredient overlap table

**Pilot can use this. They can model their menu and see numbers they couldn't before.**

### Phase 2 — AI recommendations (2 days)
- `lib/menuiq/anthropic.ts` — fetch wrapper with streaming and prompt cache
- `lib/menuiq/prompts.ts` — system prompt + tool schema
- SSE endpoint at `/api/menuiq/recommend`
- `RecommendationStream` client component consuming SSE
- Each analysis run writes to `menuiq_analyses`
- Field Manual references rendered inline on recommendation cards

**Pilot now has the full MenuIQ experience.**

### Phase 3 — Polish and pilot launch (1 day)
- Empty states, error states, loading skeletons
- Brand-voice copy pass
- Mobile responsive check
- Manual licence row insertion for pilot venue
- Short onboarding email to pilot

**Pilot launches.**

### Total: ~6 focused dev days from migration to pilot launch.

## Out of Scope (Phase 4+)

- Menu version comparison ("this menu vs last menu")
- CSV upload
- PDF / photo OCR
- Stripe Checkout + self-serve licence purchase
- Magic-link auth migration across the trade portal
- AI evals + Haiku cost-down path
- Ingredient library (save common ingredients with prices per tenant for reuse)
- Sub-recipes (define "cinnamon syrup" once, use across cocktails)
- Public marketing of MenuIQ on the trade landing page
- Multi-currency support (GBP only in v1)

## Pilot Prerequisites (Manual)

1. Brief the pilot venue — short intro on what MenuIQ does, set expectation that it's a working prototype not a finished product
2. Sit with them the first time they use it — observe what confuses them
3. Create comp licence row:
   ```
   wrangler d1 execute jerry-can-spirits-db --remote --command "INSERT INTO menuiq_subscriptions (trade_account_id, licence_type, valid_until, price_paid_p) VALUES ('<pilot-trade-account-id>', 'pilot', datetime('now','+12 months'), 0);"
   ```
4. Set Worker secret `ANTHROPIC_API_KEY` before Phase 2 ships

## Acceptance Criteria

- [ ] `/trade/menuiq` renders responsive, brand-aligned layout
- [ ] Licence gate page renders for trade accounts without an active licence
- [ ] Trade portal nav shared between `/trade/order` and `/trade/menuiq`
- [ ] Create-menu form validates required fields and writes a `menuiq_menus` row
- [ ] Cocktail entry supports both bottle and unit pricing modes with server-side validation
- [ ] Field Manual slug populated on cocktail save when name matches a Sanity cocktail document
- [ ] KPI cards show avg GP%, best/worst margin, waste-risk count
- [ ] Cocktail table sorts by margin and shows pour cost + GP% per row
- [ ] Ingredient overlap table flags ingredients used in only one cocktail
- [ ] AI recommendation endpoint streams structured recommendations via SSE
- [ ] Recommendation cards render with severity, category, body, optional suggested change, optional Field Manual reference
- [ ] Every AI run writes a row to `menuiq_analyses` with token counts
- [ ] Build passes `npm run build` and `npx opennextjs-cloudflare build`
- [ ] Pilot venue completes a real menu analysis end-to-end without developer intervention

## Open Questions for v2 (Not Blocking)

- Whether to auto-detect ingredient pricing mode (bottle vs unit) from `ingredient_type`, e.g., default `garnish` to unit pricing
- Whether to provide a small library of common UK bottle sizes (70cl, 1L) as form helpers
- Whether sub-recipes should be a first-class concept or just multi-line ingredients
- Whether to surface a "what changed since last analysis" diff view on the dashboard
