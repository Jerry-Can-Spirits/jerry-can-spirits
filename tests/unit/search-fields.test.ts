/**
 * SEARCHABLE_PATHS is written by hand, which is the same name-driven fragility
 * that made 89% of the corpus unsearchable in the first place. This test makes
 * the list answerable to the data: extractText walks real documents by shape,
 * and every top-level prose field it finds must either be covered by a search
 * path or be listed in NOT_SEARCHABLE with a reason.
 *
 * A field added to the Sanity schema and forgotten here fails this test rather
 * than quietly becoming unsearchable.
 */
import { describe, it, expect } from 'vitest'
import { extractText } from '@/lib/sanity-text'
import { SEARCHABLE_PATHS, NOT_SEARCHABLE, matchClause } from '@/lib/search-fields'
import { CORPUS_SAMPLES } from './fixtures/corpus-samples'

function coveredFields(type: string): Set<string> {
  return new Set(SEARCHABLE_PATHS[type].map((p) => p.split(/[.[]/)[0]))
}

describe('search field coverage', () => {
  for (const [type, docs] of Object.entries(CORPUS_SAMPLES)) {
    it(`covers every prose field on ${type} documents`, () => {
      const covered = coveredFields(type)
      const excused = NOT_SEARCHABLE[type] ?? {}

      const found = new Set<string>()
      for (const doc of docs) {
        for (const field of Object.keys(extractText(doc as Record<string, unknown>).byField)) {
          found.add(field)
        }
      }

      const uncovered = [...found].filter((f) => !covered.has(f) && !(f in excused))
      expect(uncovered, `${type} has prose fields that search cannot reach`).toEqual([])
    })
  }

  it('builds a GROQ predicate for every type', () => {
    for (const type of Object.keys(SEARCHABLE_PATHS)) {
      const clause = matchClause(type)
      expect(clause).toContain('match $searchTerm')
      expect(clause.split('||').length).toBe(SEARCHABLE_PATHS[type].length)
    }
  })

  it('refuses an unknown document type rather than silently matching nothing', () => {
    expect(() => matchClause('nonexistent')).toThrow(/No searchable field list/)
  })

  it('reaches the subsection tier for guides, which held 57% of guide body copy', () => {
    const clause = matchClause('guide')
    expect(clause).toContain('sections[].subsections[].content match')
    expect(clause).toContain('sections[].subsections[].contentRich[].children[].text match')
  })
})
