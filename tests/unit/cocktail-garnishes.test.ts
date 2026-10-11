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

// The anchor as rendered, read from a single-item render so the expected
// strings below do not restate the link's classes or href normalisation.
function link(ingredient: typeof lime, linkText: string) {
  const out = html([{ label: linkText, ingredient }])
  expect(out.startsWith('<span><a ')).toBe(true)
  expect(out.endsWith(`>${linkText}</a></span>`)).toBe(true)
  return out.slice('<span>'.length, -'</span>'.length)
}

describe('renderGarnishes', () => {
  it('links the whole label to the ingredient page', () => {
    const out = html([{ label: 'Lime wheel', ingredient: lime }])
    expect(out).toContain('href="/field-manual/ingredients/lime')
    expect(out).toContain('>Lime wheel</a>')
    expect(out).not.toContain('>Lime</a>')
  })

  it('falls back to the ingredient name when there is no label', () => {
    expect(html([{ ingredient: raspberries }])).toBe(`<span>${link(raspberries, 'Raspberries')}</span>`)
  })

  it('leaves the note as plain text after the link', () => {
    expect(html([{ label: 'Orange twist', note: 'expressed over the glass', ingredient: orange }])).toBe(
      `<span>${link(orange, 'Orange twist')} expressed over the glass</span>`
    )
  })

  it('joins items with commas and a final "and"', () => {
    const limeWheel = link(lime, 'Lime wheel')
    const orangeTwist = link(orange, 'Orange twist')
    const rasp = link(raspberries, 'Raspberries')
    expect(html([{ label: 'Lime wheel', ingredient: lime }, { ingredient: raspberries }])).toBe(
      `<span>${limeWheel}</span><span> and ${rasp}</span>`
    )
    expect(
      html([{ label: 'Lime wheel', ingredient: lime }, { label: 'Orange twist', ingredient: orange }, { ingredient: raspberries }])
    ).toBe(`<span>${limeWheel}</span><span>, ${orangeTwist}</span><span> and ${rasp}</span>`)
  })

  it('prints an unlinked garnish as plain text, label then note', () => {
    expect(html([{ note: 'gardenia flower' }])).toBe('<span>gardenia flower</span>')
    expect(html([{ label: 'Paper umbrella' }])).toBe('<span>Paper umbrella</span>')
    expect(html([{ label: 'Gardenia', note: 'tucked into the ice' }])).toBe('<span>Gardenia tucked into the ice</span>')
  })
})
