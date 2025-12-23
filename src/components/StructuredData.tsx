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
    description: 'Premium British rum. Engineered for reliability. Crafted for adventure.',
    email: 'hello@jerrycanspirits.co.uk',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'GB',
    },
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
