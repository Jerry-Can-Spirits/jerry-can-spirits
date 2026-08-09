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
import { selfReferences } from './self-reference'

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
interface Ing { name?: string; amount?: string; description?: string | null; ref?: string | null }
interface RecipeSource { authority?: string; note?: string }
interface Block { _type?: string; style?: string; children?: Array<{ text?: string }> }

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
  ingredientDetail: Ing[] | null
  recipeSource: RecipeSource | null
  houseVariation: string | null
  sourceCheckedAt: string | null
}

function blockText(blocks: Block[] | null): string {
  if (!blocks) return ''
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
}

async function main() {
  // Drafts are excluded. The site client reads perspective: 'published', so a
  // draft is invisible to a visitor, and scoring one inflates the corpus with
  // a page nobody can read. Worse, the queue would eventually send a rewrite
  // to it: work written into a document the live site never fetches. Tiki Sour
  // had a stale draft from 22 July superseded by a publish on 25 July, which
  // is how this surfaced.
  const rows = await client.fetch<C[]>(`
    *[_type == "cocktail" && !(_id in path("drafts.**"))]{
      name, "slug": slug.current, description, note, instructions, flavorProfile,
      longDescription[]{ _type, style, children[]{ text } },
      faqs[]{ question, answer },
      "relatedCount": count(relatedCocktails),
      "ingredientDetail": ingredients[]{ name, amount, description, "ref": ingredientRef->name },
      recipeSource, houseVariation, sourceCheckedAt
    } | order(name asc)
  `)

  const fail = new Map<string, string[]>()
  const add = (rule: string, name: string) => {
    if (!fail.has(rule)) fail.set(rule, [])
    fail.get(rule)!.push(name)
  }

  // Counted and reported, but kept out of the compliance verdict.
  const notes = new Map<string, string[]>()
  const info = (rule: string, name: string) => {
    if (!notes.has(rule)) notes.set(rule, [])
    notes.get(rule)!.push(name)
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

    // Section 4. The Blackthorn taught this: the notes were never missing, they
    // were in the wrong register. "The hedgerow in the whiskey's chair" is a
    // filled field that answers none of section 4's questions, so a check for
    // an EMPTY field would have found nothing wrong with any of them.
    const ings = c.ingredientDetail ?? []
    const noDesc = ings.filter((i) => !i.description?.trim()).length
    if (noDesc) add(`4  ingredient notes missing`, `${c.name} (${noDesc} of ${ings.length})`)
    const thinDesc = ings.filter((i) => {
      const n = words(i.description)
      return n > 0 && n < 15
    }).length
    if (thinDesc) add(`4  ingredient notes under 15 words`, `${c.name} (${thinDesc} of ${ings.length})`)
    const noRef = ings.filter((i) => !i.ref).length
    if (noRef) add(`14 ingredient not linked to its guide`, `${c.name} (${noRef} of ${ings.length})`)

    // Attribution. Section 8 asks for honest sourcing, and these fields are
    // where it belongs rather than in the prose, which is where it used to sit
    // as "Difford's canonised the pairing".
    // Informational, not a failure. Dan's instruction is to leave the field
    // unset unless a specification was actually checked, so an absent source
    // is the rule working rather than a defect. Gating "compliant" on it made
    // every rewritten page permanently non-compliant for doing the right
    // thing. The two states below ARE defects, because both mean a field was
    // filled in and renders nothing.
    if (!c.recipeSource?.authority) info(`no recipe source recorded (not a defect)`, c.name)
    else if (c.recipeSource.authority === 'house' && !c.houseVariation?.trim()) {
      add(`8  house recipe with no houseVariation (renders nothing)`, c.name)
    }
    if (c.houseVariation?.trim() && c.recipeSource?.authority !== 'house') {
      add(`8  houseVariation set but authority is not house (never renders)`, c.name)
    }

    // Self-reference is scored across ingredient notes and FAQ questions too:
    // the Blackthorn had "chair" sitting in an ingredient note, where none of
    // the earlier sweeps were looking.
    const allProse = [prose, ...ings.map((i) => i.description ?? ''), ...faqs.map((f) => f.question ?? '')].join(' ')
    const selfRef = selfReferences(allProse).length
    if (selfRef) add(`0  SELF-REFERENCE (writes about the page, not the drink)`, `${c.name} (${selfRef})`)
  }

  console.log(`Scored ${rows.length} cocktails against docs/COCKTAIL_CONTENT_STANDARD.md\n`)

  const clean = rows.filter((c) => ![...fail.values()].some((names) => names.some((n) => n.startsWith(c.name))))
  console.log(`FULLY COMPLIANT ON THE MEASURABLE RULES: ${clean.length} of ${rows.length}\n`)

  if (notes.size) {
    console.log('=== FOR INFORMATION, NOT COUNTED AS FAILURES ===')
    for (const [rule, names] of notes) console.log(`${String(names.length).padStart(4)}  ${rule}`)
    console.log()
  }

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
