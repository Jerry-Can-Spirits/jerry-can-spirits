/**
 * Rewrite cocktails to the Storm & Spice standard, a batch at a time.
 *
 * One applier, many batches. The queue is ordered by measured self-reference
 * rather than alphabetically or by whether a photograph exists, per section 0
 * of docs/COCKTAIL_CONTENT_STANDARD.md.
 *
 * Run:  npx sanity exec scripts/rewrite-cocktail-batch.ts --with-user-token -- --batch=1
 *       ...add --write to execute.
 *
 * Every page here was read before being rewritten. Nothing is invented: no
 * date, creator or bar appears that was not already in the document or is not
 * securely documented, and uncertain history is hedged per section 8 rather
 * than resolved. recipeSource is set only where a specification was actually
 * checked, which for these is nowhere, so it stays unset.
 */
import { getCliClient } from 'sanity/cli'
import { selfReferences } from './self-reference'
import {
  recipeSourceLine,
  validateRecipeSourceInput,
  type RecipeAuthority,
} from '../src/lib/recipe-source'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const BATCH = Number(process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] ?? '1')

interface Rewrite {
  id: string
  name: string
  description: string
  note: string
  flavorProfile: string[]
  instructions: string[]
  /** Ingredient name -> new note. Patched by _key so refs and amounts survive. */
  ingredientNotes: Record<string, string>
  /** [heading, body] in order. Body paragraphs split on blank lines. */
  sections: Array<[string, string]>
  faqs: Array<[string, string]>
  /**
   * Provenance, and optional. Set only where a specification was actually
   * checked against the source: an authority guessed at is worse than an
   * authority absent, because the line exists to say someone looked.
   */
  recipeSource?: { authority: RecipeAuthority; note?: string }
  /** Required when the authority is house, and meaningless anywhere else. */
  houseVariation?: string
  /** YYYY-MM-DD. */
  sourceCheckedAt?: string
}

