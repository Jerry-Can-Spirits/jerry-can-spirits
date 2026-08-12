/**
 * Patch named fields on a cocktail, leaving everything else alone.
 *
 * The companion to scripts/rewrite-cocktail-batch.ts. That one replaces a page
 * wholesale, which is right when the copy is in the wrong register throughout.
 * This one exists because a good many pages are already well written and miss a
 * single band: the Americano's long description runs 482 words across four
 * solid sections and its Expert Tip runs 43. Rewriting the page to fix the tip
 * would throw away the part that was right.
 *
 * Everything is addressed by content rather than by index: ingredient notes by
 * ingredient name, FAQ answers by their existing question, section bodies by
 * their existing heading. An address that does not match throws, so a page that
 * has moved underneath the patch fails loudly instead of writing nothing.
 *
 * Run:  npx sanity exec scripts/patch-cocktail-fields.ts --with-user-token -- --batch=1
 *       ...add --write to execute.
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

interface Patch {
  id: string
  name: string
  description?: string
  note?: string
  flavorProfile?: string[]
  instructions?: string[]
  /**
   * Provenance. Set only where a specification was actually checked against the
   * source: the line exists to say someone looked, so an authority guessed at is
   * worse than an authority absent.
   */
  recipeSource?: { authority: RecipeAuthority; note?: string }
  /** Required when the authority is house, and meaningless anywhere else. */
  houseVariation?: string
  /** YYYY-MM-DD. */
  sourceCheckedAt?: string
  /** Ingredient name -> replacement note. */
  ingredientNotes?: Record<string, string>
  /**
   * Ingredient name -> replacement amount.
   *
   * Added for the IBA verification, where a page's copy is right and its
   * measures are not. Patched by _key like the notes, so the ingredient's
   * guide reference and its position in the recipe survive the change.
   */
  ingredientAmounts?: Record<string, string>
  /** Existing FAQ question -> replacement answer. */
  faqAnswers?: Record<string, string>
  /** Existing FAQ question -> replacement question, applied after faqAnswers. */
  faqQuestions?: Record<string, string>
  /** New [question, answer] pairs appended to the existing FAQs. */
  addFaqs?: Array<[string, string]>
  /** Existing section heading -> replacement body. Paragraphs split on blank lines. */
  sections?: Record<string, string>
  /** New [heading, body] sections appended to the long description. */
  addSections?: Array<[string, string]>
}

