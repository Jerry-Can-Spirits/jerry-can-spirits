/**
 * Find pages whose prose names an ingredient the recipe does not contain.
 *
 * The removed-ingredient echo in patch-cocktail-fields.ts only fires while a
 * change is being made, and only for the lines that change. It found six stale
 * references across the twenty pages the IBA pass touched. Nothing has ever
 * checked the other 328, and the copy pass rewrote recipes too, so this class
 * of mismatch may well predate that work.
 *
 * The check is the same idea run backwards. Instead of "the prose still names
 * what we removed", it asks "the prose names something that is not in the
 * recipe" — for every ingredient the site knows about, against every page.
 *
 * Tiering, because the raw signal is noisy and most of the noise is legitimate:
 *
 *   FLAG   The sentence asserts the ingredient is in this drink — a definite
 *          article ("the vermouth"), a measure, or a build verb — and carries
 *          no comparison or substitution language. These read as defects.
 *   NOTE   Everything else. History that names another drink's ingredients,
 *          variation talk, "swap the gin for mezcal". Counted, not listed.
 *
 * History and variation sections are always NOTE: naming an ingredient the
 * drink does not contain is the entire job of that prose.
 *
 * Ownership follows the ingredient tree in both directions. A recipe calling
 * for Lagavulin 16 owns "Islay Scotch"; one calling for Gin owns "Plymouth
 * Gin". Only a mention from an unrelated lineage counts as a mismatch.
 *
 * Run:  npx sanity exec scripts/audit-prose-mismatch.ts --with-user-token
 *       ...add -- --slug=clover-club to inspect one page (prints NOTEs too).
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const ONLY = process.argv.find((a) => a.startsWith('--slug='))?.split('=')[1]

interface IngredientDoc {
  _id: string
  name: string
  category: string | null
  parentId: string | null
}

interface Line {
  name?: string
  amount?: string | null
  description?: string | null
  refId?: string | null
}

interface Block {
  _type: string
  style?: string
  children?: Array<{ text?: string }>
}

interface Doc {
  name: string
  slug: string
  description: string | null
  note: string | null
  instructions: string[] | null
  longDescription: Block[] | null
  faqs: Array<{ question?: string; answer?: string }> | null
  ingredients: Line[] | null
  variants: Array<{ name?: string; ingredients?: Line[] }> | null
}

/**
 * Names that match everything and mean nothing. A page saying "sugar" or "ice"
 * tells us nothing about whether its recipe is coherent, and every one of them
 * would fire on every page.
 */
const TOO_GENERIC = new Set([
  'ice',
  'water',
  'sugar',
  'salt',
  'juice',
  'syrup',
  'bitters',
  'soda',
  'cream',
  'milk',
  'egg',
  'egg white',
  'garnish',
  'peel',
  'zest',
  'twist',
  'cherry',
  'spirits',
  'liqueur',
  'wine',
  'beer',
  'tea',
  'coffee',
  'cocktail',
])

/**
 * Different names for the same bottle. Cointreau in the list and "orange
 * liqueur" in the prose is one ingredient described twice, not a mismatch.
 */
const SYNONYMS: string[][] = [
  ['cointreau', 'triple sec', 'orange liqueur', 'curaçao', 'curacao', 'grand marnier'],
  ['simple syrup', 'sugar syrup', 'gomme', 'gomme syrup', 'rich syrup'],
  ['soda water', 'club soda', 'sparkling water', 'carbonated water'],
  ['angostura', 'angostura bitters', 'aromatic bitters'],
  ['lime juice', 'fresh lime juice', 'lime'],
  ['lemon juice', 'fresh lemon juice', 'lemon'],
  ['grapefruit juice', 'fresh grapefruit juice', 'grapefruit'],
  ['orange juice', 'fresh orange juice'],
  ['prosecco', 'champagne', 'sparkling wine', 'cava'],
  ['maraschino', 'maraschino liqueur', 'luxardo'],
  ['creme de cassis', 'crème de cassis', 'cassis'],
  ['creme de menthe', 'crème de menthe'],
  ['creme de cacao', 'crème de cacao'],
  ['ginger beer', 'ginger ale'],
]

