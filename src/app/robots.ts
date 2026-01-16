import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',
          '/_next/image/',
        ],
        disallow: [
          '/studio/',
          '/api/',
          '/_next/data/',
          '/auth',
          '/auth.html',
        ],
      },
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'PerplexityBot', 'Amazonbot'],
        allow: [
          '/',
          '/about/',
          '/ethos/',
          '/field-manual/',
          '/guides/',
          '/shop/',
          '/faq/',
          '/_next/static/',
          '/_next/image/',
        ],
        disallow: [
          '/studio/',
          '/api/',
          '/_next/data/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
