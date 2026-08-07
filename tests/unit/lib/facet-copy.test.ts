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
    // 19 indexable facets, 18 written. mocktails is deliberately absent: it
    // describes the same ten drinks as non-alcoholic and canonicalises to it,
    // so a second introduction would be the duplication the canonical resolves.
    expect(Object.keys(FACET_COPY)).toHaveLength(18)
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
