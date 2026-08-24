/**
 * Put the producer's name in the title of a branded mixer page.
 *
 * WHY. Thirty-eight ingredient pages are about a specific bottle and thirty-two
 * of them do not say whose. "Ginger Ale: the Crisp Diplomat" is the Fever-Tree
 * page, and there is a separate generic Ginger Ale page; likewise ginger beer,
 * cola, lemonade, soda water and grapefruit soda. Two pages competing for one
 * phrase is a decision handed to Google, and Google has already made it: it
 * rewrote "Raspberry & Orange Blossom: the Floral Fruit" to "Fever-Tree
 * Raspberry & Orange Blossom Soda" against the query "fever tree raspberry and
 * orange blossom".
 *
 * Google is not objecting to the flourish. On the Pedro Ximenez page it kept
 * "the Raisin Cellar" and merely inserted the missing word "Sherry". Where the
 * noun is complete the flourish survives; where the noun is incomplete the
 * whole title is replaced. So the fix is to name the thing fully and keep the
 * line, not to abandon the voice.
 *
 * "F&S" WAS MY MISTAKE. The thirteen Franklin pages written on 23 August used
 * that abbreviation to save characters against a sixty-character ceiling.
 * Nobody searches "F&S". The characters were saved from the one part of the
 * title that had to be there.
 *
 * WHEN IT WILL NOT FIT. Some names are simply long — "Franklin & Sons Rosemary
 * & Black Olive Tonic Water" is 48 before any flourish. The flourish is dropped
 * before the name is, because a reader scanning results needs to know which
 * bottle this is; the good line is a bonus and the H1 still carries it.
 *
 * Run: npx sanity exec scripts/fix-branded-ingredient-titles.ts --with-user-token
 *      ...add --write to apply.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const MAX = 60
const PRODUCERS = ['Fever-Tree', 'Franklin & Sons']

interface Row {
  _id: string
  slug: string
  name: string
  metaTitle: string
}

/** The producer this page is about, or null if it is a generic ingredient. */
function producerOf(name: string): string | null {
  return PRODUCERS.find((p) => name.startsWith(p)) ?? null
}

/**
 * Build a title that names the producer, keeping the flourish where it fits.
 *
 * The existing title is treated as "core: flourish". The core is replaced with
 * the product's real name and the flourish is kept, dropped only when the
 * result exceeds the ceiling.
 */
function retitle(name: string, current: string, producer: string): string {
  // Expand the abbreviation before anything else measures the string.
  const expanded = current.replace(/^F&S\b/, 'Franklin & Sons')
  if (expanded.startsWith(producer)) return expanded.length <= MAX ? expanded : dropFlourish(expanded)

  const colon = expanded.indexOf(':')
  const flourish = colon === -1 ? '' : expanded.slice(colon + 1).trim()

  const withFlourish = flourish ? `${name}: ${flourish}` : name
  return withFlourish.length <= MAX ? withFlourish : name
}

function dropFlourish(title: string): string {
  const colon = title.indexOf(':')
  return colon === -1 ? title : title.slice(0, colon).trim()
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type=="ingredient" && defined(metaTitle) && !(_id in path("drafts.**"))]{
       _id, "slug": slug.current, name, metaTitle }`,
  )

  const changes: Array<Row & { next: string }> = []
  const tooLong: string[] = []

  for (const row of rows) {
    const producer = producerOf(row.name)
    if (!producer) continue
    const next = retitle(row.name, row.metaTitle, producer)
    if (next === row.metaTitle) continue
    if (next.length > MAX) {
      // The product name alone breaks the ceiling. Left for a person: a
      // truncated title is worse than a long one, and shortening a real product
      // name is a judgement rather than a rule.
      tooLong.push(`${next.length}  ${next}`)
      continue
    }
    changes.push({ ...row, next })
  }

  console.log(`${changes.length} to retitle, ${tooLong.length} too long to fix mechanically.\n`)
  for (const c of changes) {
    console.log(`  ${String(c.metaTitle.length).padStart(2)} -> ${String(c.next.length).padStart(2)}  ${c.next}`)
    if (!c.next.includes(':')) console.log(`        (flourish dropped, was "${c.metaTitle}")`)
  }
  if (tooLong.length) {
    console.log('\nName alone exceeds the ceiling, left alone:')
    tooLong.forEach((t) => console.log(`  ${t}`))
  }

  if (!WRITE) {
    console.log('\nDry run. Add --write to apply.')
    return
  }

  let tx = client.transaction()
  for (const c of changes) tx = tx.patch(c._id, { set: { metaTitle: c.next } })
  await tx.commit()
  console.log(`\n${changes.length} updated.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
