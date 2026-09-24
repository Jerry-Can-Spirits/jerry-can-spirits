import Link from 'next/link'
import { formatPrice } from '@/lib/format-price'
import type { ProductFormat } from '@/lib/product-formats'

export interface ProductFormatOption extends ProductFormat {
  price: string
  currencyCode: string
  availableForSale: boolean
}

// "Ways to buy": the other formats of the same liquid, as chips under the
// price, with the current one marked. Links, not buttons, because each format
// is its own product with its own page, gallery and variant selector. Prices
// are live from the Storefront API, fetched by the page alongside the product.
export default function ProductFormats({ options, currentHandle }: { options: ProductFormatOption[]; currentHandle: string }) {
  if (options.length < 2) return null

  return (
    <div className="pt-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-2">Ways to buy</p>
      <ul className="grid grid-cols-3 gap-2" aria-label="Formats">
        {options.map((o) => {
          const current = o.handle === currentHandle
          const inner = (
            <>
              <span className="block text-sm font-semibold text-white">{o.label}</span>
              <span className="block text-xs text-parchment-400 mt-0.5">{o.note}</span>
              <span className="block text-sm font-serif font-bold text-gold-400 mt-1">
                {o.availableForSale ? formatPrice(o.price, o.currencyCode) : 'Unavailable'}
              </span>
            </>
          )
          return (
            <li key={o.handle}>
              {current ? (
                <div
                  aria-current="page"
                  className="h-full rounded-lg border-2 border-gold-500 bg-jerry-green-800/60 px-3 py-2"
                >
                  {inner}
                </div>
              ) : (
                <Link
                  href={`/shop/product/${o.handle}/`}
                  className="block h-full rounded-lg border border-gold-500/30 hover:border-gold-400 bg-jerry-green-900/40 px-3 py-2 transition-colors"
                >
                  {inner}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
