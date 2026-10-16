/**
 * GoogleTag.tsx loads gtag.js only after Cookiebot consent, and calls
 * window.gtag to configure it. Sentry JAVASCRIPT-NEXTJS-4P was that call
 * throwing "window.gtag is not a function" where the Consent Mode defaults
 * script had not left its stub behind. These pin the fix: with no stub the call
 * queues into dataLayer as an Arguments object (the only shape gtag.js
 * replays), an existing stub is never replaced, and without consent nothing is
 * defined, queued or loaded.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type Win = {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
  Cookiebot?: { consent?: { statistics?: boolean; marketing?: boolean } }
  location: { pathname: string }
}

let win: Win
let appended: Array<{ src: string }>

beforeEach(() => {
  vi.resetModules()
  win = { location: { pathname: '/shop/' } }
  appended = []
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {
    createElement: () => ({ src: '', async: false }),
    head: { appendChild: (el: { src: string }) => appended.push(el) },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const isArguments = (v: unknown) => Object.prototype.toString.call(v) === '[object Arguments]'

describe('loadGoogleTag', () => {
  it('queues instead of throwing when window.gtag is missing', async () => {
    const { loadGoogleTag } = await import('@/components/GoogleTag')
    win.Cookiebot = { consent: { statistics: true } }

    expect(() => loadGoogleTag()).not.toThrow()

    expect(appended).toHaveLength(1)
    expect(appended[0].src).toBe('https://www.googletagmanager.com/gtag/js?id=G-6VJL06YBW2')
    expect(win.dataLayer).toHaveLength(2)
    expect(win.dataLayer!.every(isArguments)).toBe(true)
    expect(Array.from(win.dataLayer![0] as ArrayLike<unknown>)[0]).toBe('js')
    expect(Array.from(win.dataLayer![1] as ArrayLike<unknown>).slice(0, 2)).toEqual(['config', 'G-6VJL06YBW2'])
  })

  it('keeps the stub the Consent Mode defaults script defined, and its queue', async () => {
    const { loadGoogleTag } = await import('@/components/GoogleTag')
    const existing = vi.fn()
    win.dataLayer = ['consent-default']
    win.gtag = existing
    win.Cookiebot = { consent: { marketing: true } }

    loadGoogleTag()

    expect(win.gtag).toBe(existing)
    expect(win.dataLayer).toEqual(['consent-default'])
    expect(existing).toHaveBeenCalledWith('config', 'AW-17823586670', { allow_enhanced_conversions: true })
  })

  it('defines, queues and loads nothing before consent', async () => {
    const { loadGoogleTag } = await import('@/components/GoogleTag')
    win.Cookiebot = { consent: { statistics: false, marketing: false } }

    loadGoogleTag()

    expect(win.gtag).toBeUndefined()
    expect(win.dataLayer).toBeUndefined()
    expect(appended).toHaveLength(0)
  })
})
