import { PortableText } from 'next-sanity'
import type { PortableTextBlock, PortableTextComponents } from 'next-sanity'

// Defence-in-depth: don't render clickable javascript: URIs even if a Sanity
// account is compromised. Same allow-list as FieldManualPortableText.
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

const components: PortableTextComponents = {
  block: {
    // The page owns H1; section <summary> owns H2-equivalent. Authors' H1/H2
    // become styled divs so we don't ship duplicate heading levels.
    h1: ({ children }) => (
      <div className="text-lg font-bold text-emerald-700 mt-6 mb-3 first:mt-0">{children}</div>
    ),
    h2: ({ children }) => (
      <div className="text-lg font-bold text-emerald-700 mt-6 mb-3 first:mt-0">{children}</div>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-bold text-emerald-700 mt-5 mb-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-sm font-semibold text-emerald-700 mt-4 mb-2 first:mt-0">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-slate-600 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-slate-900 font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ value, children }) => {
      const rawHref: unknown = value?.href
      const href = typeof rawHref === 'string' ? safeLinkHref(rawHref) : '#'
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-emerald-700 hover:text-emerald-600 underline decoration-dotted transition-colors"
        >
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-1.5 mb-4 last:mb-0">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="space-y-1.5 mb-4 last:mb-0 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full shrink-0 mt-2" aria-hidden="true" />
        <span className="text-slate-600 leading-relaxed">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="text-slate-600 leading-relaxed pl-1">{children}</li>
    ),
  },
}

interface HelpPortableTextProps {
  value: PortableTextBlock[]
}

export function HelpPortableText({ value }: HelpPortableTextProps) {
  return <PortableText value={value} components={components} />
}
