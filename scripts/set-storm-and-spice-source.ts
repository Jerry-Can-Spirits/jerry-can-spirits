/**
 * Record Storm & Spice as a house specification.
 *
 * The first page to carry attribution, and the one that makes the new line
 * visible: with no cocktail carrying a source, the rendering has nothing to
 * render and cannot be checked.
 *
 * Set on Dan's own statement that this is a house recipe, about his own drink.
 * Nothing is inferred. Every other cocktail is left unset until a source is
 * actually verified during the rewrite pass, because an authority guessed at is
 * worse than an authority absent: the line exists to say someone checked.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'
import { recipeSourceLine } from '../src/lib/recipe-source'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const NAME = 'Storm & Spice'

/**
 * Section 8 of the standard, and the schema's own guidance: one or two
 * sentences saying what we do differently and why. No apologising for it.
 *
 * The page already argues this in prose. The field states it once, and is the
 * only thing that makes the "Our version" block appear.
 */
const HOUSE_VARIATION = `The Dark 'n' Stormy is trademarked by Gosling Brothers and specifies their Black Seal rum, so this is not that drink. We build the same structure on Expedition Spiced Rum, and add two dashes of Angostura over the top to reinforce the clove and cinnamon the maceration already carries.`

const CHECKED = '2026-08-08'

async function main() {
  const doc = await client.fetch<{ _id: string; recipeSource?: { authority?: string } } | null>(
    `*[_type == "cocktail" && name == $n][0]{ _id, recipeSource }`,
    { n: NAME }
  )
  if (!doc) throw new Error(`"${NAME}" not found`)

  console.log(`${NAME}  ${doc._id}`)
  console.log(`  authority now: ${doc.recipeSource?.authority ?? '(unset)'}  ->  house`)
  console.log(`  houseVariation: ${HOUSE_VARIATION.trim().split(/\s+/).length} words`)
  console.log(`  renders as: "${recipeSourceLine('house', null, CHECKED)}"`)
  console.log(`  and the "Our version" block, which cannot appear without the authority set.`)

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  await client
    .patch(doc._id)
    .set({
      recipeSource: { _type: 'object', authority: 'house' },
      houseVariation: HOUSE_VARIATION,
      sourceCheckedAt: CHECKED,
    })
    .commit()
  console.log('\nWRITTEN.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
