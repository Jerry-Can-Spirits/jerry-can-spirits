/**
 * Both cases here are real defects the copy pass found by reading, after the
 * standard audit had scored every one of them as fully compliant.
 */
import { describe, it, expect } from 'vitest'
import { findDuplication, sentences } from '../../../scripts/duplication'

describe('the duplication detector', () => {
  it('finds a section that copies the description', () => {
    // The shape found on eight-plus pages: "The Origin" repeating the
    // description word for word.
    const copied =
      'The frozen daiquiri left Havana with the electric blender and met the strawberry in the American resort belt.'
    const found = findDuplication([
      { where: 'description', text: `${copied} It is ordered by name across every warm latitude.` },
      { where: 'The Origin', text: `${copied} Slush dispensers were trading the fruit for syrup by 1970.` },
    ])

    expect(found).toHaveLength(1)
    expect(found[0].where).toBe('The Origin ↔ description')
    expect(found[0].sentences).toBe(1)
  })

  it('finds a field repeating itself', () => {
    // Gin Sling's Expert Tip contained its own first two paragraphs twice.
    const para = 'Ginger wine is a fermented product at fortified strength rather than a cordial.'
    const found = findDuplication([{ where: 'Expert Tip', text: `${para}\n\n${para}` }])

    expect(found).toHaveLength(1)
    expect(found[0].where).toBe('Expert Tip (repeated within itself)')
  })

  it('ignores punctuation and curly quotes, which differ between old and new copy', () => {
    // The copy pass wrote curly apostrophes to match Sanity; older bulk copy
    // used straight ones. A section lifted before that settled differs by
    // exactly those bytes and is the same sentence to a reader.
    const found = findDuplication([
      { where: 'description', text: "The ginger wine's raisin sweetness folds into the malt." },
      { where: 'The Whisky', text: 'The ginger wine’s raisin sweetness folds into the malt!' },
    ])
    expect(found).toHaveLength(1)
  })

  it('leaves a short shared phrase alone', () => {
    // "No garnish, ever." appearing in the tip and the closing section is a
    // deliberate echo, not a duplication, and flagging it would bury the
    // findings that matter.
    const found = findDuplication([
      { where: 'Expert Tip', text: 'No garnish, ever.' },
      { where: 'How to Serve It', text: 'No garnish, ever.' },
    ])
    expect(found).toEqual([])
  })

  it('reports each pair of locations separately', () => {
    const shared = 'Two whole passion fruits go into the shaker with the pulp and the seeds.'
    const found = findDuplication([
      { where: 'description', text: shared },
      { where: 'The Fruit', text: shared },
      { where: 'FAQ "How much fruit?"', text: shared },
    ])
    expect(found.map((f) => f.where).sort()).toEqual([
      'FAQ "How much fruit?" ↔ The Fruit',
      'FAQ "How much fruit?" ↔ description',
      'The Fruit ↔ description',
    ])
  })

  it('does not split a decimal measure into two sentences', () => {
    // Measurements are dense in this copy, and 7.5ml split at the point would
    // leave two fragments too short to compare.
    expect(sentences('Bénédictine at 7.5ml is a seasoning. It is not a modifier.')).toEqual([
      'Bénédictine at 7.5ml is a seasoning.',
      'It is not a modifier.',
    ])
  })
})
