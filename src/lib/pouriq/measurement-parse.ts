// Parse raw measurement strings extracted by AI into either pour_ml
// (for bottle-priced ingredients) or unit_count (for unit-priced).
// Examples in the spec:
//   "50ml"          → { pour_ml: 50 }
//   "1.5oz"         → { pour_ml: 44 }   (oz → ml, round to 5)
//   "barspoon"      → { pour_ml: 5 }
//   "2 dashes"      → { pour_ml: 2 }    (1ml per dash)
//   "1/2 lime"      → { unit_count: 0.5 }
//   "wedge"         → { unit_count: 0.125 }  (1/8 of a lime)
//   "1 sprig"       → { unit_count: 1 }
//   "top"           → { pour_ml: 50 }   (default soft top-up)
// Anything not matched returns { raw: input } for the UI to surface.

export type ParsedMeasurement =
  | { pour_ml: number; unit_count?: never; raw?: never }
  | { unit_count: number; pour_ml?: never; raw?: never }
  | { raw: string; pour_ml?: never; unit_count?: never }

const OZ_TO_ML = 29.5735
function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

export function parseMeasurement(input: string): ParsedMeasurement {
  const s = input.trim().toLowerCase()
  if (!s) return { raw: input }

  // Explicit ml
  const mlMatch = s.match(/^(\d+(?:\.\d+)?)\s*ml$/)
  if (mlMatch) return { pour_ml: Math.round(parseFloat(mlMatch[1])) }

  // Explicit oz
  const ozMatch = s.match(/^(\d+(?:\.\d+)?)\s*oz$/)
  if (ozMatch) return { pour_ml: roundTo5(parseFloat(ozMatch[1]) * OZ_TO_ML) }

  // Barspoon (~5ml each, optional count)
  const barspoonMatch = s.match(/^(?:(\d+(?:\.\d+)?)\s+)?bar\s?spoons?$/)
  if (barspoonMatch) {
    const n = barspoonMatch[1] ? parseFloat(barspoonMatch[1]) : 1
    return { pour_ml: Math.round(n * 5) }
  }

  // Dash(es) — ~1ml per dash
  const dashMatch = s.match(/^(?:(\d+)\s+)?dashe?s?$/)
  if (dashMatch) {
    const n = dashMatch[1] ? parseInt(dashMatch[1], 10) : 1
    return { pour_ml: n }
  }

  // Splash / top — default soft 50ml
  if (s === 'splash' || s === 'top' || s.startsWith('top with') || s.startsWith('top up')) {
    return { pour_ml: 50 }
  }

  // Fractions: "1/2 lime", "half lime", "1/4 lemon", "quarter lemon"
  const fractionMatch = s.match(/^(1\/2|1\/4|1\/8|3\/4|half|quarter)\b/)
  if (fractionMatch) {
    const map: Record<string, number> = {
      '1/8': 0.125, '1/4': 0.25, '1/2': 0.5, '3/4': 0.75,
      'half': 0.5, 'quarter': 0.25,
    }
    return { unit_count: map[fractionMatch[1]] }
  }

  // Wedge / wheel — assume 1/8 of a fruit
  if (s === 'wedge' || /wedge\b/.test(s)) {
    return { unit_count: 0.125 }
  }

  // Sprig / leaf / leaves — count of mint sprigs, default 1
  const sprigMatch = s.match(/^(?:(\d+)\s+)?(?:sprigs?|leaf|leaves)\b/)
  if (sprigMatch) {
    const n = sprigMatch[1] ? parseInt(sprigMatch[1], 10) : 1
    return { unit_count: n }
  }

  // Whole numbers preceding a unit-ish word: "1 lime", "2 oranges"
  const wholeUnitMatch = s.match(/^(\d+(?:\.\d+)?)\s+\w+/)
  if (wholeUnitMatch) {
    return { unit_count: parseFloat(wholeUnitMatch[1]) }
  }

  // Anything else: pass through for the UI to surface
  return { raw: input }
}
