import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  return {
    rules: [
      // Default rules for all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio/',
          '/api/',
        ],
      },
      // Explicit rules for Google
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/studio/',
          '/api/',
        ],
      },
      // Explicit rules for Bing
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/studio/',
          '/api/',
        ],
      },
      // Explicit rules for Bing's other crawlers
      {
        userAgent: ['msnbot', 'BingPreview'],
        allow: '/',
        disallow: [
          '/studio/',
          '/api/',
        ],
      },
      // AI crawlers
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot', 'Amazonbot'],
        allow: '/',
        disallow: [
          '/studio/',
          '/api/',
        ],
      },
      // Google AdSense crawler
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
