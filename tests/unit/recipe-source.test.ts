/**
 * recipeSource records where a specification comes from, so a reader can judge
 * the recipe and so a considered house choice can be told apart from a
 * transcription error. houseVariation is what makes that distinction visible,
 * which is why it is required when the authority is 'house' — a house recipe
 * with no stated reason is the exact case the field exists to prevent.
 */
import { describe, it, expect } from 'vitest'
import { validateHouseVariation } from '@/lib/recipe-source'

describe('houseVariation validation', () => {
  it('requires an explanation for a house specification', () => {
    expect(validateHouseVariation('house', undefined)).toBe(
      'A house specification must say what is different and why.'
    )
    expect(validateHouseVariation('house', '')).toBe('A house specification must say what is different and why.')
  })

  it('rejects whitespace, which satisfies a required check but says nothing', () => {
    expect(validateHouseVariation('house', '   ')).toBe('A house specification must say what is different and why.')
  })

  it('accepts a house specification that explains itself', () => {
    expect(
      validateHouseVariation('house', 'We use demerara syrup rather than simple. It suits the rum.')
    ).toBe(true)
  })

  it('does not require an explanation when the recipe follows a published authority', () => {
    for (const authority of ['iba', 'diffords', 'pdt', 'death-and-co', 'savoy']) {
      expect(validateHouseVariation(authority, undefined), `${authority} should not require one`).toBe(true)
    }
  })

  it('does not require an explanation before an authority has been chosen', () => {
    expect(validateHouseVariation(undefined, undefined)).toBe(true)
  })
})
