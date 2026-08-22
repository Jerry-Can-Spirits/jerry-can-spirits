/**
 * Create cocktail pages for a producer's published serves.
 *
 * WHY THIS EXISTS AS TOOLING. Fever-Tree publishes 52 serves as schema.org
 * Recipe data; Franklin & Sons publishes 59 without it. Both will be written up
 * the same way and neither is the last — the Field Manual carries serves from
 * any producer who publishes them, so a reader choosing a mixer is choosing
 * rather than being routed. A script that builds one producer's batch by hand
 * gets rewritten for the next one.
 *
 * WHAT IT REFUSES TO DO. Every guard here is a defect that reached Sanity once.
 *
 *  - It will not write over an existing slug. Content goes straight to the
 *    dataset with no PR to review, so an accidental collision silently replaces
 *    a finished page and the only evidence is a changed _updatedAt.
 *  - It will not accept an authority the site cannot render. `recipeSourceLine`
 *    returns null for an unknown one, so the attribution just vanishes from the
 *    page rather than failing anywhere visible.
 *  - It will not accept a description or expert tip outside the lengths in
 *    docs/COCKTAIL_CONTENT_STANDARD.md. Those numbers were re-derived from the
 *    exemplar page in August after an audit reported 348 of 349 pages failing,
 *    which turned out to be the ruler being wrong rather than the corpus.
 *  - It will not accept an ingredient without a note. "Fresh lime juice adds a
 *    delicious citrus flavour" is the failure mode the standard names, and an
 *    empty note is how a page ends up with it later.
 *  - It will not accept prose that names the page it lives on. Self-reference
 *    is the single most common defect in the corpus: 69 mentions of a Sanity
 *    document, 67 of "this page". scripts/audit-formulaic-copy.ts counts them
 *    after the fact; this refuses to add more.
 *
 * PROSE IS OURS. The producer's specification is a fact about measures. Every
 * word on the page is written here. Where a serve is a modern take on an older
 * drink the history belongs to the older drink and must say so; where a serve
 * was invented by a marketing team last year it has no history and gets none
 * invented for it.
 *
 * Run: npx sanity exec scripts/create-brand-serves.ts --with-user-token
 *      ...add --write to actually create. Without it, nothing is written.
 */
import { getCliClient } from 'sanity/cli'
import { createHash } from 'crypto'
import { validateRecipeSourceInput } from '../src/lib/recipe-source'
import { SERVES } from './brand-serves-payload'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** docs/COCKTAIL_CONTENT_STANDARD.md sections 3 and 6, re-derived 8 August. */
const DESCRIPTION_WORDS = [150, 200] as const
const EXPERT_TIP_WORDS = [100, 160] as const

/**
 * Phrases that mean the writing has changed subject from the drink to the
 * website. Kept in step with scripts/audit-formulaic-copy.ts by hand, which is
 * a smell, but that script scores the whole corpus and this one blocks a write.
 */
const SELF_REFERENCE = /\b(this page|this guide|this recipe page|our field manual|the field manual|this document|this entry|this article|read on|below you)\b/i

export interface ServeIngredient {
  name: string
  amount: string
  /** Why it matters. Never a restatement of the name. */
  description: string
  ref?: string
}

export interface ServeSection {
  heading: string
  paragraphs: string[]
}

export interface Serve {
  slug: string
  name: string
  description: string
  /** The Expert Tip. Stored on the cocktail as `note`. */
  expertTip: string
  baseSpirit: string
  family: string
  difficulty: string
  prepTime: string
  glasswareId: string
  ingredients: ServeIngredient[]
  garnishIds: string[]
  instructions: string[]
  sections: ServeSection[]
  faqs: Array<{ question: string; answer: string }>
  flavorProfile: string[]
  tags: string[]
  keywords: string[]
  metaTitle: string
  metaDescription: string
  relatedSlugs: string[]
  /** The producer, as it renders inside "Source: ... (here)." */
  producer: string
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

/**
 * Stable keys, so re-running after an edit updates an array entry rather than
 * replacing it with a new one. Random keys would make every re-run look like a
 * wholesale rewrite in the Studio's history.
 */
const key = (...parts: string[]) => createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 12)

const ref = (id: string) => ({ _type: 'reference' as const, _ref: id })

/** A heading and its paragraphs as portable text blocks. */
function blocks(sections: ServeSection[], slug: string) {
  return sections.flatMap((section) => [
    {
      _key: key(slug, section.heading),
      _type: 'block' as const,
      style: 'h3' as const,
      markDefs: [],
      children: [{ _key: key(slug, section.heading, 'h'), _type: 'span' as const, text: section.heading, marks: [] }],
    },
    ...section.paragraphs.map((text, i) => ({
      _key: key(slug, section.heading, String(i)),
      _type: 'block' as const,
      style: 'normal' as const,
      markDefs: [],
      children: [{ _key: key(slug, section.heading, String(i), 's'), _type: 'span' as const, text, marks: [] }],
    })),
  ])
}

/**
 * `existing` is what is already in the dataset and `linkable` is that plus the
 * slugs in this batch. They are deliberately separate: a batch slug must not
 * count as a collision with itself, but it must count as a valid link target,
 * and collapsing the two makes every serve in the batch fail as a duplicate.
 */
