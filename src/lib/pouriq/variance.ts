// Pure deterministic helpers for variance tracking. No DB access, no
// side effects. Used by the server-side loader to build VarianceRow[]
// for the menu page's variance editor.

import { costPerMlP } from './calculations'

export interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  bottle_size_ml: number               // for display context (e.g. "Smirnoff (700ml)")
  bottle_cost_p: number                // net of VAT, from library

  // Stock count input (null when the manager hasn't entered yet)
  start_count: number | null
  end_count: number | null

  // Calculated (null when inputs missing or theoretical is zero)
  theoretical_used_ml: number
  actual_used_ml: number | null
  variance_ml: number | null
  variance_pct: number | null          // null when theoretical is zero (undefined % against a zero base)
  variance_cost_p: number | null
}

/**
 * Theoretical millilitres used of one ingredient across all drinks on
 * a menu, given recipes and per-cocktail sales volumes. Unit-priced
 * contributions (unit_count, pour_ml null) are excluded — variance
 * lite tracks bottle-priced only.
 */
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

/**
 * Actual millilitres used from start/end bottle counts. Returns null
 * if either count is missing — caller decides how to render that.
 */
export function calcActualUsedMl(
  start: number | null,
  end: number | null,
  bottle_size_ml: number,
): number | null {
  if (start === null || end === null) return null
  return (start - end) * bottle_size_ml
}

/**
 * Variance derives from actual − theoretical. Percentage is null when
 * theoretical is zero (no sales to compare against).
 */
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

/**
 * Cash cost of variance: variance_ml × (bottle_cost_p / bottle_size_ml).
 * Positive = money out (overpour); negative = money "back" (under-pour
 * or sales misreport). Rounded to whole pence to keep with the rest
 * of pouriq's integer-pence convention.
 */
export function calcVarianceCostP(
  variance_ml: number | null,
  bottle_size_ml: number,
  bottle_cost_p: number,
  purchase_qty: number,
): number | null {
  if (variance_ml === null) return null
  return Math.round(variance_ml * costPerMlP(bottle_cost_p, bottle_size_ml, purchase_qty))
}

export type VarianceSeverity = 'none' | 'within-tolerance' | 'amber' | 'red'

// Eyeballing a partial bottle is only accurate to roughly a fifth of a bottle,
// so anything smaller is measurement noise, not loss.
export const VARIANCE_TOLERANCE_BOTTLES = 0.2

/**
 * Classify a variance for display. Absolute variances within the counting
 * noise floor (≈0.2 of a bottle) — or small percentages — are "within
 * tolerance" and should not be flagged as a figure, so staff aren't trained
 * to ignore an always-red report. Beyond that: amber to 20%, red above.
 */
export function classifyVariance(
  variance_ml: number | null,
  variance_pct: number | null,
  bottle_size_ml: number,
): VarianceSeverity {
  if (variance_ml === null) return 'none'
  if (Math.abs(variance_ml) <= VARIANCE_TOLERANCE_BOTTLES * bottle_size_ml) return 'within-tolerance'
  if (variance_pct === null) return 'amber'
  const abs = Math.abs(variance_pct)
  if (abs < 10) return 'within-tolerance'
  if (abs <= 20) return 'amber'
  return 'red'
}
