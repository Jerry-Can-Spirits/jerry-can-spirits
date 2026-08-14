/**
 * Measure ingredient and equipment pages against the reference standard.
 *
 * The cocktail corpus has scripts/audit-cocktail-standard.ts and a written
 * specification to check against. The 297 ingredient and 72 equipment pages
 * have neither, which is why nobody noticed that 275 of them carry a long
 * description under the length the cocktail pages hold.
 *
 * Runs in two modes, because the lesson from COCKTAIL_CONTENT_STANDARD.md is
 * that a band asserted from memory is usually wrong — the first cocktail
 * standard failed its own exemplar on three counts out of four:
 *
 *   --derive   Print the distribution across a named set of exemplar slugs, so
 *              the bands in the written standard come from pages that exist.
 *   (default)  Report every page that misses a band, worst first.
 *
 * Run:  npx sanity exec scripts/audit-reference-standard.ts --with-user-token
 *       ...add -- --derive to print the exemplar distribution instead.
 *       ...add -- --type=equipment to audit equipment rather than ingredients.
 *       ...add -- --list=20 to cap the report.
 */
import { getCliClient } from 'sanity/cli'
import { selfReferences } from './self-reference'

const client = getCliClient()
const DERIVE = process.argv.includes('--derive')
const TYPE = process.argv.find((a) => a.startsWith('--type='))?.split('=')[1] ?? 'ingredient'
const LIST = Number(process.argv.find((a) => a.startsWith('--list='))?.split('=')[1] ?? '25')

/**
 * Pages written to the current standard, used to derive the bands.
 *
 * All were written on 13 and 14 August 2026 against the cocktail standard's
 * register. They are the exemplars in the sense section 0 of that document
 * means: where a band here and these pages disagree, the pages win.
 */
const EXEMPLARS: Record<string, string[]> = {
  ingredient: [
    'cynar',
    'frangelico',
    'grappa',
    'chamomile-cordial',
    'tabasco',
    'donns-mix',
    'jamaican-rum',
    'demerara-rum',
    'gold-rum',
    'pernod',
    'palo-cortado',
    'cuban-aguardiente',
    'sugar-cane-juice',
    'grapefruit-soda',
    'kina-lillet',
    'cocchi-americano',
    'lagavulin-16',
  ],
  equipment: [],
}

interface Block {
  _type: string
  style?: string
  children?: Array<{ text?: string }>
}

interface Doc {
  name: string
  slug: string
  description: string | null
  longDescription: Block[] | null
  usage: string | null
  storage: string | null
  topTips: string[] | null
  tips: string[] | null
  faqs: Array<{ question?: string; answer?: string }> | null
}

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