const BATCHES: Record<number, Patch[]> = {
  1: [
    {
      id: '99116009-89ce-4bf1-ad5e-19ebdf9b7bec',
      name: 'Americano',
      description: `The Americano was born at Gaspare Campari's bar in Milan in the 1860s, served then as the Milano-Torino after its two principal ingredients: Campari from Milan and sweet vermouth from Turin. The name Americano came later, attributed to the American tourists and expatriates who ordered it in such volume that the drink became associated with them. It is the direct ancestor of the Negroni, predating it by roughly half a century.

It is one of the simplest drinks in the canon and one of the most instructive. Three ingredients built directly in the glass, no shaking, no stirring beyond a single gentle turn to integrate the soda. The restraint is the point: this is a drink designed for length and sessionability, and for the specific pleasure of something bitter, sweet and effervescent taken slowly in warm weather before a meal.

The sweet vermouth is the variable that decides the whole thing. At equal volume to the Campari it has nowhere at all to hide.`,
      note: `Stir once and stop. The Americano is a carbonated drink and aggressive stirring will flatten it before the first sip. A single slow turn with a bar spoon is enough to bring the ingredients together, and the soda does the rest as it settles.

Fill the glass properly with large cubes. A half-filled glass warms fast, and a warm Americano turns syrupy as the soda goes flat; the ice is doing temperature control rather than dilution here, which is why large cubes beat crushed.

Treat the vermouth as perishable, because it is. It is a wine, it oxidises from the day it is opened, and at 30ml per drink a bottle that has stood at room temperature for three months will define the drink for entirely the wrong reasons. Refrigerate it and replace it within four weeks.`,
      ingredientNotes: {
        Campari:
          'The defining ingredient, and there is no meaningful substitute for it in this drink. Other red bitters make a pleasant aperitif; none of them makes an Americano.',
      },
      faqAnswers: {
        'What is an Americano?':
          "Campari, sweet vermouth and soda water, built over ice with a single gentle stir. A long, bitter, effervescent aperitif born at Gaspare Campari's Milan bar in the 1860s, where it was originally called the Milano-Torino after the home cities of its two main ingredients.",
      },
    },
    {
      id: 'cocktail-arnold-palmer',
      name: 'Arnold Palmer',
      description: `The Arnold Palmer is a drink invented by its own customer. The golf legend mixed iced tea with lemonade at home through the 1960s, ordered it at a Palm Springs bar in 1960 by describing it, and a woman at the next table asked for "that Palmer drink". He confirmed the story himself, traded on it graciously for fifty years, and it carries his name on cans across America.

The classic ratio is his own: three parts iced tea to one of lemonade, with the tea in charge and the lemonade sweetening and brightening from below. Bars pour it half and half, and Palmer himself corrected them for decades. Fresh-brewed tea, cooled quickly and never stewed, is the entire quality question.

It is the great American porch drink and a near-perfect session mocktail: cold, dry-finishing and endlessly refillable. The spiked version answers to John Daly, another golfer entirely, and a considerably different biography.`,
      note: `Three parts tea to one part lemonade. Palmer poured it that way at home and corrected bars that served it half and half for the better part of fifty years, and he was right on the merits as well as by authorship: the tea's tannin keeps the finish dry, and at an even split the sugar takes over and the drink turns flat and sweet.

Brew the tea properly and cool it fast. Normal strength, standard steeping time, then straight over ice or into the fridge. Tea left to stew goes bitter and cloudy, and iced tea made from a stewed brew cannot be rescued by anything the lemonade does.

Use a real cloudy lemonade rather than a clear sweet soda. The drink needs the lemon's acidity to work against the tannin, and a soda brings sugar and bubbles instead.`,
      ingredientNotes: {
        Lemonade:
          "One part, sweetening and brightening from below. Use a proper cloudy, sharp lemonade rather than a clear sweet soda: the drink needs real lemon acidity to work against the tea's tannin.",
      },
      sections: {
        'The Tea': `Fresh-brewed black tea at normal strength, cooled quickly to keep it bright. A standard breakfast blend is exactly right: the drink wants tannin and body rather than delicacy, so a fine single-estate tea is wasted here and a smoky lapsang is actively wrong.

Steeping time is the thing people get wrong. Three to four minutes is enough. Tea left to stew past that releases more tannin than the lemonade can balance, and it turns bitter and slightly cloudy, a cloudiness that gets worse as it chills, which is why an over-steeped brew looks murky by the time it reaches the glass. Cool it fast over ice or in the fridge rather than leaving it standing on the counter.`,
      },
      addSections: [
        [
          'The Ratio Argument',
          `Three to one is Palmer's own pour, and it is also the better drink, which is a convenient coincidence for anybody defending it.

Black tea brings tannin, which is drying and slightly bitter, and that is what gives the drink its finish. Lemonade brings sugar and acid. At three to one the sugar works as a seasoning: it rounds the tannin off and brightens the lemon without ever taking charge, and the glass finishes dry enough to want another. At one to one the sugar is the drink, the tannin is buried underneath it, and what you have is lemonade with a brown tint and a slight astringency.

Most bars pour it even because it is easier to remember and because sweeter drinks sell more reliably. Palmer spent the better part of five decades politely explaining why they were wrong, which is more patience than the question strictly deserved.`,
        ],
        [
          'Why It Works Without Alcohol',
          `A great many alcohol-free drinks fail for the same reason: they are simply sweet, with nothing to push against. This one does not, and the reason is tannin.

Tannin does structurally what bitterness and alcohol do in a cocktail. It gives the palate something astringent to work against, so the sweetness reads as balance rather than as sugar, and the finish clears instead of coating. That is why tea-based mixed drinks survive the removal of spirits when fruit-based ones usually do not, and it is worth knowing if you are building a list that has to serve people who are not drinking.

It is also genuinely sessionable in a way most alcohol-free drinks are not. There is no sugar crash waiting at the third glass, and it is as good on the fourth refill as it was on the first.`,
        ],
      ],
      faqAnswers: {
        'What is the correct Arnold Palmer ratio?':
          'Three parts iced tea to one part lemonade, by the man himself, who corrected bars that poured it even for the better part of fifty years. The tea leads, the finish stays dry, and the lemonade works as a seasoning rather than as the drink.',
        'Did Arnold Palmer really invent it?':
          'Yes, by his own account. He mixed it at home through the 1960s and ordered it by description at a Palm Springs bar in 1960, where a woman at the next table asked for "that Palmer drink". He told the story happily for the rest of his life.',
        'What is it with alcohol added?':
          'A John Daly: the same tea and lemonade with vodka or bourbon added, named for a golfer of famously different habits. It is a separate drink with a separate name, which is unusually tidy by the standards of cocktail naming.',
      },
    },
    {
      id: 'cocktail-twenty-first-century',
      name: '21st Century',
      note: `The rinse should be a rumour, not a statement. Pour a few millilitres into the chilled coupe, swirl it to coat the inside, and tip the rest out; what stays behind is a film, and a film is all the drink wants. Absinthe left sitting in the glass takes the anise from a frame to a flavour and flattens the cacao underneath it.

Use a blanco you can taste. The whole argument of the drink is that agave sits where juniper used to, so an anonymous mixing tequila leaves it structurally sound and pointless. Pepper and green agave character is what you are looking for.

Serve it without a garnish. The nose is already dressed by the rinse, and anything on the rim competes with the only aromatic the drink has.`,
      ingredientNotes: {
        'Fresh Lemon Juice':
          'Inherited from the ancestor unchanged, and it is the acid frame both Centuries are built on. Twenty-two millilitres against the same measure of cacao is the balance point.',
      },
      sections: {
        'The Origin': `Jim Meehan built the 21st Century at PDT in New York in 2007. PDT — Please Don't Tell — had opened that year behind a phone booth in a hot dog shop on St Marks Place, and it became one of the most influential bars of the revival almost immediately.

The drink is a deliberate act of succession rather than a variation. The 20th Century first appeared in print in the 1937 Café Royal Cocktail Book, credited to Walter Whiting and reportedly named for the Twentieth Century Limited train, and it runs gin, Lillet Blanc, lemon and white crème de cacao. Meehan's update moves the whole thing along the timeline: tequila for gin, an absinthe rinse for the Lillet, and the lemon and cacao left exactly where they were.

It is one of very few modern drinks that names its ancestor in its own title, and it survives the comparison that invites.`,
      },
      addSections: [
        [
          'The Cacao Problem',
          `White crème de cacao is the ingredient that makes people doubt both drinks, and the doubt is reasonable until you taste it. Chocolate in a sour sounds like a dessert and is not.

The clear version carries cocoa butter smoothness and a light roasted note without the sugar or the colour of the brown version, and at 22ml against 22ml of lemon it reads as texture more than as flavour. What it actually does is fill the middle of the drink, giving the sour a body it would not otherwise have.

Substituting brown crème de cacao is the most common way this goes wrong. It is sweeter, heavier and unmistakably chocolate, and it turns a strange, elegant drink into a novelty.`,
        ],
        [
          'Against the 20th Century',
          `The two drinks share a skeleton and almost nothing else, which is what makes them worth pouring together.

The 1937 original runs on gin and Lillet: juniper against a soft, faintly bitter aperitif wine, with the cacao smoothing the join. It is floral, delicate and quite dry. The 2007 update runs on blanco tequila with absinthe in place of the wine, and the whole register drops: pepper and green agave in the middle, anise hanging over the top, and the same cacao doing the same job with much louder neighbours.

Pour the ancestor first. Taken in that order the succession is obvious, and the update sounds like an argument rather than a stunt.`,
        ],
      ],
      faqAnswers: {
        'Which tequila should I use?':
          "A characterful blanco with pepper, citrus and clear green agave. Reposado's oak softens exactly the edges this drink needs sharp, and it blurs into the crème de cacao until the point of the substitution disappears. Save the aged bottles for stirred drinks.",
        'What does the absinthe rinse do?':
          'It coats the glass with an anise perfume that sits over the drink without mixing into it, so it frames every sip from the nose rather than joining the flavour. It is doing the job Lillet did in the 1937 original, and the excess is discarded rather than wasted.',
      },
    },
    {
      id: 'cocktail-woo-woo',
      name: 'Woo Woo',
      description: `The Woo Woo is the 1980s stripped to essentials: vodka, peach schnapps and cranberry juice, three pours over ice with a name that is its own toast. It rode the same 1984 schnapps wave that produced the Fuzzy Navel and Sex on the Beach, and of the three it is the leanest, with no orange sunshine, just peach sweetness against cranberry sharpness at party speed.

Its virtue is exactly that economy. The cranberry's acid does all the balancing a drink this simple needs, the schnapps needs no help from syrup, and the whole thing assembles in about the time it takes to say the name twice.

Poured honestly, with decent vodka, an actual measure and cold cranberry, it remains what it always was: a drink with no ambitions beyond the next half hour, executed perfectly within them. That is a narrower brief than most cocktails set themselves, and one of the few that is met exactly.`,
      note: `Measure the vodka and measure the schnapps. Two to one is the ratio that keeps the drink drinkable, and the failure mode of every bad Woo Woo is a free hand with the schnapps: peach liqueur is sweet, one-dimensional and very willing to take over, and once it does the cranberry cannot pull the drink back.

Get everything cold before it goes near the glass. There is nothing here to shake and nothing to dilute, so the fridge is doing the work a shaker would otherwise do, and cranberry juice straight from a room-temperature carton makes a flat, syrupy drink no matter how good the ratio is.

The lime squeeze is the one modern addition worth keeping. It dries the finish and cuts the schnapps, and it costs nothing.`,
      ingredientNotes: {
        Vodka:
          'The frame, and enough spine to keep the schnapps honest. Nothing expensive is required, but an actual measure is: the ratio is the only structure this drink has.',
      },
      sections: {
        'The Family Tree': `Three drinks came out of the same moment and they are all one ingredient apart from each other. Add orange juice to a Woo Woo and it becomes Sex on the Beach. Take the vodka out and it collapses toward the Fuzzy Navel, which is peach schnapps and orange juice and nothing else.

The Woo Woo is the middle child and, per minute of effort, the most drinkable of the three. It has the sharpness Sex on the Beach dilutes with orange and the backbone the Fuzzy Navel lacks entirely, and it needs one fewer bottle than either.

All three exist because a single product launched in 1984 and needed something to be in. That is an unusually honest origin for a drink family, and none of them pretends otherwise.`,
      },
      addSections: [
        [
          'The Cranberry Question',
          `Cranberry is the only balancing element in the glass and it is doing more than it appears to. Peach schnapps is close to pure sugar with a flavour attached, and without something genuinely acidic underneath it the drink would be undrinkable within two sips.

This is one of the few places where the carton is the right answer. Commercial cranberry juice is a blend, usually sweetened, and that is exactly what the recipe assumes: pure unsweetened cranberry is aggressively sour and turns the drink austere and strange. Use a standard cranberry juice drink, cold, and do not go looking for the artisanal version.

What does matter is that it is fresh out of the fridge rather than open for a fortnight, because it flattens as it oxidises.`,
        ],
        [
          'What It Is For',
          `There is no craft argument to make here and no lost history to recover. The Woo Woo was designed to be made quickly, in quantity, by somebody who was already at a party, and it does that better than almost anything else.

That is a legitimate category. A drink that takes two minutes and three bottles, tastes good cold and does not punish a heavy hand is genuinely useful, and the alternative at most gatherings is warm wine.

It scales by simple multiplication, which is the other half of the point. A jug is the same recipe with the numbers multiplied and the ice added at the end, and nothing about it suffers for being made forty at a time.`,
        ],
      ],
      faqAnswers: {
        'What is in a Woo Woo?':
          'Vodka, peach schnapps and cranberry juice over ice, with a squeeze of lime in the modern reading. It is the leanest member of the 1980s schnapps family, and the only one of the three that does not use orange juice to soften the sweetness.',
        'Where does the name come from?':
          'The 1980s, and most likely from the sound its own drinkers were making. The name is the toast, which is about as much etymology as anybody has ever needed, and no more dignified explanation has ever come forward to replace it.',
        'Woo Woo or Sex on the Beach?':
          "One ingredient apart. Sex on the Beach adds orange juice, which softens the drink and rounds off the cranberry's edge; the Woo Woo skips it and runs sharper and simpler. Choose by whether the evening wants sunshine or speed.",
      },
    },
  ],
}

