# Pour IQ™ Variance Tracking (Lite) — Design Spec

**Status:** Spec — not yet implemented. Next Pour IQ™ feature after the help guide infrastructure and the back-navigation pass (PRs #681, #682, shipped 2026-05-15).

**Why:** Pour IQ™ tells the bar manager what cocktails *should* return based on recipes, costs, and sales. It does not yet tell them whether what came out of the bottles matches what was sold. That gap — overpour, spillage, free pours, theft, miscount — is variance, and it's where the competitor tools (WISK, Bar-i, BinWise, Bar Patrol) currently have parity that Pour IQ™ lacks. Variance lite closes the gap statistically: bar manager counts bottles at the start and end of each period, Pour IQ™ compares the difference against what sales × recipes say should have been used, surfaces the discrepancy in units, %, and £.

**Scope discipline:** Period-level, statistical variance. No hardware (no Bluetooth scales, no flow meters). No per-pour precision. Bottle-priced ingredients only — unit-priced items (limes, mint bunches, jarred cherries) have a separate waste model that this feature does not address. UI lives on the menu page below the existing volume editor; same cadence as the menu's `volume_cadence`. No anomaly alerts, no configurable thresholds, no recipe versioning — all explicitly deferred.

---

## Concepts

**Period.** Same boundary as the menu's volume reporting cadence. If the menu is set to weekly volumes, variance is weekly; if monthly, monthly. One stock-count entry per ingredient per period per menu.

**Theoretical use.** For each bottle-priced ingredient on the menu's recipes, the sum of `units_sold × pour_ml` across every drink that uses it. Derived from `pouriq_drink_volumes` joined to `pouriq_ingredients`. Pure deterministic calculation; no estimation.

**Actual use.** `(start_count − end_count) × bottle_size_ml`. Counts are decimal — 3.5 means three-and-a-half bottles. Manager enters start and end at period boundaries.

**Variance.** `actual_used_ml − theoretical_used_ml`. Positive means more stock was used than sales explain (overpour, spillage, training pours, walks). Negative means less stock was used than sales explain (sales over-reported, deliveries not accounted for, miscount).

**£ cost of variance.** `variance_ml × (bottle_cost_p / bottle_size_ml)`. Turns "33% overpour on vodka" into "£42 of vodka unaccounted for this week."

**Threshold bands.** Display-only colour coding based on `|variance_pct|`: under 10% neutral, 10–20% amber, over 20% red. Industry rule of thumb; not configurable in v1.

---

## What already exists

| Asset | Where | What it does |
|---|---|---|
| Drink volumes | `pouriq_drink_volumes` | Per-cocktail units sold per period; populated manually or by Square POS sync. |
| Recipe rows | `pouriq_ingredients` | Per-cocktail ingredient links with `pour_ml` (bottle-priced) or `unit_count` (unit-priced). |
| Library entries | `pouriq_ingredients_library` | `bottle_size_ml` + `bottle_cost_p` for bottle-priced; `unit_cost_p` for unit-priced. |
| Volume editor | `src/components/pouriq/VolumeEditor.tsx` | Existing per-menu volume entry, weekly/monthly cadence. Variance editor mirrors its placement and shape. |
| Volume API | `/api/pouriq/menus/[menuId]/volumes` (GET/POST) and `/cadence` (PUT) | Existing pattern for menu-period data. Variance API mirrors this. |
| Cadence on menus | `pouriq_menus.volume_cadence` ('weekly' | 'monthly') | Variance reuses this; no separate cadence field. |

No new infrastructure dependencies. Variance lite is additive — schema, helper, route, component, menu-page wire-up.

---

## Schema

New migration: `migrations/0026_pouriq_stock_counts.sql`.

```sql
-- Per-menu, per-ingredient, per-period stock count for variance tracking.
-- One row per (menu, library_ingredient, period). UPSERT on save.
CREATE TABLE pouriq_stock_counts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  menu_id TEXT NOT NULL REFERENCES pouriq_menus(id) ON DELETE CASCADE,
  library_ingredient_id TEXT NOT NULL REFERENCES pouriq_ingredients_library(id) ON DELETE CASCADE,
  period_start TEXT NOT NULL,        -- ISO YYYY-MM-DD; matches pouriq_drink_volumes shape
  period_end TEXT NOT NULL,          -- ISO YYYY-MM-DD
  start_count REAL NOT NULL,         -- bottles at start of period (3.5 = three-and-a-half bottles)
  end_count REAL NOT NULL,           -- bottles at end of period
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX uniq_pouriq_stock_counts
  ON pouriq_stock_counts(menu_id, library_ingredient_id, period_start, period_end);

CREATE INDEX idx_pouriq_stock_counts_menu_period
  ON pouriq_stock_counts(menu_id, period_start, period_end);
```

### Schema design notes

- **REAL counts.** SQLite REAL is 8-byte IEEE float — plenty of precision for bottle counts. Half-bottles are common (manager closes the night with half a bottle of vodka).
- **Cascade behaviour.** Deleting a menu cascades to its stock counts; deleting a library entry cascades to counts. Both are the natural "this data has no meaning without its parent" semantics.
- **Unique index** enforces "one count per `(menu, ingredient, period)`". UPSERT on save uses this — `INSERT … ON CONFLICT(menu_id, library_ingredient_id, period_start, period_end) DO UPDATE SET start_count = excluded.start_count, end_count = excluded.end_count, updated_at = datetime('now')`.
- **No `source` column** (unlike `pouriq_drink_volumes` which distinguishes 'manual' from 'pos'). Counts are always manual in v1. If we later auto-derive from invoices + previous-period end, a source field can be added then.
- **Menu-keyed, not library-keyed.** Discussed during brainstorming. Pilot venues run one active menu at a time, so per-menu keying is simpler and matches the per-menu UI placement. Per-ingredient (cross-menu) counts would be more correct for multi-menu venues; revisit when that case lands.

---

## Calculation

New file: `src/lib/pouriq/variance.ts`. Pure deterministic helpers; no DB access.

### Types

```ts
export interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number               // for display context (e.g. "Smirnoff (700ml)")
  bottle_cost_p: number                // net of VAT, from library
  start_count: number | null           // null when not yet entered
  end_count: number | null
  theoretical_used_ml: number          // Σ(units_sold × pour_ml) across drinks on this menu using this ingredient
  actual_used_ml: number | null        // (start − end) × bottle_size_ml; null if either count missing
  variance_ml: number | null
  variance_pct: number | null          // null when theoretical is zero (undefined % against a zero base)
  variance_cost_p: number | null
}
```

### Helpers

```ts
// 1. Theoretical use for one ingredient
//    Sum across every drink on this menu using this ingredient with a non-null pour_ml.
//    Unit-priced contributions (unit_count, no pour_ml) are excluded.
export function calcTheoreticalUsedMl(
  ingredient_id: string,
  drinks: Array<{
    cocktail_id: string
    ingredients: Array<{ library_id: string; pour_ml: number | null }>
  }>,
  volumesByCocktail: Map<string, number>,
): number {
  let total = 0
  for (const drink of drinks) {
    const units = volumesByCocktail.get(drink.cocktail_id) ?? 0
    if (units === 0) continue
    for (const ing of drink.ingredients) {
      if (ing.library_id !== ingredient_id) continue
      if (ing.pour_ml === null) continue
      total += units * ing.pour_ml
    }
  }
  return total
}

// 2. Actual use from counts
export function calcActualUsedMl(
  start: number | null,
  end: number | null,
  bottle_size_ml: number,
): number | null {
  if (start === null || end === null) return null
  return (start - end) * bottle_size_ml
}

// 3. Variance ml + %
export function calcVariance(
  actual_ml: number | null,
  theoretical_ml: number,
): { variance_ml: number | null; variance_pct: number | null } {
  if (actual_ml === null) return { variance_ml: null, variance_pct: null }
  const variance_ml = actual_ml - theoretical_ml
  if (theoretical_ml === 0) return { variance_ml, variance_pct: null }
  const variance_pct = (variance_ml / theoretical_ml) * 100
  return { variance_ml, variance_pct }
}

// 4. £ cost of variance
export function calcVarianceCostP(
  variance_ml: number | null,
  bottle_size_ml: number,
  bottle_cost_p: number,
): number | null {
  if (variance_ml === null) return null
  return Math.round(variance_ml * (bottle_cost_p / bottle_size_ml))
}
```

### Display thresholds

| Band | `|variance_pct|` | Display |
|---|---|---|
| Acceptable | < 10% | Parchment (neutral) |
| Worth checking | 10–20% | Amber |
| Investigate | > 20% | Red |

Absolute value because both over and under are signals worth investigating. Sign (+/−) is always shown on the variance and cost figures so the manager knows the direction.

### Loader

New file: `src/lib/pouriq/variance-loader.ts`. Server-only. Builds `VarianceRow[]` for one menu + one period:

1. Read `pouriq_drink_volumes` for `(menu_id, period_start, period_end)` → `Map<cocktail_id, units_sold>`.
2. Read `pouriq_cocktails` joined with `pouriq_ingredients` joined with `pouriq_ingredients_library` for this menu, filtered to bottle-priced entries (`lib.bottle_size_ml IS NOT NULL AND lib.bottle_cost_p IS NOT NULL`).
3. Group rows by `library_ingredient_id`. For each group, compute `theoretical_used_ml` via `calcTheoreticalUsedMl`.
4. Read `pouriq_stock_counts` for `(menu_id, period_start, period_end)` → `Map<library_ingredient_id, { start_count, end_count }>`.
5. For each ingredient with non-zero theoretical OR an existing count row, build a `VarianceRow` using the pure helpers.

Returns `VarianceRow[]` sorted by `|variance_cost_p|` descending (worst £-impact first), with rows where everything is null at the bottom.

---

## Backend routes

| Route | Method | Purpose |
|---|---|---|
| `/api/pouriq/menus/[menuId]/variance` | GET | Returns `{ cadence, current_period: { start, end }, rows: VarianceRow[], recent_periods: Array<{ start, end, total_abs_cost_p }> }`. Accepts optional `?period_start=&period_end=` to load a past period instead. |
| `/api/pouriq/menus/[menuId]/variance` | POST | Upserts stock counts for the period. Body: `{ period_start, period_end, entries: Array<{ library_ingredient_id, start_count, end_count }> }`. Returns the refreshed `rows`. |

Access check: `checkPourIqAccess()`, redirect or `LicenceGate` as the rest of the pouriq pages. Rate limits: `pouriq-variance-save` 60/hour/tenant for POST (counts are typically saved once per period; the limit is permissive).

Validation on POST:
- `period_start`, `period_end` are ISO `YYYY-MM-DD` strings.
- Each entry's `library_ingredient_id` must belong to the tenant's library and be bottle-priced.
- `start_count` and `end_count` are non-negative reals.
- Empty `entries` array is allowed (saves nothing; no error).

---

## Frontend

New component: `src/components/pouriq/VarianceEditor.tsx`. Client component, mirrors `VolumeEditor`'s shape and self-fetch pattern.

### Component contract

```ts
interface VarianceEditorProps {
  menuId: string
  initialCadence: VolumeCadence
}
```

The component fetches its own data via `GET /api/pouriq/menus/[menuId]/variance?cadence=...`. Cadence changes are driven by the parent menu page — VarianceEditor receives the cadence prop and refetches when it changes.

### Position on the menu page

`src/app/trade/pouriq/[menuId]/page.tsx`: add `<VarianceEditor menuId={menuId} initialCadence={menu.volume_cadence} />` in a new `no-print` section, immediately below the existing `<VolumeEditor>` block. Same `cocktails.length > 0` gate.

### Layout

- **Header.** "Stock variance" title, period date range (matches the volume editor's current period), brief intro line: "Enter the bottle count at the start of the period and what's left at the end. Pour IQ compares that against what sales should have used."
- **Info banner** (shown only when no volumes have been entered for the period): "Enter sales volumes above first. Variance compares stock used against what sales should have used."
- **Editor table.** Columns: Ingredient, Start (input), End (input), Used (computed), Theoretical (computed), Variance (ml + %, colour-coded), Cost (£, colour-coded).
  - Inputs accept decimals (step `0.1`); blank by default; rows save only when both start and end are filled.
  - `end_count > start_count` triggers a row-level warning icon: "Stock went up during this period. Add any deliveries to the start count, or check your figures."
  - Rows with non-zero theoretical but no counts entered render in dim text with Used / Variance / Cost as "—".
- **Save button.** "Save counts" at the bottom-right. POSTs the filled entries; UPSERTs server-side; refreshes the rows.
- **Recent periods.** Slim list below the Save button: last 5 periods, each showing the date range and `Total |£ cost variance|`. Clicking a period loads that historical period via the same GET endpoint with explicit `period_start` and `period_end` params.

### Component decomposition

- `VarianceEditor.tsx` — orchestrator, holds state, runs fetches, renders header + table + recent periods.
- `VarianceRowComponent` (inline child or extracted; decision in the plan) — one row, wrapped in `React.memo` with stable `useCallback` handlers if the table grows large enough to need it. Following the pattern from `InvoiceLineRow` if extraction is justified.

---

## Edge cases (in scope for v1)

| Case | Behaviour |
|---|---|
| No volumes entered for the current period | Variance columns show "—". Info banner displays. Counts can still be entered and saved; variance numbers populate once volumes land. |
| Volumes entered but a specific ingredient has zero theoretical | Row visible if it appears on at least one drink in the menu's recipes. Theoretical shows 0 ml; Variance shows the raw Used number; % is "—" (undefined against zero base). |
| `end_count > start_count` | Save allowed; warning icon and inline message; Cost shown as negative (a credit, conceptually). |
| Some rows blank when saving | Only rows with BOTH counts filled are committed. Blank rows are not assumed-zero. |
| User switches menu cadence mid-flow (weekly ↔ monthly) | Variance editor reloads with the new period boundaries. Old counts remain in D1 tied to their original `period_start` / `period_end`; they surface under Recent periods when their date range still aligns with the new cadence. |
| Recipe changes mid-period | Theoretical uses the CURRENT recipe. Known limitation; recipe versioning is future work. |
| Library entry's `bottle_size_ml` changes mid-period | Both the theoretical and actual calcs use the new size. Internally consistent — the variance signal is still meaningful, just no longer comparable to the old size. |
| Library entry deleted mid-period | FK cascade removes count rows. Past-period variance views show fewer ingredients than were tracked at the time; acceptable. |
| Drink uses the ingredient with `unit_count` (unit-priced) | Excluded from theoretical for that ingredient. Variance lite is bottle-priced only. |
| Menu has no drinks yet | Editor renders an empty state: "Add drinks to this menu first. Variance shows once you have ingredients in use." |
| Concurrent saves by two users on the same tenant | UPSERT semantics; last write wins. Acceptable; no row-level locking. |

## Edge cases acknowledged but **out of scope**

- **Auto-derive `start_count` from previous period's `end_count` plus deliveries** pulled from `pouriq_invoices`. Cleaner UX but adds delivery-timing complexity. v1 is fully manual entry.
- **Configurable thresholds.** v1 uses fixed 10% / 20% bands. Per-tenant or per-ingredient settings are future work.
- **Anomaly digest / email alert** when a variance crosses a threshold. Future.
- **Trend chart** of total variance over time. The Recent periods slim list covers the basic signal.
- **Recipe versioning** so historical variance uses the recipe that was active at the time. Future.
- **Unit-priced variance tracking.** Different waste model (rot, expiry); not this feature.
- **Cross-menu / venue-wide stock counts** (per-ingredient keying without `menu_id`). Future, when a multi-menu pilot venue surfaces the case.

---

## Testing

Project has Playwright e2e only; no unit/component framework. Verification: `npm run lint`, `npm run build` (runs `tsc`), and manual integration on the deploy preview.

- `npm run build` clean (TypeScript type-check + Cloudflare Workers build)
- `npm run lint` clean (scoped to touched files if repo-wide OOMs)
- Migration applies cleanly to local + remote D1
- Manual integration checklist:
  - Open a menu with drinks and at least one bottle-priced ingredient on a recipe
  - Variance editor renders below the volume editor
  - Before entering volumes: info banner shown; Theoretical blank
  - Enter volumes → Theoretical populates for affected ingredients
  - Enter start + end counts → Used / Variance / Cost compute live
  - Click Save counts → counts persist; reload page; values shown
  - Edit a saved count → re-save → upserted (no duplicate row created)
  - Trigger `end > start` → warning renders; Cost shown as negative
  - Switch menu cadence weekly → monthly → variance editor reloads with the new period boundaries
  - Click a row in Recent periods → editor loads that historical period
  - Library entry without `bottle_size_ml` → not surfaced in the editor regardless of volume

### Pure-function testability

`variance.ts` is deterministic and side-effect-free. `calcTheoreticalUsedMl`, `calcActualUsedMl`, `calcVariance`, `calcVarianceCostP` are natural unit-test targets when a framework lands.

### Branch + CI

Branch off `origin/main`. Standard CI: build + lint + Cloudflare Workers build. Single PR or two-PR split (backend + frontend) — decision in the implementation plan.

---

## File-level change summary

| File | Change |
|---|---|
| `migrations/0026_pouriq_stock_counts.sql` | **New.** Single table + unique + secondary index. |
| `src/lib/pouriq/variance.ts` | **New.** Pure deterministic helpers + types. |
| `src/lib/pouriq/variance-loader.ts` | **New.** Server-only loader joining volumes + recipes + library + counts. |
| `src/app/api/pouriq/menus/[menuId]/variance/route.ts` | **New.** GET (loader call + recent periods) and POST (UPSERT counts). |
| `src/components/pouriq/VarianceEditor.tsx` | **New.** Client component, self-fetching, table + recent-periods list. |
| `src/app/trade/pouriq/[menuId]/page.tsx` | **Modified.** Mount `<VarianceEditor>` immediately below `<VolumeEditor>`. |

---

## Help guide section

Per the help-guide style memory (stored in Claude's persistent memory as `feedback_pouriq_help_guide_style.md`), every new Pour IQ™ feature ships with a help-guide section drafted in the same session. For variance lite, the natural section title is:

**"Tracking stock variance"**

Placement: between section 6 ("Tracking sales volumes") and section 7 ("Running a cost what-if"). Variance is the natural follow-on from volumes (uses volume data) and precedes what-if (which is about hypotheticals; variance is about actuals).

The section will be drafted at the end of the implementation work, once the actual UI labels and exact behaviour are committed.

---

## Future work (not this spec)

1. **Auto-derive start counts** from invoice deliveries + previous period's end. Reduces manual entry; requires careful handling of delivery timing.
2. **Per-tenant / per-ingredient threshold configuration.** v1's fixed 10% / 20% bands suit most pilot venues; configurable thresholds become useful when venues run different operating models.
3. **Anomaly digest.** Weekly email to the trade-account owner summarising any ingredients with high variance.
4. **Trend chart.** Per-ingredient or whole-menu variance over time, beyond the small Recent periods list.
5. **Recipe versioning.** Snapshot the recipe at the start of each period so historical variance uses the recipe that was in force.
6. **Cross-menu stock counts** for venues running multiple parallel menus drawing from the same stock.
7. **Unit-priced waste tracking.** Separate feature with a different model (rot / expiry).
