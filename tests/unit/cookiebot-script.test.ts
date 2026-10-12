import { describe, expect, it } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Cookiebot's uc.js must not run before React has hydrated. As a synchronous
// tag in <head> (2026-10-11) it inserted #CybotCookiebotDialog as the first
// child of <body> ahead of hydration; React matched that div against Next's
// hidden metadata div, failed with #418 and regenerated the tree, deleting the
// banner. next/script's afterInteractive loads it from an effect, after the
// hydration commit, so the dialog can only land in an already-hydrated body.
describe('Cookiebot script in app/layout.tsx', () => {
  const source = readFileSync(resolve('src/app/layout.tsx'), 'utf8')
  const tag = /<(Script|script)\b([^>]*?)src="https:\/\/consent\.cookiebot\.com\/uc\.js"([^>]*?)\/?>/.exec(source)

  it('loads uc.js exactly once, through next/script', () => {
    expect(tag, 'uc.js tag missing from layout').not.toBeNull()
    expect(source.match(/consent\.cookiebot\.com\/uc\.js/g)).toHaveLength(1)
    expect(tag![1]).toBe('Script')
    expect(source).toMatch(/import Script from ['"]next\/script['"]/)
  })

  it('runs after hydration and keeps manual blocking mode', () => {
    const attrs = tag![2] + tag![3]
    expect(attrs).toMatch(/strategy="afterInteractive"/)
    expect(attrs).toMatch(/data-blockingmode="manual"/)
  })
})
