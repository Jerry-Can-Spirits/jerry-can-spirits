import type { CocktailWithIngredients } from '@/lib/pouriq/types'

interface Props {
  cocktail: CocktailWithIngredients
  priceIncludesVat: boolean
}

function formatPrice(pence: number, vatIncluded: boolean): string {
  const pounds = pence / 100
  return `£${pounds.toFixed(2)}${vatIncluded ? '' : ' net'}`
}

export function SpecCard({ cocktail, priceIncludesVat }: Props) {
  return (
    <article
      className="
        mb-12 p-8
        bg-jerry-green-800/40 border border-gold-500/30 rounded-xl
        print:bg-white print:border-stone-300 print:rounded-none print:p-6 print:mb-0
        print:break-before-page print:first:break-before-auto
      "
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3 pb-3 border-b border-gold-500/20 print:border-stone-300 mb-4">
        <h2 className="text-3xl font-serif font-bold text-white print:text-black">
          {cocktail.name}
        </h2>
        <p className="font-mono text-2xl text-gold-300 print:text-black">
          {formatPrice(cocktail.sale_price_p, priceIncludesVat)}
        </p>
      </header>
    </article>
  )
}
