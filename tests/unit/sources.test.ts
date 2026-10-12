/**
 * A guide lists its sources so the reader can check what it says. The list
 * must read the accessed date as the day it was stored, wherever the server
 * runs, and must vanish rather than render an empty heading when there is
 * nothing to list.
 */
import { describe, it, expect } from 'vitest'
import Sources from '@/components/Sources'
import { formatAccessed, listableSources, sourceCitations, type Source } from '@/lib/sources'

const IBA: Source = {
  title: 'Negroni',
  publisher: 'IBA',
  url: 'https://iba-world.com/negroni/',
  accessed: '2026-10-12',
}

describe('formatAccessed', () => {
  it('writes a Sanity date as an en-GB long date', () => {
    expect(formatAccessed('2026-10-12')).toBe('12 October 2026')
  })

  it('keeps the stored day at the edges of a month and year', () => {
    expect(formatAccessed('2026-01-01')).toBe('1 January 2026')
    expect(formatAccessed('2026-12-31')).toBe('31 December 2026')
  })
})

describe('the empty state', () => {
  it('renders nothing when a guide has no sources', () => {
    expect(Sources({ sources: [] })).toBeNull()
  })

  it('treats a missing field as no sources', () => {
    expect(listableSources(undefined)).toEqual([])
    expect(listableSources(null)).toEqual([])
  })

  it('renders the list when there is one', () => {
    expect(Sources({ sources: [IBA] })).not.toBeNull()
  })
})

describe('listableSources', () => {
  it('drops an entry the reader could not follow', () => {
    expect(
      listableSources([
        IBA,
        null,
        { ...IBA, url: 'javascript:alert(1)' },
        { ...IBA, title: '  ' },
        { ...IBA, publisher: undefined },
        { ...IBA, accessed: undefined },
      ]),
    ).toEqual([IBA])
  })
})

describe('sourceCitations', () => {
  it('cites each source as a CreativeWork with its publisher', () => {
    expect(sourceCitations([IBA])).toEqual([
      {
        '@type': 'CreativeWork',
        name: 'Negroni',
        url: 'https://iba-world.com/negroni/',
        publisher: { '@type': 'Organization', name: 'IBA' },
      },
    ])
  })
})
