// Pure deterministic helpers for variance tracking. No DB access, no
// side effects. Used by the server-side loader to build VarianceRow[]
// for the menu page's variance editor.

import { costPerMlP } from './calculations'

export interface VarianceRow {
  library_ingredient_id: string
  library_name: string
  pack_size: number                    // for display context (e.g. "Smirnoff (700ml)")
  price_p: number                      // net of VAT, from library

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
  pack_size: number,
): number | null {
  if (start === null || end === null) return null
  return (start - end) * pack_size
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
 * Cash cost of variance: variance_ml × per-ml cost (purchase_qty-aware).
 * Positive = money out (overpour); negative = money "back" (under-pour
 * or sales misreport). Rounded to whole pence to keep with the rest
 * of pouriq's integer-pence convention.
 */
export function calcVarianceCostP(
  variance_ml: number | null,
  pack_size: number,
  price_p: number,
  purchase_qty: number,
): number | null {
  if (variance_ml === null) return null
  return Math.round(variance_ml * costPerMlP(price_p, pack_size, purchase_qty))
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
  pack_size: number,
): VarianceSeverity {
  if (variance_ml === null) return 'none'
  if (Math.abs(variance_ml) <= VARIANCE_TOLERANCE_BOTTLES * pack_size) return 'within-tolerance'
  if (variance_pct === null) return 'amber'
  const abs = Math.abs(variance_pct)
  if (abs < 10) return 'within-tolerance'
  if (abs <= 20) return 'amber'
  return 'red'
}

export interface CountEvent {
  counted_at: string
  count_qty: number
  reason: string | null
}

export interface CountPair {
  latest: CountEvent
  previous: CountEvent
}

// The two most recent counts (by counted_at), or null if fewer than two.
export function pairLatestCounts(events: CountEvent[]): CountPair | null {
  if (events.length < 2) return null
  const sorted = [...events].sort((a, b) => a.counted_at.localeCompare(b.counted_at))
  return { latest: sorted[sorted.length - 1], previous: sorted[sorted.length - 2] }
}

// Sum POS units for buckets whose period falls within (windowStart, windowEnd].
// windowStart/windowEnd are ISO date strings (YYYY-MM-DD). Bucket boundaries
// are the cadence period_start/period_end. Exact when counts land on the
// cadence boundary, approximate mid-bucket (accepted caveat).
export function sumBucketsInWindow(
  buckets: Array<{ period_start: string; period_end: string; units_sold: number }>,
  windowStart: string,
  windowEnd: string,
): number {
  return buckets.reduce(
    (sum, b) => (b.period_start > windowStart && b.period_end <= windowEnd ? sum + b.units_sold : sum),
    0,
  )
}

// Expected real-world usage from raw poured ml, accounting for line/keg wastage.
// yield_pct 100 = no loss (no-op). Lower yield means more is drawn down per ml sold.
export function applyYield(rawMl: number, yieldPct: number): number {
  const y = yieldPct > 0 ? yieldPct : 100
  return rawMl / (y / 100)
}

// Persistent shrinkage: the most recent 3 variance figures are all negative.
export function persistentLossFlag(recentVariancesNewestLast: Array<number | null>): boolean {
  const defined = recentVariancesNewestLast.filter((v): v is number => v !== null)
  if (defined.length < 3) return false
  const lastThree = defined.slice(-3)
  return lastThree.every((v) => v < 0)
}

// Sum amounts strictly after `ws` and up to and including `we` (raw string
// compare; all timestamps are server datetimes in the same format as counts).
// Used to fold deliveries and production into the variance count window.
export function sumAmountsInWindow(
  rows: Array<{ amount: number; at: string }>,
  ws: string,
  we: string,
): number {
  let total = 0
  for (const r of rows) if (r.at > ws && r.at <= we) total += r.amount
  return total
}
