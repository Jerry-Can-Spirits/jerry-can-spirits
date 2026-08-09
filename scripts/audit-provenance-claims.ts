/**
 * Sweep Sanity content for the provenance claims docs/PROVENANCE_CHECKLIST.md
 * bans about our own rum.
 *
 * WHY THIS EXISTS. The checklist's grep runs against `src public`, and every
 * surface it lists to sweep is a repo file. Field Manual content lives in
 * Sanity, so no sweep has ever covered it. On 9 August 2026 The Old Standard
 * was found publishing "the rum's Caribbean base and Welsh molasses
 * foundation" in an ingredient note: a Welsh production location and a
 * molasses claim, two banned constructions in six words, live on the site and
 * invisible to every text sweep that had been run.
 *
 * That is the same failure the checklist already documents for the label
 * photograph: the claim was outside the surface being searched. Run this
 * alongside the grep.
 *
 * Read-only. Reports the exact sentence so each hit can be judged by hand.
 *
 * Run: npx sanity exec scripts/audit-provenance-claims.ts --with-user-token
 *      ...add --all to see the informational tier as well.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const ALL = process.argv.includes('--all')

/** Banned constructions, per the checklist. */
const BANNED: Array<{ label: string; re: RegExp }> = [
  { label: 'Welsh location', re: /\bwelsh\b|\bwales\b/i },
  { label: 'molasses', re: /\bmolasses\b/i },
  { label: 'water source', re: /\b(spring|welsh|mountain|pure)\s+water\b/i },
  { label: 'distillation', re: /\bdistill(ed|ing|ery)?\b|\bpot[- ]still\b|\bcolumn still\b/i },
  { label: 'production location', re: /\b(made|produced|blended|bottled)\s+(at|in)\b|\bbritish-made\b/i },
  { label: 'former producer', re: /\bspirit of wales\b|\bsteeltown\b|\bpontyclun\b|\bnewport\b/i },
]

/**
 * A banned word is only a claim when the sentence is about our rum. "Rum is
 * distilled from molasses" is a fact about the category; "our rum's molasses
 * foundation" is a claim about work we do not do. The checklist makes exactly
 * this distinction in its known-acceptable list, so the sweep makes it too,
 * and the tiers keep the real hits from drowning in Penderyn and demerara.
 */
const OURS = /\bexpedition\b|\bjerry can\b|\bour rum\b|\bthe rum's\b|\bwe (distill|produce|make|blend)\b/i

interface Block { _type?: string; children?: Array<{ text?: string }> }
interface Doc {
  _id: string
  _type: string
  name?: string
  title?: string
  description?: string
  note?: string
  longDescription?: Block[]
  faqs?: Array<{ question?: string; answer?: string }>
  ingredients?: Array<{ name?: string; description?: string }>
}

const blockText = (b?: Block[]) =>
  (b ?? []).filter((x) => x._type === 'block').map((x) => (x.children ?? []).map((c) => c.text ?? '').join('')).join('\n')

const sentences = (text: string) => text.split(/(?<=[.!?])\s+|\n+/).filter(Boolean)

interface Hit { doc: string; type: string; field: string; labels: string[]; sentence: string }

async function main() {
  const docs = await client.fetch<Doc[]>(`
    *[_type in ["cocktail", "ingredient", "equipment", "guide"] && !(_id in path("drafts.**"))]{
      _id, _type, name, title, description, note,
      longDescription[]{ _type, children[]{ text } },
      faqs[]{ question, answer },
      ingredients[]{ name, description }
    }
  `)

  const claims: Hit[] = []
  const general: Hit[] = []

  for (const d of docs) {
    const fields: Array<[string, string]> = [
      ['description', d.description ?? ''],
      ['note', d.note ?? ''],
      ['longDescription', blockText(d.longDescription)],
      ...(d.faqs ?? []).map((f, i) => [`faq[${i}]`, `${f.question ?? ''} ${f.answer ?? ''}`] as [string, string]),
      ...(d.ingredients ?? []).map((g) => [`ingredient "${g.name}"`, g.description ?? ''] as [string, string]),
    ]

    for (const [field, text] of fields) {
      if (!text) continue
      for (const s of sentences(text)) {
        const labels = BANNED.filter((c) => c.re.test(s)).map((c) => c.label)
        if (!labels.length) continue
        const hit: Hit = { doc: d.name ?? d.title ?? d._id, type: d._type, field, labels, sentence: s.trim() }
        ;(OURS.test(s) ? claims : general).push(hit)
      }
    }
  }

  const print = (h: Hit) => {
    console.log(`\n  ${h.doc}  (${h.type})  ->  ${h.field}`)
    console.log(`  [${h.labels.join(', ')}]  ${h.sentence}`)
  }

  console.log(`Swept ${docs.length} published Sanity documents.\n`)
  console.log(`=== TIER 1: BANNED CONSTRUCTION IN A SENTENCE ABOUT OUR RUM (${claims.length}) ===`)
  console.log('Read every one. These are claims until proven otherwise.')
  claims.forEach(print)
  if (!claims.length) console.log('\n  None.')

  console.log(`\n\n=== TIER 2: BANNED WORDS ELSEWHERE (${general.length}) ===`)
  if (ALL) {
    console.log('Category facts, other producers and unrelated editorial. Pass no --all to hide.')
    general.forEach(print)
  } else {
    console.log('Hidden. Almost all are category facts or third parties (Penderyn, demerara,')
    console.log('cachaça). Pass --all to review them.')
  }

  if (claims.length) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
