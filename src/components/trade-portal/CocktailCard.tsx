import Image from 'next/image'
import { TradeSheetSection, TradeSheetShell } from './TradeSheetShell'

interface CocktailIngredient {
  name: string
  amount: string
  description?: string | null
}

interface CocktailVariant {
  name: string
  description: string
  difficulty?: string | null
  ingredients: CocktailIngredient[]
  instructions: string[]
  note?: string | null
}

export interface CocktailCardData {
  name: string
  description: string
  difficulty: string
  family: string
  garnish: string
  glassware?: { name?: string | null } | null
  ingredients: CocktailIngredient[]
  instructions: string[]
  note?: string | null
  variants?: CocktailVariant[] | null
  prepTime?: string | null
  servings?: string | null
  image?: string | null
  imageAlt?: string | null
}

function formatDifficulty(d: string): string {
  if (!d) return ''
  return d.charAt(0).toUpperCase() + d.slice(1)
}

function formatFamily(f: string): string {
  return f
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

// Convert ISO 8601 duration like "PT5M" to a friendly "5 min" string.
function formatPrepTime(iso: string): string {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(iso)
  if (!match) return iso
  const hours = match[1] ? parseInt(match[1], 10) : 0
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  if (minutes) return `${minutes} min`
  return iso
}

function IngredientList({ ingredients }: { ingredients: CocktailIngredient[] }) {
  return (
    <table className="w-full text-sm print:text-xs">
      <tbody>
        {ingredients.map((ing, idx) => (
          <tr key={idx} className="border-b border-gold-500/15 print:border-black/30 last:border-0">
            <td className="py-1.5 print:py-0.5 pr-3 font-medium text-parchment-100 print:text-black w-24 sm:w-32 align-top">
              {ing.amount}
            </td>
            <td className="py-1.5 print:py-0.5 align-top">
              <span className="text-parchment-100 print:text-black">{ing.name}</span>
              {ing.description && (
                <span className="block text-xs text-parchment-400 print:text-black/70">
                  {ing.description}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Method({ steps }: { steps: string[] }) {
  return (
    <ol className="list-decimal list-outside ml-5 text-sm leading-relaxed space-y-1.5 print:text-xs print:leading-snug print:space-y-0.5">
      {steps.map((s, idx) => (
        <li key={idx}>{s}</li>
      ))}
    </ol>
  )
}

export function CocktailCard({ cocktail }: { cocktail: CocktailCardData }) {
  const subtitleBits: string[] = []
  if (cocktail.family) subtitleBits.push(formatFamily(cocktail.family))
  if (cocktail.difficulty) subtitleBits.push(`${formatDifficulty(cocktail.difficulty)} build`)
  if (cocktail.prepTime) subtitleBits.push(formatPrepTime(cocktail.prepTime))
  if (cocktail.servings) subtitleBits.push(cocktail.servings)

  return (
    <TradeSheetShell
      title={cocktail.name}
      eyebrow="Cocktail Recipe Card"
      subtitle={subtitleBits.join(' · ')}
    >
      {cocktail.image && (
        <div className="relative w-full aspect-3/2 mb-6 rounded-lg overflow-hidden bg-jerry-green-800/40 print:hidden">
          <Image
            src={cocktail.image}
            alt={cocktail.imageAlt ?? cocktail.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 720px"
          />
        </div>
      )}

      {cocktail.description && (
        <p className="text-base leading-relaxed text-parchment-200 mb-6 print:hidden">
          {cocktail.description}
        </p>
      )}

      <TradeSheetSection title="Glass and garnish">
        <p className="text-sm leading-relaxed">
          <span className="text-parchment-400 print:text-black/70">Glass:</span>{' '}
          {cocktail.glassware?.name ?? 'Bartender&apos;s choice'}
        </p>
        <p className="text-sm leading-relaxed mt-1">
          <span className="text-parchment-400 print:text-black/70">Garnish:</span> {cocktail.garnish}
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Ingredients">
        <IngredientList ingredients={cocktail.ingredients} />
      </TradeSheetSection>

      <TradeSheetSection title="Method">
        <Method steps={cocktail.instructions} />
      </TradeSheetSection>

      {cocktail.note && (
        <div className="print:hidden">
          <TradeSheetSection title="Expert tip">
            <p className="text-sm leading-relaxed italic">{cocktail.note}</p>
          </TradeSheetSection>
        </div>
      )}

      {cocktail.variants && cocktail.variants.length > 0 && (
        <TradeSheetSection title="Variants">
          <div className="space-y-5">
            {cocktail.variants.map((v, idx) => (
              <div key={idx} className="print:break-inside-avoid">
                <p className="font-serif text-lg text-white print:text-black mb-1">{v.name}</p>
                <p className="text-sm text-parchment-300 print:text-black mb-2">{v.description}</p>
                <IngredientList ingredients={v.ingredients} />
                <div className="mt-2">
                  <Method steps={v.instructions} />
                </div>
                {v.note && (
                  <p className="text-xs text-parchment-400 print:text-black/70 italic mt-2">{v.note}</p>
                )}
              </div>
            ))}
          </div>
        </TradeSheetSection>
      )}
    </TradeSheetShell>
  )
}
