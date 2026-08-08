/**
 * Remove the internal working list and the competitor citations from
 * customer-facing prose.
 *
 * Two classes, fixed together because five documents carry both in the same
 * sentence.
 *
 * "Dan's list" is a private working document. A reader cannot know what it is,
 * and a drink earning "its place on Dan's list" tells them nothing. 5 spans.
 *
 * "Difford's" was cited as the authority our own recipes defer to: "Difford's
 * canonised the pairing", "Difford's codified the strawberry-syrup reading as
 * the canonical spec". That hands a competitor the credit for our specs and
 * advertises the sourcing. 13 uses across 7 documents.
 *
 * COCKTAIL_CONTENT_STANDARD section 1: write about the drink, never about the
 * page. Sections 8 and 17 also bind here: do not present uncertain history as
 * fact, and do not invent certainty. Where a citation was carrying the hedge,
 * the replacement keeps a hedge rather than leaving a barer claim than the
 * original made. "Difford's canonised the pairing" becomes "The pairing
 * stuck", not "The pairing is canonical".
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const S = '’'

interface Edit {
  id: string
  path: string
  find: string
  replace: string
}

const EDITS: Edit[] = [
  // --- Banana Calling ---
  {
    id: 'cocktail-banana-calling',
    path: 'description',
    find: `Difford${S}s notes the banana is so quiet the name has to serve as the clue,`,
    replace: 'The banana is so quiet the name has to serve as the clue,',
  },
  {
    id: 'cocktail-banana-calling',
    path: 'longDescription[_key=="gc30044"].children[_key=="gc30045"]',
    find: `London Calling, published onward through Difford${S}s Guide.`,
    replace: 'London Calling.',
  },
  {
    id: 'cocktail-banana-calling',
    path: 'longDescription[_key=="gc30048"].children[_key=="gc30049"]',
    find: `Difford${S}s tasting note concedes the banana is barely findable without the name: that`,
    replace: 'The banana is barely findable without the name, and that',
  },

  // --- Blackthorn (both classes in one sentence) ---
  {
    id: 'cocktail-blackthorn',
    path: 'description',
    find: `among them; this page pours the sloe reading Dan${S}s list intends, the one Difford${S}s numbers third: sloe gin`,
    replace: 'among them. This is the sloe one: sloe gin',
  },
  {
    id: 'cocktail-blackthorn',
    path: 'longDescription[_key=="gc20105"].children[_key=="gc20106"]',
    find: `The sloe-and-sweet-vermouth reading this page keeps is the one the liqueur${S}s revival restored to lists, Difford${S}s No.3 numbering among its modern citations.`,
    replace: `The sloe-and-sweet-vermouth reading is the one the liqueur${S}s revival restored to lists.`,
  },

  // --- Comte de Sureau ---
  {
    id: 'cocktail-comte-de-sureau',
    path: 'longDescription[_key=="gc30112"].children[_key=="gc30113"]',
    find: `Difford${S}s preserved the adapted spec, and the drink travels widely under its Elderflower Negroni alias.`,
    replace: 'The adapted spec is the one that travelled, widely under its Elderflower Negroni alias.',
  },

  // --- Eastside ---
  {
    id: 'cocktail-eastside',
    path: 'description',
    find: `Names shift by neighbourhood, Eastside, East Side, Eastside Gimlet as Dan${S}s list has it, and the drink underneath is constant.`,
    replace: 'Names shift by neighbourhood: Eastside, East Side, Eastside Gimlet. The drink underneath is constant.',
  },

  // --- Kamikaze ---
  {
    id: 'cocktail-kamikaze',
    path: 'description',
    find: `Either way it earned its place on Dan${S}s list the honest way: everyone`,
    replace: 'Either way, everyone',
  },

  // --- Raspberry Lynchburg ---
  {
    id: 'cocktail-raspberry-lynchburg',
    path: 'description',
    find: `a variation the UK bar circuit made standard enough for Difford${S}s to canonise.`,
    replace: 'a variation the UK bar circuit made standard.',
  },
  {
    id: 'cocktail-raspberry-lynchburg',
    path: 'longDescription[_key=="w2b0141"].children[_key=="w2b0142"]',
    find: `Difford${S}s canonised the pairing, and the drink now outsells`,
    replace: 'The pairing stuck, and the drink now outsells',
  },

  // --- Reggae Rum Punch ---
  {
    id: 'cocktail-reggae-rum-punch',
    path: 'description',
    find: `Difford${S}s canonised the reading this page follows, strawberry syrup carrying the red flag.`,
    replace: 'Strawberry syrup carries the red flag.',
  },
  {
    id: 'cocktail-reggae-rum-punch',
    path: 'longDescription[_key=="r2b0184"].children[_key=="r2b0185"]',
    find: `Difford${S}s codified the strawberry-syrup reading as the canonical spec, noting what the island already knew:`,
    replace: 'The strawberry-syrup reading is the one that settled, and the island already knew the rest:',
  },

  // --- Tia Maria (ingredient) ---
  {
    id: 'ingredient-tia-maria',
    path: 'longDescription[_key=="v60005"].children[_key=="v60006"]',
    find: `It earned the slot on Dan${S}s list and its page in this Manual the same way: by being the version people ask for by brand.`,
    replace: 'It is the version people ask for by brand.',
  },

  // --- Tomatini ---
  {
    id: 'cocktail-tomatini',
    path: 'longDescription[_key=="gc30162"].children[_key=="gc30163"]',
    find: ` Difford${S}s preserves the adapted reading this page follows.`,
    replace: '',
  },

  // --- Watermelon Martini (both classes in one sentence) ---
  {
    id: 'cocktail-watermelon-martini',
    path: 'description',
    find: `Difford${S}s keeps both readings; this page pours the fresh-fruit one Dan${S}s list names, cubes`,
    replace: 'Both readings survive; this is the fresh-fruit one, cubes',
  },
  {
    id: 'cocktail-watermelon-martini',
    path: 'longDescription[_key=="gc30185"].children[_key=="gc30186"]',
    find: `The watermelon reading became its summer standard, and Difford${S}s fresh Fruitini spec preserves the method this page follows.`,
    replace: 'The watermelon reading became its summer standard.',
  },
]

/**
 * Read the current text at a span path.
 *
 * The [0] unwrapping matters: in GROQ `longDescription[_key=="x"]` is a filter
 * returning an array, so `.text` on it resolves to nothing and every lookup
 * fails identically. Patch paths use the same syntax and need no unwrapping.
 */
