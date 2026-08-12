/**
 * Fill the metadata fields that follow from what is already in the document.
 *
 * The copy pass ran four pages at a time because every page needed prose
 * written to a word band. Most of the attribution sweep does not: author,
 * the technique guide links and the featured spirit all follow from the
 * recipe, so they are derived by rule across the whole corpus in one run and
 * checked in aggregate rather than composed one page at a time.
 *
 * What is NOT here, deliberately: recipeSource. An authority is a claim that
 * somebody checked a specification against a published source, and there is no
 * rule that can derive it from the document. Guessing it would put a "Source:"
 * line on a page nobody verified, which is worse than the line being absent.
 *
 * Run:  npx sanity exec scripts/set-cocktail-metadata.ts --with-user-token
 *       ...add --write to execute, --only=author|guides|spirit to narrow.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.split('=')[1]
const doing = (field: string) => !ONLY || ONLY === field

/**
 * The house originals.
 *
 * Curated rather than derived. Five of the six carry a Jerry Can Spirits
 * product and could be found by ingredient, but Autumn Gold is bourbon and
 * apple brandy and is no less ours for it. Whether a recipe is our own is a
 * fact about how it came to exist, which no field in the document records.
 */
const HOUSE_ORIGINALS = new Set([
  'Storm & Spice',
  'Explorers Gold',
  'Autumn Gold',
  'The Old Standard',
  'The Expedition Punch',
  'Jerry Can Julep',
  'Spiced Rum Mule',
])

/**
 * Authorship follows the same split the 95 already-attributed pages use:
 * our own recipes carry a name, transcriptions of the canon carry the house.
 * A drink Jerry Thomas printed in 1862 was not written by anybody here.
 */
const DAN = 'Dan Freeman'
const HOUSE = 'Jerry Can Spirits'

/**
 * Technique guides, matched on the verb the instructions actually use.
 *
 * The 280 pages that already carry a link were matched this way — a shaken
 * drink links to the shaking guide — so this fills the remaining gap to the
 * same convention rather than inventing a second one.
 *
 * Ordered: the first match wins, so a recipe that muddles and then shakes
 * links to the muddling guide, which is the step a reader is more likely to
 * get wrong.
 */
const TECHNIQUE_GUIDES: Array<[RegExp, string]> = [
  [/\bmuddl/i, 'muddling-masterclass'],
  [/\bblend/i, 'how-to-shake-cocktail'],
  [/\bshake|\bshaker\b|dry shake/i, 'how-to-shake-cocktail'],
  [/\bstir/i, 'stirring-vs-shaking'],
]

interface Ing {
  name?: string
  amount?: string
  ingredientRef?: { _ref: string }
  category?: string | null
}
interface Doc {
  _id: string
  name: string
  author: string | null
  featuredSpirit: { _ref: string } | null
  baseSpirit: string | null
  relatedGuides: unknown[] | null
  instructions: string[] | null
  ingredients: Ing[] | null
  recipeSource: { authority?: string } | null
}

/** Millilitres at the front of an amount, so the biggest pour can be found. */
const ml = (amount: string | undefined) => {
  const m = /^(\d+(?:\.\d+)?)\s*ml\b/i.exec((amount ?? '').trim())
  return m ? Number(m[1]) : 0
}

/**
 * The spirit the drink is known for.
 *
 * Largest pour among the ingredients the guide files as spirits, falling back
 * to liqueurs for the drinks built on them — a Baby Guinness is a coffee
 * liqueur drink and there is no spirit in it to feature.
 *
 * The category filter is the whole rule rather than a refinement. Largest pour
 * alone gave the Cuba Libre 120ml of cola over 60ml of rum, and the Sex on the
 * Beach orange juice: on a long drink the mixer is almost always the biggest
 * thing in the glass and almost never what the drink is known for.
 *
 * Ties go to the earlier line, because a recipe is written with the defining
 * spirit at the top. A Vieux Carré is a rye drink to anybody ordering one even
 * though the cognac matches it millilitre for millilitre, and rye is listed
 * first.
 */
function featuredSpirit(doc: Doc): Ing | null {
  const measured = (doc.ingredients ?? []).filter((i) => i.ingredientRef?._ref && ml(i.amount) > 0)
  const pick = (category: string) => {
    const of = measured.filter((i) => i.category === category)
    if (!of.length) return null
    let best = of[0]
    for (const ing of of) if (ml(ing.amount) > ml(best.amount)) best = ing
    return best
  }
  return pick('spirits') ?? pick('liqueurs')
}

