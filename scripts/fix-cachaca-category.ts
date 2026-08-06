/**
 * State plainly on the cachaça page that it is legally its own category.
 *
 * Two live pages contradicted each other. /field-manual/ingredients/rum/ says
 * "Cachaça. Brazilian, from fresh cane juice. Legally its own category, not a
 * rum." The cachaça page said only that it is "legally Brazilian and materially
 * distinct", which distinguishes it without ever making the categorical claim
 * the rum page asserts on its behalf.
 *
 * One sentence, appended to the opening block. The page is not expanded beyond
 * that: its parent link to /rum/ is navigational, not taxonomic, and the rest
 * of the page already reads correctly.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const BLOCK_KEY = 'i10096'
const OLD_TAIL = 'If it tastes like rum, it is the wrong cachaça.'
const NEW_TAIL =
  'If it tastes like rum, it is the wrong cachaça. It is also not one: cachaça is legally its own category, not a style of rum.'

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  const doc = (await client.fetch(
    `*[_type=="ingredient" && slug.current=="cachaca"][0]{ _id, longDescription }`
  )) as { _id: string; longDescription: Array<{ _key: string; children?: Array<{ _key: string; text: string }> }> } | null

  if (!doc) {
    console.log('  cachaca not found')
    return
  }

  const block = doc.longDescription?.find((b) => b._key === BLOCK_KEY)
  if (!block) {
    console.log(`  block ${BLOCK_KEY} not found — blocks present: ${doc.longDescription?.map((b) => b._key).join(', ')}`)
    return
  }

  const span = block.children?.find((c) => c.text?.includes(OLD_TAIL))
  if (!span) {
    console.log('  the expected sentence is not present; page may have been edited. Aborting rather than guessing.')
    console.log('  current text: ' + (block.children?.map((c) => c.text).join('') || '').slice(0, 200))
    return
  }

  const updated = span.text.replace(OLD_TAIL, NEW_TAIL)
  console.log('  BEFORE: …' + span.text.slice(-90))
  console.log('  AFTER:  …' + updated.slice(-140))

  if (WRITE) {
    await client
      .patch(doc._id)
      .set({ [`longDescription[_key=="${BLOCK_KEY}"].children[_key=="${span._key}"].text`]: updated })
      .commit()
    console.log('\n  committed')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
