import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  // Single source of disallow patterns. /refer/ and /search are noindex'd at
  // the page level too, but blocking the crawl saves Googlebot budget on
  // routes that produce thin or per-user content.
  const disallow = ['/api/', '/refer/', '/search']

  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: 'Googlebot', allow: '/', disallow },
      { userAgent: 'Bingbot', allow: '/', disallow },
      { userAgent: ['msnbot', 'BingPreview'], allow: '/', disallow },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'ClaudeBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot', 'Amazonbot'],
        allow: '/',
        disallow,
      },
      // ByteDance's training crawler: aggressive request rates and no
      // answer-engine surface that serves our market. Every other AI crawler
      // is welcomed (and passes the age gate via BOT_USER_AGENTS).
      { userAgent: 'Bytespider', disallow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
