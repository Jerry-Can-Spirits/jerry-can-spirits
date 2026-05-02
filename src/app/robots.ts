import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  // Single source of disallow patterns. /refer/ and /search are noindex'd at
  // the page level too, but blocking the crawl saves Googlebot budget on
  // routes that produce thin or per-user content.
  const disallow = ['/studio/', '/api/', '/refer/', '/search']

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
      // Google AdSense crawler — needs unrestricted access to render pages
      { userAgent: 'Mediapartners-Google', allow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
