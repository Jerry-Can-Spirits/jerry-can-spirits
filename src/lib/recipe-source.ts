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
