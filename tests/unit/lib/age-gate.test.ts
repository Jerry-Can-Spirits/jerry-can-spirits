import { describe, expect, it } from 'vitest'
import { isBot } from '@/lib/age-gate'

describe('isBot — age-gate bot allowlist', () => {
  it('recognises Ahrefs Site Audit (a distinct UA from AhrefsBot)', () => {
    // The weekly Ahrefs Site Audit crawls as this UA; without it, every gated
    // page 307-redirects to /age-check/ and the audit reads the gate, not content.
    expect(
      isBot('Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/site-audit)')
    ).toBe(true)
  })

  it('recognises AhrefsBot (the backlink crawler)', () => {
    expect(isBot('Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)')).toBe(true)
  })

  it('recognises the major search and SEO-audit crawlers', () => {
    for (const ua of [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (compatible; SemrushBot-SA/0.97; +http://www.semrush.com/bot.html)',
      'Screaming Frog SEO Spider/21.0',
    ]) {
      expect(isBot(ua)).toBe(true)
    }
  })

  it('does not classify a normal browser as a bot', () => {
    expect(
      isBot('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
    ).toBe(false)
  })

  it('handles a missing user-agent', () => {
    expect(isBot(null)).toBe(false)
    expect(isBot(undefined)).toBe(false)
    expect(isBot('')).toBe(false)
  })
})
