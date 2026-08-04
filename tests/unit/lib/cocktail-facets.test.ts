import { describe, expect, it } from 'vitest'
import {
  FACET_PAGE_SIZE,
  INDEXABLE_MIN_COCKTAILS,
  SPIRIT_ROLLUPS,
  canonicalFor,
  facetPath,
  isIndexable,
  labelFor,
  pageCount,
  rollupFor,
} from '@/lib/cocktail-facets'

describe('spirit rollups', () => {
  it('covers the rum fragmentation that leaves no page for the head term', () => {
    // 53 cocktails split five ways in baseSpirit, with nothing answering "rum cocktails".
    for (const s of ['white-rum', 'dark-rum', 'aged-rum', 'spiced-rum', 'overproof-rum']) {
      expect(rollupFor(s)).toBe('rum')
    }
  })

  it('covers whiskey across both spellings', () => {
    // Irish and American take the "e", Scotch and Japanese do not. One rollup, one slug.
    for (const s of ['bourbon', 'rye-whiskey', 'scotch', 'irish-whiskey', 'welsh-whisky']) {
      expect(rollupFor(s)).toBe('whiskey')
    }
  })

  it('assigns every rollup member to exactly one rollup', () => {
    const seen = new Set<string>()
    for (const { members } of Object.values(SPIRIT_ROLLUPS)) {
      for (const m of members) {
        expect(seen.has(m), `${m} is in two rollups`).toBe(false)
        seen.add(m)
      }
    }
  })

  it('returns null for a spirit in no rollup', () => {
    expect(rollupFor('sherry')).toBeNull()
    expect(rollupFor('champagne')).toBeNull()
  })

  it('treats all six rollups as equals — none is special-cased', () => {
    expect(Object.keys(SPIRIT_ROLLUPS).sort()).toEqual(['brandy', 'gin', 'rum', 'tequila', 'vodka', 'whiskey'])
  })
})

describe('indexability', () => {
  const raw = (value: string, count: number) => ({ value, count, isRollup: false })

  it('indexes a raw facet at or above the floor', () => {
    expect(isIndexable(raw('sours', 85))).toBe(true)
    expect(isIndexable(raw('mocktails', INDEXABLE_MIN_COCKTAILS))).toBe(true)
  })

  it('does not index a thin facet', () => {
    // A page listing one recipe is thin whatever is written around it.
    expect(isIndexable(raw('cobblers', 1))).toBe(false)
    expect(isIndexable(raw('slings', 3))).toBe(false)
  })

  it('never indexes the junk facets regardless of count', () => {
    expect(isIndexable(raw('multiple', 20))).toBe(false)
    expect(isIndexable(raw('other', 6))).toBe(false)
    expect(isIndexable(raw('liqueur', 18))).toBe(false)
  })

  it('indexes a rollup even below the raw floor, since it answers the head term', () => {
    expect(isIndexable({ value: 'tequila', count: 5, isRollup: true })).toBe(true)
  })

  it('does not index an empty rollup', () => {
    expect(isIndexable({ value: 'vodka', count: 0, isRollup: true })).toBe(false)
  })
})

describe('paths and pagination', () => {
  it('omits the page segment on page 1', () => {
    expect(facetPath('style', 'sours')).toBe('/field-manual/cocktails/style/sours/')
    expect(facetPath('spirit', 'rum')).toBe('/field-manual/cocktails/spirit/rum/')
  })

  it('adds a trailing-slash page segment for later pages', () => {
    // trailingSlash: true — a path without the final slash 308s and wastes crawl budget.
    expect(facetPath('style', 'sours', 3)).toBe('/field-manual/cocktails/style/sours/page/3/')
  })

  it('paginates by the configured size and never returns zero pages', () => {
    expect(pageCount(85)).toBe(Math.ceil(85 / FACET_PAGE_SIZE))
    expect(pageCount(FACET_PAGE_SIZE)).toBe(1)
    expect(pageCount(0)).toBe(1)
  })
})

describe('canonicals', () => {
  const sours = { kind: 'style' as const, value: 'sours', count: 85, isRollup: false }

  it('makes every indexable page self-canonical, including page 2+', () => {
    // Later pages carry distinct recipes; pointing them at page 1 asks Google
    // to drop real content.
    expect(canonicalFor(sours, 1)).toBe('/field-manual/cocktails/style/sours/')
    expect(canonicalFor(sours, 2)).toBe('/field-manual/cocktails/style/sours/page/2/')
  })

  it('canonicalises a non-indexable facet up to the unfiltered hub', () => {
    const flips = { kind: 'style' as const, value: 'flips', count: 1, isRollup: false }
    expect(canonicalFor(flips)).toBe('/field-manual/cocktails/')
    expect(canonicalFor(flips, 2)).toBe('/field-manual/cocktails/')
  })
})

describe('labels', () => {
  it('title-cases a slug', () => {
    expect(labelFor('old-fashioneds')).toBe('Old Fashioneds')
    expect(labelFor('rum')).toBe('Rum')
  })
})
