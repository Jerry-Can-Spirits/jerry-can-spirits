/**
 * Put branded mixers on the family tree under their generic.
 *
 * Twenty-six Fever-Tree and Franklin & Sons products sit in the corpus with no
 * `parent` set, which has three consequences. The bar tool needs a hardcoded
 * alias map in src/lib/bar/config.ts to know that owning soda water satisfies a
 * recipe naming Fever-Tree Premium Soda Water. The prose audit's ownership
 * closure — which walks parent and children in both directions — cannot reason
 * about them at all. And an ingredient page for a branded product shows no
 * lineage back to the thing it is a brand of.
 *
 * Setting the reference fixes all three from the data rather than from a list
 * somebody has to remember to update.
 *
 * Matching is by keyword rather than by a slug table on purpose: a new tonic
 * added next year classifies itself, where a hardcoded map silently misses it.
 * The rules are ordered, first match wins, and anything unmatched is reported
 * rather than guessed at — a speciality soda with no generic equivalent should
 * stay parentless until somebody decides what its generic is.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Name prefixes that mark a product page rather than a generic ingredient. */
const BRAND_PREFIXES = ['Fever-Tree', 'Franklin & Sons']

/**
 * Ordered keyword rules, first match wins. "Tonic" has to be tested before the
 * flavour words, because a Lemon Tonic Water is a tonic and not a lemonade.
 */
const RULES: Array<{ match: RegExp; parent: string }> = [
  { match: /tonic/i, parent: 'tonic-water' },
  { match: /ginger beer/i, parent: 'ginger-beer' },
  { match: /ginger ale/i, parent: 'ginger-ale' },
  { match: /cola/i, parent: 'cola' },
  { match: /lemonade/i, parent: 'lemonade' },
  { match: /soda water/i, parent: 'soda-water' },
  { match: /grapefruit soda/i, parent: 'grapefruit-soda' },
]

interface Doc {
  _id: string
  name: string
  parentName: string | null
}

async function main() {
  const brands = await client.fetch<Doc[]>(
    `*[_type == "ingredient" && !(_id in path("drafts.**")) && defined(slug.current)
       && (${BRAND_PREFIXES.map((_, i) => `name match $p${i}`).join(' || ')})]{
      _id, name, "parentName": parent->name
    } | order(name asc)`,
    Object.fromEntries(BRAND_PREFIXES.map((p, i) => [`p${i}`, `${p}*`]))
  )

  const parentSlugs = [...new Set(RULES.map((r) => r.parent))]
  const generics = await client.fetch<Array<{ _id: string; slug: string; name: string }>>(
    `*[_type == "ingredient" && slug.current in $slugs && !(_id in path("drafts.**"))]{
      _id, "slug": slug.current, name
    }`,
    { slugs: parentSlugs }
  )
  const genericId = new Map(generics.map((g) => [g.slug, g._id]))
  const genericName = new Map(generics.map((g) => [g.slug, g.name]))

  const missing = parentSlugs.filter((s) => !genericId.has(s))
  if (missing.length) {
    console.log(`Generic pages that do not exist yet: ${missing.join(', ')}`)
    console.log('Create them first, or the products matching those rules stay parentless.\n')
  }

  const planned: Array<{ doc: Doc; parent: string }> = []
  const unmatched: Doc[] = []
  const already: Doc[] = []

  for (const doc of brands) {
    if (doc.parentName) {
      already.push(doc)
      continue
    }
    const rule = RULES.find((r) => r.match.test(doc.name))
    if (!rule || !genericId.has(rule.parent)) {
      unmatched.push(doc)
      continue
    }
    planned.push({ doc, parent: rule.parent })
  }

  console.log(`${brands.length} branded product pages found.\n`)

  if (already.length) {
    console.log(`ALREADY PARENTED (${already.length}), left alone:`)
    for (const d of already) console.log(`  ${d.name} -> ${d.parentName}`)
    console.log('')
  }

  console.log(`TO SET (${planned.length}):`)
  for (const { doc, parent } of planned) {
    console.log(`  ${doc.name.padEnd(62)} -> ${genericName.get(parent)}`)
  }

  if (unmatched.length) {
    console.log(`\nNO GENERIC (${unmatched.length}), left parentless for a decision:`)
    for (const d of unmatched) console.log(`  ${d.name}`)
  }

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  for (const { doc, parent } of planned) {
    await client.patch(doc._id).set({ parent: { _type: 'reference', _ref: genericId.get(parent) } }).commit()
  }
  console.log(`\nWRITTEN. ${planned.length} product(s) parented.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