function techniqueGuide(doc: Doc): string | null {
  const steps = (doc.instructions ?? []).join(' ')
  for (const [pattern, slug] of TECHNIQUE_GUIDES) if (pattern.test(steps)) return slug
  return null
}

async function main() {
  const [docs, guides] = await Promise.all([
    client.fetch<Doc[]>(
      // Drafts excluded. The site reads perspective: 'published', so a draft is
      // work no visitor sees — and the CLI queries the raw dataset, where a
      // stale draft turns up alongside its published document and gets patched
      // as if it were a second cocktail.
      `*[_type == "cocktail" && defined(slug.current) && !(_id in path("drafts.**"))]{
        _id, name, author, featuredSpirit, baseSpirit, relatedGuides, instructions,
        ingredients[]{ name, amount, ingredientRef, "category": ingredientRef->category }, recipeSource
      } | order(name asc)`
    ),
    client.fetch<Array<{ _id: string; slug: string }>>(
      `*[_type == "guide" && defined(slug.current)]{ _id, "slug": slug.current }`
    ),
  ])

  const guideId = new Map(guides.map((g) => [g.slug, g._id]))
  for (const [, slug] of TECHNIQUE_GUIDES) {
    if (!guideId.has(slug)) throw new Error(`No guide with slug "${slug}"`)
  }

  const changes: Array<{ doc: Doc; set: Record<string, unknown>; summary: string[] }> = []
  const skipped: string[] = []

  for (const doc of docs) {
    const set: Record<string, unknown> = {}
    const summary: string[] = []

    if (doing('author') && !doc.author) {
      const author = HOUSE_ORIGINALS.has(doc.name) ? DAN : HOUSE
      set.author = author
      summary.push(`author = ${author}`)
    }

    if (doing('guides') && !doc.relatedGuides?.length) {
      const slug = techniqueGuide(doc)
      if (slug) {
        set.relatedGuides = [
          {
            _key: `tech${doc._id.replace(/[^a-z0-9]/gi, '').slice(-8)}`,
            _type: 'guideLink',
            guide: { _type: 'reference', _ref: guideId.get(slug) },
          },
        ]
        summary.push(`guide = ${slug}`)
      } else {
        skipped.push(`${doc.name}: no technique verb in the instructions`)
      }
    }

    if (doing('spirit') && !doc.featuredSpirit) {
      const pick = featuredSpirit(doc)
      if (pick) {
        set.featuredSpirit = { _type: 'reference', _ref: pick.ingredientRef!._ref }
        summary.push(`featured = ${pick.name}`)
      } else {
        skipped.push(`${doc.name}: no spirit or liqueur links to a guide`)
      }
    }

    if (summary.length) changes.push({ doc, set, summary })
  }

  const counted = (field: string) => changes.filter((c) => field in c.set).length
  console.log(`${docs.length} cocktails, ${changes.length} to change\n`)
  console.log(`  author          ${counted('author')}`)
  console.log(`  relatedGuides   ${counted('relatedGuides')}`)
  console.log(`  featuredSpirit  ${counted('featuredSpirit')}\n`)

  const danPages = changes.filter((c) => c.set.author === DAN).map((c) => c.doc.name)
  if (danPages.length) console.log(`Attributed to ${DAN}: ${danPages.join(', ')}\n`)

  console.log('FIRST 15 CHANGES\n')
  for (const c of changes.slice(0, 15)) console.log(`  ${c.doc.name}: ${c.summary.join(' | ')}`)

  if (skipped.length) {
    console.log(`\n${skipped.length} FIELDS LEFT UNSET — no rule reaches them\n`)
    for (const s of skipped.slice(0, 20)) console.log(`  ${s}`)
    if (skipped.length > 20) console.log(`  ...and ${skipped.length - 20} more`)
  }

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  let done = 0
  for (const c of changes) {
    await client.patch(c.doc._id).set(c.set).commit()
    done++
    if (done % 50 === 0) console.log(`  ...${done}/${changes.length}`)
  }
  console.log(`\nWRITTEN. ${done} documents patched.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
