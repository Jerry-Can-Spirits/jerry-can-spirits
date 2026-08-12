/**
 * Find recipes that cannot be poured with a UK household jigger.
 *
 * Reports the distribution of every measure in the corpus first, because the
 * line between "poured with a jigger" and "poured with a spoon" is a judgement
 * about readers rather than arithmetic, and it should be drawn from what is
 * actually on the pages.
 *
 * Then, per cocktail: the awkward measures, and the scale factor that would
 * clear them. Scaling is the fix rather than rounding — see scripts/measures.ts.
 *
 * Run:  npx sanity exec scripts/audit-measures.ts --with-user-token
 *       ...add -- --list=20 to cap the report.
 */
import { getCliClient } from 'sanity/cli'
import { awkward, isPourable, parseMl, scaleOptions } from './measures'

const client = getCliClient()
const LIST = Number(process.argv.find((a) => a.startsWith('--list='))?.split('=')[1] ?? '30')

interface Doc {
  name: string
  recipeSource: { authority?: string } | null
  ingredients: Array<{ name?: string; amount?: string }> | null
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && defined(slug.current)]{
      name, recipeSource, ingredients[]{ name, amount }
    } | order(name asc)`
  )

  const frequency = new Map<number, number>()
  const pages = docs.map((doc) => {
    const lines = (doc.ingredients ?? [])
      .map((i) => ({ name: i.name ?? '?', ml: parseMl(i.amount) }))
      .filter((l): l is { name: string; ml: number } => l.ml !== null)
    for (const l of lines) frequency.set(l.ml, (frequency.get(l.ml) ?? 0) + 1)
    const measures = lines.map((l) => l.ml)
    return {
      name: doc.name,
      attributed: Boolean(doc.recipeSource?.authority),
      lines,
      awkward: awkward(measures),
      scales: scaleOptions(measures),
    }
  })

  console.log(`Checked ${docs.length} cocktails.\n`)

  console.log('EVERY MEASURE IN THE CORPUS, most used first')
  console.log('(jigger range only — above 60ml is a jug quantity and is not policed)\n')
  const inRange = [...frequency.entries()].filter(([ml]) => ml <= 60).sort((a, b) => b[1] - a[1])
  for (const [ml, count] of inRange) {
    console.log(`  ${String(count).padStart(4)}  ${String(ml).padStart(6)}ml   ${isPourable(ml) ? '' : 'AWKWARD'}`)
  }

  const affected = pages.filter((p) => p.awkward.length)
  const fixable = affected.filter((p) => !p.attributed && p.scales.length)
  const stuck = affected.filter((p) => !p.attributed && !p.scales.length)
  const exempt = affected.filter((p) => p.attributed)

  console.log(`\n${affected.length} of ${docs.length} cocktails carry a measure no jigger pours.`)
  console.log(`  ${fixable.length} can be scaled clean by a single factor`)
  console.log(`  ${stuck.length} cannot, and need a decision per line`)
  console.log(`  ${exempt.length} carry an attribution, so the published measures stand\n`)

  const shown = LIST > 0 ? fixable.slice(0, LIST) : fixable
  console.log('SCALABLE, nearest-to-unchanged factor first\n')
  for (const page of shown) {
    const k = page.scales[0]
    console.log(`${page.name}   ×${k.toFixed(4)}`)
    for (const l of page.lines) {
      const next = Number((l.ml * k).toFixed(6))
      const moved = l.ml <= 60
      console.log(
        `    ${String(l.ml).padStart(6)}ml  ${moved ? `-> ${String(next).padStart(6)}ml` : '   (jug quantity, unchanged)'}  ${l.name}`
      )
    }
    console.log()
  }
  if (fixable.length > shown.length) {
    console.log(`...and ${fixable.length - shown.length} more. Pass -- --list=0 for no cap.\n`)
  }

  if (stuck.length) {
    console.log('NO SINGLE FACTOR WORKS — each needs a decision\n')
    for (const page of stuck) {
      console.log(`  ${page.name}: ${page.awkward.join('ml, ')}ml`)
    }
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