async function currentText(id: string, path: string): Promise<string | null> {
  if (!path.startsWith('longDescription')) {
    return client.fetch<string | null>(`*[_id == $id][0].${path}`, { id })
  }
  const readPath = path.replace(/\]/g, '][0]') + '.text'
  return client.fetch<string | null>(`*[_id == $id][0].${readPath}`, { id })
}

async function main() {
  let ok = 0
  let done = 0
  let missed = 0

  for (const e of EDITS) {
    const text = await currentText(e.id, e.path)
    if (text == null) {
      missed++
      console.log(`\nMISS  ${e.id}  ${e.path}\n      path resolved to nothing`)
      continue
    }
    if (!text.includes(e.find)) {
      // For a deletion the fragment being absent IS the success condition.
      if (e.replace === '' || text.includes(e.replace)) {
        done++
        continue
      }
      missed++
      console.log(`\nMISS  ${e.id}  ${e.path}\n      fragment not found: "${e.find}"`)
      continue
    }

    const next = text.replace(e.find, e.replace).replace(/\s{2,}/g, ' ').trim()
    ok++
    console.log(`\nOK    ${e.id}  ${e.path}`)
    console.log(`  --  ${text.slice(0, 300)}`)
    console.log(`  ++  ${next.slice(0, 300)}`)

    if (WRITE) {
      const setPath = e.path.startsWith('longDescription') ? `${e.path}.text` : e.path
      await client.patch(e.id).set({ [setPath]: next }).commit()
    }
  }

  console.log(`\n\n${ok} edits to apply, ${done} already applied, ${missed} could not be located.`)
  console.log(WRITE ? 'WRITTEN.' : 'DRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
