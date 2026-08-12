/**
 * The duplication detector.
 *
 * Two defect classes survived the whole copy pass because nothing was looking
 * for them. Both were found by reading, which does not scale to 348 pages:
 *
 *   - A "The Origin" section that is a verbatim copy of the description. Found
 *     on eight-plus pages. Every band passes: the words are there, they are
 *     simply the same words twice, and a reader meets the same paragraph in two
 *     places on one page.
 *   - An Expert Tip containing its own first two paragraphs a second time
 *     (Gin Sling). Same shape, inside a single field.
 *
 * Sentences rather than paragraphs, because a copy is rarely exact: a section
 * lifted from the description usually gains or loses a sentence at the join,
 * and paragraph equality misses all of those. Sentence equality after
 * normalisation catches the near-copies and locates them precisely.
 */

/** Below this, a repeat is a turn of phrase rather than a duplication. */
const MIN_WORDS = 8

/** A named piece of a page: a field, a section body, one FAQ answer. */
export interface Passage {
  where: string
  text: string
}

export interface Duplication {
  /** "description ↔ The Origin", or "Expert Tip (repeated within itself)". */
  where: string
  sentences: number
  words: number
  /** The first repeated sentence, so a finding can be judged without opening Sanity. */
  sample: string
}

/**
 * Curly and straight quotes are the same character to a reader and different
 * to a comparison, and Sanity holds both: the copy pass wrote curly to match
 * existing content while older bulk-generated copy used straight. A section
 * lifted from a description before that convention settled differs by exactly
 * those bytes and nothing else.
 */
function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’“”]/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length

/**
 * Split on sentence-ending punctuation followed by a space.
 *
 * Requiring the space keeps "7.5ml" and "22.5ml" in one piece, which matters
 * because measurements are dense in this copy. An abbreviation that does get
 * split ("St. Germain") splits identically in both copies, so a duplication is
 * still detected — just as two fragments rather than one sentence.
 */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Every passage of text appearing more than once on a page, grouped by where
 * the two copies sit.
 *
 * Grouped rather than listed one sentence at a time: a section copied wholesale
 * from the description produces a dozen findings that are all the same finding,
 * and a report of a dozen lines per page is one nobody reads.
 */
export function findDuplication(passages: Passage[]): Duplication[] {
  const seen = new Map<string, { where: string; text: string }[]>()

  for (const passage of passages) {
    for (const sentence of sentences(passage.text)) {
      const key = normalise(sentence)
      if (wordCount(key) < MIN_WORDS) continue
      const hits = seen.get(key) ?? []
      hits.push({ where: passage.where, text: sentence })
      seen.set(key, hits)
    }
  }

  const byPair = new Map<string, Duplication>()

  for (const hits of seen.values()) {
    if (hits.length < 2) continue

    // One pair key per distinct pair of locations. A sentence appearing in the
    // description, a section and an FAQ is three separate problems to fix.
    const pairs = new Set<string>()
    for (let i = 0; i < hits.length; i++) {
      for (let j = i + 1; j < hits.length; j++) {
        const a = hits[i].where
        const b = hits[j].where
        pairs.add(a === b ? `${a} (repeated within itself)` : [a, b].sort().join(' ↔ '))
      }
    }

    for (const where of pairs) {
      const found = byPair.get(where)
      if (found) {
        found.sentences++
        found.words += wordCount(normalise(hits[0].text))
      } else {
        byPair.set(where, {
          where,
          sentences: 1,
          words: wordCount(normalise(hits[0].text)),
          sample: hits[0].text,
        })
      }
    }
  }

  return [...byPair.values()].sort((a, b) => b.words - a.words)
}