function check(
  serve: Serve,
  existing: Map<string, string>,
  linkable: Map<string, string>,
  checkedAt: string
): string[] {
  const problems: string[] = []
  const fail = (m: string) => problems.push(`${serve.slug}: ${m}`)

  if (existing.has(serve.slug)) fail(`slug already exists (${existing.get(serve.slug)}). Refusing to overwrite.`)

  const source = validateRecipeSourceInput({
    authority: 'brand-serve',
    note: serve.producer,
    checkedAt,
  })
  if (source !== true) fail(source)

  const d = words(serve.description)
  if (d < DESCRIPTION_WORDS[0] || d > DESCRIPTION_WORDS[1]) {
    fail(`description is ${d} words, standard says ${DESCRIPTION_WORDS[0]}-${DESCRIPTION_WORDS[1]}`)
  }

  const t = words(serve.expertTip)
  if (t < EXPERT_TIP_WORDS[0] || t > EXPERT_TIP_WORDS[1]) {
    fail(`expert tip is ${t} words, standard says ${EXPERT_TIP_WORDS[0]}-${EXPERT_TIP_WORDS[1]}`)
  }

  for (const i of serve.ingredients) {
    if (!i.description.trim()) fail(`"${i.name}" has no note`)
  }

  if (serve.flavorProfile.length < 4 || serve.flavorProfile.length > 6) {
    fail(`${serve.flavorProfile.length} flavour descriptors, standard says 4-6`)
  }

  if (serve.faqs.length < 3) fail(`${serve.faqs.length} FAQs, standard says three`)

  const prose = [
    serve.description,
    serve.expertTip,
    ...serve.sections.flatMap((s) => s.paragraphs),
    ...serve.faqs.map((f) => f.answer),
  ].join(' ')
  const selfRef = SELF_REFERENCE.exec(prose)
  if (selfRef) fail(`prose refers to itself: "${selfRef[0]}"`)

  for (const slug of serve.relatedSlugs) {
    if (!linkable.has(slug)) fail(`related cocktail "${slug}" does not exist`)
  }

  if (serve.relatedSlugs.includes(serve.slug)) fail('is listed as its own related cocktail')

  return problems
}

/**
 * Document ids for the batch, assigned before anything is written.
 *
 * Serves in one batch legitimately reference each other — the two spritzes
 * built on the same soda are each other's most useful "you might also like" —
 * and a reference needs an id that does not exist yet. Naming the documents up
 * front rather than letting Sanity assign ids means the whole batch can be
 * resolved and written in a single transaction.
 *
 * Derived from the slug so a re-run after a failure targets the same documents
 * instead of creating a second copy of each.
 */
function batchIds(serves: Serve[]): Map<string, string> {
  return new Map(serves.map((s) => [s.slug, `cocktail-${s.slug}`]))
}

function build(serve: Serve, linkable: Map<string, string>, ids: Map<string, string>, checkedAt: string) {
  return {
    _id: ids.get(serve.slug)!,
    _type: 'cocktail',
    name: serve.name,
    slug: { _type: 'slug', current: serve.slug },
    author: 'Dan Freeman',
    description: serve.description,
    note: serve.expertTip,
    baseSpirit: serve.baseSpirit,
    family: serve.family,
    difficulty: serve.difficulty,
    prepTime: serve.prepTime,
    servings: '1 cocktail',
    glassware: ref(serve.glasswareId),
    ingredients: serve.ingredients.map((i) => ({
      _key: key(serve.slug, i.name),
      name: i.name,
      amount: i.amount,
      description: i.description,
      ...(i.ref ? { ingredientRef: ref(i.ref) } : {}),
    })),
    garnishes: serve.garnishIds.map((id) => ({
      _key: key(serve.slug, id),
      _type: 'garnishItem',
      ingredient: ref(id),
    })),
    instructions: serve.instructions,
    longDescription: blocks(serve.sections, serve.slug),
    faqs: serve.faqs.map((f) => ({
      _key: key(serve.slug, f.question),
      _type: 'faq',
      question: f.question,
      answer: f.answer,
    })),
    flavorProfile: serve.flavorProfile,
    tags: serve.tags,
    keywords: serve.keywords,
    metaTitle: serve.metaTitle,
    metaDescription: serve.metaDescription,
    relatedCocktails: serve.relatedSlugs.map((slug) => ({
      _key: key(serve.slug, slug),
      _type: 'reference',
      _ref: linkable.get(slug)!,
    })),
    recipeSource: { _type: 'object', authority: 'brand-serve', note: serve.producer },
    sourceCheckedAt: checkedAt,
    featured: false,
  }
}

async function main() {
  const checkedAt = process.env.SERVE_CHECKED_AT
  if (!checkedAt) throw new Error('Set SERVE_CHECKED_AT to the date the specs were read, as YYYY-MM-DD.')

  const rows = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type=="cocktail" && !(_id in path("drafts.**"))]{_id,"slug":slug.current}`
  )
  const existing = new Map(rows.map((r) => [r.slug, r._id]))

  const ids = batchIds(SERVES)
  const linkable = new Map([...existing, ...ids])

  const problems = SERVES.flatMap((s) => check(s, existing, linkable, checkedAt))
  if (problems.length) {
    console.error(`${problems.length} problem(s). Nothing written.\n`)
    problems.forEach((p) => console.error(`  ${p}`))
    process.exit(1)
  }

  console.log(`${SERVES.length} serves pass the standard.\n`)

  if (!WRITE) {
    SERVES.forEach((s) => console.log(`  would create ${s.slug} — ${s.name} (${s.producer})`))
    console.log('\nDry run. Add --write to create them.')
    return
  }

  let tx = client.transaction()
  for (const serve of SERVES) tx = tx.create(build(serve, linkable, ids, checkedAt))
  await tx.commit()

  SERVES.forEach((s) => console.log(`  created ${s.slug}`))
  console.log(`\n${SERVES.length} created.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
