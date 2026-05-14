import { matchIngredient, type MatchStatus } from './match'
import type { IngredientLibraryRow } from './types'

const SIZE_RE = /(\d+(?:\.\d+)?)\s?(ml|cl|l)\b/i

function extractSizeMl(name: string): number | null {
  const m = name.match(SIZE_RE)
  if (!m) return null
  const n = parseFloat(m[1])
  const unit = m[2].toLowerCase()
  if (!Number.isFinite(n) || n <= 0) return null
  if (unit === 'ml') return Math.round(n)
  if (unit === 'cl') return Math.round(n * 10)
  if (unit === 'l') return Math.round(n * 1000)
  return null
}

/**
 * Match an extracted invoice line name against the tenant's library, preferring
 * entries whose bottle_size_ml matches a size suffix on the extracted name.
 * Avoids accidentally updating the 70cl Smirnoff library row from a 1L invoice line.
 *
 * Falls back to plain matchIngredient when there's no size suffix or no
 * size-matching candidate exists.
 */
export function matchInvoiceLine(
  extractedName: string,
  library: IngredientLibraryRow[],
): MatchStatus {
  const baseMatch = matchIngredient(extractedName, library)
  const sizeMl = extractSizeMl(extractedName)
  if (sizeMl === null) return baseMatch

  // If the base match is auto and sizes agree, keep it.
  if (baseMatch.kind === 'auto') {
    if (baseMatch.entry.bottle_size_ml === sizeMl) return baseMatch
    // Auto match but size mismatches — demote to suggestions if there's a
    // size-correct candidate among the library; otherwise keep the auto match
    // (the matcher's confidence likely outweighs the size hint).
    const sizeMatch = library.find(
      (e) => e.bottle_size_ml === sizeMl && e.id !== baseMatch.entry.id,
    )
    if (sizeMatch) {
      return { kind: 'suggestions', entries: [sizeMatch, baseMatch.entry] }
    }
    return baseMatch
  }

  if (baseMatch.kind === 'suggestions') {
    // Re-rank: size-matching candidates first.
    const sizeMatches = baseMatch.entries.filter((e) => e.bottle_size_ml === sizeMl)
    const others = baseMatch.entries.filter((e) => e.bottle_size_ml !== sizeMl)
    return { kind: 'suggestions', entries: [...sizeMatches, ...others] }
  }

  return baseMatch
}
