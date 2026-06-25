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
  base_unit: 'ml' | 'g' | 'each'
  default_pack_size: number | null
  // The generic this brand rolls up to (its normalised_name); null for
  // generic entries.
  generic: string | null
  // Synonyms (brand names, alternative spellings), pre-normalised.
  aliases: string[]
}

interface CatalogueRow {
  id: string
  name: string
  normalised_name: string
  ingredient_type: IngredientType
  base_unit: 'ml' | 'g' | 'each'
  default_pack_size: number | null
  generic: string | null
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
    .prepare(`SELECT id, name, normalised_name, ingredient_type, base_unit, default_pack_size, generic, aliases FROM pouriq_ingredient_catalogue`)
    .all<CatalogueRow>()
  return (res.results ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    normalised_name: r.normalised_name,
    ingredient_type: r.ingredient_type,
    base_unit: r.base_unit,
    default_pack_size: r.default_pack_size,
    generic: r.generic,
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
  // Exact match: prefer the canonical name over an alias, so a specific brand
  // entry (e.g. "Smirnoff") beats a generic that merely lists it as an alias.
  const exactName = entries.find((e) => e.normalised_name === targetNorm)
  if (exactName) return exactName
  const exactAlias = entries.find((e) => e.aliases.includes(targetNorm))
  if (exactAlias) return exactAlias

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
  // Lowest score wins; on a tie prefer a brand entry (linked to a generic)
  // over the generic, so "Carling Lager" resolves to Carling, not Lager.
  scored.sort((a, b) => a.score - b.score || (a.entry.generic ? 0 : 1) - (b.entry.generic ? 0 : 1))
  return scored[0].entry
}

// The library name to adopt for a catalogue match. Keeps the line's own
// wording when it is strictly more specific than the matched entry (so
// "Carling Lager" stays itself instead of collapsing to "Lager"), otherwise
// uses the entry's canonical name (so a clean "triple sec" becomes "Triple Sec").
export function adoptionName(extractedName: string, entry: CatalogueEntry): string {
  const ext = significantTokens(extractedName)
  const cat = significantTokens(entry.name)
  const strictSuperset = cat.length > 0 && cat.every((t) => ext.includes(t)) && ext.length > cat.length
  return strictSuperset ? extractedName.trim() : entry.name
}
