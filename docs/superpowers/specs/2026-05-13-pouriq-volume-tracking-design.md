# Pour IQ Volume Tracking — Design Spec

**Status:** Spec — not yet implemented. Sequenced after promo pricing.

**Why:** Pour IQ currently shows margin per drink but is blind to volume. A 65% GP drink selling 40/week makes more cash than a 78% GP drink selling 8/week — Pour IQ can't tell you that today. Paired with promotional pricing, volume data turns "is this 2-4-1 worth it?" from guesswork into a real model: "we lose 33% GP on Wednesdays but sell 3.5× volume, net contribution +17%".

**Scope discipline:** Pour IQ stays a drink-level margin intelligence tool. We store volumes per drink per period; we do NOT store labour, rent, COGS aggregates, or anything that creeps into P&L / accounting territory. Volume × the drink's existing sale_price gives revenue automatically — we never become the source of truth for the venue's P&L.

---

## Concepts

**Period.** A time window the bar manager reports volume for. Default cadence is monthly; weekly opt-in (the toggle lives on the menu — bar managers with weekly POS reports flip it on).

**Volume entry.** `(cocktail_id, period_start, period_end, units_sold)` — how many of that drink sold in that period. One row per drink per period.

**Contribution.** Margin × units_sold per drink. The headline number this feature unlocks. Aggregated to the menu level, this is what bar managers can actually compare against operating costs to know if a menu is "earning its keep".

---

## Schema

New migration: `migrations/0019_drink_volumes.sql`.

```sql
-- Per-drink sales volume by reporting period. One row per cocktail per
-- period; tenant scope inherited via cocktail → menu → trade_account.
CREATE TABLE pouriq_drink_volumes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  cocktail_id TEXT NOT NULL REFERENCES pouriq_cocktails(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,  -- ISO date YYYY-MM-DD
  period_end TEXT NOT NULL,    -- ISO date YYYY-MM-DD, inclusive
  units_sold INTEGER NOT NULL CHECK (units_sold >= 0),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'pos')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_pouriq_drink_volumes_cocktail ON pouriq_drink_volumes(cocktail_id);
CREATE UNIQUE INDEX uniq_pouriq_drink_volumes_period
  ON pouriq_drink_volumes(cocktail_id, period_start, period_end);

-- Menu-level reporting cadence. The default 'monthly' matches how most
-- bar managers think about their books.
ALTER TABLE pouriq_menus ADD COLUMN volume_cadence TEXT NOT NULL DEFAULT 'monthly'
  CHECK (volume_cadence IN ('weekly', 'monthly'));
```

**Why a separate table, not columns on pouriq_cocktails:**
- Preserves history. Bar manager can see "Mojito sold 28/month in March, 34 in April".
- POS integration in Phase 3 just writes to the same table with `source='pos'` — no schema migration needed.
- A menu's first analysis after a promo run can compare "before promo" period vs "during promo" period.

**Why period_start/period_end vs just a single date column:**
- Bar managers report weekly OR monthly. A single date can't represent both. Inclusive start/end handles either cadence and gives us future flexibility for irregular periods.

---

## API

### `GET /api/pouriq/menus/[menuId]/volumes`

Returns the volume entries for every drink on a menu, grouped by period (most recent first). Used by the menu detail page to render the volume table.

```ts
interface VolumeEntry {
  cocktail_id: string
  period_start: string
  period_end: string
  units_sold: number
  source: 'manual' | 'pos'
}
interface VolumeResponse {
  cadence: 'weekly' | 'monthly'
  periods: Array<{
    period_start: string
    period_end: string
    entries: VolumeEntry[]
    // Computed server-side for convenience:
    total_units: number
    total_contribution_p: number  // sum of (margin_p * units_sold)
  }>
}
```

### `POST /api/pouriq/menus/[menuId]/volumes`

Upsert volume entries for the current (or specified) period.

