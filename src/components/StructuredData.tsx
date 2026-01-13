import Script from 'next/script'

interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[]
  id?: string
}

export default function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2),
      }}
    />
  )
}

// Organization Schema for the business
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Jerry Can Spirits',
    legalName: 'Jerry Can Spirits Ltd',
    url: 'https://jerrycanspirits.co.uk',
    logo: 'https://jerrycanspirits.co.uk/images/Logo.webp',
    description: 'Veteran-owned premium British rum with authentic military heritage. Founded by Royal Corps of Signals veterans. Engineered for reliability, designed for adventure.',
    email: 'hello@jerrycanspirits.co.uk',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Blackpool',
      addressRegion: 'Lancashire',
      addressCountry: 'GB',
    },
    knowsAbout: ['Premium Rum', 'British Spirits', 'Military Heritage', 'Veteran-Owned Business', 'Small-Batch Distilling'],
    award: 'Armed Forces Covenant Signatory',
  }

  return <StructuredData data={schema} id="organization-schema" />
}

// Website Schema
export function WebsiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://jerrycanspirits.co.uk/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return <StructuredData data={schema} id="website-schema" />
}

// Article Schema for educational content and guides
interface ArticleSchemaProps {
  title: string
  description: string
  url: string
  publishedAt: string
  updatedAt?: string
  author?: string
  imageUrl?: string
  wordCount?: number
}

export function ArticleSchema({
  title,
  description,
  url,
  publishedAt,
  updatedAt,
  author = 'Jerry Can Spirits',
  imageUrl,
  wordCount
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: url,
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
    author: {
      '@type': 'Organization',
      name: author,
      url: 'https://jerrycanspirits.co.uk'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Jerry Can Spirits',
      url: 'https://jerrycanspirits.co.uk',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jerrycanspirits.co.uk/images/Logo.webp'
      }
    },
    ...(imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: imageUrl
      }
    }),
    ...(wordCount && { wordCount }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    }
  }

  return <StructuredData data={schema} id="article-schema" />
}

// Breadcrumb Schema for navigation hierarchy
interface BreadcrumbItem {
  name: string
  url: string
}

interface BreadcrumbSchemaProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }

  return <StructuredData data={schema} id="breadcrumb-schema" />
}
