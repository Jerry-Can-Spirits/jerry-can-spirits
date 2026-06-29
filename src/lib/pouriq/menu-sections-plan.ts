import type { ItemType } from './types'

const SECTION_NAME: Record<ItemType, string> = {
  cocktail: 'Cocktails', beer: 'Beer & Cider', cider: 'Beer & Cider', wine: 'Wine',
  spirit: 'Spirits', 'soft-drink': 'Soft Drinks', food: 'Food', other: 'Other',
}
// Canonical display order of seeded sections.
const ORDER = ['Cocktails', 'Beer & Cider', 'Wine', 'Spirits', 'Soft Drinks', 'Food', 'Other']

export function itemTypeToSectionName(t: ItemType): string {
  return SECTION_NAME[t]
}

export function planSeededSections(
  drinks: { id: string; item_type: ItemType }[],
): { sections: { tempId: string; name: string }[]; assignments: { cocktailId: string; tempId: string }[] } {
  const byName = new Map<string, string[]>() // name -> cocktail ids
  for (const d of drinks) {
    const name = itemTypeToSectionName(d.item_type)
    const list = byName.get(name) ?? []
    list.push(d.id)
    byName.set(name, list)
  }
  const names = [...byName.keys()].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
  const sections = names.map((name) => ({ tempId: `seed:${name}`, name }))
  const assignments = sections.flatMap((s) =>
    (byName.get(s.name) ?? []).map((cocktailId) => ({ cocktailId, tempId: s.tempId })),
  )
  return { sections, assignments }
}

export function resequence(ids: string[]): { id: string; position: number }[] {
  return ids.map((id, position) => ({ id, position }))
}
