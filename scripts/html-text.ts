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

const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
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

const ENTITY_RE = /&(?:nbsp|amp|quot|apos|rsquo|ndash|mdash|#39|#8217|#8211|#8212);/g

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
