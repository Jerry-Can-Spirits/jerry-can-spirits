/**
 * Measure ingredient and equipment pages against the reference standard,
 * docs/REFERENCE_CONTENT_STANDARD.md.
 *
 * The standard is the one the cocktail pass (9 to 10 October 2026) and the
 * equipment pass (all 73 pages, 10 October) worked to: six to ten FAQs, one
 * inline comparison table, a visible updated date, metas inside the lengths
 * Google shows, and on ingredients the structured facts that recipes and the
 * allergen line read.
 *
 * Runs in two modes, because a band asserted from memory is usually wrong: the
 * first cocktail standard failed its own exemplar on three counts out of four.
 *
 *   --derive   Print the distribution across the exemplars, so the bands in
 *              scripts/reference-bands.ts come from pages that exist.
 *              Equipment: the whole corpus. Ingredient: pass the slugs of the
 *              first P5 rewrite batches with --slugs=a,b,c.
 *   (default)  Report every page that misses a rule, worst first.
 *
 * Read-only. Writes nothing.
 *
 * Run:  npx sanity exec scripts/audit-reference-standard.ts --with-user-token
 *       ...add -- --type=equipment to audit equipment rather than ingredients.
 *       ...add -- --derive (and for ingredients --slugs=...) for the distribution.
 *       ...add -- --list=20 to cap the report (0 for all).
 */
import { getCliClient } from 'sanity/cli'
import {
  bandsFor,
  FAQ_ANSWER_FLOOR,
  FAQ_COUNT,
  META_DESCRIPTION_MAX,
  META_TITLE_MAX,
} from './reference-bands'
import { selfReferences } from './self-reference'

const client = getCliClient()
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1]
const DERIVE = process.argv.includes('--derive')
const TYPE = arg('type') ?? 'ingredient'
const LIST = Number(arg('list') ?? '25')
const SLUGS = arg('slugs')?.split(',').filter(Boolean)

/**
 * Exemplars when --slugs is not given. Every equipment page was rewritten to
 * the standard on 10 October 2026, so the corpus is the exemplar. No ingredient
 * page is written to it yet: derive those from the first P5 batches by slug.
 */
const EXEMPLARS: Record<string, 'all' | string[]> = {
  equipment: 'all',
  ingredient: [],
}

/** Alcoholic categories that keep for years once opened; everything else needs a keeping time. */
const SHELF_STABLE = new Set(['spirit', 'spirit-drink', 'liqueur'])

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
  tips: number | null
  faqs: Array<{ question?: string; answer?: string }> | null
  metaTitle: string | null
  metaDescription: string | null
  updatedAt: string | null
  legalCategory: string | null
  allergens: number | null
  allergensReviewed: boolean | null
  keepsFor: string | null
  prep: boolean
}

const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

const blockText = (blocks: Block[] | null) =>
  (blocks ?? [])
    .filter((b) => b._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .join(' ')

interface Measured {
  name: string
  slug: string
  description: number
  long: number
  sections: number
  tables: number
  usage: number
  tips: number
  faqs: number
  faqAnswers: number[]
  metaTitle: number
  metaDescription: number
  doc: Doc
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
    sections: (doc.longDescription ?? []).filter((b) => b._type === 'block' && /^h\d$/.test(b.style ?? '')).length,
    tables: (doc.longDescription ?? []).filter((b) => b._type === 'comparisonTable').length,
    usage: words(doc.usage),
    tips: doc.tips ?? 0,
    faqs: faqAnswers.length,
    faqAnswers,
    metaTitle: doc.metaTitle?.trim().length ?? 0,
    metaDescription: doc.metaDescription?.trim().length ?? 0,
    doc,
    selfRefs: selfReferences(prose),
  }
}

interface Miss {
  rule: string
  text: string
}

