/**
 * Sweep Field Manual ingredient pages for allergens the page does not mention.
 *
 * WHY THIS EXISTS. The August 2026 reference pass rewrote all 297 ingredient
 * pages and, in passing, turned up three allergens nobody had written down:
 * celery seed in celery salt and celery bitters, both of which reach a drink
 * where nobody thinks to ask — a rim and a dash — and barley malt in three
 * mixers. A mixer is exactly the thing a coeliac guest waves through.
 *
 * Those were found by accident, one page at a time, which is not a method. This
 * is the method.
 *
 * WHAT THIS IS NOT. These are editorial pages, not product labels, and nothing
 * here is a regulatory declaration: we do not make celery salt and cannot speak
 * for a jar on somebody's shelf. The test applied is narrower and is the one a
 * reader actually needs — if a drink built from this page could carry an
 * allergen the page never mentions, the page is incomplete.
 *
 * THE TWO TIERS, AND WHY THE SPLIT MATTERS. Every wine on the shelf carries
 * sulphites and every wine label says so. Repeating it across twenty-five wine,
 * sherry and vermouth pages would be padding, and padding is the thing the
 * voice rules exist to prevent. So the register separates:
 *
 *   SURPRISING  The allergen cannot be guessed from the page's name or its
 *               category. Orgeat is almond. Worcestershire sauce is anchovy.
 *               These have to be on the page. Reported by default.
 *   EXPECTED    The allergen follows from what the ingredient plainly is. Egg
 *               white contains egg; sherry contains sulphites. Tracked so the
 *               register is complete and the coverage check below can work.
 *               Hidden unless --all.
 *
 * WHAT THE CHECK CAN SEE. Whether the page names the substance, and nothing
 * beyond that. It cannot tell a warning from an aside, so a page can pass this
 * while burying almonds in a paragraph about etymology. Treat a pass as "there
 * is something to read here", not as "this page handles it well".
 *
 * The register is hand-written and every entry carries its basis, because no
 * query can tell you what is in a bottle. Entries are keyed on the page name;
 * an entry naming a page that no longer exists is reported and fails the run,
 * so the register cannot rot into a list of assurances about pages nobody has.
 *
 * COVERAGE. A register of hand-written entries silently misses pages added
 * after it was written, which is the failure mode that matters most here: the
 * next wine page nobody enters is invisible to a check that only looks at what
 * it already knows. So --coverage reports any page whose name matches a class
 * known to carry an allergen and that has no register entry at all.
 *
 * Run: npx sanity exec scripts/audit-allergens.ts --with-user-token
 *      ...add --all to include the expected tier.
 *      ...add --coverage to list allergen-carrying classes with no entry.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const ALL = process.argv.includes('--all')
const COVERAGE = process.argv.includes('--coverage')

/** The 14 allergens declarable in the UK, as far as they reach a cocktail. */
type Allergen = 'celery' | 'cereals containing gluten' | 'eggs' | 'fish' | 'milk' | 'nuts' | 'soybeans' | 'sulphites'

interface Base {
  /** Page name, exactly as it appears in Sanity. */
  page: string
  allergen: Allergen
  /** Why it is there. The evidence, not the conclusion. */
  basis: string
}

/**
 * `declaredBy` is required on a surprising entry and optional on an expected
 * one, because the loose version of this check quietly passes.
 *
 * Matching the bare allergen name looked adequate and is not: the Worcestershire
 * sauce entry for fish passed on the word "fish" appearing in a sentence about
 * fermentation. It happened to be a true pass — the page carries a section
 * headed "Anchovies, and the Label" — but it passed without ever looking at it.
 * Naming the substance the page would have to use is the whole check.
 */
type Entry =
  | (Base & { surprising: true; declaredBy: RegExp })
  | (Base & { surprising: false; declaredBy?: RegExp })

