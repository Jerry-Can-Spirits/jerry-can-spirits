/**
 * Counts in facet copy are tokens, not written numbers, because a written
 * number is wrong the day someone adds a recipe and nothing in the build
 * compares the sentence to the data.
 *
 * The cases that matter are the degenerate ones: a facet holding one recipe
 * must not read "1 recipes", and a sub-type that empties out must leave the
 * sentence rather than render "0 Welsh".
 */
import { describe, it, expect } from 'vitest'
import { renderCopy, renderSplit, FACET_COPY, copyFor } from '@/lib/facet-copy'
import { SPIRIT_FACETS } from '@/lib/cocktail-facets'

describe('count tokens', () => {
  it('fills the total', () => {
    expect(renderCopy('{count} cocktails', { count: 74 })).toBe('74 cocktails')
  })

  it('agrees the noun with the number', () => {
    expect(renderCopy('{recipes}', { count: 74 })).toBe('74 recipes')
    expect(renderCopy('{recipes}', { count: 1 })).toBe('1 recipe')
  })

  it('emits digits, since a token cannot spell a number', () => {
    // Mixing "seventy-four" with a live "27" is worse than digits throughout.
    expect(renderCopy('{count}', { count: 74 })).toBe('74')
  })

  it('leaves an unknown token visible rather than blanking it', () => {
    // A typo should show up on the page, not vanish into a sentence that still
    // reads plausibly.
    expect(renderCopy('{cont} cocktails', { count: 74 })).toBe('{cont} cocktails')
  })
})

describe('the sub-type split', () => {
  const whiskey = [
    { member: 'bourbon', count: 27 },
    { member: 'rye-whiskey', count: 22 },
    { member: 'scotch', count: 14 },
    { member: 'irish-whiskey', count: 8 },
    { member: 'welsh-whisky', count: 3 },
  ]

  it('renders the whole breakdown with correct punctuation', () => {
    expect(renderSplit(whiskey)).toBe('27 bourbon, 22 rye, 14 Scotch, 8 Irish and 3 Welsh')
  })

  it('keeps proper nouns capitalised and common nouns lower case', () => {
    expect(renderSplit(whiskey)).toContain('Scotch')
    expect(renderSplit(whiskey)).toContain('bourbon')
  })

  it('drops a sub-type that has emptied out rather than rendering a zero', () => {
    const withZero = [...whiskey.slice(0, 2), { member: 'welsh-whisky', count: 0 }]
    const out = renderSplit(withZero)
    expect(out).not.toContain('0 Welsh')
    expect(out).toBe('27 bourbon and 22 rye')
  })

  it('handles a single surviving sub-type without a stray conjunction', () => {
    expect(renderSplit([{ member: 'bourbon', count: 27 }])).toBe('27 bourbon')
  })

  it('renders nothing for a facet with no sub-types', () => {
    expect(renderSplit([])).toBe('')
    expect(renderSplit(undefined)).toBe('')
  })

  it('uses no Oxford comma, matching the rest of the site', () => {
    expect(renderSplit(whiskey)).not.toContain(', and')
  })
})

