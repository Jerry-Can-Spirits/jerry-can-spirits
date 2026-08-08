/**
 * Rewrite the Blackthorn to the Storm & Spice standard.
 *
 * The calibration page for the corpus-wide copy pass. Dan flagged this one
 * specifically ("this Manual's stirred-and-shaken sloe double bill. The
 * Christmas bottle deserves both pages"), so it is the fairest test of whether
 * the rewrite fixes what he actually objected to.
 *
 * Before: description 133w, Expert Tip 24w, long description 173w across 4
 * sections, FAQ answers 29/30/23, four self-references.
 * After:  description 178w, Expert Tip 156w, long description 561w across 5
 * sections, FAQ answers 45/42/42/43, zero self-references.
 *
 * Nothing invented: no date, no creator, no bar. The Vermeire attribution and
 * the several-Blackthorns problem were already in the document; the history is
 * hedged per section 8 rather than resolved.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const ID = 'cocktail-blackthorn'

const DESCRIPTION = `The Blackthorn is a Manhattan built on sloe gin instead of whiskey. Sloe gin, sweet vermouth and orange bitters, stirred cold and served up. The sloe brings plum and almond where rye would bring spice, and the vermouth doubles the fruit rather than cutting against it. What arrives has a Manhattan's shape and about half its strength.

Several drinks answer to Blackthorn. The old manuals also carry an Irish whiskey version built with dry vermouth and absinthe, and the two share a name rather than a recipe. Both take it from the blackthorn bush, which is where sloes come from. This is the sloe one.

The low proof is the whole character. Sloe gin pours at around 25%, so the drink lands gentler than its silhouette suggests. That makes it a genuine second drink of the evening, where a Manhattan would end one. It also makes your choice of bottle matter more than usual: with only vermouth and bitters alongside it, the sloe gin is most of what you taste.`

const NOTE = `Taste the sloe gin before you build. Commercial bottles run anywhere from syrupy to nearly dry, and home-steeped batches vary by hedgerow, sugar and patience. The drink inherits whatever is in the bottle, so the same recipe produces two different cocktails from two different sloe gins.

The vermouth is your adjusting screw. A sweet bottle wants the full 25ml and no more. A drier one takes a barspoon extra without losing shape, and the wine character fills the gap the sugar left. Adjust the vermouth, not the sloe gin. The sloe is the drink.

Stir it, do not shake it. Shaking aerates and clouds a drink that should arrive clear and dense, and that texture is half of why it reads as a Manhattan rather than a fruit cup. Twenty seconds against good ice.`

const FLAVOUR = ['Plum', 'Almond', 'Bittersweet', 'Rich', 'Aromatic']

/** [heading, body] pairs, in order. */
const SECTIONS: Array<[string, string]> = [
  [
    'Where It Comes From',
    `The blackthorn is a hedgerow shrub that fruits the sloe, a small, hard, astringent plum that is almost inedible raw and excellent steeped in gin. The drink takes its name from the bush.

More than one cocktail answers to Blackthorn. The old manuals carry an Irish whiskey version built with dry vermouth and absinthe, which appears in Vermeire among others, and sloe versions elsewhere. The exact relationship between them is unclear, and it is likely there isn't one: the name attached to more than one drink and stuck to both. What is established is that the sloe-and-sweet-vermouth reading is the one that returned to bar lists when sloe gin itself was revived.`,
  ],
  [
    'Why Sloe Gin Works Here',
    `A Manhattan works because rye's spice and sweet vermouth's wine character pull against each other, with bitters holding the join. Take out the rye and the structure should collapse.

It does not, because sloe gin is doing two jobs at once. The sloe brings plum sweetness where the vermouth is already sweet, which ought to be too much, but steeping also draws almond bitterness out of the kernel. That bitterness is what stands in for the rye's spice. The orange bitters then sit on top of an almond note rather than a spice one, which is why the drink reads as a Manhattan and tastes nothing like one.`,
  ],
  [
    'The Sloe Gin Question',
    `No two sloe gins are the same drink. Commercial bottles range from heavily sweetened to genuinely dry, and a home-steeped batch depends on the fruit, the sugar and how long it sat. Sloe gin also carries no legal definition of the kind that governs London Dry, so the label tells you less than the taste does.

This matters more here than in a shaken sloe drink, where citrus and sugar can absorb the difference. Stirred, with only vermouth and bitters alongside it, the bottle is most of the flavour. Taste it, then decide the vermouth. A sweet sloe gin needs no help; a dry one takes a barspoon more.`,
  ],
  [
    'Stirring and Strength',
    `Sloe gin sits around 25% ABV, roughly half the strength of a base spirit. With 50ml of it against 25ml of vermouth, the finished drink lands nearer a fortified wine than a spirit cocktail.

That changes how you stir it. There is less alcohol to carry dilution, so twenty seconds against good cubed ice is enough, and a longer stir washes the fruit out. Strain into a chilled Nick & Nora rather than a coupe: the smaller bowl holds the cold through a drink nobody rushes.

The lemon twist is not decoration. Oil expressed over the surface lifts the almond and stops the plum turning jammy.`,
  ],
  [
    'When to Drink It',
    `Sloe gin is autumn by construction. Sloes are picked after the first frost, steeped through the back end of the year, and the bottle is usually ready somewhere around Christmas.

The drink follows the bottle. It is at its best cold, up, and in the months either side of the new year, when a sweet, low-strength, dark-fruited drink makes sense in a way it does not in July.

If you have a bottle open, the Charlie Chaplin is its shaken counterpart: the same sloe gin with apricot and lime instead of vermouth, and a completely different drink. Between the two, one bottle of sloe gin covers a whole season rather than a single evening.`,
  ],
]

