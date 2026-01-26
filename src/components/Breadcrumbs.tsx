import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Build the full breadcrumb list including Home
  const fullItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...items,
  ]

  // Generate BreadcrumbList schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullItems.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `https://jerrycanspirits.co.uk${item.href}` : undefined,
    })),
  }

  return (
    <>
      {/* Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Visual breadcrumbs */}
      <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
        <ol className="flex flex-wrap items-center gap-2">
          {fullItems.map((item, index) => {
            const isLast = index === fullItems.length - 1

            return (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-gold-500/50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                {isLast || !item.href ? (
                  <span className="text-parchment-300" aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gold-400 hover:text-gold-300 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
