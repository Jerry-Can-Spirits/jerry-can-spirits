/**
 * Assign gin styles to the cocktails that carry baseSpirit "gin".
 *
 * MEASURED 7 Aug 2026: 72 cocktails, of which 25 already name a style in their
 * own ingredient list and 47 name only "gin". The 25 are evidence and are read
 * from the data. The 47 are an editorial decision, approved in blocks, and are
 * encoded below by name so the dry run can be reviewed against them.
 *
 * Three casings of one style exist — "London Dry Gin" (7), "London dry gin" (6),
 * "London Dry gin" (2) — and are normalised to one.
 *
 * SCOPE. This sets baseSpirit, normalises the casing of an ingredient line that
 * ALREADY names a style, and repoints ingredientRef at the matching ingredient
 * document. It does NOT rewrite a recipe that says "Gin" into one that says
 * "London Dry Gin": that changes what the recipe tells a reader to buy, and is
 * an editorial pass rather than a migration.
 *
 * Sloe gin cocktails move to "liqueur". Sloe gin is a liqueur at 15-30% doing a
 * modifier's job, and two of the three contain no gin at all, so they do not
 * belong on the gin page.
 *
 * Plymouth has no ingredient document yet, so those two get baseSpirit only and
 * their ingredient lines are left alone.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Style slug -> the ingredient document slug that should be referenced. */
const STYLE_DOC: Record<string, string> = {
  'london-dry-gin': 'london-dry-gin',
  'old-tom-gin': 'old-tom-gin',
  'navy-strength-gin': 'navy-strength-gin',
  genever: 'genever',
}

/** Canonical ingredient-line text for each style, to settle the casing drift. */
const CANONICAL_NAME: Record<string, string> = {
  'london-dry-gin': 'London Dry Gin',
  'old-tom-gin': 'Old Tom Gin',
  'navy-strength-gin': 'Navy Strength Gin',
  genever: 'Genever',
}

/** An ingredient line that names a style, matched whole rather than loosely. */
const EVIDENCE: Array<{ re: RegExp; style: string }> = [
  { re: /^london\s+dry\s+gin$/i, style: 'london-dry-gin' },
  { re: /^old\s+tom\s+gin$/i, style: 'old-tom-gin' },
  { re: /^navy\s+strength\s+gin$/i, style: 'navy-strength-gin' },
  { re: /^plymouth\s+gin$/i, style: 'plymouth-gin' },
  { re: /^genever$/i, style: 'genever' },
  { re: /^sloe\s+gin$/i, style: 'liqueur' },
]

/** Approved decisions for cocktails whose recipe names no style. */
const DECIDED: Record<string, string> = {
  // Royal Navy heritage, and where Plymouth enters the Field Manual.
  'Pink Gin': 'plymouth-gin',
  Gimlet: 'plymouth-gin',
  // A Jerry Thomas-era build: curacao and Angostura, in the old-fashioneds
  // family. Diffords puts this on genever; Dan's ruling is Old Tom.
  'Gin Cocktail': 'old-tom-gin',
}

/**
 * Left as plain "gin" on purpose.
 *
 * A provenance is not a style, an infusion is a preparation, and a modern house
 * drink that names no style is not improved by inventing one for it.
 */
const LEAVE_GENERIC = new Set([
  'The Daffodil', // "Welsh gin" is where it is made, not what it is
  'Earl Grey MarTEAni', // "Earl Grey-Infused Gin" is a preparation over some base
  'Banana Calling',
  'Comte de Sureau',
  'Cucumber & Elderflower G&T',
  "Witch's Brew",
])

/** Everything else that names no style. Approved in block. */
const DEFAULT_STYLE = 'london-dry-gin'

interface Ing {
  _key: string
  name: string | null
  refId: string | null
}
interface Doc {
  _id: string
  name: string
  baseSpirit: string
  ingredients: Ing[] | null
}

async function main() {
  const docIds = await client.fetch<Record<string, string>>(
    `{${Object.values(STYLE_DOC)
      .map((s) => `"${s}": *[_type == "ingredient" && slug.current == "${s}"][0]._id`)
      .join(',')}}`
  )
  console.log('Ingredient documents resolved:')
  for (const [slug, id] of Object.entries(docIds)) {
    console.log(`  ${slug.padEnd(22)} ${id ?? 'MISSING — refs will be skipped'}`)
  }

  const docs = await client.fetch<Doc[]>(`
    *[_type == "cocktail" && baseSpirit == "gin"]{
      _id, name, baseSpirit,
      "ingredients": ingredients[]{ _key, name, "refId": ingredientRef._ref }
    } | order(name asc)
  `)

  console.log(`\n${docs.length} cocktails carry baseSpirit "gin".\n`)

  let changed = 0
  let unchanged = 0
  const tally = new Map<string, number>()

  for (const doc of docs) {
    const ings = doc.ingredients ?? []

    // Evidence first: what does the recipe itself name?
    let style: string | null = null
    let evidenceKey: string | null = null
    for (const ing of ings) {
      const hit = EVIDENCE.find((e) => e.re.test((ing.name ?? '').trim()))
      if (hit) {
        style = hit.style
        evidenceKey = ing._key
        break
      }
    }

    const source = style ? 'EVIDENCE' : DECIDED[doc.name] ? 'DECIDED' : LEAVE_GENERIC.has(doc.name) ? 'GENERIC' : 'DEFAULT'
    if (!style) {
      if (LEAVE_GENERIC.has(doc.name)) {
        unchanged++
        console.log(`  --      ${doc.name.padEnd(30)} stays "gin" (${source})`)
        continue
      }
      style = DECIDED[doc.name] ?? DEFAULT_STYLE
    }

    const patch: Record<string, unknown> = {}
    if (doc.baseSpirit !== style) patch.baseSpirit = style

    // Casing and reference, only where the line already names the style.
    if (evidenceKey && CANONICAL_NAME[style]) {
      const ing = ings.find((i) => i._key === evidenceKey)!
      if (ing.name !== CANONICAL_NAME[style]) {
        patch[`ingredients[_key=="${evidenceKey}"].name`] = CANONICAL_NAME[style]
      }
      const wantId = docIds[STYLE_DOC[style]]
      if (wantId && ing.refId !== wantId) {
        patch[`ingredients[_key=="${evidenceKey}"].ingredientRef`] = { _type: 'reference', _ref: wantId }
      }
    }

    if (Object.keys(patch).length === 0) {
      unchanged++
      continue
    }

    changed++
    tally.set(style, (tally.get(style) ?? 0) + 1)
    console.log(`  ${source.padEnd(8)} ${doc.name.padEnd(30)} -> ${style}`)
    for (const [k, v] of Object.entries(patch)) {
      if (k !== 'baseSpirit') console.log(`             ${k} = ${JSON.stringify(v)}`)
    }

    if (WRITE) {
      await client.patch(doc._id).set(patch).commit()
    }
  }

  console.log(`\n${changed} to change, ${unchanged} already correct or deliberately left.`)
  console.log('Totals by style:')
  for (const [style, n] of [...tally.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${style.padEnd(22)} ${n}`)
  }
  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
