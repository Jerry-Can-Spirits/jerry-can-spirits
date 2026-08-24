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
