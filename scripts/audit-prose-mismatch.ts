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
/** The editorial scan is advisory and noisy, so it is off unless asked for. */
const PROSE = process.argv.includes('--prose')

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
  /**
   * The garnish is part of the drink and lives in its own field.
   *
   * Without it the method's "garnish with a maraschino cherry" reads as a pour
   * of maraschino liqueur the recipe does not list, and "fresh mint" on a
   * Julep reads as a missing ingredient. Seven of the first seventeen faults
   * reported were this.
   */
  garnishLines: Line[] | null
  variants: Array<{ name?: string; ingredients?: Line[]; instructions?: string[] | null }> | null
}

/**
 * One recipe and the method that builds it.
 *
 * The page carries several. Until 16 August 2026 this audit pooled the main
 * recipe's ingredients with every variant's into a single owned set, so a
 * method could name anything any variant contained and pass. The Sazerac was
 * built on rye in its method while its recipe listed cognac, and the audit read
 * it as owned because the page carries a Rye Sazerac variant. Variant methods
 * were not fetched at all, so a variation has never had its own build checked.
 *
 * A build owns its own lines and nothing else.
 */
interface Build {
  label: string
  /** Checked both ways: the method must name these, and may name only these. */
  lines: Line[]
  /** Owned but not orphan-checked. A method need not name every garnish. */
  alsoOwns: Line[]
  instructions: string[]
}

/**
 * Accent- and apostrophe-insensitive.
 *
 * Bénédictine in the recipe and benedictine in the method is one ingredient,
 * and so is Peychaud’s against Peychaud's. Both were reported as missing until
 * the folding went in.
 */
const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '')
    .toLowerCase()

/**
 * A method that pours the list without naming it.
 *
 * "Add everything except the garnish to a shaker" is complete instruction and
 * leaves every line unnamed, which the orphan check would otherwise report as
 * eight missing ingredients.
 */
