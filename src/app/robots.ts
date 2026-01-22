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
          '/auth',           // Block old auth pages
          '/auth.html',      // Block old auth pages
        ],
      },
      // Special rules for AI crawlers (be nice to AI indexing for discoverability)
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
  }
}
