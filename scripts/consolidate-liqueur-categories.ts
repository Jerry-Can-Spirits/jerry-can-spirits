/**
 * Fold creme-liqueurs and anise-herbal into liqueurs.
 *
 * The ingredient hub is moving from an invisible grouping to visible category
 * headings, which makes the cost of over-splitting visible too. MEASURED, both
 * categories hold four documents against a 278-document corpus — 1.4% each —
 * and both are subdivisions of a group that already exists. Rendering "Crème
 * Liqueurs" and "Anise & Herbal Liqueurs" as top-level headings alongside
 * "Liqueurs" would undermine the point of having headings at all.
 *
 * The distinction is not lost. Every one of these documents keeps its own page,
 * its description, and its links; only the shelf it is filed on changes.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const FOLD_INTO_LIQUEURS = ['creme-liqueurs', 'anise-herbal']
const TARGET = 'liqueurs'

interface Doc {
  _id: string
  slug: string
  name: string
  category: string
}

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const before: Doc[] = await client.fetch(
    `*[_type=="ingredient" && category in $cats] | order(category asc, name asc){ _id, "slug": slug.current, name, category }`,
    { cats: FOLD_INTO_LIQUEURS }
  )

  const liqueursBefore: number = await client.fetch(`count(*[_type=="ingredient" && category==$c])`, { c: TARGET })
  const totalBefore: number = await client.fetch(`count(*[_type=="ingredient"])`)

  if (!before.length) {
    console.log('  nothing to move — both categories are already empty')
    return
  }

  for (const doc of before) {
    console.log(`  ${doc.category.padEnd(15)} -> ${TARGET}   ${doc.name}  (/${doc.slug})`)
  }

  console.log(`\n  ${TARGET} before: ${liqueursBefore}`)
  console.log(`  moving:          ${before.length}`)
  console.log(`  ${TARGET} after:  ${liqueursBefore + before.length} (expected)`)
  console.log(`\n${before.length} document(s) ${WRITE ? 'written' : 'planned'}`)

  if (!WRITE) return

  for (const doc of before) {
    await client.patch(doc._id).set({ category: TARGET }).commit()
  }

  // Re-read rather than trusting the writes. The corpus total must not move:
  // this is a reassignment, not a deletion.
  const stragglers: number = await client.fetch(`count(*[_type=="ingredient" && category in $cats])`, {
    cats: FOLD_INTO_LIQUEURS,
  })
  const liqueursAfter: number = await client.fetch(`count(*[_type=="ingredient" && category==$c])`, { c: TARGET })
  const totalAfter: number = await client.fetch(`count(*[_type=="ingredient"])`)

  console.log(`\n  ${TARGET}: ${liqueursBefore} -> ${liqueursAfter}`)
  console.log(`  remaining in the folded categories: ${stragglers}`)
  console.log(`  corpus total: ${totalBefore} -> ${totalAfter}`)

  const ok = stragglers === 0 && liqueursAfter === liqueursBefore + before.length && totalAfter === totalBefore
  console.log(ok ? '\n  verified: every document moved, none lost' : '\n  PROBLEM — the counts do not reconcile')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
