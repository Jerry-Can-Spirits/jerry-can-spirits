import { describe, it, expect } from 'vitest'
import { isNavActive, isPourIqAppRoute } from '@/lib/trade-portal/nav'

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

describe('isPourIqAppRoute', () => {
  it('is true on the app home and its sub-routes', () => {
    expect(isPourIqAppRoute('/trade/pouriq')).toBe(true)
    expect(isPourIqAppRoute('/trade/pouriq/menus')).toBe(true)
    expect(isPourIqAppRoute('/trade/pouriq/variance/abc')).toBe(true)
  })
  it('is false on marketing and public trade pages', () => {
    expect(isPourIqAppRoute('/')).toBe(false)
    expect(isPourIqAppRoute('/trade/login')).toBe(false)
    expect(isPourIqAppRoute('/trade/apply')).toBe(false)
    expect(isPourIqAppRoute(null)).toBe(false)
  })
})
