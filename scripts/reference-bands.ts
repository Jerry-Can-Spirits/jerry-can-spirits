/**
 * The bands an ingredient or equipment page is measured against, in one place.
 *
 * Derived by `audit-reference-standard.ts --derive` on 14 August 2026 across 17
 * exemplar ingredient pages, and recorded rather than asserted. Each floor sits
 * at or below the lowest exemplar rather than at a round number: the cocktail
 * standard was first written with asserted bands its own best page failed on
 * three counts out of four, and an audit against a wrong ruler reports the
 * corpus failing when it is the ruler that is bent.
 *
 * Measured: description 35-53, long 349-422, sections 4, usage 34-51, faqs 4.
 *
 * WHY THIS IS ITS OWN MODULE. The bands used to live inside the audit, which
 * calls getCliClient() and main() at module load, so nothing could import them.
 * scripts/patch-reference-fields.ts therefore checked its drafts against a
 * hand-copied subset: it knew the long-description floor and the section count,
 * and did not know description or usage existed. Seven pages were written and
 * shipped below one of those two floors during the August 2026 reference pass,
 * every one caught by the audit afterwards instead of by the dry run before.
 *
 * Both scripts import from here so a draft is judged by the ruler that will
 * judge it once published.
 */
export const BANDS = {
  description: [35, 60],
  long: [330, 450],
  sections: [4, 5],
  usage: [30, 65],
  faqs: [4, 6],
} as const

/** Floor for a single FAQ answer. Applied per answer, not to their total. */
export const FAQ_ANSWER_FLOOR = 30
