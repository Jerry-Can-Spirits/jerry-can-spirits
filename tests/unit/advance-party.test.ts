/**
 * The Advance Party (9 Nov 2026) is the free first-call list for each batch.
 * Its page at /advance-party/ reuses the First Pour form pointed at its own
 * Klaviyo list, with an 18-or-over consent line, and is reachable from the
 * footer. Rendered to static markup, so these assert the HTML a visitor gets.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: unknown; className?: string }) =>
    createElement('a', { href, className }, children as never),
}))
vi.mock('next/image', () => ({ default: () => null }))

const { default: AdvancePartyPage, metadata } = await import('@/app/advance-party/page')
const { default: Footer } = await import('@/components/Footer')

describe('Advance Party page', () => {
  const html = renderToStaticMarkup(createElement(AdvancePartyPage))

  it('renders the heading and the member promise', () => {
    expect(html).toMatch(/<h1[^>]*>[\s\S]*the Advance Party first\.[\s\S]*<\/h1>/)
    expect(html).toContain('First call')
    expect(html).toContain('The low numbers')
    expect(html).toContain('The tasting')
  })

  it('carries the Advance Party form, not the First Pour one', () => {
    expect(html).toContain('Join the Advance Party')
    expect(html).toContain('I am 18 or over and agree to receive Advance Party emails')
    expect(html).not.toContain('Send me the book')
  })

  it('states no discount and no urgency', () => {
    expect(html).toContain('No discount codes')
    expect(html).not.toMatch(/only \d+ (bottles|left)|limited time|don(&#x27;|')t miss out|—|!/)
  })

  it('canonicalises to the trailing-slash URL', () => {
    expect(metadata.alternates?.canonical).toBe('https://jerrycanspirits.co.uk/advance-party/')
  })

  it('is linked from the footer', () => {
    const footer = renderToStaticMarkup(createElement(Footer))
    expect(footer).toContain('href="/advance-party/"')
  })
})