const BATCHES: Record<number, Rewrite[]> = {
  1: [
    {
      id: 'cocktail-anejo-old-fashioned',
      name: 'Añejo Old Fashioned',
      description: `The Añejo Old Fashioned is an Old Fashioned with aged tequila in place of whiskey, and it works for one specific reason: añejo has spent at least a year in oak, so it arrives carrying the vanilla and barrel weight the frame assumes.

Blanco would not do this. Its pepper and raw agave read sharp against sugar rather than settling into it. A year in barrel rounds that pepper down toward bourbon's register without burying the agave underneath, which is the balance the whole drink depends on.

Two details separate it from a whiskey Old Fashioned. The sweetener is agave syrup, so the sweetness comes from the same plant as the spirit. And the bitters are mole rather than Angostura, bringing cacao and dried chilli where Angostura brings clove and cinnamon. Angostura works here. Mole belongs.

It is a slow drink over one large cube, and the most persuasive argument there is for putting aged tequila where whiskey usually sits.`,
      note: `Añejo, not reposado. Reposado spends two to twelve months in oak and arrives thinner than this frame needs, so the sugar and bitters cover it and the agave disappears. If reposado is what you have, the Oaxaca Old Fashioned is the better drink for it, because the mezcal in that one carries the weight.

Do not reach past añejo either. Three years or more in barrel pushes the spirit toward cognac, and at that point the oak is doing the talking and the agave has gone quiet. A year to three is the window.

Agave syrup, not simple. It is roughly half again as sweet by volume, which is why the measure is 7.5ml rather than a full teaspoon, and it carries a vegetal note that keeps the drink tasting of agave rather than of sweetened oak.`,
      flavorProfile: ['Agave', 'Vanilla', 'Cacao', 'Warm Spice', 'Oak'],
      instructions: [
        'Add the añejo, agave syrup and mole bitters to a mixing glass.',
        'Fill the mixing glass with cubed ice and stir for 25 seconds.',
        'Place one large cube in a rocks glass.',
        'Strain over the cube.',
        'Express an orange twist over the surface and drop it in.',
      ],
      ingredientNotes: {
        'Añejo Tequila':
          'At least a year in oak, which is what the frame needs. Blanco reads sharp against the sugar and reposado arrives thin; go much past three years and the spirit starts tasting of cognac rather than agave.',
        'Agave Syrup':
          'Roughly half again as sweet as simple syrup, which is why the measure is small. It also carries a vegetal note that keeps the drink tasting of agave rather than of sweetened oak.',
        'Mole Bitters':
          'Cacao, dried chilli and warm spice, made for exactly this kind of drink. Angostura works and plenty of good versions use it, but its clove sits on top rather than picking up what the añejo already carries.',
      },
      sections: [
        [
          'Where It Comes From',
          `No single bar owns this drink. It assembled itself through the 2010s as aged tequila reached back bars in quantity, and versions appeared independently in enough places that no first version can be identified with any confidence.

Its better documented relative is the Oaxaca Old Fashioned, built by Phil Ward at Death & Co in 2007, which splits the base between reposado tequila and mezcal. The Añejo Old Fashioned takes the same idea and refuses the split: one spirit, aged, doing all of the work. Where the Oaxaca argues that smoke and agave belong together, this argues that a good añejo needs no help.`,
        ],
        [
          'Why Aged Tequila Works Here',
          `An Old Fashioned is a frame rather than a recipe: spirit, sugar, bitters, ice. It only works when the spirit has enough weight to survive being sweetened and diluted, which is why it belongs to whiskey and rum before anything else.

Blanco tequila does not have that weight. It has pepper, citrus and raw cooked agave, all of which read as sharp against sugar. A year in oak changes the arithmetic. The barrel adds vanilla and a soft caramel edge, rounds the pepper down, and gives the spirit the body the frame assumes, while the agave stays audible underneath it. What you end up with tastes like a whiskey Old Fashioned's structure and nothing at all like its flavour.`,
        ],
        [
          'The Mole Bitters',
          `Mole bitters are built on the seasoning of a Mexican mole: cacao, dried chilli and warm spice. They were made for this kind of drink.

Angostura is not wrong here, and plenty of good versions use it. But Angostura's clove and cinnamon sit on top of the agave as a separate layer, whereas the cacao and chilli in mole bitters pick up notes the añejo already carries from the barrel and the plant. The seasoning stops sounding foreign to the spirit.

Two dashes is enough. Mole bitters are assertive, and a heavy hand turns the drink muddy and faintly savoury.`,
        ],
        [
          'Agave Syrup and the Sweetening',
          `The sweetener matches the spirit, which is the same logic that puts demerara in a rum Old Fashioned. Agave syrup carries a faint vegetal note that sits with the tequila rather than against it.

It is also considerably sweeter than simple syrup, roughly one and a half times by volume, so the measure is smaller than the sugar you would use with bourbon. Seven and a half millilitres is the calibration. A full teaspoon makes the drink cloying and flattens the bitters underneath.

If simple syrup is all you have, use a little less than you think and accept a cleaner, less earthy drink.`,
        ],
        [
          'Ice and Time',
          `One large cube, and stir for twenty-five seconds. Añejo at 40% needs real dilution to open up, and a short stir leaves the drink hot and closed.

The single cube matters after that. Cubed ice keeps diluting through a drink this slow, and by the last third you are drinking barrel-flavoured water. One large piece has far less surface area, so the drink arrives properly cold and then stays roughly where it is.

Express the orange twist over the surface before dropping it in. The oil lifts the vanilla and gives the first sip a brightness the drink otherwise takes ten minutes to find.`,
        ],
      ],
      faqs: [
        [
          'What is an Añejo Old Fashioned?',
          'An Old Fashioned built on aged tequila instead of whiskey: 60ml añejo, 7.5ml agave syrup and two dashes of mole bitters, stirred and served over one large cube with an orange twist. The oak in the añejo does the work bourbon’s barrel would.',
        ],
        [
          'Why añejo rather than blanco or reposado?',
          'The frame needs barrel weight. Blanco’s pepper and raw agave read sharp against the sugar, and reposado’s few months in oak leave it too thin to survive sweetening. Añejo has at least a year in barrel, which rounds the pepper and adds the vanilla the drink assumes.',
        ],
        [
          'Can I use Angostura instead of mole bitters?',
          'Yes, and the drink is still good. Angostura’s clove and cinnamon sit on top as a separate layer, while mole bitters’ cacao and dried chilli pick up notes the añejo already carries. Angostura works here; mole belongs.',
        ],
        [
          'How is it different from an Oaxaca Old Fashioned?',
          'The Oaxaca splits its base between reposado and mezcal, so smoke is part of the drink. This one uses a single aged spirit and no mezcal, which makes it rounder and closer to a whiskey Old Fashioned in weight. Same frame, different argument.',
        ],
      ],
    },
  ],
}

