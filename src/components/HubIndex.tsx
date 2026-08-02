import Link from 'next/link'

interface HubIndexProps {
  heading: string
  items: Array<{ name: string; href: string }>
}

// The complete, server-rendered link index for a hub page. The interactive
// grid above it filters and paginates client-side; this list is the canonical
// crawlable index of everything the hub contains, present in raw HTML for
// crawlers that do not execute JavaScript, and a usable A to Z for everyone.
export default function HubIndex({ heading, items }: HubIndexProps) {
  const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name, 'en-GB'))
  return (
    <section aria-label={heading} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-16">
      <h2 className="text-2xl font-serif font-bold text-white mb-6">{heading}</h2>
      <ul className="columns-2 sm:columns-3 lg:columns-4 gap-6">
        {sorted.map((item) => (
          <li key={item.href} className="mb-2 break-inside-avoid text-sm">
            <Link href={item.href} className="text-parchment-300 hover:text-gold-300 transition-colors">
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
