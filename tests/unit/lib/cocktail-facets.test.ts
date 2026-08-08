import { describe, expect, it } from 'vitest'
import {
  FACET_PAGE_SIZE,
  INDEXABLE_MIN_COCKTAILS,
  SPIRIT_FACETS,
  SPIRIT_ROLLUPS,
  STANDALONE_SPIRITS,
  canonicalFor,
  duplicateTarget,
  facetFilterOptions,
  filterFacetIndex,
  isFiltering,
  type FacetIndexItem,
  headingFor,
  facetForBaseSpirit,
  facetPath,
  hasSubTypes,
  isIndexable,
  isSelfCanonical,
  isValidPage,
  labelFor,
  pageCount,
  robotsFor,
  rollupFor,
  titleFor,
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

  it('covers every gin style, and deliberately excludes sloe gin', () => {
    // Sloe gin is a liqueur at 15-30% doing a modifier's job, and two of its
    // four cocktails contain no gin at all: Charlie Chaplin is sloe gin,
    // apricot and lime, and Slow Comfortable Screw is vodka-based. A reader
    // holding a bottle of gin cannot make either, which is the test the gin
    // facet has to pass. It is related to gin on the ingredient side, via
    // parent, which is where that relationship is true.
    for (const s of ['gin', 'london-dry-gin', 'old-tom-gin', 'plymouth-gin', 'navy-strength-gin']) {
      expect(rollupFor(s)).toBe('gin')
    }
    expect(rollupFor('sloe-gin')).toBeNull()
  })

  it('excludes genever for the opposite reason to sloe gin', () => {
    // Genever passes the class test that sloe gin fails: it is a base spirit at
    // full strength doing a base spirit's job. It fails on direction instead.
    // Gin descends FROM genever, so filing it as a style of gin is backwards.
    //
    // Excluding it costs the reader nothing: John Collins is the genever build
    // and Tom Collins is the London Dry build of the same drink, so the gin
    // page still carries the version someone holding gin can actually make.
    expect(rollupFor('genever')).toBeNull()
    expect(facetForBaseSpirit('genever')).toBeNull()
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

describe('the page-number guard', () => {
  // 85 cocktails at 24 a page is four pages.
  const SOURS = 85

  it('accepts every page that exists', () => {
    for (const n of [1, 2, 3, 4]) expect(isValidPage(n, SOURS)).toBe(true)
  })

  it('rejects a page past the end and a page before the start', () => {
    expect(isValidPage(5, SOURS)).toBe(false)
    expect(isValidPage(0, SOURS)).toBe(false)
    expect(isValidPage(-1, SOURS)).toBe(false)
  })

  it('rejects a page number that is not a number at all', () => {
    // /page/abc/ reaches the route as Number('abc'), which is NaN. Every
    // comparison against NaN is false, so a bounds-only check returns true here
    // and renders an empty grid at a URL that looks real. This is the case the
    // guard exists for, and it is reachable only because dynamicParams had to
    // be turned on for the facet pages to serve at all.
    expect(isValidPage(Number('abc'), SOURS)).toBe(false)
    expect(isValidPage(NaN, SOURS)).toBe(false)
  })

  it('rejects a fractional page', () => {
    expect(isValidPage(Number('2.5'), SOURS)).toBe(false)
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

describe('which facets are worth linking to', () => {
  const sours = { kind: 'style' as const, value: 'sours', count: 85, isRollup: false }
  const flips = { kind: 'style' as const, value: 'flips', count: 1, isRollup: false }
  const mocktails = { kind: 'style' as const, value: 'mocktails', count: 10, isRollup: false }

  it('advertises a facet whose own URL is its canonical', () => {
    expect(isSelfCanonical(sours)).toBe(true)
    expect(isSelfCanonical(sours, 3)).toBe(true)
  })

  it('does not advertise a thin facet, which canonicalises to the hub', () => {
    // A sitemap entry or hub link pointing at a URL that disclaims itself is a
    // contradiction. The page still exists and is still followed.
    expect(isSelfCanonical(flips)).toBe(false)
  })

  it('does not advertise a duplicate, which canonicalises to the facet it duplicates', () => {
    // mocktails clears the count floor and is still not advertised, because the
    // issue is duplication rather than thinness.
    expect(isIndexable(mocktails)).toBe(true)
    expect(isSelfCanonical(mocktails)).toBe(false)
  })

  it('agrees with canonicalFor by construction, at every page', () => {
    // The point of the helper: it asks canonicalFor rather than re-deciding.
    // If canonicalFor changes, this follows it instead of contradicting it.
    for (const facet of [sours, flips, mocktails]) {
      for (const page of [1, 2, 5]) {
        expect(isSelfCanonical(facet, page)).toBe(
          canonicalFor(facet, page) === facetPath(facet.kind, facet.value, page)
        )
      }
    }
  })
})

describe('the facet page filters', () => {
  // A style facet: one family, several spirits, several difficulties.
  const SOURS: FacetIndexItem[] = [
    { n: 'Whiskey Sour', s: 'whiskey-sour', b: 'bourbon', d: 'novice' },
    { n: 'Gin Sour', s: 'gin-sour', b: 'london-dry-gin', d: 'novice' },
    { n: 'White Lady', s: 'white-lady', b: 'london-dry-gin', d: 'wayfinder' },
    { n: 'Ramos Gin Fizz', s: 'ramos-gin-fizz', b: 'london-dry-gin', d: 'trailblazer' },
    { n: 'Daiquiri', s: 'daiquiri', b: 'white-rum', d: 'novice' },
    { n: 'Orphan', s: 'orphan', b: null, d: null },
  ]

  it('filters by name, case insensitively', () => {
    expect(filterFacetIndex(SOURS, { q: 'gin' }).map((i) => i.s)).toEqual(['gin-sour', 'ramos-gin-fizz'])
    expect(filterFacetIndex(SOURS, { q: 'WHITE' }).map((i) => i.s)).toEqual(['white-lady'])
  })

  it('filters by base spirit', () => {
    expect(filterFacetIndex(SOURS, { spirit: 'london-dry-gin' })).toHaveLength(3)
  })

  it('filters by difficulty', () => {
    expect(filterFacetIndex(SOURS, { difficulty: 'novice' })).toHaveLength(3)
  })

  it('combines every filter, which is the whole point of porting them here', () => {
    // The hub could do spirit AND difficulty AND search together; the facet
    // page could only do search. That gap is why sending a reader from the hub
    // to a facet page was a downgrade.
    const out = filterFacetIndex(SOURS, { q: 'gin', spirit: 'london-dry-gin', difficulty: 'novice' })
    expect(out.map((i) => i.s)).toEqual(['gin-sour'])
  })

  it('excludes a cocktail with no value rather than passing it through', () => {
    // Absent is not a match. A listing that quietly includes unknowns under a
    // specific filter is lying about what it did.
    expect(filterFacetIndex(SOURS, { spirit: 'london-dry-gin' }).some((i) => i.s === 'orphan')).toBe(false)
    expect(filterFacetIndex(SOURS, { difficulty: 'novice' }).some((i) => i.s === 'orphan')).toBe(false)
  })

  it('returns everything when nothing is filtering', () => {
    expect(filterFacetIndex(SOURS, {})).toHaveLength(SOURS.length)
    expect(filterFacetIndex(SOURS, { q: '   ' })).toHaveLength(SOURS.length)
  })

  it('knows when a filter is active, ignoring whitespace', () => {
    expect(isFiltering({})).toBe(false)
    expect(isFiltering({ q: '   ' })).toBe(false)
    expect(isFiltering({ q: 'gin' })).toBe(true)
    expect(isFiltering({ spirit: 'bourbon' })).toBe(true)
    expect(isFiltering({ difficulty: 'novice' })).toBe(true)
  })

  it('offers only the options this facet actually contains, most common first', () => {
    // A family holding no trailblazers must not offer the control, and a
    // cocktail with no value contributes no option at all.
    expect(facetFilterOptions(SOURS, 'b')).toEqual([
      { value: 'london-dry-gin', count: 3 },
      { value: 'bourbon', count: 1 },
      { value: 'white-rum', count: 1 },
    ])
    expect(facetFilterOptions(SOURS, 'd')[0]).toEqual({ value: 'novice', count: 3 })
    expect(facetFilterOptions([{ n: 'x', s: 'x' }], 'b')).toEqual([])
  })
})

describe('labels', () => {
  it('title-cases a slug', () => {
    expect(labelFor('old-fashioneds')).toBe('Old Fashioneds')
    expect(labelFor('rum')).toBe('Rum')
  })
})

describe('standalone spirit facets', () => {
  it('gives champagne and non-alcoholic a page, since neither sits in a rollup', () => {
    // Both clear the floor and both fall outside all six rollups, so without an
    // entry here they would produce no page at all.
    expect(Object.keys(STANDALONE_SPIRITS).sort()).toEqual(['champagne', 'non-alcoholic'])
    for (const slug of Object.keys(STANDALONE_SPIRITS)) {
      expect(SPIRIT_FACETS[slug].isRollup, `${slug} must not claim the rollup exemption`).toBe(false)
    }
  })

  it('holds a standalone to the floor rather than exempting it', () => {
    // MEASURED: champagne 12, non-alcoholic 11. Both earn their page. Neither
    // keeps it if the count falls, which is the difference from a rollup.
    expect(isIndexable({ value: 'champagne', count: 12, isRollup: false })).toBe(true)
    expect(isIndexable({ value: 'non-alcoholic', count: 11, isRollup: false })).toBe(true)
    expect(isIndexable({ value: 'champagne', count: 4, isRollup: false })).toBe(false)
  })

  it('resolves a standalone base spirit to its own facet but to no rollup', () => {
    expect(rollupFor('champagne')).toBeNull()
    expect(facetForBaseSpirit('champagne')).toBe('champagne')
    expect(facetForBaseSpirit('white-rum')).toBe('rum')
  })

  it('exposes 19 indexable facets at current counts', () => {
    // 11 styles at or above the floor, 6 rollups, 2 standalones.
    const styles = [85, 43, 41, 26, 20, 19, 19, 16, 13, 11, 10]
    const indexableStyles = styles.filter((c) => isIndexable({ value: 'x', count: c, isRollup: false }))
    expect(indexableStyles).toHaveLength(11)
    expect(Object.keys(SPIRIT_FACETS)).toHaveLength(8)
  })
})

describe('the orienting section', () => {
  it('shows for a facet covering several base spirits', () => {
    expect(hasSubTypes({ members: SPIRIT_ROLLUPS.rum.members })).toBe(true)
    expect(hasSubTypes({ members: SPIRIT_ROLLUPS.whiskey.members })).toBe(true)
  })

  it('shows for gin, which gained styles in the sub-type pass', () => {
    // This assertion used to read `false`, with the comment "Gin is a rollup of
    // one". That was accurate and is no longer: London Dry, Old Tom, Plymouth
    // and Navy Strength are now members, so the orienting section switches on
    // by itself. The change of expectation IS the taxonomy change being
    // recorded, not a broken test being repaired.
    expect(hasSubTypes({ members: SPIRIT_ROLLUPS.gin.members })).toBe(true)
  })

  it('does not show where there is nothing to explain', () => {
    // A style facet has no members at all. A heading reading "what counts as
    // sours here" over an empty list is noise.
    expect(hasSubTypes({ members: [] })).toBe(false)
    expect(hasSubTypes({ members: SPIRIT_ROLLUPS.vodka.members })).toBe(false)
  })
})

describe('robots and titles', () => {
  it('noindexes a thin facet but keeps following its links', () => {
    // The cocktail links are real and worth crawling even when the listing
    // page should not rank.
    expect(robotsFor({ kind: 'style', value: 'flips', count: 1, isRollup: false })).toEqual({ index: false, follow: true })
    expect(robotsFor({ kind: 'style', value: 'sours', count: 85, isRollup: false })).toEqual({ index: true, follow: true })
  })

  it('gives every page a distinct title', () => {
    expect(titleFor({ kind: 'style', label: 'Sours' }, 1)).toBe('Sours')
    expect(titleFor({ kind: 'style', label: 'Sours' }, 2)).toBe('Sours, page 2')
  })

  it('uses no em-dash in a title, which is customer-facing copy', () => {
    expect(titleFor({ kind: 'spirit', label: 'Rum' }, 3)).not.toContain('—')
  })

})

describe('duplicate facets', () => {
  const mocktails = { kind: 'style' as const, value: 'mocktails', count: 10, isRollup: false }

  it('canonicalises a duplicate to the facet it duplicates, not to the hub', () => {
    // MEASURED: all ten mocktails are also tagged non-alcoholic. The other page
    // is the better answer, not a broader one.
    expect(canonicalFor(mocktails)).toBe('/field-manual/cocktails/spirit/non-alcoholic/')
  })

  it('noindexes a duplicate whatever its count, but keeps following its links', () => {
    // It clears the floor at 10 and is still not indexed, because the issue is
    // duplication rather than thinness. The recipes are real either way.
    expect(isIndexable(mocktails)).toBe(true)
    expect(robotsFor(mocktails)).toEqual({ index: false, follow: true })
  })

  it('leaves every other facet alone', () => {
    const sours = { kind: 'style' as const, value: 'sours', count: 85, isRollup: false }
    expect(duplicateTarget('style', 'sours')).toBeNull()
    expect(canonicalFor(sours)).toBe('/field-manual/cocktails/style/sours/')
  })
})

describe('the fallback heading', () => {
  it('does not append the noun to a style, which already names a family', () => {
    // Otherwise the 13 facets without written copy render "Mocktails
    // Cocktails" and "Flips Cocktails". They are noindexed, not unreachable.
    expect(headingFor({ kind: 'style', label: 'Mocktails' })).toBe('Mocktails')
    expect(headingFor({ kind: 'style', label: 'Flips' })).toBe('Flips')
  })

  it('appends it to a spirit, which is an ingredient rather than a family', () => {
    expect(headingFor({ kind: 'spirit', label: 'Rum' })).toBe('Rum Cocktails')
  })
})