const key = (id: string, p: string, i: number) =>
  `${id.replace(/[^a-z0-9]/gi, '').slice(-8)}${p}${String(i).padStart(2, '0')}`
const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

interface Span { _key: string; _type: string; text?: string; marks?: string[] }
interface Block { _key: string; _type: string; style?: string; children?: Span[]; markDefs?: unknown[] }
interface Faq { _key: string; _type?: string; question?: string; answer?: string }
interface Ing { _key: string; name?: string; amount?: string | null; description?: string | null }
interface Doc {
  description: string | null
  note: string | null
  flavorProfile: string[] | null
  instructions: string[] | null
  longDescription: Block[] | null
  faqs: Faq[] | null
  ingredients: Ing[] | null
  recipeSource: { authority?: string; note?: string } | null
  houseVariation: string | null
  sourceCheckedAt: string | null
}

const blockText = (b: Block[]) =>
  b.filter((x) => x._type === 'block').map((x) => (x.children ?? []).map((c) => c.text ?? '').join('')).join(' ')

function bodyBlocks(id: string, tag: string, body: string): Block[] {
  return body.split(/\n\s*\n/).map((para, j) => ({
    _key: key(id, `${tag}p`, j),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key(id, `${tag}s`, j), _type: 'span', text: para.trim(), marks: [] }],
  }))
}

