/**
 * Clear the affiliate-storefront fields from ingredient and equipment documents.
 *
 * WHY. The Field Manual carried a complete affiliate shop that was built and
 * never switched on: budget and premium tiers, prices, calorie counts, product
 * photography, an "Order" button, and a schema field whose own description read
 * "Master of Malt affiliate link for budget option" in a repo whose CLAUDE.md
 * states there is no relationship with Master of Malt.
 *
 * MEASURED 21 August 2026: 135 ingredient pages and all 72 equipment pages
 * carried a priceRange; 51 carried brand photography, none of it with alt text;
 * 28 carried calorie counts. Not one link was ever populated.
 *
 * What was wrong with keeping it:
 *
 *   The link markup emitted rel="noopener noreferrer sponsored", which declares
 *   to search engines that a link is paid. It was harmless only because no link
 *   existed; the first editor to fill one in would have published a declaration
 *   of a relationship we do not have. That is the mirror image of the rule in
 *   docs/PROVENANCE_CHECKLIST.md, which says a disclosure describing a
 *   relationship we do not have is as inaccurate as an undisclosed one we do.
 *
 *   267 price numbers carried no currency field, no date, no source and no
 *   owner, and rendered as an authoritative "~£5". Our own RRP moved from £35 to
 *   £45 on 3 August, which is the proof that prices move and that nothing here
 *   tracked it. A stale price is a misstatement about someone else's product.
 *
 * The editorial recommendation stays. "Which bottle should I buy" is a question
 * a Field Manual should answer, and the best entries already answer it well.
 * What goes is the shop around it.
 *
 * The image assets are unset from the documents, not deleted from the asset
 * library, so this is reversible.
 *
 * Dry run by default; --write executes.
 *
 * Run: npx sanity exec scripts/retire-storefront-fields.ts --with-user-token
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const INGREDIENT_PATHS = [
  'priceRange',
  'budgetImage',
  'premiumImage',
  'recommendedBrands.budgetLink',
  'recommendedBrands.premiumLink',
  'recommendedBrands.budgetNutrition',
  'recommendedBrands.premiumNutrition',
]

const EQUIPMENT_PATHS = ['priceRange', 'budgetLink', 'premiumLink', 'budgetImage', 'premiumImage']

interface Doc {
  _id: string
  name: string
  present: string[]
}

/**
 * Which of the retiring paths a document actually carries.
 *
 * Asked as one defined() per path rather than through select(), which returns
 * only its first match and would under-report a document carrying several.
 */
async function collect(type: string, paths: string[]): Promise<Doc[]> {
  const rows = await client.fetch<Array<{ _id: string; name: string } & Record<string, boolean>>>(
    `*[_type == $type && !(_id in path("drafts.**"))]{ _id, name, ${paths
      .map((p, i) => `"p${i}": defined(${p})`)
      .join(', ')} }`,
    { type }
  )
  return rows
    .map((r) => ({
      _id: r._id,
      name: r.name,
      present: paths.filter((_, i) => r[`p${i}`]),
    }))
    .filter((d) => d.present.length)
}

async function run(type: string, paths: string[]) {
  const docs = await collect(type, paths)
  const perPath = new Map<string, number>()
  for (const d of docs) for (const p of d.present) perPath.set(p, (perPath.get(p) ?? 0) + 1)

  console.log(`\n=== ${type.toUpperCase()} (${docs.length} document(s) carry at least one) ===`)
  for (const p of paths) console.log(`  ${String(perPath.get(p) ?? 0).padStart(4)}  ${p}`)

  if (!WRITE) return docs.length

  for (const d of docs) {
    await client.patch(d._id).unset(d.present).commit()
  }
  console.log(`  cleared on ${docs.length} document(s)`)
  return docs.length
}

async function main() {
  const a = await run('ingredient', INGREDIENT_PATHS)
  const b = await run('equipment', EQUIPMENT_PATHS)
  console.log(
    WRITE
      ? `\nWRITTEN. ${a + b} document(s) cleared.`
      : `\nDRY RUN. Nothing written. ${a + b} document(s) would be cleared. Pass --write.`
  )
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
