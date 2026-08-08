/**
 * Score every cocktail against the measurable rules in
 * docs/COCKTAIL_CONTENT_STANDARD.md.
 *
 * The aim is to read all 349 pages. This does not replace that: it front-loads
 * the counting so the reading is spent on judgement. Word counts, FAQ counts
 * and descriptor counts are arithmetic and a script does them better than a
 * person. Whether a paragraph says anything is not, and no script will tell
 * you.
 *
 * Every band below is derived from Storm & Spice, the gold standard named in
 * section 0. The first version of this script used the standard's original
 * figures and reported 348 of 349 failing on FAQ length. That was the ruler
 * being wrong: the exemplar itself scored 37, 48 and 38 against a stated
 * 50-100. A band its own best example cannot meet measures nothing.
 *
 * Rules checked, with their section and the Storm & Spice figure:
 *   3   description        150-200 words          (182)
 *   5   instructions       present                 (7 steps)
 *   6   note (Expert Tip)  present, 100-160 words (150)
 *   7   flavorProfile      4-6 descriptors         (5)
 *   8   longDescription    450-650 words           (547)
 *  11   faqs               3-4 questions, answers 35-60 words (37, 48, 38)
 *  13   relatedCocktails   present
 *   1   forbidden AI phrasing anywhere in prose
 *   0   self-reference: this Manual, page, chair, shelf, slot  (zero in 900 words)
 *
 * Read-only. Writes nothing.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const VERBOSE = process.argv.includes('--verbose')

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

/** Section 7: descriptors that describe nothing. */
const VAGUE = /^(delicious|amazing|refreshing|enjoyable|perfect|tasty|lovely|great)$/i

/** Section 1: the phrasings the standard names outright. */
const FORBIDDEN: Array<{ label: string; re: RegExp }> = [
  { label: 'perfect for', re: /\bperfect for\b/i },
  { label: "whether you're", re: /\bwhether you[’']re\b/i },
  { label: 'tantalising', re: /\btantalis|\btantaliz/i },
  { label: 'indulge', re: /\bindulge/i },
  { label: 'embark', re: /\bembark/i },
  { label: 'elevate your', re: /\belevate your\b/i },
  { label: 'seasoned mixologist', re: /\bmixologist\b/i },
  { label: 'delicious', re: /\bdelicious\b/i },
  { label: 'any occasion', re: /\bany occasion\b/i },
]

interface Faq { question?: string; answer?: string }
interface Block { _type?: string; style?: string; children?: Array<{ text?: string }> }

/**
 * Section 0's largest rule, and the one Storm & Spice keeps absolutely: no
 * self-reference. Nine hundred words without one mention of this Manual, a
 * page, a chair, a shelf or a slot.
 */
const SELF_REF =
  /\b(this|the) Manual\b|\bchairs?\b|\bshel(f|ves)\b|\bits pages?\b|\bearn(s|ed|ing)? (its|the) \w+|\bone (page|shelf) (over|away)\b|\bin (this|the) Field Manual\b/gi
interface C {
  name: string
  slug: string
  description: string | null
  note: string | null
  instructions: string[] | null
  flavorProfile: string[] | null
  longDescription: Block[] | null
  faqs: Faq[] | null
  relatedCount: number
}

function blockText(blocks: Block[] | null): string {
  if (!blocks) return ''
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
}

async function main() {
  const rows = await client.fetch<C[]>(`
    *[_type == "cocktail"]{
      name, "slug": slug.current, description, note, instructions, flavorProfile,
      longDescription[]{ _type, style, children[]{ text } },
      faqs[]{ question, answer },
      "relatedCount": count(relatedCocktails)
    } | order(name asc)
  `)

  const fail = new Map<string, string[]>()
  const add = (rule: string, name: string) => {
    if (!fail.has(rule)) fail.set(rule, [])
    fail.get(rule)!.push(name)
  }

  for (const c of rows) {
    const d = words(c.description)
    if (d < 150 || d > 200) add(`3  description outside 150-200 words`, `${c.name} (${d})`)

    if (!c.instructions?.length) add(`5  instructions missing`, c.name)

    const t = words(c.note)
    if (!c.note) add(`6  Expert Tip missing`, c.name)
    else if (t < 100 || t > 160) add(`6  Expert Tip outside 100-160 words`, `${c.name} (${t})`)

    const fp = c.flavorProfile ?? []
    if (fp.length < 4 || fp.length > 6) add(`7  flavour profile not 4-6 descriptors`, `${c.name} (${fp.length})`)
    const vague = fp.filter((x) => VAGUE.test(x.trim()))
    if (vague.length) add(`7  vague flavour descriptor`, `${c.name} (${vague.join(', ')})`)

    const ld = words(blockText(c.longDescription))
    if (ld === 0) add(`8  long description missing`, c.name)
    else if (ld < 450 || ld > 650) add(`8  long description outside 450-650 words`, `${c.name} (${ld})`)

    // Section 8: five headings each doing a different job is the shape. One
    // long unheaded essay of the same length is not.
    const headings = (c.longDescription ?? []).filter((b) => /^h[23]$/.test(b.style ?? '')).length
    if (ld > 0 && headings < 3) add(`8  fewer than 3 headed sections`, `${c.name} (${headings})`)

    const faqs = c.faqs ?? []
    if (faqs.length < 3 || faqs.length > 4) add(`11 FAQ count not 3-4`, `${c.name} (${faqs.length})`)
    const badAnswers = faqs.filter((f) => {
      const a = words(f.answer)
      return a < 35 || a > 60
    }).length
    if (badAnswers) add(`11 FAQ answers outside 35-60 words`, `${c.name} (${badAnswers} of ${faqs.length})`)

    if (!c.relatedCount) add(`13 no related cocktails`, c.name)

    const prose = [c.description, c.note, blockText(c.longDescription), ...faqs.map((f) => f.answer ?? '')].join(' ')
    for (const f of FORBIDDEN) {
      if (f.re.test(prose)) add(`1  forbidden phrasing: ${f.label}`, c.name)
    }

    const selfRef = (prose.match(SELF_REF) ?? []).length
    if (selfRef) add(`0  SELF-REFERENCE (writes about the page, not the drink)`, `${c.name} (${selfRef})`)
  }

  console.log(`Scored ${rows.length} cocktails against docs/COCKTAIL_CONTENT_STANDARD.md\n`)

  const clean = rows.filter((c) => ![...fail.values()].some((names) => names.some((n) => n.startsWith(c.name))))
  console.log(`FULLY COMPLIANT ON THE MEASURABLE RULES: ${clean.length} of ${rows.length}\n`)

  console.log('=== FAILURES BY RULE ===')
  for (const [rule, names] of [...fail.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n${String(names.length).padStart(4)}  ${rule}`)
    if (VERBOSE) names.forEach((n) => console.log(`        ${n}`))
    else console.log(`        ${names.slice(0, 6).join(', ')}${names.length > 6 ? `, +${names.length - 6}` : ''}`)
  }

  // How many rules each cocktail breaks, so the reading queue can start at the
  // worst rather than at "A".
  const perDoc = new Map<string, number>()
  for (const names of fail.values()) {
    for (const n of names) {
      const base = n.replace(/ \(.*\)$/, '')
      perDoc.set(base, (perDoc.get(base) ?? 0) + 1)
    }
  }
  const worst = [...perDoc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)
  console.log(`\n\n=== WORST 30, BY NUMBER OF RULES BROKEN ===`)
  worst.forEach(([n, c]) => console.log(`  ${String(c).padStart(2)}  ${n}`))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
