import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://jerrycanspirits.co.uk'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/_next/static/',  // Allow static assets (CSS, JS bundles) - CRITICAL for SEO
          '/_next/image/',   // Allow Next.js optimized images
        ],
        disallow: [
          '/studio/',        // Block Sanity CMS admin
          '/api/',           // Block API routes
          '/_next/data/',    // Block Next.js data fetching routes
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
          '/_next/static/',  // Allow static assets
          '/_next/image/',   // Allow images
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
