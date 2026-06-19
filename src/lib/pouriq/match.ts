// Deterministic name matching of an extracted ingredient against the
// tenant's library. Returns a match status the UI can render directly.

import type { IngredientLibraryRow } from './types'

export type MatchStatus =
  | { kind: 'auto'; entry: IngredientLibraryRow }
  | { kind: 'suggestions'; entries: IngredientLibraryRow[] }
  | { kind: 'no-match' }

export function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/['.,]/g, '')
    .replace(/\b(\d+\s?(?:ml|cl|l|oz))\b/g, '') // strip size suffixes like "70cl"
    .replace(/\s+/g, ' ')
    .trim()
}

// Standard Levenshtein, O(n*m) — fine for short ingredient names.
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const prev = new Array(b.length + 1)
  const cur = new Array(b.length + 1)
  for (let j = 0; j <= b.length; j++) prev[j] = j
  for (let i = 1; i <= a.length; i++) {
    cur[0] = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
    }
    for (let j = 0; j <= b.length; j++) prev[j] = cur[j]
  }
  return prev[b.length]
}

export function matchIngredient(
  extractedName: string,
  library: IngredientLibraryRow[],
): MatchStatus {
  const target = normalise(extractedName)
  if (!target) return { kind: 'no-match' }

  // 1. Exact (case-insensitive, normalised) match
  const exact = library.find((e) => normalise(e.name) === target)
  if (exact) return { kind: 'auto', entry: exact }

  // 2 + 3. Fuzzy: collect candidates with Levenshtein ≤ 2 or substring match
  type Scored = { entry: IngredientLibraryRow; score: number }
  const scored: Scored[] = []
  for (const entry of library) {
    const candidate = normalise(entry.name)
    if (candidate.length < 3) continue

    const dist = levenshtein(target, candidate)
    if (dist <= 2) {
      scored.push({ entry, score: dist })
      continue
    }
    // Substring match either direction, min length 4
    if (
      (target.length >= 4 && candidate.includes(target)) ||
      (candidate.length >= 4 && target.includes(candidate))
    ) {
      scored.push({ entry, score: 100 + Math.abs(target.length - candidate.length) })
    }
  }

  if (scored.length === 0) return { kind: 'no-match' }

  scored.sort((a, b) => a.score - b.score)
  return { kind: 'suggestions', entries: scored.slice(0, 3).map((s) => s.entry) }
}
