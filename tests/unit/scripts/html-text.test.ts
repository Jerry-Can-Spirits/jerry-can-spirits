/**
 * This file exists because the same bug was written twice in one day.
 *
 * Both scripts that read a third party's pages rolled their own decoder, and
 * both chained `.replace(/&amp;/g, '&')` ahead of the other entities. CodeQL
 * flagged the first; the second was written after that fix, with the same
 * fault. The shared helper removes the second copy, and this pins the behaviour
 * so a future one cannot pass review by looking reasonable.
 */
import { describe, it, expect } from 'vitest'
import { decodeEntities, htmlToText } from '../../../scripts/html-text'

describe('decodeEntities', () => {
  it('decodes the entities these pages actually use', () => {
    expect(decodeEntities('Raspberry &amp; Orange')).toBe('Raspberry & Orange')
    expect(decodeEntities('Fever&#8211;Tree')).toBe('Fever-Tree')
    expect(decodeEntities('Craddock&rsquo;s')).toBe('Craddock’s')
  })

  // The whole reason the helper exists. Unescaping the ampersand first turns
  // this into "&nbsp;", which a later pass then eats, so a literal entity
  // written on the page silently becomes a space.
  it('does not double-unescape', () => {
    expect(decodeEntities('&amp;nbsp;')).toBe('&nbsp;')
    expect(decodeEntities('&amp;amp;')).toBe('&amp;')
  })

  it('leaves an entity it does not know alone rather than mangling it', () => {
    expect(decodeEntities('&copy; 2026')).toBe('&copy; 2026')
  })
})

describe('htmlToText', () => {
  it('strips tags and collapses whitespace', () => {
    expect(htmlToText('<li>  30 ml   <b>Gin</b>\n</li>')).toBe('30 ml Gin')
  })

  it('decodes after stripping, so tags cannot hide an entity', () => {
    expect(htmlToText('<span>Grape &amp; Apricot</span>')).toBe('Grape & Apricot')
  })

  it('still does not double-unescape once tags are involved', () => {
    expect(htmlToText('<p>&amp;nbsp;</p>')).toBe('&nbsp;')
  })
})
