/**
 * The Community Guidelines page exists at /community-guidelines/, carries its
 * heading and its own last-updated date, and is reachable from the footer
 * (after Terms of Service) and from Terms of Service clause 4.3. Rendered to
 * static markup, so these assert the HTML a visitor receives.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: unknown; className?: string }) =>
    createElement('a', { href, className }, children as never),
}))
vi.mock('next/image', () => ({ default: () => null }))

const { default: CommunityGuidelines, metadata } = await import('@/app/community-guidelines/page')
const { default: TermsOfService } = await import('@/app/terms-of-service/page')
const { default: Footer } = await import('@/components/Footer')

describe('Community Guidelines page', () => {
  const html = renderToStaticMarkup(createElement(CommunityGuidelines))

  it('renders the heading and its last-updated date', () => {
    expect(html).toMatch(/<h1[^>]*>[\s\S]*Community Guidelines[\s\S]*<\/h1>/)
    expect(html).toContain('Last updated: 17 October 2026')
    expect(html).toContain('These guidelines were last updated on 17 October 2026.')
  })

  it('canonicalises to the trailing-slash URL', () => {
    expect(metadata.alternates?.canonical).toBe('https://jerrycanspirits.co.uk/community-guidelines/')
  })

  it('takes reports at hello@ and links Drinkaware only', () => {
    expect(html).toContain('href="mailto:hello@jerrycanspirits.co.uk"')
    expect(html).toContain('href="https://www.drinkaware.co.uk"')
    expect(html).not.toContain('portmangroup')
    expect(html).not.toContain('asa.org.uk')
  })
})

describe('links to the guidelines', () => {
  it('the footer lists Community Guidelines straight after Terms of Service', () => {
    const html = renderToStaticMarkup(createElement(Footer))
    const tos = html.indexOf('href="/terms-of-service/"')
    const guidelines = html.indexOf('href="/community-guidelines/"')
    expect(tos).toBeGreaterThan(-1)
    expect(guidelines).toBeGreaterThan(tos)
    expect(html.slice(tos, guidelines)).not.toMatch(/href="\/(?!terms-of-service\/)/)
  })

  it('Terms of Service clause 4.3 links the guidelines and carries the new date', () => {
    const html = renderToStaticMarkup(createElement(TermsOfService))
    expect(html).toContain('4.3 Content You Share With Us')
    expect(html).toContain('href="/community-guidelines/"')
    expect(html).toContain('Last updated: 17 October 2026')
  })
})

describe('Cookie Policy', () => {
  it('describes jcs_eid in the Meta entry and carries the new date', async () => {
    const { default: CookiePolicy } = await import('@/app/cookie-policy/page')
    const html = renderToStaticMarkup(createElement(CookiePolicy))
    expect(html).toContain('we also set a first-party cookie, jcs_eid, holding a random identifier.')
    expect(html).toContain('It expires after one year, and we delete it if you withdraw consent.')
    expect(html).toContain('Last updated: 17 October 2026')
  })
})
