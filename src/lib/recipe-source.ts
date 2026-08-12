// Recipe provenance rules, kept out of the schema file so they can be tested
// without loading the Studio, which pulls in CSS that a node test runner
// cannot import.

/**
 * Where a specification can come from.
 *
 * Extended on 8 August 2026. The first list had six entries and could not
 * record real citations found while rewriting: the Monte Carlo is preserved in
 * Embury and there was nowhere to say so, which meant a verified attribution
 * fell on the floor.
 *
 * `brand` is separate from `house` and matters. A Dark 'n' Stormy is a Gosling
 * Brothers trademark whose registered specification names Black Seal; a
 * Painkiller is a Pusser's trademark. Those are somebody else's published
 * specification, not ours, and recording them as `house` would claim authorship
 * of a drink we did not create.
 */
export const RECIPE_AUTHORITIES = [
  'iba',
  'diffords',
  'pdt',
  'death-and-co',
  'savoy',
  'thomas',
  'embury',
  'waldorf',
  'regan',
  'brand',
  'house',
] as const

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
 * A real calendar date, checked in UTC.
 *
 * `new Date('2026-02-31')` rolls forward to 3 March rather than failing, so a
 * typo in a checked-on date would be stored and then rendered as a date nobody
 * typed. Parsed in UTC for the same reason formatCheckedDate is: a local-time
 * check gives different answers either side of Greenwich.
 */
function isCalendarDate(iso: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12 || day < 1) return false
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export interface RecipeSourceInput {
  authority: string
  note?: string
  houseVariation?: string
  checkedAt?: string
}

/**
 * Every rule the Studio enforces on a provenance edit, in one call.
 *
 * The attribution sweep sets these fields from a script rather than by hand in
 * the Studio, which means the Studio's own validation never runs. Each way of
 * getting it wrong fails silently on the page rather than at the point of
 * writing: an authority outside the list renders no source line at all,
 * a house specification with no variation renders an empty "Our version" block,
 * and a variation set against any other authority renders nothing anywhere.
 * A script that writes all 348 pages should fail on the first one instead.
 */
export function validateRecipeSourceInput(input: RecipeSourceInput): true | string {
  if (!RECIPE_AUTHORITIES.includes(input.authority as RecipeAuthority)) {
    return `"${input.authority}" is not a recipe authority. One of: ${RECIPE_AUTHORITIES.join(', ')}.`
  }

  const house = validateHouseVariation(input.authority, input.houseVariation)
  if (house !== true) return house

  if (input.authority !== 'house' && input.houseVariation?.trim()) {
    return 'houseVariation renders only on a house specification. Put the edition or page in the note instead.'
  }

  if (input.note !== undefined && !input.note.trim()) {
    return 'A note that is present must say something. Leave it off instead.'
  }

  if (input.checkedAt !== undefined && !isCalendarDate(input.checkedAt)) {
    return `"${input.checkedAt}" is not a YYYY-MM-DD calendar date.`
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
  thomas: "Jerry Thomas's Bar-Tender's Guide",
  embury: "Embury's The Fine Art of Mixing Drinks",
  waldorf: 'The Old Waldorf-Astoria Bar Book',
  regan: "Gary Regan's The Joy of Mixology",
  // Deliberately vague about which brand, because the note field carries that
  // and the sentence reads badly with a company name dropped into it.
  brand: "the producer's own specification",
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
