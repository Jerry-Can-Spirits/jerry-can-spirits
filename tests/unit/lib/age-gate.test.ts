import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import {
  AGE_VERIFIED_ATTR,
  AGE_VERIFIED_GLOBAL,
  BOT_USER_AGENTS,
  CLIENT_ONLY_BOT_PATTERNS,
  ageGateInlineScript,
  isAgeExcludedPath,
  isBot,
  productHandleFromReturnPath,
} from '@/lib/age-gate'
import { middleware } from '@/middleware'

// Real user-agent strings as each crawler sends them, so a substring drift in
// BOT_USER_AGENTS fails here rather than silently gating a crawler in
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
  // robots.txt has always invited AI crawlers; this asserts each one reaches
  // gated content and is recognised (the isBot cookie is what the inline gate
  // script honours). If an entry drops out of BOT_USER_AGENTS, the affected
  // engine sees the gate overlay in its rendered snapshot.
  for (const [name, ua] of Object.entries(AI_CRAWLER_UAS)) {
    it(`passes ${name} through to gated content, flagged as a bot`, () => {
      const res = middleware(gatedRequest(ua))
      expect(res.status).toBe(200)
      expect(res.headers.get('location')).toBeNull()
      expect(res.headers.get('x-is-bot')).toBe('true')
    })
  }

  it('does not redirect an unverified browser: the gate is the overlay in the page', () => {
    const res = middleware(
      gatedRequest(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
      )
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
    expect(res.headers.get('x-is-bot')).toBeNull()
  })

  it('does not flag unlisted crawlers (Bytespider, curl) as bots', () => {
    for (const ua of [
      'Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider; spider-feedback@bytedance.com)',
      'curl/8.9.1',
    ]) {
      const res = middleware(gatedRequest(ua))
      expect(res.status).toBe(200)
      expect(res.headers.get('x-is-bot')).toBeNull()
    }
  })
})

