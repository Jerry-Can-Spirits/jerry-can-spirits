import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { isAgeExcludedPath, isBot } from '@/lib/age-gate'
import { middleware } from '@/middleware'

// Real user-agent strings as each crawler sends them, so a substring drift in
// BOT_USER_AGENTS fails here rather than silently 307ing a crawler in
// production.
const AI_CRAWLER_UAS: Record<string, string> = {
  'OAI-SearchBot':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot',
  'ChatGPT-User':
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
  GPTBot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  'Claude-SearchBot':
    'Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com/claude-searchbot)',
  ClaudeBot:
    'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)',
  PerplexityBot:
    'Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
  CCBot: 'CCBot/2.0 (https://commoncrawl.org/faq/)',
  'Meta-ExternalAgent':
    'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
  Applebot:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15 (Applebot/0.1; +http://www.apple.com/go/applebot)',
  'Applebot-Extended': 'Applebot-Extended/1.0 (+https://support.apple.com/en-us/119829)',
}

// A gated content path: not in EXCLUDED_PREFIXES / EXCLUDED_EXACT.
function gatedRequest(userAgent: string): NextRequest {
  return new NextRequest('https://jerrycanspirits.co.uk/field-manual/cocktails/mojito/', {
    headers: { 'user-agent': userAgent, 'sec-fetch-dest': 'document' },
  })
}

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

describe('middleware age gate — AI crawler access', () => {
  // robots.txt has always invited AI crawlers; this asserts the gate lets each
  // one reach gated content (no 307 to /age-check/). If an entry drops out of
  // BOT_USER_AGENTS, the affected engine loses the entire site again.
  for (const [name, ua] of Object.entries(AI_CRAWLER_UAS)) {
    it(`passes ${name} through to gated content`, () => {
      const res = middleware(gatedRequest(ua))
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
    })
  }

  it('still 307s an unverified browser to the age gate', () => {
    const res = middleware(
      gatedRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
      )
    )
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toContain('/age-check/')
  })

  it('still 307s unlisted crawlers (Bytespider, curl)', () => {
    for (const ua of [
      'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
      'curl/8.9.1',
    ]) {
      const res = middleware(gatedRequest(ua))
      expect(res.status).toBe(307)
      expect(res.headers.get('location')).toContain('/age-check/')
    }
  })
})

// Static files in public/ never reach the middleware, so a crawler file served
// from there looks exempt whether or not it is actually in EXCLUDED_EXACT. The
// moment it becomes a route the gate starts 307ing it, which is what happened
// to /llms.txt. These pin the exemption itself rather than the current serving
// mechanism, so converting any of them to a route stays safe.
describe('crawler-facing paths are never age-gated', () => {
  const CRAWLER_PATHS = [
    '/robots.txt',
    '/sitemap.xml',
    '/llms.txt',
    '/manifest.json',
    '/.well-known/security.txt',
  ]

  for (const path of CRAWLER_PATHS) {
    it(`${path} is not redirected for an unverified browser`, () => {
      const res = middleware(
        new NextRequest(`https://jerrycanspirits.co.uk${path}`, {
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            'sec-fetch-dest': 'document',
          },
        })
      )
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })
  }

  it('isAgeExcludedPath covers every crawler path', () => {
    for (const path of CRAWLER_PATHS) {
      expect(isAgeExcludedPath(path)).toBe(true)
    }
  })
})
