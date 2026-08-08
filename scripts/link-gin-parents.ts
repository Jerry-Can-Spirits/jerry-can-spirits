/**
 * Put the gin styles on the gin family tree.
 *
 * The typed `parent` reference already exists on ingredients; none of the gin
 * sub-types had one set, which is why the ingredient pages showed no lineage.
 *
 * Sloe Gin is included deliberately, and keeps `category: liqueurs`. It is not
 * a style of gin and is not a member of the gin facet — two of its four
 * cocktails contain no gin at all — but it IS made from gin, so the family tree
 * is exactly where that relationship is true. The split is the point: taxonomy
 * on the ingredient side, membership on the facet side.
 *
 * Genever is absent on purpose. Gin descends FROM genever, so pointing genever
 * at gin as its parent inverts the history.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const PARENT_SLUG = 'gin'
const CHILD_SLUGS = ['london-dry-gin', 'old-tom-gin', 'navy-strength-gin', 'plymouth-gin', 'sloe-gin']

async function main() {
  const parent = await client.fetch<{ _id: string; name: string } | null>(
    `*[_type == "ingredient" && slug.current == $s][0]{ _id, name }`,
    { s: PARENT_SLUG }
  )
  if (!parent) throw new Error(`No ingredient with slug "${PARENT_SLUG}"`)
  console.log(`Parent: ${parent.name} (${parent._id})\n`)

  const children = await client.fetch<Array<{ _id: string; name: string; slug: string; category: string; parentId: string | null }>>(
    `*[_type == "ingredient" && slug.current in $s]{ _id, name, "slug": slug.current, category, "parentId": parent._ref }`,
    { s: CHILD_SLUGS }
  )

  const missing = CHILD_SLUGS.filter((s) => !children.some((c) => c.slug === s))
  if (missing.length) console.log(`Not present, skipped: ${missing.join(', ')}\n`)

  let changed = 0
  for (const c of children) {
    if (c.parentId === parent._id) {
      console.log(`  --   ${c.name.padEnd(22)} already parented`)
      continue
    }
    changed++
    console.log(`  SET  ${c.name.padEnd(22)} parent -> ${parent.name}   (category stays "${c.category}")`)
    if (WRITE) {
      await client.patch(c._id).set({ parent: { _type: 'reference', _ref: parent._id } }).commit()
    }
  }

  console.log(`\n${changed} to change.`)
  console.log(WRITE ? 'WRITTEN.' : 'DRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
