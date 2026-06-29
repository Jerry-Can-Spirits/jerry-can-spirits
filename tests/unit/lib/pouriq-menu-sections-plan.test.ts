import { describe, it, expect } from 'vitest'
import { itemTypeToSectionName, planSeededSections, resequence } from '@/lib/pouriq/menu-sections-plan'
import type { ItemType } from '@/lib/pouriq/types'

describe('itemTypeToSectionName', () => {
  it.each([
    ['cocktail', 'Cocktails'], ['beer', 'Beer & Cider'], ['cider', 'Beer & Cider'],
    ['wine', 'Wine'], ['spirit', 'Spirits'], ['soft-drink', 'Soft Drinks'],
    ['food', 'Food'], ['other', 'Other'],
  ])('%s -> %s', (t, name) => expect(itemTypeToSectionName(t as ItemType)).toBe(name))
})

describe('planSeededSections', () => {
  it('groups drinks by section name in canonical order with assignments', () => {
    const plan = planSeededSections([
      { id: 'a', item_type: 'beer' }, { id: 'b', item_type: 'cocktail' },
      { id: 'c', item_type: 'cider' }, { id: 'd', item_type: 'cocktail' },
    ])
    expect(plan.sections.map((s) => s.name)).toEqual(['Cocktails', 'Beer & Cider'])
    const cocktails = plan.sections.find((s) => s.name === 'Cocktails')!
    expect(plan.assignments.filter((x) => x.tempId === cocktails.tempId).map((x) => x.cocktailId).sort())
      .toEqual(['b', 'd'])
  })
  it('empty menu -> no sections', () => {
    expect(planSeededSections([])).toEqual({ sections: [], assignments: [] })
  })
})

describe('resequence', () => {
  it('assigns 0-based positions in order', () => {
    expect(resequence(['x', 'y', 'z'])).toEqual([
      { id: 'x', position: 0 }, { id: 'y', position: 1 }, { id: 'z', position: 2 },
    ])
  })
})
