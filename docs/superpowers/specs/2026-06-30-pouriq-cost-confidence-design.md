# Pour IQ — Ingredient Cost Confidence

Date: 2026-06-30
Status: Design agreed; ready for implementation plan.

## Goal

Give every ingredient a **cost confidence** — Estimated / Set / Confirmed — that reflects how its current price was sourced, so a menu's GP is honest about what is still a guess versus invoice-verified. This is the convergence signal for the menu-first vs invoice-first onboarding: a shallow menu import creates Estimated stubs; invoices (and manual entry) progressively enrich them. It both makes GP trustworthy and nudges venues to confirm costs via invoices.

## Model

- New column `cost_confidence TEXT NOT NULL DEFAULT 'estimated'` on `pouriq_ingredients_library`. Values: `'estimated' | 'set' | 'confirmed'`.
- A `CostConfidence` union in `types.ts`; `cost_confidence: CostConfidence` added to `IngredientLibraryRow`.
- The ladder (low → high):
  - **estimated** — menu import inferred the ingredient with no real cost basis (a guess).
  - **set** — a deliberate price: catalogue-adopted OR manually typed. Plausible, but no invoice has verified it.
  - **confirmed** — an actual invoice priced it.
- Confidence reflects the source of the **current** price. It is set explicitly by each price-writing action (below). A re-import that *matches* an existing ingredient does not rewrite it, so nothing silently downgrades.

## Set-points (where confidence is written)

- **Menu import commit** (`src/app/api/pouriq/import/commit/route.ts`) — when creating a new library entry from a staged `new_library`: `cost_confidence = new_library.price_p > 0 ? 'set' : 'estimated'`. (A catalogue-adopted or user-priced line is `set`; a bare stub is `estimated`.)
- **Manual create/edit** (`saveLibraryEntryAction` in `server-actions.ts`) — `cost_confidence = price_p > 0 ? 'set' : 'estimated'`. A manual save is a manual price assertion → `set`. (Editing a Confirmed ingredient by hand drops it to Set — honest, since a manual price is no longer invoice-verified; rare and acceptable.)
- **Invoice commit** (`src/app/api/pouriq/invoices/commit/route.ts`) — every applied price sets `cost_confidence = 'confirmed'`.
- No other action changes it. (POS/stock/variance never touch it.)

## Backfill (migration 0059)

`UPDATE pouriq_ingredients_library SET cost_confidence = CASE WHEN price_p > 0 THEN 'set' ELSE 'estimated' END;` after adding the column. Honest default (no grandfathering to Confirmed — there are no live venues, and Set correctly drives invoice confirmation). Additive column with a safe default; existing reads unaffected.

## Surfacing

- **Ingredient list + form** (`IngredientList`, `IngredientForm`): a small badge via a pure helper `costConfidenceBadge(c)` → `{ label, className }` (Estimated = amber, Set = slate, Confirmed = emerald). Presentational.
- **Menu honesty** (menu detail page / `CocktailTable` header or the menu summary): a count of drinks whose cost uses any non-`confirmed` ingredient — e.g. "4 drinks use unconfirmed costs." A pure rollup helper `menuCostConfidence(cocktails)` → `{ unconfirmed_drinks: number, estimated_drinks: number }` (a drink is unconfirmed if any of its ingredients is not `confirmed`; estimated if any is `estimated`). The headline GP is unchanged but honestly captioned.
- **Attention** (`src/lib/pouriq/attention.ts`): add an item "N ingredients have estimated costs — scan an invoice to confirm" when estimated ingredients exist on the menu. Slots into the existing ordered attention list (below sync errors / unmatched, around the needs-price items).

## Scope

- **IN:** the column + `CostConfidence` type + backfill migration 0059 + the three set-points + the badge (list + form) + the menu unconfirmed/estimated count + the attention nudge + the two pure helpers.
- **OUT (cheap follow-ons):** the fuller per-ingredient completeness checklist (cost + pack + yield as a score); per-drink confidence breakdown beyond the menu count; a "confirm manually" override.

## Testing

- **Unit:** `costConfidenceBadge` (each value → label/class); `menuCostConfidence` (a drink with all-confirmed ingredients → 0; one estimated ingredient → estimated+unconfirmed; one set ingredient → unconfirmed only; empty menu → 0).
- **Migration:** node:sqlite — add column + backfill; assert priced rows → 'set', price-less → 'estimated', column present, default applies.
- **Set-point wiring:** reasoned + tsc (the required `cost_confidence` on `IngredientLibraryRow` forces every constructed test fixture to set it — fix those fixtures).
- Full `npx tsc --noEmit` + `npx eslint src tests` (0 errors) + `npm run test:unit` green; `npm run build` + `npx opennextjs-cloudflare build` green; `package.json`/lock/configs unchanged; **no new npm dependencies**.

## Risks / notes

- `cost_confidence` becomes required on `IngredientLibraryRow`; cocktail/library reads use `SELECT *`, so it flows at runtime once the migration runs — but `tsc` will flag any TEST fixture that builds an `IngredientLibraryRow` literal. Add `cost_confidence: 'set'` (or appropriate) to those fixtures.
- Set-points touch `import/commit`, `invoices/commit`, and `server-actions.ts` — files other in-flight PRs also touch. The changes are additive (one column in INSERT/UPDATE lists); reconcile at merge.
- Migration **0059** (0058 = menu sections, already in main).
- After merge, apply 0059 to prod.
