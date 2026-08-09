/**
 * The self-reference detector, shared by every script in the copy pass.
 *
 * Section 0 of docs/COCKTAIL_CONTENT_STANDARD.md: write about the drink, never
 * about the page. This is the measurement behind that rule, and it orders the
 * rewriting queue, so a false positive costs a good page a rewrite it does not
 * need.
 *
 * It lived in four scripts as four copies until 9 August 2026, when the shelf
 * rule below changed and three of them would have kept the old behaviour.
 */

/**
 * "shelf" is two different words. "The agave shelf's best group serve" points
 * at one of our own category pages and is the second register at its most
 * obvious. "The richest, darkest rum on the shelf" points at a bar, and is how
 * anyone would write it.
 *
 * MEASURED 9 August 2026 across 349 cocktails: 123 uses of shelf/shelves, of
 * which 39 were literal. 25 pages scored on nothing else, and several of those
 * (Fog Cutter, Corn n' Oil, Between the Sheets) were already written to the
 * standard. Banning the word outright would have sent them to the front of the
 * queue ahead of pages that genuinely needed the work.
 *
 * So the pattern requires the possessive or appositive shape a category name
 * takes ("the whiskey shelf", "the two less-travelled shelves", "one shelf
 * over") and ignores the prepositional shape a real shelf takes ("on the
 * shelf", "from shelf to glass", "shelf-stable").
 */
const FIGURATIVE_SHELF =
  String.raw`\bone\s+(?:[\w'’-]+\s+){0,2}shel(?:f|ves)\s+(?:over|along|away)\b` +
  String.raw`|\b(?:the|this|our|its)\s+[\w'’-]+(?:\s+[\w'’-]+)?\s+shel(?:f|ves)\b`

const PATTERNS = [
  String.raw`\b(?:this|the) Manual\b`,
  String.raw`\bchairs?\b`,
  FIGURATIVE_SHELF,
  String.raw`\bits pages?\b`,
  String.raw`\bearn(?:s|ed|ing)? (?:its|the) \w+`,
  String.raw`\bone page (?:over|away)\b`,
  // "in the Field Manual" was the only shape caught until 9 August 2026, when
  // the Tequila Sunrise turned up publishing "the Field Manual's standing
  // argument in its brightest colours" and scoring zero. The possessive is the
  // same sentence about the page, so the name itself is the pattern; the
  // exception is a link to the section, which reads "the Field Manual" with no
  // claim attached and is how the site's own navigation refers to it.
  String.raw`\b(?:this|the|our) Field Manual['’]s\b`,
  String.raw`\bin (?:this|the) Field Manual\b`,
  // MEASURED 9 August 2026, after the possessive above cleared the queue and
  // four of the next pages read "this page keeps the cloud", "This site
  // recommends conducting the comparison", "by the doc's law". Section 0 is
  // "write about the drink, never about the page", and these are that rule's
  // most literal breach, which is exactly why nothing was looking for them.
  //
  //   this page / this site / this entry   14 + 9 + 4 hits
  //   the doc                              6 hits, all four of them meaning
  //                                        one of our ingredient documents,
  //                                        which no reader has ever seen
  //   the guide                            28 hits, concentrated on house
  //                                        recipes crediting their design to
  //                                        the guide they were written for
  //
  // "the page" without a determiner is left alone: "the moment cream
  // approaches, turn the page" is an idiom about the drink, not a reference.
  String.raw`\b(?:this|our) (?:page|site|entry)\b`,
  String.raw`\b(?:the|this|our|its) (?:new )?doc['’]?s?\b`,
  String.raw`\b(?:this|the) guide['’]?s?\b`,
]

/** Fresh instance each call: a shared /g regex carries lastIndex between uses. */
export function selfReferencePattern(): RegExp {
  return new RegExp(PATTERNS.join('|'), 'gi')
}

/** Every self-referential phrase in the text, in order. */
export function selfReferences(text: string): string[] {
  return text.match(selfReferencePattern()) ?? []
}
