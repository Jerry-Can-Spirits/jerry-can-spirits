/**
 * Create a cocktail page.
 *
 * The IBA verification finished by establishing that fourteen official
 * cocktails have no page at all. scripts/rewrite-cocktail-batch.ts replaces
 * a page wholesale and scripts/patch-cocktail-fields.ts changes named fields;
 * neither can bring a document into existence, which is what this does.
 *
 * Refuses to overwrite. A slug that already exists throws rather than
 * replacing a page somebody wrote.
 *
 * Every field the schema marks required is required here too, so an omission
 * fails at the type level rather than arriving in the Studio as a validation
 * error. That is the lesson from addVariants, which shipped three variants
 * with no method because the schema required one and the payload type did not.
 *
 * Guide slugs — glassware, ingredient links, garnishes, featured spirit — are
 * resolved at run time and an unknown one throws, so a payload never carries a
 * document id copied by hand and never links to nothing.
 *
 * Transient. Reset with `git checkout -- scripts/create-cocktail.ts`.
 *
 * Run:  npx sanity exec scripts/create-cocktail.ts --with-user-token
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'
import { selfReferences } from './self-reference'
import { recipeSourceLine, validateRecipeSourceInput, type RecipeAuthority } from '../src/lib/recipe-source'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Draft {
  slug: string
  name: string
  description: string
  /** [heading, body] in order. Body paragraphs split on blank lines. */
  sections: Array<[string, string]>
  metaTitle: string
  metaDescription: string
  keywords: string[]
  servings: string
  /** ISO 8601, e.g. PT5M. */
  prepTime: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
  /** Equipment guide slug, category glassware. */
  glassware: string
  /** Ingredient guide slug -> how it is applied. An empty slug means no page. */
  garnishes: Array<{ ref?: string; note: string }>
  ingredients: Array<{ name: string; amount: string; description: string; ref?: string }>
  instructions: string[]
  /** Expert Tip. */
  note: string
  author: string
  faqs: Array<[string, string]>
  family: string
  baseSpirit?: string
  /** Ingredient guide slug for the spirit the drink is known for. */
  featuredSpirit?: string
  tags?: string[]
  flavorProfile: string[]
  recipeSource: { authority: RecipeAuthority; note?: string }
  /**
   * Required when the authority is house, and meaningless anywhere else.
   *
   * The fourteen IBA officials this script was written for were all attributed
   * to a published specification, so the field never came up. A house serve has
   * no outside authority to cite — what it has is a reason, and the validator
   * rejects a house attribution without one. A recipe that differs from every
   * published version and says nothing about why reads as a transcription error
   * rather than a decision.
   */
  houseVariation?: string
  /** YYYY-MM-DD. */
  sourceCheckedAt: string
}

const key = (slug: string, p: string, i: number) =>
  `${slug.replace(/[^a-z0-9]/gi, '').slice(0, 8)}${p}${String(i).padStart(2, '0')}`

const COCKTAILS: Draft[] = []

function blocks(slug: string, sections: Draft['sections']) {
  const out: unknown[] = []
  sections.forEach(([heading, body], i) => {
    out.push({
      _key: key(slug, 'h', i),
      _type: 'block',
      style: 'h2',
      markDefs: [],
      children: [{ _key: key(slug, 'hs', i), _type: 'span', text: heading, marks: [] }],
    })
    body.split(/\n\s*\n/).forEach((para, j) => {
      out.push({
        _key: key(slug, `p${i}`, j),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: key(slug, `s${i}`, j), _type: 'span', text: para.trim(), marks: [] }],
      })
    })
  })
  return out
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

async function resolve(type: 'ingredient' | 'equipment', slugs: string[]) {
  const unique = [...new Set(slugs)].filter(Boolean)
  if (!unique.length) return new Map<string, string>()
  const docs = await client.fetch<Array<{ _id: string; slug: string }>>(
    `*[_type == $type && slug.current in $slugs && !(_id in path("drafts.**"))]{ _id, "slug": slug.current }`,
    { type, slugs: unique }
  )
  const found = new Map(docs.map((d) => [d.slug, d._id]))
  for (const s of unique) if (!found.has(s)) throw new Error(`no ${type} guide with slug "${s}"`)
  return found
}

