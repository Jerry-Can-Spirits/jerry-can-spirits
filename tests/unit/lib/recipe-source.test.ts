/**
 * The attribution line is the honest half of publishing someone else's
 * specification, so the cases that matter are the ones where it should say
 * nothing at all rather than something vague.
 */
import { describe, it, expect } from 'vitest'
import {
  AUTHORITY_LABELS,
  RECIPE_AUTHORITIES,
  formatCheckedDate,
  recipeSourceLine,
  validateHouseVariation,
} from '@/lib/recipe-source'

describe('the attribution line', () => {
  it('names the source and the date it was checked', () => {
    expect(recipeSourceLine('iba', null, '2026-08-08')).toBe('Source: the IBA. Last checked 8 August 2026.')
  })

  it('carries the edition or page when one is recorded', () => {
    expect(recipeSourceLine('savoy', '1930 edition, p.94', '2026-08-08')).toBe(
      'Source: The Savoy Cocktail Book (1930 edition, p.94). Last checked 8 August 2026.'
    )
  })

  it('says nothing at all when no authority is recorded', () => {
    // 349 cocktails carry no source today. A visible "Source: unknown" on all
    // of them would advertise the gap rather than the discipline, so the line
    // is absent rather than apologetic.
    expect(recipeSourceLine(null, null, null)).toBeNull()
    expect(recipeSourceLine(undefined, 'a note', '2026-08-08')).toBeNull()
    expect(recipeSourceLine('', null, null)).toBeNull()
  })

  it('says nothing for an authority it does not recognise', () => {
    // A value that predates the enum, or a typo, must not render as
    // "Source: undefined."
    expect(recipeSourceLine('wikipedia', null, '2026-08-08')).toBeNull()
  })

  it('omits the date when the source has never been checked', () => {
    expect(recipeSourceLine('diffords', null, null)).toBe("Source: Difford's Guide.")
  })

  it('reads as prose for a house specification rather than as jargon', () => {
    // The Studio dropdown says "House specification", which is right in a
    // picker and wrong inside a sentence.
    expect(recipeSourceLine('house', null, null)).toBe('Source: our own specification.')
  })

  it('distinguishes a brand’s specification from our own', () => {
    // A Dark 'n' Stormy is a Gosling trademark and a Painkiller is a Pusser's
    // trademark. Filing either as "house" would claim authorship of a drink we
    // did not create, which is the opposite of what this field is for.
    expect(recipeSourceLine('brand', "Gosling's Black Seal", null)).toBe(
      "Source: the producer's own specification (Gosling's Black Seal)."
    )
    expect(recipeSourceLine('house', null, null)).toBe('Source: our own specification.')
  })

  it('renders the book citations added for the rewrite pass', () => {
    // The Monte Carlo is preserved in Embury and there was previously nowhere
    // to record it, so a verified attribution fell on the floor.
    expect(recipeSourceLine('embury', null, null)).toBe("Source: Embury's The Fine Art of Mixing Drinks.")
    expect(recipeSourceLine('thomas', null, null)).toBe("Source: Jerry Thomas's Bar-Tender's Guide.")
    expect(recipeSourceLine('waldorf', null, null)).toBe('Source: The Old Waldorf-Astoria Bar Book.')
  })

  it('has a label for every authority the schema offers', () => {
    // A new entry in RECIPE_AUTHORITIES with no label renders nothing at all,
    // which would look like a page with no source rather than a bug.
    for (const a of RECIPE_AUTHORITIES) {
      expect(AUTHORITY_LABELS[a], `no label for "${a}"`).toBeTruthy()
    }
  })
})

describe('the checked date', () => {
  it('formats as British prose', () => {
    expect(formatCheckedDate('2026-08-08')).toBe('8 August 2026')
    expect(formatCheckedDate('2026-12-25')).toBe('25 December 2026')
  })

  it('does not shift the day west of Greenwich', () => {
    // new Date('2026-08-08') parses as UTC midnight and renders as the 7th in
    // New York. The parse is done by hand for that reason, and this is the
    // case that catches a regression to Date.
    expect(formatCheckedDate('2026-01-01')).toBe('1 January 2026')
    expect(formatCheckedDate('2026-01-01T00:00:00Z')).toBe('1 January 2026')
  })

  it('returns null for anything it cannot read', () => {
    expect(formatCheckedDate(null)).toBeNull()
    expect(formatCheckedDate('')).toBeNull()
    expect(formatCheckedDate('not a date')).toBeNull()
    expect(formatCheckedDate('2026-13-01')).toBeNull()
  })
})

describe('the house variation rule', () => {
  it('requires an explanation for a house specification', () => {
    expect(validateHouseVariation('house', undefined)).toBe(
      'A house specification must say what is different and why.'
    )
    expect(validateHouseVariation('house', '   ')).toBeTypeOf('string')
    expect(validateHouseVariation('house', 'We use demerara syrup. It suits the rum.')).toBe(true)
  })

  it('does not require one for a published source', () => {
    expect(validateHouseVariation('iba', undefined)).toBe(true)
  })
})
