// Shared, curated catalogue of common bar ingredients. Menu import matches
// extracted ingredient names against this so a bar can adopt one by entering
// only its own price. Generic and price-less — distinct from the barcode
// catalogue (specific scanned bottles).

import type { IngredientType } from './types'
import { normalise, levenshtein } from './match'

export interface CatalogueEntry {
  id: string
  name: string
  normalised_name: string
  ingredient_type: IngredientType
  pricing_mode: 'bottle' | 'unit'
  default_bottle_size_ml: number | null
}

export async function listCatalogue(db: D1Database): Promise<CatalogueEntry[]> {
  const res = await db
    .prepare(`SELECT id, name, normalised_name, ingredient_type, pricing_mode, default_bottle_size_ml FROM pouriq_ingredient_catalogue`)
    .all<CatalogueEntry>()
  return res.results ?? []
}

// Best catalogue entry when confident: exact normalised match, else nearest
// within Levenshtein <= 2, else a multi-word substring containment. Null
// otherwise, so we never silently mis-adopt an unrelated ingredient.
export function matchCatalogue(name: string, entries: CatalogueEntry[]): CatalogueEntry | null {
  const target = normalise(name)
  if (!target) return null
  const exact = entries.find((e) => e.normalised_name === target)
  if (exact) return exact
  let best: { entry: CatalogueEntry; score: number } | null = null
  for (const e of entries) {
    const cand = e.normalised_name
    if (cand.length < 3) continue
    const dist = levenshtein(target, cand)
    if (dist <= 2) {
      if (best === null || dist < best.score) best = { entry: e, score: dist }
      continue
    }
    if (
      (target.length >= 5 && cand.includes(target)) ||
      (cand.length >= 5 && target.includes(cand))
    ) {
      const s = 100 + Math.abs(target.length - cand.length)
      if (best === null || s < best.score) best = { entry: e, score: s }
    }
  }
  return best?.entry ?? null
}
