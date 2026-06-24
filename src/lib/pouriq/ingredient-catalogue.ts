// Shared, curated catalogue of common bar ingredients. Menu import matches
// extracted ingredient names against this so a bar can adopt one by entering
// only its own price. Generic and price-less — distinct from the barcode
// catalogue (specific scanned bottles).

import type { IngredientType } from './types'
import { normalise, significantTokens, tokenKey, tokensAreTypoNear } from './match'

export interface CatalogueEntry {
  id: string
  name: string
  normalised_name: string
  ingredient_type: IngredientType
  pricing_mode: 'bottle' | 'unit'
  default_pack_size_ml: number | null
  // Synonyms (brand names, alternative spellings), pre-normalised.
  aliases: string[]
}

interface CatalogueRow {
  id: string
  name: string
  normalised_name: string
  ingredient_type: IngredientType
  pricing_mode: 'bottle' | 'unit'
  default_pack_size_ml: number | null
  aliases: string
}

function parseAliases(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((a): a is string => typeof a === 'string').map((a) => a.toLowerCase())
  } catch {
    return []
  }
}

export async function listCatalogue(db: D1Database): Promise<CatalogueEntry[]> {
  const res = await db
    .prepare(`SELECT id, name, normalised_name, ingredient_type, pricing_mode, default_bottle_size_ml AS default_pack_size_ml, aliases FROM pouriq_ingredient_catalogue`)
    .all<CatalogueRow>()
  return (res.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    normalised_name: r.normalised_name,
    ingredient_type: r.ingredient_type,
    pricing_mode: r.pricing_mode,
    default_pack_size_ml: r.default_pack_size_ml,
    aliases: parseAliases(r.aliases),
  }))
}

// Best catalogue entry when confident, using the same token-aware logic as
// matchIngredient (shared helpers): exact name/alias, else identical
// significant-token set (qualifier-stripped), else a token-subset or a
// single-token typo. Null otherwise, so we never silently mis-adopt an
// unrelated ingredient (e.g. "mint" must not resolve to "gin").
export function matchCatalogue(name: string, entries: CatalogueEntry[]): CatalogueEntry | null {
  const targetNorm = normalise(name)
  if (!targetNorm) return null
  // Exact match on the canonical name or any alias (brand/synonym strings).
  const exact = entries.find((e) => e.normalised_name === targetNorm || e.aliases.includes(targetNorm))
  if (exact) return exact

  const tTokens = significantTokens(name)
  if (tTokens.length === 0) return null
  const tKey = tokenKey(tTokens)
  const tSet = new Set(tTokens)

  const scored: { entry: CatalogueEntry; score: number }[] = []
  for (const e of entries) {
    for (const cand of [e.normalised_name, ...e.aliases]) {
      const cTokens = significantTokens(cand)
      if (cTokens.length === 0) continue
      const cSet = new Set(cTokens)
      if (tokenKey(cTokens) === tKey) { scored.push({ entry: e, score: 0 }); break }
      if (tTokens.every((t) => cSet.has(t)) || cTokens.every((c) => tSet.has(c))) {
        scored.push({ entry: e, score: 1 + Math.abs(tTokens.length - cTokens.length) })
        continue
      }
      if (tokensAreTypoNear(tTokens, cTokens)) scored.push({ entry: e, score: 10 })
    }
  }
  if (scored.length === 0) return null
  scored.sort((a, b) => a.score - b.score)
  return scored[0].entry
}