function misses(m: Measured): Miss[] {
  const out: Miss[] = []
  const add = (rule: string, text = rule) => out.push({ rule, text })
  const bands = bandsFor(TYPE)
  const band = (label: string, n: number, [lo, hi]: readonly [number, number], unit = 'w') => {
    if (n < lo || n > hi) add(`${label} outside ${lo}-${hi}`, `${label} ${n}${unit} (${lo}-${hi})`)
  }
  band('description', m.description, bands.description)
  band('long', m.long, bands.long)
  band('sections', m.sections, bands.sections, '')
  band('usage', m.usage, bands.usage)
  band('faqs', m.faqs, FAQ_COUNT, '')
  const thin = m.faqAnswers.filter((n) => n < FAQ_ANSWER_FLOOR).length
  if (thin) add(`faq answer under ${FAQ_ANSWER_FLOOR}w`, `${thin} faq answer(s) under ${FAQ_ANSWER_FLOOR}w`)
  if (m.tables !== 1) add('not exactly one comparison table', `${m.tables} comparison tables (1)`)
  if (!m.doc.updatedAt) add('no updatedAt')
  if (!m.metaTitle) add('no metaTitle')
  else if (m.metaTitle > META_TITLE_MAX)
    add(`metaTitle over ${META_TITLE_MAX}`, `metaTitle ${m.metaTitle} chars (${META_TITLE_MAX})`)
  if (!m.metaDescription) add('no metaDescription')
  else if (m.metaDescription > META_DESCRIPTION_MAX)
    add(`metaDescription over ${META_DESCRIPTION_MAX}`, `metaDescription ${m.metaDescription} chars (${META_DESCRIPTION_MAX})`)

  if (TYPE === 'ingredient') {
    const d = m.doc
    if (!d.legalCategory) add('no legalCategory')
    if ((d.allergens ?? 0) > 0 && !d.allergensReviewed) add('allergens not reviewed')
    const perishable = d.prep || !SHELF_STABLE.has(d.legalCategory ?? '')
    if (perishable && !d.keepsFor?.trim()) add('no keepsFor')
  }

  if (m.selfRefs.length) add('self-reference', `self-ref: ${m.selfRefs.join(', ')}`)
  return out
}

const stat = (label: string, ns: number[]) => {
  if (!ns.length) return `  ${label.padEnd(16)} no data`
  const sorted = [...ns].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)]
  const p10 = sorted[Math.floor((sorted.length - 1) * 0.1)]
  const p90 = sorted[Math.floor((sorted.length - 1) * 0.9)]
  const cols = [
    `min ${String(sorted[0]).padStart(4)}`,
    `p10 ${String(p10).padStart(4)}`,
    `median ${String(median).padStart(4)}`,
    `p90 ${String(p90).padStart(4)}`,
    `max ${String(sorted[sorted.length - 1]).padStart(4)}`,
  ]
  return `  ${label.padEnd(16)} ${cols.join('   ')}`
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == $type && !(_id in path("drafts.**")) && defined(slug.current)]{
      name, "slug": slug.current, description, longDescription[]{ _type, style, children[]{ text } },
      usage, storage, "tips": count(coalesce(topTips, tips)), faqs[]{ question, answer },
      metaTitle, metaDescription, updatedAt, legalCategory, "allergens": count(allergens),
      allergensReviewed, keepsFor, "prep": defined(prep)
    } | order(name asc)`,
    { type: TYPE }
  )

  if (DERIVE) {
    const listed = SLUGS ?? EXEMPLARS[TYPE] ?? []
    const set = docs.filter((d) => listed === 'all' || listed.includes(d.slug)).map(measure)
    if (!set.length) {
      console.log(`No exemplars for "${TYPE}". Pass -- --slugs=a,b,c (the first P5 rewrite batches).`)
      return
    }
    console.log(`Distribution across ${set.length} exemplar ${TYPE} page(s).`)
    console.log('Bands in scripts/reference-bands.ts should come from these numbers.\n')
    console.log(stat('description', set.map((m) => m.description)))
    console.log(stat('long', set.map((m) => m.long)))
    console.log(stat('sections', set.map((m) => m.sections)))
    console.log(stat('tables', set.map((m) => m.tables)))
    console.log(stat('usage', set.map((m) => m.usage)))
    console.log(stat('tips', set.map((m) => m.tips)))
    console.log(stat('faqs', set.map((m) => m.faqs)))
    console.log(stat('faq answers', set.flatMap((m) => m.faqAnswers)))
    console.log(stat('meta title', set.map((m) => m.metaTitle)))
    console.log(stat('meta description', set.map((m) => m.metaDescription)))
    const selfRef = set.filter((m) => m.selfRefs.length)
    console.log(`\n  self-reference: ${selfRef.length} of ${set.length} exemplars carry any.`)
    return
  }

  const failing = docs
    .map(measure)
    .map((m) => ({ m, misses: misses(m) }))
    .filter((r) => r.misses.length)
    .sort((a, b) => b.misses.length - a.misses.length || a.m.long - b.m.long)

  console.log(`Checked ${docs.length} ${TYPE} page(s) against the reference standard.\n`)
  console.log(`${failing.length} miss at least one rule.`)
  console.log(`${docs.length - failing.length} are at standard.\n`)

  const tally = new Map<string, number>()
  for (const { misses: ms } of failing) {
    for (const { rule } of ms) tally.set(rule, (tally.get(rule) ?? 0) + 1)
  }
  for (const [rule, n] of [...tally].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${rule}`)
  if (tally.size) console.log('')

  for (const { m, misses: ms } of failing.slice(0, LIST || failing.length)) {
    console.log(`  ${m.name}  (${m.slug})`)
    console.log(`     ${ms.map((x) => x.text).join(' | ')}`)
  }
  if (LIST && failing.length > LIST) console.log(`\n  ...and ${failing.length - LIST} more. Pass -- --list=0 for all.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
