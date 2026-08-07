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
  it('is empty until copy is approved, and a missing entry renders no intro', () => {
    // The template must never generate filler for a facet nobody has written.
    expect(Object.keys(FACET_COPY)).toHaveLength(0)
    expect(copyFor('spirit', 'whiskey')).toBeUndefined()
  })
})
