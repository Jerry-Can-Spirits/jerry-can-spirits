// The structured facts on an ingredient page, shared by the Sanity schema and
// the page so the Studio's lists and the rendered wording cannot drift apart.
// Recipes take their units from abvPercent, so it is one figure, never a range.

export const LEGAL_CATEGORIES = [
  { title: 'Spirit', value: 'spirit' },
  { title: 'Spirit drink', value: 'spirit-drink' },
  { title: 'Liqueur', value: 'liqueur' },
  { title: 'Wine', value: 'wine' },
  { title: 'Fortified wine', value: 'fortified-wine' },
  { title: 'Aromatised wine', value: 'aromatised-wine' },
  { title: 'Beer', value: 'beer' },
  { title: 'Cider', value: 'cider' },
  { title: 'Non-alcoholic', value: 'non-alcoholic' },
  { title: 'Food', value: 'food' },
  { title: 'Other', value: 'other' },
] as const

export type LegalCategory = (typeof LEGAL_CATEGORIES)[number]['value']

// The 14 allergens UK food law requires to be declared, in the order the FSA
// lists them. The title is the wording the page prints.
export const ALLERGENS = [
  { title: 'celery', value: 'celery' },
  { title: 'cereals containing gluten', value: 'gluten' },
  { title: 'crustaceans', value: 'crustaceans' },
  { title: 'eggs', value: 'eggs' },
  { title: 'fish', value: 'fish' },
  { title: 'lupin', value: 'lupin' },
  { title: 'milk', value: 'milk' },
  { title: 'molluscs', value: 'molluscs' },
  { title: 'mustard', value: 'mustard' },
  { title: 'tree nuts', value: 'tree-nuts' },
  { title: 'peanuts', value: 'peanuts' },
  { title: 'sesame', value: 'sesame' },
  { title: 'soya', value: 'soya' },
  { title: 'sulphites', value: 'sulphites' },
] as const

export type Allergen = (typeof ALLERGENS)[number]['value']

/** "40% ABV", "44.7% ABV". Undefined when no figure is set. */
export function formatAbv(percent: number | null | undefined): string | undefined {
  if (typeof percent !== 'number' || Number.isNaN(percent)) return undefined
  return `${Number(percent.toFixed(1))}% ABV`
}

/** The printed name of a legal category. "Other" says nothing, so it prints nothing. */
export function legalCategoryLabel(value: string | null | undefined): string | undefined {
  if (!value || value === 'other') return undefined
  return LEGAL_CATEGORIES.find((c) => c.value === value)?.title
}

export interface AllergenFacts {
  allergens?: string[] | null
  allergensReviewed?: boolean | null
  allergenNote?: string | null
}

/**
 * The allergen line. Nothing until someone has checked the ingredient, so an
 * unchecked page never reads as allergen-free. A checked page with no entries
 * says so; one with entries lists them in the FSA order. The note (on a branded
 * product, "recipes change; check the bottle") follows either.
 */
export function allergenLine({ allergens, allergensReviewed, allergenNote }: AllergenFacts): string | undefined {
  if (!allergensReviewed) return undefined
  const present = new Set(allergens ?? [])
  const names = ALLERGENS.filter((a) => present.has(a.value)).map((a) => a.title)
  const statement = names.length > 0 ? `Contains: ${names.join(', ')}.` : 'None of the 14 listed allergens.'
  const note = allergenNote?.trim()
  if (!note) return statement
  return `${statement} ${note.charAt(0).toUpperCase()}${note.slice(1)}${/[.!?]$/.test(note) ? '' : '.'}`
}
