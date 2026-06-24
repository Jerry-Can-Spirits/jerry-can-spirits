import { describe, it, expect } from 'vitest'
import { matchCatalogue, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const c = (name: string, aliases: string[] = []): CatalogueEntry => ({
  id: name,
  name,
  normalised_name: name.toLowerCase(),
  ingredient_type: 'spirit',
  pricing_mode: 'bottle',
  default_pack_size_ml: 700,
  aliases,
})

const cat = [
  c('Dark Rum'),
  c('White Rum'),
  c('Lime Juice'),
  c('Campari'),
  c('Amaretto', ['disaronno']),
  c('Blackberry Liqueur', ['crème de mûre', 'creme de mure', 'mure']),
]

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

  it('resolves a brand alias to its canonical entry', () => {
    expect(matchCatalogue('Disaronno', cat)?.name).toBe('Amaretto')
  })
  it('resolves a synonym alias (crème de mûre -> Blackberry Liqueur)', () => {
    expect(matchCatalogue('crème de mûre', cat)?.name).toBe('Blackberry Liqueur')
    expect(matchCatalogue('creme de mure', cat)?.name).toBe('Blackberry Liqueur')
  })
  it('still prefers an exact canonical-name match', () => {
    expect(matchCatalogue('amaretto', cat)?.name).toBe('Amaretto')
  })

  it('does NOT match a differing head noun ("lime slice" must not adopt "Lime Juice")', () => {
    expect(matchCatalogue('lime slice', cat)).toBeNull()
  })
  it('does NOT conflate short words ("mint" must not adopt anything here)', () => {
    expect(matchCatalogue('mint', cat)).toBeNull()
  })
})