async function apply(p: Patch) {
  if (p.id.startsWith('drafts.')) throw new Error(`${p.id} is a draft — the live site would never read it`)

  const doc = await client.fetch<Doc | null>(
    `*[_id == $id][0]{ description, note, flavorProfile, instructions, longDescription, faqs, ingredients,
      recipeSource, houseVariation, sourceCheckedAt }`,
    { id: p.id }
  )
  if (!doc) throw new Error(`${p.id} not found`)

  const set: Record<string, unknown> = {}

  if (p.description !== undefined) set.description = p.description
  if (p.note !== undefined) set.note = p.note
  if (p.flavorProfile !== undefined) set.flavorProfile = p.flavorProfile
  if (p.instructions !== undefined) set.instructions = p.instructions

  // Provenance is validated against the effective document — the patch merged
  // over what is already stored — because setting an authority of house on a
  // page that already carries its variation is legitimate, and so is adding a
  // checked date to an authority set on an earlier run.
  if (p.recipeSource || p.houseVariation !== undefined || p.sourceCheckedAt !== undefined) {
    const verdict = validateRecipeSourceInput({
      authority: p.recipeSource?.authority ?? doc.recipeSource?.authority ?? '',
      note: p.recipeSource?.note,
      houseVariation: p.houseVariation ?? doc.houseVariation ?? undefined,
      checkedAt: p.sourceCheckedAt,
    })
    if (verdict !== true) throw new Error(`${p.name}: ${verdict}`)

    if (p.recipeSource) {
      set.recipeSource = {
        _type: 'object',
        authority: p.recipeSource.authority,
        ...(p.recipeSource.note ? { note: p.recipeSource.note } : {}),
      }
    }
    if (p.houseVariation !== undefined) set.houseVariation = p.houseVariation
    if (p.sourceCheckedAt !== undefined) set.sourceCheckedAt = p.sourceCheckedAt
  }

  // Ingredient notes and amounts are patched by _key so refs and position survive.
  if (p.ingredientNotes || p.ingredientAmounts) {
    const byName = new Map((doc.ingredients ?? []).map((i) => [i.name ?? '', i._key]))
    const address = (name: string) => {
      const k = byName.get(name)
      if (!k) throw new Error(`${p.name}: no ingredient named "${name}"`)
      return k
    }
    for (const [name, note] of Object.entries(p.ingredientNotes ?? {})) {
      set[`ingredients[_key=="${address(name)}"].description`] = note
    }
    for (const [name, amount] of Object.entries(p.ingredientAmounts ?? {})) {
      set[`ingredients[_key=="${address(name)}"].amount`] = amount
    }
  }

  let faqs = (doc.faqs ?? []).map((f) => ({ ...f }))
  if (p.faqAnswers || p.faqQuestions || p.addFaqs) {
    for (const [question, answer] of Object.entries(p.faqAnswers ?? {})) {
      const hit = faqs.find((f) => f.question === question)
      if (!hit) throw new Error(`${p.name}: no FAQ asking "${question}"`)
      hit.answer = answer
    }
    for (const [question, next] of Object.entries(p.faqQuestions ?? {})) {
      const hit = faqs.find((f) => f.question === question)
      if (!hit) throw new Error(`${p.name}: no FAQ asking "${question}"`)
      hit.question = next
    }
    faqs = faqs.concat(
      (p.addFaqs ?? []).map(([question, answer], i) => ({
        _key: key(p.id, 'nf', i),
        _type: 'faq',
        question,
        answer,
      }))
    )
    set.faqs = faqs
  }

  let long = (doc.longDescription ?? []).map((b) => ({ ...b }))
  if (p.sections || p.addSections) {
    for (const [heading, body] of Object.entries(p.sections ?? {})) {
      const at = long.findIndex(
        (b) => /^h[23]$/.test(b.style ?? '') && (b.children ?? []).map((c) => c.text ?? '').join('') === heading
      )
      if (at === -1) throw new Error(`${p.name}: no section headed "${heading}"`)
      let end = at + 1
      while (end < long.length && !/^h[23]$/.test(long[end].style ?? '')) end++
      const tag = `r${at}`
      long = [...long.slice(0, at + 1), ...bodyBlocks(p.id, tag, body), ...long.slice(end)]
    }
    ;(p.addSections ?? []).forEach(([heading, body], i) => {
      long.push({
        _key: key(p.id, 'nh', i),
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{ _key: key(p.id, 'nhs', i), _type: 'span', text: heading, marks: [] }],
      })
      long.push(...bodyBlocks(p.id, `n${i}`, body))
    })
    set.longDescription = long
  }

  const finalFaqs = (set.faqs as Faq[] | undefined) ?? doc.faqs ?? []
  const finalLong = (set.longDescription as Block[] | undefined) ?? doc.longDescription ?? []
  const headings = finalLong.filter((b) => /^h[23]$/.test(b.style ?? '')).length
  const ld = words(blockText(finalLong))
  const desc = words((set.description as string | undefined) ?? doc.description)
  const tip = words((set.note as string | undefined) ?? doc.note)

  const ingNotes = (doc.ingredients ?? []).map((i) => p.ingredientNotes?.[i.name ?? ''] ?? i.description ?? '')
  const thin = ingNotes.filter((n) => words(n) < 15).length
  const all = [
    (set.description as string) ?? doc.description ?? '',
    (set.note as string) ?? doc.note ?? '',
    blockText(finalLong),
    ...finalFaqs.flatMap((f) => [f.question ?? '', f.answer ?? '']),
    ...ingNotes,
  ].join(' ')
  const hits = selfReferences(all)

  const authority =
    (set.recipeSource as { authority?: string } | undefined)?.authority ?? doc.recipeSource?.authority
  const sourceNote =
    (set.recipeSource as { note?: string } | undefined)?.note ?? doc.recipeSource?.note
  const checkedAt = (set.sourceCheckedAt as string | undefined) ?? doc.sourceCheckedAt

  console.log(`  ${p.name}`)
  // The whole recipe, whenever a measure moves: a spec change is the one edit
  // here that alters what a reader pours, so it is shown rather than counted.
  if (p.ingredientAmounts) {
    for (const ing of doc.ingredients ?? []) {
      const next = p.ingredientAmounts[ing.name ?? '']
      const was = ing.amount ?? ''
      console.log(
        `      ${next ? `${was.padStart(8)} -> ${next.padEnd(10)}` : `${was.padStart(8)}${' '.repeat(14)}`}${ing.name}`
      )
    }
  }
  console.log(`    description ${desc}w | tip ${tip}w | long ${ld}w / ${headings} sections`)
  console.log(
    `    faqs ${finalFaqs.map((f) => words(f.answer)).join(', ')} | thin ing notes ${thin}/${ingNotes.length} | self-ref ${hits.length}`
  )
  if (hits.length) console.log(`    !! SELF-REFERENCE: ${hits.join(', ')}`)
  // Printed rather than counted: the source line is the one field whose value
  // is a claim about the outside world, so it is worth reading before it ships.
  if (authority) console.log(`    ${recipeSourceLine(authority, sourceNote, checkedAt)}`)

  if (WRITE) await client.patch(p.id).set(set).commit()
}

async function main() {
  const batch = BATCHES[BATCH]
  if (!batch?.length) throw new Error(`No batch ${BATCH}`)
  console.log(`Patch batch ${BATCH}: ${batch.length} cocktail(s)\n`)
  for (const p of batch) await apply(p)
  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