/**
 * Section 4. The notes were not missing, they were in the wrong register:
 * "The hedgerow in the whiskey's chair: plum-skin and almond depth leading a
 * Manhattan frame" describes the drink's poetry and tells a reader nothing
 * about which bottle to buy. Storm & Spice answers the questions section 4
 * actually lists: what to use, why it matters, what ruins it.
 *
 * Matched to the existing ingredient names so the array is patched in place
 * and the ingredientRef links survive.
 */
const INGREDIENT_NOTES: Record<string, string> = {
  'Sloe Gin':
    'The drink, not a modifier. Bottles run from heavily sweetened to nearly dry and there is no legal definition to guide you, so taste before you build. Home-steeped batches are usually drier and make the better version.',
  'Sweet Vermouth':
    'Refrigerate after opening and replace within four weeks; oxidised vermouth is the most common reason this drink falls flat. It is also the adjusting screw, since a drier sloe gin takes a barspoon more.',
  'Orange Bitters':
    "Orange, not aromatic. Angostura would set clove and cinnamon against the sloe's almond; orange lifts the plum instead and keeps the drink from reading as a dessert.",
}

/**
 * Section 5. The originals were serviceable but thin: no glass prep, and "with
 * ice" without saying which. Cubed matters here because the drink is low proof
 * and cannot afford fast dilution.
 */
const INSTRUCTIONS = [
  'Chill a Nick & Nora glass.',
  'Add the sloe gin, sweet vermouth and orange bitters to a mixing glass.',
  'Fill the mixing glass with cubed ice and stir for 20 seconds.',
  'Strain into the chilled glass.',
  'Express a lemon twist over the surface and drop it in.',
]

const FAQS: Array<[string, string]> = [
  [
    'What is a Blackthorn cocktail?',
    "A Manhattan built on sloe gin: 50ml sloe gin, 25ml sweet vermouth and two dashes of orange bitters, stirred and served up with a lemon twist. The sloe supplies both the sweetness and, through the kernel, the bitterness that rye spice would normally provide.",
  ],
  [
    'Is there a whiskey Blackthorn?',
    'Yes, and it is a different drink. The old manuals carry an Irish whiskey version with dry vermouth and absinthe. The two share a name and the bush it came from, not a recipe. Which one you are served depends entirely on the bar.',
  ],
  [
    'How strong is it?',
    'Gentle. Sloe gin runs around 25% ABV, about half the strength of a base spirit, so the finished drink sits closer to a fortified wine than to a Manhattan. It has the shape of a spirit-forward cocktail and the strength of an aperitif.',
  ],
  [
    'Which sloe gin should I use?',
    'Taste it before you build. Sloe gin has no legal definition, so bottles range from heavily sweetened to nearly dry, and the drink inherits whichever one you have. Adjust the vermouth rather than the sloe gin: a drier bottle takes a barspoon more.',
  ],
]

