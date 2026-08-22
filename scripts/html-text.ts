/**
 * Turn a fragment of fetched HTML into readable text.
 *
 * WHY THIS IS SHARED RATHER THAN COPIED. Because it was copied, and the copy
 * carried a bug. Both scripts that read a third party's pages wrote their own
 * four-line decoder, and both chained `.replace(/&amp;/g, '&')` ahead of the
 * other entities. CodeQL flagged the IBA one on 21 August; the Fever-Tree one
 * was written the same day, after that fix, with the same fault.
 *
 * THE FAULT. Replacing `&amp;` first turns `&amp;nbsp;` into `&nbsp;`, which the
 * next replace in the chain then eats. A literal entity written on the page
 * silently becomes a space. Any chain that unescapes an ampersand before
 * anything else has this shape, which is why the replacements happen in one
 * pass here and why there is now only one of them to get wrong.
 */

export const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  // WordPress emits the ampersand in numeric form. Franklin & Sons run on it,
  // so every one of their product titles came back as "Rhubarb &#038; Hibiscus"
  // until this was added.
  '&#038;': '&',
  '&#8216;': '‘',
  '&#8220;': '“',
  '&#8221;': '”',
  '&quot;': '"',
  '&#39;': '’',
  '&apos;': '’',
  '&#8217;': '’',
  '&rsquo;': '’',
  '&#8211;': '-',
  '&ndash;': '-',
  '&#8212;': '-',
  '&mdash;': '-',
}

/**
 * Built from the keys above rather than written out again.
 *
 * It was a hand-written alternation until 22 August, when four entities were
 * added to the map and every one of them kept coming through undecoded: the
 * pattern still only matched the original eleven. Two hand-maintained copies of
 * one list, and the same failure the recipe-authority picker had that morning.
 *
 * Longest first, so `&#8217;` cannot be partly consumed by a shorter pattern
 * that happens to share a prefix.
 */
const ENTITY_RE = new RegExp(
  Object.keys(ENTITIES)
    .sort((a, b) => b.length - a.length)
    .map((e) => e.replace(/[&#;]/g, '\\$&'))
    .join('|'),
  'g'
)

/** Decode the entities we actually meet, in a single pass. */
export function decodeEntities(s: string): string {
  return s.replace(ENTITY_RE, (m) => ENTITIES[m] ?? m)
}

/** Strip tags, decode entities, collapse whitespace. */
export function htmlToText(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim()
}
