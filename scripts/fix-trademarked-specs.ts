/**
 * Honour the specifications of drinks whose names are trademarks.
 *
 * Dan's point: if we publish a Dark 'n' Stormy we have to use Gosling's,
 * because the name is a Gosling Brothers trademark and the registered
 * specification names Black Seal. That one was already correct. Two others
 * were not.
 *
 * MEASURED 8 Aug 2026:
 *   Dark 'n' Stormy   60ml Gosling's Black Seal Rum   CORRECT already
 *   Painkiller        60ml "Dark rum"                 WRONG
 *   Bacardi Cocktail  50ml "White Rum"                WRONG
 *
 * Painkiller is a registered Pusser's trademark and Pusser's has litigated to
 * enforce it. The Bacardi Cocktail is subject to a 1936 New York Supreme Court
 * ruling that it must be made with Bacardi rum, which is the single most
 * legally specific cocktail there is. Publishing either on a generic rum is
 * inaccurate on its own terms before it is anything else.
 *
 * This changes the ingredient NAME and the amount stays. The ingredientRef is
 * left alone: pointing a Pusser's line at the generic Dark Rum guide is better
 * than pointing it at nothing, and creating brand ingredient pages is a
 * separate decision.
 *
 * recipeSource is set to `brand` with the producer in the note, which is what
 * that authority was added for.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

interface Fix {
  name: string
  ingredientName: string
  newName: string
  sourceNote: string
  why: string
}

const FIXES: Fix[] = [
  {
    name: 'Painkiller',
    ingredientName: 'Dark rum',
    newName: "Pusser's Rum",
    sourceNote: "Pusser's",
    why: 'Painkiller is a registered Pusser\'s trademark, and the specification names their rum.',
  },
  {
    name: 'Bacardi Cocktail',
    ingredientName: 'White Rum',
    newName: 'Bacardi Carta Blanca',
    sourceNote: 'Bacardi, per the 1936 New York Supreme Court ruling',
    why: 'A 1936 New York Supreme Court ruling holds that a Bacardi Cocktail must be made with Bacardi rum.',
  },
]

async function main() {
  for (const f of FIXES) {
    const doc = await client.fetch<{
      _id: string
      ingredients: Array<{ _key: string; name: string; amount: string }>
      recipeSource?: { authority?: string }
    } | null>(`*[_type == "cocktail" && name == $n][0]{ _id, ingredients[]{ _key, name, amount }, recipeSource }`, {
      n: f.name,
    })
    if (!doc) {
      console.log(`\nMISS  ${f.name} not found`)
      continue
    }

    const target = doc.ingredients?.find((i) => i.name === f.ingredientName)
    if (!target) {
      const already = doc.ingredients?.find((i) => i.name === f.newName)
      console.log(
        already
          ? `\nDONE  ${f.name}: already reads "${f.newName}"`
          : `\nMISS  ${f.name}: no ingredient named "${f.ingredientName}" (has: ${doc.ingredients?.map((i) => i.name).join(', ')})`
      )
      continue
    }

    console.log(`\n${f.name}`)
    console.log(`  ${target.amount} "${target.name}"  ->  "${f.newName}"`)
    console.log(`  recipeSource: ${doc.recipeSource?.authority ?? '(unset)'} -> brand ("${f.sourceNote}")`)
    console.log(`  why: ${f.why}`)

    if (WRITE) {
      await client
        .patch(doc._id)
        .set({
          [`ingredients[_key=="${target._key}"].name`]: f.newName,
          recipeSource: { _type: 'object', authority: 'brand', note: f.sourceNote },
          sourceCheckedAt: '2026-08-08',
        })
        .commit()
    }
  }

  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
