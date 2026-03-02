import { PortableText } from 'next-sanity'
import type { PortableTextBlock, PortableTextComponents } from 'next-sanity'

const components: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      // H1 is suppressed inside body content — rendered as h2 visually
      <h2 className="text-2xl font-serif font-bold text-gold-300 mt-6 mb-3 first:mt-0">{children}</h2>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-serif font-bold text-gold-300 mt-6 mb-3 first:mt-0">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-serif font-bold text-gold-400 mt-5 mb-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-serif font-semibold text-gold-400 mt-4 mb-2 first:mt-0">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-parchment-300 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target={value?.href?.startsWith('http') ? '_blank' : undefined}
        rel={value?.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        className="text-blue-400 hover:text-blue-300 underline decoration-dotted transition-colors"
      >
        {children}
      </a>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-2 mb-4 last:mb-0">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="space-y-2 mb-4 last:mb-0 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="w-2 h-2 bg-gold-400 rounded-full flex-shrink-0 mt-2" aria-hidden="true" />
        <span className="text-parchment-300 leading-relaxed">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="text-parchment-300 leading-relaxed pl-1">{children}</li>
    ),
  },
}

interface FieldManualPortableTextProps {
  value: Record<string, unknown>[]
}

export default function FieldManualPortableText({ value }: FieldManualPortableTextProps) {
  return <PortableText value={value as unknown as PortableTextBlock[]} components={components} />
}
