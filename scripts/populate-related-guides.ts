/**
 * Populate relatedGuides on the bitters, vermouth and syrup parent pages.
 *
 * An earlier pass reported zero relevant guides for bitters, vermouth, sherry
 * and syrup. That number was inferred from family labels rather than measured
 * against guide content, and it was wrong. Re-reading all 55 guides found five
 * genuine dedicated sections. Each of these is a section about the ingredient,
 * not a passing mention:
 *
 *   bitters  -> essential-home-bar-setup          ("Bitters and Flavourings")
 *   bitters  -> understanding-cocktail-balance    (four bitterness subsections)
 *   vermouth -> building-your-spirits-collection  ("Vermouths")
 *   syrup    -> autumn-cocktails-guide            ("Building Autumn Flavour Syrups")
 *   syrup    -> cocktail-terms-glossary           ("Simple Syrup")
 *
 * Sherry stays empty. That was measured this time, and it is genuinely zero. A
 * padded field teaches readers the links are not worth following.
 *
 * muddling-masterclass is deliberately excluded. Its 49 hits for "bitters" are
 * all "Avoiding Pith Bitterness", which is about pith, and it is the reason
 * match counts alone were not sufficient evidence.
 *
 * sectionAnchor is set only where the section named above is a real top-level
 * heading in that guide's sections array, which is true for exactly one of the
 * five. The other four are subheadings inside a section, so linking to the
 * guide is correct and an invented anchor would not be.
 *
 * Appends: existing entries are preserved and a guide already linked is
 * skipped, so re-running cannot duplicate or overwrite.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Link {
  ingredient: string
  guide: string
  // Only set where the section is a real top-level heading in that guide.
  sectionAnchor?: string
}

const LINKS: Link[] = [
  { ingredient: 'bitters', guide: 'essential-home-bar-setup' },
  { ingredient: 'bitters', guide: 'understanding-cocktail-balance' },
  { ingredient: 'vermouth', guide: 'building-your-spirits-collection' },
  { ingredient: 'syrup', guide: 'autumn-cocktails-guide', sectionAnchor: 'Building Autumn Flavour Syrups' },
  { ingredient: 'syrup', guide: 'cocktail-terms-glossary' },
]

interface IngredientDoc {
  _id: string
  slug: string
  existing: string[] | null
}

interface GuideDoc {
  _id: string
  slug: string
  headings: string[] | null
}

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const ingredientSlugs = [...new Set(LINKS.map((l) => l.ingredient))]
  const guideSlugs = [...new Set(LINKS.map((l) => l.guide))]

  const ingredients: IngredientDoc[] = await client.fetch(
    `*[_type=="ingredient" && slug.current in $slugs]{ _id, "slug": slug.current, "existing": relatedGuides[].guide->slug.current }`,
    { slugs: ingredientSlugs }
  )
  const guides: GuideDoc[] = await client.fetch(
    `*[_type=="guide" && slug.current in $slugs]{ _id, "slug": slug.current, "headings": sections[].heading }`,
    { slugs: guideSlugs }
  )

  const byIngredient = new Map(ingredients.map((d) => [d.slug, d]))
  const byGuide = new Map(guides.map((d) => [d.slug, d]))

  // Refuse to write anything if a slug does not resolve. A silently skipped
  // link would look like a completed run.
  const missing = [
    ...ingredientSlugs.filter((s) => !byIngredient.has(s)).map((s) => `ingredient/${s}`),
    ...guideSlugs.filter((s) => !byGuide.has(s)).map((s) => `guide/${s}`),
  ]
  if (missing.length) {
    console.log(`  ABORT — these slugs did not resolve: ${missing.join(', ')}`)
    process.exit(1)
  }

  // An anchor that is not a real heading would deep-link to nowhere.
  for (const link of LINKS.filter((l) => l.sectionAnchor)) {
    const headings = byGuide.get(link.guide)!.headings || []
    if (!headings.includes(link.sectionAnchor!)) {
      console.log(`  ABORT — "${link.sectionAnchor}" is not a section heading in ${link.guide}`)
      process.exit(1)
    }
  }

  let planned = 0

  for (const slug of ingredientSlugs) {
    const doc = byIngredient.get(slug)!
    const already = new Set(doc.existing || [])
    const wanted = LINKS.filter((l) => l.ingredient === slug && !already.has(l.guide))

    console.log(`/${slug}  (${(doc.existing || []).length} existing)`)
    if (!wanted.length) {
      console.log('  nothing to add\n')
      continue
    }

    const items = wanted.map((l) => ({
      _type: 'guideLink',
      _key: `guide-${l.guide}`,
      guide: { _type: 'reference', _ref: byGuide.get(l.guide)!._id },
      ...(l.sectionAnchor ? { sectionAnchor: l.sectionAnchor } : {}),
    }))

    for (const l of wanted) {
      console.log(`  + /${l.guide}/${l.sectionAnchor ? `  [anchor: ${l.sectionAnchor}]` : ''}`)
      planned++
    }
    console.log('')

    if (WRITE) {
      await client
        .patch(doc._id)
        .setIfMissing({ relatedGuides: [] })
        .insert('after', 'relatedGuides[-1]', items)
        .commit()
    }
  }

  console.log(`${planned} link(s) ${WRITE ? 'written' : 'planned'}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
