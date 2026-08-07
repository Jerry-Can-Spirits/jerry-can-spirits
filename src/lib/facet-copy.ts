import { MEMBER_SHORT } from '@/lib/cocktail-facets'

/**
 * Written copy for facet pages, and the tokens that keep its numbers honest.
 *
 * A count is the strongest checkable fact a facet intro has and the fastest
 * one to rot: "seventy-four whiskey cocktails" is wrong the day someone adds a
 * recipe, and nobody would notice, because nothing in the build compares the
 * sentence to the data. So counts are never written. They are tokens the
 * template fills from the same query that renders the grid, which means the
 * prose cannot disagree with the page beneath it.
 *
 * Tokens resolve in the title tag and meta description as well as the body.
 * Accurate body copy under a stale title is the failure this is meant to
 * prevent, so the same renderer runs in generateMetadata.
 *
 * Digits, not words. A token can only emit digits, and "seventy-four cocktails,
 * 27 of them bourbon" is worse than consistent digits throughout.
 *
 *   {count}    74            the facet total
 *   {recipes}  74 recipes    total, with the noun agreeing: "1 recipe"
 *   {split}    27 bourbon, 22 rye, 14 Scotch, 8 Irish and 3 Welsh
 *
 * {split} renders the whole breakdown rather than one token per sub-type, for
 * two reasons. A sub-type that falls to zero disappears from the sentence
 * instead of rendering "0 Welsh", and the commas and the final "and" stay
 * correct however many survive. Writing one token per member would hardcode
 * which members exist, which is the thing being avoided.
 */

export interface FacetCopy {
  /** H1. Carries no count, so it never needs a token. */
  h1?: string
  /** Title tag. May contain tokens. Under 60 characters once rendered. */
  title?: string
  /** Meta description. May contain tokens. Under 155 characters once rendered. */
  description?: string
  /** Body introduction, one or more paragraphs separated by a blank line. */
  intro?: string
}

export interface CopyContext {
  count: number
  /** Sub-type breakdown, already filtered to members that hold something. */
  split?: Array<{ member: string; count: number }>
}

/** "a, b and c" — no Oxford comma, matching the rest of the site's copy. */
function joinList(parts: string[]): string {
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}

export function renderSplit(split: CopyContext['split']): string {
  if (!split?.length) return ''
  return joinList(
    split
      // A sub-type with nothing in it drops out of the sentence rather than
      // rendering "0 Welsh".
      .filter((s) => s.count > 0)
      .map((s) => `${s.count} ${MEMBER_SHORT[s.member] ?? s.member}`)
  )
}

/**
 * Replace every token in a string. Unknown tokens are left alone rather than
 * blanked, so a typo shows up as "{cont}" on the page instead of vanishing
 * into a sentence that still reads plausibly.
 */
export function renderCopy(template: string, ctx: CopyContext): string {
  return template
    .replace(/\{count\}/g, String(ctx.count))
    .replace(/\{recipes\}/g, `${ctx.count} ${ctx.count === 1 ? 'recipe' : 'recipes'}`)
    .replace(/\{split\}/g, renderSplit(ctx.split))
}

/**
 * Approved copy, keyed by "kind:value".
 *
 * Empty until copy is approved. A facet with no entry renders its heading and
 * grid and no introduction, which is the correct behaviour: the template has
 * never generated filler and must not start.
 */
export const FACET_COPY: Record<string, FacetCopy> = {}

export function copyFor(kind: string, value: string): FacetCopy | undefined {
  return FACET_COPY[`${kind}:${value}`]
}
