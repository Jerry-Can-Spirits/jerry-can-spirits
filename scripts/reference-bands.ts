/**
 * The bands an ingredient or equipment page is measured against, in one place.
 *
 * Recorded from `audit-reference-standard.ts --derive`, never asserted: the
 * cocktail standard was first written with bands its own best page failed on
 * three counts out of four, and an audit against a wrong ruler reports the
 * corpus failing when it is the ruler that is bent.
 *
 * Equipment: derived 10 October 2026 across all 73 equipment pages, every one
 * rewritten that day to the library standard. MEASURED:
 * description 50-86 words, long 207-577, sections 3-6, tables 1, usage 25-65,
 * faqs 6-9, faq answers 31-68, meta title 40-60 chars, meta description
 * 118-155. Each floor sits at or below the lowest page and each ceiling at or
 * above the highest, so the band passes the pages it came from.
 *
 * Ingredient: PROVISIONAL. The August bands (four FAQs, no table) no longer
 * describe the standard and no ingredient page is written to the new one yet,
 * so these borrow the equipment figures. Re-derive them from the first two P5
 * rewrite batches with
 *   npx sanity exec scripts/audit-reference-standard.ts --with-user-token -- --derive --type=ingredient --slugs=<the batch slugs>
 * and record the result here and in docs/REFERENCE_CONTENT_STANDARD.md.
 *
 * WHY THIS IS ITS OWN MODULE. The audit calls getCliClient() and main() at
 * module load, so nothing can import bands from it. In August 2026
 * scripts/patch-reference-fields.ts checked drafts against a hand-copied subset
 * that missed two floors. Both scripts import from here so a draft is judged by
 * the ruler that will judge it once published.
 */
export interface Bands {
  description: readonly [number, number]
  long: readonly [number, number]
  sections: readonly [number, number]
  usage: readonly [number, number]
}

const EQUIPMENT: Bands = {
  description: [50, 90],
  long: [200, 600],
  sections: [3, 6],
  usage: [25, 70],
}

export const BANDS: Record<'equipment' | 'ingredient', Bands> = {
  equipment: EQUIPMENT,
  ingredient: EQUIPMENT,
}

export const bandsFor = (type: string): Bands => (type === 'equipment' ? BANDS.equipment : BANDS.ingredient)

/** FAQs per page. Both library briefs: six to ten. */
export const FAQ_COUNT = [6, 10] as const

/** Floor for a single FAQ answer. Applied per answer, not to their total. */
export const FAQ_ANSWER_FLOOR = 30

/** Characters. Both library briefs. */
export const META_TITLE_MAX = 60
export const META_DESCRIPTION_MAX = 155
