/**
 * Remove the Penderyn -> the-rise-of-english-whisky relatedGuides link.
 *
 * Penderyn is a Welsh single malt. The guide is about English whisky and the
 * English geographical indication, which does not cover Wales: 1,307 words of
 * body text with zero occurrences of Wales, Welsh or Penderyn, against 37 of
 * "English". Linking them is a category error, not a loose association.
 *
 * relatedGuides therefore drops to one document, blackstrap-rum. Penderyn joins
 * the correctly-empty majority, which records the real finding: no guide on
 * this site covers Welsh whisky.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const doc = (await client.fetch(
    `*[_type=="ingredient" && slug.current=="penderyn"][0]{ _id, "guides": relatedGuides[]{ "g": guide->slug.current, linkText } }`
  )) as { _id: string; guides: Array<{ g: string; linkText: string }> | null } | null

  if (!doc) {
    console.log('  penderyn not found')
    return
  }

  const guides = doc.guides ?? []
  console.log(`  /penderyn currently has ${guides.length} relatedGuides:`)
  guides.forEach((g) => console.log(`    - ${g.g}  "${g.linkText}"`))

  if (!guides.length) {
    console.log('\n  nothing to remove')
    return
  }

  console.log('\n  would unset relatedGuides entirely')
  if (WRITE) {
    await client.patch(doc._id).unset(['relatedGuides']).commit()
    console.log('  unset committed')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