async function main() {
  for (const draft of COCKTAILS) {
    const existing = await client.fetch<string | null>(
      `*[_type == "cocktail" && slug.current == $slug && !(_id in path("drafts.**"))][0]._id`,
      { slug: draft.slug }
    )
    if (existing) throw new Error(`"${draft.slug}" already exists as ${existing} — this script does not overwrite`)
  }

  const glassIds = await resolve(
    'equipment',
    COCKTAILS.map((d) => d.glassware)
  )
  const ingredientIds = await resolve('ingredient', [
    ...COCKTAILS.flatMap((d) => d.ingredients.map((i) => i.ref).filter(Boolean) as string[]),
    ...COCKTAILS.flatMap((d) => d.garnishes.map((g) => g.ref).filter(Boolean) as string[]),
    ...COCKTAILS.map((d) => d.featuredSpirit).filter(Boolean) as string[],
  ])

  for (const draft of COCKTAILS) {
    const valid = validateRecipeSourceInput({
      ...draft.recipeSource,
      houseVariation: draft.houseVariation,
      checkedAt: draft.sourceCheckedAt,
    })
    if (valid !== true) throw new Error(`${draft.name}: ${valid}`)

    const doc = {
      _id: `cocktail-${draft.slug}`,
      _type: 'cocktail',
      name: draft.name,
      slug: { _type: 'slug', current: draft.slug },
      description: draft.description,
      longDescription: blocks(draft.slug, draft.sections),
      metaTitle: draft.metaTitle,
      metaDescription: draft.metaDescription,
      keywords: draft.keywords,
      servings: draft.servings,
      prepTime: draft.prepTime,
      difficulty: draft.difficulty,
      glassware: { _type: 'reference', _ref: glassIds.get(draft.glassware) },
      garnishes: draft.garnishes.map((g, i) => ({
        _key: key(draft.slug, 'g', i),
        _type: 'garnishItem',
        ...(g.ref ? { ingredient: { _type: 'reference', _ref: ingredientIds.get(g.ref) } } : {}),
        note: g.note,
      })),
      ingredients: draft.ingredients.map((ing, i) => ({
        _key: key(draft.slug, 'i', i),
        _type: 'cocktailIngredient',
        name: ing.name,
        amount: ing.amount,
        description: ing.description,
        ...(ing.ref ? { ingredientRef: { _type: 'reference', _ref: ingredientIds.get(ing.ref) } } : {}),
      })),
      instructions: draft.instructions,
      note: draft.note,
      author: draft.author,
      faqs: draft.faqs.map(([question, answer], i) => ({
        _key: key(draft.slug, 'f', i),
        _type: 'faq',
        question,
        answer,
      })),
      family: draft.family,
      ...(draft.baseSpirit ? { baseSpirit: draft.baseSpirit } : {}),
      ...(draft.featuredSpirit
        ? { featuredSpirit: { _type: 'reference', _ref: ingredientIds.get(draft.featuredSpirit) } }
        : {}),
      ...(draft.tags ? { tags: draft.tags } : {}),
      flavorProfile: draft.flavorProfile,
      recipeSource: { _type: 'object', ...draft.recipeSource },
      ...(draft.houseVariation ? { houseVariation: draft.houseVariation } : {}),
      sourceCheckedAt: draft.sourceCheckedAt,
    }

    const long = draft.sections.reduce((n, [h, b]) => n + words(h) + words(b), 0)
    const prose = [
      draft.description,
      draft.note,
      ...draft.sections.flatMap(([h, b]) => [h, b]),
      ...draft.faqs.flat(),
      ...draft.ingredients.map((i) => i.description),
    ].join('\n\n')

    console.log(`  ${draft.name}  (${doc._id})`)
    console.log(`    description ${words(draft.description)}w | tip ${words(draft.note)}w | long ${long}w / ${draft.sections.length} sections`)
    console.log(`    faqs ${draft.faqs.map(([, a]) => words(a)).join(', ')} | ${draft.ingredients.length} ingredients | ${draft.instructions.length} steps`)
    console.log(
      `    ${recipeSourceLine(draft.recipeSource.authority, draft.recipeSource.note, draft.sourceCheckedAt)}`
    )
    const thin = draft.ingredients.filter((i) => words(i.description) < 15)
    if (thin.length) console.log(`    !! thin ingredient notes: ${thin.map((i) => i.name).join(', ')}`)
    const self = selfReferences(prose)
    if (self.length) console.log(`    !! SELF-REFERENCE: ${self.join(' | ')}`)

    if (WRITE) await client.createIfNotExists(doc)
  }

  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
