/**
 * Find prose that states a measure the recipe contradicts.
 *
 * The companion to scripts/audit-prose-mismatch.ts, which asks whether the
 * right ingredients are named. This asks whether the right numbers are.
 *
 * It is the more dangerous of the two classes, because a reader cannot catch
 * it. An ingredient named in the prose and absent from the list is visible on
 * the page; a tip saying fifteen millilitres above a recipe line reading 7.5ml
 * looks entirely normal until someone pours it. The Bijou carried 110 botanicals
 * against 130 elsewhere on the same page for exactly this reason.
 *
 * THE MATCHING RULE, and why it is not "any number not in the recipe".
 *
 * Prose legitimately names measures the recipe does not use: "push it to
 * twenty-five and the drink turns into dessert" is advice about what NOT to
 * pour. Flagging every unmatched number would bury the real defects.
 *
 * So a measure is only compared when the sentence binds it to an ingredient
 * directly, as "<measure> of <ingredient>". Anything looser flags the wrong
 * line: "cognac brings weight under sixty millilitres of orange juice" names
 * cognac and states 60ml, and the 60ml is the juice's. A first version of this
 * check reported 47 contradictions on that rule and most were that shape.
 *
 * Prose names ingredients more briefly than a recipe line does, so each line
 * carries aliases: "Fresh Lemon Juice" is also "lemon juice", "fresh lemon"
 * and "lemon". Without them the binding misses every shortened mention, which
 * is most of them.
 *
 * Hypothetical and comparative sentences are then suppressed outright: "push",
 * "cut to", "instead", "would", "some bars". Those are the shape of advice, and
 * advice naming a different number is the point of it.
 *
 * Word numbers are read as well as digits, because the house style writes
 * measures out in prose ("fifteen millilitres") and in digits in the recipe
 * ("15ml"). A check that only read digits would miss most of the corpus.
 *
 * Read-only. Writes nothing.
 *
 * Run:  npx sanity exec scripts/audit-measure-contradictions.ts --with-user-token
 *       ...add -- --slug=bijou to inspect one page.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const ONLY = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]

/**
 * The measure vocabulary the corpus actually writes out.
 *
 * Not a general number parser. Measures in this Field Manual come from a short
 * list of jigger and spoon values, and a parser that understood "three hundred
 * and seventeen" would add surface area without finding anything.
 */
const WORD_NUMBERS: Record<string, number> = {
  half: 0.5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  'twenty-two': 22,
  'twenty-five': 25,
  thirty: 30,
  'thirty-five': 35,
  forty: 40,
  'forty-five': 45,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  'seventy-five': 75,
  eighty: 80,
  ninety: 90,
}

/** "seven and a half" and "twenty-two and a half" are both real measures here. */
const AND_A_HALF = /\s+and\s+a\s+half\b/

/**
 * A sentence that is reasoning about a measure rather than stating this
 * drink's. Advice naming a different number is the whole point of advice.
 */
const HYPOTHETICAL =
  /\b(push(?:ed|ing)?|cut(?:ting)?|drop(?:ping|ped)?|raise|lower|instead|rather than|would|could|if you|some bars|most bars|plenty of|others?|traditional(?:ly)?|original(?:ly)?|period|older|modern|up to|down to|as much as|no more than|at least|double|halve|twice|per person|each|variation|variant|scale|batch|at say|house move|the parent|splitting)\b/i

/**
 * Scaling a recipe up or down. The numbers are real and deliberately not the
 * recipe's, because the sentence is arithmetic rather than specification.
 * "For ten drinks, combine 600ml of rum" is correct on a page pouring 60ml.
 */
const SCALING = /\bfor\s+(?:\w+|\d+)\s+(?:drinks?|servings?|people|guests)\b|\bper\s+(?:drink|serve|serving)\b/i

interface Line {
  name?: string
  amount?: string
}
interface Doc {
  name: string
  slug: string
  description: string | null
  note: string | null
  longDescription: unknown
  faqs: Array<{ question?: string; answer?: string }> | null
  ingredients: Line[] | null
}

