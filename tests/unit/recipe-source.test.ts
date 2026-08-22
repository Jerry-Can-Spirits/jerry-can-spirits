/**
 * recipeSource records where a specification comes from, so a reader can judge
 * the recipe and so a considered house choice can be told apart from a
 * transcription error. houseVariation is what makes that distinction visible,
 * which is why it is required when the authority is 'house' — a house recipe
 * with no stated reason is the exact case the field exists to prevent.
 */
import { describe, it, expect } from 'vitest'
import {
  AUTHORITY_OPTIONS,
  RECIPE_AUTHORITIES,
  recipeSourceLine,
  validateHouseVariation,
} from '@/lib/recipe-source'

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

/**
 * The picker used to be a second hand-written copy of RECIPE_AUTHORITIES in
 * src/sanity/schemaTypes/cocktail.ts, and it had silently fallen behind: `berry`
 * was added to the tuple, typechecked, rendered on the page, and never appeared
 * in the Studio dropdown, so the only way to set it was a script.
 *
 * AUTHORITY_OPTIONS is now derived, and Record<RecipeAuthority, string> makes a
 * missing title a compile error. These assert the parts a type cannot: that the
 * derived list is complete, ordered like the tuple, and that no title is blank —
 * an empty string satisfies the type and renders an unselectable blank row.
 */
describe('the Studio authority picker', () => {
  it('offers every authority, in the order they are declared', () => {
    expect(AUTHORITY_OPTIONS.map((o) => o.value)).toEqual([...RECIPE_AUTHORITIES])
  })

  it('gives every option a title a person can read', () => {
    for (const option of AUTHORITY_OPTIONS) {
      expect(option.title.trim(), `${option.value} has no title`).not.toBe('')
    }
  })

  it('has a rendering label for every authority it offers', () => {
    for (const option of AUTHORITY_OPTIONS) {
      expect(recipeSourceLine(option.value, null, null), `${option.value} renders no source line`).toBeTruthy()
    }
  })
})

/**
 * A brand's published serve is not the same claim as a brand's own drink, and
 * the label is the only thing on the page carrying that distinction. Pusser's
 * owns the Painkiller; Fever-Tree suggested pouring their ginger ale over
 * whisky. If these two ever render the same sentence the distinction is gone.
 */
describe('brand attribution', () => {
  it('distinguishes a producer specification from a producer serve', () => {
    const spec = recipeSourceLine('brand', "Pusser's", null)
    const serve = recipeSourceLine('brand-serve', 'Fever-Tree', null)
    expect(spec).toBe("Source: the producer's own specification (Pusser's).")
    expect(serve).toBe("Source: the producer's own published serve (Fever-Tree).")
    expect(serve).not.toBe(spec)
  })
})