describe('the copy store', () => {
  it('holds an entry for every indexable facet except the duplicate', () => {
    // 25 indexable facets, 24 written. mocktails is deliberately absent: it
    // describes the same ten drinks as non-alcoholic and canonicalises to it,
    // so a second introduction would be the duplication the canonical resolves.
    // The floor dropped to 5 on 10 Oct 2026; these six cleared it then.
    expect(Object.keys(FACET_COPY)).toHaveLength(24)
    for (const style of ['iced-teas', 'spritz', 'toddies', 'shots-shooters', 'smashes', 'mules']) {
      expect(copyFor('style', style)).toBeDefined()
    }
    expect(copyFor('style', 'mocktails')).toBeUndefined()
    expect(copyFor('spirit', 'non-alcoholic')).toBeDefined()
  })

  it('renders no introduction for a facet nobody has written', () => {
    // The template must never generate filler.
    expect(copyFor('style', 'swizzles')).toBeUndefined()
  })

  it('gives every entry all four fields', () => {
    for (const [key, copy] of Object.entries(FACET_COPY)) {
      expect(copy.h1, `${key} h1`).toBeTruthy()
      expect(copy.title, `${key} title`).toBeTruthy()
      expect(copy.description, `${key} description`).toBeTruthy()
      expect(copy.intro, `${key} intro`).toBeTruthy()
    }
  })

  it('keeps every H1 free of a count, which is the reason it is its own field', () => {
    for (const [key, copy] of Object.entries(FACET_COPY)) {
      expect(copy.h1, `${key} h1 carries a token`).not.toMatch(/\{/)
    }
  })

  it('uses no em-dash and no exclamation mark anywhere in the copy', () => {
    // VOICE.md, enforced rather than remembered. Comments in this file are
    // house style and are not copy; these are the strings readers see.
    for (const [key, copy] of Object.entries(FACET_COPY)) {
      for (const [field, value] of Object.entries(copy)) {
        expect(value, `${key}.${field} contains an em-dash`).not.toContain('—')
        expect(value, `${key}.${field} contains an exclamation mark`).not.toContain('!')
      }
    }
  })

  it('opens every introduction with the source of the fact', () => {
    // "This Field Manual holds ..." is what makes the first sentence
    // unliftable: it is a claim about this site's data, not about cocktails in
    // general, so it cannot be pasted onto a competitor.
    for (const [key, copy] of Object.entries(FACET_COPY)) {
      expect(copy.intro, `${key} intro`).toMatch(/^This Field Manual holds \{recipes\}/)
    }
  })
})

/**
 * The tests above check tokens. These check sentences.
 *
 * That distinction is the finding: every token test passed while the rendered
 * title read "1 Recipes by Style" and the intro read "1 recipe ... are built on
 * whiskey". A check that measures the component rather than the output is the
 * same failure shape as every other verification failure on this project.
 *
 * These assert on the finished string at the counts where grammar breaks.
 */
describe('rendered sentences', () => {
  const TITLE = 'Whiskey Cocktails: {recipes} by Style'
  const INTRO = 'This Field Manual holds {recipes} built on whiskey: {split}.'

  it('reads correctly at a count of one', () => {
    const ctx = { count: 1, split: [{ member: 'bourbon', count: 1 }] }
    expect(renderCopy(TITLE, ctx)).toBe('Whiskey Cocktails: 1 recipe by Style')
    expect(renderCopy(INTRO, ctx)).toBe('This Field Manual holds 1 recipe built on whiskey: 1 bourbon.')
  })

  it('reads correctly at a count of two', () => {
    const ctx = {
      count: 2,
      split: [
        { member: 'bourbon', count: 1 },
        { member: 'scotch', count: 1 },
      ],
    }
    expect(renderCopy(TITLE, ctx)).toBe('Whiskey Cocktails: 2 recipes by Style')
    expect(renderCopy(INTRO, ctx)).toBe('This Field Manual holds 2 recipes built on whiskey: 1 bourbon and 1 Scotch.')
  })

  it('drops a sub-type that has emptied out of the finished sentence', () => {
    const ctx = {
      count: 27,
      split: [
        { member: 'bourbon', count: 27 },
        { member: 'welsh-whisky', count: 0 },
      ],
    }
    const out = renderCopy(INTRO, ctx)
    expect(out).toBe('This Field Manual holds 27 recipes built on whiskey: 27 bourbon.')
    expect(out).not.toContain('0 ')
    expect(out).not.toContain('and .')
  })

  it('never produces a singular number with a plural noun', () => {
    for (const count of [1, 2, 74]) {
      const out = renderCopy(TITLE, { count, split: [{ member: 'bourbon', count }] })
      expect(out, `count ${count} produced "${out}"`).not.toMatch(/\b1 recipes\b/)
      expect(out).not.toMatch(/\b(?!1\b)\d+ recipe\b/)
    }
  })
})

describe('an unmapped sub-type', () => {
  it('renders human-readable rather than as a raw slug', () => {
    // The day someone tags a new sub-type, this is what appears in live copy
    // on every page using {split}. A hyphenated slug in prose is the failure.
    expect(renderSplit([{ member: 'navy-rum', count: 1 }])).toBe('1 navy rum')
    expect(renderSplit([{ member: 'navy-rum', count: 1 }])).not.toContain('-')
  })

  it('still prefers an explicit label where one exists', () => {
    expect(renderSplit([{ member: 'rye-whiskey', count: 22 }])).toBe('22 rye')
  })
})

describe('{styles}', () => {
  it('counts the sub-types that hold something', () => {
    const split = [
      { member: 'white-rum', count: 19 },
      { member: 'dark-rum', count: 13 },
      { member: 'navy-rum', count: 0 },
    ]
    expect(renderCopy('{styles} styles', { count: 32, split })).toBe('2 styles')
  })

  it('keeps a meta inside the ceiling where {split} would not', () => {
    // MEASURED: the same sentence with {split} renders at 188 characters.
    const split = [
      { member: 'white-rum', count: 19 },
      { member: 'dark-rum', count: 13 },
      { member: 'aged-rum', count: 10 },
      { member: 'spiced-rum', count: 8 },
      { member: 'overproof-rum', count: 2 },
      { member: 'rhum-agricole', count: 1 },
      { member: 'cachaca', count: 1 },
    ]
    const meta = renderCopy(
      '{recipes} built on rum across {styles} styles. Which rum you reach for changes the drink more than which bottle.',
      { count: 54, split }
    )
    expect(meta.length).toBeLessThan(155)
  })

})

describe('{top}', () => {
  const split = [
    { member: 'scotch', count: 16 },
    { member: 'bourbon', count: 24 },
    { member: 'japanese-whisky', count: 1 },
    { member: 'rye-whiskey', count: 22 },
    { member: 'irish-whiskey', count: 0 },
  ]

  it('names the three largest sub-types, largest first, whatever order they arrive in', () => {
    expect(renderCopy('{top}', { count: 63, split })).toBe('24 bourbon, 22 rye and 16 Scotch')
  })

  it('names fewer when fewer hold something', () => {
    expect(renderCopy('{top}', { count: 24, split: [{ member: 'bourbon', count: 24 }, { member: 'scotch', count: 0 }] })).toBe(
      '24 bourbon'
    )
  })
})

/**
 * Every written meta and title, rendered at real counts, against the ceilings.
 *
 * MEASURED 12 Oct 2026 from the published dataset (377 cocktails). The whiskey
 * meta used {split} then and rendered at 154 of 155 with seven sub-types, so
 * the next sub-type would have pushed it over and nothing would have said so.
 * The headroom case renders every facet at 999 recipes, every configured
 * member at 99 and one extra unmapped member besides, so a facet that grows
 * or gains a sub-type fails here before it fails in search results.
 */
describe('every facet inside the ceilings', () => {
  const FAMILY_COUNTS: Record<string, number> = {
    sours: 91, highballs: 52, martinis: 43, 'old-fashioneds': 26, punches: 20, manhattans: 20, tiki: 19,
    fizzes: 16, negronis: 12, spritz: 8, 'iced-teas': 7, toddies: 6, 'shots-shooters': 6, smashes: 5,
    mules: 5, collins: 5,
  }
  const BASE_COUNTS: Record<string, number> = {
    bourbon: 24, 'tennessee-whiskey': 3, 'rye-whiskey': 22, scotch: 16, 'irish-whiskey': 8, 'welsh-whisky': 3,
    'japanese-whisky': 1, 'london-dry-gin': 57, gin: 10, 'old-tom-gin': 5, 'plymouth-gin': 2, vodka: 39,
    'dark-rum': 14, 'white-rum': 20, 'aged-rum': 12, 'spiced-rum': 9, 'overproof-rum': 2, 'rhum-agricole': 1,
    cachaca: 2, tequila: 19, mezcal: 7, cognac: 12, brandy: 12, champagne: 12, 'non-alcoholic': 10,
  }

  function todayContext(key: string) {
    const [kind, value] = key.split(':')
    if (kind === 'style') return { count: FAMILY_COUNTS[value] ?? 0 }
    const members = SPIRIT_FACETS[value]?.members ?? []
    const split = members
      .map((member) => ({ member, count: BASE_COUNTS[member] ?? 0 }))
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count)
    return { count: split.reduce((sum, m) => sum + m.count, 0), split: members.length > 1 ? split : [] }
  }

  function headroomContext(key: string) {
    const [kind, value] = key.split(':')
    const members = kind === 'spirit' ? SPIRIT_FACETS[value]?.members ?? [] : []
    const split = members.length > 1 ? [...members, 'another-sub-type'].map((member) => ({ member, count: 99 })) : []
    return { count: 999, split }
  }

  it('has a measured count for every facet with written copy', () => {
    for (const key of Object.keys(FACET_COPY)) {
      expect(todayContext(key).count, `${key} has no count`).toBeGreaterThan(0)
    }
  })

  for (const [label, contextFor] of [
    ['today', todayContext],
    ['with headroom', headroomContext],
  ] as const) {
    it(`keeps every meta description at 155 characters or fewer ${label}`, () => {
      for (const [key, copy] of Object.entries(FACET_COPY)) {
        const meta = renderCopy(copy.description ?? '', contextFor(key))
        expect(meta.length, `${key}: "${meta}"`).toBeLessThanOrEqual(155)
      }
    })

    it(`keeps every title at 60 characters or fewer ${label}`, () => {
      for (const [key, copy] of Object.entries(FACET_COPY)) {
        const title = renderCopy(copy.title ?? '', contextFor(key))
        expect(title.length, `${key}: "${title}"`).toBeLessThanOrEqual(60)
      }
    })
  }

  it('renders the whiskey meta from its three largest sub-types', () => {
    const meta = renderCopy(FACET_COPY['spirit:whiskey'].description ?? '', todayContext('spirit:whiskey'))
    expect(meta).toBe(
      '77 recipes built on whiskey, led by 24 bourbon, 22 rye and 16 Scotch. Bourbon, rye and Scotch are not interchangeable.'
    )
  })
})

describe('claims the copy no longer makes', () => {
  // Citation sweep, 12 Oct 2026: plain strings cannot carry a link, so a
  // checkable claim with no named source comes out rather than going uncited.
  const removed = [
    /Jack Daniel/,
    /charcoal/,
    /by law/,
    /the law separates/,
    /1950s/,
    /oldest/,
    /appellation/,
    /defined by absence/,
  ]

  it('carries none of the uncited claims the sweep found', () => {
    for (const [key, copy] of Object.entries(FACET_COPY)) {
      for (const [field, value] of Object.entries(copy)) {
        for (const pattern of removed) {
          expect(value, `${key}.${field} matches ${pattern}`).not.toMatch(pattern)
        }
      }
    }
  })
})
