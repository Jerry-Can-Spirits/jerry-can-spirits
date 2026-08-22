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
import { ENTITIES, decodeEntities, htmlToText } from '../../../scripts/html-text'

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

/**
 * Added after the map and the matching pattern drifted apart. Four entities
 * were added to the lookup on 22 August and none of them decoded, because the
 * pattern was a separate hand-written alternation that still listed the
 * original eleven. Franklin & Sons run on WordPress, so every product title
 * came back as "Rhubarb &#038; Hibiscus".
 *
 * The pattern is now built from the lookup's keys. This asserts the property
 * that made the bug possible in the first place.
 */
describe('the entity pattern and the lookup cannot drift', () => {
  it('decodes every entity the lookup claims to know', () => {
    for (const [entity, decoded] of Object.entries(ENTITIES)) {
      expect(decodeEntities(`x${entity}y`), `${entity} did not decode`).toBe(`x${decoded}y`)
    }
  })

  it('decodes the numeric ampersand WordPress emits', () => {
    expect(htmlToText('<h1>Rhubarb &#038; Hibiscus Tonic Water</h1>')).toBe('Rhubarb & Hibiscus Tonic Water')
  })
})

/**
 * CodeQL flagged the first repair of the drift bug: it built the pattern by
 * escaping and joining the map's keys, and the escaper covered `&`, `#` and `;`
 * — none of which are regex metacharacters — while missing backslash, which is.
 *
 * There is no dynamic pattern now, so there is nothing to escape. These assert
 * the property that made the finding matter: content the decoder does not
 * recognise, including regex metacharacters, must survive untouched.
 */
describe('input is never treated as a pattern', () => {
  // String.raw throughout. Written with ordinary quotes first, these asserted
  // nothing: '\t' and '\f' in "C:\path\to\file" are a tab and a formfeed, so
  // both sides of the comparison were the same backslash-free string and the
  // test passed without ever seeing one.
  it('passes backslashes and metacharacters through unchanged', () => {
    expect(decodeEntities(String.raw`C:\path\to\file`)).toBe(String.raw`C:\path\to\file`)
    expect(decodeEntities(String.raw`a.*+?^${'$'}{}()|[]b`)).toBe(String.raw`a.*+?^${'$'}{}()|[]b`)
  })

  it('leaves an entity-shaped string it does not know alone', () => {
    expect(decodeEntities('&notanentity;')).toBe('&notanentity;')
    expect(decodeEntities('&;')).toBe('&;')
    expect(decodeEntities(String.raw`&\;`)).toBe(String.raw`&\;`)
  })

  it('still decodes real entities either side of a backslash', () => {
    expect(htmlToText(String.raw`<p>Rhubarb &#038; Hibiscus \ Tonic</p>`)).toBe(
      String.raw`Rhubarb & Hibiscus \ Tonic`
    )
  })
})