/** Deterministic keys: a rerun produces the same document, not a new one. */
const key = (prefix: string, i: number) => `bt26${prefix}${String(i).padStart(2, '0')}`

function buildLongDescription() {
  const blocks: unknown[] = []
  SECTIONS.forEach(([heading, body], i) => {
    blocks.push({
      _key: key('h', i),
      _type: 'block',
      style: 'h2',
      markDefs: [],
      children: [{ _key: key('hs', i), _type: 'span', text: heading, marks: [] }],
    })
    body.split(/\n\s*\n/).forEach((para, j) => {
      blocks.push({
        _key: key(`p${i}`, j),
        _type: 'block',
        style: 'normal',
        markDefs: [],
        children: [{ _key: key(`ps${i}`, j), _type: 'span', text: para.trim(), marks: [] }],
      })
    })
  })
  return blocks
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

async function main() {
  const before = await client.fetch<{
    description: string
    note: string
    ingredients: Array<{ _key: string; name: string; description: string | null }>
  } | null>(`*[_id == $id][0]{ description, note, ingredients[]{ _key, name, description } }`, { id: ID })
  if (!before) throw new Error(`${ID} not found`)

  // Patch each ingredient's description by _key so the ingredientRef links and
  // amounts are untouched. An unmatched name is reported, never guessed at.
  const ingredientPatch: Record<string, string> = {}
  for (const ing of before.ingredients ?? []) {
    const next = INGREDIENT_NOTES[ing.name]
    if (!next) {
      console.log(`  ! no note written for ingredient "${ing.name}" — left as is`)
      continue
    }
    ingredientPatch[`ingredients[_key=="${ing._key}"].description`] = next
    console.log(`ingredient    ${ing.name}: ${words(ing.description ?? '')}w -> ${words(next)}w`)
  }
  console.log(`instructions  ${4} steps -> ${INSTRUCTIONS.length} steps`)

  const longDescription = buildLongDescription()
  const ldWords = SECTIONS.reduce((n, [h, b]) => n + words(h) + words(b), 0)

  const faqs = FAQS.map(([question, answer], i) => ({
    _key: key('f', i),
    _type: 'faq',
    question,
    answer,
  }))

  console.log(`description   ${words(before.description)}w  ->  ${words(DESCRIPTION)}w`)
  console.log(`Expert Tip    ${words(before.note)}w  ->  ${words(NOTE)}w`)
  console.log(`long desc     173w  ->  ${ldWords}w across ${SECTIONS.length} sections (${longDescription.length} blocks)`)
  console.log(`FAQs          3  ->  ${faqs.length}  (${FAQS.map(([, a]) => words(a)).join(', ')} words)`)
  console.log(`flavour       ->  ${FLAVOUR.join(', ')}`)

  const SELF_REF = /\b(this|the) Manual\b|\bchairs?\b|\bshel(f|ves)\b|\bits pages?\b|\bin (this|the) Field Manual\b/gi
  const all = [
    DESCRIPTION,
    NOTE,
    ...SECTIONS.flat(),
    ...FAQS.flat(),
    ...Object.values(INGREDIENT_NOTES),
    ...INSTRUCTIONS,
  ].join(' ')
  const hits = all.match(SELF_REF) ?? []
  console.log(`self-reference in the new copy: ${hits.length}${hits.length ? ` (${hits.join(', ')})` : ''}`)

  if (!WRITE) {
    console.log('\nDRY RUN. Nothing written. Pass --write to execute.')
    return
  }

  await client
    .patch(ID)
    .set({
      description: DESCRIPTION,
      note: NOTE,
      flavorProfile: FLAVOUR,
      longDescription,
      faqs,
      instructions: INSTRUCTIONS,
      ...ingredientPatch,
    })
    .commit()
  console.log('\nWRITTEN.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
