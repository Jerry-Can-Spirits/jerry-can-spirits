/**
 * Ingredient pages for a producer's mixer range.
 *
 * WHY IT EXISTS. The Franklin & Sons serves reference twelve products that have
 * no page here, and a cocktail cannot link an ingredient that does not exist.
 * Fever-Tree's pages were already built, so this gap only appeared with the
 * second producer — and there will be a third. scripts/create-brand-ingredients.ts
 * is the nearest existing tool and is spirit-shaped, one-shot, and hard-codes
 * its three brands; mixers carry a different field set entirely.
 *
 * THE GUARD THAT MATTERS MOST HERE IS THE BOILERPLATE ONE. Producer copy is
 * where the facts come from — cinchona bark named on the label rather than
 * buried in a flavouring, Yorkshire rhubarb, yuzu juice rather than yuzu
 * flavouring — but the phrasing is marketing. Franklin publish "crafted with
 * the finest natural ingredients" and "the perfect mixer for any spirit or
 * cocktail" almost verbatim across the whole range. Lifting those would put
 * another company's advertising in our voice, break docs/VOICE.md, and produce
 * twelve pages that read identically. So the strings are refused outright.
 *
 * Read the facts, write the sentence.
 *
 * WHAT ELSE IT REFUSES. The same discipline as scripts/create-brand-serves.ts:
 * it will not overwrite an existing slug, will not accept a parent or related
 * ingredient that does not resolve, will not accept prose that names the page
 * it sits on, and holds every text field to the length its exemplar actually
 * runs to rather than to a guess.
 *
 * NUMBERS COME OFF LABELS, NOT OUT OF REGEXES. The existing Franklin tonic page
 * cites 7.9 grams of sugar per 100ml. That is real and it came from the bottle.
 * scripts/fetch-franklin-serves.ts deliberately does not read nutrition panels,
 * so nothing here invents an equivalent. A comparison the producer states
 * themselves — Light Tonic being the Indian recipe with less sugar — is fair
 * game; a figure nobody measured is not.
 *
 * Run: npx sanity exec scripts/create-mixer-ingredients.ts --with-user-token
 *      ...add --write to actually create. Without it, nothing is written.
 */
import { getCliClient } from 'sanity/cli'
import { createHash } from 'crypto'
import { MIXERS } from './mixer-ingredients-payload'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/**
 * Producer marketing that must not survive into our prose.
 *
 * Every phrase here appears verbatim on franklinandsons.co.uk across most of
 * the range. They are the reason twelve products can have twelve descriptions
 * that say nothing distinguishing about any of them.
 */
const BOILERPLATE = [
  /finest natural ingredients/i,
  /perfect mixer for any spirit/i,
  /highest quality ingredients/i,
  /expertly (?:blended|balanced|crafted)/i,
  /world[- ]class spirit/i,
  /harmoniously blended/i,
  /perfect adult soft drink/i,
]

const SELF_REFERENCE =
  /\b(this page|this guide|this entry|this article|our field manual|the field manual|this document|read on|below you)\b/i

/** Word ranges, measured off the Franklin Indian Tonic page on 23 August. */
const LENGTHS: Record<string, [number, number]> = {
  description: [25, 60],
  history: [30, 85],
  usage: [25, 70],
  storage: [4, 20],
  professionalTip: [15, 50],
  metaDescription: [18, 38],
}

export interface Mixer {
  slug: string
  name: string
  /** Parent ingredient document id, or null for a flavoured soda with no generic. */
  parentId: string | null
  description: string
  history: string
  origin: string
  usage: string
  storage: string
  professionalTip: string
  topTips: string[]
  substitutions: string[]
  keywords: string[]
  primary: string[]
  strength: string
  tasting: string
  sections: Array<{ heading: string; paragraphs: string[] }>
  faqs: Array<{ question: string; answer: string }>
  relatedIds: string[]
  metaTitle: string
  metaDescription: string
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
const key = (...p: string[]) => createHash('sha1').update(p.join('|')).digest('hex').slice(0, 12)
const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })

function blocks(m: Mixer) {
  return m.sections.flatMap((s) => [
    {
      _key: key(m.slug, s.heading),
      _type: 'block' as const,
      style: 'h2' as const,
      markDefs: [],
      children: [{ _key: key(m.slug, s.heading, 'h'), _type: 'span' as const, text: s.heading, marks: [] }],
    },
    ...s.paragraphs.map((text, i) => ({
      _key: key(m.slug, s.heading, String(i)),
      _type: 'block' as const,
      style: 'normal' as const,
      markDefs: [],
      children: [{ _key: key(m.slug, s.heading, String(i), 's'), _type: 'span' as const, text, marks: [] }],
    })),
  ])
}

