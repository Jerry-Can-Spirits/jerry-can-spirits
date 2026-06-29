import { describe, it, expect } from 'vitest'
import { matchIngredient, normalise, singleContainmentMatch } from '@/lib/pouriq/match'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

// Minimal library-row factory — matchIngredient only reads `name`.
function row(name: string): IngredientLibraryRow {
  return {
    id: name,
    trade_account_id: 't',
    name,
    ingredient_type: 'other',
    base_unit: 'ml', pack_size: 700, price_p: 1000, price_includes_vat: 0, price_entered_p: null, pack_format: null, subcategory: null,
    is_prepared: 0,
    purchase_qty: 1,
    yield_pct: 100,
    barcode: null,
    notes: null,
    created_at: '',
    updated_at: '',
  }
}

const names = (s: { kind: string } & Record<string, unknown>): string[] =>
  s.kind === 'suggestions' ? (s.entries as IngredientLibraryRow[]).map((e) => e.name) : []

describe('normalise — accent folding', () => {
  it('folds diacritics so accented brands match their plain spelling', () => {
    expect(normalise('Kahlúa')).toBe('kahlua')
    expect(normalise('Crème de Cassis')).toBe('creme de cassis')
  })
  it('leaves unaccented names unchanged', () => {
    expect(normalise('Absolut Vodka')).toBe('absolut vodka')
  })
})

describe('matchIngredient — exact & confident', () => {
  it('exact normalised match auto-selects', () => {
    const r = matchIngredient('Lemon Juice', [row('Lemon Juice')])
    expect(r.kind).toBe('auto')
  })

  it('auto-matches across a "fresh" qualifier (recall: fresh strawberry puree → Strawberry Puree)', () => {
    const r = matchIngredient('fresh strawberry puree', [row('Strawberry Puree')])
    expect(r.kind).toBe('auto')
    if (r.kind === 'auto') expect(r.entry.name).toBe('Strawberry Puree')
  })

  it('auto-matches a bare spirit to a "House X" library entry (gin → House Gin)', () => {
    const r = matchIngredient('gin', [row('House Gin')])
    expect(r.kind).toBe('auto')
    if (r.kind === 'auto') expect(r.entry.name).toBe('House Gin')
  })

  it('still auto-matches "fresh lime juice" → "Lime Juice"', () => {
    const r = matchIngredient('fresh lime juice', [row('Lime Juice')])
    expect(r.kind).toBe('auto')
  })
})

describe('matchIngredient — precision (no silent wrong autofill)', () => {
  it('does NOT match "Mint" to "Gin" (Levenshtein 2 on short words)', () => {
    const r = matchIngredient('Mint', [row('Gin')])
    expect(r.kind).toBe('no-match')
  })

  it('does NOT match "lemon slice" to "lemon juice" (differing head noun)', () => {
    const r = matchIngredient('lemon slice', [row('Lemon Juice')])
    // The whole point: it must not silently autofill the wrong ingredient.
    expect(r.kind).not.toBe('auto')
    expect(names(r)).not.toContain('Lemon Juice')
  })
})

describe('matchIngredient — typo tolerance kept (as suggestion, not auto)', () => {
  it('suggests "Dark Rum" for the typo "dark rom"', () => {
    const r = matchIngredient('dark rom', [row('Dark Rum'), row('White Rum')])
    expect(r.kind).toBe('suggestions')
    expect(names(r)).toContain('Dark Rum')
  })

  it('returns no-match when nothing is close', () => {
    expect(matchIngredient('elderflower tonic foam', [row('Gin'), row('Lime Juice')]).kind).toBe('no-match')
  })
})

const lib = (id: string, name: string): IngredientLibraryRow =>
  ({ id, name, ingredient_type: 'spirit', base_unit: 'ml', pack_size: 700, price_p: 1500,
     trade_account_id: 't', price_includes_vat: 0, price_entered_p: 1500, pack_format: null,
     subcategory: null, is_prepared: 0, purchase_qty: 1, yield_pct: 100, barcode: null,
     notes: null, created_at: '', updated_at: '' } as IngredientLibraryRow)

describe('singleContainmentMatch', () => {
  it('returns the sole entry whose tokens are contained by the line', () => {
    const library = [lib('1', 'Absolut'), lib('2', 'Beefeater')]
    expect(singleContainmentMatch('Absolut Vodka', library)?.id).toBe('1')
  })
  it('returns null when two entries both contain (ambiguous)', () => {
    const library = [lib('1', "Gordon's Gin"), lib('2', "Gordon's Pink Gin")]
    expect(singleContainmentMatch("Gordon's", library)).toBeNull()
  })
  it('returns null when nothing is a clean containment', () => {
    const library = [lib('1', 'Lime Juice')]
    expect(singleContainmentMatch('Lemon Juice', library)).toBeNull()
  })
  it('returns null when an exact auto-match already exists (leave to matchIngredient)', () => {
    const library = [lib('1', 'Absolut Vodka')]
    expect(singleContainmentMatch('Absolut Vodka', library)).toBeNull()
  })
})