// The inline script is the gate's decision, run before first paint. It is a
// string built at render time, so run it against a stand-in document and
// check what it marks. A false negative shows a verified visitor the gate; a
// false positive shows a minor the content.
describe('ageGateInlineScript — the before-paint decision', () => {
  const CHROME =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

  function decide({ cookie = '', ua = CHROME, stored = null as string | null } = {}) {
    const attrs: Record<string, string> = {}
    const document = { cookie, documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v } } }
    const win: Record<string, unknown> = {}
    new Function('document', 'navigator', 'localStorage', 'window', ageGateInlineScript())(
      document,
      { userAgent: ua },
      { getItem: () => stored },
      win,
    )
    return { attr: AGE_VERIFIED_ATTR in attrs, global: win[AGE_VERIFIED_GLOBAL] === true }
  }

  function run(opts?: Parameters<typeof decide>[0]) {
    const { attr, global } = decide(opts)
    // The two must never disagree: the attribute drives the first paint and
    // the window flag drives everything after hydration strips it.
    expect(attr).toBe(global)
    return attr
  }

  it('records the decision on window too, because <html> does not survive hydration', () => {
    expect(decide({ cookie: 'ageVerified=true' })).toEqual({ attr: true, global: true })
    expect(decide()).toEqual({ attr: false, global: false })
  })

  it('marks a visitor with the verified cookie', () => {
    expect(run({ cookie: 'detectedCountry=GB; ageVerified=true' })).toBe(true)
  })

  it('does not mark an unverified browser', () => {
    expect(run()).toBe(false)
    expect(run({ cookie: 'ageVerified=false' })).toBe(false)
    expect(run({ cookie: 'xageVerified=true' })).toBe(false)
  })

  it('marks a visitor verified before the cookie existed (localStorage only)', () => {
    expect(run({ stored: 'true' })).toBe(true)
  })

  it('marks a request the middleware flagged as a bot', () => {
    expect(run({ cookie: 'isBot=true' })).toBe(true)
  })

  it('marks every listed crawler and auditor by user agent', () => {
    for (const ua of [...Object.values(AI_CRAWLER_UAS), 'Chrome-Lighthouse', 'Mozilla/5.0 (compatible; Googlebot/2.1)']) {
      expect(run({ ua }), ua).toBe(true)
    }
  })

  it('compiles every bot pattern into the script, escaped', () => {
    const script = ageGateInlineScript()
    for (const p of [...BOT_USER_AGENTS, ...CLIENT_ONLY_BOT_PATTERNS]) {
      expect(run({ ua: `Mozilla/5.0 (${p})` }), p).toBe(true)
    }
    expect(script).toContain('pinterest\\/')
  })

  it('survives a browser that throws on storage access', () => {
    const attrs: Record<string, string> = {}
    const document = { cookie: '', documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v } } }
    expect(() =>
      new Function('document', 'navigator', 'localStorage', 'window', ageGateInlineScript())(
        document,
        { userAgent: CHROME },
        { getItem: () => { throw new Error('blocked') } },
        {},
      ),
    ).not.toThrow()
    expect(AGE_VERIFIED_ATTR in attrs).toBe(false)
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
    it(`${path} is served to an unverified browser`, () => {
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

// Social link-preview crawlers. facebookexternalhit builds the preview card
// shown when a URL is shared on Facebook, Messenger, Instagram or WhatsApp.
// Gated, it renders the age-check page as the preview and every shared link
// looks broken. Seven days of Worker logs showed 44 of its requests redirected
// to the gate, against 42 served, right up to the day this was written.
describe('social link-preview crawlers reach content', () => {
  const SOCIAL: Record<string, string> = {
    facebookexternalhit: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'meta-externalads': 'meta-externalads/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
    'meta-externalagent': 'meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)',
    slackbot: 'Slackbot 1.0 (+https://api.slack.com/robots)',
    'slackbot-linkexpanding': 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
    discordbot: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
    pinterestbot: 'Mozilla/5.0 (compatible; Pinterestbot/1.0; +http://www.pinterest.com/bot.html)',
    'pinterest-0.2': 'Pinterest/0.2 (+http://www.pinterest.com/bot.html)',
    redditbot: 'Mozilla/5.0 (compatible; redditbot/1.0; +http://www.reddit.com/feedback)',
    telegrambot: 'TelegramBot (like TwitterBot)',
    whatsapp: 'WhatsApp/2.23.20.0',
    skypeuripreview: 'SkypeUriPreview Preview/0.5',
    mastodon: 'Mastodon/4.2.0 (http.rb/5.1.1; +https://mastodon.social/)',
    bluesky: 'Bluesky Cardyb/1.1',
    twitterbot: 'Twitterbot/1.0',
    linkedinbot: 'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
    // Link checkers and unfurlers, added 24 Sep 2026 after Klaviyo was measured 307ing.
    klaviyo: 'Klaviyo/1.0',
    embedly: 'Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)',
    bitlybot: 'bitlybot/3.0 (+http://bit.ly/)',
    'google-pagerenderer': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/W.X.Y.Z Safari/537.36 Google-PageRenderer Google (+https://developers.google.com/+/web/snippet/)',
  }

  for (const [name, ua] of Object.entries(SOCIAL)) {
    it(`${name} is not redirected to the age gate`, () => {
      expect(isBot(ua), `${name} missing from BOT_USER_AGENTS`).toBe(true)
      const res = middleware(gatedRequest(ua))
      expect(res.status).not.toBe(307)
      expect(res.headers.get('location')).toBeNull()
    })
  }
})

describe('productHandleFromReturnPath — the product behind a gated visit', () => {
  it('extracts the handle from a product return path, with or without query and hash', () => {
    expect(productHandleFromReturnPath('/shop/product/jerry-can-spirits-expedition-spiced-rum/')).toBe('jerry-can-spirits-expedition-spiced-rum')
    expect(productHandleFromReturnPath('/shop/product/hiball-glass-38cl/?utm_source=klaviyo')).toBe('hiball-glass-38cl')
    expect(productHandleFromReturnPath('/shop/product/hiball-glass-38cl/#reviews')).toBe('hiball-glass-38cl')
    expect(productHandleFromReturnPath('/shop/product/hiball-glass-38cl')).toBe('hiball-glass-38cl')
  })

  it('returns null for anything that is not a product page', () => {
    expect(productHandleFromReturnPath('/')).toBeNull()
    expect(productHandleFromReturnPath('/shop/rum-gifts/')).toBeNull()
    expect(productHandleFromReturnPath('/shop/product/')).toBeNull()
    expect(productHandleFromReturnPath('/shop/product/Bad Handle/')).toBeNull()
    expect(productHandleFromReturnPath('/shop/product/x/y/')).toBeNull()
    expect(productHandleFromReturnPath('/field-manual/cocktails/mojito/')).toBeNull()
  })
})
