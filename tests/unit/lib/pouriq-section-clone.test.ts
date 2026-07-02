import { describe, it, expect } from 'vitest'
import { planSectionClone } from '@/lib/pouriq/menu-sections-plan'

describe('planSectionClone', () => {
  const gen = () => {
    let n = 0
    return () => `new-${++n}`
  }

  it('remaps ids, orders top sections before sub-sections, and remaps parents', () => {
    const newId = gen()
    const source = [
      { id: 'top-a', name: 'Cocktails', parent_section_id: null, position: 0 },
      { id: 'sub-a1', name: 'Signatures', parent_section_id: 'top-a', position: 0 },
      { id: 'top-b', name: 'Beer', parent_section_id: null, position: 1 },
    ]
    const { inserts, idMap } = planSectionClone(source, newId)

    // Every source section gets a fresh, unique id.
    expect(idMap.size).toBe(3)
    expect(new Set(idMap.values()).size).toBe(3)

    // Sub-sections insert AFTER both top sections (self-FK safe).
    const ids = inserts.map((i) => i.id)
    const subNew = idMap.get('sub-a1')!
    expect(ids.indexOf(subNew)).toBeGreaterThan(ids.indexOf(idMap.get('top-a')!))
    expect(ids.indexOf(subNew)).toBeGreaterThan(ids.indexOf(idMap.get('top-b')!))

    // Sub-section parent is remapped to the NEW top-a id; name + position preserved.
    const sub = inserts.find((i) => i.id === subNew)!
    expect(sub.parent_section_id).toBe(idMap.get('top-a'))
    expect(sub.name).toBe('Signatures')
    expect(sub.position).toBe(0)

    // Top section keeps a null parent.
    const topA = inserts.find((i) => i.id === idMap.get('top-a'))!
    expect(topA.parent_section_id).toBeNull()
  })

  it('empty source produces no inserts and an empty map', () => {
    const { inserts, idMap } = planSectionClone([], gen())
    expect(inserts).toEqual([])
    expect(idMap.size).toBe(0)
  })
})