function check(m: Mixer, slugs: Set<string>, ids: Set<string>): string[] {
  const problems: string[] = []
  const fail = (s: string) => problems.push(`${m.slug}: ${s}`)

  if (slugs.has(m.slug)) fail('slug already exists. Refusing to overwrite.')

  for (const [field, [lo, hi]] of Object.entries(LENGTHS)) {
    const n = words(m[field as keyof Mixer] as string)
    if (n < lo || n > hi) fail(`${field} is ${n} words, expected ${lo}-${hi}`)
  }

  const prose = [
    m.description,
    m.history,
    m.usage,
    m.professionalTip,
    m.tasting,
    ...m.topTips,
    ...m.sections.flatMap((s) => s.paragraphs),
    ...m.faqs.map((f) => f.answer),
  ].join(' ')

  for (const phrase of BOILERPLATE) {
    const hit = phrase.exec(prose)
    if (hit) fail(`repeats the producer's marketing copy: "${hit[0]}"`)
  }

  const self = SELF_REFERENCE.exec(prose)
  if (self) fail(`prose refers to itself: "${self[0]}"`)

  if (m.primary.length < 2 || m.primary.length > 4) fail(`${m.primary.length} primary notes, expected 2-4`)
  if (m.topTips.length < 3) fail(`${m.topTips.length} top tips, the exemplar carries three`)
  if (m.faqs.length < 3) fail(`${m.faqs.length} FAQs, expected at least three`)
  if (!m.sections.length) fail('no long-description sections')

  if (m.parentId && !ids.has(m.parentId)) fail(`parent "${m.parentId}" does not exist`)
  for (const id of m.relatedIds) {
    if (!ids.has(id)) fail(`related ingredient "${id}" does not exist`)
  }
  if (m.relatedIds.includes(`ingredient-${m.slug}`)) fail('lists itself as a related ingredient')

  return problems
}

function build(m: Mixer) {
  return {
    _id: `ingredient-${m.slug}`,
    _type: 'ingredient',
    name: m.name,
    slug: { _type: 'slug', current: m.slug },
    category: 'mixers',
    author: 'Jerry Can Spirits',
    description: m.description,
    history: m.history,
    origin: m.origin,
    usage: m.usage,
    storage: m.storage,
    professionalTip: m.professionalTip,
    topTips: m.topTips,
    substitutions: m.substitutions,
    keywords: m.keywords,
    flavorProfile: { primary: m.primary, strength: m.strength, tasting: m.tasting },
    longDescription: blocks(m),
    faqs: m.faqs.map((f) => ({
      _key: key(m.slug, f.question),
      _type: 'faq',
      question: f.question,
      answer: f.answer,
    })),
    relatedIngredients: m.relatedIds.map((id) => ({ _key: key(m.slug, id), _type: 'reference', _ref: id })),
    ...(m.parentId ? { parent: ref(m.parentId) } : {}),
    metaTitle: m.metaTitle,
    metaDescription: m.metaDescription,
    featured: false,
  }
}

async function main() {
  const rows = await client.fetch<Array<{ _id: string; slug: string | null }>>(
    `*[_type=="ingredient" && !(_id in path("drafts.**"))]{_id,"slug":slug.current}`
  )
  const slugs = new Set(rows.map((r) => r.slug).filter(Boolean) as string[])
  const ids = new Set(rows.map((r) => r._id))

  // Pages in this batch can reference each other — the two grapefruit products
  // are each other's obvious neighbour — so batch ids count as resolvable.
  MIXERS.forEach((m) => ids.add(`ingredient-${m.slug}`))

  const problems = MIXERS.flatMap((m) => check(m, slugs, ids))
  if (problems.length) {
    console.error(`${problems.length} problem(s). Nothing written.\n`)
    problems.forEach((p) => console.error(`  ${p}`))
    process.exit(1)
  }

  console.log(`${MIXERS.length} mixer pages pass.\n`)

  if (!WRITE) {
    MIXERS.forEach((m) => console.log(`  would create ingredient-${m.slug} — ${m.name}`))
    console.log('\nDry run. Add --write to create them.')
    return
  }

  let tx = client.transaction()
  for (const m of MIXERS) tx = tx.create(build(m))
  await tx.commit()

  MIXERS.forEach((m) => console.log(`  created ingredient-${m.slug}`))
  console.log(`\n${MIXERS.length} created.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
