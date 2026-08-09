/**
 * The detector orders the rewriting queue for 349 cocktail pages, so a false
 * positive costs a good page a rewrite it does not need and a false negative
 * leaves a bad one in place. The cases that matter are the two meanings of
 * "shelf".
 */
import { describe, it, expect } from 'vitest'
import { selfReferences } from '../../../scripts/self-reference'

describe('the self-reference detector', () => {
  it('catches the page writing about itself', () => {
    expect(selfReferences('the drinks this Manual has honoured')).toEqual(['this Manual'])
    expect(selfReferences('the sugar’s chair taken by amaretto')).toEqual(['chair'])
    expect(selfReferences('in the Field Manual’s buck stable')).toEqual(['in the Field Manual'])
    expect(selfReferences('the elderflower bottle earns its fourth outing')).toEqual(['earns its fourth'])
    expect(selfReferences('the Banana Calling one page over')).toEqual(['one page over'])
  })

  it('catches the possessive, not only "in the Field Manual"', () => {
    // MEASURED 9 August 2026: the Tequila Sunrise published "the Field
    // Manual's standing argument in its brightest colours" and scored zero,
    // because the only Field Manual pattern required the preposition.
    expect(selfReferences('the Field Manual’s standing argument')).toEqual(['the Field Manual’s'])
    expect(selfReferences("this Field Manual's position")).toEqual(["this Field Manual's"])
  })

  it('catches the page talking about itself in the first person', () => {
    // MEASURED 9 August 2026: section 0's most literal breach, and the only
    // shape nothing was looking for.
    expect(selfReferences('this page keeps the cloud')).toEqual(['this page'])
    expect(selfReferences('This site recommends the comparison')).toEqual(['This site'])
    expect(selfReferences('beyond the scope of this entry')).toEqual(['this entry'])
  })

  it('catches a reference to our own documents', () => {
    // "Whole milk, by the doc's law" names a source the reader cannot see.
    expect(selfReferences('Whole milk, by the doc’s law')).toEqual(['the doc’s'])
    expect(selfReferences('per the new doc')).toEqual(['the new doc'])
    expect(selfReferences('the guide specifies ginger beer')).toEqual(['the guide'])
  })

  it('leaves the idiom and an outside guide alone', () => {
    expect(selfReferences('the moment cream approaches, turn the page')).toEqual([])
    // Not self-reference, and not endorsed either: naming an authority in the
    // prose is an attribution defect, because that belongs in recipeSource.
    // The attribution pass moves it and removes the sentence. This detector
    // must not claim the hit, or the two passes fight over the same words.
    expect(selfReferences('canonised in Difford’s Guide')).toEqual([])
  })

  it('leaves a bare mention of the section alone', () => {
    // The site's own navigation calls it that. Naming it is not the defect;
    // placing the drink inside it, or giving it opinions, is.
    expect(selfReferences('the Field Manual covers 348 drinks')).toEqual([])
  })

  it('counts every occurrence, not one per page', () => {
    // An earlier extractor reported one match per span and two "doc" mentions
    // in the same paragraph survived a sweep that claimed to have cleaned it.
    expect(selfReferences('this Manual and this Manual again')).toHaveLength(2)
  })
})

describe('the two meanings of shelf', () => {
  it('flags a shelf that is one of our own category pages', () => {
    expect(selfReferences('the agave shelf’s best group serve')).toEqual(['the agave shelf'])
    expect(selfReferences('the whiskey shelf’s pomegranate dusk')).toEqual(['the whiskey shelf'])
    expect(selfReferences('the two less-travelled shelves')).toEqual(['the two less-travelled shelves'])
    expect(selfReferences('the Banana Calling one shelf over')).toEqual(['one shelf over'])
    expect(selfReferences('one bitter shelf along')).toEqual(['one bitter shelf along'])
  })

  it('leaves a shelf that is an actual shelf alone', () => {
    // MEASURED 9 August 2026: 39 of 123 uses across the corpus were literal,
    // and 25 pages scored on nothing else. Banning the word outright would
    // have sent already-compliant pages to the front of the rewriting queue.
    expect(selfReferences('use the richest, darkest rum on the shelf')).toEqual([])
    expect(selfReferences('three minutes from shelf to glass')).toEqual([])
    expect(selfReferences('the heat treatment behind shelf-stable juice')).toEqual([])
    expect(selfReferences('the three bottles on the shelf')).toEqual([])
  })
})
