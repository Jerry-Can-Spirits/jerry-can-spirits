/**
 * Name the thing completely where leaving a word out changes what the page is.
 *
 * These are not "too short" and not branded. Each drops a word that carries
 * meaning, and Google has been supplying it: on the Pedro Ximenez page it kept
 * "the Raisin Cellar" and inserted "Sherry", because Pedro Ximenez is a grape
 * as well as a wine and the title did not say which. Same shape on the mint
 * page, where the SERP read "Fresh Mint Sprig Guide" against a title that said
 * "Mint Sprig Garnish".
 *
 * Deliberately a short, hand-checked list rather than a rule. An audit of every
 * title against its page name returned 86 candidates and most were correct:
 * guides keep a long H1 and a shorter tag on purpose, "Orgeat" needs no
 * "Syrup", and "Cucumber & Mint G&T" is not missing "Tonic". Only the ones
 * where the omitted word resolves a real ambiguity are here.
 *
 * Run: npx sanity exec scripts/fix-ambiguous-titles.ts --with-user-token
 *      ...add --write to apply.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const MAX = 60

/** slug -> replacement, with the reason the omitted word matters. */
const TITLES: Record<string, { next: string; why: string }> = {
  'pedro-ximenez-sherry': {
    next: 'Pedro Ximénez Sherry Guide: the Raisin Cellar',
    why: 'Pedro Ximénez is a grape as well as a wine; Google inserted "Sherry" itself',
  },
  'manzanilla-sherry': {
    next: 'Manzanilla Sherry Guide: Fino, but by the Sea',
    why: 'Manzanilla is also a chamomile tea in Spanish',
  },
  'maraschino-liqueur': {
    next: 'Maraschino Liqueur Guide: the Complexity Cherry',
    why: 'Maraschino without it reads as the cocktail cherry, a different product',
  },
  'fresh-mint-sprig': {
    next: "Fresh Mint Sprig: the Nose's Path",
    why: 'the SERP already read "Fresh Mint Sprig Guide"; fresh is the whole point of the page',
  },
  'sugar-granulated': {
    next: 'Granulated Sugar: When Crystals Beat Syrup',
    why: 'there are separate caster, demerara and powdered sugar pages',
  },
  'cherry-liqueur-cherry-brandy-style': {
    next: 'Cherry Brandy Liqueur Guide: the Dark Cherry',
    why: 'separates it from the Maraschino Liqueur and Maraschino Cherry pages',
  },
  'white-grape-and-apricot-garden-spritz': {
    next: 'White Grape & Apricot Garden Spritz: Closer to Wine',
    why: 'Garden Spritz is the drink\'s name; I dropped it to save characters it did not need',
  },
}

async function main() {
  const rows = await client.fetch<Array<{ _id: string; slug: string; metaTitle: string }>>(
    `*[_type in ["ingredient","cocktail"] && slug.current in $slugs && !(_id in path("drafts.**"))]{
       _id, "slug": slug.current, metaTitle }`,
    { slugs: Object.keys(TITLES) },
  )

  const problems: string[] = []
  for (const slug of Object.keys(TITLES)) {
    if (!rows.some((r) => r.slug === slug)) problems.push(`${slug}: no such page`)
    const t = TITLES[slug].next
    if (t.length > MAX) problems.push(`${slug}: ${t.length} chars, over ${MAX}`)
    if (t.length < 25) problems.push(`${slug}: ${t.length} chars, too short`)
  }
  if (problems.length) {
    console.error(`${problems.length} problem(s). Nothing written.\n`)
    problems.forEach((p) => console.error(`  ${p}`))
    process.exit(1)
  }

  console.log(`${rows.length} pages.\n`)
  for (const row of rows) {
    const { next, why } = TITLES[row.slug]
    console.log(`  ${String(row.metaTitle.length).padStart(2)} -> ${String(next.length).padStart(2)}  ${next}`)
    console.log(`        was: ${row.metaTitle}`)
    console.log(`        why: ${why}`)
  }

  if (!WRITE) {
    console.log('\nDry run. Add --write to apply.')
    return
  }

  let tx = client.transaction()
  for (const row of rows) tx = tx.patch(row._id, { set: { metaTitle: TITLES[row.slug].next } })
  await tx.commit()
  console.log(`\n${rows.length} updated.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
