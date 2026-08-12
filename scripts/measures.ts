/**
 * Jigger arithmetic.
 *
 * A UK household jigger is 25ml one end and 50ml the other, with a 12.5 mark
 * inside. A recipe calling for 22.5ml — the standard conversion of three
 * quarters of a US ounce — cannot be poured with one, so the reader either
 * guesses or gives up. Three equal measures of 22.5ml are three measures of
 * 25ml with the whole drink scaled by a ninth, which is the same drink: the
 * ratios are untouched and only the finished volume moves.
 *
 * So the fix is a scale factor for the whole recipe rather than a rounding of
 * the offending line. Rounding 22.5 to 25 in isolation changes the balance
 * against everything it is measured against; scaling every ml measure by the
 * same factor changes nothing a drinker can taste.
 *
 * Short measures stay as they are. 10ml and 15ml appear throughout the corpus,
 * are poured with a spoon rather than a jigger, and are not the problem.
 *
 * An attributed recipe is exempt. Where recipeSource records that a
 * specification was checked against the IBA or the Savoy, the published
 * measures are the point, and scaling them would make the attribution false.
 */

/** Poured with a spoon rather than a jigger, and accepted as they are. */
const SPOON_MEASURES = [2.5, 5, 10, 15, 20]

/**
 * One, one and a half, and two ounces.
 *
 * Accepted rather than converted, on Dan's ruling of 12 August 2026. MEASURED
 * across 349 cocktails: 30ml appears 141 times, 60ml 129 and 45ml 108, against
 * 87 uses of 25ml and 78 of 50ml. The corpus was built from American recipes,
 * and rescaling all of it onto the 12.5 family would take a sixth out of 113
 * drinks — a 60ml Old Fashioned served as 50ml — to fix a pour a 25ml jigger
 * reads as "one and a bit" either way.
 *
 * What is left is the genuinely odd: 22ml, which is a truncation of the 22.5ml
 * that three quarters of an ounce actually converts to, plus 7.5, 35 and 40.
 */
const OUNCE_MEASURES = [30, 45, 60]

/** The mark inside a UK jigger, so every multiple of it can be poured. */
const JIGGER_STEP = 12.5

/**
 * Above this a measure is a jug quantity rather than a jigger pour: a 330ml can
 * of ginger beer and a 750ml bottle of wine are measured by the container, and
 * a punch bowl is measured by eye. Only the spirit-scale end of the recipe is
 * policed.
 */
const JIGGER_MAX = 60

const EPSILON = 1e-6
const close = (a: number, b: number) => Math.abs(a - b) < EPSILON

/** Can this be poured without the reader having to guess? */
export function isPourable(ml: number): boolean {
  if (ml <= 0) return false
  if (SPOON_MEASURES.some((v) => close(v, ml))) return true
  if (OUNCE_MEASURES.some((v) => close(v, ml))) return true
  const remainder = ml % JIGGER_STEP
  return close(remainder, 0) || close(remainder, JIGGER_STEP)
}

/**
 * The millilitre value at the front of an amount string, or null.
 *
 * Deliberately anchored to the start. "Top (approximately 90ml)" and
 * "1 (or 30ml aquafaba)" both contain a number and a unit, and neither is a
 * measure anyone pours: the first is a top-up and the second is an alternative
 * to an egg. Anchoring also drops ranges like "100-125ml" and "30 - 40ml",
 * which are already written as approximations.
 */
export function parseMl(amount: string | null | undefined): number | null {
  if (!amount) return null
  const m = /^(\d+(?:\.\d+)?)\s*ml\b/i.exec(amount.trim())
  return m ? Number(m[1]) : null
}

/** Measures in jigger range that cannot be poured with one. */
export function awkward(measures: number[]): number[] {
  return measures.filter((ml) => ml <= JIGGER_MAX && !isPourable(ml))
}

/**
 * How far the finished drink may move.
 *
 * The whole justification for scaling is that it changes nothing a drinker can
 * taste: 22.5ml to 25ml adds a ninth, which is inside the variation between two
 * people pouring the same recipe. A third more gin is not — an Aviation rescaled
 * from 45ml to 60ml is a bigger drink, and offering that as a free fix would be
 * dishonest about what the change costs. Anything needing a larger factor goes
 * to the report as a decision rather than a suggestion.
 */
const MIN_SCALE = 0.8
const MAX_SCALE = 1.25

/**
 * Scale factors that put every jigger-range measure onto a pourable value,
 * nearest to 1 first.
 *
 * Candidates are derived from the recipe rather than fixed, because the factor
 * that rescues a drink depends on what is in it: 22.5 wants a ninth added and
 * 40 wants a quarter.
 */
export function scaleOptions(measures: number[]): number[] {
  const inRange = measures.filter((ml) => ml <= JIGGER_MAX)
  if (!inRange.length) return []

  const targets: number[] = [...SPOON_MEASURES, ...OUNCE_MEASURES]
  for (let t = JIGGER_STEP; t <= JIGGER_MAX; t += JIGGER_STEP) targets.push(t)

  // Candidates are kept at full precision and deduplicated on a rounded key.
  // Rounding the factor itself puts 25/22.5 far enough off that 22.5 × k misses
  // 25 by more than the tolerance, and the one case this exists for fails.
  const candidates: number[] = []
  const seen = new Set<string>()
  for (const ml of inRange) {
    for (const target of targets) {
      const k = target / ml
      if (k < MIN_SCALE || k > MAX_SCALE) continue
      const dedupe = k.toFixed(9)
      if (seen.has(dedupe)) continue
      seen.add(dedupe)
      candidates.push(k)
    }
  }

  // Up before down, then nearest to unchanged.
  //
  // Nearest-to-unchanged alone gets this wrong, and did: four measures of 22ml
  // are marginally closer to 20 than to 25, so the Naked and Famous came back
  // shrunk to four 20ml pours. The stated rule is 22 becomes 25 — scaling up to
  // the jigger is the adaptation, and trading an awkward pour for a smaller
  // drink is not a fix a reader asked for.
  const direction = (k: number) => (k < 1 ? 1 : 0)
  return candidates
    .filter((k) => inRange.every((ml) => isPourable(ml * k)))
    .sort((a, b) => direction(a) - direction(b) || Math.abs(a - 1) - Math.abs(b - 1))
}
