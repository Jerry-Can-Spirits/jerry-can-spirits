import { describe, it, expect } from 'vitest'
import { parseTags, ALLERGENS, DIETARY } from '@/lib/pouriq/allergens'

describe('constants', () => {
  it('has 14 allergens and 2 dietary keys', () => {
    expect(ALLERGENS).toHaveLength(14)
    expect(DIETARY).toEqual(['vegetarian', 'vegan'])
  })
})

describe('parseTags', () => {
  it('valid, empty, malformed', () => {
    expect(parseTags('["milk","gluten"]')).toEqual(['milk', 'gluten'])
    expect(parseTags('[]')).toEqual([])
    expect(parseTags('not json')).toEqual([])
    expect(parseTags('{}')).toEqual([])
  })
})
