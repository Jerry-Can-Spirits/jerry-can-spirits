import { describe, expect, it } from 'vitest'
import { buildGarnishVocab, parseGarnishItems, type GarnishVocabEntry } from '@/lib/parseGarnish'

const INGREDIENTS: GarnishVocabEntry[] = [
  { name: 'Maraschino Cherry', slug: 'maraschino-cherry' },
  { name: 'Orange Slice', slug: 'orange-slice' },
  { name: 'Orange Slices', slug: 'orange-slices' },
  { name: 'Lemon Twist', slug: 'lemon-twist' },
  { name: 'Angostura Bitters', slug: 'angostura-bitters' },
  { name: 'Pineapple Wedge', slug: 'pineapple-wedge' },
  { name: 'Fresh Mint Sprig', slug: 'fresh-mint-sprig' },
  { name: 'Freshly Grated Nutmeg', slug: 'freshly-grated-nutmeg' },
]

const VOCAB = buildGarnishVocab(INGREDIENTS)
const parse = (g: string) => parseGarnishItems(g, VOCAB)

describe('buildGarnishVocab', () => {
  it('adds an alias only when its target slug exists in the ingredient set', () => {
    expect(VOCAB.some((e) => e.name === 'nutmeg' && e.slug === 'freshly-grated-nutmeg')).toBe(true)
    expect(VOCAB.some((e) => e.name === 'cherry' && e.slug === 'maraschino-cherry')).toBe(true)
    expect(VOCAB.some((e) => e.name === 'cinnamon')).toBe(false)
  })

  it('sorts entries longest-name-first', () => {
    for (let i = 1; i < VOCAB.length; i++) {
      expect(VOCAB[i - 1].name.length).toBeGreaterThanOrEqual(VOCAB[i].name.length)
    }
  })
})

describe('parseGarnishItems', () => {
  it('keeps a single garnish with an "and" in its note as one item', () => {
    expect(parse('Lemon twist expressed over the glass and rested on the rim')).toEqual([
      { slug: 'lemon-twist', note: 'expressed over the glass and rested on the rim' },
    ])
  })

  it('splits a compound garnish into one item per element', () => {
    expect(parse('Maraschino Cherry, orange slice and Angostura bitters pattern')).toEqual([
      { slug: 'maraschino-cherry' },
      { slug: 'orange-slice' },
      { slug: 'angostura-bitters', note: 'pattern' },
    ])
  })

  it('drops an immediate brand/adjective modifier before a name', () => {
    expect(parse('Luxardo Maraschino Cherry')).toEqual([{ slug: 'maraschino-cherry' }])
    expect(parse('Dehydrated orange slice and Angostura bitters pattern')).toEqual([
      { slug: 'orange-slice' },
      { slug: 'angostura-bitters', note: 'pattern' },
    ])
  })

  it('makes a trailing comma-separated element with no page its own note-only item', () => {
    expect(parse('Mint sprig, orange slice, gardenia flower (traditional)')).toEqual([
      { slug: 'fresh-mint-sprig' },
      { slug: 'orange-slice' },
      { note: 'gardenia flower (traditional)' },
    ])
  })

  it('keeps a comma-separated leading element with no page as a note-only item', () => {
    expect(
      parse('Fresh mint bouquet, pineapple wedge and optional flaming demerara sugar cube')
    ).toEqual([
      { note: 'Fresh mint bouquet' },
      { slug: 'pineapple-wedge', note: 'optional flaming demerara sugar cube' },
    ])
  })

  it('attaches an "or" alternative to the previous garnish rather than splitting it', () => {
    expect(parse('Pineapple wedge, orange slice, maraschino cherry, or fresh blackberries')).toEqual([
      { slug: 'pineapple-wedge' },
      { slug: 'orange-slice' },
      { slug: 'maraschino-cherry', note: 'or fresh blackberries' },
    ])
  })

  it('resolves a common spelling via the alias map', () => {
    expect(parse('Freshly grated nutmeg')).toEqual([{ slug: 'freshly-grated-nutmeg' }])
    // a leading modifier before the name ("a dusting of") is dropped, per design
    expect(parse('a dusting of nutmeg')).toEqual([{ slug: 'freshly-grated-nutmeg' }])
  })

  it('returns a single note-only item when nothing matches', () => {
    expect(parse('None traditionally. Serve with a stirrer or short straw.')).toEqual([
      { note: 'None traditionally. Serve with a stirrer or short straw.' },
    ])
  })

  it('does not mis-match a near neighbour (orange slice, not orange slices)', () => {
    expect(parse('orange slice')).toEqual([{ slug: 'orange-slice' }])
  })

  it('returns an empty array for an empty garnish', () => {
    expect(parseGarnishItems('', VOCAB)).toEqual([])
    expect(parseGarnishItems(undefined, VOCAB)).toEqual([])
  })
})
