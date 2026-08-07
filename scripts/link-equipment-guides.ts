/**
 * Link equipment pages to the guides that actually cover them.
 *
 * MEASURED: 59 of 72 equipment documents had no relatedGuides. The template
 * has always rendered a guides section and the query has always fetched it, so
 * this was a content gap rather than a missing feature.
 *
 * The mapping is by subject, not by frequency. A guide that USES an item is not
 * coverage of it: a recipe says "strain into a rocks glass" and an explanation
 * says it once, so ranking by word count puts every seasonal recipe guide above
 * the glassware guide for every glass. Five guides do the covering work here,
 * and only those are used.
 *
 * Frequency also proposed two links that a word-boundary match could not rule
 * out and only reading could: the Blender page to a distillery history, because
 * Joy Spence is Appleton's master blender, and the Bitters Bottle page to a
 * paragraph about the size of the Angostura label. Neither is in this map.
 *
 * The other 48 stay empty. An empty field is an honest record of a gap; a
 * padded one teaches readers the links are not worth following. They are logged
 * to the content-gap brief instead, glassware especially: 27 glassware pages
 * rest on one guide, and "what glass for a negroni" is a question people ask.
 *
 * Appends rather than replaces, and skips a guide already linked, so re-running
 * cannot duplicate or overwrite.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Equipment slug -> guide slugs whose subject is that equipment. */
const LINKS: Record<string, string[]> = {
  // Buying guidance with prices and selection criteria, not passing use.
  jigger: ['barware-worth-investing-in', 'essential-home-bar-setup', 'complete-guide-cocktail-making'],
  'japanese-jigger': ['barware-worth-investing-in', 'essential-home-bar-setup'],

  // The garnish guide explains each of these as a tool, including technique.
  'cocktail-picks': ['garnishing-like-a-pro'],
  'citrus-zester': ['garnishing-like-a-pro'],
  'cutting-board': ['garnishing-like-a-pro'],

  // The glassware guide is the only document that explains glasses rather than
  // pouring drinks into them.
  'rocks-glass': ['glassware-guide'],
  'martini-glass': ['glassware-guide'],
  'shot-glass': ['glassware-guide'],
  'punch-cup': ['glassware-guide'],
  'hurricane-glass': ['glassware-guide'],
}

interface EquipDoc {
  _id: string
  slug: string
  name: string
  existing: string[] | null
}

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const equipSlugs = Object.keys(LINKS)
  const guideSlugs = [...new Set(Object.values(LINKS).flat())]

  const equipment: EquipDoc[] = await client.fetch(
    `*[_type=="equipment" && slug.current in $slugs]{ _id, "slug": slug.current, name, "existing": relatedGuides[].guide->slug.current }`,
    { slugs: equipSlugs }
  )
  const guides: Array<{ _id: string; slug: string }> = await client.fetch(
    `*[_type=="guide" && slug.current in $slugs]{ _id, "slug": slug.current }`,
    { slugs: guideSlugs }
  )

  const byEquip = new Map(equipment.map((d) => [d.slug, d]))
  const byGuide = new Map(guides.map((d) => [d.slug, d]))

  // Refuse to run on a partial resolution. A silently skipped link looks like a
  // completed pass.
  const missing = [
    ...equipSlugs.filter((s) => !byEquip.has(s)).map((s) => `equipment/${s}`),
    ...guideSlugs.filter((s) => !byGuide.has(s)).map((s) => `guide/${s}`),
  ]
  if (missing.length) {
    console.log(`  ABORT — these slugs did not resolve: ${missing.join(', ')}`)
    process.exit(1)
  }

  let planned = 0
  const patches: Array<{ id: string; slug: string; add: string[] }> = []

  for (const [equipSlug, wantedGuides] of Object.entries(LINKS)) {
    const doc = byEquip.get(equipSlug)!
    const already = new Set(doc.existing ?? [])
    const add = wantedGuides.filter((g) => !already.has(g))

    console.log(`/${equipSlug}  (${(doc.existing ?? []).length} existing)`)
    if (!add.length) {
      console.log('  nothing to add\n')
      continue
    }
    add.forEach((g) => console.log(`  + /guides/${g}/`))
    console.log('')
    planned += add.length
    patches.push({ id: doc._id, slug: equipSlug, add })
  }

  console.log(`${planned} link(s) ${WRITE ? 'written' : 'planned'} across ${patches.length} document(s)`)
  if (!WRITE) return

  for (const p of patches) {
    await client
      .patch(p.id)
      .setIfMissing({ relatedGuides: [] })
      .insert(
        'after',
        'relatedGuides[-1]',
        p.add.map((g) => ({
          _type: 'guideLink',
          _key: `guide-${g}`,
          guide: { _type: 'reference', _ref: byGuide.get(g)!._id },
        }))
      )
      .commit()
  }

  // Re-read rather than trusting the writes.
  const after: EquipDoc[] = await client.fetch(
    `*[_type=="equipment" && slug.current in $slugs]{ _id, "slug": slug.current, name, "existing": relatedGuides[].guide->slug.current }`,
    { slugs: equipSlugs }
  )
  let bad = 0
  console.log('')
  for (const d of after) {
    const want = LINKS[d.slug]
    const got = d.existing ?? []
    const ok = want.every((g) => got.includes(g))
    console.log(`  ${ok ? 'ok  ' : 'FAIL'} /${d.slug}: ${got.join(', ') || 'none'}`)
    if (!ok) bad++
  }

  const total: number = await client.fetch(`count(*[_type=="equipment" && count(relatedGuides) > 0])`)
  console.log(`\n  equipment with at least one guide: ${total} of 72`)
  console.log(bad === 0 ? '  verified: every intended link is present' : `  ${bad} PROBLEM(S)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
