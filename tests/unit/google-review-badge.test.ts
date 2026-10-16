import { readFileSync } from 'node:fs'
import { describe, it, expect, vi } from 'vitest'
import {
  canShowMerchantWidget,
  removeMerchantWidget,
  startMerchantWidget,
} from '@/components/GoogleReviewBadge'

function win(marketing: boolean | undefined, desktop: boolean) {
  return {
    Cookiebot: marketing === undefined ? undefined : { consent: { marketing, statistics: true, preferences: true, necessary: true }, renew: () => {} },
    matchMedia: (query: string) => ({ matches: desktop && query === '(min-width: 768px)' }) as MediaQueryList,
  }
}

describe('Google Customer Reviews widget gating', () => {
  it('loads only with marketing consent', () => {
    expect(canShowMerchantWidget(win(undefined, true))).toBe(false)
    expect(canShowMerchantWidget(win(false, true))).toBe(false)
    expect(canShowMerchantWidget(win(true, true))).toBe(true)
  })

  it('does not load on phone widths, where it would cover the bottom bars', () => {
    expect(canShowMerchantWidget(win(true, false))).toBe(false)
  })
})

describe('starting and removing the widget', () => {
  it('starts with the merchant id, bottom left and region GB', () => {
    const start = vi.fn()
    startMerchantWidget({ merchantwidget: { start } }, { getElementById: () => null })
    expect(start).toHaveBeenCalledWith({ merchant_id: 5723441167, position: 'LEFT_BOTTOM', region: 'GB' })
  })

  it('does not start a second widget, which Google would throw on', () => {
    const start = vi.fn()
    const existing = {} as HTMLElement
    startMerchantWidget({ merchantwidget: { start } }, { getElementById: () => existing })
    expect(start).not.toHaveBeenCalled()
  })

  it('removes the wrapper Google appended to the body', () => {
    const remove = vi.fn()
    const getElementById = vi.fn(() => ({ remove }) as unknown as HTMLElement)
    removeMerchantWidget({ getElementById })
    expect(getElementById).toHaveBeenCalledWith('google-merchantwidget-iframe-wrapper')
    expect(remove).toHaveBeenCalled()
  })
})

describe('CSP allows the widget', () => {
  const config = readFileSync('next.config.ts', 'utf8')
  const directive = (name: string) => config.match(new RegExp(`"${name} [^"]*"|\`${name} [^\`]*\``))?.[0] ?? ''

  it('allows the loader script and the www.google.com iframe', () => {
    expect(directive('script-src')).toContain('https://www.gstatic.com')
    expect(directive('script-src-elem')).toContain('https://www.gstatic.com')
    expect(directive('frame-src')).toContain('https://www.google.com')
  })
})
