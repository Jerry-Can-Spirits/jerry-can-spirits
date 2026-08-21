/**
 * Point generic mixer lines at generic ingredient pages rather than branded ones.
 *
 * WHY. Every recipe line calling for soda water, ginger beer, cola, lemonade,
 * tonic or grapefruit soda was wired to a Fever-Tree product page. MEASURED
 * 21 August 2026: 61 lines in main recipes, and not one of them named a brand.
 * A reader clicking "Soda water" in a Mojito landed on a Fever-Tree page.
 *
 * Three things were wrong with that. It reads as paid placement, and there is
 * no commercial relationship to place — CLAUDE.md and the provenance checklist
 * are explicit that no affiliate programme exists and no disclosure should be
 * published implying one. It was inconsistent: cola pointed five ways at the
 * brand and twice at the generic page, ginger ale twice and once. And it
 * orphaned the generic pages, so Soda Water, Ginger Beer, Tonic Water and
 * Lemonade sat at zero references while being among the most-poured mixers on
 * the site.
 *
 * The branded pages stay live and unchanged. Somebody searching for a specific
 * tonic should still find it; they should not arrive there from a recipe that
 * never named it.
 *
 * TWO TRAPS THIS SCRIPT KNOWS ABOUT.
 *
 * Soda water and sparkling water are not the same page. Soda water carries
 * added mineral salts and sparkling water does not, a distinction the two pages
 * were corrected to agree on during the August reference pass. Both were wired
 * to the same Fever-Tree soda page, so a naive repair would merge them.
 *
 * Variants carry their own ingredientRefs — 20 cocktails have them — and a
 * repair walking only `ingredients[]` would report success having missed them.
 * That is the same failure as the garnishItem reference in retire-ingredient.ts.
 *
 * A line whose name actually mentions the brand is left alone, and a branded
 * link this script has no rule for stops the run rather than being repointed by
 * guesswork.
 *
 * Run: npx sanity exec scripts/repoint-generic-mixers.ts --with-user-token
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Generic line name -> the generic page it should point at. */
const RULES: Array<{ line: RegExp; slug: string; why?: string }> = [
  { line: /^soda water$/i, slug: 'soda-water' },
  { line: /^sparkling water$/i, slug: 'sparkling-water', why: 'Not soda water: no added mineral salts.' },
  { line: /^ginger beer$/i, slug: 'ginger-beer' },
  { line: /^ginger ale$/i, slug: 'ginger-ale' },
  { line: /^cola$/i, slug: 'cola' },
  { line: /^(sparkling )?lemonade$/i, slug: 'lemonade' },
  {
    line: /^lemonade or lemon-lime soda$/i,
    slug: 'lemonade',
    why: 'The line offers a choice and leads with lemonade, so it lands there.',
  },
  { line: /^(pink )?grapefruit soda$/i, slug: 'grapefruit-soda' },
  { line: /^indian tonic water$/i, slug: 'tonic-water', why: 'Was pointing at the Refreshingly Light variant.' },
  { line: /^tonic water$/i, slug: 'tonic-water' },
]

const BRANDED = /^(Fever-Tree|Franklin & Sons)/i
/** A line that names the brand itself is a deliberate choice, not a mis-route. */
const NAMES_BRAND = /fever-?tree|franklin/i

interface Line {
  _key: string
  name?: string
  refName?: string | null
  refSlug?: string | null
}
interface Variant {
  _key: string
  ingredients: Line[] | null
}
interface Cocktail {
  _id: string
  name: string
  ingredients: Line[] | null
  variants: Variant[] | null
}

interface Change {
  doc: string
  cocktail: string
  path: string
  line: string
  from: string
  to: string
}

async function main() {
  const targets = await client.fetch<Array<{ slug: string; id: string }>>(
    `*[_type=="ingredient" && slug.current in $slugs]{ "slug": slug.current, "id": _id }`,
    { slugs: [...new Set(RULES.map((r) => r.slug))] }
  )
  const idFor = new Map(targets.map((t) => [t.slug, t.id]))
  const missing = [...new Set(RULES.map((r) => r.slug))].filter((s) => !idFor.has(s))
  if (missing.length) throw new Error(`No ingredient page for: ${missing.join(', ')}`)

  const cocktails = await client.fetch<Cocktail[]>(`
    *[_type=="cocktail" && !(_id in path("drafts.**"))]{
      _id, name,
      ingredients[]{ _key, name, "refName": ingredientRef->name, "refSlug": ingredientRef->slug.current },
      variants[]{ _key, ingredients[]{ _key, name, "refName": ingredientRef->name, "refSlug": ingredientRef->slug.current } }
    }`)

  const changes: Change[] = []
  const kept: string[] = []
  const unhandled: string[] = []

  const consider = (c: Cocktail, line: Line, path: string) => {
    if (!line.refName || !BRANDED.test(line.refName)) return
    const name = (line.name ?? '').trim()
    if (NAMES_BRAND.test(name)) {
      kept.push(`${c.name}: "${name}" names the brand`)
      return
    }
    const rule = RULES.find((r) => r.line.test(name))
    if (!rule) {
      unhandled.push(`${c.name}: "${name}" -> ${line.refSlug}`)
      return
    }
    changes.push({
      doc: c._id,
      cocktail: c.name,
      path,
      line: name,
      from: line.refSlug ?? '',
      to: rule.slug,
    })
  }

  for (const c of cocktails) {
    for (const l of c.ingredients ?? []) consider(c, l, `ingredients[_key=="${l._key}"].ingredientRef._ref`)
    for (const v of c.variants ?? []) {
      for (const l of v.ingredients ?? []) {
        consider(c, l, `variants[_key=="${v._key}"].ingredients[_key=="${l._key}"].ingredientRef._ref`)
      }
    }
  }

  const byRoute = new Map<string, number>()
  for (const ch of changes) {
    const k = `"${ch.line}"  ${ch.from}  ->  ${ch.to}`
    byRoute.set(k, (byRoute.get(k) ?? 0) + 1)
  }
  console.log(`=== REPOINTING ${changes.length} LINE(S) ===\n`)
  for (const [k, n] of [...byRoute].sort((a, b) => b[1] - a[1])) console.log(`${String(n).padStart(3)}  ${k}`)

  const inVariants = changes.filter((c) => c.path.startsWith('variants')).length
  console.log(`\n${changes.length - inVariants} in main recipes, ${inVariants} in variants.`)

  if (kept.length) {
    console.log(`\n=== LEFT ALONE, THE LINE NAMES THE BRAND (${kept.length}) ===`)
    for (const k of kept) console.log(`  ${k}`)
  }

  if (unhandled.length) {
    console.log(`\n!! ${unhandled.length} branded link(s) with no rule:`)
    for (const u of unhandled) console.log(`   ${u}`)
    console.log('   Add a rule or confirm the brand is deliberate. Nothing written.')
    process.exitCode = 1
    return
  }

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  const byDoc = new Map<string, Change[]>()
  for (const ch of changes) {
    if (!byDoc.has(ch.doc)) byDoc.set(ch.doc, [])
    byDoc.get(ch.doc)!.push(ch)
  }
  for (const [doc, list] of byDoc) {
    const patch = client.patch(doc)
    for (const ch of list) patch.set({ [ch.path]: idFor.get(ch.to)! })
    await patch.commit()
  }
  console.log(`\nWRITTEN. ${changes.length} line(s) across ${byDoc.size} cocktail(s).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
