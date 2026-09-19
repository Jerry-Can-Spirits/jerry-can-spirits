import Link from 'next/link'
import { categoriesForHandle } from '@/lib/categories'

// Compact internal links from a PDP to the virtual collection pages that
// merchandise it. Curated by categories.ts productHandles rather than raw
// Shopify collections, and capped so the row stays a wayfinding aid for the
// customer (and an internal-linking aid for the collection pages) instead of
// a tag dump.

// Reading for the products that are the rum itself. The product page was the
// only page in the spiced rum cluster with no route into the guides, so the
// guide that answers "what is spiced rum" had no link from the thing it is
// about. Same list for every pack of the same liquid.
const RUM_READING = [
  { label: 'What is spiced rum', href: '/guides/complete-guide-spiced-rum/' },
  { label: 'The botanicals', href: '/guides/botanicals-behind-expedition-spiced-rum/' },
  { label: 'Every ingredient', href: '/ingredients/expedition-spiced-rum/' },
  { label: 'Batch 001', href: '/batch/001/' },
]
const READING: Record<string, typeof RUM_READING> = {
  'jerry-can-spirits-expedition-spiced-rum': RUM_READING,
  'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles': RUM_READING,
  'jerry-can-spirits-premium-gift-pack': RUM_READING,
}

function LinkRow({ lead, links }: { lead: string; links: Array<{ label: string; href: string }> }) {
  return (
    <p className="text-sm text-parchment-400">
      {lead}{' '}
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && ' · '}
          <Link
            href={l.href}
            className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors"
          >
            {l.label}
          </Link>
        </span>
      ))}
    </p>
  )
}

export default function FindItIn({ handle }: { handle: string }) {
  const categories = categoriesForHandle(handle).slice(0, 4)
  const reading = READING[handle] ?? []
  if (categories.length === 0 && reading.length === 0) return null

  return (
    <div className="space-y-2">
      {categories.length > 0 && (
        <LinkRow lead="Find it in:" links={categories.map((c) => ({ label: c.title, href: `/shop/${c.slug}/` }))} />
      )}
      {reading.length > 0 && <LinkRow lead="Read more:" links={reading} />}
    </div>
  )
}
