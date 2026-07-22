import Link from 'next/link'
import { categoriesForHandle } from '@/lib/categories'

// Compact internal links from a PDP to the virtual collection pages that
// merchandise it. Curated by categories.ts productHandles rather than raw
// Shopify collections, and capped so the row stays a wayfinding aid for the
// customer (and an internal-linking aid for the collection pages) instead of
// a tag dump.
export default function FindItIn({ handle }: { handle: string }) {
  const categories = categoriesForHandle(handle).slice(0, 4)
  if (categories.length === 0) return null

  return (
    <p className="text-sm text-parchment-400">
      Find it in:{' '}
      {categories.map((c, i) => (
        <span key={c.slug}>
          {i > 0 && ' · '}
          <Link
            href={`/shop/${c.slug}/`}
            className="text-gold-400 hover:text-gold-300 underline underline-offset-2 transition-colors"
          >
            {c.title}
          </Link>
        </span>
      ))}
    </p>
  )
}
