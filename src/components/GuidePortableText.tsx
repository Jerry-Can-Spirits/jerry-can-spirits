import Link from 'next/link'
import { PortableText } from 'next-sanity'
import type { PortableTextBlock, PortableTextComponents } from 'next-sanity'

// Renders guide section bodies (`contentRich`). Extends the Field Manual
// portable-text treatment with the `internalLink` annotation, whose reference
// is dereferenced at query time into { docType, slug } (see guideBySlugQuery).

// Sanity authors are trusted, but defence-in-depth: a Sanity account
// compromise must not mean clickable javascript: URIs across the guides.
function safeLinkHref(href: string): string {
  const trimmed = href.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed
  }
  return '#'
}

// Every internal link route ends with a trailing slash (repo convention:
// trailingSlash true; a slash-less href 308-redirects and wastes crawl budget).
const INTERNAL_ROUTES: Record<string, (slug: string) => string> = {
  cocktail: (slug) => `/field-manual/cocktails/${slug}/`,
  ingredient: (slug) => `/field-manual/ingredients/${slug}/`,
  equipment: (slug) => `/field-manual/equipment/${slug}/`,
  guide: (slug) => `/guides/${slug}/`,
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-parchment-300 leading-relaxed mb-5 last:mb-0">{children}</p>
    ),
    // Headings inside section bodies are unexpected (headings live in the
    // section/subsection fields) but must not render unstyled if authored.
    h2: ({ children }) => (
      <h3 className="text-xl font-serif font-bold text-gold-400 mt-8 mb-3 first:mt-0">{children}</h3>
    ),
    h3: ({ children }) => (
      <h4 className="text-lg font-serif font-semibold text-gold-400 mt-6 mb-2 first:mt-0">{children}</h4>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => {
      const rawHref: unknown = value?.href
      const href = typeof rawHref === 'string' ? safeLinkHref(rawHref) : '#'
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-blue-400 hover:text-blue-300 underline decoration-dotted transition-colors"
        >
          {children}
        </a>
      )
    },
    internalLink: ({ value, children }) => {
      const docType: unknown = value?.docType
      const slug: unknown = value?.slug
      const route =
        typeof docType === 'string' && typeof slug === 'string' && slug
          ? INTERNAL_ROUTES[docType]?.(slug)
          : undefined
      // A dangling reference (deleted target) degrades to plain text rather
      // than a broken link.
      if (!route) return <>{children}</>
      return (
        <Link
          href={route}
          className="text-blue-400 hover:text-blue-300 underline decoration-dotted transition-colors"
        >
          {children}
        </Link>
      )
    },
  },
  list: {
    bullet: ({ children }) => <ul className="space-y-2 mb-4 last:mb-0">{children}</ul>,
    number: ({ children }) => (
      <ol className="space-y-2 mb-4 last:mb-0 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="w-2 h-2 bg-gold-400 rounded-full shrink-0 mt-2" aria-hidden="true" />
        <span className="text-parchment-300 leading-relaxed">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="text-parchment-300 leading-relaxed pl-1">{children}</li>
    ),
  },
}

interface GuidePortableTextProps {
  value: PortableTextBlock[]
}

export default function GuidePortableText({ value }: GuidePortableTextProps) {
  return <PortableText value={value} components={components} />
}
