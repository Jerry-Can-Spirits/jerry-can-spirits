/**
 * Set displayOrder on the ingredient styles where reading order differs from
 * alphabetical.
 *
 * The "Styles of" list falls back to alphabetical, which is right for most
 * families and wrong for three:
 *
 *   whisky   alphabetical leads with Islay Scotch and Penderyn Welsh, the two
 *            most obscure entries, and buries Bourbon and Scotch. Reading
 *            order puts the familiar first and the regional speciality after
 *            the region it belongs to.
 *   rum      light to heavy, which is also roughly least to most specialised.
 *            Cachaca last because it is not a rum: the page says so, and
 *            ending the list with it reinforces that rather than contradicting
 *            it.
 *   sherry   the dryness progression is the axis the whole category is
 *            organised on, and alphabetical scrambles it.
 *
 * Bitters and vermouth stay alphabetical: alphabetical already puts Angostura
 * first, and vermouth is two documents. Syrup s eighteen are flavours with no
 * natural progression.
 *
 * Idempotent. Re-running sets the same values.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

// Family -> slugs in reading order. Positions are derived from the array, so
// they cannot drift out of sequence.
const FAMILIES: Record<string, string[]> = {
  whisky: [
    "whiskey-bourbon",
    "whiskey-irish",
    "whiskey-rye",
    "whisky-scotch",
    "whisky-japanese",
    "islay-scotch-whisky",
    "penderyn",
  ],
  rum: ["white-rum", "aged-rum", "dark-rum", "spiced-rum", "overproof-rum", "blackstrap-rum", "cachaca"],
  sherry: ["manzanilla-sherry", "fino-sherry", "amontillado-sherry", "oloroso-sherry", "pedro-ximenez-sherry"],
}

const ORDER: Record<string, { parent: string; position: number }> = {}
for (const [parent, slugs] of Object.entries(FAMILIES)) {
  slugs.forEach((slug, i) => {
    ORDER[slug] = { parent, position: i + 1 }
  })
}

interface Doc {
  _id: string
  slug: string
  parent: string | null
  displayOrder: number | null
}

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const slugs = Object.keys(ORDER)
  const docs: Doc[] = await client.fetch(
    `*[_type=="ingredient" && slug.current in $slugs]{ _id, "slug": slug.current, "parent": parent->slug.current, displayOrder }`,
    { slugs }
  )
  const bySlug = new Map(docs.map((d) => [d.slug, d]))

  const missing = slugs.filter((s) => !bySlug.has(s))
  if (missing.length) {
    console.log(`  ABORT — these slugs do not exist: ${missing.join(', ')}`)
    process.exit(1)
  }

  // Ordering a document against a family it is not filed under would sort it
  // into a list it does not appear in.
  const misfiled = docs.filter((d) => d.parent !== ORDER[d.slug].parent)
  if (misfiled.length) {
    console.log(
      `  ABORT — filed under the wrong parent: ${misfiled
        .map((d) => `${d.slug} is under ${d.parent ?? 'nothing'}, expected ${ORDER[d.slug].parent}`)
        .join('; ')}`
    )
    process.exit(1)
  }

  // A family must also be ordered completely: a styled list where some entries
  // are positioned and others fall back to alphabetical interleaves the two.
  for (const [parent, wanted] of Object.entries(FAMILIES)) {
    const actual: Array<{ slug: string }> = await client.fetch(
      `*[_type=="ingredient" && parent->slug.current==$parent]{ "slug": slug.current }`,
      { parent }
    )
    const unordered = actual.map((d) => d.slug).filter((s) => !wanted.includes(s))
    if (unordered.length) {
      console.log(`  ABORT — /${parent} has styles with no position: ${unordered.join(', ')}`)
      process.exit(1)
    }
  }

  for (const [parent, wanted] of Object.entries(FAMILIES)) {
    console.log(`/${parent}`)
    wanted.forEach((slug, i) => {
      const doc = bySlug.get(slug)!
      const was = doc.displayOrder != null ? `  (was ${doc.displayOrder})` : ''
      console.log(`  ${String(i + 1).padStart(2)}  /${slug}${was}`)
    })
    console.log('')
  }

  console.log(`${slugs.length} document(s) ${WRITE ? 'written' : 'planned'}`)
  if (!WRITE) return

  for (const [slug, { position }] of Object.entries(ORDER)) {
    await client.patch(bySlug.get(slug)!._id).set({ displayOrder: position }).commit()
  }

  // Re-read rather than trusting the writes.
  let bad = 0
  for (const [parent, wanted] of Object.entries(FAMILIES)) {
    const after: Doc[] = await client.fetch(
      `*[_type=="ingredient" && parent->slug.current==$parent] | order(coalesce(displayOrder, 9999) asc, name asc){ _id, "slug": slug.current, "parent": parent->slug.current, displayOrder }`,
      { parent }
    )
    console.log(`\n  resulting order on /${parent}:`)
    after.forEach((d, i) => console.log(`    ${i + 1}. /${d.slug}  (displayOrder ${d.displayOrder ?? 'unset'})`))
    if (JSON.stringify(after.map((d) => d.slug)) !== JSON.stringify(wanted)) {
      console.log(`    MISMATCH — /${parent} will not render in the intended order`)
      bad++
    }
  }
  console.log(bad === 0 ? '\n  verified: every family renders in the intended order' : `\n  ${bad} MISMATCH(ES)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
