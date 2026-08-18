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
 * Sentences already judged acceptable go in ALLOWED below, keyed on the exact
 * sentence. A clean run therefore exits zero and means something, where before
 * it exited non-zero permanently and meant nothing.
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

/**
 * Tier-1 sentences reviewed by hand and judged not to be claims about our rum.
 *
 * WHY AN ALLOW-LIST AT ALL. Without one this sweep exits non-zero on every run,
 * because two sentences trip it permanently and legitimately. A check that is
 * always red is a check nobody reads, and that is precisely how The Old
 * Standard published "Welsh molasses foundation" for months: the sweeps that
 * would have shown it were already failing for reasons everybody had learned to
 * scroll past. A green run has to mean something.
 *
 * Keyed on the full sentence rather than on the document, deliberately. If an
 * allowed sentence is edited by so much as a word the entry stops matching and
 * the hit comes back for review, so this cannot become a blanket exemption for
 * a page. Stale entries are reported rather than ignored, so the list cannot
 * quietly rot into a set of permissions for text that no longer exists.
 *
 * Adding an entry is a founder decision, the same as the claim itself.
 */
const ALLOWED: Array<{ doc: string; why: string; sentence: string }> = [
  {
    doc: 'Storm & Spice',
    why: 'Molasses describes the Bermudian black rum of the original, explicitly contrasted with ours in the same sentence.',
    sentence:
      'Where the original relies on the molasses-heavy depth of Bermudian black rum, this version uses Jerry Can Spirits Expedition Spiced Rum, bringing vanilla, cinnamon, and clove to the party.',
  },
  {
    doc: 'Sugar Cane Juice',
    why: "The sentence is a Ti' Punch spec, so \"the rum\" is the Jamaican rum the drink calls for, not ours.",
    sentence:
      "Cane juice at the same measure lengthens it, adds a green note that meets the rum's molasses from the other direction, and keeps the whole thing drier than the ingredient list suggests.",
  },
]

const normalise = (s: string) => s.replace(/\s+/g, ' ').trim()
const allowedFor = (doc: string, sentence: string) =>
  ALLOWED.find((a) => a.doc === doc && normalise(a.sentence) === normalise(sentence))

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
  const allowed: Hit[] = []
  const general: Hit[] = []
  const seen = new Set<string>()

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
        if (!OURS.test(s)) {
          general.push(hit)
          continue
        }
        const entry = allowedFor(hit.doc, hit.sentence)
        if (entry) {
          seen.add(`${entry.doc}::${normalise(entry.sentence)}`)
          allowed.push(hit)
        } else {
          claims.push(hit)
        }
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

  console.log(`\n\n=== REVIEWED AND ALLOWED (${allowed.length}) ===`)
  if (allowed.length) {
    console.log('Judged not to be claims about our rum. Edit one and it returns to tier 1.')
    for (const h of allowed) {
      print(h)
      console.log(`  WHY: ${allowedFor(h.doc, h.sentence)?.why}`)
    }
  } else {
    console.log('\n  None.')
  }

  // An entry matching nothing means the sentence was edited or deleted. Left
  // unreported it becomes standing permission for text nobody has read.
  const stale = ALLOWED.filter((a) => !seen.has(`${a.doc}::${normalise(a.sentence)}`))
  if (stale.length) {
    console.log(`\n  !! ${stale.length} allow-list entr(y/ies) match nothing and should be removed:`)
    for (const a of stale) console.log(`     ${a.doc}: "${a.sentence.slice(0, 70)}..."`)
  }

  console.log(`\n\n=== TIER 2: BANNED WORDS ELSEWHERE (${general.length}) ===`)
  if (ALL) {
    console.log('Category facts, other producers and unrelated editorial. Pass no --all to hide.')
    general.forEach(print)
  } else {
    console.log('Hidden. Almost all are category facts or third parties (Penderyn, demerara,')
    console.log('cachaça). Pass --all to review them.')
  }

  // Stale entries fail the run too. An allow-list entry pointing at text that
  // no longer exists is permission nobody granted for whatever replaced it.
  if (claims.length || stale.length) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