```ts
interface UpsertBody {
  period_start: string
  period_end: string
  entries: Array<{ cocktail_id: string; units_sold: number }>
}
```

- Validates each `cocktail_id` belongs to the tenant's menu.
- Upserts on the unique `(cocktail_id, period_start, period_end)` index.
- Source always `'manual'` for now; POS integration sets `'pos'` later.

### `PUT /api/pouriq/menus/[menuId]/cadence`

Updates `volume_cadence` between `weekly` and `monthly`.

---

## UI — menu detail page

Add a new **"Sales volume"** section below the drinks table. Three components:

### 1. Cadence toggle
Segmented control identical in style to `VatModeToggle`: `Weekly | Monthly`. Default monthly. Server action persists.

### 2. Current period editor
Auto-derived period based on cadence:
- Monthly: current calendar month (1st → last day)
- Weekly: current week (Monday → Sunday, UK convention)

Renders as a compact table:

```
Drink                Units sold    Margin/unit    Contribution
Mojito                    [28]      £6.65          £186.20
Espresso Martini          [42]      £7.45          £312.90
Negroni                    [3]      £6.50           £19.50
...
                                              Total: £518.60
```

`[28]` is editable inline. Save button at the bottom batches the upserts. Live recalculation of contribution column as the user types.

### 3. Paste-from-POS bulk input
A "Paste volumes from POS export" link opens a small dialog with a textarea. Bar manager pastes either:
- One number per line (assumed in same order as drinks shown above)
- Or `drink name<TAB>units` pairs (matched by name)

Submit replaces all entries for the current period. Five-second job vs typing 25 drinks one at a time — this is the friction-killer.

### 4. Recent periods table
Read-only summary of the last 6 periods so the bar manager can see trends without leaving the page:

```
Period               Units   Contribution    vs prev
Apr 2026               342        £2,118     ▲ 8%
Mar 2026               317        £1,961     ▼ 3%
Feb 2026               325        £2,022     —
...
```

Periods are clickable to drill into per-drink breakdown.

---

## Integration with margin / promo features

### Drinks table on menu detail
When the current period has volumes, add a `Contribution` column to the existing `CocktailTable` so the headline drink ranking changes from "sorted by margin %" to "sorted by contribution" (the actually-useful sort for menu decisions).

### What-if cost ripple
Project cost-impact in absolute pounds (`Δ contribution`) when volumes exist, not just GP%. "Vodka +£5/bottle costs the menu £42/month at current sales".

### Promo simulation (the killer feature)
Add a small "Simulate promo" panel per drink (or per menu) that asks:
- New promo price
- Expected volume multiplier (1.0× = no change, 3.5× = aggressive promo response)

Output: projected contribution under promo vs current contribution. Frames the trade-off as a number, not a vibe.

### AI recommendation prompt
When recommendations are generated, pass each cocktail's last-period volume + contribution to the prompt. The model can now say "Cosmopolitan generates only £14/month at current sales — consider removing or repositioning" instead of "Cosmopolitan has the lowest GP".

---

## Out of scope (Phase 2+)

- Revenue tracking separate from volume — we always compute revenue as `volume × sale_price`.
- COGS aggregation beyond drink ingredients.
- Labour, rent, utilities allocation.
- Stock counts or reorder logic.
- POS integration itself — that's a separate feature; this design just makes sure the schema supports it.

---

## Implementation order (when prioritised)

1. Migration + types
2. API endpoints (GET, POST, PUT)
3. Server-side calc updates (contribution computation in `calculations.ts`)
4. UI: cadence toggle, current period editor, recent periods summary
5. UI: paste-from-POS bulk input
6. Integrate into drinks table (Contribution column)
7. Integrate into AI recommendation prompt
8. (Stretch) Promo simulation panel — folds in nicely after promo pricing ships

Estimate: 1-1.5 days for tasks 1-6, half-day for 7-8.
