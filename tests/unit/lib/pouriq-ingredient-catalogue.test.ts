import { describe, it, expect } from 'vitest'
import { matchCatalogue, adoptionName, type CatalogueEntry } from '@/lib/pouriq/ingredient-catalogue'

const c = (name: string, aliases: string[] = [], generic: string | null = null): CatalogueEntry => ({
  id: name,
  name,
  normalised_name: name.toLowerCase(),
  ingredient_type: 'spirit',
  base_unit: 'ml',
  default_pack_size: 700,
  generic,
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
  it('exposes base_unit on the matched entry', () => {
    expect(matchCatalogue('dark rum', cat)?.base_unit).toBe('ml')
  })

  it('does NOT match a differing head noun ("lime slice" must not adopt "Lime Juice")', () => {
    expect(matchCatalogue('lime slice', cat)).toBeNull()
  })
  it('does NOT conflate short words ("mint" must not adopt anything here)', () => {
    expect(matchCatalogue('mint', cat)).toBeNull()
  })
})

describe('matchCatalogue — ingredient type guard', () => {
  const mintGarnish: CatalogueEntry = {
    id: 'mint',
    name: 'Mint',
    normalised_name: 'mint',
    ingredient_type: 'garnish',
    base_unit: 'each',
    default_pack_size: null,
    generic: null,
    aliases: [],
  }
  const strawberryMintLiqueur: CatalogueEntry = {
    id: 'zymsm',
    name: 'Zymurgorium Strawberry & Mint',
    normalised_name: 'zymurgorium strawberry & mint',
    ingredient_type: 'liqueur',
    base_unit: 'ml',
    default_pack_size: 500,
    generic: null,
    aliases: [],
  }
  const typedCat = [mintGarnish, strawberryMintLiqueur]

  it('liqueur-typed line containing "mint" returns null when only a garnish mint entry exists', () => {
    // Real bug: "Zymurgorium Strawberry & Mint" (liqueur) was matching bare
    // "Mint" garnish entry via token subset — the type guard must block this.
    const result = matchCatalogue('Zymurgorium Strawberry & Mint', [mintGarnish], 'liqueur')
    expect(result).toBeNull()
  })

  it('when inferredType is undefined, still matches as before (no regression)', () => {
    // "fresh mint" with no type -> still resolves to garnish mint via token subset
    const result = matchCatalogue('fresh mint', [mintGarnish])
    expect(result?.name).toBe('Mint')
  })

  it('garnish-typed "mint" does NOT cross-match a liqueur entry', () => {
    const result = matchCatalogue('mint', [strawberryMintLiqueur], 'garnish')
    expect(result).toBeNull()
  })
})

describe('brand tier — specific beats generic', () => {
  const vodka = c('Vodka', ['smirnoff'])          // generic that lists a brand alias
  const smirnoff = c('Smirnoff', [], 'vodka')     // brand entry
  const lager = c('Lager')                         // generic
  const carling = c('Carling', [], 'lager')        // brand entry
  const brandCat = [vodka, smirnoff, lager, carling]

  it('an exact brand name beats a generic that lists it as an alias', () => {
    expect(matchCatalogue('smirnoff', brandCat)?.name).toBe('Smirnoff')
  })
  it('a brand beats the generic on a subset tie', () => {
    expect(matchCatalogue('Carling Lager', brandCat)?.name).toBe('Carling')
  })
  it('a bare generic still resolves to the generic', () => {
    expect(matchCatalogue('lager', brandCat)?.name).toBe('Lager')
  })

  it('matches an "&" brand from its literal form (normalise keeps &)', () => {
    const wray: CatalogueEntry = {
      id: 'w', name: 'Wray & Nephew', normalised_name: 'wray & nephew',
      ingredient_type: 'spirit', base_unit: 'ml', default_pack_size: 700,
      generic: 'overproof rum', aliases: ['wray and nephew'],
    }
    expect(matchCatalogue('Wray & Nephew', [wray])?.name).toBe('Wray & Nephew')
    expect(matchCatalogue('wray and nephew', [wray])?.name).toBe('Wray & Nephew')
  })

  it('matches an accented brand by either spelling', () => {
    const madri: CatalogueEntry = {
      id: 'm', name: 'Madrí', normalised_name: 'madrí',
      ingredient_type: 'beer', base_unit: 'ml', default_pack_size: 330,
      generic: 'lager', aliases: ['madri'],
    }
    expect(matchCatalogue('Madrí', [madri])?.name).toBe('Madrí')
    expect(matchCatalogue('Madri', [madri])?.name).toBe('Madrí')
  })
})

describe('adoptionName', () => {
  const lager = c('Lager')
  const vodka = c('Vodka')
  const tripleSec = c('Triple Sec')
  it('keeps a more-specific line name', () => {
    expect(adoptionName('Carling Lager', lager)).toBe('Carling Lager')
    expect(adoptionName('Smirnoff Red Vodka', vodka)).toBe('Smirnoff Red Vodka')
  })
  it('uses the canonical name for a clean match', () => {
    expect(adoptionName('triple sec', tripleSec)).toBe('Triple Sec')
  })

  describe('alias-match cases — brand/flavour name must be kept', () => {
    const aniseedLiqueur: CatalogueEntry = {
      id: 'aniseed-liqueur',
      name: 'Aniseed Liqueur',
      normalised_name: 'aniseed liqueur',
      ingredient_type: 'liqueur',
      base_unit: 'ml',
      default_pack_size: 700,
      generic: null,
      aliases: ['sambuca', 'antica sambuca', 'antica sambuca classic'],
    }
    const carling: CatalogueEntry = {
      id: 'carling',
      name: 'Carling',
      normalised_name: 'carling',
      ingredient_type: 'beer',
      base_unit: 'ml',
      default_pack_size: 330,
      generic: 'lager',
      aliases: [],
    }
    it('keeps the brand name when matched via alias (Antica Sambuca -> Aniseed Liqueur)', () => {
      expect(adoptionName('Antica Sambuca', aniseedLiqueur)).toBe('Antica Sambuca')
    })
    it('uses canonical name when extracted adds nothing over it (triple sec -> Triple Sec)', () => {
      expect(adoptionName('triple sec', tripleSec)).toBe('Triple Sec')
    })
    it('keeps the brand+descriptor when it adds info beyond the entry name (Carling Lager -> Carling Lager)', () => {
      expect(adoptionName('Carling Lager', carling)).toBe('Carling Lager')
    })
  })
})
