/**
 * Michelada is built on beer and was tagged non-alcoholic.
 *
 * Found while checking whether the non-alcoholic facet and the mocktails facet
 * describe the same drinks. They do: all ten mocktails are tagged
 * non-alcoholic, and the eleventh non-alcoholic recipe was this one, which
 * contains Mexican lager.
 *
 * The tag is wrong regardless of what it does to the count. It also put a beer
 * cocktail on a page a reader may be using to avoid alcohol entirely, which is
 * the kind of error that matters more than a miscount.
 *
 * A screen of all eleven for alcoholic ingredients found one other apparent
 * hit, Shirley Temple, which was a false positive: the pattern matched "ale"
 * inside "Ginger Ale". The remaining nine are clean.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const doc = (await client.fetch(
    `*[_type=="cocktail" && slug.current=="michelada"][0]{ _id, name, baseSpirit, family, "ing": ingredients[].name }`
  )) as { _id: string; name: string; baseSpirit: string; family: string; ing: string[] } | null

  if (!doc) {
    console.log('  ABORT — michelada not found')
    process.exit(1)
  }
  if (doc.baseSpirit !== 'non-alcoholic') {
    console.log(`  nothing to do — baseSpirit is already "${doc.baseSpirit}"`)
    return
  }

  console.log(`  ${doc.name}`)
  console.log(`    ingredients : ${doc.ing.join(', ')}`)
  console.log(`    baseSpirit  : ${doc.baseSpirit} -> beer`)
  console.log(`    family      : ${doc.family} (unchanged)`)
  console.log(`\n1 document ${WRITE ? 'written' : 'planned'}`)

  if (!WRITE) return
  await client.patch(doc._id).set({ baseSpirit: 'beer' }).commit()

  // Re-read rather than trusting the write, and confirm the facet counts move
  // the way they should.
  const after = (await client.fetch(
    `{"michelada": *[_type=="cocktail" && slug.current=="michelada"][0].baseSpirit, "na": count(*[_type=="cocktail" && baseSpirit=="non-alcoholic"]), "mock": count(*[_type=="cocktail" && family=="mocktails"])}`
  )) as { michelada: string; na: number; mock: number }

  console.log(`\n  michelada baseSpirit : ${after.michelada}`)
  console.log(`  non-alcoholic facet  : ${after.na}`)
  console.log(`  mocktails facet      : ${after.mock}`)
  console.log(
    after.michelada === 'beer' && after.na === after.mock
      ? '\n  verified: the two facets now describe the same set'
      : '\n  PROBLEM — counts do not reconcile'
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
