/**
 * Author normalisation.
 *
 * Two strings meant the same entity: "Jerry Can Spirits" (128 documents) and
 * "Jerry Can Spirits Team" (150). Both resolved to the Organization in
 * structured data, so machines saw no difference, but the visible byline did:
 * a cocktail page read "Recipe by Jerry Can Spirits" while an ingredient page
 * read "Jerry Can Spirits Team", split along no logical line — 93 of 94
 * cocktails one way, 93 of 94 ingredients the other, and guides 34/21.
 *
 * House cocktails are then attributed to their actual author. These are our own
 * creations, not curated classics, and the byline should say so. Only a name in
 * TEAM_SLUGS resolves to a Person node in JSON-LD, so this is the data half of
 * the change that stopped the cocktail template hardcoding the Organization.
 *
 * Queries inline their constants rather than using $params: getCliClient()
 * returns a typegen-aware client whose fetch overloads are keyed on known query
 * literals, and a parameterised one-off query matches none of them.
 *
 * Run: npx sanity exec scripts/normalise-authors.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const CANONICAL = 'Jerry Can Spirits'
const VARIANT = 'Jerry Can Spirits Team'

// Our own recipes, not classics we curated. Deliberately a list rather than a
// query on baseSpirit: "Rum Smash" and "Spiced Rum Punch" share the spiced-rum
// base but are generic drinks we did not invent.
const HOUSE_COCKTAILS = [
  'storm-and-spice',
  'explorers-gold-rum-and-honey',
  'expedition-punch',
  'jerry-can-julep',
  'spiced-rum-mule',
  'the-old-standard-rum-old-fashioned',
]

const HOUSE_AUTHOR = 'Dan Freeman'

async function main() {
  // 1 — collapse the two strings into one. Drafts included: a published-only
  // fix reappears the next time anyone publishes.
  const variants = (await client.fetch(
    `*[author == "${VARIANT}"]{ _id }`
  )) as Array<{ _id: string }>
  console.log(`normalising ${variants.length} documents from "${VARIANT}" to "${CANONICAL}"`)
  for (const doc of variants) {
    await client.patch(doc._id).set({ author: CANONICAL }).commit()
  }

  // 2 — attribute the house cocktails
  const slugList = HOUSE_COCKTAILS.map((s) => `"${s}"`).join(', ')
  const house = (await client.fetch(
    `*[_type == "cocktail" && slug.current in [${slugList}]]{ _id, name }`
  )) as Array<{ _id: string; name: string }>
  console.log(`\nattributing ${house.length} house cocktails to ${HOUSE_AUTHOR}:`)
  for (const doc of house) {
    await client.patch(doc._id).set({ author: HOUSE_AUTHOR }).commit()
    console.log(`  ${doc.name}`)
  }

  if (house.length !== HOUSE_COCKTAILS.length) {
    console.log(`\nWARNING: ${HOUSE_COCKTAILS.length - house.length} slug(s) matched nothing`)
  }

  // 3 — report the resulting spread
  const after = (await client.fetch(`*[defined(author)]{ author }`)) as Array<{ author: string }>
  const counts: Record<string, number> = {}
  for (const d of after) counts[d.author] = (counts[d.author] || 0) + 1
  console.log('\nauthor values now in use:')
  for (const [name, n] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}x  ${name}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
