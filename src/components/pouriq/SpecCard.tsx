import type { CocktailWithIngredients } from '@/lib/pouriq/types'
import { formatServeMeasure } from '@/lib/pouriq/measures'

interface Props {
  cocktail: CocktailWithIngredients
  priceIncludesVat: boolean
}

function formatPrice(pence: number, vatIncluded: boolean): string {
  const pounds = pence / 100
  return `£${pounds.toFixed(2)}${vatIncluded ? '' : ' net'}`
}


export function SpecCard({ cocktail, priceIncludesVat }: Props) {
  const garnishes = cocktail.ingredients.filter(
    (i) => i.library.ingredient_type === 'garnish'
  )
  const pourIngredients = cocktail.ingredients.filter(
    (i) => i.library.ingredient_type !== 'garnish'
  )

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

      {cocktail.glass != null && cocktail.glass.trim() !== '' && (
        <p className="text-sm text-parchment-300 print:text-black mb-2">
          <span className="font-semibold">Glass:</span> {cocktail.glass}
        </p>
      )}

      {garnishes.length > 0 && (
        <p className="text-sm text-parchment-300 print:text-black mb-6">
          <span className="font-semibold">Garnish:</span>{' '}
          {garnishes.map((g) => g.library.name).join(', ')}
        </p>
      )}

      <section className="mb-6">
        <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
          Ingredients
        </h3>
        {pourIngredients.length === 0 ? (
          <p className="text-sm italic text-parchment-400 print:text-stone-600">
            No ingredients recorded yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {pourIngredients.map((i) => (
              <li
                key={i.id}
                className="text-sm text-parchment-200 print:text-black flex gap-3"
              >
                <span className="font-mono w-20 shrink-0">
                  {formatServeMeasure(i.recipe_unit, i.recipe_qty, i.pour_ml, i.unit_count)}
                </span>
                <span>{i.library.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {cocktail.notes != null && cocktail.notes.trim() !== '' && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
            Directions
          </h3>
          <p className="text-sm italic text-parchment-300 print:text-stone-700">
            {cocktail.notes}
          </p>
        </section>
      )}

      {cocktail.description != null && cocktail.description.trim() !== '' && (
        <section className="mb-6">
          <h3 className="text-xs uppercase tracking-widest text-gold-400 print:text-black mb-2">
            Tell the customer
          </h3>
          <p className="text-sm text-parchment-200 print:text-black leading-relaxed">
            {cocktail.description}
          </p>
        </section>
      )}

      {cocktail.field_manual_slug != null &&
        /^[a-z0-9-]+$/.test(cocktail.field_manual_slug) && (
        <a
          href={`https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.field_manual_slug}/`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-gold-300 hover:text-gold-200 print:text-black print:underline border-b border-gold-500/30 hover:border-gold-400 print:border-none pb-1"
        >
          Full method &amp; technique
          <span aria-hidden="true" className="ml-2 print:hidden">→</span>
        </a>
      )}
    </article>
  )
}
