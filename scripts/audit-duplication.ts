/**
 * Find text that appears twice on the same cocktail page.
 *
 * The standard audit scores every band and cannot see this: a "The Origin"
 * section that copies the description word for word passes every rule, because
 * the words are all present and correctly counted. It is only wrong to a reader,
 * who meets the same paragraph twice on one page.
 *
 * Run:  npx sanity exec scripts/audit-duplication.ts --with-user-token
 *       ...add -- --list=20 to cap the report.
 */
import { getCliClient } from 'sanity/cli'
import { findDuplication, type Duplication, type Passage } from './duplication'

const client = getCliClient()
const LIST = Number(process.argv.find((a) => a.startsWith('--list='))?.split('=')[1] ?? '30')

interface Span { text?: string }
interface Block { _type: string; style?: string; children?: Span[] }
interface Doc {
  name: string
  description: string | null
  note: string | null
  longDescription: Block[] | null
  faqs: Array<{ question?: string; answer?: string }> | null
  ingredients: Array<{ name?: string; description?: string }> | null
}

const text = (b: Block) => (b.children ?? []).map((c) => c.text ?? '').join('')

/**
 * A page as named pieces, so a finding says where both copies live.
 *
 * Section bodies are keyed by their heading rather than their index: "The
 * Origin ↔ description" names the defect, "block 3 ↔ description" sends someone
 * counting.
 */
function passages(doc: Doc): Passage[] {
  const out: Passage[] = []
  if (doc.description) out.push({ where: 'description', text: doc.description })
  if (doc.note) out.push({ where: 'Expert Tip', text: doc.note })

  let heading = '(before any heading)'
  let body: string[] = []
  const flush = () => {
    if (body.length) out.push({ where: heading, text: body.join('\n\n') })
    body = []
  }
  for (const block of doc.longDescription ?? []) {
    if (block._type !== 'block') continue
    if (/^h[23]$/.test(block.style ?? '')) {
      flush()
      heading = text(block) || '(untitled section)'
    } else {
      body.push(text(block))
    }
  }
  flush()

  for (const faq of doc.faqs ?? []) {
    if (faq.answer) out.push({ where: `FAQ "${faq.question ?? '?'}"`, text: faq.answer })
  }
  for (const ing of doc.ingredients ?? []) {
    if (ing.description) out.push({ where: `ingredient "${ing.name ?? '?'}"`, text: ing.description })
  }
  return out
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && defined(slug.current)]{
      name, description, note, longDescription, faqs, ingredients
    } | order(name asc)`
  )

  const found = docs
    .map((doc) => ({ name: doc.name, findings: findDuplication(passages(doc)) }))
    .filter((r) => r.findings.length)
    .map((r) => ({ ...r, words: r.findings.reduce((n, f) => n + f.words, 0) }))
    .sort((a, b) => b.words - a.words)

  const duplicatedWords = found.reduce((n, r) => n + r.words, 0)
  console.log(`Checked ${docs.length} cocktails for text repeated on the same page.\n`)
  console.log(`${found.length} carry duplication, ${duplicatedWords} words in total.\n`)

  const shown: typeof found = LIST > 0 ? found.slice(0, LIST) : found
  for (const page of shown) {
    console.log(`${page.name}  (${page.words} words)`)
    for (const f of page.findings) console.log(`    ${line(f)}`)
    console.log()
  }
  if (found.length > shown.length) {
    console.log(`...and ${found.length - shown.length} more. Pass -- --list=0 for no cap.`)
  }
}

const line = (f: Duplication) =>
  `${f.where}: ${f.sentences} sentence${f.sentences === 1 ? '' : 's'}, ${f.words}w — "${f.sample.slice(0, 90)}${f.sample.length > 90 ? '…' : ''}"`

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
