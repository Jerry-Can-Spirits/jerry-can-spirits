import { describe, expect, it } from 'vitest'
import { searchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const entries: CatalogueEntry[] = [
  { id: '1', name: 'Everleaf Forest', normalised_name: 'everleaf forest', ingredient_type: 'alcohol-free', base_unit: 'ml', default_pack_size: 500, generic: null, aliases: [] },
  { id: '2', name: 'Everleaf Mountain', normalised_name: 'everleaf mountain', ingredient_type: 'alcohol-free', base_unit: 'ml', default_pack_size: 500, generic: null, aliases: [] },
  { id: '3', name: 'Smirnoff', normalised_name: 'smirnoff', ingredient_type: 'spirit', base_unit: 'ml', default_pack_size: 700, generic: 'vodka', aliases: [] },
]

describe('searchCatalogue', () => {
  it('returns multiple matches for a shared token', () => {
    const r = searchCatalogue('everleaf', entries)
    expect(r.map((e) => e.id).sort()).toEqual(['1', '2'])
  })
  it('returns an exact-name match', () => {
    const r = searchCatalogue('smirnoff', entries)
    expect(r[0].id).toBe('3')
  })
  it('respects the limit', () => {
    expect(searchCatalogue('everleaf', entries, undefined, 1)).toHaveLength(1)
  })
  it('returns empty for no match', () => {
    expect(searchCatalogue('zzzz', entries)).toEqual([])
  })
})
