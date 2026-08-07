/**
 * Set displayOrder on the whisky styles.
 *
 * The "Styles of" list falls back to alphabetical, which is right for most
 * families and wrong for whisky: it leads with Islay Scotch and Penderyn
 * Welsh, the two most obscure entries, and buries Bourbon and Scotch below
 * them. Reading order puts the styles someone is most likely to have heard of
 * first, and the regional speciality after the region it belongs to.
 *
 * Only families where reading order genuinely differs from alphabetical are
 * populated. Syrup's eighteen are a flat list of flavours with no natural
 * progression, and bitters, vermouth and sherry are small enough that
 * alphabetical costs a reader nothing.
 *
 * Rum is deliberately absent pending confirmation of the proposed order.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

// Slug -> position. Contiguous from 1 so a gap is visible as a mistake.
const ORDER: Record<string, number> = {
  'whiskey-bourbon': 1,
  'whiskey-irish': 2,
  'whiskey-rye': 3,
  'whisky-scotch': 4,
  'whisky-japanese': 5,
  'islay-scotch-whisky': 6,
  penderyn: 7,
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

  // Ordering a document that is not filed under the family it is being ordered
  // within would sort it against a list it is not in.
  const orphaned = docs.filter((d) => d.parent !== 'whisky')
  if (orphaned.length) {
    console.log(`  ABORT — not filed under whisky: ${orphaned.map((d) => `${d.slug} (${d.parent ?? 'no parent'})`).join(', ')}`)
    process.exit(1)
  }

  const positions = Object.values(ORDER).sort((a, b) => a - b)
  const expected = positions.map((_, i) => i + 1)
  if (JSON.stringify(positions) !== JSON.stringify(expected)) {
    console.log(`  ABORT — positions are not contiguous from 1: ${positions.join(', ')}`)
    process.exit(1)
  }

  for (const [slug, position] of Object.entries(ORDER)) {
    const doc = bySlug.get(slug)!
    console.log(`  ${String(position).padStart(2)}  /${slug}${doc.displayOrder != null ? `  (was ${doc.displayOrder})` : ''}`)
  }

  console.log(`\n${slugs.length} document(s) ${WRITE ? 'written' : 'planned'}`)
  if (!WRITE) return

  for (const [slug, position] of Object.entries(ORDER)) {
    await client.patch(bySlug.get(slug)!._id).set({ displayOrder: position }).commit()
  }

  // Re-read rather than trusting the writes.
  const after: Doc[] = await client.fetch(
    `*[_type=="ingredient" && parent->slug.current=="whisky"] | order(coalesce(displayOrder, 9999) asc, name asc){ _id, "slug": slug.current, "parent": parent->slug.current, displayOrder }`
  )
  console.log('\n  resulting order on the whisky page:')
  after.forEach((d, i) => console.log(`    ${i + 1}. /${d.slug}  (displayOrder ${d.displayOrder ?? 'unset'})`))

  const actual = after.map((d) => d.slug)
  const wanted = Object.entries(ORDER)
    .sort((a, b) => a[1] - b[1])
    .map(([s]) => s)
  console.log(
    JSON.stringify(actual) === JSON.stringify(wanted)
      ? '\n  verified: renders in the intended order'
      : '\n  MISMATCH — the page will not render in the intended order'
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
