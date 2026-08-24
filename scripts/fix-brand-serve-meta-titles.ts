/**
 * Rewrite the brand-serve meta titles to the corpus pattern.
 *
 * WHY. The thirteen Fever-Tree serve pages were written with metaTitle set to
 * the drink's name and nothing else — "Whisky & Cola", thirteen characters.
 * Eleven of the thirteen came in under thirty, and Ahrefs flagged the two
 * shortest in its weekly audit.
 *
 * The other 363 cocktails already follow a pattern that works: the drink, then
 * a colon, then the reason to click. "Whiskey Sour Recipe: The Original Sour,
 * Built Right" runs to 51 characters and says something. Ignoring a convention
 * that established was the error; the fix is to follow it.
 *
 * Each title below carries the specific claim that page actually makes, rather
 * than padding to a length. A title stuffed to sixty characters with nothing in
 * it is the same failure as one at thirteen.
 *
 * Run: npx sanity exec scripts/fix-brand-serve-meta-titles.ts --with-user-token
 *      ...add --write to apply.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Google truncates around here; the corpus tops out at 56. */
const MIN = 30
const MAX = 60

const TITLES: Record<string, string> = {
  'whisky-and-ginger-ale': 'Whisky & Ginger Ale: Why the Mixer Decides It',
  'pink-gin-and-tonic': 'Pink Gin & Tonic Recipe: The Navy Original',
  'sloe-gin-and-lemon-tonic': 'Sloe Gin & Lemon Tonic: A Liqueur, Not a Gin',
  'sicilian-shandy': 'Sicilian Shandy: The Five-to-One Lemonade Build',
  'whisky-and-ginger-beer': "Whisky & Ginger Beer: The Mamie Taylor's Heir",
  'whisky-and-cola': 'Whisky & Cola: Vanilla From Two Directions',
  'vodka-and-mediterranean-tonic': 'Vodka & Mediterranean Tonic: Herbs Over Juniper',
  'cucumber-and-mint-gin-and-tonic': 'Cucumber & Mint G&T: Keep the Gin Plain',
  'elderflower-and-raspberry': 'Elderflower & Raspberry: Drier Than It Sounds',
  'raspberry-and-orange-blossom-spritz': 'Raspberry & Orange Blossom Spritz: Fragrant, Not Soapy',
  'spiced-sangria': 'Spiced Sangria Recipe: Sangria Without the Wine',
  'vodka-and-blood-orange-spritz': 'Vodka & Blood Orange Spritz: The Bitter Half Removed',
  'white-grape-and-apricot-garden-spritz': 'White Grape & Apricot Spritz: Closer to Wine',
}

async function main() {
  const rows = await client.fetch<Array<{ _id: string; slug: string; metaTitle: string }>>(
    `*[_type=="cocktail" && recipeSource.authority=="brand-serve" && !(_id in path("drafts.**"))]{
       _id, "slug": slug.current, metaTitle }`,
  )

  const problems: string[] = []
  for (const [slug, title] of Object.entries(TITLES)) {
    if (!rows.some((r) => r.slug === slug)) problems.push(`${slug}: no such brand-serve page`)
    if (title.length < MIN) problems.push(`${slug}: new title is ${title.length} chars, under ${MIN}`)
    if (title.length > MAX) problems.push(`${slug}: new title is ${title.length} chars, over ${MAX}`)
  }
  for (const row of rows) {
    if (!TITLES[row.slug]) problems.push(`${row.slug}: has no replacement title`)
  }
  if (problems.length) {
    console.error(`${problems.length} problem(s). Nothing written.\n`)
    problems.forEach((p) => console.error(`  ${p}`))
    process.exit(1)
  }

  console.log(`${rows.length} pages, all with a replacement in range.\n`)
  for (const row of rows) {
    console.log(`  ${String(row.metaTitle.length).padStart(2)} -> ${String(TITLES[row.slug].length).padStart(2)}  ${TITLES[row.slug]}`)
  }

  if (!WRITE) {
    console.log('\nDry run. Add --write to apply.')
    return
  }

  let tx = client.transaction()
  for (const row of rows) tx = tx.patch(row._id, { set: { metaTitle: TITLES[row.slug] } })
  await tx.commit()
  console.log(`\n${rows.length} updated.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