const REGISTER: Entry[] = [
  // --- Surprising. These are the point of the sweep. ---
  {
    page: 'Celery Salt',
    allergen: 'celery',
    basis: 'Ground celery seed blended with salt. Celery is one of the 14, and this reaches the drink as a rim nobody is offered the chance to refuse.',
    surprising: true,
    declaredBy: /celery/i,
  },
  {
    page: 'Celery Bitters',
    allergen: 'celery',
    basis: 'Celery seed is the defining botanical. A dash is small, and the 14 have no threshold below which they stop counting.',
    surprising: true,
    declaredBy: /celery/i,
  },
  {
    page: 'Orgeat Syrup',
    allergen: 'nuts',
    basis: 'Almond syrup. The name says nothing about almonds in any language the reader speaks, and it is in every Mai Tai.',
    surprising: true,
    declaredBy: /almond/i,
  },
  {
    page: 'Frangelico',
    allergen: 'nuts',
    basis: 'Hazelnut liqueur.',
    surprising: true,
    declaredBy: /hazelnut/i,
  },
  {
    page: 'Amaretto',
    allergen: 'nuts',
    basis: 'Traditional amaretto is apricot kernel, which is stone fruit rather than tree nut, but some producers use almonds and some use both. The name settles nothing, so the page has to say so.',
    surprising: true,
    declaredBy: /almond/i,
  },
  {
    page: 'Worcestershire Sauce',
    allergen: 'fish',
    basis: 'Anchovies. Not an allergen anyone expects in a sauce, and it is also the reason a Bloody Mary made with it is not vegetarian.',
    surprising: true,
    declaredBy: /anchov/i,
  },
  {
    page: 'Worcestershire Sauce',
    allergen: 'cereals containing gluten',
    basis: 'Malt vinegar, from barley.',
    surprising: true,
    declaredBy: /barley|malt vinegar|gluten/i,
  },
  {
    page: 'Advocaat',
    allergen: 'eggs',
    basis: 'Egg yolk liqueur. Plain once known and not guessable from the name.',
    surprising: true,
    declaredBy: /egg/i,
  },
  {
    page: 'Franklin & Sons Brewed Ginger Beer',
    allergen: 'cereals containing gluten',
    basis: 'Fermented malted barley extract, plus barley malt and hops. Verified against the maker’s published ingredients, August 2026.',
    surprising: true,
    declaredBy: /barley|malt|gluten/i,
  },
  {
    page: 'Franklin & Sons 1886 Original Cola',
    allergen: 'cereals containing gluten',
    basis: 'Barley malt extract; the maker declares gluten. Verified August 2026.',
    surprising: true,
    declaredBy: /barley|malt|gluten/i,
  },
  {
    page: 'Fever-Tree Madagascan Cola',
    allergen: 'cereals containing gluten',
    basis: 'Roasted barley malt extract gives the colour in place of caramel. Verified August 2026.',
    surprising: true,
    declaredBy: /barley|malt|gluten/i,
  },
  {
    page: 'Irish Stout',
    allergen: 'cereals containing gluten',
    basis: 'Malted and roasted barley.',
    surprising: true,
    declaredBy: /barley|malt|gluten/i,
  },
  {
    page: 'Mexican Lager',
    allergen: 'cereals containing gluten',
    basis: 'Malted barley, commonly with maize alongside it.',
    surprising: true,
    declaredBy: /barley|malt|gluten/i,
  },

  // --- Expected. Tracked for completeness; the page need not spell it out. ---
  { page: 'Egg', allergen: 'eggs', basis: 'It is an egg.', surprising: false },
  { page: 'Egg White', allergen: 'eggs', basis: 'It is an egg.', surprising: false },
  { page: 'Egg Yolk', allergen: 'eggs', basis: 'It is an egg.', surprising: false },
  { page: 'Cream', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Whole Milk', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Evaporated Milk', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Sweetened Condensed Milk', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Butter', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Vanilla Ice Cream', allergen: 'milk', basis: 'Dairy.', surprising: false },
  { page: 'Irish Cream', allergen: 'milk', basis: 'Dairy cream is the body of it.', surprising: false },
  { page: 'Champagne', allergen: 'sulphites', basis: 'Wine.', surprising: false },
  { page: 'Prosecco', allergen: 'sulphites', basis: 'Wine.', surprising: false },
  { page: 'Red Wine', allergen: 'sulphites', basis: 'Wine.', surprising: false },
  { page: 'Dry White Wine', allergen: 'sulphites', basis: 'Wine.', surprising: false },
  { page: 'Port', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Madeira', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Amontillado Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Fino Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Manzanilla Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Oloroso Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Palo Cortado', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Pedro Ximénez Sherry', allergen: 'sulphites', basis: 'Fortified wine.', surprising: false },
  { page: 'Dry Vermouth', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Sweet Vermouth', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Vermouth', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Lillet', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Kina Lillet', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Cocchi Americano', allergen: 'sulphites', basis: 'Aromatised wine.', surprising: false },
  { page: 'Green Ginger Wine', allergen: 'sulphites', basis: 'Wine.', surprising: false },
  { page: 'Dry Cider', allergen: 'sulphites', basis: 'Cider is routinely sulphited.', surprising: false },
]

/**
 * Name patterns for classes that carry an allergen as a matter of course.
 *
 * Used only by --coverage, to catch a page added after the register was
 * written. A match is a prompt to check the page, not a finding.
 */
const CLASSES: Array<{ label: string; re: RegExp }> = [
  { label: 'wine or fortified wine (sulphites)', re: /\bwine\b|sherry|vermouth|champagne|prosecco|\bport\b|madeira|lillet|cocchi/i },
  { label: 'beer or cider (gluten, sulphites)', re: /\bbeer\b|\blager\b|\bstout\b|\bale\b|\bcider\b/i },
  { label: 'dairy (milk)', re: /\bmilk\b|\bcream\b|\bbutter\b|ice cream/i },
  { label: 'egg (eggs)', re: /\begg\b/i },
  { label: 'nut (nuts)', re: /almond|hazelnut|walnut|pecan|pistachio|cashew|macadamia|orgeat|amaretto|noyaux/i },
]

interface Block { _type?: string; children?: Array<{ text?: string }> }
interface Doc {
  name: string
  slug: string
  description?: string
  usage?: string
  storage?: string
  topTips?: string[]
  longDescription?: Block[]
  faqs?: Array<{ question?: string; answer?: string }>
}

const blockText = (b?: Block[]) =>
  (b ?? []).filter((x) => x._type === 'block').map((x) => (x.children ?? []).map((c) => c.text ?? '').join('')).join(' ')

const prose = (d: Doc) =>
  [
    d.description ?? '',
    d.usage ?? '',
    d.storage ?? '',
    ...(d.topTips ?? []),
    blockText(d.longDescription),
    ...(d.faqs ?? []).flatMap((f) => [f.question ?? '', f.answer ?? '']),
  ].join('\n')

async function main() {
  const docs = await client.fetch<Doc[]>(`
    *[_type == "ingredient" && !(_id in path("drafts.**")) && defined(slug.current)]{
      name, "slug": slug.current, description, usage, storage, topTips,
      longDescription[]{ _type, children[]{ text } },
      faqs[]{ question, answer }
    } | order(name asc)
  `)
  const byName = new Map(docs.map((d) => [d.name, d]))

  const undeclared: Array<Entry & { slug: string }> = []
  const declared: Array<Entry & { slug: string }> = []
  const stale: Entry[] = []

  for (const e of REGISTER) {
    const doc = byName.get(e.page)
    if (!doc) {
      stale.push(e)
      continue
    }
    const text = prose(doc)
    const test = e.declaredBy ?? new RegExp(e.allergen.split(' ')[0], 'i')
    ;(test.test(text) ? declared : undeclared).push({ ...e, slug: doc.slug })
  }

  const show = (e: Entry & { slug: string }) => {
    console.log(`\n  ${e.page}  (${e.slug})`)
    console.log(`  [${e.allergen}]  ${e.basis}`)
  }

  console.log(`Checked ${REGISTER.length} register entries against ${docs.length} ingredient pages.\n`)

  const surprisingUndeclared = undeclared.filter((e) => e.surprising)
  console.log(`=== UNDECLARED, AND NOT GUESSABLE FROM THE PAGE (${surprisingUndeclared.length}) ===`)
  console.log('A drink built from this page can carry this allergen. The page never says so.')
  surprisingUndeclared.forEach(show)
  if (!surprisingUndeclared.length) console.log('\n  None.')

  const expectedUndeclared = undeclared.filter((e) => !e.surprising)
  console.log(`\n\n=== UNDECLARED, BUT PLAIN FROM WHAT THE INGREDIENT IS (${expectedUndeclared.length}) ===`)
  if (ALL) {
    console.log('Sherry contains sulphites; egg white contains egg. Saying so on every')
    console.log('page would be padding. Listed for completeness, not as a fix list.')
    expectedUndeclared.forEach(show)
  } else {
    console.log('Hidden. Pass --all to review them.')
  }

  if (ALL && declared.length) {
    console.log(`\n\n=== ALREADY DECLARED (${declared.length}) ===`)
    declared.forEach(show)
  }

  if (stale.length) {
    console.log(`\n  !! ${stale.length} register entr(y/ies) name a page that does not exist:`)
    for (const e of stale) console.log(`     ${e.page} [${e.allergen}]`)
    console.log('     Renamed or deleted. Update the register; do not leave it asserting.')
  }

  if (COVERAGE) {
    const entered = new Set(REGISTER.map((e) => e.page))
    const gaps = docs
      .filter((d) => !entered.has(d.name))
      .map((d) => ({ d, classes: CLASSES.filter((c) => c.re.test(d.name)).map((c) => c.label) }))
      .filter((r) => r.classes.length)

    console.log(`\n\n=== COVERAGE: ALLERGEN-CARRYING CLASS, NO REGISTER ENTRY (${gaps.length}) ===`)
    console.log('Matched on name alone, so expect false positives. Each is a page to look')
    console.log('at, not a finding. Add a register entry or satisfy yourself it needs none.')
    for (const { d, classes } of gaps) console.log(`\n  ${d.name}  (${d.slug})\n  ${classes.join('; ')}`)
    if (!gaps.length) console.log('\n  None.')
  }

  // A page that can send somebody to hospital and does not mention why is the
  // whole reason for this script. Stale entries fail too: an entry pointing at
  // a page that no longer exists is an assurance nobody checked.
  if (surprisingUndeclared.length || stale.length) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
