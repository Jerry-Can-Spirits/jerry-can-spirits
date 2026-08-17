/**
 * Repair the 22ml truncation.
 *
 * Three quarters of a US ounce is 22.18ml, which converts to 22.5ml. Somewhere
 * upstream it was truncated to 22ml, a measure that converts from nothing and
 * that no jigger carries. MEASURED 2026-08-16: all 62 recipe lines reading
 * "22ml" sit on unattributed pages, and every one of the 14 IBA-attributed
 * pages in the same territory reads 22.5ml. The attributed pages are the
 * control: they show what the number should have been.
 *
 * This is a data repair rather than a recipe change. The drink is unaffected —
 * a third of a millilitre is below the resolution of any jigger — and the
 * measure becomes one that exists.
 *
 * Variants are included, because the truncation is in the same data. Ratio
 * variants are safe: the Martini ladder expresses its ratios in 66/9, 68/7 and
 * the like, and none of those is 22.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const TRUNCATED = /^22\s*ml$/i
const CORRECTED = '22.5ml'

interface Line {
  _key: string
  amount?: string
  name?: string
}
interface Variant {
  _key: string
  name?: string
  ingredients?: Line[]
}
interface Doc {
  _id: string
  name: string
  authority: string | null
  ingredients?: Line[]
  variants?: Variant[]
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && !(_id in path("drafts.**"))]{
      _id, name, "authority": recipeSource.authority,
      ingredients[]{ _key, name, amount },
      variants[]{ _key, name, ingredients[]{ _key, name, amount } }
    } | order(name asc)`
  )

  const planned: Array<{ doc: Doc; patches: Record<string, string>; described: string[] }> = []
  let lines = 0

  for (const doc of docs) {
    const patches: Record<string, string> = {}
    const described: string[] = []

    ;(doc.ingredients ?? []).forEach((l, i) => {
      if (!TRUNCATED.test((l.amount ?? '').trim())) return
      patches[`ingredients[${i}].amount`] = CORRECTED
      described.push(`  ${l.name}: ${l.amount} -> ${CORRECTED}`)
    })
    ;(doc.variants ?? []).forEach((v, vi) => {
      ;(v.ingredients ?? []).forEach((l, i) => {
        if (!TRUNCATED.test((l.amount ?? '').trim())) return
        patches[`variants[${vi}].ingredients[${i}].amount`] = CORRECTED
        described.push(`  [${v.name}] ${l.name}: ${l.amount} -> ${CORRECTED}`)
      })
    })

    if (!Object.keys(patches).length) continue
    lines += described.length
    planned.push({ doc, patches, described })
  }

  // An attribution covers the main recipe, which is the published
  // specification and is not ours to rescale. It does not cover the variants:
  // a variant exists because it is our build rather than the source's, so its
  // measures are ours to correct. The Jungle Bird proves the point — its
  // attributed recipe already reads 22.5ml Campari while its Blackstrap
  // variant reads 22ml, so the truncation contradicts the page it sits on.
  const blocked = planned.filter(
    (p) => p.doc.authority && Object.keys(p.patches).some((k) => k.startsWith('ingredients['))
  )
  console.log(`${planned.length} page(s), ${lines} line(s) reading 22ml.\n`)

  for (const p of planned) {
    console.log(`${p.doc.name}${p.doc.authority ? `  [ATTRIBUTED: ${p.doc.authority}]` : ''}`)
    for (const d of p.described) console.log(d)
  }

  if (blocked.length) {
    console.log(
      `\nSTOP. ${blocked.length} attributed page(s) carry 22ml in the main recipe, which is the`
    )
    console.log('published specification and is not ours to correct. Resolve those by hand first.')
    for (const p of blocked) console.log(`  ${p.doc.name}`)
    return
  }

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  for (const p of planned) {
    await client.patch(p.doc._id).set(p.patches).commit()
  }
  console.log(`\nWRITTEN. ${lines} line(s) across ${planned.length} page(s).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