/** Qualifiers a writer drops in prose: "Fresh Lime Juice" becomes "lime". */
const QUALIFIERS =
  /\b(fresh|dry|white|dark|light|blended|aged|extra|simple|plain|single|malt|premium|London|juice|syrup|whisky|whiskey|liqueur)\b/gi

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const bare = (name: string) =>
  name
    .replace(/\(.*?\)/g, ' ')
    .replace(QUALIFIERS, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

/** A sentence that compares, substitutes or speculates is not asserting a build. */
const SUPPRESS =
  /\b(instead|substitut|swap|replac|variation|variant|sibling|cousin|ancestor|descend|if you|some recipes|other recipes|other bars|unlike|whereas|compar|rather than|in place of|traditionally|originally|historically|not to be confused|version of|would have|used to|no longer|omit|leave out)\b/i

/** A sentence that measures, pours or stirs is asserting a build. */
const BUILD =
  /\b(\d+\s*(?:ml|millilitres?)|millilitres?|dash(?:es)?|barspoons?|teaspoons?|measures?|add|adds|pour|pours|stir|stirred|shake|shaken|muddle|muddled|float|build|top(?:ped)? with|strain|combine|goes in|calls for)\b/i

/** Prose whose job is to name ingredients this drink does not contain. */
const DIGRESSION = /(origin|history|story|variation|twist|relative|family|cousin|confus|compar|versus|vs\b)/i

const sentencesOf = (prose: string) =>
  prose
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

interface Passage {
  field: string
  text: string
  digression: boolean
}

/** Every piece of prose on the page, labelled, with headings carried down. */
function passages(doc: Doc): Passage[] {
  const out: Passage[] = []
  const push = (field: string, text: string | null | undefined, digression = false) => {
    if (text && text.trim()) out.push({ field, text, digression })
  }

  push('description', doc.description)
  push('expert tip', doc.note)
  for (const [i, step] of (doc.instructions ?? []).entries()) push(`instruction ${i + 1}`, step)
  for (const line of doc.ingredients ?? []) {
    if (line.description) push(`note: ${line.name ?? '?'}`, line.description)
  }
  for (const faq of doc.faqs ?? []) {
    const digression = DIGRESSION.test(faq.question ?? '')
    push(`faq: ${(faq.question ?? '').slice(0, 48)}`, faq.answer, digression)
  }

  let heading = 'long description'
  let digression = false
  for (const block of doc.longDescription ?? []) {
    if (block._type !== 'block') continue
    const text = (block.children ?? []).map((c) => c.text ?? '').join('')
    if (block.style && /^h\d$/.test(block.style)) {
      heading = text
      digression = DIGRESSION.test(text)
      continue
    }
    push(heading, text, digression)
  }
  return out
}

interface Hit {
  field: string
  term: string
  sentence: string
}

async function main() {
  const ingredients = await client.fetch<IngredientDoc[]>(
    `*[_type == "ingredient" && !(_id in path("drafts.**")) && defined(slug.current)]{
      _id, name, category, "parentId": parent._ref
    }`
  )

  const byId = new Map(ingredients.map((i) => [i._id, i]))
  const children = new Map<string, string[]>()
  for (const ing of ingredients) {
    if (!ing.parentId) continue
    children.set(ing.parentId, [...(children.get(ing.parentId) ?? []), ing._id])
  }

  const synonymOf = new Map<string, number>()
  SYNONYMS.forEach((group, i) => group.forEach((term) => synonymOf.set(term, i)))

  // term -> the ingredients it could mean. Garnishes are excluded: a page is
  // meant to talk about the cherry it is not serving.
  //
  // Single words are only allowed from the bottle categories. Everywhere else
  // the short form of an ingredient is a flavour word — "Orange Juice" gives
  // "orange", "Honey Syrup" gives "honey" — and prose about how a drink tastes
  // is not prose about what is in it. Reading "the honey and herbal notes" of
  // Chartreuse as a missing bottle of honey syrup was the loudest false
  // positive in the first run, by a distance.
  const vocabulary = new Map<string, Set<string>>()
  for (const ing of ingredients) {
    if (ing.category === 'garnishes') continue
    const bottled = ['spirits', 'liqueurs', 'fortified', 'wine', 'bitters'].includes(ing.category ?? '')
    for (const term of [ing.name.toLowerCase(), bare(ing.name)]) {
      if (term.length < 4 || TOO_GENERIC.has(term)) continue
      if (!bottled && !term.includes(' ')) continue
      vocabulary.set(term, (vocabulary.get(term) ?? new Set()).add(ing._id))
    }
  }

  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && !(_id in path("drafts.**")) && defined(slug.current)
      ${ONLY ? `&& slug.current == "${ONLY}"` : ''}]{
      name, "slug": slug.current, description, note, instructions, longDescription,
      faqs[]{ question, answer },
      ingredients[]{ name, amount, description, "refId": ingredientRef._ref },
      variants[]{ name, ingredients[]{ name, "refId": ingredientRef._ref } }
    } | order(name asc)`
  )

  const flagged: Array<{ doc: Doc; hits: Hit[] }> = []
  const unusedLines: Array<{ doc: Doc; names: string[] }> = []
  let notes = 0

  for (const doc of docs) {
    const lines = [...(doc.ingredients ?? []), ...(doc.variants ?? []).flatMap((v) => v.ingredients ?? [])]

    // Ownership walks up to the parent and back down to its children, so a
    // recipe calling for a specific bottle owns the category it belongs to.
    const owned = new Set<string>()
    for (const line of lines) {
      if (!line.refId) continue
      for (let id: string | null = line.refId; id; id = byId.get(id)?.parentId ?? null) {
        owned.add(id)
        for (const child of children.get(id) ?? []) owned.add(child)
      }
    }

    const ownedTerms = new Set<string>()
    for (const line of lines) {
      for (const term of [(line.name ?? '').toLowerCase(), bare(line.name ?? '')]) {
        if (!term) continue
        ownedTerms.add(term)
        const group = synonymOf.get(term)
        if (group !== undefined) SYNONYMS[group].forEach((t) => ownedTerms.add(t))
      }
    }
    for (const id of owned) {
      const ing = byId.get(id)
      if (!ing) continue
      ownedTerms.add(ing.name.toLowerCase())
      ownedTerms.add(bare(ing.name))
    }

    const hits: Hit[] = []
    for (const passage of passages(doc)) {
      for (const sentence of sentencesOf(passage.text)) {
        for (const [term, ids] of vocabulary) {
          if (ownedTerms.has(term)) continue
          if ([...ids].some((id) => owned.has(id))) continue
          // "orange" inside an owned "orange bitters" is the same bottle named
          // once, not two ingredients one of which is missing.
          if ([...ownedTerms].some((t) => new RegExp(`\\b${escapeRegex(term)}\\b`).test(t))) continue
          // A hyphen makes a compound of its own: "lemon-lime soda" is not lime,
          // and "the tequila-based 21st Century" is not a pour of tequila. Nor
          // is a champagne flute a pour of champagne.
          const mention = new RegExp(
            `(?<!-)\\b${escapeRegex(term)}\\b(?!-)(?!\\s+(?:flute|glass|coupe|saucer|shelf|bottle))`,
            'i'
          )
          if (!mention.test(sentence)) continue

          const asserted =
            new RegExp(`\\bthe ${escapeRegex(term)}\\b`, 'i').test(sentence) || BUILD.test(sentence)
          if (passage.digression || SUPPRESS.test(sentence) || !asserted) {
            notes++
            if (ONLY) hits.push({ field: `NOTE ${passage.field}`, term, sentence })
            continue
          }
          if (hits.some((h) => h.sentence === sentence && h.field === passage.field)) continue
          hits.push({ field: passage.field, term, sentence })
        }
      }
    }
    if (hits.length) flagged.push({ doc, hits })

    // The other half of the same question: a line in the recipe that the method
    // never tells you what to do with.
    const method = [
      ...(doc.instructions ?? []),
      ...(doc.longDescription ?? []).flatMap((b) => (b.children ?? []).map((c) => c.text ?? '')),
    ]
      .join(' ')
      .toLowerCase()
    const orphans = (doc.ingredients ?? [])
      .map((l) => l.name ?? '')
      .filter((name) => {
        const term = bare(name) || name.toLowerCase()
        return term.length > 3 && !method.includes(term) && !method.includes(name.toLowerCase())
      })
    if (orphans.length) unusedLines.push({ doc, names: orphans })
  }

  console.log(`Checked ${docs.length} cocktails against ${vocabulary.size} ingredient terms.\n`)

  console.log('=== PROSE NAMES AN INGREDIENT THE RECIPE DOES NOT HAVE ===\n')
  for (const { doc, hits } of flagged) {
    console.log(`${doc.name}  (${doc.slug})`)
    for (const hit of hits) {
      console.log(`   [${hit.field}] ${hit.term}`)
      console.log(`      ${hit.sentence}`)
    }
    console.log('')
  }
  console.log(`${flagged.length} of ${docs.length} pages flagged, ${flagged.reduce((n, f) => n + f.hits.length, 0)} sentence(s).`)
  console.log(`${notes} further mention(s) read as history, comparison or substitution, and are not listed.\n`)

  console.log('=== RECIPE LINE NEVER NAMED IN THE METHOD ===\n')
  for (const { doc, names } of unusedLines) console.log(`  ${doc.name.padEnd(34)} ${names.join(', ')}`)
  console.log(`\n${unusedLines.length} of ${docs.length} pages carry a line the method never mentions.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
