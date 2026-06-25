import { describe, it, expect } from 'vitest'
import { isNavActive } from '@/lib/pouriq/nav'

describe('isNavActive', () => {
  it('matches the home item only exactly', () => {
    expect(isNavActive('/trade/pouriq', '/trade/pouriq')).toBe(true)
    expect(isNavActive('/trade/pouriq/variance', '/trade/pouriq')).toBe(false)
  })
  it('matches a section and its sub-routes', () => {
    expect(isNavActive('/trade/pouriq/library', '/trade/pouriq/library')).toBe(true)
    expect(isNavActive('/trade/pouriq/library/new', '/trade/pouriq/library')).toBe(true)
    expect(isNavActive('/trade/pouriq/stock/order', '/trade/pouriq/stock')).toBe(true)
  })
  it('does not cross sections', () => {
    expect(isNavActive('/trade/pouriq/stock', '/trade/pouriq/variance')).toBe(false)
  })
  it('separates Dashboard (home) from Menus (/menus)', () => {
    expect(isNavActive('/trade/pouriq/menus', '/trade/pouriq/menus')).toBe(true)
    expect(isNavActive('/trade/pouriq', '/trade/pouriq/menus')).toBe(false)
    expect(isNavActive('/trade/pouriq/menus', '/trade/pouriq')).toBe(false)
  })
})