const key = (id: string, p: string, i: number) => `${id.replace(/[^a-z0-9]/gi, '').slice(-8)}${p}${String(i).padStart(2, '0')}`
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

async function apply(r: Rewrite) {
  // Ids are copied by hand out of the queue dump, and the site reads
  // perspective: 'published'. A rewrite committed to a draft is a page of work
  // no visitor ever sees, and nothing else here would notice.
  if (r.id.startsWith('drafts.')) throw new Error(`${r.id} is a draft — the live site would never read it`)

  const doc = await client.fetch<{ ingredients: Array<{ _key: string; name: string }> } | null>(
    `*[_id == $id][0]{ ingredients[]{ _key, name } }`,
    { id: r.id }
  )
  if (!doc) throw new Error(`${r.id} not found`)

  const longDescription: unknown[] = []
  r.sections.forEach(([heading, body], i) => {
    longDescription.push({
      _key: key(r.id, 'h', i),
      _type: 'block',
      style: 'h2',
      markDefs: [],
      children: [{ _key: key(r.id, 'hs', i), _type: 'span', text: heading, marks: [] }],
    })
    body.split(/\n\s*\n/).forEach((para, j) => {
      longDescription.push({
        _key: key(r.id, `p${i}`, j),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: key(r.id, `s${i}`, j), _type: 'span', text: para.trim(), marks: [] }],
      })
    })
  })

  const ingredientPatch: Record<string, string> = {}
  for (const ing of doc.ingredients ?? []) {
    const next = r.ingredientNotes[ing.name]
    if (!next) {
      console.log(`    ! no note for ingredient "${ing.name}" — left as is`)
      continue
    }
    ingredientPatch[`ingredients[_key=="${ing._key}"].description`] = next
  }

  const faqs = r.faqs.map(([question, answer], i) => ({
    _key: key(r.id, 'f', i),
    _type: 'faq',
    question,
    answer,
  }))

  const ld = r.sections.reduce((n, [h, b]) => n + words(h) + words(b), 0)
  const all = [r.description, r.note, ...r.sections.flat(), ...r.faqs.flat(), ...Object.values(r.ingredientNotes)].join(' ')
  const hits = selfReferences(all)
  const selfRef = hits.length

  const source: Record<string, unknown> = {}
  if (r.recipeSource || r.houseVariation !== undefined || r.sourceCheckedAt !== undefined) {
    const verdict = validateRecipeSourceInput({
      authority: r.recipeSource?.authority ?? '',
      note: r.recipeSource?.note,
      houseVariation: r.houseVariation,
      checkedAt: r.sourceCheckedAt,
    })
    if (verdict !== true) throw new Error(`${r.name}: ${verdict}`)

    if (r.recipeSource) {
      source.recipeSource = {
        _type: 'object',
        authority: r.recipeSource.authority,
        ...(r.recipeSource.note ? { note: r.recipeSource.note } : {}),
      }
    }
    if (r.houseVariation !== undefined) source.houseVariation = r.houseVariation
    if (r.sourceCheckedAt !== undefined) source.sourceCheckedAt = r.sourceCheckedAt
  }

  console.log(`  ${r.name}`)
  console.log(`    description ${words(r.description)}w | tip ${words(r.note)}w | long ${ld}w / ${r.sections.length} sections`)
  console.log(`    faqs ${r.faqs.map(([, a]) => words(a)).join(', ')} | flavour ${r.flavorProfile.length} | self-ref ${selfRef}`)
  if (selfRef) console.log(`    !! SELF-REFERENCE IN NEW COPY: ${hits.join(', ')}`)
  if (r.recipeSource) {
    console.log(`    ${recipeSourceLine(r.recipeSource.authority, r.recipeSource.note, r.sourceCheckedAt)}`)
  }

  if (WRITE) {
    await client
      .patch(r.id)
      .set({
        description: r.description,
        note: r.note,
        flavorProfile: r.flavorProfile,
        instructions: r.instructions,
        longDescription,
        faqs,
        ...ingredientPatch,
        ...source,
      })
      .commit()
  }
}

async function main() {
  const batch = BATCHES[BATCH]
  if (!batch) throw new Error(`No batch ${BATCH}`)
  console.log(`Batch ${BATCH}: ${batch.length} cocktail(s)\n`)
  for (const r of batch) await apply(r)
  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