const blockText = (blocks: Block[] | null) =>
  (blocks ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')

const headings = (blocks: Block[] | null) =>
  (blocks ?? []).filter((b) => b._type === 'block' && /^h\d$/.test(b.style ?? '')).length

interface Measured {
  name: string
  slug: string
  description: number
  long: number
  sections: number
  usage: number
  tips: number
  storage: number
  faqs: number
  shortFaqs: number
  selfRefs: string[]
}

function measure(doc: Doc): Measured {
  const faqAnswers = (doc.faqs ?? []).map((f) => words(f.answer))
  const prose = [
    doc.description,
    doc.usage,
    doc.storage,
    blockText(doc.longDescription),
    ...(doc.faqs ?? []).flatMap((f) => [f.question, f.answer]),
  ]
    .filter(Boolean)
    .join('\n\n')

  return {
    name: doc.name,
    slug: doc.slug,
    description: words(doc.description),
    long: words(blockText(doc.longDescription)),
    sections: headings(doc.longDescription),
    usage: words(doc.usage),
    tips: (doc.topTips ?? doc.tips ?? []).length,
    storage: words(doc.storage),
    faqs: faqAnswers.length,
    shortFaqs: faqAnswers.filter((n) => n < 30).length,
    selfRefs: selfReferences(prose),
  }
}

const stat = (label: string, ns: number[]) => {
  if (!ns.length) return `  ${label.padEnd(14)} no data`
  const sorted = [...ns].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const mean = Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)
  return `  ${label.padEnd(14)} min ${String(sorted[0]).padStart(4)}   median ${String(median).padStart(4)}   mean ${String(mean).padStart(4)}   max ${String(sorted[sorted.length - 1]).padStart(4)}`
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == $type && !(_id in path("drafts.**")) && defined(slug.current)]{
      name, "slug": slug.current, description, longDescription, usage, storage, topTips, tips,
      faqs[]{ question, answer }
    } | order(name asc)`,
    { type: TYPE }
  )

  const exemplarSlugs = new Set(EXEMPLARS[TYPE] ?? [])

  if (DERIVE) {
    const set = docs.filter((d) => exemplarSlugs.has(d.slug)).map(measure)
    if (!set.length) {
      console.log(`No exemplars listed for "${TYPE}". Add slugs to EXEMPLARS first.`)
      return
    }
    console.log(`Distribution across ${set.length} exemplar ${TYPE} page(s).`)
    console.log('Bands in the written standard should come from these numbers.\n')
    console.log(stat('description', set.map((m) => m.description)))
    console.log(stat('long', set.map((m) => m.long)))
    console.log(stat('sections', set.map((m) => m.sections)))
    console.log(stat('usage', set.map((m) => m.usage)))
    console.log(stat('storage', set.map((m) => m.storage)))
    console.log(stat('top tips', set.map((m) => m.tips)))
    console.log(stat('faqs', set.map((m) => m.faqs)))
    const selfRef = set.filter((m) => m.selfRefs.length)
    console.log(`\n  self-reference: ${selfRef.length} of ${set.length} exemplars carry any.`)
    return
  }

  // Bands, derived by --derive on 14 August 2026 across 17 exemplar ingredient
  // pages and recorded here so the audit and the written standard cannot drift
  // apart. Each floor sits at or below the lowest exemplar rather than at a
  // round number: the cocktail standard was first written with asserted bands
  // its own best page failed on three counts out of four, and an audit against
  // a wrong ruler reports the corpus failing when it is the ruler that is bent.
  //
  // Measured: description 35-53, long 349-422, sections 4, usage 34-51, faqs 4.
  const BANDS = {
    description: [35, 60] as const,
    long: [330, 450] as const,
    sections: [4, 5] as const,
    usage: [30, 65] as const,
    faqs: [4, 6] as const,
  }

  const measured = docs.map(measure)
  const failing = measured
    .map((m) => {
      const misses: string[] = []
      if (m.description < BANDS.description[0]) misses.push(`description ${m.description}w`)
      if (m.long < BANDS.long[0]) misses.push(`long ${m.long}w`)
      if (m.sections < BANDS.sections[0]) misses.push(`${m.sections} sections`)
      if (m.usage < BANDS.usage[0]) misses.push(`usage ${m.usage}w`)
      if (m.faqs < BANDS.faqs[0]) misses.push(`${m.faqs} faqs`)
      if (m.shortFaqs) misses.push(`${m.shortFaqs} thin faq answer(s)`)
      if (m.selfRefs.length) misses.push(`self-ref: ${m.selfRefs.join(', ')}`)
      return { m, misses }
    })
    .filter((r) => r.misses.length)
    .sort((a, b) => b.misses.length - a.misses.length || a.m.long - b.m.long)

  console.log(`Checked ${docs.length} ${TYPE} page(s) against the reference standard.\n`)
  console.log(`${failing.length} miss at least one band.`)
  console.log(`${docs.length - failing.length} are at standard.\n`)

  const atStandard = measured.filter((m) => exemplarSlugs.has(m.slug))
  if (atStandard.length) {
    console.log(`(${atStandard.length} exemplar page(s) excluded from the worst-first ordering below.)\n`)
  }

  for (const { m, misses } of failing.slice(0, LIST || failing.length)) {
    console.log(`  ${m.name}  (${m.slug})`)
    console.log(`     ${misses.join(' | ')}`)
  }
  if (failing.length > LIST) console.log(`\n  ...and ${failing.length - LIST} more. Pass -- --list=0 for all.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
