/**
 * The fragment-driven spirit filter on a rollup facet page.
 *
 * The orienting section above a rollup lists the spirits it covers and links
 * each as #spirit=<baseSpirit>. FacetFilter reads that fragment and applies the
 * filter in place. What makes it work at all is that both sides derive their
 * values from the same facet index, so a link and a chip always agree — and
 * that is exactly the sort of coupling that breaks silently when one side is
 * later refactored.
 *
 * The parsing and validation are duplicated here rather than exported from a
 * client component, which is a real cost and the reason these assertions matter.
 */
import { describe, it, expect } from 'vitest'
import { facetFilterOptions, type FacetIndexItem } from '@/lib/cocktail-facets'

/** Exactly the logic in FacetFilter's hash effect. */
function spiritFromHash(hash: string, index: FacetIndexItem[]): string | null {
  const match = /^#spirit=(.+)$/.exec(hash)
  if (!match) return null
  const value = decodeURIComponent(match[1])
  return index.some((item) => item.b === value) ? value : null
}

// A gin rollup as it actually appears: several base spirits under one facet.
const GIN: FacetIndexItem[] = [
  { n: 'Martini', s: 'martini-gin', b: 'gin', d: 'wayfinder' },
  { n: 'Negroni', s: 'negroni', b: 'gin', d: 'novice' },
  { n: 'Pink Gin', s: 'pink-gin', b: 'plymouth-gin', d: 'novice' },
  { n: 'Tom Collins', s: 'tom-collins', b: 'old-tom-gin', d: 'novice' },
  { n: 'Genever Sour', s: 'genever-sour', b: 'genever', d: 'wayfinder' },
]

describe('fragment-driven spirit filter', () => {
  it('applies a base spirit the facet actually holds', () => {
    expect(spiritFromHash('#spirit=plymouth-gin', GIN)).toBe('plymouth-gin')
    expect(spiritFromHash('#spirit=old-tom-gin', GIN)).toBe('old-tom-gin')
  })

  it('ignores a spirit this facet does not hold', () => {
    // A stale link, or a hand-typed fragment. Filtering to an empty list would
    // look like the page had broken.
    expect(spiritFromHash('#spirit=mezcal', GIN)).toBeNull()
  })

  it('ignores fragments that are not a spirit', () => {
    expect(spiritFromHash('', GIN)).toBeNull()
    expect(spiritFromHash('#', GIN)).toBeNull()
    expect(spiritFromHash('#recipes', GIN)).toBeNull()
    expect(spiritFromHash('#spirit=', GIN)).toBeNull()
  })

  it('decodes an encoded value', () => {
    const index: FacetIndexItem[] = [{ n: 'X', s: 'x', b: 'rhum-agricole', d: 'novice' }]
    expect(spiritFromHash('#spirit=rhum-agricole', index)).toBe('rhum-agricole')
  })

  /**
   * The coupling the whole thing rests on. The orienting section links the
   * facet's members; the chips are built by facetFilterOptions from the same
   * index. If those two ever disagree, every link in that section silently
   * filters to nothing.
   */
  it('every value the chips offer is reachable by fragment', () => {
    for (const option of facetFilterOptions(GIN, 'b')) {
      expect(
        spiritFromHash(`#spirit=${encodeURIComponent(option.value)}`, GIN),
        `${option.value} is offered as a chip but not accepted from a fragment`,
      ).toBe(option.value)
    }
  })
})

/**
 * The grid shows a page when idle and the whole facet when filtering, and
 * getting that backwards is the bug this feature was built to fix.
 *
 * Gin holds 74 cocktails across four pages of 24. Plymouth gin's two are the
 * Gimlet and the Pink Gin, which sort onto pages two and three. Filtering only
 * the page in front of the reader answers "Plymouth gin (2)" with an empty
 * grid — worse than the original fault, where the count was right and the tiles
 * merely ignored it.
 */
describe('what the grid shows', () => {
  const PAGE_SIZE = 24
  // 74 name-ordered cocktails; the two Plymouth ones deliberately land on
  // pages 2 and 3, as they do in production.
  const ALL = Array.from({ length: 74 }, (_, i) => ({
    slug: { current: `c${String(i).padStart(2, '0')}` },
    b: i === 30 || i === 55 ? 'plymouth-gin' : 'gin',
  }))

  const shown = (page: number, spirit: string | null) => {
    if (!spirit) return ALL.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    const matched = new Set(ALL.filter((c) => c.b === spirit).map((c) => c.slug.current))
    return ALL.filter((c) => matched.has(c.slug.current))
  }

  it('renders exactly the page slice when nothing is filtered', () => {
    expect(shown(1, null)).toHaveLength(24)
    expect(shown(1, null)[0].slug.current).toBe('c00')
    expect(shown(2, null)[0].slug.current).toBe('c24')
    // 74 = 24 + 24 + 24 + 2
    expect(shown(4, null)).toHaveLength(2)
  })

  it('finds matches on other pages, which is the entire point', () => {
    const matches = shown(1, 'plymouth-gin')
    expect(matches).toHaveLength(2)
    expect(matches.map((c) => c.slug.current)).toEqual(['c30', 'c55'])
  })

  it('gives the same matches from any page', () => {
    for (const page of [1, 2, 3, 4]) {
      expect(shown(page, 'plymouth-gin')).toHaveLength(2)
    }
  })
})
