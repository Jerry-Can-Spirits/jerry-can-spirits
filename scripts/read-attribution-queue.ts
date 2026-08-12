/**
 * Find the pages that name a source, and show the sentence that names it.
 *
 * The sweep's hardest judgement in one place. A page mentioning Jerry Thomas
 * is not the same as a page whose specification came from Jerry Thomas, and
 * only the second justifies setting recipeSource: the attribution line says
 * somebody checked this recipe against that book, so a page that merely
 * recounts who invented the drink must not carry one.
 *
 * The sentence is printed rather than a verdict because that call cannot be
 * made from a pattern. What this does is find every candidate and put the
 * evidence next to it, so the judgement is made once per page with the words
 * in view instead of from memory.
 *
 * Run:  npx sanity exec scripts/read-attribution-queue.ts --with-user-token
 *       ...add -- --authority=savoy to narrow, -- --set to list only pages
 *       that already carry a recipeSource.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const ONLY = process.argv.find((a) => a.startsWith('--authority='))?.split('=')[1]
const SET_ONLY = process.argv.includes('--set')

/**
 * The names worth finding, mapped to the authority value they would imply.
 *
 * Craddock and the Savoy are the same citation from two directions — he wrote
 * it — so both point at `savoy` and a page naming either is one candidate
 * rather than two.
 */
const NAMES: Array<[RegExp, string]> = [
  [/\bJerry Thomas\b|\bBar-?Tender's Guide\b/i, 'thomas'],
  [/\bSavoy\b|\bCraddock\b/i, 'savoy'],
  [/\bEmbury\b|\bFine Art of Mixing Drinks\b/i, 'embury'],
  [/\bIBA\b|\bInternational Bartenders Association\b/i, 'iba'],
  [/\bDifford'?s?\b/i, 'diffords'],
  [/\bPDT\b|\bPlease Don't Tell\b/i, 'pdt'],
  [/\bDeath & Co\b|\bDeath and Co\b/i, 'death-and-co'],
  [/\bGary Regan\b|\bJoy of Mixology\b/i, 'regan'],
  [/\bWaldorf\b|\bCrockett\b/i, 'waldorf'],
]

/**
 * Phrases that turn a mention into a claim about the specification.
 *
 * Advisory only, and printed as a flag rather than acted on. "The Savoy calls
 * for two dashes" is a claim about the recipe; "Craddock included it in 1930"
 * is a claim about history. The difference decides whether a source line is
 * honest, and it is a reading rather than a match.
 */
const SPEC_CLAIM =
  /\b(?:calls for|specifies|specified|prints?|printed|gives?|lists?|as written|the (?:recipe|spec|specification|proportions|measures)|follow(?:s|ing)?|per the|according to)\b/i

interface Doc {
  _id: string
  name: string
  description: string | null
  note: string | null
  faqs: Array<{ answer?: string }> | null
  longDescription: Array<{ _type: string; children?: Array<{ text?: string }> }> | null
  recipeSource: { authority?: string; note?: string } | null
  sourceCheckedAt: string | null
}

const sentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

function passages(doc: Doc): Array<{ where: string; text: string }> {
  const out: Array<{ where: string; text: string }> = []
  if (doc.description) out.push({ where: 'description', text: doc.description })
  if (doc.note) out.push({ where: 'tip', text: doc.note })
  for (const faq of doc.faqs ?? []) if (faq.answer) out.push({ where: 'faq', text: faq.answer })
  const body = (doc.longDescription ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')
  if (body) out.push({ where: 'long', text: body })
  return out
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && defined(slug.current) && !(_id in path("drafts.**"))]{
      _id, name, description, note, faqs, longDescription, recipeSource, sourceCheckedAt
    } | order(name asc)`
  )

  const rows = docs
    .map((doc) => {
      const hits: Array<{ authority: string; where: string; sentence: string; specClaim: boolean }> = []
      for (const passage of passages(doc)) {
        for (const sentence of sentences(passage.text)) {
          for (const [pattern, authority] of NAMES) {
            if (!pattern.test(sentence)) continue
            if (hits.some((h) => h.authority === authority)) continue
            hits.push({ authority, where: passage.where, sentence, specClaim: SPEC_CLAIM.test(sentence) })
          }
        }
      }
      return { doc, hits }
    })
    .filter((r) => r.hits.length)
    .filter((r) => !ONLY || r.hits.some((h) => h.authority === ONLY))
    .filter((r) => !SET_ONLY || r.doc.recipeSource?.authority)

  const byAuthority = new Map<string, number>()
  for (const r of rows) for (const h of r.hits) byAuthority.set(h.authority, (byAuthority.get(h.authority) ?? 0) + 1)

  console.log(`${rows.length} of ${docs.length} cocktails name a source in their prose.\n`)
  for (const [authority, count] of [...byAuthority.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${authority}`)
  }
  const claims = rows.filter((r) => r.hits.some((h) => h.specClaim)).length
  console.log(`\n${claims} of them read as a claim about the specification rather than about history.\n`)

  for (const { doc, hits } of rows) {
    const carried = doc.recipeSource?.authority
      ? `  [recipeSource already: ${doc.recipeSource.authority}]`
      : ''
    console.log(`${doc.name}${carried}`)
    for (const h of hits) {
      console.log(`    ${h.authority}${h.specClaim ? ' *SPEC*' : ''} (${h.where}): ${h.sentence}`)
    }
    console.log()
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
