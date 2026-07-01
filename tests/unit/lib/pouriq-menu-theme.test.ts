import { describe, it, expect } from 'vitest'
import { menuTheme } from '@/lib/pouriq/menu-theme'
import { MENU_THEMES } from '@/lib/pouriq/types'

describe('menuTheme', () => {
  it('returns a token set for every theme', () => {
    for (const t of MENU_THEMES) {
      const s = menuTheme(t)
      expect(typeof s.page).toBe('string')
      expect(typeof s.section).toBe('string')
    }
  })

  it('unknown theme falls back to clean', () => {
    expect(menuTheme('nope' as never)).toEqual(menuTheme('clean'))
  })
})
