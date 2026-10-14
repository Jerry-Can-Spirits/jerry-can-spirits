// @vitest-environment jsdom
/**
 * A parent spirit chip's sub-types render directly after it, inside the same
 * wrapping chip row, rather than below the whole Base Spirit group. On a
 * 390px screen the parents wrap onto five lines, and a row placed after all of
 * them ended up far from the chip that was tapped.
 *
 * The selection is seeded from the URL after mount, so this renders on the
 * client (jsdom, a dependency of sanity) rather than to static markup.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => '/field-manual/cocktails/',
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: unknown }) =>
    createElement('a', { href }, children as never),
}))
vi.mock('next/image', () => ({ default: () => null }))
vi.mock('@/components/BackToTop', () => ({ default: () => null }))
vi.mock('@/components/ScrollRow', () => ({ default: () => null }))

const { default: CocktailsClient } = await import('@/app/field-manual/cocktails/CocktailsClient')

const cocktail = (slug: string, baseSpirit: string) => ({
  _id: slug,
  name: slug,
  slug: { current: slug },
  description: '',
  difficulty: 'novice',
  baseSpirit,
})

const COCKTAILS = [
  cocktail('daiquiri', 'white-rum'),
  cocktail('dark-and-stormy', 'dark-rum'),
  cocktail('caipirinha', 'cachaca'),
  cocktail('old-fashioned', 'bourbon'),
  cocktail('martini', 'london-dry-gin'),
]

let container: HTMLDivElement
let root: Root

async function renderAt(search: string) {
  window.history.replaceState(null, '', `/field-manual/cocktails/${search}`)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(createElement(CocktailsClient, { cocktails: COCKTAILS }))
  })
}

function spiritChip(value: string) {
  return container.querySelector(`#spirit-chip-${value}`) as HTMLButtonElement
}

beforeEach(() => {
  ;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('Base Spirit sub-type row', () => {
  it('sits directly after the selected parent chip and before the next parent', async () => {
    await renderAt('?spirit=rum')
    const rum = spiritChip('rum')
    const group = rum.nextElementSibling as HTMLElement
    expect(group.getAttribute('role')).toBe('group')
    expect(group.getAttribute('aria-labelledby')).toBe('spirit-chip-rum')
    expect(group.className).toContain('basis-full')
    expect(group.nextElementSibling).toBe(spiritChip('whiskey'))
    expect(group.parentElement).toBe(rum.parentElement)
    expect(Array.from(group.querySelectorAll('button')).map(b => b.textContent)).toEqual([
      'White rum',
      'Dark rum',
      'Cachaça',
    ])
  })

  it('renders one sub-type row only, and none after the last parent chip', async () => {
    await renderAt('?spirit=rum')
    expect(container.querySelectorAll('[role="group"]')).toHaveLength(1)
    const chips = spiritChip('rum').parentElement as HTMLElement
    expect(chips.lastElementChild?.getAttribute('role')).not.toBe('group')
  })

  it('keeps aria-pressed on the chosen sub-type', async () => {
    await renderAt('?spirit=rum&subtype=dark-rum')
    const pressed = Array.from(
      (spiritChip('rum').nextElementSibling as HTMLElement).querySelectorAll('button'),
    ).map(b => [b.textContent, b.getAttribute('aria-pressed')])
    expect(pressed).toEqual([
      ['White rum', 'false'],
      ['Dark rum', 'true'],
      ['Cachaça', 'false'],
    ])
  })

  it('follows a parent further down the list', async () => {
    await renderAt('?spirit=whiskey')
    expect(spiritChip('rum').nextElementSibling).toBe(spiritChip('whiskey'))
    // Whiskey has one available member here, so there is no choice to offer.
    expect(container.querySelector('[role="group"]')).toBeNull()
  })
})
