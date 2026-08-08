// Recipe provenance rules, kept out of the schema file so they can be tested
// without loading the Studio, which pulls in CSS that a node test runner
// cannot import.

export const RECIPE_AUTHORITIES = ['iba', 'diffords', 'pdt', 'death-and-co', 'savoy', 'house'] as const

export type RecipeAuthority = (typeof RECIPE_AUTHORITIES)[number]

// A house specification with no explanation is the case houseVariation exists
// to prevent. Without it the page shows a recipe that differs from every
// published version and says nothing about why, which reads as a
// transcription error rather than a decision — and a reader has no way to tell
// those apart.
export function validateHouseVariation(
  authority: string | undefined,
  variation: string | undefined
): true | string {
  if (authority === 'house' && !variation?.trim()) {
    return 'A house specification must say what is different and why.'
  }
  return true
}

/**
 * Display names, written to sit inside "Source: ...".
 *
 * Deliberately not the Studio's dropdown titles. "House specification" is right
 * in a picker and reads as jargon in a sentence, where "our own specification"
 * says the same thing to a reader.
 */
export const AUTHORITY_LABELS: Record<RecipeAuthority, string> = {
  iba: 'the IBA',
  diffords: "Difford's Guide",
  pdt: 'the PDT Cocktail Book',
  'death-and-co': 'Death & Co',
  savoy: 'The Savoy Cocktail Book',
  house: 'our own specification',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/**
 * Format a Sanity date field as British prose.
 *
 * Parsed by hand rather than through Date, because `new Date('2026-08-08')` is
 * parsed as UTC midnight and renders as the 7th anywhere west of Greenwich.
 * A date that is right in London and wrong in New York is the kind of defect
 * nobody finds from a desk in London.
 */
export function formatCheckedDate(iso: string | undefined | null): string | null {
  if (!iso) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!m) return null
  const [, year, month, day] = m
  const name = MONTHS[Number(month) - 1]
  if (!name) return null
  return `${Number(day)} ${name} ${year}`
}

/**
 * The attribution line, or null when there is nothing honest to show.
 *
 * Returns null rather than an empty string when no authority is recorded: the
 * line is hidden entirely on a page whose source has not been checked, so it
 * only ever appears where someone actually verified something. 349 cocktails
 * carry no source today, and a visible "Source: unknown" on all of them would
 * advertise the gap rather than the discipline.
 */
export function recipeSourceLine(
  authority: string | undefined | null,
  note: string | undefined | null,
  checkedAt: string | undefined | null
): string | null {
  if (!authority) return null
  const label = AUTHORITY_LABELS[authority as RecipeAuthority]
  if (!label) return null

  const trimmedNote = note?.trim()
  const checked = formatCheckedDate(checkedAt)

  return [
    `Source: ${label}${trimmedNote ? ` (${trimmedNote})` : ''}.`,
    checked ? `Last checked ${checked}.` : null,
  ]
    .filter(Boolean)
    .join(' ')
}