const CATCHALL =
  /\b(?:all (?:of )?the ingredients|all ingredients|everything (?:else|but|except)?|remaining ingredients|the rest)\b/i

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
      "garnishLines": garnishes[]{ "name": ingredient->name, "refId": ingredient._ref },
      variants[]{ name, instructions, ingredients[]{ name, description, "refId": ingredientRef._ref } }
    } | order(name asc)`
  )

  /** What a set of recipe lines owns: the ids, and every name for them. */
  const ownership = (lines: Line[]) => {
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
    return { owned, ownedTerms }
  }

  interface Fault {
    doc: Doc
    build: string
    kind: 'names' | 'orphan'
    detail: string
    line?: string
  }
  const faults: Fault[] = []
  const flagged: Array<{ doc: Doc; hits: Hit[] }> = []
  let notes = 0

  for (const doc of docs) {
    // The garnish belongs to every build on the page: a variation states its
    // own measures, not its own cherry.
    const garnish = doc.garnishLines ?? []
    const builds: Build[] = [
      {
        label: 'recipe',
        lines: doc.ingredients ?? [],
        alsoOwns: garnish,
        instructions: doc.instructions ?? [],
      },
      ...(doc.variants ?? []).map((v) => ({
        label: `variation: ${v.name ?? '?'}`,
        lines: v.ingredients ?? [],
        alsoOwns: garnish,
        instructions: v.instructions ?? [],
      })),
    ]

    // Each build is judged against its own lines. A method may only name what
    // its own recipe contains.
    for (const build of builds) {
      const { owned, ownedTerms } = ownership([...build.lines, ...build.alsoOwns])
      const method = build.instructions.join(' ')
      const foldedMethod = fold(method)

      for (const [i, step] of build.instructions.entries()) {
        for (const [term, ids] of vocabulary) {
          if (ownedTerms.has(term)) continue
          if ([...ids].some((id) => owned.has(id))) continue
          if ([...ownedTerms].some((t) => new RegExp(`\\b${escapeRegex(term)}\\b`).test(t))) continue
          const mention = new RegExp(
            `(?<!-)\\b${escapeRegex(term)}\\b(?!-)(?!\\s+(?:flute|glass|coupe|saucer|shelf|bottle))`,
            'i'
          )
          if (!mention.test(step)) continue
          faults.push({
            doc,
            build: build.label,
            kind: 'names',
            detail: term,
            line: `step ${i + 1}: ${step}`,
          })
        }
      }

      // The other half of the same question: a line the method never tells you
      // what to do with. Skipped where the method pours the list wholesale.
      if (!CATCHALL.test(method)) {
        for (const line of build.lines) {
          const name = line.name ?? ''
          if (!name.trim()) continue
          // Synonyms count: a recipe listing Simple Syrup and a method calling
          // for sugar syrup is one ingredient under two names.
          const group = synonymOf.get(name.toLowerCase()) ?? synonymOf.get(bare(name))
          const forms = [name, bare(name), ...(group !== undefined ? SYNONYMS[group] : [])]
            .filter(Boolean)
            .map(fold)
          const words = forms
            .flatMap((f) => f.replace(/[(),']/g, ' ').split(/\s+/))
            .filter((w) => w && !TOO_GENERIC.has(w) && w.length > 2)
          const named =
            forms.some((f) => foldedMethod.includes(f)) || words.some((w) => foldedMethod.includes(w))
          if (!named) {
            faults.push({ doc, build: build.label, kind: 'orphan', detail: name })
          }
        }
      }
    }

    if (!PROSE) continue

    const { owned, ownedTerms } = ownership([
      ...(doc.ingredients ?? []),
      ...(doc.variants ?? []).flatMap((v) => v.ingredients ?? []),
    ])

    const hits: Hit[] = []
    for (const passage of passages(doc)) {
      if (passage.field.startsWith('instruction')) continue
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
  }

  const builds = docs.reduce((n, d) => n + 1 + (d.variants ?? []).length, 0)
  console.log(`Checked ${docs.length} cocktails, ${builds} builds, against ${vocabulary.size} ingredient terms.\n`)

  console.log('=== METHOD AND RECIPE DISAGREE ===\n')
  const byDoc = new Map<string, Fault[]>()
  for (const f of faults) byDoc.set(f.doc.slug, [...(byDoc.get(f.doc.slug) ?? []), f])
  for (const [slug, list] of byDoc) {
    console.log(`${list[0].doc.name}  (${slug})`)
    for (const f of list) {
      if (f.kind === 'names') {
        console.log(`   [${f.build}] method names "${f.detail}", which the recipe does not list`)
        console.log(`      ${f.line}`)
      } else {
        console.log(`   [${f.build}] "${f.detail}" is listed but the method never names it`)
      }
    }
    console.log('')
  }
  const names = faults.filter((f) => f.kind === 'names').length
  const orphans = faults.filter((f) => f.kind === 'orphan').length
  console.log(`${byDoc.size} of ${docs.length} pages. ${names} method(s) name a missing ingredient, ${orphans} line(s) unused.`)

  if (!PROSE) {
    console.log('\nEditorial prose was not scanned. Pass -- --prose for the advisory list.')
    return
  }

  console.log('\n=== ADVISORY: EDITORIAL PROSE NAMES AN ABSENT INGREDIENT ===')
  console.log('Mostly legitimate. Comparisons, history and flavour notes name other drinks by design.\n')
  for (const { doc, hits } of flagged) {
    console.log(`${doc.name}  (${doc.slug})`)
    for (const hit of hits) {
      console.log(`   [${hit.field}] ${hit.term}`)
      console.log(`      ${hit.sentence}`)
    }
    console.log('')
  }
  console.log(`${flagged.length} page(s), ${flagged.reduce((n, f) => n + f.hits.length, 0)} sentence(s).`)
  console.log(`${notes} further mention(s) read as history, comparison or substitution.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
