/**
 * The docs/VOICE.md hard rules, as a check the copy scripts can run.
 *
 * Written 14 August 2026, after the equipment pass shipped 399 em-dashes
 * across 72 pages. The rule against them has been in VOICE.md and CLAUDE.md
 * throughout; nothing measured it, so nothing stopped it.
 *
 * The self-reference rule was mechanised into the same dry run and caught
 * every instance before it shipped. That is the whole argument for this file:
 * a rule that lives only in a document gets broken by whoever did not read the
 * document, and a rule wired into the dry run does not.
 *
 * Two severities, because the rules differ in kind:
 *
 *   BREACH  is absolute. VOICE.md bans em-dashes, emojis, exclamation marks
 *           and a named list of hype words outright, so a match is a defect.
 *   REVIEW  is conditional. "No superlatives unless they can be proven" needs
 *           a human to judge the claim: "the only one that curls" is provable
 *           and "the most recognisable glassware ever made" is not.
 */

interface Rule {
  /** Human-readable name, printed against the match. */
  label: string
  pattern: string
}

/** Absolute. A match is a defect. */
const BREACHES: Rule[] = [
  { label: 'em-dash', pattern: String.raw`—` },
  { label: 'exclamation mark', pattern: String.raw`!` },
  // The emoji planes, plus the dingbats and misc-symbols blocks that carry
  // the ones people actually type.
  { label: 'emoji', pattern: String.raw`[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]` },
  // VOICE.md "Hard rules": the named hype list.
  { label: 'hype word', pattern: String.raw`\b(?:grab|smash|epic|amazing|incredible|game-?changer)\b` },
  // VOICE.md "Patterns that read as machine-written". The reversal formula and
  // the empty intensifiers, which are the two that survive paraphrase.
  { label: 'reversal formula', pattern: String.raw`\b(?:is|are|was|were)n['’]?t just\b|\bis not just\b` },
  {
    label: 'empty intensifier',
    pattern: String.raw`\b(?:crafted to perfection|truly exceptional|elevates?|unparalleled|meticulously|expertly)\b`,
  },
  { label: 'audience hedging', pattern: String.raw`\bwhether you['’]re\b` },
]

/** Conditional. A match needs a judgement, not an automatic rewrite. */
const REVIEWS: Rule[] = [
  {
    label: 'superlative',
    pattern:
      String.raw`\bthe (?:single )?most \w+` +
      String.raw`|\bone of the (?:most|few|oldest|best|largest|finest|greatest)\b` +
      String.raw`|\bever (?:made|built|written|invented)\b` +
      String.raw`|\bthe best\b`,
  },
]

function findAll(text: string, rules: Rule[]): string[] {
  const out: string[] = []
  for (const { label, pattern } of rules) {
    const re = new RegExp(pattern, 'giu')
    const hits = text.match(re)
    if (hits) for (const h of hits) out.push(`${label}: ${h.trim()}`)
  }
  return out
}

/** Every absolute breach of the VOICE.md hard rules, in rule order. */
export function voiceBreaches(text: string): string[] {
  return findAll(text, BREACHES)
}

/** Every phrase needing a judgement against the superlative rule. */
export function voiceReviews(text: string): string[] {
  return findAll(text, REVIEWS)
}
