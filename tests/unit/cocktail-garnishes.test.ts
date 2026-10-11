/**
 * The recipe card's garnish line. The label is the whole garnish phrase, so the
 * link reads "Lime wheel" rather than "Lime" followed by a stray "wheel".
 */
import { describe, it, expect } from 'vitest'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderGarnishes } from '@/components/CocktailRecipeDisplay'

const lime = { _id: 'lime', name: 'Lime', slug: 'lime' }
const raspberries = { _id: 'rasp', name: 'Raspberries', slug: 'raspberries' }
const orange = { _id: 'orange', name: 'Orange', slug: 'orange' }

function html(items: Parameters<typeof renderGarnishes>[0]) {
  return renderToStaticMarkup(createElement(Fragment, null, renderGarnishes(items)))
}

function text(items: Parameters<typeof renderGarnishes>[0]) {
  return html(items).replace(/<[^>]+>/g, '')
}

describe('renderGarnishes', () => {
  it('links the whole label to the ingredient page', () => {
    const out = html([{ label: 'Lime wheel', ingredient: lime }])
    expect(out).toMatch(/<a [^>]*href="\/field-manual\/ingredients\/lime\/?"[^>]*>Lime wheel<\/a>/)
  })

  it('falls back to the ingredient name when there is no label', () => {
    const out = html([{ ingredient: raspberries }])
    expect(out).toMatch(/<a [^>]*>Raspberries<\/a>/)
  })

  it('leaves the note as plain text after the link', () => {
    const out = html([{ label: 'Orange twist', note: 'expressed over the glass', ingredient: orange }])
    expect(out).toMatch(/<a [^>]*>Orange twist<\/a> expressed over the glass/)
    expect(text([{ label: 'Orange twist', note: 'expressed over the glass', ingredient: orange }])).toBe(
      'Orange twist expressed over the glass'
    )
  })

  it('joins items with commas and a final "and"', () => {
    expect(text([{ label: 'Lime wheel', ingredient: lime }, { ingredient: raspberries }])).toBe(
      'Lime wheel and Raspberries'
    )
    expect(
      text([{ label: 'Lime wheel', ingredient: lime }, { label: 'Orange twist', ingredient: orange }, { ingredient: raspberries }])
    ).toBe('Lime wheel, Orange twist and Raspberries')
  })

  it('prints an unlinked garnish as plain text, label then note', () => {
    expect(html([{ note: 'gardenia flower' }])).toBe('<span>gardenia flower</span>')
    expect(html([{ label: 'Paper umbrella' }])).toBe('<span>Paper umbrella</span>')
    expect(text([{ label: 'Gardenia', note: 'tucked into the ice' }])).toBe('Gardenia tucked into the ice')
  })
})