interface Block {
  _type?: string
  style?: string
  children?: Array<{ text?: string }>
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()

/** Millilitres at the front of an amount string, or null. Mirrors measures.ts. */
function amountMl(amount: string | null | undefined): number | null {
  if (!amount) return null
  const m = /^(\d+(?:\.\d+)?)\s*ml\b/i.exec(amount.trim())
  return m ? Number(m[1]) : null
}

/** Dashes at the front of an amount string, for the bitters lines. */
function amountDashes(amount: string | null | undefined): number | null {
  if (!amount) return null
  const m = /^(\d+)\s*dash/i.exec(amount.trim())
  return m ? Number(m[1]) : null
}

/**
 * Measures bound to what follows them: "<number> <unit> of <thing>".
 *
 * The trailing text is captured raw and matched against the recipe's aliases by
 * the caller. Binding is the whole point: an unbound number in a sentence that
 * happens to name an ingredient belongs to something else more often than not.
 */
interface Bound {
  value: number
  unit: 'ml' | 'dash'
  of: string
}

const WORDS = Object.keys(WORD_NUMBERS).join('|')

function boundMeasures(sentence: string): Bound[] {
  const out: Bound[] = []
  const tail = '\\s+of\\s+(?:the\\s+)?([a-z\'’\\- ]{3,40})'

  for (const m of sentence.matchAll(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:ml|millilitres?)${tail}`, 'gi')
  )) {
    out.push({ value: Number(m[1]), unit: 'ml', of: m[2] })
  }
  for (const m of sentence.matchAll(
    new RegExp(`\\b(${WORDS})((?:\\s+and\\s+a\\s+half)?)\\s+millilitres?${tail}`, 'gi')
  )) {
    const base = WORD_NUMBERS[m[1].toLowerCase()]
    if (base === undefined) continue
    out.push({ value: AND_A_HALF.test(m[2]) ? base + 0.5 : base, unit: 'ml', of: m[3] })
  }
  for (const m of sentence.matchAll(
    new RegExp(`\\b(?:(\\d+)|(${WORDS}))\\s+dash(?:es)?${tail}`, 'gi')
  )) {
    out.push({
      value: m[1] ? Number(m[1]) : WORD_NUMBERS[m[2].toLowerCase()],
      unit: 'dash',
      of: m[3],
    })
  }
  return out
}

/**
 * The names prose might use for a recipe line.
 *
 * "Fresh Lemon Juice" is written as "lemon juice" and as "lemon". Without the
 * shorter forms the binding matches almost nothing, because a recipe line is
 * the formal name and prose never uses it.
 */
function aliasesFor(name: string): string[] {
  const full = norm(name)
  const set = new Set<string>([full])
  const withoutFresh = full.replace(/^fresh\s+/, '')
  set.add(withoutFresh)
  for (const base of [full, withoutFresh]) {
    const head = base.replace(/\s+(juice|syrup|liqueur|bitters|cordial|puree|purée)$/, '')
    if (head.length >= 3) set.add(head)
  }
  return [...set]
}

function blocks(value: unknown): string[] {
  return ((value as Block[] | null) ?? [])
    .filter((b) => b?._type === 'block' && !/^h[1-6]$/.test(b.style ?? ''))
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .filter((t) => t.trim())
}

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim())
}

async function main() {
  const filter = ONLY ? `&& slug.current == "${ONLY}"` : ''
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && defined(slug.current) ${filter}]{
      name, "slug": slug.current, description, note, longDescription, faqs,
      ingredients[]{ name, amount }
    } | order(name asc)`
  )

  // Every cocktail name, so a sentence comparing this drink to another can be
  // left alone. "Remember the Maine threads fifteen millilitres of cherry
  // through a Manhattan; the Hunter pours thirty" states two measures and only
  // one of them is this page's.
  const allNames = await client.fetch<string[]>(
    `*[_type == "cocktail" && defined(name)].name`
  )

  let flagged = 0
  let pages = 0

  for (const doc of docs) {
    // The recipe as ingredient name -> what it actually pours.
    const ml = new Map<string, number>()
    const dashes = new Map<string, number>()
    for (const line of doc.ingredients ?? []) {
      const key = norm(line.name ?? '')
      if (!key) continue
      const asMl = amountMl(line.amount)
      if (asMl !== null) ml.set(key, asMl)
      const asDash = amountDashes(line.amount)
      if (asDash !== null) dashes.set(key, asDash)
    }
    if (!ml.size && !dashes.size) continue

    const passages = [
      ...(doc.description ? [['description', doc.description] as const] : []),
      ...(doc.note ? [['expert tip', doc.note] as const] : []),
      ...blocks(doc.longDescription).map((t) => ['long description', t] as const),
      ...(doc.faqs ?? []).map((f) => [`FAQ "${f.question}"`, f.answer ?? ''] as const),
    ]

    // Longest alias first, so "lemon juice" wins over "lemon" and the binding
    // resolves to the line the prose actually meant.
    const alias: Array<{ text: string; key: string }> = []
    for (const key of new Set([...ml.keys(), ...dashes.keys()])) {
      for (const a of aliasesFor(key)) alias.push({ text: a, key })
    }
    alias.sort((a, b) => b.text.length - a.text.length)

    // Other cocktails by name, longest first so "Vodka Martini" is tested
    // before "Martini". A drink never counts as a mention of itself.
    const others = allNames
      .filter((n) => n !== doc.name && norm(n).length >= 5)
      .map(norm)
      .sort((a, b) => b.length - a.length)

    const findings: string[] = []
    for (const [where, text] of passages) {
      for (const sentence of sentences(text)) {
        if (HYPOTHETICAL.test(sentence) || SCALING.test(sentence)) continue
        const lower = norm(sentence)
        if (others.some((n) => lower.includes(n))) continue

        for (const bound of boundMeasures(sentence)) {
          const of = norm(bound.of)
          const hit = alias.find((a) => of === a.text || of.startsWith(`${a.text} `))
          if (!hit) continue

          if (bound.unit === 'ml' && ml.has(hit.key) && bound.value !== ml.get(hit.key)) {
            findings.push(
              `   [${where}] says ${bound.value}ml of "${hit.key}", recipe pours ${ml.get(hit.key)}ml\n      ${sentence.trim()}`
            )
          }
          if (bound.unit === 'dash' && dashes.has(hit.key) && bound.value !== dashes.get(hit.key)) {
            findings.push(
              `   [${where}] says ${bound.value} dash(es) of "${hit.key}", recipe pours ${dashes.get(hit.key)}\n      ${sentence.trim()}`
            )
          }
        }
      }
    }

    if (!findings.length) continue
    pages++
    flagged += findings.length
    console.log(`\n${doc.name}  (${doc.slug})`)
    for (const f of findings) console.log(f)
  }

  console.log(`\n${pages} of ${docs.length} pages, ${flagged} contradiction(s).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
