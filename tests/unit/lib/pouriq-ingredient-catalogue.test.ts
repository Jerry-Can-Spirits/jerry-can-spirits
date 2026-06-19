import { describe, it, expect } from 'vitest'
import { matchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const c = (name: string): CatalogueEntry => ({
  id: name,
  name,
  normalised_name: name.toLowerCase(),
  ingredient_type: 'spirit',
  pricing_mode: 'bottle',
  default_bottle_size_ml: 700,
})

const cat = [c('Dark Rum'), c('White Rum'), c('Lime Juice'), c('Campari')]

describe('matchCatalogue', () => {
  it('matches exactly (case-insensitive)', () => {
    expect(matchCatalogue('dark rum', cat)?.name).toBe('Dark Rum')
    expect(matchCatalogue('DARK RUM', cat)?.name).toBe('Dark Rum')
  })
  it('matches a near miss within edit distance', () => {
    expect(matchCatalogue('dark rom', cat)?.name).toBe('Dark Rum')
  })
  it('matches a multi-word substring ("fresh lime juice" -> "Lime Juice")', () => {
    expect(matchCatalogue('fresh lime juice', cat)?.name).toBe('Lime Juice')
  })
  it('returns null when nothing is close', () => {
    expect(matchCatalogue('elderflower tonic foam', cat)).toBeNull()
  })
  it('returns null on empty input', () => {
    expect(matchCatalogue('', cat)).toBeNull()
  })
})
