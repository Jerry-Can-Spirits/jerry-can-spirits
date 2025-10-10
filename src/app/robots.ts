import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio/',      // Block Sanity CMS admin
          '/api/',         // Block API routes
          '/_next/',       // Block Next.js internal routes
        ],
      },
      // Special rules for AI crawlers (optional - be nice to AI indexing)
      {
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        allow: [
          '/',
          '/about/',
          '/ethos/',
          '/field-manual/',
        ],
        disallow: [
          '/studio/',
          '/api/',
          '/_next/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
