# Pour IQ: Trustworthy Numbers — Design

**Date:** 2026-06-17
**Status:** Approved

## Problem

Two ways Pour IQ's GP figures currently mislead:

1. **Silent £0 costs.** `ingredientCostPence` (calculations.ts) returns 0 when an ingredient can't be priced — neither unit-priced (`unit_cost_p` set) nor fully bottle-priced (`bottle_size_ml` + `bottle_cost_p` + `pour_ml` all set). That zero flows into margin and GP, so the drink looks more profitable than it is, and inflates the menu average. Gaps arise naturally: AI menu import / invoice scanning create library entries before a price is filled in, a new garnish is added, a barcode scan adds an item.
2. **Unweighted average GP.** The menu headline averages each drink's GP% equally, so a drink that sells twice a week counts the same as one selling forty times. Now that POS volumes flow, the headline can be the true blended figure.

## Decisions (from brainstorming)

- **Incomplete-cost drinks are excluded** from the headline, average, and best/worst-margin, and flagged in the list with "Cost incomplete — add prices" and no GP shown. (Half = safety net; invisible when every ingredient is priced.)
- **Headline, when volumes exist, is the true blended GP**: Σ(margin × units) ÷ Σ(net sale × units) — the P&L figure, revenue-weighted. (Half = upgrade for all venues.)
- **No volumes yet → fall back** to the simple average across costed drinks, labelled "menu average — no sales data yet."

## Architecture (Approach A: extend the pure calc layer)

Cost logic lives in `calculations.ts`; completeness and the blended headline belong beside it. One source of truth, fully unit-testable; the UI only renders flags.

### `src/lib/pouriq/calculations.ts`

- New pure helper:

```ts
export function ingredientCostComplete(i: IngredientWithLibrary): boolean {
  if (i.library.unit_cost_p !== null) return true
  return i.library.bottle_size_ml !== null
    && i.library.bottle_cost_p !== null
    && i.pour_ml !== null
}
```

- `calculateCocktailMetrics` gains:
  - `cost_complete: boolean` — true only when the cocktail has at least one ingredient and every ingredient passes `ingredientCostComplete`. A zero-ingredient cocktail is `false` (a £0 cost is not trustworthy).
  - `net_sale_p: number` — already computed internally via `netSalePrice`; expose it so the blended maths can reuse it.
  - `gp_pct` / `margin_p` are still computed (unchanged); `cost_complete` is the signal the UI uses to suppress them. No type becomes nullable.

- `calculateMenuMetrics` changes. Let `costed = cocktail_metrics.filter(m => m.cost_complete && m.sale_price_p > 0)`:
  - `avg_gp_pct` = mean of `costed` GP% (was: all drinks). Empty → 0.
  - `blended_gp_pct: number | null` = over `costed` drinks **with** a `volume` entry: `round( Σ(margin_p × units) / Σ(net_sale_p × units) × 100, 1 )`; null when no costed drink has volume or the net-sales denominator is 0.
  - `headline_gp_pct: number` and `headline_basis: 'blended' | 'average'` = blended when non-null, else `avg_gp_pct`.
  - `incomplete_cost_count: number` = drinks with `!cost_complete`.
  - `best_margin` / `worst_margin` computed over `costed` only.

### Types — `src/lib/pouriq/types.ts`

`CocktailMetrics` gains `cost_complete: boolean` and `net_sale_p: number`. `MenuMetrics` gains `blended_gp_pct: number | null`, `headline_gp_pct: number`, `headline_basis: 'blended' | 'average'`, `incomplete_cost_count: number`. (`avg_gp_pct` retained.)

### UI — menu detail page + its summary/row components

(Exact components confirmed during planning by reading `src/app/trade/pouriq/[menuId]/page.tsx` and the metric components.)
- **Headline:** render `headline_gp_pct` with a label — "Blended GP — from sales" when `headline_basis === 'blended'`, else "Menu average — no sales data yet." Append "(N drinks excluded — cost incomplete)" when `incomplete_cost_count > 0`.
- **Per drink:** when `!cost_complete`, replace the GP% with an amber "⚠ Cost incomplete — add prices" linking to that cocktail's edit screen; otherwise unchanged.

## Testing

Unit (`tests/unit`):
- `ingredientCostComplete`: unit-priced true; full bottle-priced true; missing `pour_ml`/`bottle_cost_p`/`bottle_size_ml` false; no pricing false.
- `calculateCocktailMetrics`: `cost_complete` true/false cases incl. zero-ingredient drink.
- `calculateMenuMetrics`: blended = Σmargin·u / Σnet·u with VAT applied; blended null when no volumes; incomplete drink excluded from avg, blended, best/worst; `headline_basis` flips correctly.

`npx tsc --noEmit`, `npx next lint`, `npm run build`.

## Out of scope

- Editing ingredient prices from the menu page (the flag links to the existing cocktail/library edit flow).
- Changing how costs are computed — only detecting completeness and re-weighting the headline.
- Per-period historical blended GP / trends (the headline reflects the current period's volumes, as today).

## No migration

Pure calculation + type + UI change. No schema, no data migration.
