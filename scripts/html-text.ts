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
 * Anything shaped like an entity. What it *means* comes from ENTITIES.
 *
 * This was a hand-written alternation until 22 August, when four entities were
 * added to the map and none of them decoded: the pattern still listed the
 * original eleven. Two hand-maintained copies of one list, and the same drift
 * that had the recipe-authority picker silently missing `berry` that morning.
 *
 * The first repair built the pattern by escaping and joining the map's keys.
 * CodeQL was right to flag it — the escape covered `&`, `#` and `;`, none of
 * which are regex metacharacters, and missed backslash, which is. A hand-rolled
 * escaper that escapes the wrong characters and omits the dangerous one is
 * worse than no escaper, and it was the third hand-rolled string routine in
 * this file's short history to be wrong.
 *
 * So there is no dynamic pattern any more. One static shape matches candidates
 * and the map decides what each one is, which cannot drift from the map, cannot
 * be mis-escaped, and leaves an entity the map does not know exactly as it was
 * written.
 */
const ENTITY_RE = /&[a-z0-9#]+;/gi

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
