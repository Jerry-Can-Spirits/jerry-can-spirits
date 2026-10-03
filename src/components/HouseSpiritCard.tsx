import Image from 'next/image'
import Link from 'next/link'
import { getProduct } from '@/lib/shopify'
import { formatPrice } from '@/lib/format-price'
import { displayProductTitle } from '@/lib/product-title'

// The range card. It says what the house makes and what it costs, and
// nothing about the page it sits on: never "use this instead", never "works
// in this recipe". That is the rule Dan set on 3 Oct 2026 when the range was
// going to grow, and it is what lets the same card sit on a Dark and Stormy,
// the rum facet pages, the ingredient pages and the hubs without lying on any
// of them. When a second expression ships, add its handle here and every
// placement carries both bottles.
export const HOUSE_SPIRIT_HANDLES = ['jerry-can-spirits-expedition-spiced-rum']

interface HouseSpiritCardProps {
  className?: string
}

export default async function HouseSpiritCard({ className = '' }: HouseSpiritCardProps) {
  const products = (await Promise.all(HOUSE_SPIRIT_HANDLES.map((h) => getProduct(h)))).filter(
    (p): p is NonNullable<typeof p> => p !== null,
  )
  if (products.length === 0) return null

  return (
    <aside
      aria-label={products.length > 1 ? 'The house spirits' : 'The house spirit'}
      className={`rounded-xl border border-gold-500/20 bg-linear-to-br from-parchment-200/10 to-parchment-400/5 p-4 backdrop-blur-sm sm:p-6 ${className}`}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-gold-300">
        {products.length > 1 ? 'The house spirits' : 'The house spirit'}
      </p>
      <ul className="space-y-4">
        {products.map((product) => {
          const image = product.images?.[0]
          const href = `/shop/product/${product.handle}/`
          return (
            <li key={product.id} className="flex items-center gap-4">
              {image && (
                <Link href={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-jerry-green-800/20">
                  <Image src={image.url} alt={image.altText || displayProductTitle(product.title)} fill sizes="80px" className="object-contain p-1" />
                </Link>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-serif text-lg font-bold leading-tight text-white">
                  {displayProductTitle(product.title)}
                </p>
                <p className="text-sm text-parchment-300">
                  {formatPrice(product.priceRange.minVariantPrice.amount, product.priceRange.minVariantPrice.currencyCode)}
                  <span className="text-parchment-400"> · 700ml · 40% ABV</span>
                </p>
              </div>
              <Link
                href={href}
                className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-semibold text-gold-300 transition-colors hover:border-gold-400 hover:text-gold-200"
              >
                See the bottle
              </Link>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
