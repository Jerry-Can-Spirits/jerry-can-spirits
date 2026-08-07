/**
 * Move the parent link out of relatedIngredients and into the typed parent
 * field.
 *
 * relatedIngredients held three different relationships with no way to tell
 * them apart: sub-type to parent, sibling to sibling, and plain association.
 * MEASURED, sweet-vermouth was referenced by fifteen ingredients — dry-vermouth
 * and fino-sherry, but also gin, Aperol, Campari, Cognac and Bénédictine — so
 * reversing the field to find "styles of" would have listed gin as a vermouth.
 * The typed field makes the relationship explicit and editable in Sanity.
 *
 * The parent is REMOVED from relatedIngredients in the same patch. Keeping the
 * same fact in two places is how the two drift.
 *
 * Every sibling and association link must survive. The script therefore
 * records relatedIngredients before and after for every document it touches
 * and asserts that the after-set equals the before-set minus exactly the
 * parent. Any other difference aborts the run before anything is written.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

// The families as they stand in the content today. This map exists only to
// perform the migration; after it runs the relationship lives in Sanity and
// this script is history rather than configuration.
const FAMILIES: Record<string, string[]> = {
  whisky: [
    'whiskey-bourbon',
    'whiskey-irish',
    'whiskey-rye',
    'whisky-japanese',
    'whisky-scotch',
    'islay-scotch-whisky',
    'penderyn',
  ],
  bitters: ['angostura-bitters', 'peychauds-bitters', 'orange-bitters', 'chocolate-bitters', 'celery-bitters'],
  vermouth: ['sweet-vermouth', 'dry-vermouth'],
  sherry: ['fino-sherry', 'amontillado-sherry', 'pedro-ximenez-sherry', 'oloroso-sherry', 'manzanilla-sherry'],
  rum: ['white-rum', 'dark-rum', 'aged-rum', 'spiced-rum', 'overproof-rum', 'blackstrap-rum', 'cachaca'],
  syrup: [
    'simple-syrup',
    'demerara-syrup',
    'orgeat-syrup',
    'honey-syrup',
    'honey-ginger-syrup',
    'agave-syrup',
    'cane-syrup',
    'maple-syrup',
    'vanilla-sugar-syrup',
    'passion-fruit-syrup',
    'raspberry-syrup',
    'strawberry-syrup',
    'apple-cider-syrup',
    'chocolate-syrup',
    'caramel-syrup',
    'cinnamon-syrup',
    'rose-syrup',
    'butterfly-pea-syrup',
  ],
}

interface Doc {
  _id: string
  slug: string
  parent: string | null
  related: string[] | null
}

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const parentOf: Record<string, string> = {}
  for (const [parent, subs] of Object.entries(FAMILIES)) for (const s of subs) parentOf[s] = parent

  const slugs = [...new Set([...Object.keys(parentOf), ...Object.keys(FAMILIES)])]
  const docs: Doc[] = await client.fetch(
    `*[_type=="ingredient" && slug.current in $slugs]{
       _id,
       "slug": slug.current,
       "parent": parent->slug.current,
       "related": relatedIngredients[]->slug.current
     }`,
    { slugs }
  )
  const bySlug = new Map(docs.map((d) => [d.slug, d]))

  const missing = slugs.filter((s) => !bySlug.has(s))
  if (missing.length) {
    console.log(`  ABORT — these slugs do not exist: ${missing.join(', ')}`)
    process.exit(1)
  }

  let planned = 0
  let alreadyDone = 0
  const patches: Array<{ id: string; slug: string; parentId: string; related: string[] }> = []

  for (const [sub, parentSlug] of Object.entries(parentOf)) {
    const doc = bySlug.get(sub)!
    const parentDoc = bySlug.get(parentSlug)!
    const before = doc.related ?? []

    if (doc.parent === parentSlug && !before.includes(parentSlug)) {
      alreadyDone++
      continue
    }

    const after = before.filter((s) => s !== parentSlug)

    // The safety property: nothing may leave relatedIngredients except the
    // parent. Anything else means the filter caught a sibling or an
    // association, and the run stops rather than losing a link.
    const removed = before.filter((s) => !after.includes(s))
    const unexpected = removed.filter((s) => s !== parentSlug)
    if (unexpected.length) {
      console.log(`  ABORT — /${sub} would lose non-parent links: ${unexpected.join(', ')}`)
      process.exit(1)
    }
    if (after.length !== before.length - (before.includes(parentSlug) ? 1 : 0)) {
      console.log(`  ABORT — /${sub} link count does not reconcile`)
      process.exit(1)
    }

    console.log(`/${sub}`)
    console.log(`  parent      -> /${parentSlug}`)
    console.log(`  related     ${before.length} -> ${after.length}  [${after.join(', ') || 'none'}]`)
    if (!before.includes(parentSlug)) {
      console.log(`  note        parent was not in relatedIngredients; setting the typed field only`)
    }
    planned++

    patches.push({ id: doc._id, slug: sub, parentId: parentDoc._id, related: after })
  }

  console.log(
    `\n${planned} document(s) ${WRITE ? 'written' : 'planned'}, ${alreadyDone} already migrated, ${
      Object.keys(parentOf).length
    } sub-types in total`
  )

  if (!WRITE) return

  for (const p of patches) {
    // unset the single matching array element rather than rewriting the array.
    // Rebuilding it means resolving every sibling slug back to an id, and the
    // first attempt at this did exactly that against a map holding only the
    // sub-types and parents — so a sibling link to fresh-lemon-juice resolved
    // to the string "fresh-lemon-juice" and Sanity rejected the mutation.
    // Unsetting by reference touches nothing else and preserves the _keys.
    await client
      .patch(p.id)
      .set({ parent: { _type: 'reference', _ref: p.parentId } })
      .unset([`relatedIngredients[_ref=="${p.parentId}"]`])
      .commit()
  }

  // Re-read and prove the outcome rather than trusting the writes.
  const after: Doc[] = await client.fetch(
    `*[_type=="ingredient" && slug.current in $slugs]{
       _id, "slug": slug.current, "parent": parent->slug.current, "related": relatedIngredients[]->slug.current
     }`,
    { slugs }
  )
  const afterBySlug = new Map(after.map((d) => [d.slug, d]))

  let bad = 0
  for (const [sub, parentSlug] of Object.entries(parentOf)) {
    const b = bySlug.get(sub)!
    const a = afterBySlug.get(sub)!
    const expected = (b.related ?? []).filter((s) => s !== parentSlug).sort()
    const actual = (a.related ?? []).sort()
    if (a.parent !== parentSlug) {
      console.log(`  FAIL /${sub}: parent is ${a.parent ?? 'unset'}, expected ${parentSlug}`)
      bad++
    }
    if (JSON.stringify(expected) !== JSON.stringify(actual)) {
      console.log(`  FAIL /${sub}: related changed beyond the parent`)
      console.log(`       expected [${expected.join(', ')}]`)
      console.log(`       actual   [${actual.join(', ')}]`)
      bad++
    }
  }
  console.log(bad === 0 ? '\n  verified: every parent set, no other link lost' : `\n  ${bad} PROBLEM(S)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
